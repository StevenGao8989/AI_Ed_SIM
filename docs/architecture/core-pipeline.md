# 物理仿真核心链路说明

## 🔄 核心链路概述

ChatTutor AI 物理仿真平台的核心链路是一个完整的物理题目处理流程，从用户输入到最终动画输出，涵盖了 AI 解析、DSL 生成、仿真计算、动画渲染等关键环节。

## 🎯 完整链路流程

```
题目文本/图片 → 解析与单位统一 → 生成 PhysicsDSL(YAML) → 
解析为中间 IR(JSON) → 用 PhysicsSchema(JSON Schema) 做结构校验 → 
做物理一致性校验（量纲/约束/初值） → PhysicsSimulator 多模块联立仿真（事件检测）→ 
渲染器(Canvas/WebGL/Three) 出动画 → 结果自检（题意对齐/守恒量/不变量）→ 
若不通过，最小更改 DSL 并回流重跑 → 导出与快照测试
```

## 🔍 各阶段详细说明

### 阶段 1: 题目输入与解析
**输入**: 用户输入的自然语言物理题目
**处理**: AI 增强解析器 + 规则解析回退
**输出**: 结构化的物理参数和单位信息

```typescript
// 示例输入
"一物体从高度 h=100m 自由下落，求落地时间t和落地速度v。"

// 解析输出
{
  subject: "physics",
  topic: "自由落体运动/Free Fall",
  parameters: [
    { symbol: "h", value: 100, unit: "m", role: "given", note: "初始高度" },
    { symbol: "g", value: 9.8, unit: "m/s²", role: "constant", note: "重力加速度" },
    { symbol: "t", value: null, unit: "s", role: "unknown", note: "落地时间" },
    { symbol: "v", value: null, unit: "m/s", role: "unknown", note: "落地速度" }
  ],
  units: [...],
  ai_enhanced: true,
  confidence: 0.9
}
```

### 阶段 2: DSL 生成
**输入**: 解析后的结构化数据
**处理**: PhysicsDslGenerator 组件
**输出**: YAML 格式的 PhysicsDSL

```yaml
# 生成的 PhysicsDSL
system:
  type: "kinematics_linear"
  name: "自由落体运动"
  description: "物体从高处自由下落的运动过程"
  
parameters:
  - symbol: "h"
    value: 100
    unit: "m"
    role: "initial_condition"
    description: "初始高度"
    
  - symbol: "g"
    value: 9.8
    unit: "m/s²"
    role: "constant"
    description: "重力加速度"
    
  - symbol: "t"
    value: null
    unit: "s"
    role: "unknown"
    description: "落地时间"
    
  - symbol: "v"
    value: null
    unit: "m/s"
    role: "unknown"
    description: "落地速度"

simulation:
  method: "ode_solver"
  time_step: 0.01
  duration: 10
  
output:
  format: "animation"
  resolution: "1080p"
  fps: 60
```

### 阶段 3: DSL 解析与验证
**输入**: YAML 格式的 PhysicsDSL
**处理**: PhysicsParser + PhysicsSchema 验证
**输出**: 验证通过的中间表示 (IR)

```typescript
// 解析后的中间表示
interface PhysicsIR {
  system: PhysicsSystem;
  parameters: PhysicsParameter[];
  simulation: SimulationConfig;
  output: OutputConfig;
  validation: ValidationResult;
}

// 验证结果
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number;
}
```

### 阶段 4: 物理一致性校验
**输入**: 验证通过的中间表示
**处理**: 物理逻辑验证器
**输出**: 物理一致性检查结果

```typescript
// 物理一致性检查
interface PhysicsConsistencyCheck {
  // 量纲检查
  dimensionalAnalysis: {
    isValid: boolean;
    errors: string[];
  };
  
  // 约束检查
  constraintValidation: {
    isValid: boolean;
    violations: string[];
  };
  
  // 初值检查
  initialValueCheck: {
    isValid: boolean;
    warnings: string[];
  };
  
  // 物理合理性
  physicalReasonableness: {
    score: number;
    issues: string[];
  };
}
```

### 阶段 5: 仿真计算
**输入**: 物理一致性检查通过的数据
**处理**: PhysicsSimulator 多模块联立仿真
**输出**: 仿真结果数据

```typescript
// 仿真配置
interface SimulationConfig {
  method: "euler" | "rk4" | "adaptive";
  timeStep: number;
  duration: number;
  tolerance: number;
  maxIterations: number;
}

// 仿真结果
interface SimulationResult {
  timeSeries: TimeSeriesData[];
  events: SimulationEvent[];
  metrics: SimulationMetrics;
  convergence: ConvergenceInfo;
}
```

### 阶段 6: 动画渲染
**输入**: 仿真结果数据
**处理**: 3D 渲染器 (Three.js/WebGL)
**输出**: 动画视频或交互式 3D 场景

```typescript
// 渲染配置
interface RenderConfig {
  resolution: "720p" | "1080p" | "4K";
  fps: number;
  quality: "low" | "medium" | "high";
  format: "mp4" | "webm" | "gif";
}

// 渲染结果
interface RenderResult {
  animationUrl: string;
  thumbnailUrl: string;
  metadata: RenderMetadata;
  interactiveScene?: InteractiveScene;
}
```

### 阶段 7: 结果自检
**输入**: 渲染完成的动画
**处理**: 自动质量检查
**输出**: 质量评估报告

```typescript
// 自检项目
interface SelfCheckResult {
  // 题意对齐检查
  questionAlignment: {
    score: number;
    issues: string[];
  };
  
  // 守恒量检查
  conservationLaws: {
    energy: ConservationCheck;
    momentum: ConservationCheck;
    angularMomentum: ConservationCheck;
  };
  
  // 不变量检查
  invariants: {
    isValid: boolean;
    violations: string[];
  };
  
  // 整体质量评分
  overallQuality: number;
}
```

### 阶段 8: 回流优化
**输入**: 自检不通过的结果
**处理**: 智能 DSL 优化器
**输出**: 优化后的 DSL 配置

```typescript
// 优化策略
interface OptimizationStrategy {
  // 参数调整
  parameterAdjustment: {
    target: string;
    method: "increment" | "decrement" | "scale";
    factor: number;
  };
  
  // 仿真参数优化
  simulationOptimization: {
    timeStep: number;
    tolerance: number;
    method: string;
  };
  
  // 重新运行标记
  shouldRerun: boolean;
  maxIterations: number;
}
```

## 🔧 技术实现要点

### 1. AI 增强解析
- **多模型支持**: DeepSeek R3, OpenAI GPT-4, 本地模型
- **智能回退**: AI 失败时自动使用规则解析
- **置信度评估**: 自动评估解析质量
- **持续学习**: 从用户反馈中学习改进

### 2. DSL 系统
- **标准化格式**: 基于 YAML 的结构化配置
- **类型安全**: 完整的 TypeScript 类型定义
- **验证机制**: JSON Schema 自动验证
- **版本管理**: 支持 DSL 版本升级和兼容性

### 3. 仿真引擎
- **多算法支持**: 欧拉法、RK4、自适应步长等
- **事件检测**: 碰撞、分离、状态变化等
- **并行计算**: 支持多核并行仿真
- **实时交互**: 支持用户实时调整参数

### 4. 渲染系统
- **多格式输出**: 视频、GIF、交互式 3D 场景
- **性能优化**: 基于 WebGL 的硬件加速
- **响应式设计**: 支持不同设备和分辨率
- **导出功能**: 支持多种文件格式导出

## 📊 质量保证机制

### 1. 多层验证
- **语法验证**: DSL 格式和结构检查
- **语义验证**: 物理逻辑和约束检查
- **数值验证**: 计算精度和稳定性检查
- **结果验证**: 输出质量和合理性检查

### 2. 自动测试
- **单元测试**: 各组件独立测试
- **集成测试**: 组件间协作测试
- **端到端测试**: 完整流程测试
- **性能测试**: 响应时间和资源消耗测试

### 3. 用户反馈
- **质量评分**: 用户对结果质量评分
- **问题报告**: 用户报告的问题和建议
- **使用统计**: 功能使用频率和成功率
- **持续改进**: 基于反馈的迭代优化

## 🚀 性能优化策略

### 1. 计算优化
- **算法选择**: 根据问题类型选择最优算法
- **并行计算**: 利用多核 CPU 和 GPU 加速
- **缓存策略**: 智能缓存计算结果
- **预计算**: 提前计算常用结果

### 2. 渲染优化
- **LOD 系统**: 根据距离动态调整细节
- **视锥剔除**: 只渲染可见对象
- **材质优化**: 使用高效的着色器
- **纹理压缩**: 减少内存占用

### 3. 网络优化
- **CDN 加速**: 全球内容分发
- **压缩传输**: 减少数据传输量
- **缓存策略**: 客户端和服务器端缓存
- **异步加载**: 非阻塞的资源加载

## 🔮 未来发展方向

### 1. 智能化增强
- **自适应参数**: 根据题目自动调整参数
- **智能优化**: 使用机器学习优化仿真参数
- **预测分析**: 预测仿真结果和潜在问题
- **个性化定制**: 根据用户偏好定制输出

### 2. 功能扩展
- **多物理场**: 支持电磁、热、流体等多物理场耦合
- **实时协作**: 支持多用户实时协作仿真
- **云端计算**: 支持云端大规模仿真计算
- **移动端支持**: 优化移动设备体验

### 3. 生态建设
- **插件系统**: 支持第三方插件扩展
- **API 开放**: 提供开放的 API 接口
- **社区建设**: 建立用户和开发者社区
- **教育培训**: 提供使用培训和最佳实践

---

**文档版本**: 1.0.0  
**最后更新**: 2024年12月  
**维护者**: ChatTutor AI 开发团队
