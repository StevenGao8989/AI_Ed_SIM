// services/simulation/integrators/rk4.ts
// RK4 常步长积分器

export interface State {
  position: Float64Array;
  velocity: Float64Array;
  time: number;
}

export interface DerivativeFunction {
  (state: State, dt: number): State;
}

export interface RK4Result {
  newState: State;
  error?: number;
}

/**
 * RK4 积分器
 */
export class RK4Integrator {
  constructor(private h: number = 0.01) {}

  /**
   * 执行一步 RK4 积分
   */
  step(state: State, f: DerivativeFunction): RK4Result {
    const h = this.h;
    
    // k1 = f(t, y)
    const k1 = f(state, 0);
    
    // k2 = f(t + h/2, y + h*k1/2)
    const state2: State = {
      position: this.addArrays(state.position, this.scaleArray(k1.position, h/2)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k1.velocity, h/2)),
      time: state.time + h/2
    };
    const k2 = f(state2, h/2);
    
    // k3 = f(t + h/2, y + h*k2/2)
    const state3: State = {
      position: this.addArrays(state.position, this.scaleArray(k2.position, h/2)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k2.velocity, h/2)),
      time: state.time + h/2
    };
    const k3 = f(state3, h/2);
    
    // k4 = f(t + h, y + h*k3)
    const state4: State = {
      position: this.addArrays(state.position, this.scaleArray(k3.position, h)),
      velocity: this.addArrays(state.velocity, this.scaleArray(k3.velocity, h)),
      time: state.time + h
    };
    const k4 = f(state4, h);
    
    // y_new = y + h*(k1 + 2*k2 + 2*k3 + k4)/6
    const k1k2 = this.addArrays(k1.position, this.scaleArray(k2.position, 2));
    const k3k4 = this.addArrays(this.scaleArray(k3.position, 2), k4.position);
    const weightedK = this.addArrays(k1k2, k3k4);
    
    const newPosition = this.addArrays(state.position, this.scaleArray(weightedK, h/6));
    
    const v1v2 = this.addArrays(k1.velocity, this.scaleArray(k2.velocity, 2));
    const v3v4 = this.addArrays(this.scaleArray(k3.velocity, 2), k4.velocity);
    const weightedV = this.addArrays(v1v2, v3v4);
    
    const newVelocity = this.addArrays(state.velocity, this.scaleArray(weightedV, h/6));

    return {
      newState: {
        position: newPosition,
        velocity: newVelocity,
        time: state.time + h
      }
    };
  }

  /**
   * 设置步长
   */
  setStepSize(h: number): void {
    this.h = h;
  }

  /**
   * 获取当前步长
   */
  getStepSize(): number {
    return this.h;
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
}

/**
 * 便捷函数：创建 RK4 积分器
 */
export function createRK4Integrator(stepSize: number = 0.01): RK4Integrator {
  return new RK4Integrator(stepSize);
}