# Services层架构文档索引

## 📋 文档概览

本目录包含Services层的完整架构文档，帮助您快速理解和导航复杂的services层结构。

## 📚 文档列表

### 🚀 核心架构文档

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| **[services-layer-guide.md](./services-layer-guide.md)** | **详细架构指南** | 深入了解每个模块的作用和设计原理 |
| **[services-quick-reference.md](./services-quick-reference.md)** | **快速参考手册** | 日常开发中快速查找文件和功能 |
| **[core-pipeline.md](./core-pipeline.md)** | 核心管道设计 | 理解数据流和管道架构 |
| **[README.md](./README.md)** | 整体架构总览 | 系统整体架构和技术栈 |

---

## 🎯 按需求选择文档

### 🔍 如果您想了解：
- **"这个文件是做什么的？"** → 查看 [快速参考](./services-quick-reference.md)
- **"为什么这样设计？"** → 查看 [详细指南](./services-layer-guide.md)
- **"数据是如何流动的？"** → 查看 [核心管道](./core-pipeline.md)
- **"整体架构是怎样的？"** → 查看 [架构总览](./README.md)

### 🚀 如果您需要：
- **快速查找文件** → [快速参考 - 按功能分类](./services-quick-reference.md#按功能分类)
- **理解模块关系** → [详细指南 - 数据流管道](./services-layer-guide.md#数据流管道)
- **解决常见问题** → [快速参考 - 常见问题快速修复](./services-quick-reference.md#常见问题快速修复)
- **性能优化** → [详细指南 - 性能指标](./services-layer-guide.md#性能指标)

---

## 📊 五层架构模块概览

```
五层架构链路:
1) 解析层 (AI Parsing Layer) 
   ↓
2) Contract 组装层 (Contract Assembly) 
   ↓
3) 求解/仿真层 (Deterministic Solve/Sim) 
   ↓
4) 校验与度量层 (Validation & QA) 
   ↓
5) 渲染层 (Render/Export)

配套环境: 运行编排与资产管理（Orchestration & Assets）

services/
├── 🤖 ai_parsing/          # 第1层: 解析层 - Natural Question → ParseDoc v2
├── 📝 contract/            # 第2层: Contract组装层 - ParseDoc v2 → PhysicsContract
├── ⚙️ simulation/          # 第3层: 仿真层 - PhysicsContract → Simulation Trace
├── ✅ validation/          # 第4层: 校验层 - Simulation Trace → ValidationReport
├── 🎨 rendering/           # 第5层: 渲染层 - Simulation Trace → MP4/PNG
├── 🔄 ir/                  # 中间表示层 - Contract转换
├── 🔧 core/                # 核心接口层 - 统一接口
├── 🔄 feedback/            # 反馈优化层 - 智能优化
└── 🧪 testing/             # 测试层 - 各层测试用例
```

---

## 🔗 相关资源

### 📖 其他文档
- [项目根目录 README](../../README.md) - 项目整体介绍
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 项目架构总览
- [开发指南](../development/quickstart.md) - 快速开始开发

### 🛠️ 实用工具
- [测试用例](../../services/testing/) - 各层测试示例
- [示例代码](../../services/examples/) - 完整五层流程示例
- [配置文件](../../services/contract/PhysicsContract.json) - Contract Schema
- [ParseDoc v2 示例](../../services/testing/TestLayer/layer1_output/) - 解析层输出示例

---

## 💡 使用建议

1. **新手入门**：先看 [架构总览](./README.md)，再看 [核心链路](./core-pipeline.md)
2. **深入理解**：阅读 [详细指南](./services-layer-guide.md) 了解五层设计原理
3. **日常开发**：使用 [快速参考](./services-quick-reference.md) 查找各层文件和功能
4. **问题排查**：参考 [快速参考 - 常见问题](./services-quick-reference.md#常见问题快速修复)
5. **流程理解**：通过 [核心链路](./core-pipeline.md) 理解五层数据流转

---

*最后更新：2024年12月 - 五层架构 v2.0*
