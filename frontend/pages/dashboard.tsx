import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  email: string
  tenant_id: string
  role: string
}

interface Tenant {
  id: string
  name: string
  type: string
}

interface Subscription {
  id: string
  plan_id: string
  credits: number
  status: string
  expires_at: string
}

interface Plan {
  id: string
  name: string
  price: number
  credits: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      await loadUserData(user.id)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // 加载用户profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // 加载租户信息
        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .single()
          
          if (tenantData) {
            setTenant(tenantData)
          }
        }

        // 加载订阅信息
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        if (subscriptionData) {
          setSubscription(subscriptionData)
          
          // 加载套餐信息
          const { data: planData } = await supabase
            .from('plans')
            .select('*')
            .eq('id', subscriptionData.plan_id)
            .single()
          
          if (planData) {
            setPlan(planData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>ChatTutor - 用户中心</title>
        <meta name="description" content="用户信息中心" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        {/* Header - ChatGPT 风格 */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/homepage" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ChatTutor
                  </h1>
                </Link>
                <span className="text-gray-400">|</span>
                <span className="text-lg font-medium text-gray-700">用户中心</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="font-medium">{user?.email}</span>
                  {tenant && (
                    <span className="ml-2 text-gray-500">({tenant.name})</span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 用户信息卡片 - ChatGPT 风格 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              用户信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 基本信息 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/50">
                <h3 className="text-sm font-medium text-blue-700 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  基本信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">用户名</p>
                    <p className="text-sm text-gray-900 font-medium">{profile?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">邮箱</p>
                    <p className="text-sm text-gray-900 font-medium">{profile?.email || user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">角色</p>
                    <p className="text-sm text-gray-900 font-medium">{profile?.role || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* 租户信息 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200/50">
                <h3 className="text-sm font-medium text-green-700 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  租户信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium">名称</p>
                    <p className="text-sm text-gray-900 font-medium">{tenant?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">类型</p>
                    <p className="text-sm text-gray-900 font-medium">{tenant?.type || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* 套餐信息 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200/50">
                <h3 className="text-sm font-medium text-purple-700 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  套餐信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-purple-600 font-medium">套餐</p>
                    <p className="text-sm text-gray-900 font-medium">{plan?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium">积分</p>
                    <p className="text-sm text-gray-900 font-medium">{subscription?.credits || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium">状态</p>
                    <p className="text-sm text-gray-900 font-medium">{subscription?.status || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能区域 - 待实现 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              功能区域
            </h2>
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">功能开发中</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                我们正在努力开发更多功能，包括AI解析、3D动画渲染、智能解释等。
                敬请期待！
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
