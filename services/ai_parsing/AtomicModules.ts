// services/ai_parsing/AtomicModules.ts
// 原子模块库：定义所有物理知识点的原子模块

import type { Parameter } from './PhysicsAIParser';

// 原子模块接口
export interface AtomicModule {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters: Parameter[];
  formulas: string[];
  dependencies: string[];
  output: string[];
}

/**
 * 原子模块库管理器
 */
export class AtomicModuleLibrary {
  private atomicModules: Map<string, AtomicModule> = new Map();

  constructor() {
    this.initializeAtomicModules();
  }

  /**
   * 获取所有原子模块
   */
  getAllModules(): Map<string, AtomicModule> {
    return this.atomicModules;
  }

  /**
   * 根据ID获取模块
   */
  getModule(id: string): AtomicModule | undefined {
    return this.atomicModules.get(id);
  }

  /**
   * 根据类型获取模块
   */
  getModulesByType(type: string): AtomicModule[] {
    return Array.from(this.atomicModules.values()).filter(module => module.type === type);
  }

  /**
   * 搜索相关模块
   */
  searchModules(keywords: string[]): AtomicModule[] {
    return Array.from(this.atomicModules.values()).filter(module => {
      return keywords.some(keyword => 
        module.name.includes(keyword) || 
        module.description.includes(keyword) ||
        module.formulas.some(formula => formula.includes(keyword))
      );
    });
  }

  /**
   * 初始化原子模块库
   */
  private initializeAtomicModules(): void {
    // ==================== 基础力学模块 ====================
    
    // 运动学模块
    this.atomicModules.set('kinematics_linear', {
      id: 'kinematics_linear',
      type: 'kinematics',
      name: '直线运动学',
      description: '处理匀速直线运动和匀变速直线运动',
      parameters: [
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '速度' },
        { symbol: 'v0', value: null, unit: 'm/s', role: 'given', note: '初速度' },
        { symbol: 'a', value: null, unit: 'm/s²', role: 'given', note: '加速度' },
        { symbol: 's', value: null, unit: 'm', role: 'unknown', note: '位移' },
        { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
      ],
      formulas: ['v = v0 + at', 's = v0t + ½at²', 'v² = v0² + 2as', 's = (v0 + v)t/2'],
      dependencies: [],
      output: ['v', 's']
    });

    // 抛体运动模块
    this.atomicModules.set('projectile_motion', {
      id: 'projectile_motion',
      type: 'kinematics',
      name: '抛体运动',
      description: '处理平抛、斜抛等抛体运动',
      parameters: [
        { symbol: 'v0', value: null, unit: 'm/s', role: 'given', note: '初速度' },
        { symbol: 'θ', value: null, unit: '°', role: 'given', note: '抛射角' },
        { symbol: 'v0x', value: null, unit: 'm/s', role: 'unknown', note: '水平初速度' },
        { symbol: 'v0y', value: null, unit: 'm/s', role: 'unknown', note: '垂直初速度' },
        { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '水平位移' },
        { symbol: 'y', value: null, unit: 'm', role: 'unknown', note: '垂直位移' },
        { symbol: 't', value: null, unit: 's', role: 'unknown', note: '飞行时间' },
        { symbol: 'R', value: null, unit: 'm', role: 'unknown', note: '射程' },
        { symbol: 'H', value: null, unit: 'm', role: 'unknown', note: '最大高度' },
        { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' }
      ],
      formulas: ['v0x = v0cosθ', 'v0y = v0sinθ', 'x = v0xt', 'y = v0yt - ½gt²', 't = 2v0y/g', 'R = v0²sin(2θ)/g', 'H = v0y²/(2g)'],
      dependencies: ['kinematics_linear'],
      output: ['v0x', 'v0y', 'x', 'y', 't', 'R', 'H']
    });

    // 自由落体模块
    this.atomicModules.set('free_fall', {
      id: 'free_fall',
      type: 'kinematics',
      name: '自由落体',
      description: '处理自由落体运动',
      parameters: [
        { symbol: 'h', value: null, unit: 'm', role: 'given', note: '高度' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '速度' },
        { symbol: 't', value: null, unit: 's', role: 'unknown', note: '时间' },
        { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' }
      ],
      formulas: ['h = ½gt²', 'v = gt', 'v² = 2gh', 't = √(2h/g)'],
      dependencies: ['kinematics_linear'],
      output: ['v', 't']
    });

    // 相对运动模块
    this.atomicModules.set('relative_motion', {
      id: 'relative_motion',
      type: 'kinematics',
      name: '相对运动',
      description: '处理相对运动问题',
      parameters: [
        { symbol: 'vAB', value: null, unit: 'm/s', role: 'unknown', note: 'A相对B的速度' },
        { symbol: 'vA', value: null, unit: 'm/s', role: 'given', note: 'A的速度' },
        { symbol: 'vB', value: null, unit: 'm/s', role: 'given', note: 'B的速度' },
        { symbol: 'θ', value: null, unit: '°', role: 'given', note: '夹角' }
      ],
      formulas: ['vAB = vA - vB', 'vAB = √(vA² + vB² - 2vAvBcosθ)'],
      dependencies: ['kinematics_linear'],
      output: ['vAB']
    });

    // 动力学模块
    this.atomicModules.set('newton_dynamics', {
      id: 'newton_dynamics',
      type: 'dynamics',
      name: '牛顿动力学',
      description: '处理牛顿第二定律和力的分析',
      parameters: [
        { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '合外力' },
        { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
        { symbol: 'a', value: null, unit: 'm/s²', role: 'unknown', note: '加速度' },
        { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' },
        { symbol: 'μ', value: null, unit: '', role: 'given', note: '摩擦系数' },
        { symbol: 'N', value: null, unit: 'N', role: 'unknown', note: '支持力' }
      ],
      formulas: ['F = ma', 'f = μN', 'F合 = F1 + F2 + ...'],
      dependencies: ['kinematics_linear'],
      output: ['F', 'a']
    });

    // 摩擦力模块
    this.atomicModules.set('friction', {
      id: 'friction',
      type: 'dynamics',
      name: '摩擦力',
      description: '处理静摩擦力和滑动摩擦力',
      parameters: [
        { symbol: 'f静', value: null, unit: 'N', role: 'unknown', note: '静摩擦力' },
        { symbol: 'f动', value: null, unit: 'N', role: 'unknown', note: '滑动摩擦力' },
        { symbol: 'μ静', value: null, unit: '', role: 'given', note: '静摩擦系数' },
        { symbol: 'μ动', value: null, unit: '', role: 'given', note: '动摩擦系数' },
        { symbol: 'N', value: null, unit: 'N', role: 'given', note: '正压力' },
        { symbol: 'F外', value: null, unit: 'N', role: 'given', note: '外力' }
      ],
      formulas: ['f静 ≤ μ静N', 'f动 = μ动N', 'f静 = F外 (平衡时)'],
      dependencies: ['newton_dynamics'],
      output: ['f静', 'f动']
    });

    // 刚体力学模块
    this.atomicModules.set('rigid_body', {
      id: 'rigid_body',
      type: 'dynamics',
      name: '刚体力学',
      description: '处理刚体的转动和平衡',
      parameters: [
        { symbol: 'M', value: null, unit: 'N·m', role: 'unknown', note: '力矩' },
        { symbol: 'F', value: null, unit: 'N', role: 'given', note: '力' },
        { symbol: 'r', value: null, unit: 'm', role: 'given', note: '力臂' },
        { symbol: 'θ', value: null, unit: '°', role: 'given', note: '力与力臂夹角' },
        { symbol: 'I', value: null, unit: 'kg·m²', role: 'given', note: '转动惯量' },
        { symbol: 'α', value: null, unit: 'rad/s²', role: 'unknown', note: '角加速度' },
        { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '角速度' },
        { symbol: 'L', value: null, unit: 'kg·m²/s', role: 'unknown', note: '角动量' }
      ],
      formulas: ['M = Frsinθ', 'M = Iα', 'L = Iω', 'M = dL/dt'],
      dependencies: ['newton_dynamics'],
      output: ['M', 'α', 'ω', 'L']
    });

    // 流体力学模块
    this.atomicModules.set('fluid_mechanics', {
      id: 'fluid_mechanics',
      type: 'fluid',
      name: '流体力学',
      description: '处理流体静力学和动力学',
      parameters: [
        { symbol: 'p', value: null, unit: 'Pa', role: 'unknown', note: '压强' },
        { symbol: 'ρ', value: null, unit: 'kg/m³', role: 'given', note: '密度' },
        { symbol: 'h', value: null, unit: 'm', role: 'given', note: '深度' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '流速' },
        { symbol: 'A', value: null, unit: 'm²', role: 'given', note: '截面积' },
        { symbol: 'Q', value: null, unit: 'm³/s', role: 'unknown', note: '流量' },
        { symbol: 'η', value: null, unit: 'Pa·s', role: 'given', note: '粘度' },
        { symbol: 'Re', value: null, unit: '', role: 'unknown', note: '雷诺数' }
      ],
      formulas: ['p = ρgh', 'Q = Av', 'Re = ρvD/η', 'p + ½ρv² + ρgh = 常数'],
      dependencies: ['pressure_buoyancy'],
      output: ['p', 'v', 'Q', 'Re']
    });

    // 功和能模块
    this.atomicModules.set('work_energy', {
      id: 'work_energy',
      type: 'energy',
      name: '功和能',
      description: '处理功、功率、动能、势能的计算',
      parameters: [
        { symbol: 'W', value: null, unit: 'J', role: 'unknown', note: '功' },
        { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '功率' },
        { symbol: 'Ek', value: null, unit: 'J', role: 'unknown', note: '动能' },
        { symbol: 'Ep', value: null, unit: 'J', role: 'unknown', note: '势能' },
        { symbol: 'h', value: null, unit: 'm', role: 'given', note: '高度' },
        { symbol: 'F', value: null, unit: 'N', role: 'given', note: '力' },
        { symbol: 's', value: null, unit: 'm', role: 'given', note: '位移' }
      ],
      formulas: ['W = Fs', 'P = W/t', 'Ek = ½mv²', 'Ep = mgh', 'W = ΔEk'],
      dependencies: ['kinematics_linear', 'newton_dynamics'],
      output: ['W', 'P', 'Ek', 'Ep']
    });

    // 机械能守恒模块
    this.atomicModules.set('mechanical_energy_conservation', {
      id: 'mechanical_energy_conservation',
      type: 'energy',
      name: '机械能守恒',
      description: '处理机械能守恒定律',
      parameters: [
        { symbol: 'E1', value: null, unit: 'J', role: 'unknown', note: '初始机械能' },
        { symbol: 'E2', value: null, unit: 'J', role: 'unknown', note: '末机械能' },
        { symbol: 'Ek1', value: null, unit: 'J', role: 'given', note: '初始动能' },
        { symbol: 'Ep1', value: null, unit: 'J', role: 'given', note: '初始势能' },
        { symbol: 'Ek2', value: null, unit: 'J', role: 'unknown', note: '末动能' },
        { symbol: 'Ep2', value: null, unit: 'J', role: 'unknown', note: '末势能' },
        { symbol: 'W非', value: null, unit: 'J', role: 'given', note: '非保守力做功' }
      ],
      formulas: ['E1 = E2', 'Ek1 + Ep1 = Ek2 + Ep2', 'E2 - E1 = W非'],
      dependencies: ['work_energy'],
      output: ['E1', 'E2', 'Ek2', 'Ep2']
    });

    // 弹性势能模块
    this.atomicModules.set('elastic_potential_energy', {
      id: 'elastic_potential_energy',
      type: 'energy',
      name: '弹性势能',
      description: '处理弹簧的弹性势能',
      parameters: [
        { symbol: 'Ep弹', value: null, unit: 'J', role: 'unknown', note: '弹性势能' },
        { symbol: 'k', value: null, unit: 'N/m', role: 'given', note: '弹簧常数' },
        { symbol: 'x', value: null, unit: 'm', role: 'given', note: '形变量' },
        { symbol: 'F弹', value: null, unit: 'N', role: 'unknown', note: '弹力' }
      ],
      formulas: ['Ep弹 = ½kx²', 'F弹 = -kx', 'W弹 = -ΔEp弹'],
      dependencies: ['work_energy'],
      output: ['Ep弹', 'F弹']
    });

    // 功率效率模块
    this.atomicModules.set('power_efficiency', {
      id: 'power_efficiency',
      type: 'energy',
      name: '功率效率',
      description: '处理功率和机械效率',
      parameters: [
        { symbol: 'P输入', value: null, unit: 'W', role: 'given', note: '输入功率' },
        { symbol: 'P输出', value: null, unit: 'W', role: 'unknown', note: '输出功率' },
        { symbol: 'η', value: null, unit: '', role: 'unknown', note: '效率' },
        { symbol: 'P损失', value: null, unit: 'W', role: 'unknown', note: '损失功率' }
      ],
      formulas: ['η = P输出/P输入', 'P输出 = ηP输入', 'P损失 = P输入 - P输出'],
      dependencies: ['work_energy'],
      output: ['P输出', 'η', 'P损失']
    });

    // 圆周运动模块
    this.atomicModules.set('circular_motion', {
      id: 'circular_motion',
      type: 'kinematics',
      name: '圆周运动',
      description: '处理匀速圆周运动',
      parameters: [
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '线速度' },
        { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '角速度' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' },
        { symbol: 'r', value: null, unit: 'm', role: 'given', note: '半径' },
        { symbol: 'a', value: null, unit: 'm/s²', role: 'unknown', note: '向心加速度' },
        { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '向心力' }
      ],
      formulas: ['v = ωr', 'T = 2π/ω', 'f = 1/T', 'a = v²/r', 'F = mv²/r'],
      dependencies: ['newton_dynamics'],
      output: ['v', 'ω', 'T', 'f', 'a', 'F']
    });

    // 简谐振动模块
    this.atomicModules.set('oscillation', {
      id: 'oscillation',
      type: 'oscillation',
      name: '简谐振动',
      description: '处理弹簧振子和单摆的简谐振动',
      parameters: [
        { symbol: 'A', value: null, unit: 'm', role: 'given', note: '振幅' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' },
        { symbol: 'k', value: null, unit: 'N/m', role: 'given', note: '弹簧常数' },
        { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
        { symbol: 'l', value: null, unit: 'm', role: 'given', note: '摆长' },
        { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '位移' }
      ],
      formulas: ['T = 2π√(m/k)', 'T = 2π√(l/g)', 'f = 1/T', 'x = Asin(ωt + φ)'],
      dependencies: ['newton_dynamics'],
      output: ['T', 'f', 'x']
    });

    // 阻尼振动模块
    this.atomicModules.set('damped_oscillation', {
      id: 'damped_oscillation',
      type: 'oscillation',
      name: '阻尼振动',
      description: '处理阻尼振动和受迫振动',
      parameters: [
        { symbol: 'γ', value: null, unit: 's⁻¹', role: 'given', note: '阻尼系数' },
        { symbol: 'ω0', value: null, unit: 'rad/s', role: 'given', note: '固有频率' },
        { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '振动频率' },
        { symbol: 'Q', value: null, unit: '', role: 'unknown', note: '品质因子' },
        { symbol: 'τ', value: null, unit: 's', role: 'unknown', note: '衰减时间' },
        { symbol: 'F0', value: null, unit: 'N', role: 'given', note: '驱动力幅值' }
      ],
      formulas: ['ω = √(ω0² - γ²)', 'Q = ω0/(2γ)', 'τ = 1/γ', 'x = Ae^(-γt)cos(ωt + φ)'],
      dependencies: ['oscillation'],
      output: ['ω', 'Q', 'τ']
    });

    // 机械波模块
    this.atomicModules.set('mechanical_waves', {
      id: 'mechanical_waves',
      type: 'waves',
      name: '机械波',
      description: '处理机械波的传播和干涉',
      parameters: [
        { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '波长' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'given', note: '频率' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '波速' },
        { symbol: 'A', value: null, unit: 'm', role: 'given', note: '振幅' },
        { symbol: 'k', value: null, unit: 'rad/m', role: 'unknown', note: '波数' },
        { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '角频率' }
      ],
      formulas: ['v = λf', 'T = 1/f', 'k = 2π/λ', 'ω = 2πf', 'y = Asin(kx - ωt + φ)'],
      dependencies: ['oscillation'],
      output: ['λ', 'T', 'v', 'k', 'ω']
    });

    // 声波模块
    this.atomicModules.set('sound_waves', {
      id: 'sound_waves',
      type: 'waves',
      name: '声波',
      description: '处理声波的传播和多普勒效应',
      parameters: [
        { symbol: 'v声', value: 340, unit: 'm/s', role: 'constant', note: '声速' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'given', note: '频率' },
        { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '波长' },
        { symbol: 'I', value: null, unit: 'W/m²', role: 'unknown', note: '声强' },
        { symbol: 'L', value: null, unit: 'dB', role: 'unknown', note: '声强级' },
        { symbol: 'f\'', value: null, unit: 'Hz', role: 'unknown', note: '多普勒频率' },
        { symbol: 'vs', value: null, unit: 'm/s', role: 'given', note: '声源速度' },
        { symbol: 'vo', value: null, unit: 'm/s', role: 'given', note: '观察者速度' }
      ],
      formulas: ['λ = v声/f', 'I = P/(4πr²)', 'L = 10log(I/I0)', 'f\' = f(v声 ± vo)/(v声 ∓ vs)'],
      dependencies: ['mechanical_waves'],
      output: ['λ', 'I', 'L', 'f\'']
    });

    // 波的干涉模块
    this.atomicModules.set('wave_interference', {
      id: 'wave_interference',
      type: 'waves',
      name: '波的干涉',
      description: '处理波的干涉和衍射',
      parameters: [
        { symbol: 'd', value: null, unit: 'm', role: 'given', note: '双缝间距' },
        { symbol: 'L', value: null, unit: 'm', role: 'given', note: '屏距' },
        { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '条纹间距' },
        { symbol: 'Δr', value: null, unit: 'm', role: 'unknown', note: '光程差' },
        { symbol: 'δ', value: null, unit: 'rad', role: 'unknown', note: '相位差' },
        { symbol: 'a', value: null, unit: 'm', role: 'given', note: '单缝宽度' },
        { symbol: 'θ', value: null, unit: '°', role: 'unknown', note: '衍射角' }
      ],
      formulas: ['x = λL/d', 'Δr = dsinθ', 'δ = 2πΔr/λ', 'asinθ = nλ'],
      dependencies: ['mechanical_waves'],
      output: ['x', 'Δr', 'δ', 'θ']
    });

    // 直流电路模块
    this.atomicModules.set('dc_circuit', {
      id: 'dc_circuit',
      type: 'electricity',
      name: '直流电路',
      description: '处理欧姆定律和电路分析',
      parameters: [
        { symbol: 'U', value: null, unit: 'V', role: 'unknown', note: '电压' },
        { symbol: 'I', value: null, unit: 'A', role: 'unknown', note: '电流' },
        { symbol: 'R', value: null, unit: 'Ω', role: 'given', note: '电阻' },
        { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '功率' },
        { symbol: 'Q', value: null, unit: 'C', role: 'unknown', note: '电荷量' },
        { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
      ],
      formulas: ['U = IR', 'P = UI', 'P = I²R', 'P = U²/R', 'Q = It'],
      dependencies: [],
      output: ['U', 'I', 'P', 'Q']
    });

    // 几何光学模块
    this.atomicModules.set('geometric_optics', {
      id: 'geometric_optics',
      type: 'optics',
      name: '几何光学',
      description: '处理反射和折射定律',
      parameters: [
        { symbol: 'i', value: null, unit: '°', role: 'given', note: '入射角' },
        { symbol: 'r', value: null, unit: '°', role: 'unknown', note: '反射角' },
        { symbol: 'n', value: null, unit: '', role: 'given', note: '折射率' },
        { symbol: 'c', value: 3e8, unit: 'm/s', role: 'constant', note: '光速' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '光在介质中的速度' },
        { symbol: 'f', value: null, unit: 'm', role: 'unknown', note: '焦距' },
        { symbol: 'u', value: null, unit: 'm', role: 'given', note: '物距' },
        { symbol: 'v_img', value: null, unit: 'm', role: 'unknown', note: '像距' }
      ],
      formulas: ['i = r', 'n = c/v', '1/f = 1/u + 1/v', 'sin i/sin r = n'],
      dependencies: [],
      output: ['r', 'v', 'f', 'v_img']
    });

    // 热学模块
    this.atomicModules.set('thermal', {
      id: 'thermal',
      type: 'thermal',
      name: '热学',
      description: '处理热量传递和温度变化',
      parameters: [
        { symbol: 'Q', value: null, unit: 'J', role: 'unknown', note: '热量' },
        { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
        { symbol: 'c', value: null, unit: 'J/(kg·K)', role: 'given', note: '比热容' },
        { symbol: 'Δt', value: null, unit: 'K', role: 'given', note: '温度变化' },
        { symbol: 'T1', value: null, unit: 'K', role: 'given', note: '初温度' },
        { symbol: 'T2', value: null, unit: 'K', role: 'unknown', note: '末温度' },
        { symbol: 'L', value: null, unit: 'J/kg', role: 'given', note: '潜热' }
      ],
      formulas: ['Q = mcΔt', 'Q = mL', 'Δt = T2 - T1'],
      dependencies: [],
      output: ['Q', 'T2']
    });

    // 理想气体模块
    this.atomicModules.set('ideal_gas', {
      id: 'ideal_gas',
      type: 'thermal',
      name: '理想气体',
      description: '处理理想气体状态方程',
      parameters: [
        { symbol: 'p', value: null, unit: 'Pa', role: 'unknown', note: '压强' },
        { symbol: 'V', value: null, unit: 'm³', role: 'unknown', note: '体积' },
        { symbol: 'T', value: null, unit: 'K', role: 'unknown', note: '温度' },
        { symbol: 'n', value: null, unit: 'mol', role: 'given', note: '物质的量' },
        { symbol: 'R', value: 8.314, unit: 'J/(mol·K)', role: 'constant', note: '气体常数' },
        { symbol: 'N', value: null, unit: '', role: 'unknown', note: '分子数' },
        { symbol: 'NA', value: 6.022e23, unit: 'mol⁻¹', role: 'constant', note: '阿伏伽德罗常数' }
      ],
      formulas: ['pV = nRT', 'pV = NkT', 'N = nNA', 'k = R/NA'],
      dependencies: ['thermal'],
      output: ['p', 'V', 'T', 'N']
    });

    // 热力学第一定律模块
    this.atomicModules.set('first_law_thermodynamics', {
      id: 'first_law_thermodynamics',
      type: 'thermal',
      name: '热力学第一定律',
      description: '处理热力学第一定律和内能变化',
      parameters: [
        { symbol: 'ΔU', value: null, unit: 'J', role: 'unknown', note: '内能变化' },
        { symbol: 'Q', value: null, unit: 'J', role: 'given', note: '吸收热量' },
        { symbol: 'W', value: null, unit: 'J', role: 'given', note: '对外做功' },
        { symbol: 'Cv', value: null, unit: 'J/(mol·K)', role: 'given', note: '定容热容' },
        { symbol: 'Cp', value: null, unit: 'J/(mol·K)', role: 'given', note: '定压热容' },
        { symbol: 'γ', value: null, unit: '', role: 'unknown', note: '比热比' }
      ],
      formulas: ['ΔU = Q - W', 'ΔU = nCvΔT', 'Q = nCpΔT', 'γ = Cp/Cv'],
      dependencies: ['ideal_gas', 'thermal'],
      output: ['ΔU', 'γ']
    });

    // 热机效率模块
    this.atomicModules.set('heat_engine_efficiency', {
      id: 'heat_engine_efficiency',
      type: 'thermal',
      name: '热机效率',
      description: '处理热机效率和卡诺循环',
      parameters: [
        { symbol: 'η', value: null, unit: '', role: 'unknown', note: '热机效率' },
        { symbol: 'Q吸', value: null, unit: 'J', role: 'given', note: '吸收热量' },
        { symbol: 'Q放', value: null, unit: 'J', role: 'given', note: '放出热量' },
        { symbol: 'W', value: null, unit: 'J', role: 'unknown', note: '净功' },
        { symbol: 'T高', value: null, unit: 'K', role: 'given', note: '高温热源温度' },
        { symbol: 'T低', value: null, unit: 'K', role: 'given', note: '低温热源温度' }
      ],
      formulas: ['η = W/Q吸', 'η = 1 - Q放/Q吸', 'η卡诺 = 1 - T低/T高'],
      dependencies: ['first_law_thermodynamics'],
      output: ['η', 'W']
    });

    // 压强浮力模块
    this.atomicModules.set('pressure_buoyancy', {
      id: 'pressure_buoyancy',
      type: 'fluid',
      name: '压强浮力',
      description: '处理液体压强和阿基米德原理',
      parameters: [
        { symbol: 'p', value: null, unit: 'Pa', role: 'unknown', note: '压强' },
        { symbol: 'ρ', value: null, unit: 'kg/m³', role: 'given', note: '密度' },
        { symbol: 'h', value: null, unit: 'm', role: 'given', note: '深度' },
        { symbol: 'F浮', value: null, unit: 'N', role: 'unknown', note: '浮力' },
        { symbol: 'V排', value: null, unit: 'm³', role: 'unknown', note: '排开液体体积' },
        { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' }
      ],
      formulas: ['p = ρgh', 'F浮 = ρgV排', 'F浮 = G排'],
      dependencies: ['newton_dynamics'],
      output: ['p', 'F浮', 'V排']
    });

    // 万有引力模块
    this.atomicModules.set('gravitation', {
      id: 'gravitation',
      type: 'gravitation',
      name: '万有引力',
      description: '处理万有引力定律和天体运动',
      parameters: [
        { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '万有引力' },
        { symbol: 'G', value: 6.67e-11, unit: 'N·m²/kg²', role: 'constant', note: '万有引力常量' },
        { symbol: 'm1', value: null, unit: 'kg', role: 'given', note: '质量1' },
        { symbol: 'm2', value: null, unit: 'kg', role: 'given', note: '质量2' },
        { symbol: 'r', value: null, unit: 'm', role: 'given', note: '距离' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '轨道速度' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' }
      ],
      formulas: ['F = Gm1m2/r²', 'v = √(GM/r)', 'T = 2π√(r³/GM)'],
      dependencies: ['circular_motion'],
      output: ['F', 'v', 'T']
    });

    // 动量模块
    this.atomicModules.set('momentum', {
      id: 'momentum',
      type: 'momentum',
      name: '动量',
      description: '处理动量定理和动量守恒',
      parameters: [
        { symbol: 'p', value: null, unit: 'kg·m/s', role: 'unknown', note: '动量' },
        { symbol: 'I', value: null, unit: 'N·s', role: 'unknown', note: '冲量' },
        { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'given', note: '速度' },
        { symbol: 'F', value: null, unit: 'N', role: 'given', note: '力' },
        { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
      ],
      formulas: ['p = mv', 'I = Ft', 'I = Δp', 'p1 + p2 = p1\' + p2\''],
      dependencies: ['newton_dynamics'],
      output: ['p', 'I']
    });

    // 静电场模块
    this.atomicModules.set('electrostatics', {
      id: 'electrostatics',
      type: 'electrostatics',
      name: '静电场',
      description: '处理库仑定律和电场强度',
      parameters: [
        { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '库仑力' },
        { symbol: 'k', value: 9e9, unit: 'N·m²/C²', role: 'constant', note: '静电力常量' },
        { symbol: 'q1', value: null, unit: 'C', role: 'given', note: '电荷1' },
        { symbol: 'q2', value: null, unit: 'C', role: 'given', note: '电荷2' },
        { symbol: 'r', value: null, unit: 'm', role: 'given', note: '距离' },
        { symbol: 'E', value: null, unit: 'N/C', role: 'unknown', note: '电场强度' },
        { symbol: 'U', value: null, unit: 'V', role: 'unknown', note: '电势' }
      ],
      formulas: ['F = kq1q2/r²', 'E = F/q', 'E = kq/r²', 'U = kq/r'],
      dependencies: [],
      output: ['F', 'E', 'U']
    });

    // 电容器模块
    this.atomicModules.set('capacitor', {
      id: 'capacitor',
      type: 'electrostatics',
      name: '电容器',
      description: '处理电容器的充放电和能量存储',
      parameters: [
        { symbol: 'C', value: null, unit: 'F', role: 'unknown', note: '电容' },
        { symbol: 'Q', value: null, unit: 'C', role: 'unknown', note: '电荷量' },
        { symbol: 'U', value: null, unit: 'V', role: 'given', note: '电压' },
        { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '电场能量' },
        { symbol: 'ε', value: null, unit: 'F/m', role: 'given', note: '介电常数' },
        { symbol: 'S', value: null, unit: 'm²', role: 'given', note: '极板面积' },
        { symbol: 'd', value: null, unit: 'm', role: 'given', note: '极板间距' }
      ],
      formulas: ['C = Q/U', 'C = εS/d', 'E = ½CU²', 'E = ½QU'],
      dependencies: ['electrostatics'],
      output: ['C', 'Q', 'E']
    });

    // 电场中的运动模块
    this.atomicModules.set('motion_in_electric_field', {
      id: 'motion_in_electric_field',
      type: 'electrostatics',
      name: '电场中的运动',
      description: '处理带电粒子在电场中的运动',
      parameters: [
        { symbol: 'q', value: null, unit: 'C', role: 'given', note: '电荷' },
        { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
        { symbol: 'E', value: null, unit: 'N/C', role: 'given', note: '电场强度' },
        { symbol: 'a', value: null, unit: 'm/s²', role: 'unknown', note: '加速度' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '速度' },
        { symbol: 's', value: null, unit: 'm', role: 'unknown', note: '位移' },
        { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
      ],
      formulas: ['F = qE', 'a = qE/m', 'v = at', 's = ½at²'],
      dependencies: ['electrostatics', 'kinematics_linear'],
      output: ['a', 'v', 's']
    });

    // 磁场模块
    this.atomicModules.set('magnetism', {
      id: 'magnetism',
      type: 'magnetism',
      name: '磁场',
      description: '处理安培力和洛伦兹力',
      parameters: [
        { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '安培力' },
        { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
        { symbol: 'I', value: null, unit: 'A', role: 'given', note: '电流' },
        { symbol: 'L', value: null, unit: 'm', role: 'given', note: '导线长度' },
        { symbol: 'q', value: null, unit: 'C', role: 'given', note: '电荷' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'given', note: '速度' },
        { symbol: 'θ', value: null, unit: '°', role: 'given', note: '角度' }
      ],
      formulas: ['F = BILsinθ', 'F = qvBsinθ', 'F = qvB'],
      dependencies: ['dc_circuit'],
      output: ['F']
    });

    // 磁场中的运动模块
    this.atomicModules.set('motion_in_magnetic_field', {
      id: 'motion_in_magnetic_field',
      type: 'magnetism',
      name: '磁场中的运动',
      description: '处理带电粒子在磁场中的运动',
      parameters: [
        { symbol: 'q', value: null, unit: 'C', role: 'given', note: '电荷' },
        { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
        { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'given', note: '速度' },
        { symbol: 'r', value: null, unit: 'm', role: 'unknown', note: '回旋半径' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '回旋周期' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '回旋频率' }
      ],
      formulas: ['r = mv/(qB)', 'T = 2πm/(qB)', 'f = qB/(2πm)', 'ω = qB/m'],
      dependencies: ['magnetism', 'circular_motion'],
      output: ['r', 'T', 'f']
    });

    // 霍尔效应模块
    this.atomicModules.set('hall_effect', {
      id: 'hall_effect',
      type: 'magnetism',
      name: '霍尔效应',
      description: '处理霍尔效应和载流子浓度测量',
      parameters: [
        { symbol: 'UH', value: null, unit: 'V', role: 'unknown', note: '霍尔电压' },
        { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
        { symbol: 'I', value: null, unit: 'A', role: 'given', note: '电流' },
        { symbol: 'd', value: null, unit: 'm', role: 'given', note: '样品厚度' },
        { symbol: 'n', value: null, unit: 'm⁻³', role: 'unknown', note: '载流子浓度' },
        { symbol: 'q', value: 1.6e-19, unit: 'C', role: 'constant', note: '电子电荷' }
      ],
      formulas: ['UH = BI/(nqd)', 'n = BI/(qUHd)', 'RH = 1/(nq)'],
      dependencies: ['magnetism'],
      output: ['UH', 'n']
    });

    // 电磁感应模块
    this.atomicModules.set('electromagnetic_induction', {
      id: 'electromagnetic_induction',
      type: 'electromagnetic_induction',
      name: '电磁感应',
      description: '处理法拉第电磁感应定律',
      parameters: [
        { symbol: 'ε', value: null, unit: 'V', role: 'unknown', note: '感应电动势' },
        { symbol: 'Φ', value: null, unit: 'Wb', role: 'given', note: '磁通量' },
        { symbol: 'ΔΦ', value: null, unit: 'Wb', role: 'given', note: '磁通量变化' },
        { symbol: 'Δt', value: null, unit: 's', role: 'given', note: '时间变化' },
        { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
        { symbol: 'S', value: null, unit: 'm²', role: 'given', note: '面积' },
        { symbol: 'θ', value: null, unit: '°', role: 'given', note: '角度' }
      ],
      formulas: ['ε = -ΔΦ/Δt', 'Φ = BScosθ', 'ε = BLv'],
      dependencies: ['magnetism'],
      output: ['ε']
    });

    // 自感互感模块
    this.atomicModules.set('self_mutual_inductance', {
      id: 'self_mutual_inductance',
      type: 'electromagnetic_induction',
      name: '自感互感',
      description: '处理自感和互感现象',
      parameters: [
        { symbol: 'L', value: null, unit: 'H', role: 'unknown', note: '自感系数' },
        { symbol: 'M', value: null, unit: 'H', role: 'unknown', note: '互感系数' },
        { symbol: 'ε自', value: null, unit: 'V', role: 'unknown', note: '自感电动势' },
        { symbol: 'ε互', value: null, unit: 'V', role: 'unknown', note: '互感电动势' },
        { symbol: 'I', value: null, unit: 'A', role: 'given', note: '电流' },
        { symbol: 'ΔI', value: null, unit: 'A', role: 'given', note: '电流变化' },
        { symbol: 'Δt', value: null, unit: 's', role: 'given', note: '时间变化' }
      ],
      formulas: ['ε自 = -LΔI/Δt', 'ε互 = -MΔI/Δt', 'L = Φ/I', 'M = Φ21/I1'],
      dependencies: ['electromagnetic_induction'],
      output: ['L', 'M', 'ε自', 'ε互']
    });

    // 电磁波模块
    this.atomicModules.set('electromagnetic_waves', {
      id: 'electromagnetic_waves',
      type: 'electromagnetic_waves',
      name: '电磁波',
      description: '处理电磁波的传播和性质',
      parameters: [
        { symbol: 'c', value: 3e8, unit: 'm/s', role: 'constant', note: '光速' },
        { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '波长' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'given', note: '频率' },
        { symbol: 'E', value: null, unit: 'V/m', role: 'unknown', note: '电场强度' },
        { symbol: 'B', value: null, unit: 'T', role: 'unknown', note: '磁感应强度' },
        { symbol: 'S', value: null, unit: 'W/m²', role: 'unknown', note: '能流密度' },
        { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '功率' }
      ],
      formulas: ['c = λf', 'E = cB', 'S = EB/μ0', 'P = SA', 'E = E0sin(kx - ωt)'],
      dependencies: ['electromagnetic_induction'],
      output: ['λ', 'E', 'B', 'S', 'P']
    });

    // 交流电模块
    this.atomicModules.set('ac_circuit', {
      id: 'ac_circuit',
      type: 'ac_circuit',
      name: '交流电',
      description: '处理正弦交流电',
      parameters: [
        { symbol: 'u', value: null, unit: 'V', role: 'unknown', note: '瞬时电压' },
        { symbol: 'i', value: null, unit: 'A', role: 'unknown', note: '瞬时电流' },
        { symbol: 'Um', value: null, unit: 'V', role: 'given', note: '峰值电压' },
        { symbol: 'Im', value: null, unit: 'A', role: 'given', note: '峰值电流' },
        { symbol: 'U', value: null, unit: 'V', role: 'unknown', note: '有效值电压' },
        { symbol: 'I', value: null, unit: 'A', role: 'unknown', note: '有效值电流' },
        { symbol: 'ω', value: null, unit: 'rad/s', role: 'given', note: '角频率' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' }
      ],
      formulas: ['u = Umsin(ωt)', 'i = Imsin(ωt)', 'U = Um/√2', 'I = Im/√2', 'T = 2π/ω', 'f = 1/T'],
      dependencies: ['dc_circuit'],
      output: ['u', 'i', 'U', 'I', 'T', 'f']
    });

    // 物理光学模块
    this.atomicModules.set('physical_optics', {
      id: 'physical_optics',
      type: 'physical_optics',
      name: '物理光学',
      description: '处理光的干涉和衍射',
      parameters: [
        { symbol: 'λ', value: null, unit: 'm', role: 'given', note: '波长' },
        { symbol: 'd', value: null, unit: 'm', role: 'given', note: '双缝间距' },
        { symbol: 'L', value: null, unit: 'm', role: 'given', note: '屏距' },
        { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '条纹间距' },
        { symbol: 'a', value: null, unit: 'm', role: 'given', note: '单缝宽度' },
        { symbol: 'θ', value: null, unit: '°', role: 'unknown', note: '衍射角' },
        { symbol: 'n', value: null, unit: '', role: 'given', note: '折射率' }
      ],
      formulas: ['x = λL/d', 'asinθ = nλ', 'n = c/v'],
      dependencies: ['geometric_optics'],
      output: ['x', 'θ']
    });

    // 光的偏振模块
    this.atomicModules.set('light_polarization', {
      id: 'light_polarization',
      type: 'physical_optics',
      name: '光的偏振',
      description: '处理光的偏振现象',
      parameters: [
        { symbol: 'I0', value: null, unit: 'W/m²', role: 'given', note: '入射光强' },
        { symbol: 'I', value: null, unit: 'W/m²', role: 'unknown', note: '透射光强' },
        { symbol: 'θ', value: null, unit: '°', role: 'given', note: '偏振片夹角' },
        { symbol: 'n0', value: null, unit: '', role: 'given', note: '寻常光折射率' },
        { symbol: 'ne', value: null, unit: '', role: 'given', note: '非寻常光折射率' },
        { symbol: 'Δn', value: null, unit: '', role: 'unknown', note: '双折射率差' }
      ],
      formulas: ['I = I0cos²θ', 'Δn = ne - n0', 'I = I0/2 (自然光)'],
      dependencies: ['physical_optics'],
      output: ['I', 'Δn']
    });

    // 激光模块
    this.atomicModules.set('laser', {
      id: 'laser',
      type: 'physical_optics',
      name: '激光',
      description: '处理激光的产生和特性',
      parameters: [
        { symbol: 'λ', value: null, unit: 'm', role: 'given', note: '激光波长' },
        { symbol: 'P', value: null, unit: 'W', role: 'given', note: '激光功率' },
        { symbol: 'I', value: null, unit: 'W/m²', role: 'unknown', note: '激光强度' },
        { symbol: 'A', value: null, unit: 'm²', role: 'given', note: '光束截面积' },
        { symbol: 'Δλ', value: null, unit: 'm', role: 'unknown', note: '线宽' },
        { symbol: 'τ', value: null, unit: 's', role: 'unknown', note: '脉冲宽度' }
      ],
      formulas: ['I = P/A', 'Δλ = λ²/(cτ)', 'E = Pτ'],
      dependencies: ['physical_optics'],
      output: ['I', 'Δλ', 'τ']
    });

    // 近代物理模块
    this.atomicModules.set('modern_physics', {
      id: 'modern_physics',
      type: 'modern_physics',
      name: '近代物理',
      description: '处理光电效应和原子结构',
      parameters: [
        { symbol: 'h', value: 6.63e-34, unit: 'J·s', role: 'constant', note: '普朗克常量' },
        { symbol: 'c', value: 3e8, unit: 'm/s', role: 'constant', note: '光速' },
        { symbol: 'λ', value: null, unit: 'm', role: 'given', note: '波长' },
        { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' },
        { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '光子能量' },
        { symbol: 'Ek', value: null, unit: 'J', role: 'unknown', note: '光电子动能' },
        { symbol: 'W', value: null, unit: 'J', role: 'given', note: '逸出功' },
        { symbol: 'n', value: null, unit: '', role: 'given', note: '量子数' }
      ],
      formulas: ['E = hf', 'E = hc/λ', 'Ek = hf - W', 'f = c/λ'],
      dependencies: [],
      output: ['f', 'E', 'Ek']
    });

    // 原子结构模块
    this.atomicModules.set('atomic_structure', {
      id: 'atomic_structure',
      type: 'modern_physics',
      name: '原子结构',
      description: '处理玻尔原子模型和能级跃迁',
      parameters: [
        { symbol: 'En', value: null, unit: 'eV', role: 'unknown', note: '能级能量' },
        { symbol: 'n', value: null, unit: '', role: 'given', note: '主量子数' },
        { symbol: 'Z', value: null, unit: '', role: 'given', note: '原子序数' },
        { symbol: 'rn', value: null, unit: 'm', role: 'unknown', note: '轨道半径' },
        { symbol: 'vn', value: null, unit: 'm/s', role: 'unknown', note: '电子速度' },
        { symbol: 'ΔE', value: null, unit: 'eV', role: 'unknown', note: '能级差' },
        { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '跃迁波长' }
      ],
      formulas: ['En = -13.6Z²/n² eV', 'rn = n²a0/Z', 'vn = Zαc/n', 'ΔE = hc/λ'],
      dependencies: ['modern_physics'],
      output: ['En', 'rn', 'vn', 'ΔE', 'λ']
    });

    // 量子力学基础模块
    this.atomicModules.set('quantum_mechanics_basics', {
      id: 'quantum_mechanics_basics',
      type: 'quantum_physics',
      name: '量子力学基础',
      description: '处理薛定谔方程和波函数',
      parameters: [
        { symbol: 'ψ', value: null, unit: 'm⁻³/²', role: 'unknown', note: '波函数' },
        { symbol: '|ψ|²', value: null, unit: 'm⁻³', role: 'unknown', note: '概率密度' },
        { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '能量本征值' },
        { symbol: 'p', value: null, unit: 'kg·m/s', role: 'unknown', note: '动量' },
        { symbol: 'x', value: null, unit: 'm', role: 'given', note: '位置' },
        { symbol: 'Δx', value: null, unit: 'm', role: 'unknown', note: '位置不确定度' },
        { symbol: 'Δp', value: null, unit: 'kg·m/s', role: 'unknown', note: '动量不确定度' }
      ],
      formulas: ['Ĥψ = Eψ', '|ψ|² = ψ*ψ', 'ΔxΔp ≥ ℏ/2', 'p = ℏk'],
      dependencies: ['modern_physics'],
      output: ['ψ', '|ψ|²', 'E', 'p', 'Δx', 'Δp']
    });

    // 固体物理模块
    this.atomicModules.set('solid_state_physics', {
      id: 'solid_state_physics',
      type: 'condensed_matter',
      name: '固体物理',
      description: '处理晶体结构和能带理论',
      parameters: [
        { symbol: 'a', value: null, unit: 'm', role: 'given', note: '晶格常数' },
        { symbol: 'Eg', value: null, unit: 'eV', role: 'unknown', note: '禁带宽度' },
        { symbol: 'EF', value: null, unit: 'eV', role: 'unknown', note: '费米能级' },
        { symbol: 'n', value: null, unit: 'm⁻³', role: 'unknown', note: '载流子浓度' },
        { symbol: 'μ', value: null, unit: 'm²/(V·s)', role: 'unknown', note: '迁移率' },
        { symbol: 'σ', value: null, unit: 'S/m', role: 'unknown', note: '电导率' }
      ],
      formulas: ['σ = nqμ', 'EF = ℏ²(3π²n)^(2/3)/(2m)', 'Eg = Ec - Ev'],
      dependencies: ['quantum_mechanics_basics'],
      output: ['Eg', 'EF', 'n', 'μ', 'σ']
    });

    // 核物理模块
    this.atomicModules.set('nuclear_physics', {
      id: 'nuclear_physics',
      type: 'nuclear_physics',
      name: '核物理',
      description: '处理核反应和放射性衰变',
      parameters: [
        { symbol: 'N', value: null, unit: '', role: 'unknown', note: '剩余核数' },
        { symbol: 'N0', value: null, unit: '', role: 'given', note: '初始核数' },
        { symbol: 'λ', value: null, unit: 's⁻¹', role: 'given', note: '衰变常数' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '半衰期' },
        { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' },
        { symbol: 'Δm', value: null, unit: 'kg', role: 'given', note: '质量亏损' },
        { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '结合能' }
      ],
      formulas: ['N = N0e^(-λt)', 'T = ln2/λ', 'E = Δmc²'],
      dependencies: [],
      output: ['N', 'T', 'E']
    });

    // 天体物理模块
    this.atomicModules.set('astrophysics', {
      id: 'astrophysics',
      type: 'astrophysics',
      name: '天体物理',
      description: '处理天体运动和宇宙学',
      parameters: [
        { symbol: 'M', value: null, unit: 'kg', role: 'given', note: '天体质量' },
        { symbol: 'R', value: null, unit: 'm', role: 'given', note: '轨道半径' },
        { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '轨道速度' },
        { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '轨道周期' },
        { symbol: 'H0', value: 2.2e-18, unit: 's⁻¹', role: 'constant', note: '哈勃常数' },
        { symbol: 'z', value: null, unit: '', role: 'given', note: '红移' },
        { symbol: 'd', value: null, unit: 'm', role: 'unknown', note: '距离' }
      ],
      formulas: ['v = √(GM/R)', 'T = 2π√(R³/GM)', 'z = H0d/c', 'd = cz/H0'],
      dependencies: ['gravitation'],
      output: ['v', 'T', 'd']
    });

    // 生物物理模块
    this.atomicModules.set('biophysics', {
      id: 'biophysics',
      type: 'biophysics',
      name: '生物物理',
      description: '处理生物系统中的物理现象',
      parameters: [
        { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '肌肉力' },
        { symbol: 'A', value: null, unit: 'm²', role: 'given', note: '肌肉截面积' },
        { symbol: 'σ', value: null, unit: 'Pa', role: 'unknown', note: '应力' },
        { symbol: 'E', value: null, unit: 'Pa', role: 'given', note: '弹性模量' },
        { symbol: 'ε', value: null, unit: '', role: 'unknown', note: '应变' },
        { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '生物功率' },
        { symbol: 'η', value: null, unit: '', role: 'unknown', note: '生物效率' }
      ],
      formulas: ['σ = F/A', 'σ = Eε', 'P = Fv', 'η = P输出/P输入'],
      dependencies: ['newton_dynamics', 'work_energy'],
      output: ['F', 'σ', 'ε', 'P', 'η']
    });

    // 材料物理模块
    this.atomicModules.set('materials_physics', {
      id: 'materials_physics',
      type: 'condensed_matter',
      name: '材料物理',
      description: '处理材料的物理性质',
      parameters: [
        { symbol: 'E', value: null, unit: 'Pa', role: 'unknown', note: '杨氏模量' },
        { symbol: 'σ', value: null, unit: 'Pa', role: 'given', note: '应力' },
        { symbol: 'ε', value: null, unit: '', role: 'given', note: '应变' },
        { symbol: 'K', value: null, unit: 'W/(m·K)', role: 'unknown', note: '热导率' },
        { symbol: 'α', value: null, unit: 'K⁻¹', role: 'unknown', note: '热膨胀系数' },
        { symbol: 'ρ', value: null, unit: 'Ω·m', role: 'unknown', note: '电阻率' },
        { symbol: 'μ', value: null, unit: '', role: 'unknown', note: '磁导率' }
      ],
      formulas: ['E = σ/ε', 'K = Q/(AΔT/Δx)', 'α = ΔL/(LΔT)', 'ρ = RA/L'],
      dependencies: ['solid_state_physics'],
      output: ['E', 'K', 'α', 'ρ', 'μ']
    });

    // 等离子体物理模块
    this.atomicModules.set('plasma_physics', {
      id: 'plasma_physics',
      type: 'plasma_physics',
      name: '等离子体物理',
      description: '处理等离子体的物理性质',
      parameters: [
        { symbol: 'ne', value: null, unit: 'm⁻³', role: 'given', note: '电子密度' },
        { symbol: 'ni', value: null, unit: 'm⁻³', role: 'given', note: '离子密度' },
        { symbol: 'Te', value: null, unit: 'K', role: 'given', note: '电子温度' },
        { symbol: 'Ti', value: null, unit: 'K', role: 'given', note: '离子温度' },
        { symbol: 'ωp', value: null, unit: 'rad/s', role: 'unknown', note: '等离子体频率' },
        { symbol: 'λD', value: null, unit: 'm', role: 'unknown', note: '德拜长度' },
        { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁场强度' }
      ],
      formulas: ['ωp = √(nee²/(ε0me))', 'λD = √(ε0kBTe/(nee²))', 'ωc = eB/me'],
      dependencies: ['electromagnetism'],
      output: ['ωp', 'λD']
    });
  }

  /**
   * 添加新模块
   */
  addModule(module: AtomicModule): void {
    this.atomicModules.set(module.id, module);
  }

  /**
   * 更新模块
   */
  updateModule(id: string, module: AtomicModule): void {
    if (this.atomicModules.has(id)) {
      this.atomicModules.set(id, module);
    }
  }

  /**
   * 删除模块
   */
  removeModule(id: string): boolean {
    return this.atomicModules.delete(id);
  }

  /**
   * 获取模块统计信息
   */
  getStatistics(): {
    totalModules: number;
    modulesByType: Record<string, number>;
    totalParameters: number;
    totalFormulas: number;
  } {
    const modulesByType: Record<string, number> = {};
    let totalParameters = 0;
    let totalFormulas = 0;

    for (const module of Array.from(this.atomicModules.values())) {
      modulesByType[module.type] = (modulesByType[module.type] || 0) + 1;
      totalParameters += module.parameters.length;
      totalFormulas += module.formulas.length;
    }

    return {
      totalModules: this.atomicModules.size,
      modulesByType,
      totalParameters,
      totalFormulas
    };
  }
}

// 导出默认实例
export const atomicModuleLibrary = new AtomicModuleLibrary();
