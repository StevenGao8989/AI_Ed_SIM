# Services层快速参考

## 🚀 核心文件速查

### 最常用的文件（按使用频率排序）

| 文件 | 作用 | 何时使用 |
|------|------|----------|
| `dsl/adapter.js` | **Contract适配器** | 将AI解析结果转为仿真契约 |
| `simulation/engine.js` | **仿真引擎** | 执行物理仿真 |
| `rendering/rasterizer.js` | **渲染器** | 生成动画帧 |
| `dsl/validator.js` | **Pre-Sim验证** | 验证Contract有效性 |
| `qa/vcs.js` | **Post-Sim评分** | 评估仿真质量 |
| `export/ffmpeg.js` | **视频导出** | 生成MP4视频 |
| `ai_parsing/PhysicsAIParserAICaller.js` | **AI解析** | 解析自然语言问题 |

---

## 📋 按功能分类

### 🤖 AI解析
- `ai_parsing/PhysicsAIParserAICaller.js` - 调用AI解析问题
- `ai_parsing/PhysicsAIParser.js` - 解析AI输出
- `ai_parsing/unitConverter.js` - 单位转换

### 📝 Contract/DSL
- `dsl/PhysicsContract.json` - **契约Schema定义**
- `dsl/adapter.js` - **AI结果→Contract转换**
- `dsl/validator.js` - **Pre-Sim Gate验证**
- `dsl/registry/` - 力、表面、形状注册表

### ⚙️ 仿真引擎
- `simulation/engine.js` - **核心仿真引擎**
- `simulation/integrators/rk4.js` - RK4积分器
- `simulation/integrators/rk45.js` - RK45积分器
- `simulation/contact/solver.js` - 接触求解器
- `simulation/guards/index.js` - 事件守卫

### 🎨 渲染
- `rendering/rasterizer.js` - **主渲染器**
- `rendering/mapper.js` - 坐标映射
- `rendering/overlays.js` - 叠加层
- `rendering/CoordinateSystem.js` - 坐标系统

### 📹 导出
- `export/ffmpeg.js` - **FFmpeg封装**
- `export/FFmpegEncoder.ts` - 视频编码器

### ✅ 质量保证
- `qa/vcs.js` - **VCS评分器**
- `qa/acceptance/conservation.js` - 守恒测试
- `qa/acceptance/time.js` - 时间测试

---

## 🔄 典型使用流程

### 1. 完整测试流程
```javascript
// 参考：testing/TestQuestion/test_question.js
const aiCaller = require('./ai_parsing/PhysicsAIParserAICaller');
const adapter = require('./dsl/adapter');
const validator = require('./dsl/validator');
const engine = require('./simulation/engine');
const rasterizer = require('./rendering/rasterizer');
const ffmpeg = require('./export/ffmpeg');
```

### 2. 快速测试流程
```javascript
// 参考：testing/TestComplete/test_new_physics.js
// 直接使用自定义仿真器，跳过复杂架构
const ComplexPhysicsSimulator = require('./test_new_physics');
const ComplexPhysicsRenderer = require('./test_new_physics');
```

---

## 🎯 按问题类型选择

### 简单物理问题
- 使用：`testing/TestComplete/test_simple_physics.js`
- 特点：直接计算，快速渲染

### 复杂多阶段问题
- 使用：`testing/TestComplete/test_new_physics.js`
- 特点：分阶段仿真，详细碰撞过程

### 通用问题测试
- 使用：`testing/TestQuestion/test_question.js`
- 特点：完整架构，AI解析

---

## 🔧 配置文件

### 环境变量
```bash
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_key
RENDER_WIDTH=1200
RENDER_HEIGHT=800
RENDER_FPS=30
```

### Contract Schema
- 主文件：`dsl/PhysicsContract.json`
- 关键字段：`world`, `surfaces`, `bodies`, `phases`, `acceptance_tests`

---

## 🐛 常见问题快速修复

### 渲染问题
- **斜面不显示** → 检查 `surfaces` 定义
- **物体位置错** → 检查坐标系统
- **碰撞不可见** → 增加碰撞帧数

### 仿真问题
- **能量爆炸** → 减小积分步长
- **VCS评分低** → 检查验收测试
- **阶段切换错** → 检查守卫条件

### 导出问题
- **FFmpeg错误** → 检查FFmpeg安装
- **视频质量差** → 调整编码参数

---

## 📊 性能参考

| 阶段 | 典型耗时 | 优化建议 |
|------|----------|----------|
| AI解析 | 1-3秒 | 并行处理 |
| Contract验证 | <100ms | 缓存模板 |
| 仿真执行 | 0.5-2秒 | 优化步长 |
| 渲染 | 2-5秒 | 增量渲染 |
| 视频导出 | 1-3秒 | 压缩优化 |

---

## 🔗 相关文档

- [详细架构指南](./services-layer-guide.md) - 完整文档
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 整体架构
- [核心管道](./core-pipeline.md) - 管道设计

---

*快速参考 - 最后更新：2024年12月*
