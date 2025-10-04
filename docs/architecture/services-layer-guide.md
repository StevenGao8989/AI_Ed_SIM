# Services Layer Architecture Guide

## 📋 Overview

The Services layer is the core architecture of the AI physics simulation platform, adopting the "Contract-based physics simulation platform" design philosophy. The entire system follows a **deterministic pipeline**: `AI Parsing → Contract/DSL → SimTrace → Frame Sequence → FFmpeg`, ensuring a completely reproducible process from natural language problems to animation videos.

## 🏗️ Core Architecture Principles

1. **AI Only Generates Structured Contract/DSL**: No involvement in numerical calculations or rendering details
2. **Deterministic Pipeline**: Subsequent steps are completely independent of AI runtime behavior
3. **Dual Gate Validation System**: Pre-Sim Gate (Hard Validation) + Post-Sim Gate (Acceptance Testing)
4. **Explainable Failures**: Provides repairable error suggestions
5. **Modular Design**: Each module has single responsibility with clear interfaces
6. **Layered Testing**: Each layer has independent test files for functionality validation

## 📁 Directory Structure Overview

```
services/
├── ai_parsing/          # AI parsing layer
├── dsl/                 # DSL/Contract layer
├── simulation/          # Simulation engine layer
├── rendering/           # Rendering layer
├── export/              # Export layer
├── qa/                  # Quality assurance layer
├── ir/                  # Intermediate representation layer
├── core/                # Core interface layer
├── validation/          # Validation layer
├── feedback/            # Feedback optimization layer
└── testing/             # Testing layer
```

---

## 🔍 Detailed Module Description

### 1. AI Parsing Layer (`ai_parsing/`)

**Responsibility**: Convert natural language physics problems into structured data

| File | Purpose | Core Functions |
|------|---------|----------------|
| `AIParsingService.js` | Integrated Service | Unified AI parsing function interface, integrating all parsing capabilities |
| `PhysicsAIParserAICaller.js` | AI Caller | Core AI parsing engine, handles parameter symbol conflicts |
| `PhysicsAIParser.js` | Parser Core | Basic parsing logic, often used as fallback solution |
| `AtomicModules.js` | Atomic Modules | Physics knowledge module library, provides basic parsing functionality |
| `unitConverter.js` | Unit Converter | Unit standardization and conversion, exports function interfaces |
| `OCRPhysicsParser.ts` | OCR Parser | Extract physics problems from images |
| `MultiLanguageSupport.ts` | Multi-language Support | Supports Chinese/English physics problem parsing |

**Input**: Natural language physics problems
**Output**: Structured parsing results, including parameters, solution steps, formulas, target parameters

**Key Features**:
- Automatic parameter symbol conflict resolution (e.g., m vs M)
- Automatic known/unknown parameter identification
- Dimensionless parameter handling (e.g., friction coefficient μ)
- DSL compatibility validation

---

### 2. DSL/Contract Layer (`dsl/`)

**Responsibility**: Define and manage physics simulation contracts

| File | Purpose | Core Functions |
|------|---------|----------------|
| `PhysicsContract.json` | Contract Schema | Defines Contract JSON Schema structure, supports general physics problems |
| `adapter.js` | Adapter | Converts AI parsing results to PhysicsContract, supports multi-object multi-stage |
| `validator.js` | Validator | Pre-Sim Gate hard validation, ensures Contract integrity |
| `types.js` | Type Definitions | TypeScript types related to Contract |
| `PhysicsDslGenerator.js` | DSL Generator | Generates physics simulation DSL |
| `registry/` | Registry | Registry for forces, surfaces, shapes |

**Core Schema Fields**:
- `world`: World configuration (gravity, units, rendering hints, coordinate system)
- `surfaces`: Surface definitions (inclined planes, ground, contact parameters, geometric information)
- `bodies`: Rigid body definitions (mass, shape, initial state, inertia)
- `phases`: Simulation phases (force models, guard conditions, integrator configuration)
- `constraints`: Constraints (springs, joints, contact models)
- `acceptance_tests`: Acceptance tests (conservation, boundaries, formula validation)
- `simulation`: Simulation configuration (time, step size, tolerance)

**Key Features**:
- Supports multi-object, multi-stage complex physics processes
- Inelastic collision and spring compression phases
- Complex physical quantity formula validation
- Multi-object, spring, collision event visualization

---

### 3. Simulation Engine Layer (`simulation/`)

**Responsibility**: Execute physics simulation, generate SimTrace

| File | Purpose | Core Functions |
|------|---------|----------------|
| `engine.js` | Simulation Engine | Core simulation logic, phase state machine |
| `DynamicPhysicsSimulator.js` | Dynamic Simulator | Handles dynamic physics processes |
| `integrators/` | Integrators | RK4, RK45 numerical integration methods |
| `contact/` | Contact Solving | Collision detection and contact force calculation |
| `guards/` | Guard Conditions | Event detection and phase switching |
| `phases/` | Phase Management | Simulation phase state machine |
| `events/` | Event System | Event detection and processing |
| `StateMonitor.js` | State Monitor | Simulation state monitoring and debugging |

**Core Process**:
1. Read PhysicsContract
2. Initialize simulation environment
3. Execute phase state machine
4. Numerical integration solving
5. Event detection and phase switching
6. Output SimTrace

---

### 4. Rendering Layer (`rendering/`)

**Responsibility**: Convert SimTrace to visual frames

| File | Purpose | Core Functions |
|------|---------|----------------|
| `rasterizer.js` | Rasterizer | Core rendering engine, SimTrace→PNG |
| `mapper.js` | Coordinate Mapper | World coordinate to screen coordinate conversion |
| `overlays.js` | Overlay | Debug information, annotations, grid |
| `CoordinateSystem.js` | Coordinate System | Unified coordinate system management |
| `Physics2DRenderer.js` | 2D Renderer | 2D physics scene rendering |
| `DynamicPhysicsRenderer.js` | Dynamic Renderer | Dynamic physics process rendering |
| `RenderingManager.js` | Rendering Manager | Rendering workflow management |
| `RenderCfgBuilder.ts` | Configuration Builder | Rendering configuration building |

**Rendering Process**:
1. Read SimTrace and Contract
2. Calculate scene boundaries and scaling
3. Draw surfaces (inclined planes, ground)
4. Draw rigid bodies (sliders, blocks)
5. Draw constraints (springs)
6. Add overlays (annotations, grid)
7. Output PNG frame sequence

---

### 5. Export Layer (`export/`)

**Responsibility**: Encode frame sequences into videos

| File | Purpose | Core Functions |
|------|---------|----------------|
| `ffmpeg.js` | FFmpeg Wrapper | FFmpeg command line wrapper |
| `FFmpegEncoder.ts` | Video Encoder | Frame sequence→MP4 video |
| `ExportManager.ts` | Export Manager | Export workflow management |

**Export Process**:
1. Collect PNG frame sequences
2. Call FFmpeg encoding
3. Generate MP4 video file
4. Clean up temporary files

---

### 6. Quality Assurance Layer (`qa/`)

**Responsibility**: Post-Sim Gate acceptance testing and VCS scoring

| File | Purpose | Core Functions |
|------|---------|----------------|
| `vcs.js` | VCS Scorer | Validity, Consistency, Stability scoring |
| `acceptance/` | Acceptance Testing | Various acceptance test implementations |
| `acceptance/conservation.js` | Conservation Test | Energy, momentum conservation validation |
| `acceptance/time.js` | Time Test | Time-related acceptance testing |

**VCS Scoring Dimensions**:
- **Validity**: Physics validity (energy conservation, boundary conditions)
- **Consistency**: Consistency (trajectory shape, event timing)
- **Stability**: Numerical stability (energy drift, convergence)

---

### 7. Intermediate Representation Layer (`ir/`)

**Responsibility**: Intermediate layer between Contract and Simulation

| File | Purpose | Core Functions |
|------|---------|----------------|
| `IRConverter.js` | IR Converter | Contract→IR→Simulation |
| `IRValidator.js` | IR Validator | IR layer validation |
| `ContractValidator.ts` | Contract Validator | Contract validation |
| `PhysicsIR.js` | Physics IR | Intermediate representation definition |

**Note**: Current architecture tends to use Contract directly, IR layer is mainly used for complex scenarios.

---

### 8. Core Interface Layer (`core/`)

**Responsibility**: Provide unified physics simulation interfaces

| File | Purpose | Core Functions |
|------|---------|----------------|
| `PhysicsCore.js` | Physics Core | Unified physics simulation interface |
| `PhysicsTestInterface.js` | Test Interface | Test-related interfaces |

---

### 9. Validation Layer (`validation/`)

**Responsibility**: Various validation functions

| File | Purpose | Core Functions |
|------|---------|----------------|
| `AcceptanceRunner.ts` | Acceptance Runner | Execute acceptance tests |
| `PhysicsValidator.ts` | Physics Validator | Physics parameter validation |
| `ResultValidator.ts` | Result Validator | Simulation result validation |

---

### 10. Feedback Optimization Layer (`feedback/`)

**Responsibility**: Feedback-based optimization system

| File | Purpose | Core Functions |
|------|---------|----------------|
| `DSLOptimizer.ts` | DSL Optimizer | Feedback-based DSL optimization |
| `MLOptimizer.ts` | Machine Learning Optimizer | ML-driven optimization |

---

### 11. 测试层 (`testing/`)

**职责**：分层测试架构，每层独立验证功能

| 文件 | 作用 | 测试内容 |
|------|------|----------|
| `test_layer1_ai.js` | AI解析层测试 | AI解析功能、参数提取、符号冲突解决 |
| `test_layer2_contract.js` | Contract适配层测试 | AI结果到Contract转换 |
| `test_layer3_validation.js` | 验证层测试 | Pre-Sim Gate验证功能 |
| `test_layer4_simulation.js` | 仿真层测试 | 仿真引擎、积分器、事件检测 |
| `test_layer5_quality.js` | 质量保证层测试 | VCS评分、验收测试 |
| `test_layer6_rendering.js` | 渲染层测试 | 帧生成、坐标映射、视觉效果 |
| `test_layer7_export.js` | 导出层测试 | 视频编码、FFmpeg集成 |
| `test_layer8_integration.js` | 集成测试 | 端到端完整流程 |
| `test_ai_to_adapter.js` | 数据流测试 | AI解析到Adapter的数据流验证 |
| `TestQuestion/` | 问题测试 | 通用问题测试入口和输出 |
| `TestComplete/` | 完整测试 | 端到端测试用例和结果 |

**测试架构特点**：
- 每层独立测试，确保模块功能正确
- 分层验证，便于定位问题
- 数据流测试，验证层间接口
- 完整集成测试，验证端到端流程

---

## 🔄 数据流管道

### 完整流程

```
自然语言问题
    ↓
AI解析层 (ai_parsing/AIParsingService.js)
    ↓ 结构化解析结果
DSL适配器 (dsl/adapter.js)
    ↓ PhysicsContract
Pre-Sim Gate (dsl/validator.js)
    ↓ 验证通过
仿真引擎 (simulation/engine.js)
    ↓ SimTrace
Post-Sim Gate (qa/vcs.js)
    ↓ VCS评分
渲染层 (rendering/rasterizer.js)
    ↓ PNG帧序列
导出层 (export/ffmpeg.js)
    ↓ MP4视频
```

### 分层测试流程

```
Layer 1: test_layer1_ai.js
    ↓ AI解析结果验证
Layer 2: test_layer2_contract.js
    ↓ Contract转换验证
Layer 3: test_layer3_validation.js
    ↓ 验证功能测试
Layer 4: test_layer4_simulation.js
    ↓ 仿真引擎测试
Layer 5: test_layer5_quality.js
    ↓ 质量保证测试
Layer 6: test_layer6_rendering.js
    ↓ 渲染功能测试
Layer 7: test_layer7_export.js
    ↓ 导出功能测试
Layer 8: test_layer8_integration.js
    ↓ 端到端集成测试
```

### 关键数据格式

1. **AI解析结果**：包含参数、解题步骤、公式、目标参数的结构化数据
2. **PhysicsContract**：物理仿真契约，包含world、surfaces、bodies、phases等
3. **SimTrace**：仿真轨迹数据，包含状态历史和时间序列
4. **VCS Report**：质量评分报告，包含Validity、Consistency、Stability评分
5. **Frame序列**：PNG帧序列，用于视频生成
6. **MP4视频**：最终输出的物理动画视频

---

## 📊 **各层输入输出详细说明**

### **Layer 1: AI解析层**

**输入格式**：
```javascript
// 自然语言物理问题
const input = "质量为1kg的小物块以5m/s的初速度滑上一块原来静止在水平面上的木板...";
```

**输出格式**：
```json
{
  "timestamp": "2025-09-24T11:04:44.321Z",
  "question": "原始问题文本",
  "result": {
    "subject": "physics",
    "topic": "牛顿运动定律/Newton's Laws",
    "parameters": [
      {
        "symbol": "m1",
        "value": 1,
        "unit": "kg",
        "role": "given|unknown|constant",
        "note": "参数描述",
        "dslType": "scalar|vector",
        "domain": "dynamics|kinematics",
        "priority": 1,
        "dependencies": [],
        "formula": ""
      }
    ],
    "solutionPath": {
      "steps": [
        {
          "id": "step1",
          "type": "system_analysis|momentum_analysis|energy_analysis",
          "module": "system_dynamics|momentum_conservation|energy_conservation",
          "action": "操作描述",
          "inputs": ["参数列表"],
          "outputs": ["输出参数"],
          "formula": "物理公式",
          "order": 1,
          "note": "注意事项"
        }
      ],
      "modules": ["模块列表"],
      "dependencies": ["step1 → step2"],
      "executionOrder": ["step1", "step2"],
      "checkpoints": []
    },
    "physicsType": {
      "type": "multi_body_friction_system|single_body",
      "description": "问题类型描述",
      "requiresSystemAnalysis": true,
      "keyConstraints": ["momentum_impulse", "work_energy"],
      "commonErrors": ["single_body_acceleration_assumption"],
      "systemBoundaries": ["object_1", "object_2"],
      "externalForces": ["friction", "gravity"],
      "internalForces": ["internal_friction"],
      "conservationLaws": {
        "momentum": true,
        "energy": false
      }
    },
    "formulas": {
      "primary": [
        {
          "name": "公式名称",
          "expression": "物理公式",
          "description": "公式描述",
          "type": "primary",
          "module": "物理模块",
          "variables": ["变量列表"]
        }
      ]
    },
    "target": {
      "primary": "μ",
      "secondary": [],
      "method": "dynamics",
      "priority": 1
    }
  }
}
```

---

### **Layer 2: Contract适配层**

**输入格式**：Layer 1的AI解析结果
**输出格式**：
```json
{
  "world": {
    "coord": "xy_y_up|xy_y_down",
    "units": {
      "angle": "rad|deg",
      "length": "m",
      "time": "s",
      "mass": "kg"
    },
    "gravity": [0, -9.8],
    "constants": {},
    "render_hints": {
      "camera_fit": "surfaces|trace|both",
      "margin": 0.5,
      "show_grid": true,
      "background": "#ffffff"
    }
  },
  "surfaces": [
    {
      "id": "surface_id",
      "kind": "plane|segment|circle",
      "point": [x, y],
      "normal": [nx, ny],
      "points": [[x1, y1], [x2, y2]],
      "contact": {
        "restitution": 0.0,
        "mu_s": 0.0,
        "mu_k": 0.0,
        "model": "impulse"
      },
      "tangent_hint": [tx, ty]
    }
  ],
  "bodies": [
    {
      "id": "body_id",
      "shape": {
        "kind": "circle|rectangle",
        "size": 0.1,
        "width": 0.3,
        "height": 0.2
      },
      "mass": 1.0,
      "init": {
        "x": 0.0,
        "y": 0.0,
        "vx": 0.0,
        "vy": 0.0,
        "theta": 0.0,
        "omega": 0.0
      },
      "kind": "dynamic|static",
      "contacts": []
    }
  ],
  "phases": [
    {
      "id": "phase_id",
      "initial": true,
      "integrator": {
        "type": "rk4|rk45",
        "h_max": 0.01,
        "rel_tol": 1e-4,
        "abs_tol": 1e-6
      },
      "forces": ["gravity", "friction"],
      "guards": [
        {
          "condition": "collision_detected",
          "next_phase": "collision_phase"
        }
      ]
    }
  ],
  "simulation": {
    "t_end": 10.0,
    "max_steps": 20000,
    "root_finder": "bisection",
    "event_tol": 1e-6,
    "output_fps": 30
  },
  "constraints": [
    {
      "id": "constraint_id",
      "type": "spring|prismatic",
      "body1": "body_id1",
      "body2": "body_id2",
      "stiffness": 100.0,
      "damping": 0.1
    }
  ],
  "acceptance_tests": [
    {
      "kind": "conservation",
      "of": "energy|momentum",
      "rel_err": 0.02
    },
    {
      "kind": "bounds",
      "never_penetrate": true
    }
  ]
}
```

---

### **Layer 3: 验证层**

**输入格式**：Layer 2的PhysicsContract
**输出格式**：
```json
{
  "timestamp": "2025-09-24T11:04:44.321Z",
  "validation_result": {
    "success": true,
    "score": 95,
    "errors": [],
    "warnings": [],
    "checks": [
      {
        "name": "schema_validation",
        "status": "passed",
        "message": "Contract结构符合Schema要求"
      },
      {
        "name": "physics_constraints",
        "status": "passed", 
        "message": "物理约束条件合理"
      },
      {
        "name": "numerical_stability",
        "status": "passed",
        "message": "数值参数稳定"
      }
    ]
  },
  "corrected_contract": {
    // 修正后的Contract（如果有修正）
  }
}
```

---

### **Layer 4: 仿真层**

**输入格式**：Layer 3验证通过的PhysicsContract
**输出格式**：
```json
{
  "timestamp": "2025-09-24T11:04:44.321Z",
  "simulation_result": {
    "success": true,
    "execution_time": 2.5,
    "total_steps": 1500,
    "phases_executed": ["phase1", "phase2"],
    "traces": {
      "bodies": [
        {
          "id": "body_id",
          "states": [
            {
              "t": 0.0,
              "x": 0.0,
              "y": 0.0,
              "vx": 5.0,
              "vy": 0.0,
              "theta": 0.0,
              "omega": 0.0
            }
          ]
        }
      ],
      "events": [
        {
          "t": 1.5,
          "type": "collision",
          "bodies": ["body1", "body2"],
          "phase_transition": "phase1 → phase2"
        }
      ],
      "energy": [
        {
          "t": 0.0,
          "kinetic": 12.5,
          "potential": 0.0,
          "total": 12.5
        }
      ]
    },
    "final_state": {
      "t": 10.0,
      "bodies": [
        {
          "id": "body_id",
          "x": 5.0,
          "y": 0.0,
          "vx": 1.0,
          "vy": 0.0
        }
      ]
    }
  }
}
```

---

### **Layer 5: 质量保证层**

**输入格式**：Layer 4的SimTrace + 原始Contract
**输出格式**：
```json
{
  "timestamp": "2025-09-24T11:04:44.321Z",
  "vcs_report": {
    "overall_score": 92,
    "validity": {
      "score": 95,
      "checks": [
        {
          "name": "energy_conservation",
          "status": "passed",
          "score": 98,
          "details": "能量漂移 < 2%"
        },
        {
          "name": "momentum_conservation", 
          "status": "passed",
          "score": 96,
          "details": "动量守恒良好"
        }
      ]
    },
    "consistency": {
      "score": 90,
      "checks": [
        {
          "name": "trajectory_smoothness",
          "status": "passed",
          "score": 92,
          "details": "轨迹连续平滑"
        }
      ]
    },
    "stability": {
      "score": 91,
      "checks": [
        {
          "name": "numerical_stability",
          "status": "passed", 
          "score": 91,
          "details": "数值积分稳定"
        }
      ]
    }
  },
  "acceptance_tests": [
    {
      "name": "energy_conservation_test",
      "status": "passed",
      "actual_value": 0.015,
      "threshold": 0.02,
      "message": "能量守恒测试通过"
    }
  ]
}
```

---

### **Layer 6: 渲染层**

**输入格式**：Layer 4的SimTrace + Layer 2的Contract
**输出格式**：
```javascript
// 帧序列文件
const frameFiles = [
  "frame_000.png",
  "frame_001.png", 
  "frame_002.png",
  // ... 更多帧
];

// 渲染配置
const renderConfig = {
  "width": 1200,
  "height": 800,
  "fps": 30,
  "total_frames": 300,
  "world_bounds": {
    "min_x": -2.0,
    "max_x": 8.0,
    "min_y": -1.0,
    "max_y": 3.0
  },
  "coordinate_mapping": {
    "world_to_screen": "function",
    "scale_factor": 100
  }
};
```

---

### **Layer 7: 导出层**

**输入格式**：Layer 6的PNG帧序列 + 渲染配置
**输出格式**：
```json
{
  "timestamp": "2025-09-24T11:04:44.321Z",
  "export_result": {
    "success": true,
    "output_file": "physics_animation.mp4",
    "file_size": "2.5MB",
    "duration": 10.0,
    "resolution": "1200x800",
    "fps": 30,
    "codec": "h264",
    "bitrate": "2000kbps",
    "encoding_time": 3.2
  },
  "metadata": {
    "title": "Physics Animation",
    "description": "Generated from physics simulation",
    "creation_date": "2025-09-24T11:04:44.321Z",
    "simulation_params": {
      "total_time": 10.0,
      "total_steps": 1500,
      "physics_type": "multi_body_friction_system"
    }
  }
}
```

---

### **Layer 8: 集成测试层**

**输入格式**：完整的端到端测试配置
**输出格式**：
```json
{
  "timestamp": "2025-09-24T11:04:44.321Z",
  "integration_test_result": {
    "success": true,
    "total_time": 15.2,
    "layers": [
      {
        "layer": 1,
        "name": "AI解析层",
        "status": "passed",
        "execution_time": 2.1,
        "output_size": "15KB"
      },
      {
        "layer": 2,
        "name": "Contract适配层", 
        "status": "passed",
        "execution_time": 0.3,
        "output_size": "8KB"
      },
      {
        "layer": 3,
        "name": "验证层",
        "status": "passed",
        "execution_time": 0.1,
        "output_size": "2KB"
      },
      {
        "layer": 4,
        "name": "仿真层",
        "status": "passed",
        "execution_time": 2.5,
        "output_size": "45KB"
      },
      {
        "layer": 5,
        "name": "质量保证层",
        "status": "passed",
        "execution_time": 0.2,
        "output_size": "3KB"
      },
      {
        "layer": 6,
        "name": "渲染层",
        "status": "passed",
        "execution_time": 4.2,
        "output_size": "300 frames"
      },
      {
        "layer": 7,
        "name": "导出层",
        "status": "passed",
        "execution_time": 2.8,
        "output_size": "2.5MB"
      }
    ],
    "final_output": {
      "video_file": "physics_animation.mp4",
      "file_size": "2.5MB",
      "quality_score": 92,
      "physics_accuracy": 95
    }
  }
}
```

---

## 🔄 **数据流传递图**

```
输入: 自然语言物理问题
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: AI解析层                                          │
│ 输入: 自然语言字符串                                        │
│ 输出: AI解析结果 (JSON)                                     │
│ 包含: parameters, solutionPath, physicsType, formulas     │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Contract适配层                                     │
│ 输入: AI解析结果 (JSON)                                     │
│ 输出: PhysicsContract (JSON)                               │
│ 包含: world, surfaces, bodies, phases, simulation          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: 验证层                                            │
│ 输入: PhysicsContract (JSON)                              │
│ 输出: 验证报告 (JSON)                                      │
│ 包含: validation_result, corrected_contract               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: 仿真层                                            │
│ 输入: 验证通过的PhysicsContract (JSON)                     │
│ 输出: SimTrace (JSON)                                     │
│ 包含: traces, events, energy, final_state                 │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: 质量保证层                                         │
│ 输入: SimTrace + PhysicsContract (JSON)                    │
│ 输出: VCS报告 (JSON)                                       │
│ 包含: validity, consistency, stability, acceptance_tests │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: 渲染层                                            │
│ 输入: SimTrace + PhysicsContract (JSON)                   │
│ 输出: PNG帧序列 (文件)                                      │
│ 包含: frame_000.png, frame_001.png, ...                   │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 7: 导出层                                            │
│ 输入: PNG帧序列 (文件)                                      │
│ 输出: MP4视频 (文件)                                       │
│ 包含: physics_animation.mp4                                │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 8: 集成测试层                                         │
│ 输入: 完整测试配置                                          │
│ 输出: 集成测试报告 (JSON)                                  │
│ 包含: 各层执行状态、性能指标、最终输出                      │
└─────────────────────────────────────────────────────────────┘
    ↓
输出: 物理动画视频 + 完整测试报告
```

---

## 📋 **数据格式总结表**

| 层级 | 输入格式 | 输出格式 | 主要字段 | 文件大小 | 处理时间 |
|------|----------|----------|----------|----------|----------|
| **Layer 1** | 自然语言字符串 | AI解析结果 (JSON) | parameters, solutionPath, physicsType | ~15KB | 2-5秒 |
| **Layer 2** | AI解析结果 (JSON) | PhysicsContract (JSON) | world, surfaces, bodies, phases | ~8KB | 0.1-0.5秒 |
| **Layer 3** | PhysicsContract (JSON) | 验证报告 (JSON) | validation_result, corrected_contract | ~2KB | 0.05-0.2秒 |
| **Layer 4** | PhysicsContract (JSON) | SimTrace (JSON) | traces, events, energy, final_state | ~45KB | 1-10秒 |
| **Layer 5** | SimTrace + Contract (JSON) | VCS报告 (JSON) | validity, consistency, stability | ~3KB | 0.1-0.5秒 |
| **Layer 6** | SimTrace + Contract (JSON) | PNG帧序列 (文件) | frame_000.png, frame_001.png, ... | ~300帧 | 2-5秒 |
| **Layer 7** | PNG帧序列 (文件) | MP4视频 (文件) | physics_animation.mp4 | ~2.5MB | 1-3秒 |
| **Layer 8** | 完整测试配置 | 集成测试报告 (JSON) | 各层状态、性能指标 | ~5KB | 15-25秒 |

### **关键数据转换点**

1. **自然语言 → 结构化数据** (Layer 1)
   - 从非结构化文本提取物理参数和解题逻辑
   - 自动识别问题类型和常见错误模式

2. **抽象参数 → 具体仿真** (Layer 2)
   - 将AI解析结果转换为可执行的仿真契约
   - 生成具体的几何、物理和数值参数

3. **仿真契约 → 轨迹数据** (Layer 4)
   - 执行确定性物理仿真
   - 生成完整的状态历史和时间序列

4. **轨迹数据 → 视觉帧** (Layer 6)
   - 将数值轨迹转换为可视化图像
   - 处理坐标映射和渲染效果

5. **图像序列 → 视频文件** (Layer 7)
   - 使用FFmpeg编码生成最终视频
   - 添加元数据和压缩优化

---

## 🎯 使用指南

### 快速开始

1. **分层测试**：使用 `testing/test_layer1_ai.js` 到 `test_layer8_integration.js`
2. **AI解析**：使用 `ai_parsing/AIParsingService.js` 统一接口
3. **Contract适配**：使用 `dsl/adapter.js` 转换AI结果
4. **仿真执行**：使用 `simulation/engine.js` 进行物理仿真
5. **渲染导出**：使用 `rendering/rasterizer.js` 和 `export/ffmpeg.js`

### 分层测试指南

1. **Layer 1测试**：验证AI解析功能
   ```bash
   cd services/testing
   node test_layer1_ai.js
   ```

2. **Layer 2测试**：验证Contract转换
   ```bash
   node test_layer2_contract.js
   ```

3. **数据流测试**：验证AI到Adapter的数据流
   ```bash
   node test_ai_to_adapter.js
   ```

4. **完整集成测试**：验证端到端流程
   ```bash
   node test_layer8_integration.js
   ```

### 核心接口

```javascript
// 1. AI解析（使用统一接口）
const aiService = new AIParsingService();
const aiResult = await aiService.parsePhysicsQuestion(question);

// 2. Contract适配
const adapter = new ContractAdapter();
const contract = adapter.adapt(aiResult);

// 3. Pre-Sim验证
const validator = new ContractValidator();
const presimReport = validator.validate(contract);

// 4. 仿真执行
const engine = new SimulationEngine();
const simTrace = engine.simulate(contract);

// 5. Post-Sim验证
const vcs = new VCS();
const vcsReport = vcs.evaluate(simTrace, contract);

// 6. 渲染
const rasterizer = new FrameRasterizer();
const frames = rasterizer.render(simTrace, contract);

// 7. 导出
const encoder = new FFmpegEncoder();
const video = await encoder.encode(frames);
```

### 数据流验证接口

```javascript
// AI解析到Adapter数据流测试
const tester = new AIToAdapterTester();
await tester.testAIToAdapterFlow();

// 分层测试接口
const layer1Tester = new Layer1AITester();
await layer1Tester.runTests();
```

---

## 🔧 配置和扩展

### 环境变量

```bash
# AI API配置
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_api_key

# 渲染配置
RENDER_WIDTH=1200
RENDER_HEIGHT=800
RENDER_FPS=30

# 导出配置
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### 扩展点

1. **新力模型**：在 `dsl/registry/forces.js` 中添加
2. **新表面类型**：在 `dsl/registry/surfaces.js` 中添加
3. **新验收测试**：在 `qa/acceptance/` 中添加
4. **新渲染效果**：在 `rendering/` 中扩展

---

## 📊 性能指标

### 典型性能

- **AI解析**：1-3秒
- **Contract验证**：<100ms
- **仿真执行**：0.5-2秒
- **渲染**：2-5秒
- **视频导出**：1-3秒
- **总耗时**：5-15秒

### 优化建议

1. **并行处理**：AI解析和预处理并行
2. **缓存机制**：缓存常用Contract模板
3. **增量渲染**：只渲染变化帧
4. **压缩优化**：优化视频编码参数

---

## 🐛 常见问题

### 1. 渲染问题
- **斜面不显示**：检查 `surfaces` 定义和 `render_hints`
- **物体位置错误**：检查坐标系统和边界计算
- **碰撞不可见**：检查碰撞阶段的帧数和视觉效果

### 2. 仿真问题
- **能量爆炸**：检查积分器步长和数值稳定性
- **阶段切换错误**：检查守卫条件和事件检测
- **VCS评分低**：检查验收测试和物理参数

### 3. 导出问题
- **FFmpeg错误**：检查FFmpeg安装和路径
- **视频质量差**：调整编码参数
- **文件过大**：优化帧率和分辨率

---

## 📚 相关文档

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 整体架构文档
- [core-pipeline.md](core-pipeline.md) - 核心管道文档
- [RENDERING_STANDARDS.md](../rendering/RENDERING_STANDARDS.md) - 渲染标准

---

## 🔄 版本历史

- **v4.2.0**：当前版本，包含分层测试架构和AI解析增强
  - 新增AIParsingService统一接口
  - 实现参数符号冲突自动解决
  - 添加分层测试架构（test_layer1_ai.js到test_layer8_integration.js）
  - 增强Contract Schema支持多物体多阶段
  - 完善数据流验证（test_ai_to_adapter.js）
- **v4.1.0**：Contract-based架构完善版本
- **v4.0.0**：基础架构版本
- **v3.0.0**：IR层架构
- **v2.0.0**：模块化重构

---

*最后更新：2024年12月*
