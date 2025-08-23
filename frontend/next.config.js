/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除过时的 appDir 配置
  experimental: {
    // appDir: true  // Next.js 14 中已默认启用，无需配置
  },
  
  // 配置图片域名
  images: {
    domains: ['localhost'],
  },
  
  // 暴露环境变量
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig
