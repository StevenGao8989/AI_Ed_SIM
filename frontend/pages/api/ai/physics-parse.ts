import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

// 导入PhysicsAIParserAICaller
import { PhysicsAIParserAICaller } from '../../../../services/ai_parsing/PhysicsAIParserAICaller'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { question, userId, options = {} } = req.body

    // 验证用户身份
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 验证输入
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'No question provided' })
    }

    // 记录使用日志
    await supabase.from('usage_log').insert({
      user_id: userId,
      endpoint: '/api/ai/physics-parse',
      payload: { question, options },
      result_status: 'processing'
    })

    // 创建PhysicsAIParserAICaller实例
    const physicsParser = new PhysicsAIParserAICaller({
      enableLogging: process.env.NODE_ENV === 'development'
    })

    // 解析物理题目
    const parsedResult = await physicsParser.parseQuestion(question.trim(), options)

    // 更新使用日志
    await supabase.from('usage_log').update({
      result_status: 'success'
    }).eq('user_id', userId).eq('endpoint', '/api/ai/physics-parse').gte('created_at', new Date(Date.now() - 1000).toISOString())

    // 保存解析结果到数据库
    await supabase.from('dsl_records').insert({
      user_id: userId,
      dsl_json: {
        original_question: question,
        parsed_result: parsedResult,
        parser_type: 'PhysicsAIParserAICaller',
        timestamp: new Date().toISOString()
      }
    })

    return res.status(200).json({
      success: true,
      data: parsedResult,
      message: '物理题目解析成功',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Physics Parse API Error:', error)
    
    // 记录错误日志
    try {
      const { userId } = req.body
      if (userId) {
        await supabase.from('usage_log').insert({
          user_id: userId,
          endpoint: '/api/ai/physics-parse',
          payload: req.body,
          result_status: 'fail',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch (logError) {
      console.error('Error logging failure:', logError)
    }

    // 根据错误类型返回不同的错误信息
    let errorMessage = '抱歉，物理题目解析服务暂时不可用，请稍后再试。'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('API key not configured')) {
        errorMessage = 'AI 服务配置错误，请联系管理员检查 API 密钥配置。'
        statusCode = 500
      } else if (error.message.includes('DeepSeek API error')) {
        errorMessage = `DeepSeek API 调用失败：${error.message}`
        statusCode = 500
      } else if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接。'
        statusCode = 503
      } else {
        errorMessage = `解析服务错误：${error.message}`
        statusCode = 500
      }
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}

