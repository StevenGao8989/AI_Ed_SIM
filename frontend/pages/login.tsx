import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 检查输入是邮箱还是用户名
  const isEmail = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(input)
  }

  // 通过用户名查找邮箱
  const findEmailByUsername = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single()

      if (error || !data) {
        return null
      }
      return data.email
    } catch (error) {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let email = usernameOrEmail

      // 如果输入的是用户名，先查找对应的邮箱
      if (!isEmail(usernameOrEmail)) {
        const foundEmail = await findEmailByUsername(usernameOrEmail)
        if (!foundEmail) {
          setError('用户名不存在')
          setLoading(false)
          return
        }
        email = foundEmail
      }

      // 使用邮箱和密码登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else {
        // 登录成功，跳转到主界面
        router.push('/homepage')
      }
    } catch (error) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>登录 - ChatTutor</title>
        <meta name="description" content="用户登录页面" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        {/* 主要内容 */}
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              欢迎回来
            </h2>
            <p className="text-gray-600">
              或者{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                没有账户？立即注册
              </Link>
            </p>
          </div>

          {/* 登录表单 */}
          <div className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 邮箱输入 */}
              <div>
                <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-3">
                  用户名或邮箱
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7zm0 0a7 7 0 01-7-7m7 7a7 7 0 007 7" />
                    </svg>
                  </div>
                  <input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    autoComplete="username"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="请输入用户名或邮箱"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 登录按钮 */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>登录中...</span>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-3">
                      <span>登录账户</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* 分割线和返回首页 */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-500">或者</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/homepage">
                  <button className="w-full flex justify-center items-center px-6 py-4 border border-gray-200 rounded-2xl shadow-lg text-base font-medium text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回首页
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 自定义动画样式 */}
        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </div>
    </>
  )
}
