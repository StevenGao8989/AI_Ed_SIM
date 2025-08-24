# ChatTutor AI 物理仿真平台 - 架构文档

## 📋 项目概述

ChatTutor 是一个基于 AI 的物理仿真教育平台，通过智能解析物理题目，自动生成动态动画模型，帮助学生理解复杂的物理概念。平台采用模块化架构，支持从题目解析到动画渲染的完整流程。

## 🏗️ 核心链路架构

```
题目文本/图片 → 解析与单位统一 → 生成 PhysicsDSL(YAML) → 解析为中间 IR(JSON) → 
用 PhysicsSchema(JSON Schema) 做结构校验 → 做物理一致性校验（量纲/约束/初值） → 
PhysicsSimulator 多模块联立仿真（事件检测）→ 渲染器(Canvas/WebGL/Three) 出动画 → 
结果自检（题意对齐/守恒量/不变量）→ 若不通过，最小更改 DSL 并回流重跑 → 导出与快照测试
```

## 📁 文件架构总览

```
AI_Ed_SIM/
├── frontend/                 # Next.js 前端应用
│   ├── components/          # React 组件
│   ├── pages/              # 页面路由
│   ├── types/              # TypeScript 类型定义
│   ├── lib/                # 工具库和客户端
│   └── styles/             # 样式文件
├── services/                # 核心业务逻辑服务
│   ├── ai_parsing/         # AI 题目解析
│   ├── dsl/                # DSL 定义和生成
│   ├── ir/                 # 中间表示层
│   ├── validation/         # 验证和校验
│   ├── simulation/         # 物理仿真引擎
│   ├── rendering/          # 渲染服务
│   ├── engine_bridge/      # 物理引擎桥接
│   ├── feedback/           # 反馈和优化
│   ├── export/             # 导出服务
│   └── testing/            # 测试和快照
├── db/                     # 数据库相关
├── supabase/               # Supabase 配置
└── docker/                 # Docker 配置
```

## 🔧 核心服务层详解

### 1. AI 解析层 (`services/ai_parsing/`)

#### **PhysicsAIParser.ts** - 核心解析器
- **作用**: 将自然语言物理题目转换为结构化数据
- **功能**:
  - 智能主题识别（初中/高中物理主题）
  - 参数提取（给定值、未知量、常量）
  - 单位标准化（中文/英文 → SI单位）
  - 语义理解（"求最大高度" → 未知量标记）
- **输出**: `ParsedQuestion` 对象
- **示例**: "一物体以初速度 v0=20 m/s 斜抛" → 识别为抛体运动，提取 v0=20, g=9.8

#### **unitConverter.ts** - 单位转换器
- **作用**: 处理各种物理单位的转换
- **功能**: 支持长度、时间、质量、温度等单位的标准化

### 2. DSL 层 (`services/dsl/`)

#### **PhysicsDslGenerator.ts** - DSL 生成器
- **作用**: 将解析结果转换为 PhysicsDSL (YAML 格式)
- **功能**:
  - 自动映射主题到系统类型
  - 生成仿真配置、约束条件、初始条件
  - 支持教育系统标签（学段、难度）
  - 智能参数约束和材料检测
- **输入**: `ParsedQuestion`
- **输出**: `PhysicsDSL`

#### **PhysicsParser.ts** - DSL 解析器
- **作用**: 解析 YAML 格式的 DSL 文件
- **功能**: 将 DSL 转换为内部数据结构

#### **PhysicsSchema.json** - DSL 模式定义
- **作用**: JSON Schema 验证 DSL 结构
- **功能**: 确保 DSL 数据的完整性和正确性

### 3. 中间表示层 (`services/ir/`)

#### **PhysicsIR.ts** - 物理中间表示
- **作用**: 定义仿真计算的数据结构
- **功能**: 提供统一的仿真接口

#### **IRConverter.ts** - IR 转换器
- **作用**: 在 DSL 和 IR 之间转换
- **功能**: 数据格式标准化

#### **IRValidator.ts** - IR 验证器
- **作用**: 验证中间表示的有效性
- **功能**: 结构校验和逻辑校验

### 4. 验证层 (`services/validation/`)

#### **PhysicsValidator.ts** - 物理验证器
- **作用**: 验证物理逻辑的一致性
- **功能**:
  - 量纲检查
  - 约束条件验证
  - 初始值合理性检查
  - 物理定律一致性验证

### 5. 仿真层 (`services/simulation/`)

#### **PhysicsSimulator.ts** - 核心仿真器
- **作用**: 执行物理仿真计算
- **功能**:
  - 多模块联立仿真
  - 时间步进计算
  - 状态更新和监控
  - 支持多种求解器（Euler、RK4、Verlet）

#### **EventDetector.ts** - 事件检测器
- **作用**: 检测仿真过程中的特殊事件
- **功能**: 碰撞检测、边界检测、阈值检测

#### **CollisionDetector.ts** - 碰撞检测器
- **作用**: 检测物体间的碰撞
- **功能**: 碰撞响应、反弹、吸收

#### **StateMonitor.ts** - 状态监控器
- **作用**: 监控仿真状态
- **功能**: 能量守恒、动量守恒检查

### 6. 渲染层 (`services/rendering/`)

#### **PhysicsRenderer.ts** - 物理渲染器
- **作用**: 将仿真结果转换为可视化数据
- **功能**: 轨迹绘制、动画生成、实时渲染

### 7. 引擎桥接层 (`services/engine_bridge/`)

#### **PhysicsEngineBridge.ts** - 物理引擎桥接
- **作用**: 连接不同的物理引擎
- **功能**: 支持 Box2D、Matter.js 等第三方引擎

### 8. 反馈优化层 (`services/feedback/`)

#### **DSLOptimizer.ts** - DSL 优化器
- **作用**: 根据仿真结果优化 DSL
- **功能**: 参数调整、约束优化

#### **SimulationValidator.ts** - 仿真验证器
- **作用**: 验证仿真结果的正确性
- **功能**: 题意对齐检查、守恒量验证

#### **PhysicsFeedback.ts** - 物理反馈
- **作用**: 提供物理层面的反馈
- **功能**: 错误诊断、改进建议

### 9. 导出层 (`services/export/`)

#### **PhysicsExporter.ts** - 物理数据导出器
- **作用**: 导出仿真数据
- **功能**: 支持多种格式（JSON、CSV、Excel）

#### **AnimationExporter.ts** - 动画导出器
- **作用**: 导出动画文件
- **功能**: 支持 GIF、MP4、WebM 等格式

### 10. 测试层 (`services/testing/`)

#### **SimulationSnapshot.ts** - 仿真快照
- **作用**: 保存仿真状态
- **功能**: 断点续传、状态回滚

## 🎨 前端层详解

### 1. 类型定义层 (`frontend/types/`)

#### **PhysicsTypes.ts** - 核心物理类型
- **作用**: 定义所有物理相关的类型
- **包含**:
  - 基础物理量 (`PhysicalQuantity`)
  - 向量和矩阵类型
  - 物理对象和系统
  - 常量和材料
  - 单位换算工具

#### **dsl.ts** - DSL 类型定义
- **作用**: 定义 DSL 相关的所有接口
- **包含**:
  - `PhysicsDSL` 主接口
  - 系统配置类型
  - 仿真参数类型
  - 输出配置类型

#### **simulation.ts** - 仿真类型
- **作用**: 定义仿真相关的类型
- **包含**: 仿真状态、事件、结果等

#### **rendering.ts** - 渲染类型
- **作用**: 定义渲染相关的类型
- **包含**: 渲染配置、动画参数等

### 2. 组件层 (`frontend/components/`)

#### **renderer/PhysicsRenderer.tsx** - 物理渲染组件
- **作用**: React 组件形式的渲染器
- **功能**: 集成 Three.js，实时渲染物理仿真

### 3. 页面层 (`frontend/pages/`)

#### **API 路由**:
- **`/api/dsl/PhysicsGenerate.ts`** - DSL 生成接口
- **`/api/engine_bridge/PhysicIndex.ts`** - 物理引擎接口
- **`/api/rendering/PhysicsAnimate.ts`** - 渲染接口

## 🔄 数据流架构

### 1. 正向流程
```
用户输入题目 → PhysicsAIParser → ParsedQuestion → PhysicsDslGenerator → PhysicsDSL → 
IRConverter → PhysicsIR → PhysicsValidator → PhysicsSimulator → 仿真结果 → 
PhysicsRenderer → 动画输出
```

### 2. 反馈优化流程
```
仿真结果 → SimulationValidator → 问题检测 → DSLOptimizer → 优化后的 DSL → 
重新仿真 → 结果验证
```

### 3. 类型安全保证
```
PhysicsTypes.ts (基础类型) → dsl.ts (DSL类型) → 各服务层 (业务逻辑) → 
前端组件 (用户界面)
```

## 🎯 核心特性

### 1. 智能解析
- **自然语言理解**: 支持中文/英文混合输入
- **主题识别**: 自动识别 20+ 物理主题
- **参数提取**: 智能提取数值、单位、未知量

### 2. 教育友好
- **学段支持**: 初中/高中物理全覆盖
- **难度评估**: 自动评估题目难度
- **主题分类**: 按知识点分类组织

### 3. 仿真能力
- **多物理场**: 力学、电磁学、热学等
- **事件检测**: 碰撞、边界、阈值事件
- **求解器**: 多种数值方法支持

### 4. 可视化渲染
- **实时渲染**: 基于 Three.js 的 3D 渲染
- **动画导出**: 支持多种格式导出
- **交互控制**: 相机控制、播放控制

## 🚀 技术栈

### 后端服务
- **语言**: TypeScript/Node.js
- **架构**: 模块化服务架构
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth

### 前端应用
- **框架**: Next.js + React
- **样式**: TailwindCSS
- **3D 渲染**: Three.js
- **类型**: TypeScript

### 物理引擎
- **仿真**: 自研物理仿真器
- **渲染**: Three.js + Canvas
- **导出**: 多种格式支持

## 📚 使用指南

### 1. 开发环境设置
```bash
# 克隆项目
git clone <repository-url>
cd AI_Ed_SIM

# 安装依赖
npm install

# 配置环境变量
cp frontend/env.example frontend/.env.local

# 启动开发服务器
cd frontend
npm run dev
```

### 2. 核心链路测试
```typescript
// 1. 解析题目
const question = "一物体以初速度 v0=20 m/s 斜抛，求最大高度h。";
const parsedQuestion = parseQuestion(question);

// 2. 生成 DSL
const dsl = physicsDSLGenerator.generateDSL(parsedQuestion);

// 3. 执行仿真
const simulator = new PhysicsSimulator();
const result = simulator.simulate(dsl);

// 4. 渲染动画
const renderer = new PhysicsRenderer();
renderer.render(result);
```

### 3. 扩展开发
- **新增物理主题**: 在 `TOPIC_RULES` 中添加规则
- **新增仿真类型**: 扩展 `PhysicsSystemType`
- **新增渲染效果**: 在 `PhysicsRenderer` 中添加方法

## 🔮 未来规划

### 1. 短期目标
- 完善仿真引擎的稳定性
- 优化渲染性能
- 增加更多物理主题支持

### 2. 中期目标
- 支持化学和生物仿真
- 添加机器学习优化
- 实现云端仿真服务

### 3. 长期目标
- 构建完整的教育生态系统
- 支持多语言国际化
- 实现跨平台部署

## 📞 技术支持

如有问题或建议，请通过以下方式联系：
- **GitHub Issues**: 提交 bug 报告和功能请求
- **文档**: 查看详细的 API 文档和使用指南
- **社区**: 参与开发者社区讨论

---

*本文档持续更新，请关注最新版本*
