import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    // 自动重定向到 homepage
    router.replace('/homepage')
  }, [router])

  return (
    <>
      <Head>
        <title>ChatTutor - 重定向中...</title>
        <meta name="description" content="正在跳转到主页面" />
      </Head>
      
      {/* 重定向加载页面 */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">正在跳转...</h1>
          <p className="text-gray-600">如果没有自动跳转，请 <button onClick={() => router.push('/homepage')} className="text-indigo-600 hover:text-indigo-800 underline">点击这里</button></p>
        </div>
      </div>
    </>
  )
}
