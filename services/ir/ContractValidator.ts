// services/ir/ContractValidator.ts
// Physics Contract 校验器：使用 AJV 进行 Schema 校验

import Ajv from 'ajv';
import type { PhysicsContract, ValidationReport, ValidationError } from '../../types/physics';
import { PreSimGateError } from '../../types/physics';
import contractSchema from './PhysicsContract.json';

/**
 * Contract 校验器
 */
export class ContractValidator {
  private ajv: Ajv;
  private validateSchema: any;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: false
    });
    
    this.validateSchema = this.ajv.compile(contractSchema);
  }

  /**
   * 硬门禁校验 Physics Contract (Pre-Sim Gate)
   */
  assert(contract: PhysicsContract): void {
    const report = this.validateContract(contract);
    if (!report.success) {
      this.throwPreSimGateError(report);
    }
  }

  /**
   * 校验 Physics Contract
   */
  validateContract(contract: PhysicsContract): ValidationReport {
    console.log('🔍 开始 Physics Contract 校验...');

    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    try {
      // 1. Schema 结构校验
      const schemaValid = this.validateSchema(contract);
      if (!schemaValid) {
        const schemaErrors = this.validateSchema.errors || [];
        for (const error of schemaErrors) {
          errors.push({
            code: 'SCHEMA_VIOLATION',
            message: `Schema校验失败: ${error.instancePath} ${error.message}`,
            severity: 'error',
            location: error.instancePath,
            suggestion: `请检查字段 ${error.instancePath} 的类型和值`
          });
        }
        score -= 0.4;
      }

      // 2. 单位/量纲规范化校验
      const unitsValid = this.validateUnitsAndDimensions(contract);
      if (!unitsValid.success) {
        errors.push(...unitsValid.errors);
        score -= 0.2;
      }

      // 3. 几何一致性校验
      const geometryValid = this.validateGeometryConsistency(contract);
      if (!geometryValid.success) {
        errors.push(...geometryValid.errors);
        score -= 0.2;
      }

      // 4. 物性范围校验
      const physicsValid = this.validatePhysicsRanges(contract);
      if (!physicsValid.success) {
        errors.push(...physicsValid.errors);
        score -= 0.1;
      }

      // 5. 可行域快速检查
      const feasibilityValid = this.validateFeasibility(contract);
      if (!feasibilityValid.success) {
        errors.push(...feasibilityValid.errors);
        score -= 0.1;
      }

      const finalScore = Math.max(0, score);
      const success = errors.filter(e => e.severity === 'error').length === 0;

      console.log(`✅ Contract校验完成，得分: ${finalScore.toFixed(2)}, 成功: ${success}`);

      return {
        success,
        score: finalScore,
        errors,
        warnings,
        details: {
          units: unitsValid.success,
          geometry: geometryValid.success,
          physics: physicsValid.success,
          feasibility: feasibilityValid.success
        }
      };

    } catch (error) {
      console.error('❌ Contract校验异常:', error);
      return {
        success: false,
        score: 0,
        errors: [{
          code: 'VALIDATION_EXCEPTION',
          message: `校验过程异常: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings,
        details: {
          units: false,
          geometry: false,
          physics: false,
          feasibility: false
        }
      };
    }
  }

  /**
   * 单位和量纲校验
   */
  private validateUnitsAndDimensions(contract: PhysicsContract): { success: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 校验重力加速度范围
    const [gx, gy] = contract.world.gravity;
    const gMagnitude = Math.sqrt(gx * gx + gy * gy);
    if (gMagnitude < 1 || gMagnitude > 20) {
      errors.push({
        code: 'GRAVITY_OUT_OF_RANGE',
        message: `重力加速度 ${gMagnitude.toFixed(2)} m/s² 超出合理范围 [1, 20]`,
        severity: 'error',
        location: 'world.gravity',
        suggestion: '请检查重力加速度设置，地球表面约为9.8 m/s²'
      });
    }

    // 校验质量
    for (const body of contract.bodies) {
      if (body.mass <= 0) {
        errors.push({
          code: 'INVALID_MASS',
          message: `刚体 ${body.id} 质量 ${body.mass} 必须大于0`,
          severity: 'error',
          location: `bodies[${body.id}].mass`,
          suggestion: '质量必须为正数'
        });
      }
    }

    // 校验尺寸
    for (const body of contract.bodies) {
      if (body.size) {
        for (let i = 0; i < body.size.length; i++) {
          if (body.size[i] <= 0) {
            errors.push({
              code: 'INVALID_SIZE',
              message: `刚体 ${body.id} 尺寸 ${body.size[i]} 必须大于0`,
              severity: 'error',
              location: `bodies[${body.id}].size[${i}]`,
              suggestion: '所有尺寸参数必须为正数'
            });
          }
        }
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * 几何一致性校验
   */
  private validateGeometryConsistency(contract: PhysicsContract): { success: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 校验法向量单位化
    for (const surface of contract.surfaces) {
      const [nx, ny] = surface.normal;
      const magnitude = Math.sqrt(nx * nx + ny * ny);
      
      if (Math.abs(magnitude - 1.0) > 1e-6) {
        errors.push({
          code: 'NORMAL_NOT_UNIT',
          message: `面 ${surface.id} 法向量 [${nx}, ${ny}] 不是单位向量 (长度: ${magnitude.toFixed(6)})`,
          severity: 'error',
          location: `surfaces[${surface.id}].normal`,
          suggestion: '法向量必须是单位向量，请归一化'
        });
      }

      // 校验法向量与重力不完全同向（避免"反物理"地面）
      const [gx, gy] = contract.world.gravity;
      const gMag = Math.sqrt(gx * gx + gy * gy);
      const dot = (nx * gx + ny * gy) / gMag;
      
      if (Math.abs(dot) > 0.99) {
        errors.push({
          code: 'NORMAL_PARALLEL_GRAVITY',
          message: `面 ${surface.id} 法向量与重力几乎平行 (点积: ${dot.toFixed(3)})`,
          severity: 'error',
          location: `surfaces[${surface.id}].normal`,
          suggestion: '地面法向量不应与重力平行，会导致非物理行为'
        });
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * 物性范围校验
   */
  private validatePhysicsRanges(contract: PhysicsContract): { success: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 校验摩擦系数
    for (const surface of contract.surfaces) {
      if (surface.mu_s !== undefined && surface.mu_k !== undefined) {
        if (surface.mu_k > surface.mu_s) {
          errors.push({
            code: 'FRICTION_INCONSISTENT',
            message: `面 ${surface.id} 动摩擦系数 ${surface.mu_k} 大于静摩擦系数 ${surface.mu_s}`,
            severity: 'error',
            location: `surfaces[${surface.id}].mu_k`,
            suggestion: '动摩擦系数应小于等于静摩擦系数'
          });
        }
      }

      if (surface.mu_s !== undefined && surface.mu_s < 0) {
        errors.push({
          code: 'NEGATIVE_FRICTION',
          message: `面 ${surface.id} 静摩擦系数 ${surface.mu_s} 不能为负`,
          severity: 'error',
          location: `surfaces[${surface.id}].mu_s`,
          suggestion: '摩擦系数必须非负'
        });
      }

      if (surface.mu_k !== undefined && surface.mu_k < 0) {
        errors.push({
          code: 'NEGATIVE_FRICTION',
          message: `面 ${surface.id} 动摩擦系数 ${surface.mu_k} 不能为负`,
          severity: 'error',
          location: `surfaces[${surface.id}].mu_k`,
          suggestion: '摩擦系数必须非负'
        });
      }

      // 校验恢复系数
      if (surface.restitution !== undefined) {
        if (surface.restitution < 0 || surface.restitution > 1) {
          errors.push({
            code: 'INVALID_RESTITUTION',
            message: `面 ${surface.id} 恢复系数 ${surface.restitution} 超出范围 [0, 1]`,
            severity: 'error',
            location: `surfaces[${surface.id}].restitution`,
            suggestion: '恢复系数必须在0-1之间 (0=完全非弹性, 1=完全弹性)'
          });
        }
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * 可行域快速检查
   */
  private validateFeasibility(contract: PhysicsContract): { success: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 如果有预期事件，检查是否可达
    if (contract.expected_events && contract.expected_events.length > 0) {
      for (const event of contract.expected_events) {
        if (event.timeWindow) {
          const [tMin, tMax] = event.timeWindow;
          if (tMin < 0 || tMax < tMin) {
            errors.push({
              code: 'INVALID_TIME_WINDOW',
              message: `事件 ${event.name} 时间窗口 [${tMin}, ${tMax}] 无效`,
              severity: 'error',
              location: `expected_events[${event.name}].timeWindow`,
              suggestion: '时间窗口必须满足 0 ≤ tMin ≤ tMax'
            });
          }
        }

        // 检查事件涉及的刚体和面是否存在
        if (event.body && !contract.bodies.find(b => b.id === event.body)) {
          errors.push({
            code: 'MISSING_BODY_REFERENCE',
            message: `事件 ${event.name} 引用的刚体 ${event.body} 不存在`,
            severity: 'error',
            location: `expected_events[${event.name}].body`,
            suggestion: '请确保引用的刚体ID存在于bodies列表中'
          });
        }

        if (event.surface && !contract.surfaces.find(s => s.id === event.surface)) {
          errors.push({
            code: 'MISSING_SURFACE_REFERENCE',
            message: `事件 ${event.name} 引用的面 ${event.surface} 不存在`,
            severity: 'error',
            location: `expected_events[${event.name}].surface`,
            suggestion: '请确保引用的面ID存在于surfaces列表中'
          });
        }
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * 抛出 Pre-Sim Gate 错误
   */
  throwPreSimGateError(report: ValidationReport): never {
    const errorMessages = report.errors
      .filter(e => e.severity === 'error')
      .map(e => e.message)
      .join('; ');

    throw new PreSimGateError(
      `Pre-Sim Gate 校验失败: ${errorMessages}`,
      'PRE_SIM_GATE_FAILURE',
      report
    );
  }

  /**
   * 获取默认容差
   */
  getDefaultTolerances() {
    return {
      r2_min: 0.95,
      rel_err: 0.05,
      event_time_sec: 0.1,
      energy_drift_rel: 0.02,
      v_eps: 1e-3
    };
  }
}

// 导出默认实例
export const contractValidator = new ContractValidator();
