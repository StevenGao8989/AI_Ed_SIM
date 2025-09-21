/**
 * 物理验证器 - 验证仿真结果的物理合理性
 * 
 * 功能：
 * 1. 守恒定律验证
 * 2. 物理约束检查
 * 3. 数值稳定性分析
 * 4. 物理合理性评估
 */

import { SimulationResult, TimeSeriesData } from '../simulation/DynamicPhysicsSimulator';
import { PhysicsIR } from '../ir/PhysicsIR';

// 物理验证配置
export interface PhysicsValidationConfig {
  tolerance: {
    energy: number;
    momentum: number;
    angularMomentum: number;
    mass: number;
    charge: number;
    temperature: number;
    pressure: number;
  };
  enableConservationChecks: boolean;
  enableConstraintChecks: boolean;
  enableStabilityChecks: boolean;
  enableCausalityChecks: boolean;
  enableDimensionalChecks: boolean;
  enableBoundaryChecks: boolean;
  enableThermodynamicChecks: boolean;
  enableElectromagneticChecks: boolean;
}

// 守恒检查结果
export interface ConservationCheck {
  type: 'energy' | 'momentum' | 'angular_momentum' | 'mass' | 'charge' | 'temperature' | 'pressure';
  initialValue: number;
  finalValue: number;
  deviation: number;
  deviationPercent: number;
  passed: boolean;
  tolerance: number;
  timeSeries: number[];
  maxDeviation: number;
  averageDeviation: number;
  trend: 'stable' | 'increasing' | 'decreasing' | 'oscillating';
}

// 物理验证结果
export interface PhysicsValidationResult {
  success: boolean;
  overallScore: number;
  conservationChecks: ConservationCheck[];
  constraintViolations: string[];
  stabilityIssues: string[];
  causalityViolations: string[];
  dimensionalViolations: string[];
  boundaryViolations: string[];
  thermodynamicViolations: string[];
  electromagneticViolations: string[];
  recommendations: string[];
  errors: string[];
  warnings: string[];
  validationMetrics: {
    energyConservation: number;
    momentumConservation: number;
    massConservation: number;
    chargeConservation: number;
    dimensionalConsistency: number;
    boundaryCompliance: number;
    thermodynamicConsistency: number;
    electromagneticConsistency: number;
  };
}

// 物理验证器类
export class PhysicsValidator {
  private config: PhysicsValidationConfig;

  constructor(config: Partial<PhysicsValidationConfig> = {}) {
    this.config = {
      tolerance: {
        energy: 0.01, // 1%
        momentum: 0.01, // 1%
        angularMomentum: 0.01, // 1%
        mass: 0.001, // 0.1%
        charge: 0.001, // 0.1%
        temperature: 0.01, // 1%
        pressure: 0.01 // 1%
      },
      enableConservationChecks: true,
      enableConstraintChecks: true,
      enableStabilityChecks: true,
      enableCausalityChecks: true,
      enableDimensionalChecks: true,
      enableBoundaryChecks: true,
      enableThermodynamicChecks: true,
      enableElectromagneticChecks: true,
      ...config
    };
  }

  /**
   * 验证仿真结果
   */
  async validateSimulation(
    simulationResult: SimulationResult,
    ir: PhysicsIR
  ): Promise<PhysicsValidationResult> {
    const result: PhysicsValidationResult = {
      success: false,
      overallScore: 0,
      conservationChecks: [],
      constraintViolations: [],
      stabilityIssues: [],
      causalityViolations: [],
      dimensionalViolations: [],
      boundaryViolations: [],
      thermodynamicViolations: [],
      electromagneticViolations: [],
      recommendations: [],
      errors: [],
      warnings: [],
      validationMetrics: {
        energyConservation: 0,
        momentumConservation: 0,
        massConservation: 0,
        chargeConservation: 0,
        dimensionalConsistency: 0,
        boundaryCompliance: 0,
        thermodynamicConsistency: 0,
        electromagneticConsistency: 0
      }
    };

    try {
      console.log('🔍 Starting physics validation...');

      // 1. 守恒定律验证
      if (this.config.enableConservationChecks) {
        result.conservationChecks = await this.validateConservationLaws(simulationResult);
        this.calculateConservationMetrics(result);
      }

      // 2. 量纲一致性检查
      if (this.config.enableDimensionalChecks) {
        result.dimensionalViolations = await this.validateDimensionalConsistency(simulationResult, ir);
        result.validationMetrics.dimensionalConsistency = this.calculateDimensionalScore(result.dimensionalViolations);
      }

      // 3. 边界条件检查
      if (this.config.enableBoundaryChecks) {
        result.boundaryViolations = await this.validateBoundaryConditions(simulationResult, ir);
        result.validationMetrics.boundaryCompliance = this.calculateBoundaryScore(result.boundaryViolations);
      }

      // 4. 热力学一致性检查
      if (this.config.enableThermodynamicChecks) {
        result.thermodynamicViolations = await this.validateThermodynamicConsistency(simulationResult, ir);
        result.validationMetrics.thermodynamicConsistency = this.calculateThermodynamicScore(result.thermodynamicViolations);
      }

      // 5. 电磁学一致性检查
      if (this.config.enableElectromagneticChecks) {
        result.electromagneticViolations = await this.validateElectromagneticConsistency(simulationResult, ir);
        result.validationMetrics.electromagneticConsistency = this.calculateElectromagneticScore(result.electromagneticViolations);
      }

      // 6. 物理约束检查
      if (this.config.enableConstraintChecks) {
        result.constraintViolations = await this.validatePhysicalConstraints(simulationResult, ir);
      }

      // 3. 数值稳定性分析
      if (this.config.enableStabilityChecks) {
        result.stabilityIssues = await this.validateNumericalStability(simulationResult);
      }

      // 4. 因果关系检查
      if (this.config.enableCausalityChecks) {
        result.causalityViolations = await this.validateCausality(simulationResult);
      }

      // 5. 计算总体分数
      result.overallScore = this.calculateOverallScore(result);

      // 6. 生成建议
      result.recommendations = this.generateRecommendations(result);

      // 7. 确定是否成功
      result.success = result.overallScore >= 0.8 && result.errors.length === 0;

      console.log(`✅ Physics validation completed. Score: ${result.overallScore.toFixed(2)}`);

    } catch (error) {
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 验证守恒定律
   */
  private async validateConservationLaws(simulationResult: SimulationResult): Promise<ConservationCheck[]> {
    const checks: ConservationCheck[] = [];
    const timeSeries = simulationResult.timeSeries;

    if (timeSeries.length < 2) {
      return checks;
    }

    // 能量守恒检查
    const energyCheck = this.checkEnergyConservation(timeSeries);
    if (energyCheck) checks.push(energyCheck);

    // 动量守恒检查
    const momentumCheck = this.checkMomentumConservation(timeSeries);
    if (momentumCheck) checks.push(momentumCheck);

    // 角动量守恒检查
    const angularMomentumCheck = this.checkAngularMomentumConservation(timeSeries);
    if (angularMomentumCheck) checks.push(angularMomentumCheck);

    // 质量守恒检查
    const massCheck = this.checkMassConservation(timeSeries);
    if (massCheck) checks.push(massCheck);

    return checks;
  }

  /**
   * 检查能量守恒
   */
  private checkEnergyConservation(timeSeries: TimeSeriesData[]): ConservationCheck | null {
    if (timeSeries.length < 2) return null;

    const initialEnergy = this.calculateTotalEnergy(timeSeries[0]);
    const finalEnergy = this.calculateTotalEnergy(timeSeries[timeSeries.length - 1]);
    
    const deviation = Math.abs(finalEnergy - initialEnergy);
    const deviationPercent = Math.abs(deviation) / Math.abs(initialEnergy);
    const passed = deviationPercent <= this.config.tolerance.energy;

    const energyValues = timeSeries.map(ts => this.calculateTotalEnergy(ts));
    
    return {
      type: 'energy',
      initialValue: initialEnergy,
      finalValue: finalEnergy,
      deviation,
      deviationPercent,
      passed,
      tolerance: this.config.tolerance.energy,
      timeSeries: energyValues,
      maxDeviation: Math.max(...energyValues.map(v => Math.abs(v - initialEnergy))),
      averageDeviation: energyValues.reduce((sum, v) => sum + Math.abs(v - initialEnergy), 0) / energyValues.length,
      trend: 'stable'
    };
  }

  /**
   * 计算总能量
   */
  private calculateTotalEnergy(data: TimeSeriesData): number {
    let totalEnergy = 0;
    
    for (const obj of Object.values(data.objects)) {
      const speed = Math.sqrt(
        Math.pow(obj.velocity.x, 2) + 
        Math.pow(obj.velocity.y, 2) + 
        Math.pow(obj.velocity.z, 2)
      );
      const kineticEnergy = 0.5 * obj.mass * speed * speed;
      const potentialEnergy = obj.mass * 9.8 * obj.position.y; // 重力势能
      totalEnergy += kineticEnergy + potentialEnergy;
    }
    
    return totalEnergy;
  }

  /**
   * 检查动量守恒
   */
  private checkMomentumConservation(timeSeries: TimeSeriesData[]): ConservationCheck | null {
    if (timeSeries.length < 2) return null;

    const initialMomentum = this.calculateTotalMomentum(timeSeries[0]);
    const finalMomentum = this.calculateTotalMomentum(timeSeries[timeSeries.length - 1]);
    
    const deviation = Math.abs(finalMomentum - initialMomentum);
    const deviationPercent = Math.abs(deviation) / Math.abs(initialMomentum);
    const passed = deviationPercent <= this.config.tolerance.momentum;

    const momentumValues = timeSeries.map(ts => this.calculateTotalMomentum(ts));
    
    return {
      type: 'momentum',
      initialValue: initialMomentum,
      finalValue: finalMomentum,
      deviation,
      deviationPercent,
      passed,
      tolerance: this.config.tolerance.momentum,
      timeSeries: momentumValues,
      maxDeviation: Math.max(...momentumValues.map(v => Math.abs(v - initialMomentum))),
      averageDeviation: momentumValues.reduce((sum, v) => sum + Math.abs(v - initialMomentum), 0) / momentumValues.length,
      trend: 'stable'
    };
  }

  /**
   * 计算总动量
   */
  private calculateTotalMomentum(data: TimeSeriesData): number {
    let totalMomentum = 0;
    
    for (const obj of Object.values(data.objects)) {
      const speed = Math.sqrt(
        Math.pow(obj.velocity.x, 2) + 
        Math.pow(obj.velocity.y, 2) + 
        Math.pow(obj.velocity.z, 2)
      );
      totalMomentum += obj.mass * speed;
    }
    
    return totalMomentum;
  }

  /**
   * 检查角动量守恒
   */
  private checkAngularMomentumConservation(timeSeries: TimeSeriesData[]): ConservationCheck | null {
    if (timeSeries.length < 2) return null;

    const initialAngularMomentum = this.calculateTotalAngularMomentum(timeSeries[0]);
    const finalAngularMomentum = this.calculateTotalAngularMomentum(timeSeries[timeSeries.length - 1]);
    
    const deviation = Math.abs(finalAngularMomentum - initialAngularMomentum);
    const deviationPercent = Math.abs(deviation) / Math.abs(initialAngularMomentum);
    const passed = deviationPercent <= this.config.tolerance.angularMomentum;

    const angularMomentumValues = timeSeries.map(ts => this.calculateTotalAngularMomentum(ts));
    
    return {
      type: 'angular_momentum',
      initialValue: initialAngularMomentum,
      finalValue: finalAngularMomentum,
      deviation,
      deviationPercent,
      passed,
      tolerance: this.config.tolerance.angularMomentum,
      timeSeries: angularMomentumValues,
      maxDeviation: Math.max(...angularMomentumValues.map(v => Math.abs(v - initialAngularMomentum))),
      averageDeviation: angularMomentumValues.reduce((sum, v) => sum + Math.abs(v - initialAngularMomentum), 0) / angularMomentumValues.length,
      trend: 'stable'
    };
  }

  /**
   * 计算总角动量
   */
  private calculateTotalAngularMomentum(data: TimeSeriesData): number {
    let totalAngularMomentum = 0;
    
    for (const obj of Object.values(data.objects)) {
      // 简化的角动量计算
      const angularSpeed = Math.sqrt(
        Math.pow(obj.angularVelocity?.x || 0, 2) + 
        Math.pow(obj.angularVelocity?.y || 0, 2) + 
        Math.pow(obj.angularVelocity?.z || 0, 2)
      );
      const momentOfInertia = obj.mass * 0.1; // 简化的转动惯量
      totalAngularMomentum += momentOfInertia * angularSpeed;
    }
    
    return totalAngularMomentum;
  }

  /**
   * 检查质量守恒
   */
  private checkMassConservation(timeSeries: TimeSeriesData[]): ConservationCheck | null {
    if (timeSeries.length < 2) return null;

    const initialMass = this.calculateTotalMass(timeSeries[0]);
    const finalMass = this.calculateTotalMass(timeSeries[timeSeries.length - 1]);
    
    const deviation = Math.abs(finalMass - initialMass);
    const deviationPercent = Math.abs(deviation) / Math.abs(initialMass);
    const passed = deviationPercent <= this.config.tolerance.mass;

    const massValues = timeSeries.map(ts => this.calculateTotalMass(ts));
    
    return {
      type: 'mass',
      initialValue: initialMass,
      finalValue: finalMass,
      deviation,
      deviationPercent,
      passed,
      tolerance: this.config.tolerance.mass,
      timeSeries: massValues,
      maxDeviation: Math.max(...massValues.map(v => Math.abs(v - initialMass))),
      averageDeviation: massValues.reduce((sum, v) => sum + Math.abs(v - initialMass), 0) / massValues.length,
      trend: 'stable'
    };
  }

  /**
   * 计算总质量
   */
  private calculateTotalMass(data: TimeSeriesData): number {
    let totalMass = 0;
    
    for (const obj of Object.values(data.objects)) {
      totalMass += obj.mass;
    }
    
    return totalMass;
  }

  /**
   * 验证物理约束
   */
  private async validatePhysicalConstraints(
    simulationResult: SimulationResult,
    ir: PhysicsIR
  ): Promise<string[]> {
    const violations: string[] = [];
    const timeSeries = simulationResult.timeSeries;

    // 检查速度约束
    for (const data of timeSeries) {
      for (const [objectId, obj] of Object.entries(data.objects)) {
        const speed = Math.sqrt(
          Math.pow(obj.velocity.x, 2) + 
          Math.pow(obj.velocity.y, 2) + 
          Math.pow(obj.velocity.z, 2)
        );
        
        if (speed > 1000) { // 光速的1/300000
          violations.push(`Object ${objectId} exceeds speed limit at time ${data.time}`);
        }
      }
    }

    // 检查位置约束
    for (const data of timeSeries) {
      for (const [objectId, obj] of Object.entries(data.objects)) {
        if (isNaN(obj.position.x) || isNaN(obj.position.y) || isNaN(obj.position.z)) {
          violations.push(`Object ${objectId} has invalid position at time ${data.time}`);
        }
      }
    }

    return violations;
  }

  /**
   * 验证数值稳定性
   */
  private async validateNumericalStability(simulationResult: SimulationResult): Promise<string[]> {
    const issues: string[] = [];
    const timeSeries = simulationResult.timeSeries;

    // 检查时间步长稳定性
    if (timeSeries.length > 1) {
      const timeSteps: number[] = [];
      for (let i = 1; i < timeSeries.length; i++) {
        timeSteps.push(timeSeries[i].time - timeSeries[i - 1].time);
      }
      
      const avgTimeStep = timeSteps.reduce((sum, dt) => sum + dt, 0) / timeSteps.length;
      const maxTimeStep = Math.max(...timeSteps);
      const minTimeStep = Math.min(...timeSteps);
      
      if (maxTimeStep > avgTimeStep * 10) {
        issues.push('Large time step variations detected');
      }
      
      if (minTimeStep < avgTimeStep * 0.1) {
        issues.push('Very small time steps detected');
      }
    }

    // 检查数值发散
    for (const data of timeSeries) {
      for (const [objectId, obj] of Object.entries(data.objects)) {
        if (!isFinite(obj.position.x) || !isFinite(obj.position.y) || !isFinite(obj.position.z)) {
          issues.push(`Object ${objectId} position diverged at time ${data.time}`);
        }
        
        if (!isFinite(obj.velocity.x) || !isFinite(obj.velocity.y) || !isFinite(obj.velocity.z)) {
          issues.push(`Object ${objectId} velocity diverged at time ${data.time}`);
        }
      }
    }

    return issues;
  }

  /**
   * 验证因果关系
   */
  private async validateCausality(simulationResult: SimulationResult): Promise<string[]> {
    const violations: string[] = [];
    const timeSeries = simulationResult.timeSeries;

    // 检查时间顺序
    for (let i = 1; i < timeSeries.length; i++) {
      if (timeSeries[i].time <= timeSeries[i - 1].time) {
        violations.push(`Time sequence violation at index ${i}`);
      }
    }

    // 检查物理因果关系
    for (let i = 1; i < timeSeries.length; i++) {
      const prev = timeSeries[i - 1];
      const curr = timeSeries[i];
      
      for (const [objectId, currObj] of Object.entries(curr.objects)) {
        const prevObj = prev.objects[objectId];
        if (prevObj) {
          // 检查位置变化的合理性
          const displacement = Math.sqrt(
            Math.pow(currObj.position.x - prevObj.position.x, 2) +
            Math.pow(currObj.position.y - prevObj.position.y, 2) +
            Math.pow(currObj.position.z - prevObj.position.z, 2)
          );
          
          const timeDiff = curr.time - prev.time;
          const maxDisplacement = Math.sqrt(
            Math.pow(prevObj.velocity.x, 2) + 
            Math.pow(prevObj.velocity.y, 2) + 
            Math.pow(prevObj.velocity.z, 2)
          ) * timeDiff * 2; // 允许2倍的最大可能位移
          
          if (displacement > maxDisplacement) {
            violations.push(`Object ${objectId} moved too far in time step at ${curr.time}`);
          }
        }
      }
    }

    return violations;
  }

  /**
   * 计算守恒定律指标
   */
  private calculateConservationMetrics(result: PhysicsValidationResult): void {
    for (const check of result.conservationChecks) {
      switch (check.type) {
        case 'energy':
          result.validationMetrics.energyConservation = check.passed ? 1.0 : Math.max(0, 1 - check.deviationPercent);
          break;
        case 'momentum':
          result.validationMetrics.momentumConservation = check.passed ? 1.0 : Math.max(0, 1 - check.deviationPercent);
          break;
        case 'mass':
          result.validationMetrics.massConservation = check.passed ? 1.0 : Math.max(0, 1 - check.deviationPercent);
          break;
        case 'charge':
          result.validationMetrics.chargeConservation = check.passed ? 1.0 : Math.max(0, 1 - check.deviationPercent);
          break;
      }
    }
  }

  /**
   * 验证量纲一致性
   */
  private async validateDimensionalConsistency(simulationResult: SimulationResult, ir: PhysicsIR): Promise<string[]> {
    const violations: string[] = [];
    
    // 检查所有物理量的量纲是否一致
    for (const timeData of simulationResult.timeSeries) {
      for (const [objectId, obj] of Object.entries(timeData.objects)) {
        // 检查位置量纲
        if (typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') {
          violations.push(`Object ${objectId} position has invalid dimensions at time ${timeData.time}`);
        }
        
        // 检查速度量纲
        if (typeof obj.velocity.x !== 'number' || typeof obj.velocity.y !== 'number') {
          violations.push(`Object ${objectId} velocity has invalid dimensions at time ${timeData.time}`);
        }
        
        // 检查加速度量纲
        if (typeof obj.acceleration.x !== 'number' || typeof obj.acceleration.y !== 'number') {
          violations.push(`Object ${objectId} acceleration has invalid dimensions at time ${timeData.time}`);
        }
      }
    }
    
    return violations;
  }

  /**
   * 验证边界条件
   */
  private async validateBoundaryConditions(simulationResult: SimulationResult, ir: PhysicsIR): Promise<string[]> {
    const violations: string[] = [];
    
    // 检查边界条件
    for (const timeData of simulationResult.timeSeries) {
      for (const [objectId, obj] of Object.entries(timeData.objects)) {
        // 检查位置边界
        if (obj.position.y < -1000 || obj.position.y > 1000) {
          violations.push(`Object ${objectId} position out of bounds at time ${timeData.time}`);
        }
        
        // 检查速度边界
        const speed = Math.sqrt(obj.velocity.x**2 + obj.velocity.y**2 + obj.velocity.z**2);
        if (speed > 1000) { // 假设最大速度为1000 m/s
          violations.push(`Object ${objectId} velocity exceeds physical limits at time ${timeData.time}`);
        }
      }
    }
    
    return violations;
  }

  /**
   * 验证热力学一致性
   */
  private async validateThermodynamicConsistency(simulationResult: SimulationResult, ir: PhysicsIR): Promise<string[]> {
    const violations: string[] = [];
    
    // 检查温度是否合理
    for (const timeData of simulationResult.timeSeries) {
      if (timeData.system?.temperature !== undefined) {
        const temp = timeData.system.temperature;
        if (temp < 0 || temp > 10000) { // 假设温度范围0-10000K
          violations.push(`Temperature ${temp}K is outside physical range at time ${timeData.time}`);
        }
      }
    }
    
    return violations;
  }

  /**
   * 验证电磁学一致性
   */
  private async validateElectromagneticConsistency(simulationResult: SimulationResult, ir: PhysicsIR): Promise<string[]> {
    const violations: string[] = [];
    
    // 检查电场和磁场的合理性
    for (const timeData of simulationResult.timeSeries) {
      if ((timeData as any).system?.electric_field) {
        const eField = (timeData as any).system.electric_field;
        const magnitude = Math.sqrt(eField.x**2 + eField.y**2 + eField.z**2);
        if (magnitude > 1e12) { // 假设最大电场强度
          violations.push(`Electric field magnitude ${magnitude} exceeds physical limits at time ${timeData.time}`);
        }
      }
      
      if ((timeData as any).system?.magnetic_field) {
        const bField = (timeData as any).system.magnetic_field;
        const magnitude = Math.sqrt(bField.x**2 + bField.y**2 + bField.z**2);
        if (magnitude > 1e6) { // 假设最大磁场强度
          violations.push(`Magnetic field magnitude ${magnitude} exceeds physical limits at time ${timeData.time}`);
        }
      }
    }
    
    return violations;
  }

  /**
   * 计算量纲一致性分数
   */
  private calculateDimensionalScore(violations: string[]): number {
    return violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.1);
  }

  /**
   * 计算边界条件分数
   */
  private calculateBoundaryScore(violations: string[]): number {
    return violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.1);
  }

  /**
   * 计算热力学一致性分数
   */
  private calculateThermodynamicScore(violations: string[]): number {
    return violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.1);
  }

  /**
   * 计算电磁学一致性分数
   */
  private calculateElectromagneticScore(violations: string[]): number {
    return violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.1);
  }

  /**
   * 计算总体分数
   */
  private calculateOverallScore(result: PhysicsValidationResult): number {
    let score = 1.0;

    // 守恒定律检查
    const conservationScore = result.conservationChecks.length > 0 
      ? result.conservationChecks.filter(check => check.passed).length / result.conservationChecks.length
      : 1.0;
    score *= conservationScore;

    // 约束违反
    if (result.constraintViolations.length > 0) {
      score *= Math.max(0, 1 - result.constraintViolations.length * 0.1);
    }

    // 稳定性问题
    if (result.stabilityIssues.length > 0) {
      score *= Math.max(0, 1 - result.stabilityIssues.length * 0.1);
    }

    // 因果关系违反
    if (result.causalityViolations.length > 0) {
      score *= Math.max(0, 1 - result.causalityViolations.length * 0.2);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 生成建议
   */
  private generateRecommendations(result: PhysicsValidationResult): string[] {
    const recommendations: string[] = [];

    // 守恒定律建议
    const failedConservation = result.conservationChecks.filter(check => !check.passed);
    if (failedConservation.length > 0) {
      recommendations.push('Consider reducing time step size for better conservation');
      recommendations.push('Check for energy dissipation mechanisms');
    }

    // 约束违反建议
    if (result.constraintViolations.length > 0) {
      recommendations.push('Review physical constraints and boundary conditions');
      recommendations.push('Check for numerical instabilities');
    }

    // 稳定性建议
    if (result.stabilityIssues.length > 0) {
      recommendations.push('Use adaptive time stepping');
      recommendations.push('Consider using more stable numerical methods');
    }

    // 因果关系建议
    if (result.causalityViolations.length > 0) {
      recommendations.push('Check time step size and integration method');
      recommendations.push('Verify initial conditions');
    }

    return recommendations;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PhysicsValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): PhysicsValidationConfig {
    return { ...this.config };
  }
}