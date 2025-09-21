# Simulation 模块详细分析

## 📁 目录结构

```
services/simulation/
├── PhysicsSimulator.ts      # 核心仿真引擎
├── EventDetector.ts         # 事件检测器
├── StateMonitor.ts          # 状态监控器
└── CollisionDetector.ts     # 碰撞检测器
```

## 🔧 各文件详细功能

### 1. PhysicsSimulator.ts - 核心仿真引擎

**主要作用**: 整个仿真系统的核心，负责协调所有仿真组件，执行数值计算。

#### 核心功能
- **多模块联立仿真**: 支持多个物理模块同时仿真
- **数值求解器集成**: 集成多种数值求解算法
- **事件检测和处理**: 与事件检测器协作处理仿真事件
- **仿真结果管理**: 管理仿真过程和结果数据
- **性能优化**: 自适应步长、并行处理等优化

#### 关键接口
```typescript
// 仿真配置
interface SimulationConfig {
  method: 'euler' | 'rk4' | 'verlet' | 'adaptive';
  timeStep: number;
  duration: number;
  tolerance: number;
  maxIterations: number;
  adaptiveStepSize: boolean;
  parallelProcessing: boolean;
}

// 仿真状态
interface SimulationState {
  time: number;
  variables: Map<string, number>;
  derivatives: Map<string, number>;
  events: SimulationEvent[];
  convergence: ConvergenceInfo;
}

// 仿真结果
interface SimulationResult {
  success: boolean;
  timeSeries: TimeSeriesData[];
  events: SimulationEvent[];
  finalState: SimulationState;
  metrics: SimulationMetrics;
  errors: string[];
  warnings: string[];
  computationTime: number;
}
```

#### 求解器实现
1. **EulerSolver**: 欧拉法求解器
   - 简单快速，适合简单系统
   - 精度较低，稳定性有限
   - 适用于实时仿真

2. **RK4Solver**: 四阶龙格-库塔法
   - 高精度，稳定性好
   - 计算量适中
   - 适用于大多数物理系统

3. **AdaptiveSolver**: 自适应步长求解器
   - 根据系统状态自动调整步长
   - 平衡精度和性能
   - 适用于复杂系统

#### 主要方法
- `runSimulation()`: 执行完整仿真
- `createInitialState()`: 创建初始状态
- `collectAllEquations()`: 收集所有方程
- `checkConvergence()`: 检查收敛性
- `calculateEnergy()`: 计算系统能量
- `calculateMomentum()`: 计算动量

---

### 2. EventDetector.ts - 事件检测器

**主要作用**: 检测仿真过程中发生的各种物理事件，如碰撞、状态变化等。

#### 核心功能
- **碰撞检测**: 检测物体间的碰撞事件
- **分离检测**: 检测物体分离事件
- **状态变化检测**: 检测速度、加速度等状态变化
- **边界穿越检测**: 检测物体穿越边界事件
- **自定义事件检测**: 检测用户定义的事件

#### 检测器类型
1. **CollisionDetector**: 碰撞检测器
   ```typescript
   // 检测物体间碰撞
   detectObjectCollisions(oldState, newState, ir): SimulationEvent[]
   
   // 检测边界碰撞
   detectBoundaryCollisions(oldState, newState, ir): SimulationEvent[]
   ```

2. **StateChangeDetector**: 状态变化检测器
   ```typescript
   // 检测速度方向变化
   detectVelocityDirectionChanges(oldState, newState, ir): SimulationEvent[]
   
   // 检测加速度变化
   detectAccelerationChanges(oldState, newState, ir): SimulationEvent[]
   
   // 检测能量变化
   detectEnergyChanges(oldState, newState, ir): SimulationEvent[]
   ```

3. **CustomEventDetector**: 自定义事件检测器
   ```typescript
   // 检测约束违反
   detectConstraintViolations(oldState, newState, ir): SimulationEvent[]
   
   // 检测阈值事件
   detectThresholdEvents(oldState, newState, ir): SimulationEvent[]
   ```

#### 事件类型
- `collision`: 碰撞事件
- `separation`: 分离事件
- `state_change`: 状态变化事件
- `boundary_crossing`: 边界穿越事件
- `custom`: 自定义事件

#### 严重程度分级
- `low`: 低严重程度
- `medium`: 中等严重程度
- `high`: 高严重程度
- `critical`: 严重程度

---

### 3. StateMonitor.ts - 状态监控器

**主要作用**: 监控仿真过程中的系统状态，检测异常，生成性能报告。

#### 核心功能
- **状态变化监控**: 实时监控系统状态变化
- **性能指标收集**: 收集仿真性能数据
- **异常状态检测**: 检测系统异常和发散
- **历史状态记录**: 记录状态历史用于分析
- **状态分析报告**: 生成详细的状态分析报告

#### 监控配置
```typescript
interface StateMonitorConfig {
  enableHistory: boolean;           // 启用历史记录
  maxHistorySize: number;          // 最大历史记录数
  enablePerformanceMonitoring: boolean; // 启用性能监控
  enableAnomalyDetection: boolean; // 启用异常检测
  anomalyThreshold: number;        // 异常阈值
  reportInterval: number;          // 报告间隔
}
```

#### 异常检测类型
1. **发散检测**: 检测变量指数增长
   ```typescript
   detectDivergence(state): AnomalyDetection | null
   ```

2. **振荡检测**: 检测系统振荡
   ```typescript
   detectOscillation(state): AnomalyDetection | null
   ```

3. **不稳定性检测**: 检测数值不稳定性
   ```typescript
   detectInstability(state): AnomalyDetection | null
   ```

4. **能量泄漏检测**: 检测能量非物理损失
   ```typescript
   detectEnergyLeak(state): AnomalyDetection | null
   ```

#### 性能指标
- **步长时间**: 每步计算时间
- **内存使用**: 内存占用情况
- **CPU使用**: CPU使用率
- **事件数量**: 检测到的事件数
- **收敛率**: 收敛速度
- **稳定性分数**: 数值稳定性评分

#### 分析报告
```typescript
interface StateAnalysisReport {
  timestamp: number;
  totalSteps: number;
  averageStepTime: number;
  totalEvents: number;
  anomalyCount: number;
  stabilityTrend: 'improving' | 'stable' | 'degrading';
  energyConservation: number;
  momentumConservation: number;
  recommendations: string[];
}
```

---

### 4. CollisionDetector.ts - 碰撞检测器

**主要作用**: 专门处理碰撞检测和响应计算，提供精确的碰撞物理模拟。

#### 核心功能
- **精确碰撞检测**: 支持多种几何体的碰撞检测
- **碰撞响应计算**: 计算碰撞后的物理响应
- **碰撞类型分类**: 区分不同类型的碰撞
- **碰撞参数计算**: 计算碰撞相关物理参数
- **碰撞优化**: 提供性能优化选项

#### 支持的几何体类型
- **球体 (Sphere)**: 最简单的碰撞检测
- **盒子 (Box)**: AABB碰撞检测
- **平面 (Plane)**: 无限平面碰撞
- **圆柱体 (Cylinder)**: 圆柱体碰撞
- **网格 (Mesh)**: 复杂几何体碰撞

#### 碰撞类型
```typescript
type CollisionType = 
  | 'elastic'              // 弹性碰撞
  | 'inelastic'            // 非弹性碰撞
  | 'perfectly_inelastic'  // 完全非弹性碰撞
  | 'explosive'            // 爆炸性碰撞
  | 'boundary'             // 边界碰撞
  | 'surface'              // 表面碰撞
  | 'penetration';         // 穿透碰撞
```

#### 检测阶段
1. **粗检测阶段 (Broad Phase)**:
   ```typescript
   broadPhaseDetection(objects): [CollisionObject, CollisionObject][]
   ```
   - 使用包围盒快速筛选可能的碰撞对
   - 大幅减少需要精确检测的对象对数量

2. **精检测阶段 (Narrow Phase)**:
   ```typescript
   narrowPhaseDetection(obj1, obj2, state): CollisionInfo | null
   ```
   - 精确计算碰撞点和碰撞参数
   - 支持多种几何体组合的碰撞检测

#### 碰撞响应计算
```typescript
interface CollisionResponse {
  newVelocity1: { x: number; y: number; z: number };
  newVelocity2: { x: number; y: number; z: number };
  newAngularVelocity1?: { x: number; y: number; z: number };
  newAngularVelocity2?: { x: number; y: number; z: number };
  energyLoss: number;
  momentumTransfer: { x: number; y: number; z: number };
}
```

#### 碰撞信息
```typescript
interface CollisionInfo {
  object1: CollisionObject;
  object2: CollisionObject;
  collisionPoint: { x: number; y: number; z: number };
  collisionNormal: { x: number; y: number; z: number };
  penetrationDepth: number;
  relativeVelocity: { x: number; y: number; z: number };
  collisionType: CollisionType;
  impulse: { x: number; y: number; z: number };
  energyLoss: number;
}
```

#### 优化选项
- **碰撞容差**: 控制碰撞检测精度
- **粗检测启用**: 是否使用粗检测阶段
- **精检测启用**: 是否使用精检测阶段
- **响应计算启用**: 是否计算碰撞响应

---

## 🔄 模块间协作关系

### 数据流向
```
PhysicsIR → PhysicsSimulator → EventDetector → SimulationEvent
     ↓              ↓              ↓
StateMonitor ← SimulationState ← CollisionDetector
     ↓
StateAnalysisReport
```

### 协作流程
1. **初始化阶段**:
   - `PhysicsSimulator` 接收 `PhysicsIR` 输入
   - 创建初始 `SimulationState`
   - 初始化 `EventDetector` 和 `StateMonitor`

2. **仿真循环**:
   - `PhysicsSimulator` 执行数值计算
   - `EventDetector` 检测各种事件
   - `CollisionDetector` 处理碰撞检测和响应
   - `StateMonitor` 监控状态和性能

3. **结果输出**:
   - `PhysicsSimulator` 生成 `SimulationResult`
   - `StateMonitor` 生成分析报告
   - 所有事件和状态数据汇总输出

### 关键接口
- `SimulationState`: 所有模块共享的状态数据结构
- `SimulationEvent`: 事件检测器的输出格式
- `SimulationResult`: 最终仿真结果
- `StateAnalysisReport`: 状态分析报告

---

## 🎯 使用场景

### 1. 简单物理系统
- 使用 `EulerSolver` 进行快速仿真
- 基本的 `EventDetector` 检测
- 简化的 `StateMonitor` 监控

### 2. 复杂物理系统
- 使用 `RK4Solver` 或 `AdaptiveSolver`
- 完整的 `EventDetector` 和 `CollisionDetector`
- 详细的 `StateMonitor` 分析

### 3. 实时交互系统
- 优化的碰撞检测
- 快速的事件响应
- 实时性能监控

### 4. 高精度仿真
- 自适应步长控制
- 详细的异常检测
- 完整的物理验证

---

## 🚀 性能优化

### 1. 计算优化
- **并行处理**: 支持多模块并行计算
- **自适应步长**: 根据系统复杂度调整步长
- **缓存机制**: 缓存计算结果减少重复计算

### 2. 内存优化
- **历史记录限制**: 限制状态历史记录大小
- **事件清理**: 定期清理过期事件
- **对象池**: 重用对象减少内存分配

### 3. 检测优化
- **粗检测**: 快速筛选可能的碰撞对
- **空间分割**: 使用空间数据结构加速检测
- **LOD系统**: 根据距离调整检测精度

---

## 📊 质量保证

### 1. 数值稳定性
- **收敛性检查**: 监控数值收敛性
- **稳定性分析**: 检测数值不稳定性
- **误差控制**: 控制累积误差

### 2. 物理一致性
- **能量守恒**: 监控能量守恒
- **动量守恒**: 检查动量守恒
- **物理约束**: 验证物理约束满足

### 3. 异常处理
- **异常检测**: 自动检测系统异常
- **错误恢复**: 提供错误恢复机制
- **警告系统**: 及时发出警告信息

---

## 🔮 扩展性

### 1. 新求解器
- 实现 `Solver` 接口
- 添加到 `PhysicsSimulator` 的求解器列表
- 支持新的数值方法

### 2. 新事件类型
- 扩展 `EventDetectorInterface`
- 实现特定的事件检测逻辑
- 注册到主事件检测器

### 3. 新几何体
- 扩展 `CollisionGeometry` 类型
- 实现对应的碰撞检测算法
- 支持更复杂的几何形状

### 4. 新监控指标
- 扩展 `PerformanceMetrics` 接口
- 实现新的监控逻辑
- 集成到状态监控系统

---

**总结**: Simulation 模块提供了完整的物理仿真解决方案，从核心数值计算到事件检测，从状态监控到碰撞处理，形成了一个功能完备、性能优化、质量保证的仿真系统。每个文件都有明确的职责分工，通过标准化的接口进行协作，支持从简单到复杂的各种物理仿真需求。
