// services/simulation/Simulator.ts
// 事件驱动物理仿真器：主循环 + 能量账本

import { RK4Integrator, DerivativeFunction } from './integrators/rk4';
import { RK45Integrator } from './integrators/rk45';
import { EventRootFinder, RootFunction } from './events/eventRoot';
import { ContactImpulseResolver, ContactMaterial, ContactTolerances } from './events/contact';

/**
 * PhysicsDSL 类型定义
 */
export interface PhysicsDSL {
  state: {
    dof: number;
    q0: number[];
    v0: number[];
  };
  equations: {
    f: DerivativeFunction;
  };
  events: Array<{
    id: string;
    root: RootFunction;
    action: "resolve_contact" | "switch_phase" | "stop" | "custom";
    payload?: any;
  }>;
  solver: {
    type: "rk4" | "rk45";
    h0: number;
    hMin: number;
    hMax: number;
    tol?: number;
  };
}

/**
 * PhysicsContract 类型定义
 */
export interface PhysicsContract {
  world: {
    coord: "xy_y_up" | "xy_y_down";
    gravity?: [number, number];
    constants?: Record<string, number>;
  };
  bodies: Array<{
    id: string;
    kind: "ball" | "cart" | "block" | "board" | "point" | "compound";
    shape: "circle" | "box" | "point";
    mass: number;
    inertia?: number | [number, number, number];
    size?: number[];
    init?: {
      x?: number; y?: number; theta?: number;
      vx?: number; vy?: number; omega?: number;
    };
    material?: ContactMaterial;
    contacts?: string[];
  }>;
  surfaces: Array<{
    id: string;
    type: "plane";
    point: [number, number];
    normal: [number, number];
    material?: ContactMaterial;
  }>;
  tolerances?: {
    r2_min?: number;
    rel_err?: number;
    event_time_sec?: number;
    energy_drift_rel?: number;
    v_eps?: number;
  };
}

/**
 * 仿真轨迹
 */
export interface SimTrace {
  samples: Array<{
    t: number;
    bodies: Record<string, {
      x: number; y: number; theta: number;
      vx: number; vy: number; omega: number;
    }>;
    energy?: {
      Ek: number;  // 动能
      Ep: number;  // 势能
      Em: number;  // 机械能
    };
  }>;
  events: Array<{
    id: string;
    t: number;
    info?: any;
  }>;
  stats: {
    steps: number;
    rejects: number;
    cpuMs: number;
  };
}

/**
 * 事件驱动物理仿真器
 */
export class PhysicsSimulator {
  private tolerances: ContactTolerances;

  constructor(tolerances?: Partial<ContactTolerances>) {
    this.tolerances = {
      v_eps: 1e-3,
      penetration_tol: 1e-6,
      impulse_min: 1e-8,
      ...tolerances
    };
  }

  /**
   * 主仿真循环
   */
  async simulate(
    dsl: PhysicsDSL,
    contract: PhysicsContract,
    tEnd: number
  ): Promise<SimTrace> {
    console.log('🚀 开始事件驱动物理仿真...');
    console.log(`📊 仿真配置: tEnd=${tEnd}s, 求解器=${dsl.solver.type}, 步长=${dsl.solver.h0}`);
    
    const trace: SimTrace = {
      samples: [],
      events: [],
      stats: { steps: 0, rejects: 0, cpuMs: 0 }
    };
    
    // 初始化状态
    let t = 0;
    let h = dsl.solver.h0;
    let { q, v } = this.seedInitialState(dsl, contract);
    
    const t0 = performance.now();
    
    // 记录初始状态
    this.pushSample(trace, t, q, v, contract);
    
    // 主循环
    while (t < tEnd) {
      try {
        // 1. 事件检测
        const eventHit = this.findEventCrossing(t, q, v, h, dsl.events);
        
        if (eventHit) {
          const { tStar, event } = eventHit;
          
          // 积分到事件时刻
          const state = this.stepTo(dsl, t, q, v, tStar - t);
          q = state.q;
          v = state.v;
          t = tStar;
          
          // 处理事件
          const eventResult = this.handleEvent(event, contract, { t, q, v }, trace);
          if (eventResult.modified) {
            q = eventResult.q;
            v = eventResult.v;
          }
          
          // 记录事件和状态
          trace.events.push({ id: event.id, t: tStar, info: eventResult.info });
          this.pushSample(trace, t, q, v, contract);
          
          continue;
        }
        
        // 2. 正常积分步
        const state = this.integrationStep(dsl, t, q, v, h);
        
        if (state.accepted) {
          t += h;
          q = state.q;
          v = state.v;
          trace.stats.steps++;
          
          // 记录样本
          this.pushSample(trace, t, q, v, contract);
          
          // 自适应步长调整
          h = this.adjustStepSize(h, state.error, dsl.solver);
        } else {
          // 拒绝步长
          h = Math.max(dsl.solver.hMin, h * 0.5);
          trace.stats.rejects++;
          
          if (h < dsl.solver.hMin) {
            console.warn(`⚠️ 步长达到最小值 ${dsl.solver.hMin}，强制继续`);
            h = dsl.solver.hMin;
          }
        }
        
      } catch (error) {
        console.error('❌ 仿真步骤失败:', error);
        break;
      }
    }
    
    trace.stats.cpuMs = performance.now() - t0;
    
    console.log('✅ 仿真完成');
    console.log(`📊 统计: ${trace.stats.steps}步, ${trace.stats.rejects}次拒绝, ${trace.events.length}个事件`);
    console.log(`⏱️ 计算时间: ${trace.stats.cpuMs.toFixed(2)}ms`);
    
    return trace;
  }

  /**
   * 初始化状态
   */
  private seedInitialState(dsl: PhysicsDSL, contract: PhysicsContract): { q: number[]; v: number[] } {
    const q: number[] = [];
    const v: number[] = [];
    
    // 从contract中提取初始状态
    for (const body of contract.bodies) {
      const init = body.init || {};
      
      // 位置
      q.push(init.x || 0);      // x
      q.push(init.y || 0);      // y
      q.push(init.theta || 0);  // theta
      
      // 速度
      v.push(init.vx || 0);     // vx
      v.push(init.vy || 0);     // vy
      v.push(init.omega || 0);  // omega
    }
    
    return { q, v };
  }

  /**
   * 查找事件穿越
   */
  private findEventCrossing(
    t: number,
    q: number[],
    v: number[],
    h: number,
    events: PhysicsDSL['events']
  ): { tStar: number; event: PhysicsDSL['events'][0] } | null {
    const t1 = t + h;
    
    for (const event of events) {
      try {
        const f0 = event.root(t);
        const f1 = event.root(t1);
        
        // 检查符号变化
        if (f0 * f1 <= 0 && Math.abs(f0) > 1e-12) {
          const rootResult = EventRootFinder.findRoot(event.root, t, t1, 1e-8);
          
          if (rootResult.converged) {
            return { tStar: rootResult.t, event };
          }
        }
      } catch (error) {
        console.warn(`⚠️ 事件 ${event.id} 检测失败:`, error.message);
      }
    }
    
    return null;
  }

  /**
   * 积分到指定时间
   */
  private stepTo(
    dsl: PhysicsDSL,
    t0: number,
    q0: number[],
    v0: number[],
    dt: number
  ): { q: number[]; v: number[] } {
    if (dsl.solver.type === 'rk45') {
      const result = RK45Integrator.integrateAdaptive(
        dsl.equations.f,
        t0, q0, v0,
        t0 + dt,
        Math.min(dt, dsl.solver.h0),
        dsl.solver.tol || 1e-6,
        dsl.solver.hMin,
        dsl.solver.hMax
      );
      
      const final = result.results[result.results.length - 1];
      return { q: final.q, v: final.v };
    } else {
      // RK4 固定步长
      const steps = Math.max(1, Math.ceil(dt / dsl.solver.h0));
      const actualH = dt / steps;
      
      let q = [...q0];
      let v = [...v0];
      let t = t0;
      
      for (let i = 0; i < steps; i++) {
        const state = RK4Integrator.step(dsl.equations.f, t, q, v, actualH);
        q = state.q;
        v = state.v;
        t += actualH;
      }
      
      return { q, v };
    }
  }

  /**
   * 单步积分
   */
  private integrationStep(
    dsl: PhysicsDSL,
    t: number,
    q: number[],
    v: number[],
    h: number
  ): { q: number[]; v: number[]; accepted: boolean; error: number } {
    if (dsl.solver.type === 'rk45') {
      const result = RK45Integrator.adaptiveStep(
        dsl.equations.f,
        t, q, v, h,
        dsl.solver.tol || 1e-6
      );
      
      return {
        q: result.q,
        v: result.v,
        accepted: result.accepted,
        error: result.error
      };
    } else {
      // RK4 总是接受
      const state = RK4Integrator.step(dsl.equations.f, t, q, v, h);
      return {
        q: state.q,
        v: state.v,
        accepted: true,
        error: 0
      };
    }
  }

  /**
   * 处理事件
   */
  private handleEvent(
    event: PhysicsDSL['events'][0],
    contract: PhysicsContract,
    state: { t: number; q: number[]; v: number[] },
    trace: SimTrace
  ): { modified: boolean; q: number[]; v: number[]; info?: any } {
    console.log(`🎯 处理事件: ${event.id} at t=${state.t.toFixed(6)}s`);
    
    switch (event.action) {
      case 'resolve_contact':
        return this.resolveContactEvent(event, contract, state);
      
      case 'switch_phase':
        return this.switchPhaseEvent(event, contract, state);
      
      case 'stop':
        return { modified: false, q: state.q, v: state.v, info: { action: 'stop' } };
      
      case 'custom':
        return this.customEvent(event, contract, state);
      
      default:
        console.warn(`⚠️ 未知事件动作: ${event.action}`);
        return { modified: false, q: state.q, v: state.v };
    }
  }

  /**
   * 解析接触事件
   */
  private resolveContactEvent(
    event: any,
    contract: PhysicsContract,
    state: { t: number; q: number[]; v: number[] }
  ): { modified: boolean; q: number[]; v: number[]; info?: any } {
    // 简化实现：假设第一个刚体与地面接触
    const body = contract.bodies[0];
    const surface = contract.surfaces[0];
    
    if (!body || !surface) {
      return { modified: false, q: state.q, v: state.v };
    }
    
    // 构造刚体状态
    const bodyState = {
      id: body.id,
      mass: body.mass,
      inertia: typeof body.inertia === 'number' ? body.inertia : body.mass * 0.1, // 简化
      position: [state.q[0], state.q[1]] as [number, number],
      velocity: [state.v[0], state.v[1]] as [number, number],
      angle: state.q[2] || 0,
      angularVelocity: state.v[2] || 0
    };
    
    // 构造接触点
    const contactPoint = {
      p: [state.q[0], 0] as [number, number], // 简化：假设在地面接触
      normal: surface.normal,
      penetration: 0
    };
    
    // 材料属性
    const material: ContactMaterial = {
      restitution: surface.material?.restitution || body.material?.restitution || 1.0,
      mu_s: surface.material?.mu_s || body.material?.mu_s || 0.3,
      mu_k: surface.material?.mu_k || body.material?.mu_k || 0.2
    };
    
    // 解析冲量
    const impulseResult = ContactImpulseResolver.resolveContactImpulse(
      bodyState,
      contactPoint,
      material,
      this.tolerances
    );
    
    // 应用冲量到状态向量
    const newQ = [...state.q];
    const newV = [...state.v];
    
    // 更新速度（简化：只更新第一个刚体）
    newV[0] += impulseResult.total[0] / body.mass;  // vx
    newV[1] += impulseResult.total[1] / body.mass;  // vy
    
    return {
      modified: true,
      q: newQ,
      v: newV,
      info: {
        impulse: impulseResult.total,
        frictionType: impulseResult.type,
        energyDissipated: impulseResult.energy.dissipated
      }
    };
  }

  /**
   * 切换阶段事件
   */
  private switchPhaseEvent(
    event: any,
    contract: PhysicsContract,
    state: { t: number; q: number[]; v: number[] }
  ): { modified: boolean; q: number[]; v: number[]; info?: any } {
    console.log(`🔄 阶段切换: ${event.payload?.from} → ${event.payload?.to}`);
    
    return {
      modified: false,
      q: state.q,
      v: state.v,
      info: { phaseChange: event.payload }
    };
  }

  /**
   * 自定义事件
   */
  private customEvent(
    event: any,
    contract: PhysicsContract,
    state: { t: number; q: number[]; v: number[] }
  ): { modified: boolean; q: number[]; v: number[]; info?: any } {
    // 可扩展的自定义事件处理
    return {
      modified: false,
      q: state.q,
      v: state.v,
      info: { custom: event.payload }
    };
  }

  /**
   * 推送样本到轨迹（含能量账本）
   */
  private pushSample(
    trace: SimTrace,
    t: number,
    q: number[],
    v: number[],
    contract: PhysicsContract
  ): void {
    const bodies: Record<string, any> = {};
    
    // 提取刚体状态
    let idx = 0;
    for (const body of contract.bodies) {
      bodies[body.id] = {
        x: q[idx] || 0,
        y: q[idx + 1] || 0,
        theta: q[idx + 2] || 0,
        vx: v[idx] || 0,
        vy: v[idx + 1] || 0,
        omega: v[idx + 2] || 0
      };
      idx += 3; // 每个刚体3个DOF
    }
    
    // 计算能量
    const energy = this.calculateEnergy(q, v, contract);
    
    trace.samples.push({
      t: t,
      bodies: bodies,
      energy: energy
    });
  }

  /**
   * 计算系统能量
   */
  private calculateEnergy(
    q: number[],
    v: number[],
    contract: PhysicsContract
  ): { Ek: number; Ep: number; Em: number } {
    let Ek = 0; // 动能
    let Ep = 0; // 势能
    
    let idx = 0;
    for (const body of contract.bodies) {
      const mass = body.mass;
      const vx = v[idx] || 0;
      const vy = v[idx + 1] || 0;
      const omega = v[idx + 2] || 0;
      const y = q[idx + 1] || 0;
      
      // 平动动能
      Ek += 0.5 * mass * (vx * vx + vy * vy);
      
      // 转动动能
      const inertia = typeof body.inertia === 'number' ? body.inertia : mass * 0.1;
      Ek += 0.5 * inertia * omega * omega;
      
      // 重力势能
      const g = contract.world.gravity?.[1] || -9.8;
      Ep += mass * Math.abs(g) * y;
      
      idx += 3;
    }
    
    return {
      Ek: Ek,
      Ep: Ep,
      Em: Ek + Ep
    };
  }

  /**
   * 自适应步长调整
   */
  private adjustStepSize(
    h: number,
    error: number,
    solverConfig: PhysicsDSL['solver']
  ): number {
    if (solverConfig.type === 'rk45' && solverConfig.tol) {
      const factor = error > 0 ? Math.pow(solverConfig.tol / error, 0.2) : 1.5;
      const newH = h * Math.min(2.0, Math.max(0.5, 0.9 * factor));
      return Math.min(solverConfig.hMax, Math.max(solverConfig.hMin, newH));
    } else {
      // RK4 固定步长，轻微自适应
      return Math.min(solverConfig.hMax, h * 1.01);
    }
  }
}

/**
 * 便捷仿真函数
 */
export async function simulate(
  dsl: PhysicsDSL,
  contract: PhysicsContract,
  tEnd: number,
  tolerances?: Partial<ContactTolerances>
): Promise<SimTrace> {
  const simulator = new PhysicsSimulator(tolerances);
  return await simulator.simulate(dsl, contract, tEnd);
}

/**
 * 默认仿真器实例
 */
export const defaultSimulator = new PhysicsSimulator();
