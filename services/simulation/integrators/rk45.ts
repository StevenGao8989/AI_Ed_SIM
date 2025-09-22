// services/simulation/integrators/rk45.ts
// RK45 自适应积分器 + 事件根定位

import type { RootFinder, AdaptiveResult } from '../../dsl/types';

export interface State {
  position: Float64Array;
  velocity: Float64Array;
  time: number;
}

export interface DerivativeFunction {
  (state: State, dt: number): State;
}

export interface GuardFunction {
  (state: State): number;
}

/**
 * 根查找器实现
 */
export class BisectionRootFinder implements RootFinder {
  /**
   * 使用二分法在指定区间内查找根
   */
  locateZero(
    g: (t: number) => number, 
    t0: number, 
    t1: number, 
    tol: number, 
    maxIters: number = 100
  ): number | null {
    let a = t0;
    let b = t1;
    let fa = g(a);
    let fb = g(b);

    // 检查区间端点
    if (Math.abs(fa) < tol) return a;
    if (Math.abs(fb) < tol) return b;

    // 检查是否有符号变化
    if (fa * fb > 0) {
      return null; // 没有根
    }

    // 二分查找
    for (let iter = 0; iter < maxIters; iter++) {
      const c = (a + b) / 2;
      const fc = g(c);

      if (Math.abs(fc) < tol || (b - a) / 2 < tol) {
        return c;
      }

      if (fa * fc < 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }

    return (a + b) / 2; // 返回最后一次迭代的结果
  }
}

/**
 * RK45 自适应积分器
 */
export class RK45Integrator {
  private rootFinder: RootFinder;

  constructor(
    private hMax: number = 0.01,
    private relTol: number = 1e-6,
    private absTol: number = 1e-9
  ) {
    this.rootFinder = new BisectionRootFinder();
  }

  /**
   * 执行一步自适应积分
   */
  stepAdaptive(
    state: State, 
    f: DerivativeFunction, 
    guards: Array<{ id: string; guard: GuardFunction }> = []
  ): AdaptiveResult {
    let h = this.hMax;
    let accepted = false;
    let newState = state;
    let events: Array<{ t: number; id: string }> = [];
    let lastError = 0;

    // 尝试积分步长
    while (!accepted && h > 1e-12) {
      const result = this.rk45Step(state, f, h);
      lastError = result.error;
      
      if (this.isStepAccepted(result, state, h)) {
        accepted = true;
        newState = result.newState;
        
        // 检查事件
        events = this.detectEvents(state, newState, guards);
        
        // 如果有事件，需要细分步长
        if (events.length > 0) {
          const eventTime = this.locateEventTime(state, newState, guards[0], h);
          if (eventTime !== null && eventTime > state.time && eventTime < newState.time) {
            // 重新积分到事件时间
            const eventResult = this.rk45Step(state, f, eventTime - state.time);
            newState = eventResult.newState;
            events = [{ t: eventTime, id: guards[0].id }];
          }
        }
      } else {
        // 步长太大，减小步长
        h *= 0.5;
      }
    }

    // 计算下一步建议步长
    const hNext = this.calculateNextStepSize(h, accepted, lastError);

    return {
      state: newState.position,
      t: newState.time,
      h_next: hNext,
      accepted,
      events
    };
  }

  /**
   * 执行一步 RK45 积分
   */
  private rk45Step(state: State, f: DerivativeFunction, h: number): { 
    newState: State; 
    error: number 
  } {
    // RK4 步骤
    const k1 = f(state, 0);
    
    const state2: State = {
      position: this.addArrays(state.position, this.scaleArray(k1.position, h/4)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k1.velocity, h/4)),
      time: state.time + h/4
    };
    const k2 = f(state2, h/4);
    
    const state3: State = {
      position: this.addArrays(state.position, this.scaleArray(k2.position, 3*h/8)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k2.velocity, 3*h/8)),
      time: state.time + 3*h/8
    };
    const k3 = f(state3, 3*h/8);
    
    const state4: State = {
      position: this.addArrays(state.position, this.scaleArray(k3.position, 12*h/13)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k3.velocity, 12*h/13)),
      time: state.time + 12*h/13
    };
    const k4 = f(state4, 12*h/13);
    
    const state5: State = {
      position: this.addArrays(state.position, this.scaleArray(k4.position, h)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k4.velocity, h)),
      time: state.time + h
    };
    const k5 = f(state5, h);
    
    const state6: State = {
      position: this.addArrays(state.position, this.scaleArray(k5.position, h/2)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k5.velocity, h/2)),
      time: state.time + h/2
    };
    const k6 = f(state6, h/2);

    // 5阶解
    const b5 = [16/135, 0, 6656/12825, 28561/56430, -9/50, 2/55];
    const newState5 = this.weightedSum(state, [k1, k2, k3, k4, k5, k6], b5, h);

    // 4阶解
    const b4 = [25/216, 0, 1408/2565, 2197/4104, -1/5, 0];
    const newState4 = this.weightedSum(state, [k1, k2, k3, k4, k5, k6], b4, h);

    // 计算误差估计
    const error = this.calculateError(newState4, newState5);

    return {
      newState: newState5,
      error
    };
  }

  /**
   * 加权求和
   */
  private weightedSum(
    state: State, 
    k: State[], 
    weights: number[], 
    h: number
  ): State {
    const weightedPos = new Float64Array(state.position.length);
    const weightedVel = new Float64Array(state.velocity.length);

    for (let i = 0; i < k.length; i++) {
      const w = weights[i];
      for (let j = 0; j < state.position.length; j++) {
        weightedPos[j] += w * k[i].position[j];
        weightedVel[j] += w * k[i].velocity[j];
      }
    }

    return {
      position: this.addArrays(state.position, this.scaleArray(weightedPos, h)),
      velocity: this.addArrays(state.velocity, this.scaleArray(weightedVel, h)),
      time: state.time + h
    };
  }

  /**
   * 计算误差估计
   */
  private calculateError(state4: State, state5: State): number {
    let error = 0;
    const n = state4.position.length;

    for (let i = 0; i < n; i++) {
      const relError = Math.abs(state5.position[i] - state4.position[i]) / 
                      (this.absTol + this.relTol * Math.abs(state5.position[i]));
      error = Math.max(error, relError);
    }

    return error;
  }

  /**
   * 检查步长是否被接受
   */
  private isStepAccepted(result: { newState: State; error: number }, state: State, h: number): boolean {
    return result.error <= 1.0;
  }

  /**
   * 计算下一步建议步长
   */
  private calculateNextStepSize(currentH: number, accepted: boolean, error?: number): number {
    if (!accepted) {
      return currentH * 0.5; // 步长被拒绝，减小步长
    }

    // 基于误差估计调整步长
    const safety = 0.9;
    const maxIncrease = 5.0;
    const minDecrease = 0.1;

    if (error !== undefined && error > 0) {
      // 基于误差估计的步长调整
      const factor = safety * Math.pow(1.0 / error, 1/5);
      return currentH * Math.min(maxIncrease, Math.max(minDecrease, factor));
    }

    // 默认：适度增加步长
    return currentH * 1.2;
  }

  /**
   * 检测事件
   */
  private detectEvents(
    oldState: State, 
    newState: State, 
    guards: Array<{ id: string; guard: GuardFunction }>
  ): Array<{ t: number; id: string }> {
    const events: Array<{ t: number; id: string }> = [];

    for (const { id, guard } of guards) {
      const oldValue = guard(oldState);
      const newValue = guard(newState);

      // 检查符号变化（穿越零点）
      if (oldValue * newValue < 0) {
        // 使用线性插值估计事件时间
        const t = oldState.time + (newState.time - oldState.time) * 
                  Math.abs(oldValue) / (Math.abs(oldValue) + Math.abs(newValue));
        events.push({ t, id });
      }
    }

    return events;
  }

  /**
   * 定位事件时间
   */
  private locateEventTime(
    oldState: State, 
    newState: State, 
    guard: { id: string; guard: GuardFunction }, 
    h: number
  ): number | null {
    const g = (t: number) => {
      // 创建插值状态
      const alpha = (t - oldState.time) / (newState.time - oldState.time);
      const interpState: State = {
        position: this.interpolateArray(oldState.position, newState.position, alpha),
        velocity: this.interpolateArray(oldState.velocity, newState.velocity, alpha),
        time: t
      };
      return guard.guard(interpState);
    };

    return this.rootFinder.locateZero(g, oldState.time, newState.time, 1e-9, 100);
  }

  /**
   * 数组插值
   */
  private interpolateArray(a: Float64Array, b: Float64Array, alpha: number): Float64Array {
    const result = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] + alpha * (b[i] - a[i]);
    }
    return result;
  }

  /**
   * 数组加法
   */
  private addArrays(a: Float64Array, b: Float64Array): Float64Array {
    if (a.length !== b.length) {
      throw new Error('数组长度不匹配');
    }
    const result = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] + b[i];
    }
    return result;
  }

  /**
   * 数组标量乘法
   */
  private scaleArray(a: Float64Array, scale: number): Float64Array {
    const result = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] * scale;
    }
    return result;
  }

  /**
   * 设置根查找器
   */
  setRootFinder(rootFinder: RootFinder): void {
    this.rootFinder = rootFinder;
  }

  /**
   * 设置容差
   */
  setTolerances(relTol: number, absTol: number): void {
    this.relTol = relTol;
    this.absTol = absTol;
  }

  /**
   * 设置最大步长
   */
  setMaxStepSize(hMax: number): void {
    this.hMax = hMax;
  }
}

/**
 * 便捷函数：创建 RK45 积分器
 */
export function createRK45Integrator(
  hMax: number = 0.01,
  relTol: number = 1e-6,
  absTol: number = 1e-9
): RK45Integrator {
  return new RK45Integrator(hMax, relTol, absTol);
}