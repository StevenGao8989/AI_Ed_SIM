// frontend/types/dsl.ts
// DSL 类型定义 - 与 PhysicsTypes.ts 集成的完整类型系统

// 导入基础物理类型
import type {
  PhysicalQuantity,
  PhysicsSystemType,
  PhysicsParameter as BasePhysicsParameter,
  ParameterRole,
  SyllabusTag,
  ExtendedPhysicsSystemType
} from './PhysicsTypes';

// ===== 主要 DSL 接口 =====

export interface PhysicsDSL {
  metadata: DSLMetadata;
  system: PhysicsSystem;
  simulation: SimulationConfig;
  output: OutputConfig;
  syllabus?: SyllabusTag[]; // 新增：学段和主题标签
}

// ===== 元数据接口 =====

export interface DSLMetadata {
  subject: 'physics' | 'chemistry' | 'math' | 'biology';
  topic: string;
  topic_id: string;
  version: string;
  timestamp: string;
  source_question: string;
  grade?: string; // 新增：学段信息
  difficulty?: 'easy' | 'medium' | 'hard'; // 新增：难度等级
}

// ===== 物理系统接口 =====

export interface PhysicsSystem {
  type: ExtendedPhysicsSystemType; // 使用扩展的系统类型
  parameters: DSLParameter[];
  initial_conditions: InitialCondition[];
  constraints: Constraint[];
  constants: Constant[];
  objects?: PhysicsObject[]; // 新增：物理对象列表
  materials?: string[]; // 新增：材料列表
}

// ===== 物理对象接口 =====

export interface PhysicsObject {
  id: string;
  name: string;
  type: 'particle' | 'rigid_body' | 'fluid' | 'field' | 'wave';
  mass: PhysicalQuantity;
  position: PhysicalQuantity; // 简化为 PhysicalQuantity
  velocity: PhysicalQuantity;
  acceleration: PhysicalQuantity;
  properties: Record<string, any>;
}

// ===== DSL 参数接口（与 PhysicsTypes 保持一致） =====

export interface DSLParameter {
  symbol: string;
  value: PhysicalQuantity; // 使用 PhysicalQuantity 而不是简单的 number + unit
  role: ParameterRole; // 使用 PhysicsTypes 中定义的 ParameterRole
  description: string;
  standard_value?: PhysicalQuantity | null; // 标准化后的物理量
  constraints?: PhysicalRange[]; // 新增：约束范围
  uncertainty?: number; // 新增：不确定性
}

// ===== 物理量范围接口 =====

export interface PhysicalRange {
  min: number;
  max: number;
  unit: string;
  inclusive: boolean;
}

// ===== 初始条件接口 =====

export interface InitialCondition {
  name: string;
  value: PhysicalQuantity; // 使用 PhysicalQuantity
  description: string;
  time?: number; // 新增：时间点
}

// ===== 约束条件接口 =====

export interface Constraint {
  type: 'gravity' | 'friction' | 'air_resistance' | 'boundary' | 'custom' | 'spring' | 'rope';
  value: PhysicalQuantity; // 使用 PhysicalQuantity
  description: string;
  expression?: string; // 数学表达式
  objects?: string[]; // 新增：参与约束的对象 ID
  stiffness?: PhysicalQuantity; // 新增：弹簧刚度
  restLength?: PhysicalQuantity; // 新增：弹簧原长
}

// ===== 常量接口 =====

export interface Constant {
  name: string;
  value: PhysicalQuantity; // 使用 PhysicalQuantity
  description: string;
  source: 'standard' | 'given' | 'derived' | 'calculated';
  category?: 'mechanical' | 'electrical' | 'thermal' | 'optical'; // 新增：常量类别
}

// ===== 仿真配置接口 =====

export interface SimulationConfig {
  duration: PhysicalQuantity; // 使用 PhysicalQuantity
  time_step: PhysicalQuantity;
  events: SimulationEvent[];
  solver: 'euler' | 'rk4' | 'verlet' | 'adaptive';
  precision: 'low' | 'medium' | 'high' | 'ultra';
  max_iterations?: number; // 新增：最大迭代次数
  tolerance?: number; // 新增：收敛容差
}

// ===== 仿真事件接口 =====

export interface SimulationEvent {
  type: 'collision' | 'boundary' | 'threshold' | 'custom' | 'time' | 'condition';
  condition: string; // 触发条件
  action: 'stop' | 'bounce' | 'absorb' | 'custom' | 'restart' | 'log';
  description: string;
  time?: number; // 新增：事件时间
  parameters?: Record<string, any>; // 新增：事件参数
}

// ===== 输出配置接口 =====

export interface OutputConfig {
  variables: string[];
  plots: PlotConfig[];
  animations: AnimationConfig[];
  export_formats: string[];
  resolution?: 'low' | 'medium' | 'high'; // 新增：输出分辨率
  frame_rate?: number; // 新增：动画帧率
}

// ===== 图表配置接口 =====

export interface PlotConfig {
  type: 'trajectory' | 'time_series' | 'phase_space' | 'energy' | 'velocity' | 'acceleration';
  x_axis: string;
  y_axis: string;
  title: string;
  x_label?: string; // 新增：X轴标签
  y_label?: string; // 新增：Y轴标签
  grid?: boolean; // 新增：是否显示网格
  legend?: boolean; // 新增：是否显示图例
}

// ===== 动画配置接口 =====

export interface AnimationConfig {
  type: '2d' | '3d' | 'isometric';
  camera: 'fixed' | 'follow' | 'orbit' | 'first_person';
  speed: number;
  loop: boolean;
  duration?: number; // 新增：动画持续时间
  easing?: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out'; // 新增：缓动函数
}

// ===== DSL 生成器接口 =====

export interface DSLGenerator {
  generateDSL(parsedQuestion: any): PhysicsDSL;
  generateYAML(parsedQuestion: any): string;
  validateDSL(dsl: PhysicsDSL): DSLValidationResult; // 新增：验证功能
}

// ===== DSL 验证结果接口 =====

export interface DSLValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[]; // 新增：改进建议
}

// ===== 验证错误接口 =====

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error' | 'critical' | 'warning';
  suggestion?: string; // 新增：修复建议
}

// ===== 验证警告接口 =====

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  suggestion?: string;
  impact?: 'low' | 'medium' | 'high'; // 新增：影响程度
}

// ===== DSL 解析结果接口 =====

export interface DSLParseResult {
  success: boolean;
  dsl?: PhysicsDSL;
  error?: string;
  warnings?: string[];
  parseTime?: number; // 新增：解析耗时
  version?: string; // 新增：DSL 版本
}

// ===== DSL 转换选项接口 =====

export interface DSLConversionOptions {
  format: 'json' | 'yaml' | 'xml' | 'csv';
  pretty?: boolean;
  includeMetadata?: boolean;
  validateBeforeConvert?: boolean;
  compression?: boolean; // 新增：是否压缩
}

// ===== 物理量单位接口（与 PhysicsTypes 保持一致） =====

export interface PhysicalUnit {
  symbol: string;
  name: string;
  baseUnit: string;
  conversionFactor: number;
  category: 'length' | 'time' | 'mass' | 'temperature' | 'current' | 'luminosity' | 'amount' | 'derived';
  description?: string; // 新增：单位描述
}

// ===== 物理公式接口（与 PhysicsTypes 保持一致） =====

export interface PhysicalFormula {
  name: string;
  expression: string;
  variables: string[];
  units: Record<string, string>;
  description: string;
  category: PhysicsSystemType;
  conditions?: string[]; // 新增：适用条件
  limitations?: string[]; // 新增：使用限制
}

// ===== DSL 模板接口 =====

export interface DSLTemplate {
  id: string;
  name: string;
  description: string;
  category: ExtendedPhysicsSystemType; // 使用扩展的系统类型
  template: Partial<PhysicsDSL>;
  parameters: TemplateParameter[];
  syllabus?: SyllabusTag[]; // 新增：学段和主题标签
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // 新增：难度等级
}

// ===== 模板参数接口 =====

export interface TemplateParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'PhysicalQuantity' | 'PhysicsObject';
  required: boolean;
  default?: any;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    unit?: string; // 新增：单位验证
    range?: PhysicalRange; // 新增：范围验证
  };
}

// ===== DSL 版本管理接口 =====

export interface DSLVersion {
  version: string;
  changes: string[];
  breakingChanges: string[];
  deprecatedFeatures: string[];
  migrationGuide?: string;
  releaseDate?: string; // 新增：发布日期
  compatibility?: string[]; // 新增：兼容性信息
}

// ===== DSL 统计信息接口 =====

export interface DSLStatistics {
  totalGenerated: number;
  validationSuccess: number;
  validationErrors: number;
  mostCommonTopics: Array<{
    topic: ExtendedPhysicsSystemType; // 使用扩展的系统类型
    count: number;
    percentage: number;
  }>;
  averageComplexity: number;
  lastUpdated: string;
  userCount?: number; // 新增：用户数量
  successRate?: number; // 新增：成功率
}

// ===== 新增：DSL 工作流接口 =====

export interface DSLWorkflow {
  id: string;
  name: string;
  steps: DSLWorkflowStep[];
  description: string;
  estimatedTime?: number; // 预估执行时间
}

export interface DSLWorkflowStep {
  id: string;
  name: string;
  type: 'parse' | 'validate' | 'simulate' | 'render' | 'export';
  input: string[];
  output: string[];
  dependencies: string[]; // 依赖的其他步骤
  timeout?: number; // 超时时间
}

// ===== 新增：DSL 性能指标接口 =====

export interface DSLPerformanceMetrics {
  parseTime: number;
  validationTime: number;
  simulationTime: number;
  renderTime: number;
  totalTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// ===== 新增：PhysicsIR 中间表示类型 =====

export interface PhysicsIR {
  metadata: IRMetadata;
  system: IRSystem;
  objects: IRObject[];
  initialConditions: IRInitialCondition[];
  constraints: IRConstraint[];
  forces: IRForce[];
  fields: IRField[];
  constants: IRConstant[];
  simulation: IRSimulation;
  output: IROutput;
  validation: IRValidation;
}

export interface IRMetadata {
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  topics: string[];
  description: string;
  tags: string[];
}

export interface IRSystem {
  type: string;
  dimensions: number;
  coordinateSystem: string;
  gravity?: {
    enabled: boolean;
    value: PhysicalQuantity;
    direction: { x: number; y: number; z: number };
  };
  friction?: {
    enabled: boolean;
    static?: PhysicalQuantity;
    kinetic?: PhysicalQuantity;
    rolling?: PhysicalQuantity;
  };
  airResistance?: {
    enabled: boolean;
    coefficient: PhysicalQuantity;
    density?: PhysicalQuantity;
  };
  environment: Record<string, any>;
}

export interface IRObject {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  mass: PhysicalQuantity;
  dimensions: {
    length: PhysicalQuantity;
    width?: PhysicalQuantity;
    height?: PhysicalQuantity;
  };
  material: Record<string, any>;
  properties: Record<string, any>;
}

export interface IRInitialCondition {
  objectId: string;
  parameter: string;
  value: PhysicalQuantity;
  time: number;
}

export interface IRConstraint {
  type: string;
  objects: string[];
  parameters: DSLParameter[];
  expression: string;
  tolerance: number;
}

export interface IRForce {
  type: string;
  source: string;
  target: string;
  magnitude: PhysicalQuantity;
  direction: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  timeFunction: string;
}

export interface IRField {
  type: string;
  source: string;
  magnitude: PhysicalQuantity;
  direction: { x: number; y: number; z: number };
  range?: PhysicalQuantity;
  decay: string;
}

export interface IRConstant {
  name: string;
  value: PhysicalQuantity;
  description: string;
  source: string;
}

export interface IRSimulation {
  timeStep: PhysicalQuantity;
  duration: PhysicalQuantity;
  solver: string;
  tolerance: number;
  maxIterations: number;
  events: any[];
  output: Record<string, any>;
}

export interface IROutput {
  format: string;
  variables: string[];
  sampling?: PhysicalQuantity;
  visualization: Record<string, any>;
  export: Record<string, any>;
}

export interface IRValidation {
  timestamp: string;
  version: string;
  checks: {
    structure: boolean;
    units: boolean;
    constraints: boolean;
    initialValues: boolean;
  };
  warnings: string[];
  errors: string[];
}

// ===== 新增：PhysicsSchema 类型定义 =====

export interface PhysicsSchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  required: string[];
  properties: Record<string, any>;
  additionalProperties?: boolean;
}

// 所有类型已通过 export interface 导出，无需重复导出