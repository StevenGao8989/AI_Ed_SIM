# ChatTutor - AI驱动的智能教育平台

<div align="center">

![ChatTutor Logo](https://img.shields.io/badge/ChatTutor-AI教育平台-blue?style=for-the-badge&logo=openai)
![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-数据库-green?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-样式-blue?style=for-the-badge&logo=tailwind-css)

**万物皆可问，知识一目了然**

一个基于AI的智能教育平台，通过自然语言生成动态动画模型，帮助学生理解复杂概念，帮助教师提升教学效果。

[🚀 快速开始](#-快速开始) • [📚 功能特性](#-功能特性) • [🏗️ 技术架构](#️-技术架构) • [📖 开发指南](#-开发指南)

</div>

## ✨ 功能特性

### 🎓 智能教育
- **AI 题目解析**: 自然语言转结构化数据
- **动态动画生成**: 物理、化学、数学、生物模型可视化
- **智能解释**: 文字+公式+图表的多媒体解释
- **个性化学习**: 根据学生水平调整难度

### 🎨 用户体验
- **现代化界面**: ChatGPT 风格的设计语言
- **响应式布局**: 支持桌面和移动设备
- **实时交互**: 流畅的动画和用户反馈
- **多语言支持**: 中文界面，国际化扩展

### 🔧 技术特性
- **多租户架构**: 支持学校、企业、个人用户
- **实时协作**: 基于 Supabase 的实时数据同步
- **AI 集成**: 支持 OpenAI、DeepSeek 等多种 AI 服务
- **扩展性强**: 模块化设计，易于功能扩展

## 🏗️ 技术架构

### 核心流程
```
用户输入 → AI解析 → DSL生成 → 逻辑验证 → 仿真计算 → 3D渲染 → 解释展示
```

### 技术栈
- **前端**: Next.js 13+ + React 18 + TypeScript + TailwindCSS
- **后端**: Supabase (Auth + PostgreSQL + Storage + Edge Functions)
- **AI 服务**: OpenAI API / DeepSeek API / LangChain
- **数据库**: PostgreSQL (通过 Supabase 管理)
- **渲染引擎**: Three.js (WebGL 3D 渲染)
- **状态管理**: React Hooks + Context API
- **样式系统**: TailwindCSS + CSS Modules

## 📁 项目结构

```
chat-tutor/
├── 📁 frontend/                 # Next.js 前端应用
│   ├── 📁 components/           # React 组件
│   │   ├── 📁 renderer/        # 渲染器组件 (KaTeX, 3D等)
│   │   └── 📁 ui/              # 通用 UI 组件
│   ├── 📁 pages/               # Next.js 页面
│   │   ├── 📁 api/             # API 路由
│   │   │   ├── 📁 ai/          # AI 服务接口
│   │   │   └── 📁 auth/        # 认证接口
│   │   ├── homepage.tsx        # 首页
│   │   ├── login.tsx           # 登录页
│   │   ├── register.tsx        # 注册页
│   │   ├── dashboard.tsx       # 用户中心
│   │   └── ai-chat.tsx         # AI 对话页
│   ├── 📁 lib/                 # 工具库
│   │   ├── supabaseClient.ts   # Supabase 客户端
│   │   └── aiClient.ts         # AI 服务客户端
│   ├── 📁 styles/              # 全局样式
│   └── 📁 types/               # TypeScript 类型定义
├── 📁 db/                      # 数据库 schema
│   ├── tenants.sql             # 租户表
│   ├── profiles.sql            # 用户扩展表
│   ├── subscriptions.sql       # 订阅表
│   ├── dsl_records.sql         # DSL 记录表
│   ├── explanations.sql        # 解释表
│   └── triggers.sql            # 数据库触发器
├── 📁 services/                # 业务逻辑模块
├── 📁 supabase/                # Supabase 配置
└── 📄 README.md                # 项目说明
```

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 最新版本
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+

### 1. 克隆项目
```bash
git clone https://github.com/你的用户名/chat-tutor.git
cd chat-tutor
```

### 2. 安装依赖
```bash
cd frontend
npm install
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量文件
nano .env.local
```

**必需的环境变量**:
```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥

# AI 服务配置 (选择其中一个)
NEXT_PUBLIC_OPENAI_API_KEY=你的OpenAI API密钥
NEXT_PUBLIC_DEEPSEEK_API_KEY=你的DeepSeek API密钥

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_AI_PROVIDER=openai  # 或 deepseek
```

### 4. 启动开发服务器
```bash
npm run dev
```

项目将在 [http://localhost:3000](http://localhost:3000) 启动

## 🎯 核心功能使用

### AI 对话
1. 访问 `/ai-chat` 页面
2. 输入你的问题（支持文本、图片、语音）
3. AI 将生成详细的解释和可视化内容

### 用户系统
- **注册**: 邮箱验证 + 密码确认
- **登录**: 支持用户名或邮箱登录
- **用户中心**: 查看个人信息和订阅状态

### 多租户支持
- **个人用户**: 基础功能，免费使用
- **学校用户**: 团队协作，批量管理
- **企业用户**: 高级功能，定制化服务

## 🔧 开发指南

### 项目结构说明
- **组件化开发**: 所有 UI 组件都在 `components/` 目录
- **页面路由**: 使用 Next.js 文件系统路由
- **API 接口**: 在 `pages/api/` 目录定义后端接口
- **样式系统**: 使用 TailwindCSS 进行样式开发

### 开发命令
```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 组件使用函数式组件 + Hooks
- 样式优先使用 TailwindCSS 类名

## 🚀 部署指南

### Vercel 部署 (推荐)
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署和更新

### 自托管部署
1. 构建项目: `npm run build`
2. 启动服务: `npm start`
3. 配置反向代理 (Nginx/Apache)

### Docker 部署
```bash
# 构建镜像
docker build -t chat-tutor .

# 运行容器
docker run -p 3000:3000 chat-tutor
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 项目
2. 创建功能分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送分支: `git push origin feature/AmazingFeature`
5. 创建 Pull Request

### 开发环境设置
1. 确保代码通过所有测试
2. 遵循项目的代码规范
3. 添加必要的文档和注释
4. 测试新功能在不同环境下的表现

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Three.js 文档](https://threejs.org/docs)

## 🐛 问题反馈

如果你遇到问题或有建议：

1. 查看 [Issues](https://github.com/你的用户名/chat-tutor/issues)
2. 创建新的 Issue 描述问题
3. 提供详细的错误信息和复现步骤

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目和服务：
- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端即服务
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [Three.js](https://threejs.org/) - 3D 图形库
- [OpenAI](https://openai.com/) - AI 服务
- [DeepSeek](https://deepseek.com/) - AI 服务

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️**

Made with ❤️ by [你的名字]

</div>
