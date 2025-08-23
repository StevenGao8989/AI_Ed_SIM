import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push('/homepage')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  return (
    <>
      <Head>
        <title>ChatTutor - AI驱动的教育动画平台</title>
        <meta name="description" content="通过AI生成动态动画模型，帮助学生理解复杂概念" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 现代导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ChatTutor
              </h1>
            </div>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                我的动画模型
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                课程导航
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                问题反馈
              </Link>
            </div>

            {/* 认证按钮 */}
            <div className="flex items-center space-x-4">
              {loading ? (
                // 加载状态
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                // 已登录用户
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-gray-700 font-medium hidden md:block">
                      {user.email}
                    </span>
                  </div>
                  <Link href="/dashboard">
                    <button className="text-gray-700 hover:text-indigo-600 px-4 py-2 font-medium transition-colors">
                      控制台
                    </button>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 px-4 py-2 font-medium transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                // 未登录用户
                <>
                  <Link href="/login">
                    <button className="text-gray-700 hover:text-indigo-600 px-4 py-2 font-medium transition-colors">
                      登录
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      开始使用
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="pt-20">
        {/* Hero 区域 */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          
          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
            {/* 主标题 */}
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="block">万物皆可问</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                知识一目了然
              </span>
            </h1>
            
            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              通过 AI 自动生成初高中物理、数学、化学、生物题目的动态动画模型，
              <br className="hidden md:block" />
              帮助学生理解复杂概念，帮助教师教学
            </p>
            
            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {user ? (
                // 已登录用户 - 跳转到 AI 聊天页面
                <Link href="/ai-chat">
                  <button className="group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-10 py-5 rounded-3xl text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                    <span className="flex items-center space-x-3">
                      <span>立即开始</span>
                      <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </Link>
              ) : (
                // 未登录用户 - 跳转到登录页面
                <Link href="/login">
                  <button className="group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-10 py-5 rounded-3xl text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                    <span className="flex items-center space-x-3">
                      <span>立即登录</span>
                      <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </Link>
              )}
              <Link href="/demo">
                <button className="border-2 border-gray-300 hover:border-indigo-300 text-gray-700 hover:text-indigo-600 px-10 py-5 rounded-3xl text-xl font-semibold bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
                  查看演示
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* 特性展示 */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-20">
              为什么选择 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ChatTutor</span>？
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* AI 驱动 */}
              <div className="group text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI 驱动</h3>
                <p className="text-gray-600 text-lg leading-relaxed">先进的 AI 技术，自动生成精准的动画模型，让学习变得简单高效</p>
              </div>
              
              {/* 动态可视化 */}
              <div className="group text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">动态可视化</h3>
                <p className="text-gray-600 text-lg leading-relaxed">生动的动画效果，让抽象概念变得具体可感，提升学习体验</p>
              </div>
              
              {/* 多学科覆盖 */}
              <div className="group text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-pink-200 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-indigo-400 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">多学科覆盖</h3>
                <p className="text-gray-600 text-lg leading-relaxed">涵盖物理、化学、数学、生物等多个学科领域，满足不同学习需求</p>
              </div>
            </div>
          </div>
        </section>

        {/* 支持的模型类型 */}
        <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-20">
              支持的 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">模型类型</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* 物理模型 */}
              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">物理模型</h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">运动学、力学、电磁学等物理概念的可视化展示</p>
              </div>

              {/* 化学模型 */}
              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">化学模型</h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">反应过程、分子结构等化学现象的动态演示</p>
              </div>

              {/* 数学模型 */}
              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">数学模型</h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">函数、几何、微积分等数学概念的直观理解</p>
              </div>

              {/* 生物模型 */}
              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">生物模型</h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">细胞、器官、生态过程等生物系统的动态展示</p>
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </>
  )
}
