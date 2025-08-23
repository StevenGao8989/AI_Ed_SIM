import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // 测试数据库连接
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(5)

    if (plansError) {
      return res.status(500).json({ 
        message: 'Database connection failed', 
        error: plansError.message 
      })
    }

    // 测试 profiles 表
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, role')
      .limit(5)

    if (profilesError) {
      return res.status(500).json({ 
        message: 'Profiles table access failed', 
        error: profilesError.message 
      })
    }

    return res.status(200).json({
      message: 'Database connection successful',
      data: {
        plans: plansData,
        profiles: profilesData
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
