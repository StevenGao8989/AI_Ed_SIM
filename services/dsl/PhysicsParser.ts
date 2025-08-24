import { PhysicsDSL, PhysicsIR, PhysicsSchema } from '../../frontend/types/dsl';
import { PhysicalQuantity, PhysicsObject, PhysicsParameter } from '../../frontend/types/PhysicsTypes';

/**
 * PhysicsParser - 将 PhysicsDSL (YAML) 解析为中间 IR (JSON)
 * 负责：DSL 解析、结构校验、类型转换、单位标准化
 */
export class PhysicsParser {
  private schema: PhysicsSchema;

  constructor() {
    this.schema = this.loadPhysicsSchema();
  }

  /**
   * 加载 PhysicsSchema 用于校验
   */
  private loadPhysicsSchema(): PhysicsSchema {
    // 这里应该从文件加载，暂时返回基础结构
    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "PhysicsDSL Schema",
      description: "中国初一到高三物理内容的结构化定义",
      type: "object",
      required: ["metadata", "system", "simulation", "output"],
      properties: {
        metadata: {
          type: "object",
          required: ["subject", "topic", "topic_id", "version", "timestamp", "source_question"],
          properties: {
            subject: { type: "string" },
            topic: { type: "string" },
            topic_id: { type: "string" },
            version: { type: "string" },
            timestamp: { type: "string" },
            source_question: { type: "string" }
          }
        },
        system: {
          type: "object",
          required: ["type", "parameters", "initial_conditions", "constraints", "constants"],
          properties: {
            type: { type: "string" },
            parameters: { type: "array" },
            initial_conditions: { type: "array" },
            constraints: { type: "array" },
            constants: { type: "array" }
          }
        },
        simulation: { type: "object" },
        output: { type: "object" }
      }
    };
  }

  /**
   * 解析 YAML 格式的 PhysicsDSL
   */
  public parseYamlToDSL(yamlContent: string): PhysicsDSL {
    try {
      // 暂时使用 JSON.parse，后续可以集成 js-yaml
      const parsed = JSON.parse(yamlContent) as any;
      return this.validateAndTransformDSL(parsed);
    } catch (error) {
      throw new Error(`DSL 解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 将 PhysicsDSL 转换为中间 IR
   */
  public parseDSLToIR(dsl: PhysicsDSL): PhysicsIR {
    try {
      // 1. 结构校验
      this.validateDSLStructure(dsl);

      // 2. 类型转换
      const ir: PhysicsIR = {
        metadata: this.transformMetadata(dsl.metadata),
        system: this.transformSystem(dsl.system),
        objects: this.transformObjects([]), // 暂时为空数组
        initialConditions: this.transformInitialConditions(dsl.system.initial_conditions || []),
        constraints: this.transformConstraints(dsl.system.constraints || []),
        forces: this.transformForces([]), // 暂时为空数组
        fields: this.transformFields([]), // 暂时为空数组
        constants: this.transformConstants(dsl.system.constants || []),
        simulation: this.transformSimulation(dsl.simulation),
        output: this.transformOutput(dsl.output),
        validation: this.generateValidationInfo(dsl)
      };

      // 3. IR 完整性校验
      this.validateIRCompleteness(ir);

      return ir;
    } catch (error) {
      throw new Error(`DSL 到 IR 转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 校验 DSL 结构
   */
  public validateDSLStructure(dsl: any): void {
    // 简化的结构校验，暂时不使用 Ajv
    if (!dsl.metadata || !dsl.system) {
      throw new Error('DSL 缺少必需的 metadata 或 system 字段');
    }
    
    if (!dsl.metadata.subject || !dsl.metadata.topic) {
      throw new Error('DSL metadata 缺少必需的 subject 或 topic 字段');
    }
    
    if (!dsl.system.type || !dsl.system.parameters) {
      throw new Error('DSL system 缺少必需的 type 或 parameters 字段');
    }
  }

  /**
   * 转换元数据
   */
  private transformMetadata(metadata: any): PhysicsIR['metadata'] {
    return {
      title: metadata.topic || metadata.title || '',
      subject: metadata.subject || 'physics',
      grade: metadata.grade || 'senior1',
      difficulty: metadata.difficulty || 'medium',
      topics: metadata.topics || [],
      description: metadata.source_question || '',
      tags: []
    };
  }

  /**
   * 转换系统配置
   */
  private transformSystem(system: any): PhysicsIR['system'] {
    return {
      type: system.type,
      dimensions: system.parameters?.length > 0 ? 3 : 2, // 根据参数推断维度
      coordinateSystem: 'cartesian',
      gravity: system.constraints?.some((c: any) => c.type === 'gravity') ? {
        enabled: true,
        value: { value: -9.81, unit: 'm/s²', uncertainty: 0 },
        direction: { x: 0, y: -1, z: 0 }
      } : undefined,
      friction: system.constraints?.some((c: any) => c.type === 'friction') ? {
        enabled: true,
        static: undefined,
        kinetic: undefined,
        rolling: undefined
      } : undefined,
      airResistance: system.constraints?.some((c: any) => c.type === 'air_resistance') ? {
        enabled: true,
        coefficient: { value: 0.5, unit: 'kg/m³', uncertainty: 0 },
        density: undefined
      } : undefined,
      environment: {}
    };
  }

  /**
   * 转换物理对象
   */
  private transformObjects(objects: any[]): PhysicsIR['objects'] {
    return objects.map(obj => ({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      position: this.transformVector(obj.position),
      velocity: this.transformVector(obj.velocity),
      acceleration: this.transformVector(obj.acceleration),
      mass: this.transformPhysicalQuantity(obj.mass),
      dimensions: this.transformDimensions(obj.dimensions),
      material: obj.material || {},
      properties: obj.properties || {}
    }));
  }

  /**
   * 转换初始条件
   */
  private transformInitialConditions(conditions: any[]): PhysicsIR['initialConditions'] {
    return conditions.map(cond => ({
      objectId: cond.name || 'default',
      parameter: cond.name,
      value: this.transformPhysicalQuantity(cond.value),
      time: cond.time || 0
    }));
  }

  /**
   * 转换约束条件
   */
  private transformConstraints(constraints: any[]): PhysicsIR['constraints'] {
    return constraints.map(constraint => ({
      type: constraint.type,
      objects: [],
      parameters: constraint.parameters ? constraint.parameters.map((p: any) => this.transformPhysicsParameter(p)) : [],
      expression: constraint.expression || '',
      tolerance: 0.001
    }));
  }

  /**
   * 转换力
   */
  private transformForces(forces: any[]): PhysicsIR['forces'] {
    return forces.map(force => ({
      type: force.type,
      source: force.source,
      target: force.target,
      magnitude: this.transformPhysicalQuantity(force.magnitude),
      direction: this.transformVector(force.direction),
      position: force.position ? this.transformVector(force.position) : undefined,
      timeFunction: force.timeFunction || ''
    }));
  }

  /**
   * 转换场
   */
  private transformFields(fields: any[]): PhysicsIR['fields'] {
    return fields.map(field => ({
      type: field.type,
      source: field.source,
      magnitude: this.transformPhysicalQuantity(field.magnitude),
      direction: this.transformVector(field.direction),
      range: field.range ? this.transformPhysicalQuantity(field.range) : undefined,
      decay: field.decay || 'none'
    }));
  }

  /**
   * 转换常量
   */
  private transformConstants(constants: any[]): PhysicsIR['constants'] {
    return constants.map(constant => ({
      name: constant.name,
      value: this.transformPhysicalQuantity(constant.value),
      description: constant.description || '',
      source: constant.source || 'user_defined'
    }));
  }

  /**
   * 转换仿真配置
   */
  private transformSimulation(simulation: any): PhysicsIR['simulation'] {
    return {
      timeStep: this.transformPhysicalQuantity(simulation.time_step),
      duration: this.transformPhysicalQuantity(simulation.duration),
      solver: simulation.solver || 'rk4',
      tolerance: simulation.precision === 'high' ? 0.0001 : 0.001,
      maxIterations: simulation.max_iterations || 1000,
      events: simulation.events || [],
      output: simulation.output || {}
    };
  }

  /**
   * 转换输出配置
   */
  private transformOutput(output: any): PhysicsIR['output'] {
    return {
      format: 'json',
      variables: output.variables || [],
      sampling: undefined,
      visualization: output.visualization || {},
      export: output.export || {}
    };
  }

  /**
   * 转换物理量
   */
  private transformPhysicalQuantity(quantity: any): PhysicalQuantity {
    if (!quantity) {
      throw new Error('物理量不能为空');
    }

    return {
      value: quantity.value,
      unit: quantity.unit || 'SI',
      uncertainty: quantity.uncertainty || 0
    };
  }

  /**
   * 转换向量
   */
  private transformVector(vector: any): { x: number; y: number; z: number } {
    if (Array.isArray(vector)) {
      return {
        x: vector[0] || 0,
        y: vector[1] || 0,
        z: vector[2] || 0
      };
    }
    
    return {
      x: vector.x || 0,
      y: vector.y || 0,
      z: vector.z || 0
    };
  }

  /**
   * 转换尺寸
   */
  private transformDimensions(dimensions: any): { length: PhysicalQuantity; width?: PhysicalQuantity; height?: PhysicalQuantity } {
    return {
      length: this.transformPhysicalQuantity(dimensions.length),
      width: dimensions.width ? this.transformPhysicalQuantity(dimensions.width) : undefined,
      height: dimensions.height ? this.transformPhysicalQuantity(dimensions.height) : undefined
    };
  }

  /**
   * 转换物理参数
   */
  private transformPhysicsParameter(param: any): PhysicsParameter {
    return {
      symbol: param.symbol || param.name || '',
      value: this.transformPhysicalQuantity(param.value),
      role: param.role || 'input',
      description: param.description || '',
      source: param.source || 'user_defined',
      uncertainty: param.uncertainty || 0,
      constraints: param.constraints || []
    };
  }

  /**
   * 生成验证信息
   */
  private generateValidationInfo(dsl: PhysicsDSL): PhysicsIR['validation'] {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        structure: true,
        units: this.checkUnitConsistency(dsl),
        constraints: this.checkConstraintConsistency(dsl),
        initialValues: this.checkInitialValueReasonableness(dsl)
      },
      warnings: [],
      errors: []
    };
  }

  /**
   * 检查单位一致性
   */
  private checkUnitConsistency(dsl: PhysicsDSL): boolean {
    // 实现单位一致性检查逻辑
    try {
      // 检查所有物理量的单位是否兼容
      const units = this.extractAllUnits(dsl);
      return this.validateUnitCompatibility(units);
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查约束一致性
   */
  private checkConstraintConsistency(dsl: PhysicsDSL): boolean {
    // 实现约束一致性检查逻辑
    try {
      const constraints = dsl.system.constraints || [];
      return constraints.every(constraint => {
        // 检查约束是否与系统类型兼容
        return this.isConstraintCompatible(constraint, dsl.system.type);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查初始值合理性
   */
  private checkInitialValueReasonableness(dsl: PhysicsDSL): boolean {
    // 实现初始值合理性检查逻辑
    try {
      const initialConditions = dsl.system.initial_conditions || [];
      return initialConditions.every(condition => {
        // 检查初始值是否在合理范围内
        return this.isValueReasonable(condition.value, condition.name);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 提取所有单位
   */
  private extractAllUnits(dsl: PhysicsDSL): string[] {
    const units: string[] = [];
    
    // 从初始条件中提取单位
    (dsl.system.initial_conditions || []).forEach(cond => {
      if (cond.value?.unit) units.push(cond.value.unit);
    });

    return units;
  }

  /**
   * 验证单位兼容性
   */
  private validateUnitCompatibility(units: string[]): boolean {
    // 简化的单位兼容性检查
    const baseUnits = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];
    return units.every(unit => {
      // 检查是否为基本单位或导出单位
      return baseUnits.some(base => unit.includes(base)) || 
             unit === 'SI' || 
             unit === 'N' || 
             unit === 'J' || 
             unit === 'W';
    });
  }

  /**
   * 检查约束兼容性
   */
  private isConstraintCompatible(constraint: any, systemType: string): boolean {
    const constraintTypes = {
      'kinematics_linear': ['position', 'velocity', 'acceleration', 'time'],
      'dynamics_newton': ['force', 'mass', 'acceleration', 'friction'],
      'electrostatics': ['charge', 'field', 'potential', 'force'],
      'thermodynamics': ['temperature', 'pressure', 'volume', 'energy']
    };

    const allowedTypes = constraintTypes[systemType as keyof typeof constraintTypes] || [];
    return allowedTypes.includes(constraint.type);
  }

  /**
   * 检查值合理性
   */
  private isValueReasonable(value: any, parameter: string): boolean {
    if (!value || typeof value.value !== 'number') return false;

    const reasonableRanges = {
      'mass': { min: 0.001, max: 1000000 }, // 1g 到 1000t
      'velocity': { min: -1000, max: 1000 }, // -1000 m/s 到 1000 m/s
      'acceleration': { min: -1000, max: 1000 }, // -1000 m/s² 到 1000 m/s²
      'force': { min: -1000000, max: 1000000 }, // -1MN 到 1MN
      'temperature': { min: -273.15, max: 10000 } // 绝对零度到 10000K
    };

    const range = reasonableRanges[parameter as keyof typeof reasonableRanges];
    if (!range) return true; // 未知参数默认通过

    return value.value >= range.min && value.value <= range.max;
  }

  /**
   * 校验 IR 完整性
   */
  private validateIRCompleteness(ir: PhysicsIR): void {
    const requiredFields = ['metadata', 'system', 'objects', 'initialConditions', 'simulation', 'output'];
    
    for (const field of requiredFields) {
      if (!ir[field as keyof PhysicsIR]) {
        throw new Error(`IR 缺少必需字段: ${field}`);
      }
    }

    // 检查初始条件
    if (ir.initialConditions.length === 0) {
      throw new Error('IR 必须包含至少一个初始条件');
    }
  }

  /**
   * 主解析方法：从 YAML 直接到 IR
   */
  public parse(yamlContent: string): PhysicsIR {
    const dsl = this.parseYamlToDSL(yamlContent);
    return this.parseDSLToIR(dsl);
  }

  /**
   * 验证并转换 DSL
   */
  private validateAndTransformDSL(raw: any): PhysicsDSL {
    // 基础验证
    if (!raw.metadata || !raw.system) {
      throw new Error('DSL 缺少必需的 metadata 或 system 字段');
    }

    return raw as PhysicsDSL;
  }
}

/**
 * 便捷的解析函数
 */
export function parsePhysicsDSL(yamlContent: string): PhysicsIR {
  const parser = new PhysicsParser();
  return parser.parse(yamlContent);
}

/**
 * 校验 DSL 结构
 */
export function validatePhysicsDSL(dsl: any): boolean {
  const parser = new PhysicsParser();
  try {
    parser.validateDSLStructure(dsl);
    return true;
  } catch {
    return false;
  }
}
