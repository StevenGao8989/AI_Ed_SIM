import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { aiClient } from '@/lib/aiClient'
import { physicsClient } from '@/lib/physicsClient'
import { KaTeXRenderer } from '@/components/renderer'
import type { User } from '@supabase/supabase-js'

export default function AIChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', content: string, timestamp: Date}>>([])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [parseMode, setParseMode] = useState<'chat' | 'physics'>('chat')
  const [physicsParseResult, setPhysicsParseResult] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    // 设置 AI 提供商为 DeepSeek
    aiClient.setProvider('deepseek')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isGenerating) return

    // 添加用户问题到聊天历史
    const userMessage = {
      type: 'user' as const,
      content: question,
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, userMessage])
    
    setIsGenerating(true)
    setQuestion('')

    try {
      if (parseMode === 'physics') {
        // 物理题目解析模式
        const physicsResponse = await physicsClient.parsePhysicsQuestion(
          question.trim(),
          user?.id || '',
          {
            enableModuleDecomposition: true,
            enableModuleComposition: true,
            enableAdvancedAnalysis: true,
            enableFormulaExtraction: true,
            enableUnitOptimization: true
          }
        )
        
        if (physicsResponse.success && physicsResponse.data) {
          setPhysicsParseResult(physicsResponse.data)
          
          // 格式化解析结果
          const formattedResult = physicsClient.formatParsedResult(physicsResponse.data)
          
          const aiMessage = {
            type: 'ai' as const,
            content: formattedResult,
            timestamp: new Date()
          }
          setChatHistory(prev => [...prev, aiMessage])
        } else {
          throw new Error(physicsResponse.error || 'Physics parse error')
        }
      } else {
        // 普通聊天模式
        const aiResponse = await aiClient.chat({
          question: question.trim(),
          imageUrl: uploadedImage || undefined,
          audioUrl: audioUrl || undefined,
          userId: user?.id || '',
          provider: 'deepseek'
        })
        
        if (aiResponse.success) {
          const aiMessage = {
            type: 'ai' as const,
            content: aiResponse.response,
            timestamp: new Date()
          }
          setChatHistory(prev => [...prev, aiMessage])
        } else {
          throw new Error('AI response error')
        }
      }
    } catch (error) {
      console.error('Error calling API:', error)
      
      // 显示详细的错误消息
      let errorMessage = '抱歉，服务暂时不可用，请稍后再试。如果问题持续存在，请联系客服。'
      
      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = '服务配置错误：API 密钥未配置，请联系管理员。'
        } else if (error.message.includes('DeepSeek API error')) {
          errorMessage = `DeepSeek API 调用失败：${error.message}`
        } else if (error.message.includes('fetch')) {
          errorMessage = '网络连接失败，请检查网络连接。'
        } else {
          errorMessage = `服务错误：${error.message}`
        }
      }
      
      const errorResponse = {
        type: 'ai' as const,
        content: errorMessage,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorResponse])
    } finally {
      setIsGenerating(false)
    }
  }

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理语音录制
  const handleVoiceRecord = () => {
    if (isRecording) {
      // 停止录制
      setIsRecording(false)
      // 这里应该停止录音并获取音频数据
      // 模拟获取音频 URL
      setAudioUrl('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    } else {
      // 开始录制
      setIsRecording(true)
      // 这里应该开始录音
      // 模拟录制过程
      setTimeout(() => {
        setIsRecording(false)
        setAudioUrl('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      }, 3000)
    }
  }

  // 播放语音
  const handlePlayAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  return (
    <>
      <Head>
        <title>AI 智能问答 - ChatTutor</title>
        <meta name="description" content="与 AI 对话，生成个性化动画模型" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 现代导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/homepage">
                <div className="flex items-center space-x-3 cursor-pointer">
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
              </Link>
            </div>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/ai-chat" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                我的动画模型
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                课程导航
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                问题反馈
              </Link>
            </div>

            {/* 模式切换 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setParseMode('chat')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    parseMode === 'chat'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💬 智能对话
                </button>
                <button
                  onClick={() => setParseMode('physics')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    parseMode === 'physics'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⚡ 物理解析
                </button>
              </div>
            </div>

            {/* 认证按钮 */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
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
      <main className="pt-20 min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* 背景装饰 */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI 智能问答
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              向 AI 描述你的问题，我们将为您生成个性化的动画模型和详细解释
            </p>
          </div>

                      {/* 聊天界面 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              {/* 聊天历史区域 */}
              <div className="h-[600px] overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3 leading-tight">开始你的 AI 对话</h3>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-md">描述你的问题，AI 将为你生成动画模型和解释</p>
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="text-sm">
                        {message.type === 'ai' 
                          ? <KaTeXRenderer>{message.content}</KaTeXRenderer>
                          : message.content
                        }
                      </div>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-indigo-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* 生成中状态 */}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span className="text-sm text-gray-600">AI 正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div className="border-t border-gray-200 p-6">
              {/* 模式提示 */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <div className={`px-2 py-1 rounded-md ${
                  parseMode === 'chat' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {parseMode === 'chat' ? '💬 智能对话模式' : '⚡ 物理题目解析模式'}
                </div>
                <span className="text-gray-400">|</span>
                <span>
                  {parseMode === 'chat' 
                    ? '与AI进行智能对话，获取个性化解答' 
                    : '输入物理题目，获得结构化解析结果'
                  }
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 主要输入栏 - 按照参考图设计 */}
                <div className="relative">
                  <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-300">
                    {/* 左侧加号图标 - 用于附件/图片上传 */}
                    <label className="cursor-pointer mr-3">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e)}
                        disabled={isGenerating}
                      />
                      <div className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </label>

                    {/* 中间输入框 */}
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={parseMode === 'chat' ? "Ask anything..." : "例如：一个物体以初速度10m/s匀加速运动，加速度2m/s²，求5秒后的位移和速度"}
                      className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base"
                      disabled={isGenerating}
                    />

                    {/* 右侧功能按钮 */}
                    <div className="flex items-center space-x-3 ml-3">
                      {/* 麦克风图标 - 语音录制 */}
                      <button
                        type="button"
                        onClick={handleVoiceRecord}
                        disabled={isGenerating}
                        className={`w-6 h-6 flex items-center justify-center transition-colors ${
                          isRecording 
                            ? 'text-red-500 animate-pulse' 
                            : 'text-gray-600 hover:text-indigo-600'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>

                      {/* 音频可视化图标 - 显示录音状态或播放控制 */}
                      {isRecording ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <div className="flex items-end space-x-1">
                            <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{height: '12px'}}></div>
                            <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{height: '16px', animationDelay: '0.1s'}}></div>
                            <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{height: '20px', animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      ) : audioUrl ? (
                        <button
                          type="button"
                          onClick={handlePlayAudio}
                          className="w-6 h-6 flex items-center justify-center text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>



                {/* 已上传的图片预览 */}
                {uploadedImage && (
                  <div className="relative inline-block">
                    <img
                      src={uploadedImage}
                      alt="上传的图片"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>


        </div>
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
