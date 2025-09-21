/**
 * DSL优化器 - 基于仿真结果自动优化DSL配置
 * 
 * 功能：
 * 1. 性能优化
 * 2. 精度优化
 * 3. 稳定性优化
 * 4. 自动参数调整
 */

import { SimulationResult } from '../simulation/DynamicPhysicsSimulator';
import { PhysicsIR } from '../ir/PhysicsIR';
import { PhysicsValidationResult } from '../validation/PhysicsValidator';
import { SelfCheckResult } from '../validation/ResultValidator';

// 优化配置
export interface OptimizationConfig {
  objectives: {
    performance: boolean;
    accuracy: boolean;
    stability: boolean;
    efficiency: boolean;
    robustness: boolean;
    scalability: boolean;
  };
  constraints: {
    maxComputationTime: number;
    minAccuracy: number;
    minStability: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
    minConvergenceRate: number;
  };
  methods: {
    parameterTuning: boolean;
    solverSelection: boolean;
    timeStepOptimization: boolean;
    convergenceOptimization: boolean;
    adaptiveOptimization: boolean;
    multiObjectiveOptimization: boolean;
    machineLearningOptimization: boolean;
  };
  iterations: {
    maxIterations: number;
    convergenceThreshold: number;
    earlyStopping: boolean;
    adaptiveIterations: boolean;
    parallelOptimization: boolean;
  };
}

// 优化结果
export interface OptimizationResult {
  success: boolean;
  optimizedDSL: any;
  improvements: {
    performance: number;
    accuracy: number;
    stability: number;
    robustness: number;
    scalability: number;
    efficiency: number;
  };
  changes: OptimizationChange[];
  metrics: {
    beforeOptimization: OptimizationMetrics;
    afterOptimization: OptimizationMetrics;
    improvementRatio: number;
  };
  iterations: number;
  convergenceHistory: number[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// 优化变更
export interface OptimizationChange {
  type: 'parameter' | 'solver' | 'timeStep' | 'convergence' | 'constraint';
  parameter: string;
  oldValue: any;
  newValue: any;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

// 优化指标
export interface OptimizationMetrics {
  computationTime: number;
  accuracy: number;
  stability: number;
  memoryUsage: number;
  convergenceRate: number;
  energyConservation: number;
  momentumConservation: number;
  efficiency: number;
}

// DSL优化器类
export class DSLOptimizer {
  private config: OptimizationConfig;
  private optimizationHistory: OptimizationResult[];

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      objectives: {
        performance: true,
        accuracy: true,
        stability: true,
        efficiency: true,
        robustness: true,
        scalability: true
      },
      constraints: {
        maxComputationTime: 30000,
        minAccuracy: 0.95,
        minStability: 0.9,
        maxMemoryUsage: 1000,
        maxErrorRate: 0.05,
        minConvergenceRate: 0.8
      },
      methods: {
        parameterTuning: true,
        solverSelection: true,
        timeStepOptimization: true,
        convergenceOptimization: true,
        adaptiveOptimization: true,
        multiObjectiveOptimization: true,
        machineLearningOptimization: false
      },
      iterations: {
        maxIterations: 10,
        convergenceThreshold: 0.01,
        earlyStopping: true,
        adaptiveIterations: true,
        parallelOptimization: false
      },
      ...config
    };

    this.optimizationHistory = [];
  }

  /**
   * 优化DSL配置
   */
  async optimizeDSL(
    originalDSL: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): Promise<OptimizationResult> {
    const result: OptimizationResult = {
      success: false,
      optimizedDSL: { ...originalDSL },
      improvements: {
        performance: 0,
        accuracy: 0,
        robustness: 0,
        scalability: 0,
        stability: 0,
        efficiency: 0
      },
      changes: [],
      metrics: {
        beforeOptimization: this.calculateMetrics(simulationResult, physicsValidation, selfCheck),
        afterOptimization: this.calculateMetrics(simulationResult, physicsValidation, selfCheck),
        improvementRatio: 0
      },
      iterations: 0,
      convergenceHistory: [],
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      console.log('🔄 Starting DSL optimization...');

      let currentDSL = { ...originalDSL };
      let bestDSL = { ...originalDSL };
      let bestScore = this.calculateOverallScore(result.metrics.beforeOptimization);
      let convergenceCount = 0;

      // 优化迭代
      for (let iteration = 0; iteration < this.config.iterations.maxIterations; iteration++) {
        console.log(`🔄 Optimization iteration ${iteration + 1}/${this.config.iterations.maxIterations}`);

        // 生成优化建议
        const suggestions = this.generateOptimizationSuggestions(
          currentDSL,
          simulationResult,
          physicsValidation,
          selfCheck
        );

        // 应用优化
        const optimizedDSL = this.applyOptimizations(currentDSL, suggestions);
        
        // 评估优化效果
        const optimizedMetrics = this.estimateOptimizedMetrics(optimizedDSL, result.metrics.beforeOptimization);
        const optimizedScore = this.calculateOverallScore(optimizedMetrics);

        // 检查是否改进
        if (optimizedScore > bestScore) {
          bestDSL = optimizedDSL;
          bestScore = optimizedScore;
          convergenceCount = 0;
          
          // 记录变更
          suggestions.forEach(suggestion => {
            result.changes.push({
              type: suggestion.type,
              parameter: suggestion.parameter,
              oldValue: suggestion.oldValue,
              newValue: suggestion.newValue,
              impact: suggestion.impact,
              description: suggestion.description
            });
          });
        } else {
          convergenceCount++;
        }

        currentDSL = optimizedDSL;
        result.convergenceHistory.push(optimizedScore);

        // 早停检查
        if (this.config.iterations.earlyStopping && convergenceCount >= 3) {
          console.log('🛑 Early stopping triggered');
          break;
        }

        // 收敛检查
        if (iteration > 0) {
          const improvement = Math.abs(optimizedScore - result.convergenceHistory[iteration - 1]);
          if (improvement < this.config.iterations.convergenceThreshold) {
            console.log('✅ Convergence achieved');
            break;
          }
        }
      }

      result.optimizedDSL = bestDSL;
      result.metrics.afterOptimization = this.estimateOptimizedMetrics(bestDSL, result.metrics.beforeOptimization);
      result.metrics.improvementRatio = (bestScore - this.calculateOverallScore(result.metrics.beforeOptimization)) / this.calculateOverallScore(result.metrics.beforeOptimization);
      result.iterations = result.convergenceHistory.length;
      result.success = result.metrics.improvementRatio > 0;

      // 计算改进
      result.improvements = this.calculateImprovements(result.metrics.beforeOptimization, result.metrics.afterOptimization);

      // 生成建议
      result.recommendations = this.generateRecommendations(result);

      // 保存到历史
      this.optimizationHistory.push(result);

      console.log(`✅ DSL optimization completed. Improvement: ${(result.metrics.improvementRatio * 100).toFixed(2)}%`);

    } catch (error) {
      result.errors.push(`DSL optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 性能优化建议
    if (this.config.objectives.performance && this.config.methods.parameterTuning) {
      suggestions.push(...this.generatePerformanceSuggestions(dsl, simulationResult));
    }

    // 精度优化建议
    if (this.config.objectives.accuracy && this.config.methods.timeStepOptimization) {
      suggestions.push(...this.generateAccuracySuggestions(dsl, simulationResult, physicsValidation));
    }

    // 稳定性优化建议
    if (this.config.objectives.stability && this.config.methods.solverSelection) {
      suggestions.push(...this.generateStabilitySuggestions(dsl, simulationResult, physicsValidation));
    }

    // 效率优化建议
    if (this.config.objectives.efficiency && this.config.methods.convergenceOptimization) {
      suggestions.push(...this.generateEfficiencySuggestions(dsl, simulationResult, selfCheck));
    }

    return suggestions;
  }

  /**
   * 生成性能优化建议
   */
  private generatePerformanceSuggestions(dsl: any, simulationResult: SimulationResult): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 时间步长优化
    if ((simulationResult.performanceMetrics?.computationTime || 0) > this.config.constraints.maxComputationTime) {
      const currentTimeStep = dsl.simulation?.time_step?.value || 0.01;
      const newTimeStep = Math.min(currentTimeStep * 1.5, 0.1);
      
      suggestions.push({
        type: 'timeStep',
        parameter: 'time_step',
        oldValue: currentTimeStep,
        newValue: newTimeStep,
        impact: 'high',
        description: 'Increase time step to improve performance'
      });
    }

    // 求解器优化
    if (simulationResult.statistics.totalSteps > 10000) {
      suggestions.push({
        type: 'solver',
        parameter: 'method',
        oldValue: dsl.simulation?.method || 'rk4',
        newValue: 'euler',
        impact: 'medium',
        description: 'Switch to Euler method for better performance'
      });
    }

    return suggestions;
  }

  /**
   * 生成精度优化建议
   */
  private generateAccuracySuggestions(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 能量守恒优化
    if (physicsValidation.conservationChecks.some(check => check.type === 'energy' && !check.passed)) {
      const currentTimeStep = dsl.simulation?.time_step?.value || 0.01;
      const newTimeStep = Math.max(currentTimeStep * 0.5, 0.001);
      
      suggestions.push({
        type: 'timeStep',
        parameter: 'time_step',
        oldValue: currentTimeStep,
        newValue: newTimeStep,
        impact: 'high',
        description: 'Reduce time step to improve energy conservation'
      });
    }

    // 求解器精度优化
    const energyCheck = physicsValidation.conservationChecks.find(check => check.type === 'energy');
    if (energyCheck && energyCheck.deviationPercent > 10) {
      suggestions.push({
        type: 'solver',
        parameter: 'method',
        oldValue: dsl.simulation?.method || 'euler',
        newValue: 'rk4',
        impact: 'high',
        description: 'Switch to RK4 method for better accuracy'
      });
    }

    return suggestions;
  }

  /**
   * 生成稳定性优化建议
   */
  private generateStabilitySuggestions(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 数值稳定性优化
    if (simulationResult.errors.length > 0) {
      const currentTimeStep = dsl.simulation?.time_step?.value || 0.01;
      const newTimeStep = Math.max(currentTimeStep * 0.8, 0.001);
      
      suggestions.push({
        type: 'timeStep',
        parameter: 'time_step',
        oldValue: currentTimeStep,
        newValue: newTimeStep,
        impact: 'high',
        description: 'Reduce time step to improve numerical stability'
      });
    }

    // 自适应步长
    if (!dsl.simulation?.adaptiveStepSize) {
      suggestions.push({
        type: 'parameter',
        parameter: 'adaptiveStepSize',
        oldValue: false,
        newValue: true,
        impact: 'medium',
        description: 'Enable adaptive step size for better stability'
      });
    }

    return suggestions;
  }

  /**
   * 生成效率优化建议
   */
  private generateEfficiencySuggestions(
    dsl: any,
    simulationResult: SimulationResult,
    selfCheck: SelfCheckResult
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 收敛优化
    if (simulationResult.metadata.convergenceIterations > 1000) {
      const currentTolerance = dsl.simulation?.tolerance || 1e-6;
      const newTolerance = Math.max(currentTolerance * 2, 1e-4);
      
      suggestions.push({
        type: 'convergence',
        parameter: 'tolerance',
        oldValue: currentTolerance,
        newValue: newTolerance,
        impact: 'medium',
        description: 'Relax tolerance to improve convergence efficiency'
      });
    }

    // 并行处理
    if (!dsl.simulation?.parallelProcessing && simulationResult.statistics.totalSteps > 5000) {
      suggestions.push({
        type: 'parameter',
        parameter: 'parallelProcessing',
        oldValue: false,
        newValue: true,
        impact: 'high',
        description: 'Enable parallel processing for better efficiency'
      });
    }

    return suggestions;
  }

  /**
   * 应用优化
   */
  private applyOptimizations(dsl: any, suggestions: OptimizationSuggestion[]): any {
    const optimizedDSL = { ...dsl };

    for (const suggestion of suggestions) {
      switch (suggestion.type) {
        case 'timeStep':
          if (!optimizedDSL.simulation) optimizedDSL.simulation = {};
          if (!optimizedDSL.simulation.time_step) optimizedDSL.simulation.time_step = {};
          optimizedDSL.simulation.time_step.value = suggestion.newValue;
          break;

        case 'solver':
          if (!optimizedDSL.simulation) optimizedDSL.simulation = {};
          optimizedDSL.simulation.method = suggestion.newValue;
          break;

        case 'parameter':
          if (!optimizedDSL.simulation) optimizedDSL.simulation = {};
          optimizedDSL.simulation[suggestion.parameter] = suggestion.newValue;
          break;

        case 'convergence':
          if (!optimizedDSL.simulation) optimizedDSL.simulation = {};
          optimizedDSL.simulation[suggestion.parameter] = suggestion.newValue;
          break;
      }
    }

    return optimizedDSL;
  }

  /**
   * 估算优化后的指标
   */
  private estimateOptimizedMetrics(dsl: any, baselineMetrics: OptimizationMetrics): OptimizationMetrics {
    const metrics = { ...baselineMetrics };

    // 基于DSL变化估算指标变化
    const timeStep = dsl.simulation?.time_step?.value || 0.01;
    const method = dsl.simulation?.method || 'rk4';
    const adaptiveStepSize = dsl.simulation?.adaptiveStepSize || false;
    const parallelProcessing = dsl.simulation?.parallelProcessing || false;

    // 计算时间步长影响
    const timeStepRatio = timeStep / 0.01;
    metrics.computationTime *= timeStepRatio;
    metrics.accuracy *= Math.sqrt(timeStepRatio);
    metrics.stability *= timeStepRatio;

    // 计算求解器影响
    switch (method) {
      case 'euler':
        metrics.computationTime *= 0.5;
        metrics.accuracy *= 0.8;
        metrics.stability *= 0.9;
        break;
      case 'rk4':
        metrics.computationTime *= 1.0;
        metrics.accuracy *= 1.0;
        metrics.stability *= 1.0;
        break;
      case 'adaptive':
        metrics.computationTime *= 1.2;
        metrics.accuracy *= 1.1;
        metrics.stability *= 1.2;
        break;
    }

    // 计算自适应步长影响
    if (adaptiveStepSize) {
      metrics.computationTime *= 1.1;
      metrics.accuracy *= 1.05;
      metrics.stability *= 1.1;
    }

    // 计算并行处理影响
    if (parallelProcessing) {
      metrics.computationTime *= 0.7;
      metrics.efficiency *= 1.3;
    }

    return metrics;
  }

  /**
   * 计算总体分数
   */
  private calculateOverallScore(metrics: OptimizationMetrics): number {
    const weights = {
      performance: 0.25,
      accuracy: 0.25,
      stability: 0.25,
      efficiency: 0.25
    };

    const performance = Math.max(0, 1 - metrics.computationTime / this.config.constraints.maxComputationTime);
    const accuracy = metrics.accuracy;
    const stability = metrics.stability;
    const efficiency = Math.max(0, 1 - metrics.memoryUsage / this.config.constraints.maxMemoryUsage);

    return performance * weights.performance +
           accuracy * weights.accuracy +
           stability * weights.stability +
           efficiency * weights.efficiency;
  }

  /**
   * 计算指标
   */
  private calculateMetrics(
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): OptimizationMetrics {
    return {
      computationTime: simulationResult.performanceMetrics?.computationTime || 0,
      accuracy: physicsValidation.overallScore,
      stability: selfCheck.overallScore,
      memoryUsage: this.estimateMemoryUsage(simulationResult),
      convergenceRate: simulationResult.performanceMetrics?.convergenceRate || 0,
      energyConservation: physicsValidation.validationMetrics?.energyConservation || 0,
      momentumConservation: physicsValidation.validationMetrics?.momentumConservation || 0,
      efficiency: Math.max(0, 1 - this.estimateMemoryUsage(simulationResult) / this.config.constraints.maxMemoryUsage)
    };
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(simulationResult: SimulationResult): number {
    const timeSeries = simulationResult.timeSeries;
    const dataPoints = timeSeries.length;
    const variablesPerPoint = timeSeries[0] ? Object.keys(timeSeries[0].objects).length * 6 : 0; // 每个对象6个变量
    const bytesPerNumber = 8;
    
    return (dataPoints * variablesPerPoint * bytesPerNumber) / (1024 * 1024);
  }

  /**
   * 计算改进
   */
  private calculateImprovements(
    before: OptimizationMetrics,
    after: OptimizationMetrics
  ): OptimizationResult['improvements'] {
    return {
      performance: (before.computationTime - after.computationTime) / before.computationTime,
      accuracy: (after.accuracy - before.accuracy) / before.accuracy,
      stability: (after.stability - before.stability) / before.stability,
      efficiency: (after.memoryUsage - before.memoryUsage) / before.memoryUsage,
      robustness: this.calculateRobustnessImprovement(before, after),
      scalability: this.calculateScalabilityImprovement(before, after)
    };
  }

  /**
   * 计算鲁棒性改进
   */
  private calculateRobustnessImprovement(before: OptimizationMetrics, after: OptimizationMetrics): number {
    // 基于稳定性和收敛率计算鲁棒性改进
    const beforeRobustness = before.stability * before.convergenceRate;
    const afterRobustness = after.stability * after.convergenceRate;
    return (afterRobustness - beforeRobustness) / Math.max(beforeRobustness, 0.01);
  }

  /**
   * 计算可扩展性改进
   */
  private calculateScalabilityImprovement(before: OptimizationMetrics, after: OptimizationMetrics): number {
    // 基于内存使用和计算时间计算可扩展性改进
    const beforeScalability = 1 / (before.memoryUsage * before.computationTime);
    const afterScalability = 1 / (after.memoryUsage * after.computationTime);
    return (afterScalability - beforeScalability) / beforeScalability;
  }

  /**
   * 自适应优化
   */
  private async performAdaptiveOptimization(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): Promise<any> {
    const optimizedDSL = { ...dsl };
    
    // 基于验证结果自适应调整参数
    if (physicsValidation.overallScore < 0.8) {
      // 如果物理验证分数低，调整时间步长和容差
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.time_step = Math.min(
          optimizedDSL.simulation.time_step * 0.5,
          optimizedDSL.simulation.time_step
        );
        optimizedDSL.simulation.tolerance = Math.max(
          optimizedDSL.simulation.tolerance * 0.1,
          1e-8
        );
      }
    }
    
    // 基于自检结果调整求解器
    if (selfCheck.overallScore < 0.7) {
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.solver = 'adaptive';
        optimizedDSL.simulation.adaptiveTimestep = true;
      }
    }
    
    // 基于性能指标调整输出频率
    if (simulationResult.performanceMetrics?.computationTime > 10000) {
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.outputFrequency = Math.max(
          optimizedDSL.simulation.outputFrequency * 2,
          10
        );
      }
    }
    
    return optimizedDSL;
  }

  /**
   * 多目标优化
   */
  private async performMultiObjectiveOptimization(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): Promise<any> {
    const optimizedDSL = { ...dsl };
    
    // 平衡多个目标：性能、精度、稳定性
    const weights = {
      performance: 0.3,
      accuracy: 0.4,
      stability: 0.3
    };
    
    // 计算综合分数
    const performanceScore = 1 - (simulationResult.performanceMetrics?.computationTime || 0) / 30000;
    const accuracyScore = physicsValidation.overallScore;
    const stabilityScore = selfCheck.overallScore;
    
    const combinedScore = 
      weights.performance * performanceScore +
      weights.accuracy * accuracyScore +
      weights.stability * stabilityScore;
    
    // 基于综合分数调整参数
    if (combinedScore < 0.6) {
      // 需要大幅优化
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.solver = 'rk4';
        optimizedDSL.simulation.adaptiveTimestep = true;
        optimizedDSL.simulation.tolerance = 1e-6;
      }
    } else if (combinedScore < 0.8) {
      // 需要适度优化
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.solver = 'adaptive';
        optimizedDSL.simulation.adaptiveTimestep = true;
      }
    }
    
    return optimizedDSL;
  }

  /**
   * 智能参数调优
   */
  private async performIntelligentParameterTuning(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): Promise<any> {
    const optimizedDSL = { ...dsl };
    
    // 基于物理类型智能选择参数
    const physicsType = dsl.metadata?.system_type || 'generic';
    
    switch (physicsType) {
      case 'oscillatory_system':
        // 振荡系统优化
        if (optimizedDSL.simulation) {
          optimizedDSL.simulation.solver = 'symplectic';
          optimizedDSL.simulation.adaptiveTimestep = true;
          optimizedDSL.simulation.tolerance = 1e-8;
        }
        break;
        
      case 'collision_system':
        // 碰撞系统优化
        if (optimizedDSL.simulation) {
          optimizedDSL.simulation.solver = 'verlet';
          optimizedDSL.simulation.adaptiveTimestep = true;
          optimizedDSL.simulation.tolerance = 1e-6;
        }
        break;
        
      case 'thermal_system':
        // 热传导系统优化
        if (optimizedDSL.simulation) {
          optimizedDSL.simulation.solver = 'implicit';
          optimizedDSL.simulation.adaptiveTimestep = false;
          optimizedDSL.simulation.tolerance = 1e-4;
        }
        break;
        
      default:
        // 默认优化
        if (optimizedDSL.simulation) {
          optimizedDSL.simulation.solver = 'adaptive';
          optimizedDSL.simulation.adaptiveTimestep = true;
          optimizedDSL.simulation.tolerance = 1e-6;
        }
    }
    
    return optimizedDSL;
  }

  /**
   * 收敛性优化
   */
  private async performConvergenceOptimization(
    dsl: any,
    simulationResult: SimulationResult
  ): Promise<any> {
    const optimizedDSL = { ...dsl };
    
    // 基于收敛率调整参数
    const convergenceRate = simulationResult.performanceMetrics?.convergenceRate || 0;
    
    if (convergenceRate < 0.8) {
      // 收敛率低，需要调整参数
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.tolerance = Math.max(
          optimizedDSL.simulation.tolerance * 0.1,
          1e-8
        );
        optimizedDSL.simulation.maxIterations = Math.min(
          optimizedDSL.simulation.maxIterations * 2,
          10000
        );
      }
    } else if (convergenceRate > 0.95) {
      // 收敛率很高，可以放宽参数以提高性能
      if (optimizedDSL.simulation) {
        optimizedDSL.simulation.tolerance = Math.min(
          optimizedDSL.simulation.tolerance * 10,
          1e-3
        );
        optimizedDSL.simulation.maxIterations = Math.max(
          optimizedDSL.simulation.maxIterations * 0.5,
          100
        );
      }
    }
    
    return optimizedDSL;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(result: OptimizationResult): string[] {
    const recommendations: string[] = [];

    if (result.improvements.performance > 0.1) {
      recommendations.push('Performance significantly improved');
    }

    if (result.improvements.accuracy > 0.1) {
      recommendations.push('Accuracy significantly improved');
    }

    if (result.improvements.stability > 0.1) {
      recommendations.push('Stability significantly improved');
    }

    if (result.improvements.efficiency > 0.1) {
      recommendations.push('Efficiency significantly improved');
    }

    if (result.metrics.improvementRatio < 0.05) {
      recommendations.push('Consider manual parameter tuning for better results');
    }

    return recommendations;
  }

  /**
   * 获取优化历史
   */
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

// 优化建议接口
interface OptimizationSuggestion {
  type: 'parameter' | 'solver' | 'timeStep' | 'convergence' | 'constraint';
  parameter: string;
  oldValue: any;
  newValue: any;
  impact: 'low' | 'medium' | 'high';
  description: string;
}
