"use strict";
// frontend/types/PhysicsTypes.ts
// 基础物理类型定义 - 为整个物理系统提供基础类型支持
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIM_LUM = exports.DIM_AMOUNT = exports.DIM_TEMP = exports.DIM_CURRENT = exports.DIM_MASS = exports.DIM_TIME = exports.DIM_LENGTH = exports.DIM_ZERO = exports.ALL_FORMULAS_TAGGED = exports.EXTENDED_FORMULAS_WITH_SYLLABUS = exports.COMMON_FORMULAS_WITH_SYLLABUS = exports.PRESET_LIBRARY = exports.COMMON_FORMULAS_ALL = exports.EXTENDED_FORMULAS = exports.EXTENDED_CONSTANTS = exports.ALL_UNITS = exports.EXTENDED_UNITS = exports.SI_PREFIXES = exports.CURRICULUM_SYLLABUS = exports.COMMON_UNITS = exports.COMMON_FORMULAS = exports.COMMON_MATERIALS = exports.PHYSICAL_CONSTANTS = void 0;
exports.dimensionFromBaseUnit = dimensionFromBaseUnit;
exports.areUnitsCompatible = areUnitsCompatible;
exports.convertUnitValue = convertUnitValue;
exports.toBase = toBase;
exports.inRange = inRange;
exports.isDimensionless = isDimensionless;
exports.normalizeParams = normalizeParams;
exports.validateParams = validateParams;
// ===== 物理常量和参数 =====
/**
 * 物理常量
 */
exports.PHYSICAL_CONSTANTS = {
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
};
/**
 * 常见材料
 */
exports.COMMON_MATERIALS = {
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
/**
 * 常用物理公式
 */
exports.COMMON_FORMULAS = [
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
/**
 * 常用单位
 */
exports.COMMON_UNITS = {
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
/**
 * 全谱系知识点目录（精简结构，供 UI 导航/检索）
 * —— 后续可继续在 topics 下细分子主题（subtopics）
 */
exports.CURRICULUM_SYLLABUS = {
    '初一': { topics: ['mechanics_basics', 'pressure_buoyancy_junior', 'thermal_junior', 'optics_geometric_junior', 'sound_waves_junior', 'dc_circuits_junior', 'magnetism_junior'] },
    '初二': { topics: ['mechanics_basics', 'simple_machines_junior', 'thermal_junior', 'optics_geometric_junior', 'dc_circuits_junior'] },
    '初三': { topics: ['mechanics_basics', 'pressure_buoyancy_junior', 'optics_geometric_junior', 'sound_waves_junior', 'dc_circuits_junior', 'magnetism_junior'] },
    '高一': { topics: ['kinematics', 'dynamics', 'energy_work_power_senior', 'oscillation_wave'] },
    '高二': { topics: ['gravitation_orbit', 'electrostatics_senior', 'dc_circuits_senior', 'magnetism_em', 'ac_rlc', 'optics_advanced'] },
    '高三': { topics: ['thermal_gas', 'modern_physics', 'oscillation_wave', 'dynamics'] }
};
// ===== 单位系统增强（覆盖初高中常见量纲） =====
/**
 * SI 前缀（便于显示与换算）
 */
exports.SI_PREFIXES = {
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
};
/**
 * 补充常用单位（电磁、压强、温度、频率、角度等）
 */
exports.EXTENDED_UNITS = {
    // 电学
    A: { symbol: 'A', name: '安培', baseUnit: 'A', category: 'current', conversionFactor: 1, description: '电流单位' },
    V: { symbol: 'V', name: '伏特', baseUnit: 'kg·m²/(s³·A)', category: 'derived', conversionFactor: 1, description: '电压单位' },
    C: { symbol: 'C', name: '库仑', baseUnit: 'A·s', category: 'derived', conversionFactor: 1, description: '电荷量单位' },
    ohm: { symbol: 'Ω', name: '欧姆', baseUnit: 'kg·m²/(s³·A²)', category: 'derived', conversionFactor: 1, description: '电阻单位' },
    F: { symbol: 'F', name: '法拉', baseUnit: 'A²·s⁴/(kg·m²)', category: 'derived', conversionFactor: 1, description: '电容单位' },
    H: { symbol: 'H', name: '亨利', baseUnit: 'kg·m²/(A²·s²)', category: 'derived', conversionFactor: 1, description: '电感单位' },
    T: { symbol: 'T', name: '特斯拉', baseUnit: 'kg/(A·s²)', category: 'derived', conversionFactor: 1, description: '磁感应强度' },
    Wb: { symbol: 'Wb', name: '韦伯', baseUnit: 'kg·m²/(A·s²)', category: 'derived', conversionFactor: 1, description: '磁通量' },
    // 压强与温度
    Pa: { symbol: 'Pa', name: '帕斯卡', baseUnit: 'kg/(m·s²)', category: 'derived', conversionFactor: 1, description: '压强单位' },
    K: { symbol: 'K', name: '开尔文', baseUnit: 'K', category: 'temperature', conversionFactor: 1, description: '热力学温度' },
    degC: { symbol: '°C', name: '摄氏度', baseUnit: 'K', category: 'temperature', conversionFactor: 1, description: '常用温标（相对 K）' },
    // 频率与角度
    Hz: { symbol: 'Hz', name: '赫兹', baseUnit: '1/s', category: 'derived', conversionFactor: 1, description: '频率' },
    rad: { symbol: 'rad', name: '弧度', baseUnit: 'rad', category: 'derived', conversionFactor: 1, description: '平面角' },
    deg: { symbol: '°', name: '角度', baseUnit: 'rad', category: 'derived', conversionFactor: Math.PI / 180, description: '角度到弧度' },
    // 物质的量与发光强度
    mol: { symbol: 'mol', name: '摩尔', baseUnit: 'mol', category: 'amount', conversionFactor: 1, description: '物质的量' },
    cd: { symbol: 'cd', name: '坎德拉', baseUnit: 'cd', category: 'luminosity', conversionFactor: 1, description: '发光强度' },
    // 力矩
    Nm: { symbol: 'N·m', name: '牛·米', baseUnit: 'kg·m²/s²', category: 'derived', conversionFactor: 1, description: '力矩单位' },
};
/**
 * 合并导出统一单位表（不覆盖已有 COMMON_UNITS）
 */
exports.ALL_UNITS = __assign(__assign({}, exports.COMMON_UNITS), exports.EXTENDED_UNITS);
// ===== 常量扩充（覆盖电磁、热气体、原子核等） =====
exports.EXTENDED_CONSTANTS = {
    ELEMENTARY_CHARGE: { value: 1.602176634e-19, unit: 'C', description: '元电荷 e' },
    ELECTRON_MASS: { value: 9.1093837015e-31, unit: 'kg', description: '电子质量' },
    PROTON_MASS: { value: 1.67262192369e-27, unit: 'kg', description: '质子质量' },
    COULOMB_CONSTANT: { value: 8.9875517923e9, unit: 'N·m²/C²', description: '库仑常量 k' },
    GAS_CONSTANT: { value: 8.314462618, unit: 'J/(mol·K)', description: '理想气体常数 R' },
    STEFAN_BOLTZMANN: { value: 5.670374419e-8, unit: 'W/(m²·K⁴)', description: '斯忒藩-玻尔兹曼常数' },
    AVOGADRO_CONSTANT: exports.PHYSICAL_CONSTANTS.AVOGADRO_CONSTANT, // alias，便于检索
    BOLTZMANN_CONSTANT: exports.PHYSICAL_CONSTANTS.BOLTZMANN_CONSTANT,
    EARTH_MASS: { value: 5.9722e24, unit: 'kg', description: '地球质量' },
    EARTH_RADIUS: { value: 6.371e6, unit: 'm', description: '地球半径' },
    STANDARD_ATMOSPHERE: { value: 1.01325e5, unit: 'Pa', description: '标准大气压' },
};
// ===== 常用公式扩充（带学段/主题标签） =====
exports.EXTENDED_FORMULAS = [
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
exports.COMMON_FORMULAS_ALL = __spreadArray(__spreadArray([], exports.COMMON_FORMULAS, true), exports.EXTENDED_FORMULAS, true);
exports.PRESET_LIBRARY = [
    {
        id: 'projectile_basic',
        name: '抛体运动（水平面）',
        system: 'projectile',
        syllabus: [{ grade: '高一', topic: 'kinematics' }],
        defaultParams: {
            v0: { symbol: 'v0', value: { value: 20, unit: 'm/s' }, role: 'given', description: '初速度' },
            theta: { symbol: 'θ', value: { value: 30, unit: 'deg' }, role: 'given', description: '发射角' },
            g: { symbol: 'g', value: exports.PHYSICAL_CONSTANTS.GRAVITY, role: 'constant', description: '重力加速度' },
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
// —— 将 PhysicsSystemType 映射到默认的 syllabus（学段+主题）
var CATEGORY_TO_SYLLABUS = {
    projectile: [{ grade: '高一', topic: 'kinematics' }],
    free_fall: [{ grade: '高一', topic: 'kinematics' }],
    kinematics_linear: [{ grade: '高一', topic: 'kinematics' }],
    circular_motion: [{ grade: '高一', topic: 'dynamics' }],
    oscillation: [{ grade: '高一', topic: 'oscillation_wave' }],
    newton_dynamics: [{ grade: '高一', topic: 'dynamics' }],
    energy_work_power: [{ grade: '高一', topic: 'energy_work_power_senior' }],
    pressure_buoyancy: [{ grade: '初一', topic: 'pressure_buoyancy_junior' }],
    simple_machines: [{ grade: '初二', topic: 'simple_machines_junior' }],
    thermal: [{ grade: '初一', topic: 'thermal_junior' }, { grade: '高三', topic: 'thermal_gas' }],
    waves_sound: [{ grade: '初一', topic: 'sound_waves_junior' }, { grade: '高一', topic: 'oscillation_wave' }],
    geometric_optics: [{ grade: '初一', topic: 'optics_geometric_junior' }, { grade: '高二', topic: 'optics_advanced' }],
    gravitation: [{ grade: '高二', topic: 'gravitation_orbit' }],
    electrostatics: [{ grade: '高二', topic: 'electrostatics_senior' }],
    dc_circuits: [{ grade: '初一', topic: 'dc_circuits_junior' }, { grade: '高二', topic: 'dc_circuits_senior' }],
    magnetism: [{ grade: '初三', topic: 'magnetism_junior' }, { grade: '高二', topic: 'magnetism_em' }],
    em_induction: [{ grade: '高二', topic: 'magnetism_em' }],
    ac: [{ grade: '高二', topic: 'ac_rlc' }],
    modern_intro: [{ grade: '高三', topic: 'modern_physics' }],
};
function addSyllabus(arr) {
    return arr.map(function (f) {
        var _a, _b;
        return (__assign(__assign({}, f), { syllabus: (_b = (_a = f.syllabus) !== null && _a !== void 0 ? _a : CATEGORY_TO_SYLLABUS[f.category]) !== null && _b !== void 0 ? _b : [] }));
    });
}
// 给已有与扩展公式打上 syllabus 标签（如果你在上文已定义 COMMON_FORMULAS_ALL/EXTENDED_FORMULAS）
exports.COMMON_FORMULAS_WITH_SYLLABUS = (typeof exports.COMMON_FORMULAS !== 'undefined') ? addSyllabus(exports.COMMON_FORMULAS) : [];
exports.EXTENDED_FORMULAS_WITH_SYLLABUS = (typeof exports.EXTENDED_FORMULAS !== 'undefined') ? addSyllabus(exports.EXTENDED_FORMULAS) : [];
exports.ALL_FORMULAS_TAGGED = __spreadArray(__spreadArray([], exports.COMMON_FORMULAS_WITH_SYLLABUS, true), exports.EXTENDED_FORMULAS_WITH_SYLLABUS, true);
exports.DIM_ZERO = { L: 0, M: 0, T: 0, I: 0, Theta: 0, N: 0, Iv: 0 };
exports.DIM_LENGTH = __assign(__assign({}, exports.DIM_ZERO), { L: 1 });
exports.DIM_TIME = __assign(__assign({}, exports.DIM_ZERO), { T: 1 });
exports.DIM_MASS = __assign(__assign({}, exports.DIM_ZERO), { M: 1 });
exports.DIM_CURRENT = __assign(__assign({}, exports.DIM_ZERO), { I: 1 });
exports.DIM_TEMP = __assign(__assign({}, exports.DIM_ZERO), { Theta: 1 });
exports.DIM_AMOUNT = __assign(__assign({}, exports.DIM_ZERO), { N: 1 });
exports.DIM_LUM = __assign(__assign({}, exports.DIM_ZERO), { Iv: 1 });
/** 基本单位到量纲映射 */
var BASE_UNIT_DIM = {
    m: exports.DIM_LENGTH,
    s: exports.DIM_TIME,
    kg: exports.DIM_MASS,
    A: exports.DIM_CURRENT,
    K: exports.DIM_TEMP,
    mol: exports.DIM_AMOUNT,
    cd: exports.DIM_LUM,
};
/** 将两个量纲相加（乘法时用） */
function dimAdd(a, b) {
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
function dimScale(a, k) {
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
function parseExponent(token) {
    // 处理如 m^2、m^3、m²、m³
    var supMap = { '²': '2', '³': '3' };
    var t = token.replace(/[²³]/g, function (m) { return supMap[m]; });
    var m = t.match(/\^(\-?\d+(?:\.\d+)?)$/);
    return m ? parseFloat(m[1]) : 1;
}
/**
 * 将 Unit.baseUnit（如 "kg·m²/s³·A" 或 "kg·m/s²"）转成量纲向量
 * 约定：使用 '·' 或 '*' 作乘号，'/' 作除号
 */
function dimensionFromBaseUnit(baseUnit) {
    if (!baseUnit || baseUnit === '1' || baseUnit === '')
        return __assign({}, exports.DIM_ZERO);
    // 统一分隔与空格
    var normalized = baseUnit.replace(/\s+/g, '')
        .replace(/·/g, '*');
    // 分割分子与分母
    var _a = normalized.split('/'), numPart = _a[0], denParts = _a.slice(1);
    var numeratorTokens = numPart.split('*');
    var denominatorTokens = denParts.length ? denParts.join('*').split('*') : [];
    var dim = __assign({}, exports.DIM_ZERO);
    var applyTokens = function (tokens, sign) {
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var raw = tokens_1[_i];
            if (!raw)
                continue;
            // 提取单位与指数，如 m^2、kg、s^3
            var match = raw.match(/([a-zA-Z]+)(?:\^(\-?\d+(?:\.\d+)?))?$/);
            var unitToken = raw;
            var exp = 1;
            if (match) {
                unitToken = match[1];
                exp = match[2] ? parseFloat(match[2]) : 1;
            }
            else {
                // 可能含有 Unicode 上标
                exp = parseExponent(raw.replace(/[a-zA-Z]+/, ''));
                unitToken = raw.replace(/\^.*$/, '').replace(/\d|²|³/g, '');
            }
            var baseDim = BASE_UNIT_DIM[unitToken];
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
function areUnitsCompatible(unitA, unitB) {
    var ua = exports.ALL_UNITS[unitA];
    var ub = exports.ALL_UNITS[unitB];
    if (!ua || !ub)
        return unitA === unitB; // 未登记则仅作字面一致
    var da = dimensionFromBaseUnit(ua.baseUnit);
    var db = dimensionFromBaseUnit(ub.baseUnit);
    return JSON.stringify(da) === JSON.stringify(db);
}
/** 将数值转为目标单位（要求 baseUnit 完全一致） */
function convertUnitValue(val, toUnit) {
    var uFrom = exports.ALL_UNITS[val.unit];
    var uTo = exports.ALL_UNITS[toUnit];
    if (!uFrom || !uTo)
        throw new Error("\u672A\u77E5\u5355\u4F4D\u6216\u672A\u767B\u8BB0: ".concat(val.unit, " -> ").concat(toUnit));
    if (uFrom.baseUnit !== uTo.baseUnit) {
        throw new Error("\u5355\u4F4D\u4E0D\u76F8\u5BB9: ".concat(uFrom.baseUnit, " \u2260 ").concat(uTo.baseUnit));
    }
    var baseValue = val.value * uFrom.conversionFactor;
    var newValue = baseValue / uTo.conversionFactor;
    return __assign(__assign({}, val), { value: newValue, unit: toUnit, standardUnit: uTo.baseUnit });
}
/** 将 PhysicalQuantity/UnitValue 归一化到其 baseUnit */
function toBase(quantity) {
    var u = exports.ALL_UNITS[quantity.unit];
    if (!u)
        return quantity; // 未登记单位：保持原样
    var baseValue = quantity.value * u.conversionFactor;
    if ('standardUnit' in quantity) {
        // 如果是 UnitValue，更新 standardUnit
        return __assign(__assign({}, quantity), { value: baseValue, unit: u.baseUnit, standardUnit: u.baseUnit });
    }
    else {
        // 如果是 PhysicalQuantity，只更新 value 和 unit
        return __assign(__assign({}, quantity), { value: baseValue, unit: u.baseUnit });
    }
}
/** 检查数值是否落在指定范围（自动单位换算） */
function inRange(q, range) {
    if (!areUnitsCompatible(q.unit, range.unit))
        return false;
    var qStd = convertUnitValue({ value: q.value, unit: q.unit }, range.unit);
    return range.inclusive
        ? (qStd.value >= range.min && qStd.value <= range.max)
        : (qStd.value > range.min && qStd.value < range.max);
}
/** 判断是否无量纲 */
function isDimensionless(unit) {
    var u = exports.ALL_UNITS[unit];
    if (!u)
        return unit === '1' || unit === '';
    var d = dimensionFromBaseUnit(u.baseUnit);
    return JSON.stringify(d) === JSON.stringify(exports.DIM_ZERO);
}
/** 将参数表统一到 SI 基本单位 */
function normalizeParams(params) {
    var converted = {};
    var warnings = [];
    var out = {};
    for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], p = _b[1];
        var v = p.value;
        var u = exports.ALL_UNITS[v.unit];
        if (!u) {
            warnings.push("\u672A\u767B\u8BB0\u5355\u4F4D: ".concat(k, " -> ").concat(v.unit));
            out[k] = p;
            continue;
        }
        if (u.conversionFactor !== 1) {
            var baseVal = v.value * u.conversionFactor;
            out[k] = __assign(__assign({}, p), { value: __assign(__assign({}, v), { value: baseVal, unit: u.baseUnit }) });
            converted[k] = { from: v.unit, to: u.baseUnit, factor: u.conversionFactor };
        }
        else {
            out[k] = p;
        }
    }
    return { params: out, report: { converted: converted, warnings: warnings } };
}
/** 校验参数是否满足约束（单位相容 + 数值范围） */
function validateParams(params) {
    var errors = [];
    for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], p = _b[1];
        if (p.constraints && p.constraints.length) {
            for (var _c = 0, _d = p.constraints; _c < _d.length; _c++) {
                var r = _d[_c];
                if (!areUnitsCompatible(p.value.unit, r.unit)) {
                    errors.push("".concat(k, " \u5355\u4F4D\u4E0D\u76F8\u5BB9: ").concat(p.value.unit, " vs ").concat(r.unit));
                    continue;
                }
                if (!inRange(p.value, r)) {
                    errors.push("".concat(k, " \u8D85\u51FA\u8303\u56F4: ").concat(p.value.value, " ").concat(p.value.unit, " not in [").concat(r.min, ", ").concat(r.max, "] ").concat(r.unit));
                }
            }
        }
    }
    return { ok: errors.length === 0, errors: errors };
}
