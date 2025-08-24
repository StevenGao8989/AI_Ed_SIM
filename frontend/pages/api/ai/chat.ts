import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { aiClient } from '@/lib/aiClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { question, imageUrl, audioUrl, userId, provider = 'deepseek' } = req.body

    // 验证用户身份
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 验证输入
    if (!question && !imageUrl && !audioUrl) {
      return res.status(400).json({ error: 'No input provided' })
    }

    // 记录使用日志
    await supabase.from('usage_log').insert({
      user_id: userId,
      endpoint: '/api/ai/chat',
      payload: { question, imageUrl, audioUrl, provider },
      result_status: 'processing'
    })

    // 设置 AI 提供商
    aiClient.setProvider(provider as any)

    // 调用真实的 AI 服务
    const aiResponse = await aiClient.chat({
      question: question || '',
      imageUrl,
      audioUrl,
      userId,
      provider: provider as any
    })

    if (!aiResponse.success) {
      throw new Error('AI service returned error')
    }

    // 更新使用日志
    await supabase.from('usage_log').update({
      result_status: 'success'
    }).eq('user_id', userId).eq('endpoint', '/api/ai/chat').gte('created_at', new Date(Date.now() - 1000).toISOString())

    // 保存对话记录到数据库
    await supabase.from('dsl_records').insert({
      user_id: userId,
      dsl_json: {
        question,
        imageUrl,
        audioUrl,
        response: aiResponse.response,
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: new Date().toISOString()
      }
    })

    return res.status(200).json({
      success: true,
      response: aiResponse.response,
      provider: aiResponse.provider,
      model: aiResponse.model,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    // 记录错误日志
    try {
      const { userId } = req.body
      if (userId) {
        await supabase.from('usage_log').insert({
          user_id: userId,
          endpoint: '/api/ai/chat',
          payload: req.body,
          result_status: 'fail',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch (logError) {
      console.error('Error logging failure:', logError)
    }

    // 根据错误类型返回不同的错误信息
    let errorMessage = '抱歉,AI 服务暂时不可用,请稍后再试。如果问题持续存在,请联系客服。'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('API key not configured')) {
        errorMessage = 'AI 服务配置错误，请联系管理员检查 API 密钥配置。'
        statusCode = 500
      } else if (error.message.includes('API error')) {
        errorMessage = 'AI 服务调用失败，可能是网络问题或服务暂时不可用。'
        statusCode = 503
      } else if (error.message.includes('timeout')) {
        errorMessage = 'AI 服务响应超时，请稍后重试。'
        statusCode = 408
      }
    }

    return res.status(statusCode).json({ 
      error: 'AI service error',
      message: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
