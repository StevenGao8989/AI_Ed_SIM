import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { question, imageUrl, audioUrl, userId } = req.body

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
      payload: { question, imageUrl, audioUrl },
      result_status: 'processing'
    })

    // 调用 AI 服务（这里使用模拟响应，实际项目中替换为真实的 AI API）
    const aiResponse = await generateAIResponse(question, imageUrl, audioUrl)

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
        response: aiResponse,
        timestamp: new Date().toISOString()
      }
    })

    return res.status(200).json({
      success: true,
      response: aiResponse,
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
          result_status: 'fail'
        })
      }
    } catch (logError) {
      console.error('Error logging failure:', logError)
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'AI service temporarily unavailable'
    })
  }
}

// AI 响应生成函数（模拟实现）
async function generateAIResponse(question: string, imageUrl?: string, audioUrl?: string): Promise<string> {
  // 模拟 AI 处理延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  let response = ''

  if (imageUrl) {
    response += `我看到了您上传的图片。`
  }

  if (audioUrl) {
    response += `我听到了您的语音输入。`
  }

  if (question) {
    response += `关于您的问题"${question}"，让我为您详细解答：\n\n`
    
    // 根据问题内容生成不同的回答
    if (question.includes('物理') || question.includes('力学') || question.includes('运动')) {
      response += `这是一个物理问题。我将为您生成相应的动画模型来演示相关概念。\n\n`
      response += `根据物理定律，我可以帮您：\n`
      response += `• 分析运动轨迹\n`
      response += `• 计算相关参数\n`
      response += `• 生成可视化动画\n`
      response += `• 提供详细解释`
    } else if (question.includes('数学') || question.includes('函数') || question.includes('几何')) {
      response += `这是一个数学问题。我将为您创建相应的数学模型和可视化。\n\n`
      response += `我可以帮您：\n`
      response += `• 绘制函数图像\n`
      response += `• 分析几何关系\n`
      response += `• 计算数值结果\n`
      response += `• 生成动态演示`
    } else if (question.includes('化学') || question.includes('反应') || question.includes('分子')) {
      response += `这是一个化学问题。我将为您生成分子结构和反应过程的动画。\n\n`
      response += `我可以帮您：\n`
      response += `• 展示分子结构\n`
      response += `• 模拟化学反应\n`
      response += `• 解释反应机理\n`
      response += `• 生成动态模型`
    } else if (question.includes('生物') || question.includes('细胞') || question.includes('器官')) {
      response += `这是一个生物问题。我将为您创建生物过程的动画演示。\n\n`
      response += `我可以帮您：\n`
      response += `• 展示细胞结构\n`
      response += `• 模拟生物过程\n`
      response += `• 解释生理机制\n`
      response += `• 生成动态图解`
    } else {
      response += `这是一个很有趣的问题！我将为您：\n`
      response += `• 分析问题要点\n`
      response += `• 生成相关模型\n`
      response += `• 提供详细解释\n`
      response += `• 创建可视化内容`
    }

    response += `\n\n正在为您生成个性化的动画模型和解释，请稍候...`
  }

  return response || '我理解您的问题，正在为您生成相应的动画模型和解释...'
}
