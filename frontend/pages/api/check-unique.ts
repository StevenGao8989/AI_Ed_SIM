import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { username, email } = req.body

    if (!username && !email) {
      return res.status(400).json({ 
        message: 'Please provide username or email to check' 
      })
    }

    const result: any = {}

    // 检查用户名唯一性
    if (username) {
      const { data: usernameData, error: usernameError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (usernameError && usernameError.code === 'PGRST116') {
        result.username = { isUnique: true, message: '用户名可用' }
      } else if (usernameError) {
        result.username = { isUnique: false, message: '检查用户名时出错' }
      } else if (usernameData) {
        result.username = { isUnique: false, message: '用户名已注册，请更换用户名' }
      } else {
        result.username = { isUnique: true, message: '用户名可用' }
      }
    }

    // 检查邮箱唯一性
    if (email) {
      const { data: emailData, error: emailError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

      if (emailError && emailError.code === 'PGRST116') {
        result.email = { isUnique: true, message: '邮箱可用' }
      } else if (emailError) {
        result.email = { isUnique: false, message: '检查邮箱时出错' }
      } else if (emailData) {
        result.email = { isUnique: false, message: '邮箱已注册，请更换邮箱地址' }
      } else {
        result.email = { isUnique: true, message: '邮箱可用' }
      }
    }

    return res.status(200).json({
      message: 'Check completed',
      data: result
    })
  } catch (error) {
    console.error('Check unique API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
