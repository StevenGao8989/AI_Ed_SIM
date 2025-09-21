// services/feedback/MLOptimizer.ts
// 机器学习优化器：使用ML算法提升物理仿真参数调优效果

import type { OptimizationResult } from './DSLOptimizer';
import type { SimulationResult } from '../simulation/DynamicPhysicsSimulator';
import type { PhysicsValidationResult } from '../validation/PhysicsValidator';
import type { SelfCheckResult } from '../validation/ResultValidator';

/**
 * ML优化配置
 */
export interface MLOptimizationConfig {
  algorithm: 'genetic' | 'particle_swarm' | 'bayesian' | 'neural_network' | 'reinforcement_learning';
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  learningRate: number;
  enableAdaptive: boolean;
  enableEnsemble: boolean;
  targetMetrics: string[];
}

/**
 * ML模型接口
 */
export interface MLModel {
  id: string;
  type: string;
  parameters: Record<string, any>;
  trainingData: TrainingDataPoint[];
  performance: ModelPerformance;
}

/**
 * 训练数据点
 */
export interface TrainingDataPoint {
  input: {
    dslParameters: Record<string, any>;
    physicsType: string;
    complexity: number;
  };
  output: {
    simulationScore: number;
    validationScore: number;
    optimizationSuccess: boolean;
    convergenceTime: number;
  };
  metadata: {
    timestamp: number;
    problemId: string;
    source: string;
  };
}

/**
 * 模型性能
 */
export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  trainingTime: number;
  predictionTime: number;
}

/**
 * ML优化结果
 */
export interface MLOptimizationResult extends OptimizationResult {
  mlMetrics: {
    algorithm: string;
    convergenceGeneration: number;
    bestFitness: number;
    populationDiversity: number;
    explorationRatio: number;
    exploitationRatio: number;
  };
  modelPerformance: ModelPerformance;
  learningCurve: number[];
  featureImportance: Record<string, number>;
}

/**
 * 机器学习优化器
 */
export class MLOptimizer {
  private config: MLOptimizationConfig;
  private models: Map<string, MLModel> = new Map();
  private trainingHistory: TrainingDataPoint[] = [];

  constructor(config: Partial<MLOptimizationConfig> = {}) {
    this.config = {
      algorithm: 'genetic',
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      learningRate: 0.01,
      enableAdaptive: true,
      enableEnsemble: false,
      targetMetrics: ['accuracy', 'stability', 'performance'],
      ...config
    };

    this.initializeMLModels();
  }

  /**
   * 初始化ML模型
   */
  private initializeMLModels(): void {
    // 遗传算法模型
    this.models.set('genetic_optimizer', {
      id: 'genetic_optimizer',
      type: 'genetic_algorithm',
      parameters: {
        populationSize: this.config.populationSize,
        mutationRate: this.config.mutationRate,
        crossoverRate: this.config.crossoverRate,
        elitismRate: 0.1
      },
      trainingData: [],
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        mse: 0,
        trainingTime: 0,
        predictionTime: 0
      }
    });

    // 粒子群优化模型
    this.models.set('pso_optimizer', {
      id: 'pso_optimizer',
      type: 'particle_swarm',
      parameters: {
        swarmSize: this.config.populationSize,
        inertiaWeight: 0.9,
        cognitiveWeight: 2.0,
        socialWeight: 2.0,
        maxVelocity: 1.0
      },
      trainingData: [],
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        mse: 0,
        trainingTime: 0,
        predictionTime: 0
      }
    });

    // 贝叶斯优化模型
    this.models.set('bayesian_optimizer', {
      id: 'bayesian_optimizer',
      type: 'bayesian_optimization',
      parameters: {
        acquisitionFunction: 'expected_improvement',
        kernelType: 'rbf',
        lengthScale: 1.0,
        noiseLevel: 0.1
      },
      trainingData: [],
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        mse: 0,
        trainingTime: 0,
        predictionTime: 0
      }
    });
  }

  /**
   * ML驱动的DSL优化
   */
  async optimizeDSLWithML(
    originalDSL: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): Promise<MLOptimizationResult> {
    console.log('🤖 开始ML驱动的DSL优化...');
    console.log(`📊 使用算法: ${this.config.algorithm}`);

    const startTime = Date.now();

    try {
      // 1. 特征提取
      const features = this.extractFeatures(originalDSL, simulationResult, physicsValidation, selfCheck);
      console.log('✅ 特征提取完成');

      // 2. 选择优化算法
      const optimizer = this.selectOptimizer(features);
      console.log(`🎯 选择优化器: ${optimizer.type}`);

      // 3. 执行ML优化
      const optimizationResult = await this.performMLOptimization(
        originalDSL,
        features,
        optimizer
      );
      console.log('✅ ML优化完成');

      // 4. 评估优化结果
      const evaluation = await this.evaluateOptimization(
        originalDSL,
        optimizationResult.optimizedDSL,
        features
      );
      console.log('✅ 优化结果评估完成');

      // 5. 更新训练数据
      this.updateTrainingData(features, evaluation);

      const result: MLOptimizationResult = {
        ...optimizationResult,
        mlMetrics: {
          algorithm: this.config.algorithm,
          convergenceGeneration: optimizationResult.iterations || 0,
          bestFitness: evaluation.bestScore,
          populationDiversity: this.calculateDiversity(optimizationResult.population || []),
          explorationRatio: 0.3,
          exploitationRatio: 0.7
        },
        modelPerformance: optimizer.performance,
        learningCurve: evaluation.learningCurve,
        featureImportance: this.calculateFeatureImportance(features, evaluation)
      };

      console.log(`✅ ML优化完成，提升比例: ${(result.metrics.improvementRatio * 100).toFixed(1)}%`);
      return result;

    } catch (error) {
      console.error('❌ ML优化失败:', error);
      throw new Error(`ML优化失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 更新训练数据
   */
  private updateTrainingData(features: any, evaluation: any): void {
    try {
      // 将新的特征和评估结果添加到训练数据中
      this.trainingHistory.push({
        input: {
          dslParameters: features,
          physicsType: 'complex_mechanics',
          complexity: features.systemComplexity || 0
        },
        output: {
          simulationScore: evaluation.overallScore || 0,
          validationScore: evaluation.overallScore || 0,
          optimizationSuccess: evaluation.overallScore > 0.8,
          convergenceTime: 100
        },
        metadata: {
          timestamp: Date.now(),
          problemId: 'ml_optimization',
          source: 'MLOptimizer'
        }
      });

      // 限制训练数据大小，保留最近的1000条记录
      if (this.trainingHistory.length > 1000) {
        this.trainingHistory = this.trainingHistory.slice(-1000);
      }

      console.log(`📊 训练数据更新: 当前${this.trainingHistory.length}条记录`);
    } catch (error) {
      console.warn('⚠️ 训练数据更新失败:', error);
    }
  }

  /**
   * 特征提取
   */
  private extractFeatures(
    dsl: any,
    simulationResult: SimulationResult,
    physicsValidation: PhysicsValidationResult,
    selfCheck: SelfCheckResult
  ): Record<string, number> {
    return {
      // DSL特征
      parameterCount: dsl.system?.parameters?.length || 0,
      moduleCount: dsl.system?.modules?.length || 0,
      constraintCount: dsl.system?.constraints?.length || 0,
      
      // 仿真特征
      simulationSteps: simulationResult.statistics.totalSteps,
      computationTime: simulationResult.statistics.computationTime,
      convergenceRate: simulationResult.performanceMetrics?.convergenceRate || 0,
      stabilityScore: simulationResult.performanceMetrics?.stabilityScore || 0,
      
      // 验证特征
      validationScore: physicsValidation.overallScore,
      conservationScore: physicsValidation.validationMetrics?.energyConservation || 0,
      
      // 自检特征
      qualityScore: selfCheck.overallScore,
      dataIntegrityScore: selfCheck.dataIntegrity?.missingRatio || 0,
      
      // 复杂度特征
      systemComplexity: this.calculateSystemComplexity(dsl),
      physicsComplexity: this.calculateSystemComplexity(simulationResult)
    };
  }

  /**
   * 选择优化器
   */
  private selectOptimizer(features: Record<string, number>): MLModel {
    const complexity = features.systemComplexity + features.physicsComplexity;
    
    if (complexity > 0.8) {
      return this.models.get('bayesian_optimizer')!;
    } else if (complexity > 0.5) {
      return this.models.get('pso_optimizer')!;
    } else {
      return this.models.get('genetic_optimizer')!;
    }
  }

  /**
   * 执行ML优化
   */
  private async performMLOptimization(
    originalDSL: any,
    features: Record<string, number>,
    optimizer: MLModel
  ): Promise<any> {
    switch (optimizer.type) {
      case 'genetic_algorithm':
        return await this.performGeneticOptimization(originalDSL, features);
      case 'particle_swarm':
        return await this.performPSOOptimization(originalDSL, features);
      case 'bayesian_optimization':
        return await this.performBayesianOptimization(originalDSL, features);
      default:
        throw new Error(`不支持的优化算法: ${optimizer.type}`);
    }
  }

  /**
   * 遗传算法优化
   */
  private async performGeneticOptimization(originalDSL: any, features: Record<string, number>): Promise<any> {
    console.log('🧬 执行遗传算法优化...');
    
    // 简化的遗传算法实现
    let bestDSL = { ...originalDSL };
    let bestScore = this.calculateFitness(originalDSL, features);
    
    for (let generation = 0; generation < this.config.generations; generation++) {
      // 生成变异
      const mutatedDSL = this.mutateParameters(originalDSL);
      const mutatedScore = this.calculateFitness(mutatedDSL, features);
      
      if (mutatedScore > bestScore) {
        bestScore = mutatedScore;
        bestDSL = mutatedDSL;
      }
      
      if (generation % 10 === 0) {
        console.log(`🧬 遗传算法进度: ${generation}/${this.config.generations}, 最佳得分: ${bestScore.toFixed(3)}`);
      }
    }
    
    return {
      optimizedDSL: bestDSL,
      iterations: this.config.generations,
      metrics: { improvementRatio: (bestScore - this.calculateFitness(originalDSL, features)) / this.calculateFitness(originalDSL, features) }
    };
  }

  /**
   * 粒子群优化
   */
  private async performPSOOptimization(originalDSL: any, features: Record<string, number>): Promise<any> {
    console.log('🌊 执行粒子群优化...');
    
    // 简化的PSO实现
    let bestDSL = { ...originalDSL };
    let bestScore = this.calculateFitness(originalDSL, features);
    
    // 模拟PSO优化过程
    for (let iteration = 0; iteration < this.config.generations; iteration++) {
      const optimizedDSL = this.optimizeWithPSO(originalDSL, features);
      const score = this.calculateFitness(optimizedDSL, features);
      
      if (score > bestScore) {
        bestScore = score;
        bestDSL = optimizedDSL;
      }
    }
    
    return {
      optimizedDSL: bestDSL,
      iterations: this.config.generations,
      metrics: { improvementRatio: (bestScore - this.calculateFitness(originalDSL, features)) / this.calculateFitness(originalDSL, features) }
    };
  }

  /**
   * 贝叶斯优化
   */
  private async performBayesianOptimization(originalDSL: any, features: Record<string, number>): Promise<any> {
    console.log('📊 执行贝叶斯优化...');
    
    // 简化的贝叶斯优化实现
    let bestDSL = { ...originalDSL };
    let bestScore = this.calculateFitness(originalDSL, features);
    
    // 贝叶斯优化过程
    for (let iteration = 0; iteration < Math.min(this.config.generations, 50); iteration++) {
      const candidateDSL = this.sampleFromPosterior(originalDSL, features);
      const score = this.calculateFitness(candidateDSL, features);
      
      if (score > bestScore) {
        bestScore = score;
        bestDSL = candidateDSL;
      }
      
      // 更新后验分布
      this.updatePosterior(candidateDSL, score);
    }
    
    return {
      optimizedDSL: bestDSL,
      iterations: Math.min(this.config.generations, 50),
      metrics: { improvementRatio: (bestScore - this.calculateFitness(originalDSL, features)) / this.calculateFitness(originalDSL, features) }
    };
  }

  /**
   * 计算适应度函数
   */
  private calculateFitness(dsl: any, features: Record<string, number>): number {
    // 综合评分函数
    const weights = {
      accuracy: 0.3,
      stability: 0.25,
      performance: 0.2,
      convergence: 0.15,
      quality: 0.1
    };

    const scores = {
      accuracy: features.validationScore || 0,
      stability: features.stabilityScore || 0,
      performance: Math.max(0, 1 - features.computationTime / 10000), // 归一化计算时间
      convergence: features.convergenceRate || 0,
      quality: features.qualityScore || 0
    };

    return Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (scores[metric as keyof typeof scores] * weight);
    }, 0);
  }

  /**
   * 参数变异
   */
  private mutateParameters(dsl: any): any {
    const mutatedDSL = JSON.parse(JSON.stringify(dsl));
    
    // 对仿真参数进行变异
    if (mutatedDSL.simulation) {
      if (Math.random() < this.config.mutationRate) {
        mutatedDSL.simulation.time_step *= (0.8 + Math.random() * 0.4); // ±20%变化
      }
      if (Math.random() < this.config.mutationRate) {
        mutatedDSL.simulation.tolerance *= (0.5 + Math.random() * 1.0); // 0.5x-1.5x变化
      }
    }
    
    return mutatedDSL;
  }

  /**
   * PSO优化实现
   */
  private optimizeWithPSO(dsl: any, features: Record<string, number>): any {
    // 简化的PSO实现
    const optimizedDSL = JSON.parse(JSON.stringify(dsl));
    
    // 基于特征调整参数
    if (features.convergenceRate < 0.8 && optimizedDSL.simulation) {
      optimizedDSL.simulation.time_step *= 0.8; // 减小时间步长
      optimizedDSL.simulation.tolerance *= 0.5; // 提高精度
    }
    
    if (features.computationTime > 5000 && optimizedDSL.simulation) {
      optimizedDSL.simulation.time_step *= 1.2; // 增大时间步长
      optimizedDSL.simulation.max_iterations = Math.min(1000, optimizedDSL.simulation.max_iterations || 1000);
    }
    
    return optimizedDSL;
  }

  /**
   * 从后验分布采样
   */
  private sampleFromPosterior(dsl: any, features: Record<string, number>): any {
    // 简化的贝叶斯采样
    const sampledDSL = JSON.parse(JSON.stringify(dsl));
    
    // 基于历史数据进行智能采样
    if (this.trainingHistory.length > 0) {
      const bestHistorical = this.trainingHistory
        .sort((a, b) => b.output.simulationScore - a.output.simulationScore)[0];
      
      if (sampledDSL.simulation && bestHistorical.input.dslParameters.simulation) {
        // 向历史最佳参数靠近
        sampledDSL.simulation.time_step = 
          0.7 * sampledDSL.simulation.time_step + 
          0.3 * bestHistorical.input.dslParameters.simulation.time_step;
      }
    }
    
    return sampledDSL;
  }

  /**
   * 更新后验分布
   */
  private updatePosterior(dsl: any, score: number): void {
    // 更新模型的后验知识
    const dataPoint: TrainingDataPoint = {
      input: {
        dslParameters: dsl,
        physicsType: dsl.system?.type || 'unknown',
        complexity: this.calculateSystemComplexity(dsl)
      },
      output: {
        simulationScore: score,
        validationScore: score,
        optimizationSuccess: score > 0.8,
        convergenceTime: Date.now()
      },
      metadata: {
        timestamp: Date.now(),
        problemId: `problem_${Date.now()}`,
        source: 'ml_optimization'
      }
    };

    this.trainingHistory.push(dataPoint);
    
    // 限制历史数据大小
    if (this.trainingHistory.length > 1000) {
      this.trainingHistory = this.trainingHistory.slice(-1000);
    }
  }

  /**
   * 评估优化结果
   */
  private async evaluateOptimization(
    originalDSL: any,
    optimizedDSL: any,
    features: Record<string, number>
  ): Promise<any> {
    const originalScore = this.calculateFitness(originalDSL, features);
    const optimizedScore = this.calculateFitness(optimizedDSL, features);
    
    return {
      originalScore,
      optimizedScore,
      bestScore: Math.max(originalScore, optimizedScore),
      improvement: optimizedScore - originalScore,
      learningCurve: this.generateLearningCurve()
    };
  }

  /**
   * 计算系统复杂度
   */
  private calculateSystemComplexity(dsl: any): number {
    const paramCount = dsl.system?.parameters?.length || 0;
    const moduleCount = dsl.system?.modules?.length || 0;
    const constraintCount = dsl.system?.constraints?.length || 0;
    
    return Math.min(1.0, (paramCount + moduleCount * 2 + constraintCount) / 50);
  }

  /**
   * 计算种群多样性
   */
  private calculateDiversity(population: any[]): number {
    if (population.length < 2) return 0;
    
    // 简化的多样性计算
    let totalDistance = 0;
    let comparisons = 0;
    
    for (let i = 0; i < population.length; i++) {
      for (let j = i + 1; j < population.length; j++) {
        totalDistance += this.calculateParameterDistance(population[i], population[j]);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  /**
   * 计算参数距离
   */
  private calculateParameterDistance(dsl1: any, dsl2: any): number {
    // 简化的参数距离计算
    let distance = 0;
    
    if (dsl1.simulation && dsl2.simulation) {
      distance += Math.abs((dsl1.simulation.time_step || 0) - (dsl2.simulation.time_step || 0));
      distance += Math.abs((dsl1.simulation.tolerance || 0) - (dsl2.simulation.tolerance || 0));
    }
    
    return distance;
  }

  /**
   * 生成学习曲线
   */
  private generateLearningCurve(): number[] {
    // 基于训练历史生成学习曲线
    return this.trainingHistory
      .slice(-50) // 最近50个数据点
      .map(point => point.output.simulationScore);
  }

  /**
   * 计算特征重要性
   */
  private calculateFeatureImportance(
    features: Record<string, number>,
    evaluation: any
  ): Record<string, number> {
    // 简化的特征重要性计算
    const importance: Record<string, number> = {};
    
    for (const [feature, value] of Object.entries(features)) {
      // 基于特征值和改进效果计算重要性
      importance[feature] = Math.min(1.0, value * evaluation.improvement);
    }
    
    return importance;
  }

  /**
   * 获取训练统计信息
   */
  getTrainingStatistics(): {
    totalSamples: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    recentTrend: 'improving' | 'stable' | 'declining';
  } {
    if (this.trainingHistory.length === 0) {
      return {
        totalSamples: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        recentTrend: 'stable'
      };
    }

    const scores = this.trainingHistory.map(point => point.output.simulationScore);
    const recentScores = scores.slice(-10);
    const earlierScores = scores.slice(-20, -10);

    return {
      totalSamples: this.trainingHistory.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      recentTrend: this.determineTrend(recentScores, earlierScores)
    };
  }

  /**
   * 确定趋势
   */
  private determineTrend(recentScores: number[], earlierScores: number[]): 'improving' | 'stable' | 'declining' {
    if (recentScores.length === 0 || earlierScores.length === 0) return 'stable';
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;
    
    const improvement = recentAvg - earlierAvg;
    
    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'declining';
    return 'stable';
  }
}

// 导出默认配置
export const defaultMLConfig: MLOptimizationConfig = {
  algorithm: 'genetic',
  populationSize: 50,
  generations: 100,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  learningRate: 0.01,
  enableAdaptive: true,
  enableEnsemble: false,
  targetMetrics: ['accuracy', 'stability', 'performance']
};
