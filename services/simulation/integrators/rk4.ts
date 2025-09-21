// services/simulation/integrators/rk4.ts
// RK4 四阶龙格-库塔积分器

/**
 * 状态向量类型
 */
export interface StateVector {
  q: number[];  // 位置
  v: number[];  // 速度
}

/**
 * 导数函数类型
 */
export type DerivativeFunction = (
  t: number,
  q: number[],
  v: number[]
) => { dq: number[]; dv: number[] };

/**
 * RK4 积分器
 */
export class RK4Integrator {
  
  /**
   * RK4 单步积分
   */
  static step(
    f: DerivativeFunction,
    t: number,
    q: number[],
    v: number[],
    h: number
  ): StateVector {
    const n = q.length;
    
    // k1 = f(t, q, v)
    const k1 = f(t, q, v);
    
    // k2 = f(t + h/2, q + h*k1.dq/2, v + h*k1.dv/2)
    const q1 = q.map((qi, i) => qi + h * k1.dq[i] / 2);
    const v1 = v.map((vi, i) => vi + h * k1.dv[i] / 2);
    const k2 = f(t + h/2, q1, v1);
    
    // k3 = f(t + h/2, q + h*k2.dq/2, v + h*k2.dv/2)
    const q2 = q.map((qi, i) => qi + h * k2.dq[i] / 2);
    const v2 = v.map((vi, i) => vi + h * k2.dv[i] / 2);
    const k3 = f(t + h/2, q2, v2);
    
    // k4 = f(t + h, q + h*k3.dq, v + h*k3.dv)
    const q3 = q.map((qi, i) => qi + h * k3.dq[i]);
    const v3 = v.map((vi, i) => vi + h * k3.dv[i]);
    const k4 = f(t + h, q3, v3);
    
    // 最终结果
    const qNew = q.map((qi, i) => qi + h * (k1.dq[i] + 2*k2.dq[i] + 2*k3.dq[i] + k4.dq[i]) / 6);
    const vNew = v.map((vi, i) => vi + h * (k1.dv[i] + 2*k2.dv[i] + 2*k3.dv[i] + k4.dv[i]) / 6);
    
    return { q: qNew, v: vNew };
  }

  /**
   * 多步积分（固定步长）
   */
  static integrate(
    f: DerivativeFunction,
    t0: number,
    q0: number[],
    v0: number[],
    h: number,
    steps: number
  ): Array<{ t: number; q: number[]; v: number[] }> {
    const results = [{ t: t0, q: [...q0], v: [...v0] }];
    
    let t = t0;
    let q = [...q0];
    let v = [...v0];
    
    for (let i = 0; i < steps; i++) {
      const state = this.step(f, t, q, v, h);
      t += h;
      q = state.q;
      v = state.v;
      
      results.push({ t, q: [...q], v: [...v] });
    }
    
    return results;
  }

  /**
   * 积分到指定时间
   */
  static integrateTo(
    f: DerivativeFunction,
    t0: number,
    q0: number[],
    v0: number[],
    tEnd: number,
    h: number
  ): Array<{ t: number; q: number[]; v: number[] }> {
    const steps = Math.ceil((tEnd - t0) / h);
    const actualH = (tEnd - t0) / steps;
    
    return this.integrate(f, t0, q0, v0, actualH, steps);
  }

  /**
   * 验证积分器稳定性
   */
  static validateStability(
    f: DerivativeFunction,
    t: number,
    q: number[],
    v: number[],
    h: number
  ): { stable: boolean; maxEigenvalue: number } {
    // 简化的稳定性检查：计算雅可比矩阵的最大特征值
    const epsilon = 1e-8;
    const n = q.length;
    
    // 数值雅可比
    const jacobian: number[][] = [];
    const f0 = f(t, q, v);
    
    for (let i = 0; i < n; i++) {
      const qPert = [...q];
      qPert[i] += epsilon;
      const fPert = f(t, qPert, v);
      
      jacobian[i] = fPert.dv.map((dvPert, j) => (dvPert - f0.dv[j]) / epsilon);
    }
    
    // 估算最大特征值（简化：最大行和）
    const maxEigenvalue = Math.max(...jacobian.map(row => 
      row.reduce((sum, val) => sum + Math.abs(val), 0)
    ));
    
    // 稳定性判据：h * λ_max < 2
    const stable = h * maxEigenvalue < 2.0;
    
    return { stable, maxEigenvalue };
  }
}

/**
 * 默认RK4积分器实例
 */
export const rk4 = RK4Integrator;
