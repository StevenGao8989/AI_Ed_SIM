/**
 * 物理仿真中间表示 (Intermediate Representation)
 * 
 * IR 是 DSL 和仿真引擎之间的桥梁，包含：
 * 1. 预计算的数据结构
 * 2. 优化的物理参数
 * 3. 仿真引擎友好的格式
 * 4. 多模块联立系统的表示
 * 5. 完整的物理约束和守恒定律
 * 6. 跨领域的物理量纲系统
 * 7. 智能的模块依赖关系
 * 8. 精确的数值计算配置
 */

// ===== 基础类型定义 =====

export interface IRVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IRPhysicalQuantity {
  value: number;
  unit: string;
  dimension: string; // 量纲，如 "L", "T", "M", "LT^-1"
  uncertainty?: number; // 测量不确定度
  precision?: number; // 数值精度
  range?: {
    min: number;
    max: number;
  }; // 物理合理范围
}

// 物理量纲系统
export interface IRDimension {
  L: number; // 长度
  M: number; // 质量
  T: number; // 时间
  I: number; // 电流
  Θ: number; // 温度
  N: number; // 物质的量
  J: number; // 发光强度
}

// 物理守恒定律
export interface IRConservationLaw {
  type: 'energy' | 'momentum' | 'angular_momentum' | 'charge' | 'mass' | 'particle_number';
  expression: string;
  variables: string[];
  tolerance: number;
  description: string;
}

export interface IRParameter {
  symbol: string;
  value: IRPhysicalQuantity;
  role: 'given' | 'unknown' | 'constant' | 'derived';
  description: string;
  dependencies: string[]; // 依赖的其他参数
  constraints: IRConstraint[];
}

export interface IRConstraint {
  type: 'equality' | 'inequality' | 'boundary' | 'initial' | 'physical' | 'conservation' | 'symmetry' | 'causality';
  expression: string; // 数学表达式
  parameters: string[]; // 涉及的参数
  description: string;
  priority: 'critical' | 'important' | 'optional'; // 约束优先级
  tolerance?: number; // 数值容差
  domain?: {
    spatial?: string; // 空间域
    temporal?: string; // 时间域
  };
  physics_law?: string; // 对应的物理定律
}

export interface IRObject {
  id: string;
  name: string;
  type: 'particle' | 'rigid_body' | 'field' | 'wave';
  position: IRVector3;
  velocity: IRVector3;
  acceleration: IRVector3;
  mass: IRPhysicalQuantity;
  properties: Record<string, IRPhysicalQuantity>;
  constraints: IRConstraint[];
}

export interface IRModule {
  id: string;
  type: 'oscillation' | 'wave' | 'kinematics' | 'dynamics' | 'electromagnetic' | 'thermal' | 'optical' | 'quantum' | 'fluid' | 'statistical' | 'relativistic' | 'nuclear' | 'generic';
  name: string;
  description: string;
  parameters: IRParameter[];
  equations: IREquation[];
  dependencies: string[]; // 依赖的其他模块
  output: string[]; // 输出变量
  conservation_laws: IRConservationLaw[]; // 守恒定律
  assumptions: string[]; // 物理假设
  limitations: string[]; // 适用范围限制
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert'; // 复杂度等级
  domain: {
    spatial: '1d' | '2d' | '3d';
    temporal: 'static' | 'quasi_static' | 'dynamic';
    scale: 'microscopic' | 'macroscopic' | 'cosmological';
  };
}

export interface IREquation {
  id: string;
  type: 'differential' | 'algebraic' | 'constraint' | 'integral' | 'transcendental' | 'matrix';
  expression: string; // 数学表达式
  variables: string[]; // 涉及的变量
  parameters: string[]; // 涉及的参数
  description: string;
  order?: number; // 微分方程阶数
  linearity: 'linear' | 'nonlinear' | 'quasilinear'; // 线性性质
  stability?: 'stable' | 'unstable' | 'marginally_stable'; // 稳定性
  boundary_conditions?: string[]; // 边界条件
  initial_conditions?: string[]; // 初始条件
  physics_meaning: string; // 物理意义
  derivation?: string; // 推导过程
}

export interface IRSimulationConfig {
  duration: IRPhysicalQuantity;
  time_step: IRPhysicalQuantity;
  solver: 'euler' | 'rk4' | 'verlet' | 'adaptive';
  precision: 'low' | 'medium' | 'high' | 'ultra';
  tolerance: number;
  max_iterations: number;
  events: IREvent[];
}

export interface IREvent {
  id: string;
  type: 'time' | 'threshold' | 'custom' | 'boundary' | 'collision' | 'condition';
  trigger: {
    condition: string;
    value: IRPhysicalQuantity;
  };
  action: string;
  description: string;
}

export interface IROutputConfig {
  variables: string[];
  export_formats: string[];
  plots: IRPlot[];
  animations: IRAnimation[];
  checkpoints: IRCheckpoint[];
}

export interface IRPlot {
  id: string;
  type: 'time_series' | 'trajectory' | 'phase_space' | 'energy' | 'field';
  title: string;
  x_axis: string;
  y_axis: string;
  variables: string[];
  style: Record<string, any>;
}

export interface IRAnimation {
  id: string;
  type: '2d' | '3d';
  camera: 'fixed' | 'follow' | 'orbit' | 'first_person';
  speed: number;
  loop: boolean;
  duration: number;
  easing: string;
  objects: string[]; // 要显示的对象
  style: Record<string, any>;
}

export interface IRCheckpoint {
  id: string;
  time: IRPhysicalQuantity;
  variables: string[];
  description: string;
}

// ===== 主要 IR 结构 =====

export interface PhysicsIR {
  // 元数据
  metadata: {
    id: string;
    version: string;
    created_at: string;
    source_dsl_id: string;
    system_type: string;
    difficulty: string;
    grade: string;
    physics_domain: string[]; // 涉及的物理领域
    complexity_score: number; // 复杂度评分
    estimated_solve_time: number; // 预估求解时间
  };

  // 物理系统
  system: {
    type: string;
    dimensions: number;
    modules: IRModule[];
    objects: IRObject[];
    parameters: IRParameter[];
    constraints: IRConstraint[];
    conservation_laws: IRConservationLaw[]; // 系统守恒定律
    symmetries: string[]; // 对称性
    environment: {
      gravity: IRPhysicalQuantity;
      air_resistance: boolean;
      temperature: IRPhysicalQuantity;
      pressure?: IRPhysicalQuantity;
      magnetic_field?: IRVector3;
      electric_field?: IRVector3;
      medium_properties?: Record<string, IRPhysicalQuantity>;
    };
    boundary_conditions: IRConstraint[]; // 边界条件
    initial_conditions: IRConstraint[]; // 初始条件
  };

  // 仿真配置
  simulation: IRSimulationConfig;

  // 输出配置
  output: IROutputConfig;

  // 计算优化
  optimization: {
    precomputed_values: Record<string, number>;
    cached_derivatives: Record<string, string>;
    parallel_modules: string[][]; // 可以并行计算的模块组
    dependency_graph: Record<string, string[]>; // 依赖关系图
    numerical_stability: {
      condition_number: number;
      stability_analysis: string;
      recommended_solver: string;
    };
    performance_metrics: {
      estimated_operations: number;
      memory_requirements: number;
      parallel_efficiency: number;
    };
  };

  // 验证信息
  validation: {
    structure_valid: boolean;
    physics_valid: boolean;
    units_consistent: boolean;
    constraints_satisfied: boolean;
    conservation_laws_satisfied: boolean;
    numerical_stability: boolean;
    warnings: string[];
    errors: string[];
    physics_consistency_score: number; // 物理一致性评分
    validation_timestamp: string;
  };

  // 物理分析
  physics_analysis: {
    dominant_effects: string[]; // 主导效应
    approximation_level: 'exact' | 'first_order' | 'second_order' | 'phenomenological';
    physical_interpretation: string; // 物理解释
    educational_value: {
      concepts: string[]; // 涉及概念
      difficulty_level: number; // 难度等级
      prerequisites: string[]; // 前置知识
    };
  };
}

// ===== 工具类型 =====

export interface IRConversionOptions {
  optimize_for_simulation: boolean;
  include_derivatives: boolean;
  precompute_constants: boolean;
  validate_physics: boolean;
  verbose: boolean;
}

export interface IRConversionResult {
  success: boolean;
  ir: PhysicsIR | null;
  warnings: string[];
  errors: string[];
  conversion_time: number;
  optimization_applied: string[];
  physics_analysis: {
    complexity_assessment: string;
    dominant_physics: string[];
    approximation_quality: number;
  };
}

// ===== 物理量纲计算工具 =====

export class DimensionCalculator {
  private static readonly BASE_DIMENSIONS: IRDimension = {
    L: 0, M: 0, T: 0, I: 0, Θ: 0, N: 0, J: 0
  };

  /**
   * 解析量纲字符串为 IRDimension
   */
  static parseDimension(dimensionStr: string): IRDimension {
    const dim = { ...this.BASE_DIMENSIONS };
    
    // 解析如 "L^2T^-1" 这样的量纲字符串
    const matches = dimensionStr.match(/([A-Za-zΘ])(\^-?\d+)?/g);
    if (matches) {
      matches.forEach(match => {
        const [base, exp] = match.split('^');
        const exponent = exp ? parseInt(exp) : 1;
        
        switch (base) {
          case 'L': dim.L = exponent; break;
          case 'M': dim.M = exponent; break;
          case 'T': dim.T = exponent; break;
          case 'I': dim.I = exponent; break;
          case 'Θ': dim.Θ = exponent; break;
          case 'N': dim.N = exponent; break;
          case 'J': dim.J = exponent; break;
        }
      });
    }
    
    return dim;
  }

  /**
   * 将 IRDimension 转换为字符串
   */
  static dimensionToString(dim: IRDimension): string {
    const parts: string[] = [];
    
    Object.entries(dim).forEach(([key, value]) => {
      if (value !== 0) {
        if (value === 1) {
          parts.push(key);
        } else {
          parts.push(`${key}^${value}`);
        }
      }
    });
    
    return parts.length > 0 ? parts.join('') : '1';
  }

  /**
   * 验证量纲一致性
   */
  static validateDimensionConsistency(dim1: IRDimension, dim2: IRDimension): boolean {
    return Object.keys(this.BASE_DIMENSIONS).every(key => 
      dim1[key as keyof IRDimension] === dim2[key as keyof IRDimension]
    );
  }

  /**
   * 计算量纲乘积
   */
  static multiplyDimensions(dim1: IRDimension, dim2: IRDimension): IRDimension {
    const result = { ...this.BASE_DIMENSIONS };
    Object.keys(this.BASE_DIMENSIONS).forEach(key => {
      result[key as keyof IRDimension] = 
        dim1[key as keyof IRDimension] + dim2[key as keyof IRDimension];
    });
    return result;
  }

  /**
   * 计算量纲除法
   */
  static divideDimensions(dim1: IRDimension, dim2: IRDimension): IRDimension {
    const result = { ...this.BASE_DIMENSIONS };
    Object.keys(this.BASE_DIMENSIONS).forEach(key => {
      result[key as keyof IRDimension] = 
        dim1[key as keyof IRDimension] - dim2[key as keyof IRDimension];
    });
    return result;
  }
}

// ===== 物理常数库 =====

export const PHYSICS_CONSTANTS = {
  // 基本常数
  c: { value: 299792458, unit: 'm/s', dimension: 'LT^-1', name: '光速' },
  h: { value: 6.62607015e-34, unit: 'J⋅s', dimension: 'ML^2T^-1', name: '普朗克常数' },
  k_B: { value: 1.380649e-23, unit: 'J/K', dimension: 'ML^2T^-2Θ^-1', name: '玻尔兹曼常数' },
  e: { value: 1.602176634e-19, unit: 'C', dimension: 'IT', name: '基本电荷' },
  m_e: { value: 9.1093837015e-31, unit: 'kg', dimension: 'M', name: '电子质量' },
  m_p: { value: 1.67262192369e-27, unit: 'kg', dimension: 'M', name: '质子质量' },
  
  // 引力常数
  G: { value: 6.67430e-11, unit: 'm^3/(kg⋅s^2)', dimension: 'L^3M^-1T^-2', name: '万有引力常数' },
  
  // 电磁常数
  ε_0: { value: 8.8541878128e-12, unit: 'F/m', dimension: 'I^2T^4M^-1L^-3', name: '真空介电常数' },
  μ_0: { value: 1.25663706212e-6, unit: 'H/m', dimension: 'MLI^-2T^-2', name: '真空磁导率' },
  
  // 其他常数
  g: { value: 9.80665, unit: 'm/s^2', dimension: 'LT^-2', name: '标准重力加速度' },
  R: { value: 8.314462618, unit: 'J/(mol⋅K)', dimension: 'ML^2T^-2Θ^-1N^-1', name: '气体常数' },
  N_A: { value: 6.02214076e23, unit: 'mol^-1', dimension: 'N^-1', name: '阿伏伽德罗常数' }
};
