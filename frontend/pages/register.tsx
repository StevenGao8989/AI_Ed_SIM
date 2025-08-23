import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState<'form' | 'verification'>('form')
  const router = useRouter()

  // 验证密码强度
  const validatePassword = (password: string) => {
    const minLength = password.length >= 6
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    return { minLength, hasLetter, hasNumber }
  }

  // 验证用户名
  const validateUsername = (username: string) => {
    const minLength = username.length >= 2
    const maxLength = username.length <= 20
    const validChars = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)
    return { minLength, maxLength, validChars }
  }

  // 检查用户名是否唯一
  const checkUsernameUnique = async (username: string) => {
    try {
      // 查询 profiles 表检查用户名是否已存在
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (error && error.code === 'PGRST116') {
        // PGRST116 表示没有找到记录，用户名可用
        return { isUnique: true, error: null }
      } else if (error) {
        // 其他错误
        return { isUnique: false, error: error.message }
      } else if (data) {
        // 找到记录，用户名已存在
        return { isUnique: false, error: '用户名已注册，请更换用户名' }
      }
      
      return { isUnique: true, error: null }
    } catch (error) {
      return { isUnique: false, error: '检查用户名时出错' }
    }
  }

  // 检查邮箱是否唯一
  const checkEmailUnique = async (email: string) => {
    try {
      // 查询 profiles 表检查邮箱是否已存在
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

      if (error && error.code === 'PGRST116') {
        // PGRST116 表示没有找到记录，邮箱可用
        return { isUnique: true, error: null }
      } else if (error) {
        // 其他错误
        return { isUnique: false, error: error.message }
      } else if (data) {
        // 找到记录，邮箱已存在
        return { isUnique: false, error: '邮箱已注册，请更换邮箱地址' }
      }
      
      return { isUnique: true, error: null }
    } catch (error) {
      return { isUnique: false, error: '检查邮箱时出错' }
    }
  }

  // 发送验证码
  const sendVerificationCode = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有必填字段')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.minLength) {
      setError('用户名至少需要2个字符')
      return
    }
    if (!usernameValidation.maxLength) {
      setError('用户名不能超过20个字符')
      return
    }
    if (!usernameValidation.validChars) {
      setError('用户名只能包含字母、数字、下划线和中文')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.minLength) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 先检查用户名唯一性
      const { isUnique: usernameUnique, error: usernameError } = await checkUsernameUnique(username)
      
      if (!usernameUnique) {
        setError(usernameError || '用户名已注册，请更换用户名')
        setLoading(false)
        return
      }

      // 再检查邮箱唯一性
      const { isUnique: emailUnique, error: emailError } = await checkEmailUnique(email)
      
      if (!emailUnique) {
        setError(emailError || '邮箱已注册，请更换邮箱地址')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { 
            password,
            username,
            full_name: username  // 同时设置 full_name，这样 Supabase 就会显示 Display name
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('验证码已发送到您的邮箱，请查收')
        setStep('verification')
      }
    } catch (error) {
      setError('发送验证码失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 验证邮箱验证码
  const verifyEmail = async () => {
    if (!verificationCode) {
      setError('请输入验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      })

      if (error) {
        setError('验证码错误，请重新输入')
      } else {
        if (data.user) {
          // 设置用户密码
          const { error: updateError } = await supabase.auth.updateUser({
            password: password
          })
          
          if (updateError) {
            setError('密码设置失败：' + updateError.message)
            return
          }

          // 注册成功后，自动登录用户
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (signInError) {
            setError('自动登录失败：' + signInError.message)
            return
          }

                            // 自动登录成功，跳转到主界面
                  setSuccess('注册成功！正在自动登录并跳转到主界面...')
                  setTimeout(() => {
                    router.push('/homepage')
                  }, 1500)
        }
      }
    } catch (error) {
      setError('验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 重新发送验证码
  const resendCode = async () => {
    setLoading(true)
    setError('')

    try {
      // 重新发送前再次检查用户名和邮箱唯一性
      const { isUnique: usernameUnique, error: usernameError } = await checkUsernameUnique(username)
      
      if (!usernameUnique) {
        setError(usernameError || '用户名已注册，请更换用户名')
        setLoading(false)
        return
      }

      const { isUnique: emailUnique, error: emailError } = await checkEmailUnique(email)
      
      if (!emailUnique) {
        setError(emailError || '邮箱已注册，请更换邮箱地址')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { 
            password,
            username,
            full_name: username  // 同时设置 full_name
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('验证码已重新发送')
      }
    } catch (error) {
      setError('重新发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 返回表单步骤
  const goBackToForm = () => {
    setStep('form')
    setVerificationCode('')
    setError('')
    setSuccess('')
  }

  return (
    <>
      <Head>
        <title>注册 - ChatTutor</title>
        <meta name="description" content="用户注册页面" />
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
              {step === 'form' ? '创建新账户' : '验证邮箱'}
            </h2>
            <p className="text-gray-600">
              {step === 'form' ? (
                <>
                  或者{' '}
                  <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    已有账户？立即登录
                  </Link>
                </>
              ) : (
                <>
                  验证码已发送到 <span className="font-medium text-indigo-600">{email}</span>
                </>
              )}
            </p>
          </div>

          {/* 注册表单 */}
          <div className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-white/20">
            {step === 'form' ? (
              // 第一步：填写注册信息
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); sendVerificationCode(); }}>
                {/* 用户名输入 */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
                    用户名 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7zm0 0a7 7 0 01-7-7m7 7a7 7 0 007 7" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="请输入用户名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* 邮箱输入 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                    邮箱地址 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="请输入邮箱地址"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* 密码输入 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
                    密码 <span className="text-red-500">*</span>
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
                      autoComplete="new-password"
                      required
                      className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {/* 密码强度提示 */}
                  <div className="mt-2">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className={`flex items-center ${password.length >= 6 ? 'text-green-500' : ''}`}>
                        <svg className={`w-4 h-4 mr-1 ${password.length >= 6 ? 'text-green-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        至少6个字符
                      </span>
                      <span className={`flex items-center ${/[a-zA-Z]/.test(password) ? 'text-green-500' : ''}`}>
                        <svg className={`w-4 h-4 mr-1 ${/[a-zA-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        包含字母
                      </span>
                      <span className={`flex items-center ${/\d/.test(password) ? 'text-green-500' : ''}`}>
                        <svg className={`w-4 h-4 mr-1 ${/\d/.test(password) ? 'text-green-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        包含数字
                      </span>
                    </div>
                  </div>
                </div>

                {/* 确认密码输入 */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-3">
                    确认密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`block w-full pl-12 pr-4 py-4 border rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                        confirmPassword && password !== confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      两次输入的密码不一致
                    </p>
                  )}
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

                {/* 发送验证码按钮 */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !username || !email || !password || !confirmPassword || password !== confirmPassword}
                    className="group w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>发送中...</span>
                      </div>
                    ) : (
                      <span className="flex items-center space-x-3">
                        <span>发送验证码</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // 第二步：验证邮箱验证码
              <div className="space-y-6">
                {/* 验证码输入 */}
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-3">
                    验证码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required
                      className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="请输入6位验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* 成功提示 */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-600">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* 验证按钮 */}
                <div className="space-y-4">
                  <button
                    onClick={verifyEmail}
                    disabled={loading || !verificationCode}
                    className="w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>验证中...</span>
                      </div>
                    ) : (
                      <span>验证并完成注册</span>
                    )}
                  </button>

                  {/* 重新发送验证码 */}
                  <button
                    onClick={resendCode}
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-6 border border-gray-200 rounded-2xl shadow-lg text-base font-medium text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? '发送中...' : '重新发送验证码'}
                  </button>

                  {/* 返回修改 */}
                  <button
                    onClick={goBackToForm}
                    className="w-full flex justify-center py-3 px-6 border border-gray-200 rounded-2xl shadow-lg text-base font-medium text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300"
                  >
                    返回修改信息
                  </button>
                </div>
              </div>
            )}

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
