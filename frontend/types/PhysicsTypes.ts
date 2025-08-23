// frontend/types/PhysicsTypes.ts
// 基础物理类型定义 - 为整个物理系统提供基础类型支持

// ===== 基础物理量类型 =====

/**
 * 物理量接口 - 包含数值、单位和不确定性
 */
export interface PhysicalQuantity {
  value: number;
  unit: string;
  uncertainty?: number;
  description?: string;
}

/**
 * 带单位的物理量 - 用于 DSL 参数
 */
export interface UnitValue {
  value: number;
  unit: string;
  standardUnit?: string;
  conversionFactor?: number;
}

/**
 * 物理量范围 - 用于约束和验证
 */
export interface PhysicalRange {
  min: number;
  max: number;
  unit: string;
  inclusive: boolean;
}

// ===== 向量和坐标类型 =====

/**
 * 二维向量
 */
export interface Vector2D {
  x: number;
  y: number;
  unit: string;
}

/**
 * 三维向量
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
  unit: string;
}

/**
 * 位置坐标
 */
export interface Position {
  x: number;
  y: number;
  z?: number;
  unit: string;
}

/**
 * 速度向量
 */
export interface Velocity {
  x: number;
  y: number;
  z?: number;
  unit: string;
}

/**
 * 加速度向量
 */
export interface Acceleration {
  x: number;
  y: number;
  z?: number;
  unit: string;
}

/**
 * 力向量
 */
export interface Force {
  x: number;
  y: number;
  z?: number;
  unit: string;
}

// ===== 物理对象类型 =====

/**
 * 物理对象基础接口
 */
export interface PhysicsObject {
  id: string;
  name: string;
  type: 'particle' | 'rigid_body' | 'fluid' | 'field' | 'wave';
  mass: PhysicalQuantity;
  position: Position;
  velocity: Velocity;
  acceleration: Acceleration;
  properties: Record<string, any>;
}

/**
 * 质点对象
 */
export interface Particle extends PhysicsObject {
  type: 'particle';
  charge?: PhysicalQuantity;
  radius?: PhysicalQuantity;
}

/**
 * 刚体对象
 */
export interface RigidBody extends PhysicsObject {
  type: 'rigid_body';
  momentOfInertia: PhysicalQuantity;
  angularVelocity: PhysicalQuantity;
  angularAcceleration: PhysicalQuantity;
  dimensions: {
    length: PhysicalQuantity;
    width: PhysicalQuantity;
    height: PhysicalQuantity;
  };
}

// ===== 物理系统类型 =====

/**
 * 物理系统类型枚举
 */
export type PhysicsSystemType = 
  | 'projectile'           // 抛体运动
  | 'free_fall'           // 自由落体
  | 'kinematics_linear'   // 匀变速直线运动
  | 'circular_motion'     // 圆周运动
  | 'oscillation'         // 简谐振动
  | 'newton_dynamics'     // 牛顿动力学
  | 'energy_work_power'   // 功、能、功率
  | 'pressure_buoyancy'   // 压强与浮力
  | 'simple_machines'     // 简单机械
  | 'thermal'             // 热学
  | 'waves_sound'         // 波与声音
  | 'geometric_optics'    // 几何光学
  | 'gravitation'         // 万有引力
  | 'electrostatics'      // 静电场
  | 'dc_circuits'         // 直流电路
  | 'magnetism'           // 磁场
  | 'em_induction'        // 电磁感应
  | 'ac'                  // 交流电
  | 'modern_intro';       // 近代物理

/**
 * 物理系统状态
 */
export interface PhysicsSystemState {
  time: number;
  objects: PhysicsObject[];
  energy: {
    kinetic: PhysicalQuantity;
    potential: PhysicalQuantity;
    total: PhysicalQuantity;
  };
  momentum: {
    linear: Vector3D;
    angular: Vector3D;
  };
}

// ===== 时间和序列类型 =====

/**
 * 时间序列数据
 */
export interface TimeSeries<T = number> {
  time: number[];
  values: T[];
  unit: string;
  description?: string;
}

/**
 * 轨迹点
 */
export interface TrajectoryPoint {
  time: number;
  position: Position;
  velocity: Velocity;
  acceleration: Acceleration;
}

/**
 * 完整轨迹
 */
export interface Trajectory {
  points: TrajectoryPoint[];
  duration: PhysicalQuantity;
  totalDistance: PhysicalQuantity;
  maxHeight?: PhysicalQuantity;
  range?: PhysicalQuantity;
}

// ===== 物理常量和参数 =====

/**
 * 物理常量
 */
export const PHYSICAL_CONSTANTS = {
  // 力学常量
  GRAVITY: { value: 9.81, unit: 'm/s²', description: '地球表面重力加速度' },
  GRAVITATIONAL_CONSTANT: { value: 6.67430e-11, unit: 'N·m²/kg²', description: '万有引力常量' },
  
  // 电磁学常量
  SPEED_OF_LIGHT: { value: 2.99792458e8, unit: 'm/s', description: '真空中光速' },
  VACUUM_PERMITTIVITY: { value: 8.8541878128e-12, unit: 'F/m', description: '真空介电常数' },
  VACUUM_PERMEABILITY: { value: 1.25663706212e-6, unit: 'H/m', description: '真空磁导率' },
  
  // 量子物理常量
  PLANCK_CONSTANT: { value: 6.62607015e-34, unit: 'J·s', description: '普朗克常量' },
  REDUCED_PLANCK_CONSTANT: { value: 1.054571817e-34, unit: 'J·s', description: '约化普朗克常量' },
  
  // 热学常量
  BOLTZMANN_CONSTANT: { value: 1.380649e-23, unit: 'J/K', description: '玻尔兹曼常量' },
  AVOGADRO_CONSTANT: { value: 6.02214076e23, unit: '1/mol', description: '阿伏伽德罗常数' },
  
  // 其他常量
  PI: { value: Math.PI, unit: 'rad', description: '圆周率' },
  E: { value: Math.E, unit: '1', description: '自然对数的底数' }
} as const;

/**
 * 物理参数角色
 */
export type ParameterRole = 'given' | 'unknown' | 'constant' | 'derived' | 'calculated';

/**
 * 物理参数接口
 */
export interface PhysicsParameter {
  symbol: string;
  value: PhysicalQuantity;
  role: ParameterRole;
  description: string;
  source?: string;
  uncertainty?: number;
  constraints?: PhysicalRange[];
}

// ===== 物理材料类型 =====

/**
 * 物理材料接口
 */
export interface PhysicsMaterial {
  name: string;
  density: PhysicalQuantity;
  elasticModulus?: PhysicalQuantity;
  shearModulus?: PhysicalQuantity;
  poissonRatio?: number;
  frictionCoefficient?: number;
  thermalConductivity?: PhysicalQuantity;
  specificHeat?: PhysicalQuantity;
  meltingPoint?: PhysicalQuantity;
  boilingPoint?: PhysicalQuantity;
}

/**
 * 常见材料
 */
export const COMMON_MATERIALS: Record<string, PhysicsMaterial> = {
  steel: {
    name: '钢',
    density: { value: 7850, unit: 'kg/m³' },
    elasticModulus: { value: 200e9, unit: 'Pa' },
    poissonRatio: 0.3,
    frictionCoefficient: 0.8
  },
  aluminum: {
    name: '铝',
    density: { value: 2700, unit: 'kg/m³' },
    elasticModulus: { value: 70e9, unit: 'Pa' },
    poissonRatio: 0.35,
    frictionCoefficient: 0.6
  },
  water: {
    name: '水',
    density: { value: 1000, unit: 'kg/m³' },
    specificHeat: { value: 4186, unit: 'J/(kg·K)' },
    thermalConductivity: { value: 0.6, unit: 'W/(m·K)' }
  },
  air: {
    name: '空气',
    density: { value: 1.225, unit: 'kg/m³' },
    specificHeat: { value: 1005, unit: 'J/(kg·K)' },
    thermalConductivity: { value: 0.024, unit: 'W/(m·K)' }
  }
};

// ===== 物理公式类型 =====

/**
 * 物理公式接口
 */
export interface PhysicsFormula {
  name: string;
  expression: string;
  variables: string[];
  units: Record<string, string>;
  description: string;
  category: PhysicsSystemType;
  conditions?: string[];
  limitations?: string[];
}

/**
 * 常用物理公式
 */
export const COMMON_FORMULAS: PhysicsFormula[] = [
  {
    name: '牛顿第二定律',
    expression: 'F = ma',
    variables: ['F', 'm', 'a'],
    units: { F: 'N', m: 'kg', a: 'm/s²' },
    description: '力等于质量乘以加速度',
    category: 'newton_dynamics'
  },
  {
    name: '抛体运动轨迹',
    expression: 'y = x*tan(theta) - (g*x^2)/(2*v0^2*cos^2(theta))',
    variables: ['y', 'x', 'theta', 'g', 'v0'],
    units: { y: 'm', x: 'm', theta: 'rad', g: 'm/s^2', v0: 'm/s' },
    description: '抛体运动的轨迹方程',
    category: 'projectile'
  },
  {
    name: '简谐振动周期',
    expression: 'T = 2π√(m/k)',
    variables: ['T', 'm', 'k'],
    units: { T: 's', m: 'kg', k: 'N/m' },
    description: '弹簧振子的振动周期',
    category: 'oscillation'
  },
  {
    name: '欧姆定律',
    expression: 'U = IR',
    variables: ['U', 'I', 'R'],
    units: { U: 'V', I: 'A', R: 'Ω' },
    description: '电压等于电流乘以电阻',
    category: 'dc_circuits'
  }
];

// ===== 单位系统类型 =====

/**
 * 单位类型
 */
export type UnitType = 'length' | 'time' | 'mass' | 'temperature' | 'current' | 'luminosity' | 'amount' | 'derived';

/**
 * 单位接口
 */
export interface Unit {
  symbol: string;
  name: string;
  baseUnit: string;
  conversionFactor: number;
  category: UnitType;
  description: string;
}

/**
 * 常用单位
 */
export const COMMON_UNITS: Record<string, Unit> = {
  // 长度单位
  m: { symbol: 'm', name: '米', baseUnit: 'm', conversionFactor: 1, category: 'length', description: '国际单位制长度单位' },
  cm: { symbol: 'cm', name: '厘米', baseUnit: 'm', conversionFactor: 0.01, category: 'length', description: '厘米' },
  km: { symbol: 'km', name: '千米', baseUnit: 'm', conversionFactor: 1000, category: 'length', description: '千米' },
  
  // 时间单位
  s: { symbol: 's', name: '秒', baseUnit: 's', conversionFactor: 1, category: 'time', description: '国际单位制时间单位' },
  min: { symbol: 'min', name: '分钟', baseUnit: 's', conversionFactor: 60, category: 'time', description: '分钟' },
  h: { symbol: 'h', name: '小时', baseUnit: 's', conversionFactor: 3600, category: 'time', description: '小时' },
  
  // 质量单位
  kg: { symbol: 'kg', name: '千克', baseUnit: 'kg', conversionFactor: 1, category: 'mass', description: '国际单位制质量单位' },
  g: { symbol: 'g', name: '克', baseUnit: 'kg', conversionFactor: 0.001, category: 'mass', description: '克' },
  
  // 力单位
  N: { symbol: 'N', name: '牛顿', baseUnit: 'kg·m/s²', conversionFactor: 1, category: 'derived', description: '力的单位' },
  
  // 能量单位
  J: { symbol: 'J', name: '焦耳', baseUnit: 'kg·m²/s²', conversionFactor: 1, category: 'derived', description: '能量的单位' },
  
  // 功率单位
  W: { symbol: 'W', name: '瓦特', baseUnit: 'kg·m²/s³', conversionFactor: 1, category: 'derived', description: '功率的单位' }
};

// ===== 学段与课程标签（覆盖初一→高三） =====

/**
 * 中国初高中学段
 */
export type CNGrade = '初一' | '初二' | '初三' | '高一' | '高二' | '高三';

/**
 * 课程主题（按国内教材常见章节抽象成英文 key + 中文名，便于程序与展示）
 */
export type CurriculumTopicKey =
  // 初中（力、热、光、声、电、磁、简单实验/测量）
  | 'mechanics_basics'         // 运动与力（速率、匀速/变速、受力分析、牛二、能量守恒入门）
  | 'pressure_buoyancy_junior' // 压强与浮力（液体压强、阿基米德原理）
  | 'simple_machines_junior'   // 杠杆、滑轮、斜面等
  | 'thermal_junior'           // 热学（温度、热量、比热、相变、热传递）
  | 'optics_geometric_junior'  // 几何光学（反射、折射、平面镜/透镜成像）
  | 'sound_waves_junior'       // 声学（声速、响度、音调、共鸣）
  | 'dc_circuits_junior'       // 直流电路（串并联、欧姆定律、电功率、电能表）
  | 'magnetism_junior'         // 磁与电磁（磁现象、电磁铁、右手定则入门')

  // 高中（力学进阶、场论、振动与波、电磁学、光学进阶、热学进阶、近代物理）
  | 'kinematics'               // 直线/曲线运动、相对运动、抛体
  | 'dynamics'                 // 牛顿定律、摩擦、圆周/万有引力、动量守恒、刚体转动
  | 'energy_work_power_senior' // 功与能、机械能守恒、功能关系、功率
  | 'oscillation_wave'         // 简谐振动、机械波、叠加、驻波、波速 v=fλ、波的能量
  | 'gravitation_orbit'        // 万有引力、天体运动、开普勒、轨道要素
  | 'electrostatics_senior'    // 电荷、库仑定律、电场/电势/电势能、等势面
  | 'dc_circuits_senior'       // 基尔霍夫、复杂电路、RC 初步
  | 'magnetism_em'             // 磁场、洛伦兹力、安培力、通电导线力、法拉第/楞次、电磁感应
  | 'ac_rlc'                   // 交流电、RLC、阻抗与相位、谐振与功率
  | 'optics_advanced'          // 光的干涉、衍射、偏振、折射率色散
  | 'thermal_gas'              // 理想气体、状态方程、热力学过程、卡诺效率入门
  | 'modern_physics'           // 光电效应、原子模型、核衰变、半衰期、德布罗意波

/**
 * 课程标签：用于给公式、系统、实体添加“学段+主题”的可检索标签
 */
export interface SyllabusTag {
  grade: CNGrade;
  topic: CurriculumTopicKey;
  note?: string; // 可放版本/出版社或教学单元信息
}

/**
 * 全谱系知识点目录（精简结构，供 UI 导航/检索）
 * —— 后续可继续在 topics 下细分子主题（subtopics）
 */
export const CURRICULUM_SYLLABUS: Record<CNGrade, { topics: CurriculumTopicKey[] }> = {
  '初一': { topics: ['mechanics_basics', 'pressure_buoyancy_junior', 'thermal_junior', 'optics_geometric_junior', 'sound_waves_junior', 'dc_circuits_junior', 'magnetism_junior'] },
  '初二': { topics: ['mechanics_basics', 'simple_machines_junior', 'thermal_junior', 'optics_geometric_junior', 'dc_circuits_junior'] },
  '初三': { topics: ['mechanics_basics', 'pressure_buoyancy_junior', 'optics_geometric_junior', 'sound_waves_junior', 'dc_circuits_junior', 'magnetism_junior'] },
  '高一': { topics: ['kinematics', 'dynamics', 'energy_work_power_senior', 'oscillation_wave'] },
  '高二': { topics: ['gravitation_orbit', 'electrostatics_senior', 'dc_circuits_senior', 'magnetism_em', 'ac_rlc', 'optics_advanced'] },
  '高三': { topics: ['thermal_gas', 'modern_physics', 'oscillation_wave', 'dynamics'] }
} as const;


// ===== 单位系统增强（覆盖初高中常见量纲） =====

/**
 * SI 前缀（便于显示与换算）
 */
export const SI_PREFIXES = {
  G: 1e9,
  M: 1e6,
  k: 1e3,
  h: 1e2,
  da: 1e1,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  μ: 1e-6,
  n: 1e-9,
  p: 1e-12,
} as const;

/**
 * 补充常用单位（电磁、压强、温度、频率、角度等）
 */
export const EXTENDED_UNITS: Record<string, Unit> = {
  // 电学
  A:  { symbol: 'A',  name: '安培', baseUnit: 'A', category: 'current',   conversionFactor: 1, description: '电流单位' },
  V:  { symbol: 'V',  name: '伏特', baseUnit: 'kg·m²/(s³·A)', category: 'derived', conversionFactor: 1, description: '电压单位' },
  C:  { symbol: 'C',  name: '库仑', baseUnit: 'A·s', category: 'derived', conversionFactor: 1, description: '电荷量单位' },
  ohm:{ symbol: 'Ω',  name: '欧姆', baseUnit: 'kg·m²/(s³·A²)', category: 'derived', conversionFactor: 1, description: '电阻单位' },
  F:  { symbol: 'F',  name: '法拉', baseUnit: 'A²·s⁴/(kg·m²)', category: 'derived', conversionFactor: 1, description: '电容单位' },
  H:  { symbol: 'H',  name: '亨利', baseUnit: 'kg·m²/(A²·s²)', category: 'derived', conversionFactor: 1, description: '电感单位' },
  T:  { symbol: 'T',  name: '特斯拉', baseUnit: 'kg/(A·s²)', category: 'derived', conversionFactor: 1, description: '磁感应强度' },
  Wb: { symbol: 'Wb', name: '韦伯', baseUnit: 'kg·m²/(A·s²)', category: 'derived', conversionFactor: 1, description: '磁通量' },

  // 压强与温度
  Pa: { symbol: 'Pa', name: '帕斯卡', baseUnit: 'kg/(m·s²)', category: 'derived', conversionFactor: 1, description: '压强单位' },
  K:  { symbol: 'K',  name: '开尔文', baseUnit: 'K', category: 'temperature', conversionFactor: 1, description: '热力学温度' },
  degC:{ symbol: '°C', name: '摄氏度', baseUnit: 'K', category: 'temperature', conversionFactor: 1, description: '常用温标（相对 K）' },

  // 频率与角度
  Hz: { symbol: 'Hz', name: '赫兹', baseUnit: '1/s', category: 'derived', conversionFactor: 1, description: '频率' },
  rad:{ symbol: 'rad',name: '弧度', baseUnit: 'rad', category: 'derived', conversionFactor: 1, description: '平面角' },
  deg:{ symbol: '°',  name: '角度', baseUnit: 'rad', category: 'derived', conversionFactor: Math.PI/180, description: '角度到弧度' },

  // 物质的量与发光强度
  mol:{ symbol: 'mol',name: '摩尔', baseUnit: 'mol', category: 'amount', conversionFactor: 1, description: '物质的量' },
  cd: { symbol: 'cd', name: '坎德拉', baseUnit: 'cd', category: 'luminosity', conversionFactor: 1, description: '发光强度' },

  // 力矩
  Nm: { symbol: 'N·m', name: '牛·米', baseUnit: 'kg·m²/s²', category: 'derived', conversionFactor: 1, description: '力矩单位' },
} as const;

/**
 * 合并导出统一单位表（不覆盖已有 COMMON_UNITS）
 */
export const ALL_UNITS: Record<string, Unit> = { ...COMMON_UNITS, ...EXTENDED_UNITS };


// ===== 常量扩充（覆盖电磁、热气体、原子核等） =====

export const EXTENDED_CONSTANTS = {
  ELEMENTARY_CHARGE:   { value: 1.602176634e-19, unit: 'C',        description: '元电荷 e' },
  ELECTRON_MASS:       { value: 9.1093837015e-31, unit: 'kg',      description: '电子质量' },
  PROTON_MASS:         { value: 1.67262192369e-27, unit: 'kg',     description: '质子质量' },
  COULOMB_CONSTANT:    { value: 8.9875517923e9,   unit: 'N·m²/C²', description: '库仑常量 k' },
  GAS_CONSTANT:        { value: 8.314462618,      unit: 'J/(mol·K)', description: '理想气体常数 R' },
  STEFAN_BOLTZMANN:    { value: 5.670374419e-8,   unit: 'W/(m²·K⁴)', description: '斯忒藩-玻尔兹曼常数' },
  AVOGADRO_CONSTANT:   PHYSICAL_CONSTANTS.AVOGADRO_CONSTANT, // alias，便于检索
  BOLTZMANN_CONSTANT:  PHYSICAL_CONSTANTS.BOLTZMANN_CONSTANT,
  EARTH_MASS:          { value: 5.9722e24,        unit: 'kg',      description: '地球质量' },
  EARTH_RADIUS:        { value: 6.371e6,          unit: 'm',       description: '地球半径' },
  STANDARD_ATMOSPHERE: { value: 1.01325e5,        unit: 'Pa',      description: '标准大气压' },
} as const;


// ===== 角动量/力矩/约束与碰撞 =====

/** 力矩向量 */
export interface Torque {
  x: number; y: number; z?: number; unit: 'N·m' | string;
}

/** 约束类型（供刚体/质点系统使用） */
export type ConstraintType = 'fixed' | 'hinge' | 'slider' | 'spring' | 'rope' | 'rolling_no_slip';

/** 约束 */
export interface Constraint {
  id: string;
  type: ConstraintType;
  stiffness?: PhysicalQuantity;   // 弹簧 k
  restLength?: PhysicalQuantity;  // 弹簧/绳 原长
  damping?: PhysicalQuantity;     // 阻尼 c
  objects: string[];              // 参与约束的对象 id
  description?: string;
}

/** 碰撞 */
export interface Collision {
  objects: [string, string];
  restitution: number;   // 恢复系数 e
  friction?: number;
  time?: number;
  contactNormal?: Vector3D;
}


// ===== 电路建模（初高中一致，深度可扩） =====

export type NodeID = string;

/** 电路元件基类 */
export interface CircuitComponentBase {
  id: string;
  kind: 'resistor' | 'capacitor' | 'inductor' | 'voltage_source' | 'current_source' |
        'switch' | 'lamp' | 'ammeter' | 'voltmeter' | 'diode' | 'unknown';
  nodes: [NodeID, NodeID];   // 双端件；若需要三端件可拓展
  label?: string;
  syllabus?: SyllabusTag[];
  properties?: Record<string, any>;
}

export interface ResistorComponent extends CircuitComponentBase {
  kind: 'resistor';
  resistance: PhysicalQuantity; // Ω
}

export interface CapacitorComponent extends CircuitComponentBase {
  kind: 'capacitor';
  capacitance: PhysicalQuantity; // F
  initialVoltage?: PhysicalQuantity;
}

export interface InductorComponent extends CircuitComponentBase {
  kind: 'inductor';
  inductance: PhysicalQuantity; // H
  initialCurrent?: PhysicalQuantity;
}

export interface VoltageSourceComponent extends CircuitComponentBase {
  kind: 'voltage_source';
  voltage: PhysicalQuantity;   // V（可扩波形）
  ac?: { amplitude: PhysicalQuantity; frequency: PhysicalQuantity; phase?: PhysicalQuantity };
}

export interface CurrentSourceComponent extends CircuitComponentBase {
  kind: 'current_source';
  current: PhysicalQuantity;   // A
  ac?: { amplitude: PhysicalQuantity; frequency: PhysicalQuantity; phase?: PhysicalQuantity };
}

export interface SwitchComponent extends CircuitComponentBase {
  kind: 'switch';
  state: 'open' | 'closed';
}

export type CircuitComponent =
  | ResistorComponent
  | CapacitorComponent
  | InductorComponent
  | VoltageSourceComponent
  | CurrentSourceComponent
  | SwitchComponent
  | CircuitComponentBase; // 兼容仪表/二极管等后续拓展

/** 电路网络 */
export interface CircuitNetwork {
  nodes: NodeID[];
  components: CircuitComponent[];
  referenceNode?: NodeID; // 地
  description?: string;
}


// ===== 光学建模（几何光学 + 干涉衍射关键参数） =====

export type OpticalElementKind = 'mirror' | 'lens' | 'prism' | 'slit' | 'grating';

export interface OpticalElement {
  id: string;
  kind: OpticalElementKind;
  position: Position;
  orientation?: Vector3D; // 法线/光轴
  params?: {
    focalLength?: PhysicalQuantity;         // 透镜/镜面
    curvatureRadius?: PhysicalQuantity;     // 镜面曲率
    refractiveIndex?: number;               // 介质/棱镜
    apexAngle?: PhysicalQuantity;           // 棱镜顶角
    slitWidth?: PhysicalQuantity;           // 单缝
    gratingSpacing?: PhysicalQuantity;      // 光栅常量 d
    thickness?: PhysicalQuantity;
  };
  syllabus?: SyllabusTag[];
}

export interface Ray {
  origin: Position;
  direction: Vector3D;  // 单位向量
  wavelength?: PhysicalQuantity; // nm 或 m
}

/** 光学系统 */
export interface OpticalSystem {
  elements: OpticalElement[];
  sources: Ray[];
  notes?: string;
}


// ===== 波动与声音 =====

export interface WaveParams {
  amplitude: PhysicalQuantity;
  frequency: PhysicalQuantity;      // Hz
  angularFrequency?: PhysicalQuantity; // rad/s
  wavelength?: PhysicalQuantity;    // m
  phase?: PhysicalQuantity;         // rad
  waveSpeed?: PhysicalQuantity;     // m/s
  medium?: string;                  // 空气/水/绳等
  syllabus?: SyllabusTag[];
}

export interface SoundParams extends WaveParams {
  intensity?: PhysicalQuantity;     // W/m²
  soundLevelDb?: number;            // dB
  sourceType?: 'tuning_fork' | 'speaker' | 'pipe' | 'string';
}


// ===== 热学与气体 =====

export interface ThermodynamicState {
  P: PhysicalQuantity; // 压强 Pa
  V: PhysicalQuantity; // 体积 m³
  T: PhysicalQuantity; // 温度 K
  n?: PhysicalQuantity; // 物质的量 mol
}

export type ThermalProcessType = 'isobaric' | 'isochoric' | 'isothermal' | 'adiabatic' | 'polytropic';

export interface ThermalProcess {
  type: ThermalProcessType;
  initial: ThermodynamicState;
  final?: ThermodynamicState;      // 可由求解器补齐
  heat?: PhysicalQuantity;         // Q
  work?: PhysicalQuantity;         // W
  deltaU?: PhysicalQuantity;       // 内能变化
  syllabus?: SyllabusTag[];
}

export type HeatTransferType = 'conduction' | 'convection' | 'radiation';

export interface HeatTransfer {
  mode: HeatTransferType;
  rate?: PhysicalQuantity; // 传热率 W
  coefficient?: PhysicalQuantity; // 导热率/对流换热系数
  area?: PhysicalQuantity;
  deltaT?: PhysicalQuantity;
}


// ===== 流体/伯努利与管流 =====

export interface FluidState {
  density: PhysicalQuantity;
  pressure: PhysicalQuantity;
  velocity?: Velocity;
  viscosity?: PhysicalQuantity;
}

export interface BernoulliSection {
  elevation: PhysicalQuantity; // 位置势项
  pressure: PhysicalQuantity;
  speed: PhysicalQuantity;
  area?: PhysicalQuantity;
}

export interface BernoulliSystem {
  sections: [BernoulliSection, BernoulliSection];
  assumptions?: string[]; // 稳定、不可压、无粘
  syllabus?: SyllabusTag[];
}


// ===== 引力与轨道 =====

export interface CentralBody {
  name: string;
  mu: PhysicalQuantity;     // 标准引力参数 μ=GM
  radius: PhysicalQuantity;
}

export interface KeplerianElements {
  a: PhysicalQuantity;      // 半长轴
  e: number;                // 偏心率
  i: PhysicalQuantity;      // 轨道倾角
  Omega: PhysicalQuantity;  // 升交点赤经
  omega: PhysicalQuantity;  // 近地点幅角
  M0: PhysicalQuantity;     // 历元平近点角
  epoch?: PhysicalQuantity; // 历元时间
}


// ===== 对象增强：材料、受力、角运动等 =====

declare module './PhysicsTypes' { /* 为避免模块合并冲突，这里仅示例，若独立文件可移除 */ }

export interface PhysicsObjectEnhanced extends PhysicsObject {
  material?: PhysicsMaterial;
  externalForces?: Force[];       // 外力列表（随时间/状态变化可另建函数）
  torque?: Torque;                // 角力矩
  constraints?: string[];         // 关联约束 id
}


// ===== 常用公式扩充（带学段/主题标签） =====

export const EXTENDED_FORMULAS: PhysicsFormula[] = [
  // —— 运动学/动力学（高频）
  {
    name: '匀变速位移',
    expression: 's = v0*t + (1/2)*a*t^2',
    variables: ['s', 'v0', 'a', 't'],
    units: { s: 'm', v0: 'm/s', a: 'm/s²', t: 's' },
    description: '匀变速直线运动基本公式',
    category: 'kinematics_linear',
    conditions: ['加速度恒定'],
    limitations: [],
  },
  {
    name: '末速度平方公式',
    expression: 'v^2 = v0^2 + 2*a*s',
    variables: ['v', 'v0', 'a', 's'],
    units: { v: 'm/s', v0: 'm/s', a: 'm/s²', s: 'm' },
    description: '不显含时间的运动学公式',
    category: 'kinematics_linear',
  },
  {
    name: '向心加速度',
    expression: 'a_c = v^2 / r = ω^2 r',
    variables: ['a_c', 'v', 'r', 'ω'],
    units: { a_c: 'm/s²', v: 'm/s', r: 'm', 'ω': 'rad/s' },
    description: '匀速圆周运动所需加速度',
    category: 'circular_motion',
  },
  {
    name: '动能定理',
    expression: 'ΔEk = W_net',
    variables: ['ΔEk', 'W_net'],
    units: { 'ΔEk': 'J', 'W_net': 'J' },
    description: '合外力对物体做功等于动能的变化',
    category: 'energy_work_power',
  },
  {
    name: '动量定理',
    expression: 'FΔt = Δp',
    variables: ['F', 'Δt', 'Δp'],
    units: { F: 'N', 'Δt': 's', 'Δp': 'kg·m/s' },
    description: '冲量等于动量变化',
    category: 'newton_dynamics',
  },
  {
    name: '万有引力定律',
    expression: 'F = G*m1*m2 / r^2',
    variables: ['F', 'G', 'm1', 'm2', 'r'],
    units: { F: 'N', G: 'N·m²/kg²', m1: 'kg', m2: 'kg', r: 'm' },
    description: '两质点间引力大小',
    category: 'gravitation',
  },

  // —— 热学与气体
  {
    name: '理想气体状态方程',
    expression: 'pV = nRT',
    variables: ['p', 'V', 'n', 'R', 'T'],
    units: { p: 'Pa', V: 'm³', n: 'mol', R: 'J/(mol·K)', T: 'K' },
    description: '理想气体基本状态方程',
    category: 'thermal',
  },
  {
    name: '热量公式',
    expression: 'Q = c m ΔT',
    variables: ['Q', 'c', 'm', 'ΔT'],
    units: { Q: 'J', c: 'J/(kg·K)', m: 'kg', 'ΔT': 'K' },
    description: '升温或降温吸放热',
    category: 'thermal',
  },

  // —— 电磁学
  {
    name: '库仑定律',
    expression: 'F = k * |q1*q2| / r^2',
    variables: ['F', 'k', 'q1', 'q2', 'r'],
    units: { F: 'N', k: 'N·m²/C²', q1: 'C', q2: 'C', r: 'm' },
    description: '点电荷间作用力',
    category: 'electrostatics',
  },
  {
    name: '电容（平行板）',
    expression: 'C = ε0 * A / d',
    variables: ['C', 'ε0', 'A', 'd'],
    units: { C: 'F', 'ε0': 'F/m', A: 'm²', d: 'm' },
    description: '平行板电容器电容',
    category: 'dc_circuits',
  },
  {
    name: '洛伦兹力',
    expression: 'F = q v B sin(θ)',
    variables: ['F', 'q', 'v', 'B', 'θ'],
    units: { F: 'N', q: 'C', v: 'm/s', B: 'T', 'θ': 'rad' },
    description: '带电粒子在磁场中受力',
    category: 'magnetism',
  },
  {
    name: '法拉第电磁感应定律（标量）',
    expression: 'ε = - dΦ/dt',
    variables: ['ε', 'Φ', 't'],
    units: { 'ε': 'V', 'Φ': 'Wb', t: 's' },
    description: '感应电动势与磁通变化率',
    category: 'em_induction',
  },
  {
    name: 'RLC 串联阻抗',
    expression: '|Z| = √(R^2 + (ωL - 1/(ωC))^2)',
    variables: ['Z', 'R', 'ω', 'L', 'C'],
    units: { Z: 'Ω', R: 'Ω', 'ω': 'rad/s', L: 'H', C: 'F' },
    description: '交流电路阻抗大小',
    category: 'ac',
  },

  // —— 光学
  {
    name: '折射定律（斯涅尔定律）',
    expression: 'n1 sin(i) = n2 sin(r)',
    variables: ['n1', 'i', 'n2', 'r'],
    units: { n1: '1', i: 'rad', n2: '1', r: 'rad' },
    description: '介质界面折射规律',
    category: 'geometric_optics',
  },
  {
    name: '薄透镜成像公式',
    expression: '1/f = 1/u + 1/v',
    variables: ['f', 'u', 'v'],
    units: { f: 'm', u: 'm', v: 'm' },
    description: '薄透镜成像关系，m = v/u',
    category: 'geometric_optics',
  },
  {
    name: '杨氏双缝干涉条纹间距',
    expression: 'Δx = λ L / d',
    variables: ['Δx', 'λ', 'L', 'd'],
    units: { 'Δx': 'm', 'λ': 'm', L: 'm', d: 'm' },
    description: '明纹间距',
    category: 'waves_sound',
  },

  // —— 近代物理
  {
    name: '光电效应方程',
    expression: 'hν = W + (1/2) m v_max^2',
    variables: ['h', 'ν', 'W', 'm', 'v_max'],
    units: { h: 'J·s', 'ν': 'Hz', W: 'J', m: 'kg', 'v_max': 'm/s' },
    description: '光子能量与逸出功、电子最大动能关系',
    category: 'modern_intro',
  },
];

/** 合并常用公式表 */
export const COMMON_FORMULAS_ALL: PhysicsFormula[] = [...COMMON_FORMULAS, ...EXTENDED_FORMULAS];


// ===== 系统类型补充（覆盖国内教学常见模型） =====

export type ExtendedPhysicsSystemType =
  | PhysicsSystemType
  | 'rigid_rotation'      // 刚体转动
  | 'momentum_collision'  // 碰撞/爆炸
  | 'fluids_bernoulli'    // 流体与伯努利
  | 'thermo_gas'          // 气体与热力学过程
  | 'optics_interference' // 干涉/衍射
  | 'rc_transient'        // RC 暂态
  | 'rlc_ac'              // RLC 交流
  | 'orbit_kepler';       // 轨道运动


// ===== 便捷：知识点 Preset（做题/动画默认参数模板） =====

export interface SystemPreset {
  id: string;
  name: string;
  system: ExtendedPhysicsSystemType;
  defaultParams: Record<string, PhysicsParameter>;
  syllabus?: SyllabusTag[];
  notes?: string;
}

export const PRESET_LIBRARY: SystemPreset[] = [
  {
    id: 'projectile_basic',
    name: '抛体运动（水平面）',
    system: 'projectile',
    syllabus: [{ grade: '高一', topic: 'kinematics' }],
    defaultParams: {
      v0: { symbol: 'v0', value: { value: 20, unit: 'm/s' }, role: 'given', description: '初速度' },
      theta: { symbol: 'θ', value: { value: 30, unit: 'deg' }, role: 'given', description: '发射角' },
      g: { symbol: 'g', value: PHYSICAL_CONSTANTS.GRAVITY, role: 'constant', description: '重力加速度' },
    },
  },
  {
    id: 'rc_step',
    name: 'RC 充电暂态',
    system: 'rc_transient',
    syllabus: [{ grade: '高二', topic: 'dc_circuits_senior' }],
    defaultParams: {
      R: { symbol: 'R', value: { value: 1e3, unit: 'Ω' }, role: 'given', description: '电阻' },
      C: { symbol: 'C', value: { value: 100e-6, unit: 'F' }, role: 'given', description: '电容' },
      U: { symbol: 'U', value: { value: 5, unit: 'V' }, role: 'given', description: '阶跃电压' },
    },
  },
];

// ====== 扩展：给 PhysicsFormula 增加学段/主题标签（接口合并） ======
export interface PhysicsFormula {
    /** 可选：学段与主题标签，便于按教材检索 */
    syllabus?: SyllabusTag[];
  }
  
  // —— 将 PhysicsSystemType 映射到默认的 syllabus（学段+主题）
  const CATEGORY_TO_SYLLABUS: Partial<Record<PhysicsSystemType, SyllabusTag[]>> = {
    projectile:            [{ grade: '高一', topic: 'kinematics' }],
    free_fall:             [{ grade: '高一', topic: 'kinematics' }],
    kinematics_linear:     [{ grade: '高一', topic: 'kinematics' }],
    circular_motion:       [{ grade: '高一', topic: 'dynamics' }],
    oscillation:           [{ grade: '高一', topic: 'oscillation_wave' }],
    newton_dynamics:       [{ grade: '高一', topic: 'dynamics' }],
    energy_work_power:     [{ grade: '高一', topic: 'energy_work_power_senior' }],
    pressure_buoyancy:     [{ grade: '初一', topic: 'pressure_buoyancy_junior' }],
    simple_machines:       [{ grade: '初二', topic: 'simple_machines_junior' }],
    thermal:               [{ grade: '初一', topic: 'thermal_junior' }, { grade: '高三', topic: 'thermal_gas' }],
    waves_sound:           [{ grade: '初一', topic: 'sound_waves_junior' }, { grade: '高一', topic: 'oscillation_wave' }],
    geometric_optics:      [{ grade: '初一', topic: 'optics_geometric_junior' }, { grade: '高二', topic: 'optics_advanced' }],
    gravitation:           [{ grade: '高二', topic: 'gravitation_orbit' }],
    electrostatics:        [{ grade: '高二', topic: 'electrostatics_senior' }],
    dc_circuits:           [{ grade: '初一', topic: 'dc_circuits_junior' }, { grade: '高二', topic: 'dc_circuits_senior' }],
    magnetism:             [{ grade: '初三', topic: 'magnetism_junior' }, { grade: '高二', topic: 'magnetism_em' }],
    em_induction:          [{ grade: '高二', topic: 'magnetism_em' }],
    ac:                    [{ grade: '高二', topic: 'ac_rlc' }],
    modern_intro:          [{ grade: '高三', topic: 'modern_physics' }],
  };
  
  function addSyllabus<T extends PhysicsFormula>(arr: T[]): T[] {
    return arr.map(f => ({
      ...f,
      syllabus: f.syllabus ?? CATEGORY_TO_SYLLABUS[f.category] ?? [],
    }));
  }
  
  // 给已有与扩展公式打上 syllabus 标签（如果你在上文已定义 COMMON_FORMULAS_ALL/EXTENDED_FORMULAS）
  export const COMMON_FORMULAS_WITH_SYLLABUS: PhysicsFormula[] = (typeof COMMON_FORMULAS !== 'undefined') ? addSyllabus(COMMON_FORMULAS as PhysicsFormula[]) : [];
  export const EXTENDED_FORMULAS_WITH_SYLLABUS: PhysicsFormula[] = (typeof EXTENDED_FORMULAS !== 'undefined') ? addSyllabus(EXTENDED_FORMULAS as PhysicsFormula[]) : [];
  export const ALL_FORMULAS_TAGGED: PhysicsFormula[] = [
    ...COMMON_FORMULAS_WITH_SYLLABUS,
    ...EXTENDED_FORMULAS_WITH_SYLLABUS,
  ];
  
  
  // ====== 单位换算与量纲校验工具 ======
  
  /** SI 量纲向量：L, M, T, I, Θ, N, Iv */
  export type DimensionKey = 'L' | 'M' | 'T' | 'I' | 'Theta' | 'N' | 'Iv';
  export interface Dimension {
    L: number; M: number; T: number; I: number; Theta: number; N: number; Iv: number;
  }
  
  export const DIM_ZERO: Dimension = { L:0, M:0, T:0, I:0, Theta:0, N:0, Iv:0 };
  export const DIM_LENGTH: Dimension = { ...DIM_ZERO, L: 1 };
  export const DIM_TIME: Dimension   = { ...DIM_ZERO, T: 1 };
  export const DIM_MASS: Dimension   = { ...DIM_ZERO, M: 1 };
  export const DIM_CURRENT: Dimension= { ...DIM_ZERO, I: 1 };
  export const DIM_TEMP: Dimension   = { ...DIM_ZERO, Theta: 1 };
  export const DIM_AMOUNT: Dimension = { ...DIM_ZERO, N: 1 };
  export const DIM_LUM: Dimension    = { ...DIM_ZERO, Iv: 1 };
  
  /** 基本单位到量纲映射 */
  const BASE_UNIT_DIM: Record<string, Dimension> = {
    m: DIM_LENGTH,
    s: DIM_TIME,
    kg: DIM_MASS,
    A: DIM_CURRENT,
    K: DIM_TEMP,
    mol: DIM_AMOUNT,
    cd: DIM_LUM,
  };
  
  /** 将两个量纲相加（乘法时用） */
  function dimAdd(a: Dimension, b: Dimension): Dimension {
    return {
      L: a.L + b.L,
      M: a.M + b.M,
      T: a.T + b.T,
      I: a.I + b.I,
      Theta: a.Theta + b.Theta,
      N: a.N + b.N,
      Iv: a.Iv + b.Iv,
    };
  }
  
  /** 将量纲按指数缩放（幂运算时用） */
  function dimScale(a: Dimension, k: number): Dimension {
    return {
      L: a.L * k,
      M: a.M * k,
      T: a.T * k,
      I: a.I * k,
      Theta: a.Theta * k,
      N: a.N * k,
      Iv: a.Iv * k,
    };
  }
  
  /** 解析单位字符串中的上标（支持 ^2, ^3 以及 Unicode ²³） */
  function parseExponent(token: string): number {
    // 处理如 m^2、m^3、m²、m³
    const supMap: Record<string, string> = { '²': '2', '³': '3' };
    let t = token.replace(/[²³]/g, m => supMap[m]);
    const m = t.match(/\^(\-?\d+(?:\.\d+)?)$/);
    return m ? parseFloat(m[1]) : 1;
  }
  
  /**
   * 将 Unit.baseUnit（如 "kg·m²/s³·A" 或 "kg·m/s²"）转成量纲向量
   * 约定：使用 '·' 或 '*' 作乘号，'/' 作除号
   */
  export function dimensionFromBaseUnit(baseUnit: string): Dimension {
    if (!baseUnit || baseUnit === '1' || baseUnit === '') return { ...DIM_ZERO };
  
    // 统一分隔与空格
    const normalized = baseUnit.replace(/\s+/g, '')
                               .replace(/·/g, '*');
  
    // 分割分子与分母
    const [numPart, ...denParts] = normalized.split('/');
    const numeratorTokens = numPart.split('*');
    const denominatorTokens = denParts.length ? denParts.join('*').split('*') : [];
  
    let dim = { ...DIM_ZERO };
  
    const applyTokens = (tokens: string[], sign: 1 | -1) => {
      for (const raw of tokens) {
        if (!raw) continue;
        // 提取单位与指数，如 m^2、kg、s^3
        const match = raw.match(/([a-zA-Z]+)(?:\^(\-?\d+(?:\.\d+)?))?$/);
        let unitToken = raw;
        let exp = 1;
        if (match) {
          unitToken = match[1];
          exp = match[2] ? parseFloat(match[2]) : 1;
        } else {
          // 可能含有 Unicode 上标
          exp = parseExponent(raw.replace(/[a-zA-Z]+/, ''));
          unitToken = raw.replace(/\^.*$/, '').replace(/\d|²|³/g, '');
        }
  
        const baseDim = BASE_UNIT_DIM[unitToken];
        if (!baseDim) {
          // 未知基本单位：容错为无量纲增量（也可抛错）
          continue;
        }
        dim = dimAdd(dim, dimScale(baseDim, sign * exp));
      }
    };
  
    applyTokens(numeratorTokens, 1);
    applyTokens(denominatorTokens, -1);
    return dim;
  }
  
  /** 判断两个单位是否量纲相容 */
  export function areUnitsCompatible(unitA: string, unitB: string): boolean {
    const ua = ALL_UNITS[unitA];
    const ub = ALL_UNITS[unitB];
    if (!ua || !ub) return unitA === unitB; // 未登记则仅作字面一致
    const da = dimensionFromBaseUnit(ua.baseUnit);
    const db = dimensionFromBaseUnit(ub.baseUnit);
    return JSON.stringify(da) === JSON.stringify(db);
  }
  
  /** 将数值转为目标单位（要求 baseUnit 完全一致） */
  export function convertUnitValue(val: UnitValue, toUnit: string): UnitValue {
    const uFrom = ALL_UNITS[val.unit];
    const uTo = ALL_UNITS[toUnit];
    if (!uFrom || !uTo) throw new Error(`未知单位或未登记: ${val.unit} -> ${toUnit}`);
    if (uFrom.baseUnit !== uTo.baseUnit) {
      throw new Error(`单位不相容: ${uFrom.baseUnit} ≠ ${uTo.baseUnit}`);
    }
    const baseValue = val.value * uFrom.conversionFactor;
    const newValue = baseValue / uTo.conversionFactor;
    return { ...val, value: newValue, unit: toUnit, standardUnit: uTo.baseUnit };
  }
  
  /** 将 PhysicalQuantity/UnitValue 归一化到其 baseUnit */
  export function toBase(quantity: PhysicalQuantity | UnitValue): PhysicalQuantity | UnitValue {
    const u = ALL_UNITS[quantity.unit];
    if (!u) return quantity; // 未登记单位：保持原样
    const baseValue = quantity.value * u.conversionFactor;
    if ('standardUnit' in quantity) {
      // 如果是 UnitValue，更新 standardUnit
      return { ...quantity, value: baseValue, unit: u.baseUnit, standardUnit: u.baseUnit };
    } else {
      // 如果是 PhysicalQuantity，只更新 value 和 unit
      return { ...quantity, value: baseValue, unit: u.baseUnit } as PhysicalQuantity;
    }
  }
  
  /** 检查数值是否落在指定范围（自动单位换算） */
  export function inRange(q: PhysicalQuantity, range: PhysicalRange): boolean {
    if (!areUnitsCompatible(q.unit, range.unit)) return false;
    const qStd = convertUnitValue({ value: q.value, unit: q.unit }, range.unit);
    return range.inclusive
      ? (qStd.value >= range.min && qStd.value <= range.max)
      : (qStd.value >  range.min && qStd.value <  range.max);
  }
  
  /** 判断是否无量纲 */
  export function isDimensionless(unit: string): boolean {
    const u = ALL_UNITS[unit];
    if (!u) return unit === '1' || unit === '';
    const d = dimensionFromBaseUnit(u.baseUnit);
    return JSON.stringify(d) === JSON.stringify(DIM_ZERO);
  }
  
  
  // ====== 最小求解器接口（电路/光学/热过程/抛体等） ======
  
  // —— 电路（DC/AC） ——
  export interface DCSolveOptions {
    referenceNode?: NodeID;                                     // 地节点
    knownVoltages?: Record<NodeID, PhysicalQuantity>;            // 先验节点电压
    knownCurrents?: Record<string, PhysicalQuantity>;            // 先验支路电流（按组件 id）
  }
  
  export interface BranchCurrentResult { componentId: string; current: PhysicalQuantity; }
  
  export interface DCSolution {
    nodeVoltages: Record<NodeID, PhysicalQuantity>;              // 节点电压
    branchCurrents: BranchCurrentResult[];                       // 支路电流
    equivalentResistance?: PhysicalQuantity;                     // （可选）两节点等效电阻
    powerByComponent?: Record<string, PhysicalQuantity>;         // 元件吸收功率
    notes?: string[];
  }
  
  export type DCSolver = (net: CircuitNetwork, opts?: DCSolveOptions) => Promise<DCSolution> | DCSolution;
  
  export interface ACSolveOptions extends DCSolveOptions {
    frequency: PhysicalQuantity;                                 // Hz
  }
  
  export interface ACPhasor {
    magnitude: number;                                           // 以 SI 为基
    phase: number;                                               // rad
    unit: string;                                                // 如 'V' 或 'A'
  }
  
  export interface ACSolution {
    nodeVoltages: Record<NodeID, ACPhasor>;
    branchCurrents: Record<string, ACPhasor>;
    inputImpedance?: PhysicalQuantity;                           // |Z|，若需要相位可另设字段
    notes?: string[];
  }
  
  export type ACAnalyzer = (net: CircuitNetwork, opts: ACSolveOptions) => Promise<ACSolution> | ACSolution;
  
  
  // —— 光学（几何光线追迹） ——
  export interface Intersection {
    elementId: string;
    point: Position;
    normal?: Vector3D;
    opticalPathLength?: PhysicalQuantity;                        // 光程累积
  }
  
  export interface TracedRay extends Ray {
    intersections: Intersection[];
    terminated?: boolean;
  }
  
  export interface RayTraceOptions {
    maxBounces?: number;                                         // 最大反射/折射次数
    stopOn?: (hit: Intersection) => boolean;                     // 终止条件
  }
  
  export interface RayTraceResult {
    rays: TracedRay[];                                           // 含路径与交点
    images?: Position[];                                         // 计算得到的成像位置（若适用）
    notes?: string[];
  }
  
  export type RayTracer = (system: OpticalSystem, inputs: Ray[], opts?: RayTraceOptions) => Promise<RayTraceResult> | RayTraceResult;
  
  
  // —— 热力学过程求解 ——
  export interface ThermoSolveOptions { process: ThermalProcessType; }
  export interface ThermoSolution {
    final: ThermodynamicState;                                   // 末态
    Q?: PhysicalQuantity; W?: PhysicalQuantity; dU?: PhysicalQuantity; // 热量/功/内能
    notes?: string[];
  }
  export type ThermoSolver = (proc: ThermalProcess, opts?: ThermoSolveOptions) => Promise<ThermoSolution> | ThermoSolution;
  
  
  // —— 抛体/运动学轨迹 ——
  export interface TrajectorySolveOptions { dt?: number; airResistance?: boolean; }
  export interface TrajectorySolution extends Trajectory { }      // 复用已有 Trajectory
  export type TrajectorySolver = (obj: Particle, opts?: TrajectorySolveOptions) => Promise<TrajectorySolution> | TrajectorySolution;
  
  
  // ====== 校验与标准化入口（供 DSL → 引擎前置处理） ======
  
  export interface NormalizationReport {
    converted: Record<string, { from: string; to: string; factor: number }>;
    warnings: string[];
  }
  
  /** 将参数表统一到 SI 基本单位 */
  export function normalizeParams(params: Record<string, PhysicsParameter>): { params: Record<string, PhysicsParameter>, report: NormalizationReport } {
    const converted: NormalizationReport['converted'] = {};
    const warnings: string[] = [];
    const out: Record<string, PhysicsParameter> = {};
  
    for (const [k, p] of Object.entries(params)) {
      const v = p.value;
      const u = ALL_UNITS[v.unit];
      if (!u) { warnings.push(`未登记单位: ${k} -> ${v.unit}`); out[k] = p; continue; }
      if (u.conversionFactor !== 1) {
        const baseVal = v.value * u.conversionFactor;
        out[k] = { ...p, value: { ...v, value: baseVal, unit: u.baseUnit } };
        converted[k] = { from: v.unit, to: u.baseUnit, factor: u.conversionFactor };
      } else {
        out[k] = p;
      }
    }
  
    return { params: out, report: { converted, warnings } };
  }
  
  /** 校验参数是否满足约束（单位相容 + 数值范围） */
  export function validateParams(params: Record<string, PhysicsParameter>): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const [k, p] of Object.entries(params)) {
      if (p.constraints && p.constraints.length) {
        for (const r of p.constraints) {
          if (!areUnitsCompatible(p.value.unit, r.unit)) {
            errors.push(`${k} 单位不相容: ${p.value.unit} vs ${r.unit}`);
            continue;
          }
          if (!inRange(p.value, r)) {
            errors.push(`${k} 超出范围: ${p.value.value} ${p.value.unit} not in [${r.min}, ${r.max}] ${r.unit}`);
          }
        }
      }
    }
    return { ok: errors.length === 0, errors };
  }
  
