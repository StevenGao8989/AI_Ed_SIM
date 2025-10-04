# 物理仿真核心链路说明

## 🔄 核心链路概述

ChatTutor AI 物理仿真平台采用五层架构设计，从自然语言题目到最终视频输出，实现了完整的物理题目处理流程。核心链路涵盖了 AI 解析、Contract 组装、确定性求解、质量校验、渲染导出等关键环节。

## 🎯 五层架构链路

### 📋 层级链路
```
1) 解析层 (AI Parsing Layer) 
   ↓
2) Contract 组装层 (Contract Assembly) 
   ↓
3) 求解/仿真层 (Deterministic Solve/Sim) 
   ↓
4) 校验与度量层 (Validation & QA) 
   ↓
5) 渲染层 (Render/Export)
```

### 🔄 配套环境
**运行编排与资产管理（Orchestration & Assets）**

## 📊 核心数据形态

```
Natural Question（原题文本） 
   ↓
ParseDoc v2 JSON（解析文档） 
   ↓
PhysicsContract JSON（可执行合同） 
   ↓
Simulation Trace（轨迹/事件/能量账 CSV/JSONL） 
   ↓
MP4/PNG（最终视频/帧）
```

## 🔍 五层架构详细说明

### 第1层: 解析层 (AI Parsing Layer)
**输入**: Natural Question（原题文本）
**处理**: PhysicsAICaller - AI 增强解析器
**输出**: ParseDoc v2 JSON（解析文档）

```typescript
// 示例输入
"质量为 m = 1.0 kg 的小滑块从光滑斜面顶端由静止释放。斜面高度 h= 1.25 m。滑到最低点后进入水平粗糙面，动摩擦因数μ=0.25，粗糙段长度d=2.0m。"

// ParseDoc v2 输出
{
  "meta": {
    "schema_version": "parse-doc/2.0.0",
    "language": "zh-CN",
    "topics": ["energy", "kinematics", "dynamics", "momentum"],
    "render_mode_hint": "simulation",
    "strict_mode": true
  },
  "narrative": {
    "beats": [
      { "id": "B1", "title": "斜面下滑", "text": "小滑块从光滑斜面顶端由静止释放", "stage_ref": "S1" }
    ]
  },
  "actors": [
    { "id": "A1", "label": "小滑块", "class": "block", "movable": true, "attributes": { "mass": { "symbol": "m", "value": 1, "unit": "kg" } } }
  ],
  "quantities": [
    { "symbol": "h", "name": "斜面高度", "value": 1.25, "unit": "m", "role": "given", "dimension": "L" },
    { "symbol": "μ", "name": "动摩擦因数", "value": 0.25, "unit": "", "role": "given", "dimension": "1" }
  ],
  "stages": [
    { "id": "S1", "label": "斜面下滑", "intent": "能量守恒求底端速度", "interactions": [...] }
  ],
  "compute_plan": [
    { "id": "v0", "method": "energy_conservation", "formula": "mgh = 0.5*m*v0^2", "preview": { "value": 4.95, "unit": "m/s", "status": "derived_hint" } }
  ]
}
```

### 第2层: Contract 组装层 (Contract Assembly)
**输入**: ParseDoc v2 JSON（解析文档）
**处理**: PhysicsContractBuilder - Contract 组装器
**输出**: PhysicsContract JSON（可执行合同）

```typescript
// PhysicsContract JSON 输出
{
  "entities": [
    {
      "id": "slider",
      "type": "rigid_body",
      "mass": 1.0,
      "position": { "x": 0, "y": 1.25, "z": 0 },
      "velocity": { "x": 0, "y": 0, "z": 0 },
      "geometry": { "type": "box", "dimensions": [0.2, 0.2, 0.2] }
    }
  ],
  "interactions": [
    {
      "type": "contact",
      "between": ["slider", "ramp"],
      "model": "static_no_friction",
      "params": {}
    },
    {
      "type": "field",
      "between": ["slider", "environment"],
      "model": "gravity",
      "params": { "g": 9.8 }
    }
  ],
  "stages": [
    {
      "id": "S1",
      "duration": 2.0,
      "events": [
        { "trigger": "position.y <= 0", "action": "transition_to_S2" }
      ]
    }
  ],
  "constraints": [
    { "type": "hard", "expr": "S1 no friction", "tol": 0 }
  ],
  "outputs": [
    { "id": "v0", "type": "velocity", "entity": "slider", "component": "magnitude" }
  ]
}
```

### 第3层: 求解/仿真层 (Deterministic Solve/Sim)
**输入**: PhysicsContract JSON（可执行合同）
**处理**: PhysicsSimulator - 确定性仿真引擎
**输出**: Simulation Trace（轨迹/事件/能量账 CSV/JSONL）

```typescript
// 仿真配置
interface SimulationConfig {
  method: "euler" | "rk4" | "adaptive";
  timeStep: number;
  duration: number;
  tolerance: number;
  maxIterations: number;
}

// Simulation Trace 输出 (CSV/JSONL 格式)
// CSV 示例:
// time,entity_id,position_x,position_y,velocity_x,velocity_y,energy_kinetic,energy_potential
// 0.0,slider,0.0,1.25,0.0,0.0,0.0,12.25
// 0.1,slider,0.0,1.20,0.0,-0.98,0.48,11.76
// 0.2,slider,0.0,1.05,0.0,-1.96,1.92,10.29

// JSONL 示例:
// {"time": 0.0, "entity": "slider", "state": {"position": [0,1.25,0], "velocity": [0,0,0]}, "energy": {"kinetic": 0, "potential": 12.25}}
// {"time": 0.1, "entity": "slider", "state": {"position": [0,1.20,0], "velocity": [0,-0.98,0]}, "energy": {"kinetic": 0.48, "potential": 11.76}}

// 仿真结果
interface SimulationResult {
  timeSeries: TimeSeriesData[];
  events: SimulationEvent[];
  metrics: SimulationMetrics;
  convergence: ConvergenceInfo;
  energyBalance: EnergyTrace[];
  momentumTrace: MomentumTrace[];
}
```

### 第4层: 校验与度量层 (Validation & QA)
**输入**: Simulation Trace（轨迹/事件/能量账 CSV/JSONL）
**处理**: ValidationEngine - 质量校验引擎
**输出**: 质量评估报告和优化建议

```typescript
// 质量校验项目
interface ValidationReport {
  // 物理守恒检查
  conservationLaws: {
    energy: {
      isValid: boolean;
      maxDeviation: number;
      tolerance: number;
      violations: ConservationViolation[];
    };
    momentum: {
      isValid: boolean;
      maxDeviation: number;
      violations: ConservationViolation[];
    };
  };
  
  // 数值精度检查
  numericalAccuracy: {
    convergenceRate: number;
    stabilityScore: number;
    errorBounds: ErrorBound[];
  };
  
  // 题意对齐检查
  questionAlignment: {
    score: number;
    coverage: number;
    missingElements: string[];
  };
  
  // 整体质量评分
  overallQuality: {
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    recommendations: string[];
  };
}

// 优化建议
interface OptimizationSuggestion {
  type: "parameter_adjustment" | "simulation_refinement" | "contract_modification";
  priority: "high" | "medium" | "low";
  description: string;
  expectedImprovement: number;
}
```

### 第5层: 渲染层 (Render/Export)
**输入**: Simulation Trace + ValidationReport（轨迹数据和质量报告）
**处理**: RenderEngine - 渲染引擎
**输出**: MP4/PNG（最终视频/帧）

```typescript
// 渲染配置
interface RenderConfig {
  resolution: "720p" | "1080p" | "4K";
  fps: number;
  quality: "low" | "medium" | "high";
  format: "mp4" | "webm" | "gif" | "png";
  camera: {
    type: "fixed" | "tracking" | "dynamic";
    position: [number, number, number];
    target: [number, number, number];
  };
  lighting: {
    ambient: number;
    directional: LightSource[];
  };
  effects: {
    particles: boolean;
    shadows: boolean;
    reflections: boolean;
    motionBlur: boolean;
  };
}

// 渲染结果
interface RenderResult {
  animationUrl: string;
  thumbnailUrl: string;
  metadata: {
    duration: number;
    frameCount: number;
    fileSize: number;
    resolution: string;
    fps: number;
  };
  interactiveScene?: InteractiveScene;
  exportFormats: {
    mp4?: string;
    webm?: string;
    gif?: string;
    frames?: string[];
  };
}
```

## 🔧 技术实现要点

### 1. 解析层 (AI Parsing Layer)
- **PhysicsAICaller**: 基于 DeepSeek R3 的智能解析器
- **ParseDoc v2**: 标准化的解析文档格式
- **数值审计**: 完整的计算过程验证
- **物理守卫**: 确保物理方程的正确性

### 2. Contract 组装层 (Contract Assembly)
- **PhysicsContractBuilder**: 自动组装可执行合同
- **实体建模**: 精确的物理实体定义
- **交互映射**: 物理交互的标准化描述
- **约束管理**: 硬约束和软约束的统一处理

### 3. 求解/仿真层 (Deterministic Solve/Sim)
- **PhysicsSimulator**: 确定性仿真引擎
- **多算法支持**: 欧拉法、RK4、自适应步长等
- **事件检测**: 碰撞、分离、状态变化等
- **轨迹记录**: 完整的 CSV/JSONL 格式输出

### 4. 校验与度量层 (Validation & QA)
- **ValidationEngine**: 自动质量校验引擎
- **守恒检查**: 能量、动量守恒验证
- **数值精度**: 收敛性和稳定性分析
- **题意对齐**: 与原始题目的匹配度评估

### 5. 渲染层 (Render/Export)
- **RenderEngine**: 高性能渲染引擎
- **多格式输出**: MP4、WebM、GIF、PNG
- **3D 可视化**: 基于 Three.js/WebGL
- **交互式场景**: 支持用户交互的 3D 场景

## 📊 质量保证机制

### 1. 五层质量检查
- **解析层**: ParseDoc v2 格式验证和物理逻辑检查
- **Contract层**: PhysicsContract 结构验证和约束检查
- **仿真层**: 数值精度和收敛性验证
- **校验层**: 守恒定律和题意对齐检查
- **渲染层**: 输出质量和视觉效果评估

### 2. 自动化测试
- **单元测试**: 各层组件独立测试
- **集成测试**: 层间数据传递测试
- **端到端测试**: 完整五层流程测试
- **性能测试**: 各层响应时间和资源消耗测试

### 3. 持续优化
- **质量评分**: 基于多维度指标的质量评估
- **自动优化**: 根据质量报告自动调整参数
- **用户反馈**: 收集用户评价并持续改进
- **版本迭代**: 基于使用数据的架构优化

## 🚀 性能优化策略

### 1. 分层优化
- **解析层**: AI 模型优化和缓存机制
- **Contract层**: 模板复用和增量更新
- **仿真层**: 算法选择和并行计算
- **校验层**: 增量验证和结果缓存
- **渲染层**: GPU 加速和 LOD 系统

### 2. 数据流优化
- **流式处理**: 大数据量的流式处理
- **压缩传输**: 减少层间数据传输量
- **智能缓存**: 基于使用模式的智能缓存
- **异步处理**: 非阻塞的异步处理机制

### 3. 资源管理
- **内存优化**: 分层内存管理和垃圾回收
- **CPU 优化**: 多核并行和负载均衡
- **GPU 加速**: 渲染和计算的 GPU 加速
- **存储优化**: 分层存储和压缩策略

## 🔮 未来发展方向

### 1. 五层架构增强
- **解析层**: 多模态输入支持（文本+图像+语音）
- **Contract层**: 智能 Contract 模板和自动优化
- **仿真层**: 量子计算和 AI 辅助仿真
- **校验层**: 基于机器学习的质量预测
- **渲染层**: 实时渲染和 VR/AR 支持

### 2. 智能化升级
- **自适应流程**: 根据题目复杂度自动选择最优路径
- **智能优化**: 基于历史数据的参数自动调优
- **预测分析**: 仿真结果和质量的提前预测
- **个性化定制**: 基于用户偏好的个性化输出

### 3. 生态扩展
- **多物理场**: 支持电磁、热、流体等多物理场耦合
- **云端协作**: 支持云端大规模仿真和协作
- **API 开放**: 提供完整的五层 API 接口
- **插件生态**: 支持第三方插件和扩展

---

**文档版本**: 2.0.0  
**最后更新**: 2024年12月  
**维护者**: ChatTutor AI 开发团队
