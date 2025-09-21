// services/simulation/integrators/rk45.ts
// RK45 自适应步长积分器（Dormand-Prince方法）

import { StateVector, DerivativeFunction } from './rk4';

/**
 * 自适应积分结果
 */
export interface AdaptiveResult {
  t: number;
  q: number[];
  v: number[];
  h: number;      // 使用的步长
  error: number;  // 误差估计
  accepted: boolean;
}

/**
 * RK45 自适应积分器
 */
export class RK45Integrator {
  
  /**
   * Dormand-Prince 系数
   */
  private static readonly DP_A = [
    [],
    [1/5],
    [3/40, 9/40],
    [44/45, -56/15, 32/9],
    [19372/6561, -25360/2187, 64448/6561, -212/729],
    [9017/3168, -355/33, 46732/5247, 49/176, -5103/18656],
    [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84]
  ];
  
  private static readonly DP_B = [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84, 0];
  private static readonly DP_B_HAT = [5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40];

  /**
   * RK45 自适应单步
   */
  static adaptiveStep(
    f: DerivativeFunction,
    t: number,
    q: number[],
    v: number[],
    h: number,
    tol: number = 1e-6
  ): AdaptiveResult {
    const n = q.length;
    
    // 计算 k 值
    const k: Array<{ dq: number[]; dv: number[] }> = [];
    
    // k1
    k[0] = f(t, q, v);
    
    // k2 到 k7
    for (let i = 1; i < 7; i++) {
      const qi = q.map((qj, j) => {
        let sum = 0;
        for (let l = 0; l < i; l++) {
          sum += this.DP_A[i][l] * k[l].dq[j];
        }
        return qj + h * sum;
      });
      
      const vi = v.map((vj, j) => {
        let sum = 0;
        for (let l = 0; l < i; l++) {
          sum += this.DP_A[i][l] * k[l].dv[j];
        }
        return vj + h * sum;
      });
      
      k[i] = f(t + h * this.DP_A[i].reduce((sum, a) => sum + a, 0), qi, vi);
    }
    
    // 5阶解
    const q5 = q.map((qi, i) => {
      let sum = 0;
      for (let j = 0; j < 7; j++) {
        sum += this.DP_B[j] * k[j].dq[i];
      }
      return qi + h * sum;
    });
    
    const v5 = v.map((vi, i) => {
      let sum = 0;
      for (let j = 0; j < 7; j++) {
        sum += this.DP_B[j] * k[j].dv[i];
      }
      return vi + h * sum;
    });
    
    // 4阶解（用于误差估计）
    const q4 = q.map((qi, i) => {
      let sum = 0;
      for (let j = 0; j < 7; j++) {
        sum += this.DP_B_HAT[j] * k[j].dq[i];
      }
      return qi + h * sum;
    });
    
    const v4 = v.map((vi, i) => {
      let sum = 0;
      for (let j = 0; j < 7; j++) {
        sum += this.DP_B_HAT[j] * k[j].dv[i];
      }
      return vi + h * sum;
    });
    
    // 误差估计
    const errorQ = Math.max(...q5.map((qi, i) => Math.abs(qi - q4[i])));
    const errorV = Math.max(...v5.map((vi, i) => Math.abs(vi - v4[i])));
    const error = Math.max(errorQ, errorV);
    
    // 判断是否接受步长
    const accepted = error <= tol;
    
    return {
      t: t + h,
      q: accepted ? q5 : q,
      v: accepted ? v5 : v,
      h: h,
      error: error,
      accepted: accepted
    };
  }

  /**
   * 自适应步长控制
   */
  static adaptiveStepControl(
    error: number,
    tol: number,
    h: number,
    hMin: number,
    hMax: number,
    safetyFactor: number = 0.9
  ): number {
    if (error <= tol) {
      // 成功步长，可以增加
      const factor = Math.min(2.0, safetyFactor * Math.pow(tol / error, 0.2));
      return Math.min(hMax, h * factor);
    } else {
      // 失败步长，需要减少
      const factor = Math.max(0.1, safetyFactor * Math.pow(tol / error, 0.25));
      return Math.max(hMin, h * factor);
    }
  }

  /**
   * 自适应积分到指定时间
   */
  static integrateAdaptive(
    f: DerivativeFunction,
    t0: number,
    q0: number[],
    v0: number[],
    tEnd: number,
    h0: number,
    tol: number = 1e-6,
    hMin: number = 1e-8,
    hMax: number = 0.1
  ): {
    results: Array<{ t: number; q: number[]; v: number[] }>;
    stats: { steps: number; rejects: number; finalError: number };
  } {
    const results = [{ t: t0, q: [...q0], v: [...v0] }];
    const stats = { steps: 0, rejects: 0, finalError: 0 };
    
    let t = t0;
    let q = [...q0];
    let v = [...v0];
    let h = h0;
    
    while (t < tEnd) {
      // 确保不超过终止时间
      if (t + h > tEnd) {
        h = tEnd - t;
      }
      
      const result = this.adaptiveStep(f, t, q, v, h, tol);
      
      if (result.accepted) {
        // 接受步长
        t = result.t;
        q = result.q;
        v = result.v;
        
        results.push({ t, q: [...q], v: [...v] });
        stats.steps++;
        stats.finalError = result.error;
        
        // 调整下一步的步长
        h = this.adaptiveStepControl(result.error, tol, h, hMin, hMax);
      } else {
        // 拒绝步长，减小步长重试
        h = this.adaptiveStepControl(result.error, tol, h, hMin, hMax);
        stats.rejects++;
        
        // 防止无限循环
        if (h < hMin) {
          console.warn(`⚠️ 步长达到最小值 ${hMin}，强制继续`);
          h = hMin;
        }
      }
    }
    
    return { results, stats };
  }

  /**
   * 估算最优初始步长
   */
  static estimateInitialStepSize(
    f: DerivativeFunction,
    t0: number,
    q0: number[],
    v0: number[],
    tol: number
  ): number {
    const f0 = f(t0, q0, v0);
    
    // 计算特征尺度
    const qScale = Math.max(...q0.map(Math.abs), 1e-6);
    const vScale = Math.max(...v0.map(Math.abs), 1e-6);
    const fScale = Math.max(...f0.dv.map(Math.abs), 1e-6);
    
    // 估算步长
    const h0 = Math.sqrt(tol) * Math.min(qScale / vScale, vScale / fScale);
    
    return Math.max(1e-8, Math.min(0.1, h0));
  }

  /**
   * 验证积分精度
   */
  static validateAccuracy(
    f: DerivativeFunction,
    t: number,
    q: number[],
    v: number[],
    h: number,
    tol: number
  ): { accurate: boolean; estimatedError: number; recommendedStepSize: number } {
    const result = this.adaptiveStep(f, t, q, v, h, tol);
    const recommendedH = this.adaptiveStepControl(result.error, tol, h, h/10, h*10);
    
    return {
      accurate: result.accepted,
      estimatedError: result.error,
      recommendedStepSize: recommendedH
    };
  }
}

/**
 * 默认RK45积分器实例
 */
export const rk45 = RK45Integrator;
