import { PhysicsDSL, PhysicsIR, PhysicsSchema } from '../../frontend/types/dsl';
import { PhysicalQuantity, PhysicsObject, PhysicsParameter } from '../../frontend/types/PhysicsTypes';
// 导入 unitConverter 模块
import { 
  areUnitsCompatible, 
  standardizeUnit, 
  convertValue,
  type ConversionResult 
} from '../ai_parsing/unitConverter';

/**
 * PhysicsParser - 将 PhysicsDSL (YAML) 解析为中间 IR (JSON)
 * 负责：DSL 解析、结构校验、类型转换、单位标准化
 * 更新：集成 unitConverter 模块，提供更智能的单位处理
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
   * 检查单位一致性 - 使用 unitConverter 进行智能检查
   */
  private checkUnitConsistency(dsl: PhysicsDSL): boolean {
    try {
      // 检查所有物理量的单位是否兼容
      const units = this.extractAllUnits(dsl);
      return this.validateUnitCompatibility(units);
    } catch (error) {
      console.warn('单位一致性检查失败:', error);
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
   * 提取所有单位 - 使用 unitConverter 进行标准化
   */
  private extractAllUnits(dsl: PhysicsDSL): string[] {
    const units: string[] = [];
    
    // 从初始条件中提取并标准化单位
    (dsl.system.initial_conditions || []).forEach(cond => {
      if (cond.value?.unit) {
        const stdUnit = standardizeUnit(cond.value.unit);
        if (stdUnit.isValid) {
          units.push(stdUnit.standard);
        } else {
          // 如果标准化失败，保留原单位并记录警告
          console.warn(`单位标准化失败: ${cond.value.unit} -> ${stdUnit.error}`);
          units.push(cond.value.unit);
        }
      }
    });

    // 从约束中提取单位
    (dsl.system.constraints || []).forEach(constraint => {
      if (constraint.value?.unit) {
        const stdUnit = standardizeUnit(constraint.value.unit);
        if (stdUnit.isValid) {
          units.push(stdUnit.standard);
        }
      }
    });

    // 从常量中提取单位
    (dsl.system.constants || []).forEach(constant => {
      if (constant.value?.unit) {
        const stdUnit = standardizeUnit(constant.value.unit);
        if (stdUnit.isValid) {
          units.push(stdUnit.standard);
        }
      }
    });

    return units;
  }

  /**
   * 验证单位兼容性 - 使用 unitConverter 进行智能检查
   */
  private validateUnitCompatibility(units: string[]): boolean {
    if (units.length <= 1) return true;
    
    try {
      // 使用 unitConverter 进行智能单位兼容性检查
      for (let i = 1; i < units.length; i++) {
        if (!areUnitsCompatible(units[0], units[i])) {
          console.warn(`单位不兼容: ${units[0]} 与 ${units[i]}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('单位兼容性检查异常:', error);
      // 回退到基础检查
      return this.fallbackUnitCompatibilityCheck(units);
    }
  }

  /**
   * 回退的单位兼容性检查 - 当 unitConverter 失败时使用
   */
  private fallbackUnitCompatibilityCheck(units: string[]): boolean {
    const baseUnits = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];
    const derivedUnits = ['N', 'J', 'W', 'Pa', 'V', 'Ω', 'T', 'Hz'];
    
    return units.every(unit => {
      // 检查是否为基本单位或导出单位
      return baseUnits.some(base => unit.includes(base)) || 
             derivedUnits.includes(unit) ||
             unit === 'SI';
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

/**
 * 新增：单位转换和验证功能
 */
export class UnitProcessor {
  /**
   * 批量转换单位
   * @param values 需要转换的数值数组
   * @param fromUnit 原单位
   * @param toUnit 目标单位
   * @returns 转换后的数值数组
   */
  static batchConvertUnits(values: number[], fromUnit: string, toUnit: string): number[] {
    return values.map(value => {
      const converted = convertValue(value, fromUnit, toUnit);
      return converted !== null ? converted : value;
    });
  }

  /**
   * 验证单位字符串的有效性
   * @param unit 单位字符串
   * @returns 验证结果
   */
  static validateUnit(unit: string): ConversionResult {
    return standardizeUnit(unit);
  }

  /**
   * 检查多个单位的兼容性
   * @param units 单位数组
   * @returns 兼容性检查结果
   */
  static checkUnitsCompatibility(units: string[]): { compatible: boolean; incompatiblePairs: string[][] } {
    const incompatiblePairs: string[][] = [];
    
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        if (!areUnitsCompatible(units[i], units[j])) {
          incompatiblePairs.push([units[i], units[j]]);
        }
      }
    }
    
    return {
      compatible: incompatiblePairs.length === 0,
      incompatiblePairs
    };
  }

  /**
   * 生成单位转换报告
   * @param dsl PhysicsDSL 对象
   * @returns 单位转换报告
   */
  static generateUnitReport(dsl: PhysicsDSL): {
    totalUnits: number;
    standardizedUnits: number;
    conversionFailures: string[];
    compatibilityIssues: string[][];
  } {
    const allUnits: string[] = [];
    const conversionFailures: string[] = [];
    
    // 收集所有单位
    const extractUnitsFromValue = (value: any) => {
      if (value?.unit) {
        allUnits.push(value.unit);
        const stdUnit = standardizeUnit(value.unit);
        if (!stdUnit.isValid) {
          conversionFailures.push(`${value.unit} -> ${stdUnit.error}`);
        }
      }
    };
    
    // 从各个部分提取单位
    (dsl.system.initial_conditions || []).forEach(cond => extractUnitsFromValue(cond.value));
    (dsl.system.constraints || []).forEach(constraint => extractUnitsFromValue(constraint.value));
    (dsl.system.constants || []).forEach(constant => extractUnitsFromValue(constant.value));
    
    // 检查兼容性
    const compatibilityResult = this.checkUnitsCompatibility(allUnits);
    
    return {
      totalUnits: allUnits.length,
      standardizedUnits: allUnits.length - conversionFailures.length,
      conversionFailures,
      compatibilityIssues: compatibilityResult.incompatiblePairs
    };
  }
}

/**
 * 新增：单位验证器
 */
export class UnitValidator {
  /**
   * 验证 DSL 中的单位一致性
   * @param dsl PhysicsDSL 对象
   * @returns 验证结果
   */
  static validateDSLUnits(dsl: PhysicsDSL): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // 生成单位报告
      const report = UnitProcessor.generateUnitReport(dsl);
      
      // 检查转换失败
      if (report.conversionFailures.length > 0) {
        issues.push(`发现 ${report.conversionFailures.length} 个无法标准化的单位`);
        report.conversionFailures.forEach(failure => {
          issues.push(`  - ${failure}`);
        });
        recommendations.push('检查单位拼写，确保使用标准单位符号');
      }
      
      // 检查兼容性问题
      if (report.compatibilityIssues.length > 0) {
        issues.push(`发现 ${report.compatibilityIssues.length} 组不兼容的单位`);
        report.compatibilityIssues.forEach(pair => {
          issues.push(`  - ${pair[0]} 与 ${pair[1]} 不兼容`);
        });
        recommendations.push('确保相关物理量使用兼容的单位');
      }
      
      // 统计信息
      if (report.totalUnits > 0) {
        const successRate = ((report.standardizedUnits / report.totalUnits) * 100).toFixed(1);
        recommendations.push(`单位标准化成功率: ${successRate}%`);
      }
      
      return {
        valid: issues.length === 0,
        issues,
        recommendations
      };
      
    } catch (error) {
      return {
        valid: false,
        issues: [`单位验证过程出错: ${error instanceof Error ? error.message : '未知错误'}`],
        recommendations: ['检查 DSL 结构是否正确']
      };
    }
  }
}
