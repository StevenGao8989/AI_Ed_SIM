# ChatTutor - AI驱动的教育动画平台

一个基于AI的智能教育平台，通过自然语言生成动态动画模型，帮助学生理解复杂概念。

## 🏗️ 架构逻辑链路

```
AIParsing → DSL → Schema → Validator → Simulator → EngineBridge → Renderer → ExplanationView
```

### 核心流程
1. **AIParsing**: AI解析用户问题，生成DSL
2. **DSL**: 领域特定语言定义
3. **Schema**: DSL数据结构验证
4. **Validator**: 学科逻辑验证（如物理公式）
5. **Simulator**: 仿真计算引擎
6. **EngineBridge**: 物理引擎桥接层
7. **Renderer**: 3D动画渲染
8. **ExplanationView**: 解释展示界面

## 🚀 技术栈

- **前端**: Next.js + TailwindCSS + Three.js
- **后端**: Supabase (Auth + PostgreSQL + Storage + Edge Functions)
- **AI**: OpenAI API / DeepSeek / LangChain
- **物理引擎**: Box2D / Matter.js
- **数据库**: PostgreSQL (通过Supabase)

## 📁 项目结构

```
chat-tutor/
├── db/                    # 数据库 schema
├── docker/                # Docker 配置
├── frontend/              # Next.js 前端
├── services/              # 业务逻辑模块
├── supabase/              # Supabase 配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+
- Supabase CLI
- Docker & Docker Compose

### 安装依赖
```bash
# 前端
cd frontend
npm install

# 后端服务
cd services
pip install -r requirements.txt
```

### 启动开发环境
```bash
# 启动 Supabase
cd supabase
supabase start

# 启动前端
cd frontend
npm run dev

# 启动 Docker 服务
cd docker
docker-compose up -d
```

## 🎯 核心功能

- **AI 题目解析**: 自然语言转DSL
- **智能仿真**: 物理/化学/数学/生物模型
- **3D 渲染**: Three.js 动画可视化
- **解释生成**: 文字+公式+图表
- **SaaS 多租户**: 用户管理与计费

## 📚 开发指南

详细开发文档请参考各模块的 README.md 文件。

## �� 许可证

MIT License
