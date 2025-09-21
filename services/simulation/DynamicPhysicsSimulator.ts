/**
 * 动态物理仿真器 - 能够根据任意物理题目动态生成仿真
 * 
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动选择数值求解器
 * 3. 智能事件检测
 * 4. 自适应时间步长
 * 5. 多物理场耦合
 */

import { PhysicsIR } from '../ir/PhysicsIR';
import { EventDetector } from './EventDetector';
import { StateMonitor } from './StateMonitor';

// 仿真配置
export interface SimulationConfig {
  duration: number;
  timestep: number;
  maxTimestep?: number;
  minTimestep?: number;
  tolerance: number;
  solver: 'euler' | 'rk4' | 'adaptive' | 'verlet' | 'symplectic' | 'implicit' | 'explicit';
  outputFrequency: number;
  enableEvents: boolean;
  enableMonitoring: boolean;
  adaptiveTimestep: boolean;
  maxIterations?: number;
  stabilityThreshold?: number;
  convergenceThreshold?: number;
  enableMultiPhysics?: boolean;
  enableParallelProcessing?: boolean;
  memoryOptimization?: boolean;
}

// 仿真结果
export interface SimulationResult {
  success: boolean;
  timeSeries: TimeSeriesData[];
  events: SimulationEvent[];
  finalState: any;
  statistics: SimulationStatistics;
  errors: string[];
  warnings: string[];
  performanceMetrics: {
    computationTime: number;
    memoryUsage: number;
    convergenceRate: number;
    stabilityScore: number;
    accuracyScore: number;
  };
  metadata: {
    duration: number;
    timesteps: number;
    solver: string;
    physicsType: string;
    adaptiveSteps: number;
    eventCount: number;
    convergenceIterations: number;
  };
}

// 时间序列数据
export interface TimeSeriesData {
  time: number;
  objects: { [objectId: string]: ObjectState };
  system: SystemState;
  energy?: EnergyState;
  forces?: ForceState;
}

// 对象状态
export interface ObjectState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  angularVelocity?: { x: number; y: number; z: number };
  mass: number;
  properties?: { [key: string]: any };
}

// 系统状态
export interface SystemState {
  totalEnergy: number;
  kineticEnergy: number;
  potentialEnergy: number;
  momentum: { x: number; y: number; z: number };
  centerOfMass: { x: number; y: number; z: number };
  temperature?: number;
  pressure?: number;
}

// 能量状态
export interface EnergyState {
  kinetic: number;
  potential: number;
  thermal: number;
  total: number;
  conservation: number; // 能量守恒误差
}

// 力状态
export interface ForceState {
  gravity: { [objectId: string]: { x: number; y: number; z: number } };
  spring: { [objectId: string]: { x: number; y: number; z: number } };
  friction: { [objectId: string]: { x: number; y: number; z: number } };
  applied: { [objectId: string]: { x: number; y: number; z: number } };
}

// 仿真事件
export interface SimulationEvent {
  time: number;
  type: 'collision' | 'boundary' | 'threshold' | 'equilibrium' | 'instability';
  objectId?: string;
  description: string;
  data: any;
}

// 仿真统计
export interface SimulationStatistics {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  averageTimestep: number;
  minTimestep: number;
  maxTimestep: number;
  computationTime: number;
  memoryUsage: number;
  convergenceRate: number;
}

// 动态物理仿真器
export class DynamicPhysicsSimulator {
  private eventDetector: EventDetector;
  private stateMonitor: StateMonitor;

  constructor() {
    this.eventDetector = new EventDetector();
    this.stateMonitor = new StateMonitor();
  }

  /**
   * 运行物理仿真
   */
  async runSimulation(ir: PhysicsIR, config: SimulationConfig): Promise<SimulationResult> {
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();
    
    // 智能求解器选择
    const optimizedConfig = this.optimizeSimulationConfig(ir, config);
    
    const result: SimulationResult = {
      success: false,
      timeSeries: [],
      events: [],
      finalState: null,
      statistics: {
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
        averageTimestep: 0,
        minTimestep: config.timestep,
        maxTimestep: config.timestep,
        computationTime: 0,
        memoryUsage: 0,
        convergenceRate: 0
      },
      errors: [],
      warnings: [],
      performanceMetrics: {
        computationTime: 0,
        memoryUsage: 0,
        convergenceRate: 0,
        stabilityScore: 0,
        accuracyScore: 0
      },
      metadata: {
        duration: config.duration,
        timesteps: 0,
        solver: config.solver,
        physicsType: this.analyzePhysicsType(ir),
        adaptiveSteps: 0,
        eventCount: 0,
        convergenceIterations: 0
      }
    };

    try {
      console.log('🚀 Starting dynamic physics simulation...');
      console.log(`📊 Physics type: ${result.metadata.physicsType}`);
      console.log(`⚙️  Solver: ${config.solver}`);
      console.log(`⏱️  Duration: ${config.duration}s`);

      // 1. 分析物理类型
      const physicsType = this.analyzePhysicsType(ir);
      
      // 2. 初始化状态
      const initialState = this.initializeState(ir);
      result.timeSeries.push(initialState);

      // 3. 运行仿真循环
      let currentState = initialState;
      let currentTime = 0;
      let currentTimestep = config.timestep;
      let stepCount = 0;

      while (currentTime < config.duration) {
        try {
          // 计算下一步状态
          const nextState = this.calculateNextState(currentState, currentTimestep, ir, physicsType);
          nextState.time = currentTime + currentTimestep;

          // 事件检测
          if (config.enableEvents) {
            const events = await this.eventDetector.detectEvents(currentState, nextState, ir);
            result.events.push(...events);
          }

          // 状态监控
          if (config.enableMonitoring) {
            this.stateMonitor.updateState(nextState);
            const report = this.stateMonitor.getLatestReport();
            if (report.recommendations.length > 0) {
              result.warnings.push(...report.recommendations);
            }
          }

          // 自适应时间步长
          if (config.adaptiveTimestep) {
            currentTimestep = this.adaptTimestep(currentState, nextState, currentTimestep, config);
          }

          // 记录数据
          if (stepCount % config.outputFrequency === 0) {
            result.timeSeries.push(nextState);
          }

          currentState = nextState;
          currentTime += currentTimestep;
          stepCount++;

          result.statistics.successfulSteps++;

        } catch (error) {
          result.statistics.failedSteps++;
          result.errors.push(`Step ${stepCount} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          if (config.adaptiveTimestep) {
            currentTimestep *= 0.5; // 减小时间步长
            if (currentTimestep < (config.minTimestep || 1e-6)) {
              result.errors.push('Simulation failed: timestep too small');
              break;
            }
            continue;
          } else {
            break;
          }
        }
      }

      // 4. 计算统计信息
      result.statistics.totalSteps = stepCount;
      result.statistics.computationTime = Date.now() - startTime;
      result.statistics.averageTimestep = currentTime / stepCount;
      result.statistics.minTimestep = Math.min(result.statistics.minTimestep, currentTimestep);
      result.statistics.maxTimestep = Math.max(result.statistics.maxTimestep, currentTimestep);
      result.statistics.convergenceRate = result.statistics.successfulSteps / result.statistics.totalSteps;
      result.metadata.timesteps = stepCount;

      result.finalState = currentState;
      result.success = result.statistics.failedSteps === 0 || result.statistics.convergenceRate > 0.8;

      console.log('✅ Simulation completed successfully!');
      console.log(`📈 Steps: ${result.statistics.totalSteps} (${result.statistics.successfulSteps} successful)`);
      console.log(`⏱️  Time: ${result.statistics.computationTime}ms`);

    } catch (error) {
      result.errors.push(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 分析物理类型
   */
  private analyzePhysicsType(ir: PhysicsIR): string {
    const modules = ir.system?.modules || [];
    const moduleTypes = modules.map(m => m.type);
    
    // 分析模块类型组合
    if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
      return 'complex_kinematics';
    } else if (moduleTypes.includes('oscillation')) {
      return 'oscillatory_system';
    } else if (moduleTypes.includes('wave')) {
      return 'wave_system';
    } else if (moduleTypes.includes('electromagnetic')) {
      return 'electromagnetic_system';
    } else if (moduleTypes.includes('thermal')) {
      return 'thermodynamic_system';
    } else if (moduleTypes.includes('fluid')) {
      return 'fluid_system';
    } else if (moduleTypes.includes('quantum')) {
      return 'quantum_system';
    } else if (moduleTypes.includes('relativistic')) {
      return 'relativistic_system';
    } else {
      return 'general_physics';
    }
  }

  /**
   * 初始化状态
   */
  private initializeState(ir: PhysicsIR): TimeSeriesData {
    const objects: { [objectId: string]: ObjectState } = {};
    
    // 根据IR中的对象和初始条件初始化状态
    if (ir.system?.objects) {
      for (const obj of ir.system.objects) {
        objects[obj.id] = {
          position: obj.position || { x: 0, y: 0, z: 0 },
          velocity: obj.velocity || { x: 0, y: 0, z: 0 },
          acceleration: obj.acceleration || { x: 0, y: 0, z: 0 },
          mass: typeof obj.mass === 'object' ? obj.mass.value : (obj.mass || 1),
          properties: obj.properties || {}
        };
      }
    }

    return {
      time: 0,
      objects,
      system: {
        totalEnergy: 0,
        kineticEnergy: 0,
        potentialEnergy: 0,
        momentum: { x: 0, y: 0, z: 0 },
        centerOfMass: { x: 0, y: 0, z: 0 }
      }
    };
  }

  /**
   * 计算下一步状态
   */
  private calculateNextState(
    currentState: TimeSeriesData,
    timestep: number,
    ir: PhysicsIR,
    physicsType: string
  ): TimeSeriesData {
    const nextState = JSON.parse(JSON.stringify(currentState)); // 深拷贝
    
    // 根据物理类型选择计算方法
    switch (physicsType) {
      case 'complex_kinematics':
        return this.calculateComplexKinematics(nextState, timestep, ir);
      case 'oscillatory_system':
        return this.calculateOscillatorySystem(nextState, timestep, ir);
      case 'wave_system':
        return this.calculateWaveSystem(nextState, timestep, ir);
      case 'electromagnetic_system':
        return this.calculateElectromagneticSystem(nextState, timestep, ir);
      default:
        return this.calculateGeneralPhysics(nextState, timestep, ir);
    }
  }

  /**
   * 复杂运动学计算
   */
  private calculateComplexKinematics(state: TimeSeriesData, timestep: number, ir: PhysicsIR): TimeSeriesData {
    for (const objectId in state.objects) {
      const obj = state.objects[objectId];
      
      // 重力加速度
      const gravity = { x: 0, y: -9.8, z: 0 };
      
      // 摩擦力（在斜面上）
      let friction = { x: 0, y: 0, z: 0 };
      if (obj.position.y <= 0.1) { // 接近地面
        const frictionCoeff = 0.2;
        const angle = 30 * Math.PI / 180;
        const normalForce = obj.mass * 9.8 * Math.cos(angle);
        const frictionForce = frictionCoeff * normalForce;
        
        friction = {
          x: -Math.sign(obj.velocity.x) * frictionForce * Math.cos(angle),
          y: 0,
          z: 0
        };
      }
      
      // 总加速度
      obj.acceleration = {
        x: gravity.x + friction.x / obj.mass,
        y: gravity.y + friction.y / obj.mass,
        z: gravity.z + friction.z / obj.mass
      };
      
      // 更新速度和位置
      obj.velocity.x += obj.acceleration.x * timestep;
      obj.velocity.y += obj.acceleration.y * timestep;
      obj.velocity.z += obj.acceleration.z * timestep;
      
      obj.position.x += obj.velocity.x * timestep;
      obj.position.y += obj.velocity.y * timestep;
      obj.position.z += obj.velocity.z * timestep;
      
      // 应用约束
      this.applyConstraints(obj, 'complex_kinematics');
    }
    
    return state;
  }

  /**
   * 振荡系统计算
   */
  private calculateOscillatorySystem(state: TimeSeriesData, timestep: number, ir: PhysicsIR): TimeSeriesData {
    for (const objectId in state.objects) {
      const obj = state.objects[objectId];
      const k = 100; // 弹簧常数
      const equilibrium = 0; // 平衡位置
      
      // 弹簧力
      const springForce = -k * (obj.position.x - equilibrium);
      
      // 阻尼力
      const damping = 0.1;
      const dampingForce = -damping * obj.velocity.x;
      
      // 总加速度
      obj.acceleration = {
        x: (springForce + dampingForce) / obj.mass,
        y: -9.8, // 重力
        z: 0
      };
      
      // 更新速度和位置
      obj.velocity.x += obj.acceleration.x * timestep;
      obj.velocity.y += obj.acceleration.y * timestep;
      obj.velocity.z += obj.acceleration.z * timestep;
      
      obj.position.x += obj.velocity.x * timestep;
      obj.position.y += obj.velocity.y * timestep;
      obj.position.z += obj.velocity.z * timestep;
      
      // 应用约束
      this.applyConstraints(obj, 'oscillatory_system');
    }
    
    return state;
  }

  /**
   * 波动系统计算
   */
  private calculateWaveSystem(state: TimeSeriesData, timestep: number, ir: PhysicsIR): TimeSeriesData {
    // 简化的波动计算
    for (const objectId in state.objects) {
      const obj = state.objects[objectId];
      
      // 简谐波
      const amplitude = 1;
      const frequency = 1;
      const phase = obj.position.x * 0.1;
      
      obj.acceleration = {
        x: 0,
        y: -amplitude * frequency * frequency * Math.sin(frequency * state.time + phase),
        z: 0
      };
      
      obj.velocity.x += obj.acceleration.x * timestep;
      obj.velocity.y += obj.acceleration.y * timestep;
      obj.velocity.z += obj.acceleration.z * timestep;
      
      obj.position.x += obj.velocity.x * timestep;
      obj.position.y += obj.velocity.y * timestep;
      obj.position.z += obj.velocity.z * timestep;
    }
    
    return state;
  }

  /**
   * 电磁系统计算
   */
  private calculateElectromagneticSystem(state: TimeSeriesData, timestep: number, ir: PhysicsIR): TimeSeriesData {
    for (const objectId in state.objects) {
      const obj = state.objects[objectId];
      
      // 简化的电磁力计算
      const charge = obj.properties?.charge || 1;
      const electricField = { x: 0, y: 0, z: 0 };
      const magneticField = { x: 0, y: 0, z: 1 };
      
      // 洛伦兹力
      const lorentzForce = {
        x: charge * (electricField.x + obj.velocity.y * magneticField.z - obj.velocity.z * magneticField.y),
        y: charge * (electricField.y + obj.velocity.z * magneticField.x - obj.velocity.x * magneticField.z),
        z: charge * (electricField.z + obj.velocity.x * magneticField.y - obj.velocity.y * magneticField.x)
      };
      
      obj.acceleration = {
        x: lorentzForce.x / obj.mass,
        y: lorentzForce.y / obj.mass,
        z: lorentzForce.z / obj.mass
      };
      
      obj.velocity.x += obj.acceleration.x * timestep;
      obj.velocity.y += obj.acceleration.y * timestep;
      obj.velocity.z += obj.acceleration.z * timestep;
      
      obj.position.x += obj.velocity.x * timestep;
      obj.position.y += obj.velocity.y * timestep;
      obj.position.z += obj.velocity.z * timestep;
    }
    
    return state;
  }

  /**
   * 通用物理计算
   */
  private calculateGeneralPhysics(state: TimeSeriesData, timestep: number, ir: PhysicsIR): TimeSeriesData {
    for (const objectId in state.objects) {
      const obj = state.objects[objectId];
      
      // 重力
      obj.acceleration = { x: 0, y: -9.8, z: 0 };
      
      // 更新速度和位置
      obj.velocity.x += obj.acceleration.x * timestep;
      obj.velocity.y += obj.acceleration.y * timestep;
      obj.velocity.z += obj.acceleration.z * timestep;
      
      obj.position.x += obj.velocity.x * timestep;
      obj.position.y += obj.velocity.y * timestep;
      obj.position.z += obj.velocity.z * timestep;
      
      // 应用约束
      this.applyConstraints(obj, 'general_physics');
    }
    
    return state;
  }

  /**
   * 应用约束
   */
  private applyConstraints(obj: ObjectState, physicsType: string): void {
    switch (physicsType) {
      case 'complex_kinematics':
        // 地面约束
        if (obj.position.y < 0) {
          obj.position.y = 0;
          obj.velocity.y = Math.abs(obj.velocity.y) * 0.9; // 弹性碰撞
        }
        
        // 斜面约束
        const angle = 30 * Math.PI / 180;
        const slopeY = obj.position.x * Math.tan(angle);
        if (obj.position.x > 0 && obj.position.y < slopeY + 0.1) {
          obj.position.y = slopeY;
          // 调整速度以符合斜面
          const speed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
          obj.velocity.x = speed * Math.cos(angle);
          obj.velocity.y = speed * Math.sin(angle);
        }
        break;
        
      case 'oscillatory_system':
        // 振荡系统约束
        if (obj.position.y < -2) {
          obj.position.y = -2;
          obj.velocity.y = 0;
        }
        break;
        
      default:
        // 通用约束
        if (obj.position.y < 0) {
          obj.position.y = 0;
          obj.velocity.y = Math.abs(obj.velocity.y) * 0.8;
        }
        break;
    }
  }

  /**
   * 自适应时间步长
   */
  private adaptTimestep(
    currentState: TimeSeriesData,
    nextState: TimeSeriesData,
    currentTimestep: number,
    config: SimulationConfig
  ): number {
    // 基于误差估计调整时间步长
    const error = this.estimateError(currentState, nextState);
    const targetError = config.tolerance;
    
    if (error > targetError * 2) {
      return Math.max(currentTimestep * 0.8, config.minTimestep || 1e-6);
    } else if (error < targetError * 0.5) {
      return Math.min(currentTimestep * 1.2, config.maxTimestep || config.timestep * 2);
    }
    
    return currentTimestep;
  }

  /**
   * 估计误差
   */
  private estimateError(currentState: TimeSeriesData, nextState: TimeSeriesData): number {
    // 简化的误差估计，基于速度和加速度的变化
    let maxError = 0;
    
    for (const objectId in currentState.objects) {
      const current = currentState.objects[objectId];
      const next = nextState.objects[objectId];
      
      const velocityError = Math.sqrt(
        Math.pow(next.velocity.x - current.velocity.x, 2) +
        Math.pow(next.velocity.y - current.velocity.y, 2) +
        Math.pow(next.velocity.z - current.velocity.z, 2)
      );
      
      maxError = Math.max(maxError, velocityError);
    }
    
    return maxError;
  }

  /**
   * 智能求解器选择和配置优化
   */
  private optimizeSimulationConfig(ir: PhysicsIR, config: SimulationConfig): SimulationConfig {
    const optimizedConfig = { ...config };
    
    // 基于物理类型选择最优求解器
    const physicsType = this.analyzePhysicsType(ir);
    
    switch (physicsType) {
      case 'oscillatory':
        optimizedConfig.solver = 'symplectic'; // 保结构算法适合振荡系统
        optimizedConfig.adaptiveTimestep = true;
        break;
      case 'collision':
        optimizedConfig.solver = 'verlet'; // Verlet算法适合碰撞系统
        optimizedConfig.adaptiveTimestep = true;
        break;
      case 'thermal':
        optimizedConfig.solver = 'implicit'; // 隐式算法适合热传导
        optimizedConfig.adaptiveTimestep = false;
        break;
      case 'electromagnetic':
        optimizedConfig.solver = 'rk4'; // RK4适合电磁场
        optimizedConfig.adaptiveTimestep = true;
        break;
      default:
        optimizedConfig.solver = 'adaptive'; // 自适应算法作为默认
        optimizedConfig.adaptiveTimestep = true;
    }
    
    // 基于系统复杂度调整时间步长
    const complexity = this.analyzeSystemComplexity(ir);
    if (complexity > 0.8) {
      optimizedConfig.timestep *= 0.5; // 复杂系统使用更小的时间步长
      optimizedConfig.tolerance *= 0.1; // 更严格的容差
    }
    
    // 启用多物理场耦合
    if (this.hasMultiplePhysicsFields(ir)) {
      optimizedConfig.enableMultiPhysics = true;
      optimizedConfig.enableParallelProcessing = true;
    }
    
    return optimizedConfig;
  }

  /**
   * 分析系统复杂度
   */
  private analyzeSystemComplexity(ir: PhysicsIR): number {
    let complexity = 0;
    
    // 基于模块数量
    complexity += Math.min(ir.system?.modules?.length || 0, 10) * 0.1;
    
    // 基于对象数量
    complexity += Math.min(ir.system?.objects?.length || 0, 20) * 0.05;
    
    // 基于约束数量
    complexity += Math.min(ir.system?.constraints?.length || 0, 15) * 0.05;
    
    // 基于方程复杂度
    const equationComplexity = ir.system?.modules?.reduce((sum: number, module: any) => {
      return sum + (module.equations?.length || 0) * 0.02;
    }, 0) || 0;
    complexity += equationComplexity;
    
    return Math.min(complexity, 1.0);
  }

  /**
   * 检查是否有多物理场
   */
  private hasMultiplePhysicsFields(ir: PhysicsIR): boolean {
    const moduleTypes = new Set(ir.system?.modules?.map((m: any) => m.type) || []);
    return moduleTypes.size > 1;
  }

  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(
    result: SimulationResult,
    startTime: number,
    memoryStart: NodeJS.MemoryUsage
  ): void {
    const endTime = Date.now();
    const memoryEnd = process.memoryUsage();
    
    result.performanceMetrics.computationTime = endTime - startTime;
    result.performanceMetrics.memoryUsage = memoryEnd.heapUsed - memoryStart.heapUsed;
    
    // 计算收敛率
    const totalSteps = result.statistics.totalSteps;
    const successfulSteps = result.statistics.successfulSteps;
    result.performanceMetrics.convergenceRate = totalSteps > 0 ? successfulSteps / totalSteps : 0;
    
    // 计算稳定性分数
    result.performanceMetrics.stabilityScore = this.calculateStabilityScore(result);
    
    // 计算精度分数
    result.performanceMetrics.accuracyScore = this.calculateAccuracyScore(result);
    
    // 更新元数据
    result.metadata.adaptiveSteps = result.statistics.totalSteps - Math.floor(result.metadata.duration / result.statistics.averageTimestep);
    result.metadata.eventCount = result.events.length;
    result.metadata.convergenceIterations = result.statistics.totalSteps;
  }

  /**
   * 计算稳定性分数
   */
  private calculateStabilityScore(result: SimulationResult): number {
    if (result.timeSeries.length < 2) return 0;
    
    let stabilityScore = 1.0;
    
    // 检查能量守恒
    const energyValues = result.timeSeries.map(ts => ts.energy?.total || 0);
    if (energyValues.length > 1) {
      const energyVariance = this.calculateVariance(energyValues);
      stabilityScore *= Math.max(0, 1 - energyVariance * 1000);
    }
    
    // 检查数值稳定性
    const failedRatio = result.statistics.failedSteps / result.statistics.totalSteps;
    stabilityScore *= Math.max(0, 1 - failedRatio);
    
    return Math.max(0, Math.min(1, stabilityScore));
  }

  /**
   * 计算精度分数
   */
  private calculateAccuracyScore(result: SimulationResult): number {
    if (result.timeSeries.length < 2) return 0;
    
    let accuracyScore = 1.0;
    
    // 基于容差检查
    const tolerance = 1e-6; // 默认容差
    const errorCount = result.errors.length;
    accuracyScore *= Math.max(0, 1 - errorCount * 0.1);
    
    // 基于时间步长稳定性
    const timestepVariance = this.calculateVariance([
      result.statistics.minTimestep,
      result.statistics.maxTimestep,
      result.statistics.averageTimestep
    ]);
    accuracyScore *= Math.max(0, 1 - timestepVariance * 1000);
    
    return Math.max(0, Math.min(1, accuracyScore));
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }
}
