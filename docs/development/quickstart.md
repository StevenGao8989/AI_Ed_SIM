# ChatTutor AI 物理仿真平台 - 快速开始指南

## 🚀 快速开始

欢迎使用 ChatTutor AI 物理仿真平台！本指南将帮助你在几分钟内完成环境设置和项目运行。

## 📋 前置要求

### 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 2.30.0 或更高版本

### 硬件要求
- **内存**: 至少 8GB RAM（推荐 16GB+）
- **存储**: 至少 5GB 可用空间
- **网络**: 稳定的互联网连接（用于 AI API 调用）

## 🔧 环境设置

### 1. 克隆项目
```bash
# 克隆项目到本地
git clone <your-repo-url>
cd AI_Ed_SIM

# 验证项目结构
ls -la
```

### 2. 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖（如果需要）
cd ../services
npm install

# 返回项目根目录
cd ..
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp frontend/.env.example frontend/.env.local

# 编辑环境变量文件
# 在 macOS/Linux 上使用 nano 或 vim
nano frontend/.env.local

# 在 Windows 上使用记事本或其他编辑器
notepad frontend/.env.local
```

#### 必需的环境变量
```bash
# DeepSeek API 配置
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 可选配置
NEXT_PUBLIC_DEEPSEEK_MODEL=deepseek-r3
NEXT_PUBLIC_DEEPSEEK_TEMPERATURE=0.1
```

### 4. 获取 API 密钥

#### DeepSeek API 密钥
1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在控制台创建 API 密钥
4. 复制密钥到 `.env.local` 文件

#### Supabase 配置
1. 访问 [Supabase 官网](https://supabase.com/)
2. 创建新项目
3. 在项目设置中获取 URL 和 Anon Key
4. 复制到 `.env.local` 文件

## 🏃‍♂️ 运行项目

### 1. 启动前端应用
```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm run dev

# 或者使用 yarn
yarn dev
```

### 2. 访问应用
打开浏览器访问: http://localhost:3000

你应该能看到 ChatTutor 的首页界面。

### 3. 启动后端服务（可选）
```bash
# 进入后端目录
cd ../services

# 启动开发服务器
npm run dev
```

## 🧪 测试功能

### 1. 测试 AI 解析功能
```bash
# 进入前端库目录
cd frontend/lib

# 运行物理解析器测试
node test_physics_parser.js
```

### 2. 测试核心链路
```bash
# 进入测试目录
cd ../../services/testing/TestAIParsed

# 运行核心链路测试
node test_chain_simple.js
```

### 3. 测试用户认证
1. 在浏览器中访问 http://localhost:3000
2. 点击右上角的"注册"按钮
3. 完成注册流程
4. 测试登录功能

## 📱 使用平台

### 1. 基本功能
- **首页**: 查看平台介绍和功能
- **AI 聊天**: 输入物理题目，获得 AI 解析
- **用户中心**: 管理个人信息和设置

### 2. AI 增强解析
1. 进入 AI 聊天页面
2. 输入物理题目，例如：
   ```
   一物体从高度 h=100m 自由下落，求落地时间t和落地速度v。
   ```
3. 系统会自动调用 AI 进行解析
4. 查看解析结果和参数识别

### 3. 自定义配置
- 在 `frontend/lib/aiConfig.ts` 中调整 AI 参数
- 在 `frontend/lib/physicsParser.ts` 中修改解析逻辑
- 在 `.env.local` 中调整环境配置

## 🔍 故障排除

### 常见问题

#### 1. 依赖安装失败
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

#### 2. 环境变量不生效
```bash
# 确认文件位置正确
ls -la frontend/.env.local

# 重启开发服务器
# 按 Ctrl+C 停止，然后重新运行 npm run dev
```

#### 3. AI API 调用失败
```bash
# 检查 API 密钥配置
echo $NEXT_PUBLIC_DEEPSEEK_API_KEY

# 测试 API 连接
cd frontend/lib
node test_physics_parser.js
```

#### 4. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者使用不同的端口
npm run dev -- -p 3001
```

### 获取帮助
1. **查看文档**: 阅读 `docs/` 目录中的相关文档
2. **运行测试**: 使用测试文件验证功能
3. **检查日志**: 查看控制台输出和错误信息
4. **社区支持**: 在项目 Issues 中提问

## 📚 下一步

### 1. 深入学习
- 阅读 [项目架构文档](../architecture/README.md)
- 了解 [核心链路流程](../architecture/core-pipeline.md)
- 学习 [AI 功能使用](../ai-parsing/README.md)

### 2. 开发功能
- 修改和扩展 AI 解析逻辑
- 添加新的物理仿真模块
- 优化用户界面和交互

### 3. 部署上线
- 配置生产环境
- 设置 CI/CD 流水线
- 监控和性能优化

## 🎯 快速验证清单

- [ ] 项目成功克隆到本地
- [ ] 依赖安装完成
- [ ] 环境变量配置正确
- [ ] 前端应用启动成功
- [ ] 能够访问首页
- [ ] AI 解析测试通过
- [ ] 用户注册/登录功能正常

## 📞 技术支持

如果你在使用过程中遇到问题：

1. **查看文档**: 首先查看相关文档
2. **运行测试**: 使用测试文件验证功能
3. **检查配置**: 确认环境变量和 API 密钥配置
4. **查看日志**: 检查控制台输出和错误信息
5. **提交 Issue**: 在项目仓库中提交问题报告

---

**文档版本**: 1.0.0  
**最后更新**: 2024年12月  
**维护者**: ChatTutor AI 开发团队
