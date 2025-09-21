// services/simulation/events/eventRoot.ts
// 事件根定位：二分/弦截法精确定位事件发生时间

/**
 * 根查找函数类型
 */
export type RootFunction = (t: number) => number;

/**
 * 根查找结果
 */
export interface RootResult {
  t: number;          // 根的位置
  iterations: number; // 迭代次数
  converged: boolean; // 是否收敛
  error: number;      // 最终误差
}

/**
 * 事件根定位器
 */
export class EventRootFinder {
  
  /**
   * 二分法查找根
   */
  static bisection(
    f: RootFunction,
    t0: number,
    t1: number,
    tol: number = 1e-8,
    maxIterations: number = 100
  ): RootResult {
    let a = t0;
    let b = t1;
    let fa = f(a);
    let fb = f(b);
    
    // 检查初始条件
    if (fa * fb > 0) {
      throw new Error(`二分法要求f(${a}) * f(${b}) < 0，但得到 ${fa} * ${fb} = ${fa * fb}`);
    }
    
    let iterations = 0;
    let c = a;
    let fc = fa;
    
    while (Math.abs(b - a) > tol && iterations < maxIterations) {
      c = (a + b) / 2;
      fc = f(c);
      
      if (Math.abs(fc) < tol) {
        break; // 找到精确根
      }
      
      if (fa * fc < 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
      
      iterations++;
    }
    
    return {
      t: c,
      iterations: iterations,
      converged: Math.abs(fc) < tol || Math.abs(b - a) < tol,
      error: Math.abs(fc)
    };
  }

  /**
   * 弦截法查找根（更快收敛）
   */
  static secant(
    f: RootFunction,
    t0: number,
    t1: number,
    tol: number = 1e-8,
    maxIterations: number = 50
  ): RootResult {
    let x0 = t0;
    let x1 = t1;
    let f0 = f(x0);
    let f1 = f(x1);
    
    let iterations = 0;
    
    while (Math.abs(f1) > tol && Math.abs(x1 - x0) > tol && iterations < maxIterations) {
      if (Math.abs(f1 - f0) < 1e-14) {
        // 避免除零
        break;
      }
      
      const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
      
      // 更新
      x0 = x1;
      f0 = f1;
      x1 = x2;
      f1 = f(x1);
      
      iterations++;
    }
    
    return {
      t: x1,
      iterations: iterations,
      converged: Math.abs(f1) < tol,
      error: Math.abs(f1)
    };
  }

  /**
   * Brent方法（混合算法，最稳健）
   */
  static brent(
    f: RootFunction,
    t0: number,
    t1: number,
    tol: number = 1e-8,
    maxIterations: number = 100
  ): RootResult {
    let a = t0;
    let b = t1;
    let fa = f(a);
    let fb = f(b);
    
    if (fa * fb > 0) {
      throw new Error(`Brent方法要求f(${a}) * f(${b}) < 0`);
    }
    
    // 确保 |f(a)| >= |f(b)|
    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }
    
    let c = a;
    let fc = fa;
    let mflag = true;
    let iterations = 0;
    
    while (Math.abs(fb) > tol && Math.abs(b - a) > tol && iterations < maxIterations) {
      let s: number;
      
      if (fa !== fc && fb !== fc) {
        // 逆二次插值
        s = a * fb * fc / ((fa - fb) * (fa - fc)) +
            b * fa * fc / ((fb - fa) * (fb - fc)) +
            c * fa * fb / ((fc - fa) * (fc - fb));
      } else {
        // 弦截法
        s = b - fb * (b - a) / (fb - fa);
      }
      
      // 检查是否使用二分法
      const delta = Math.abs(2 * tol);
      const condition1 = s < (3 * a + b) / 4 || s > b;
      const condition2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
      const condition3 = !mflag && Math.abs(s - b) >= Math.abs(c - a) / 2;
      const condition4 = mflag && Math.abs(b - c) < delta;
      const condition5 = !mflag && Math.abs(c - a) < delta;
      
      if (condition1 || condition2 || condition3 || condition4 || condition5) {
        s = (a + b) / 2;
        mflag = true;
      } else {
        mflag = false;
      }
      
      const fs = f(s);
      a = b;
      fa = fb;
      
      if (fa * fs < 0) {
        b = s;
        fb = fs;
      } else {
        c = s;
        fc = fs;
      }
      
      // 确保 |f(a)| >= |f(b)|
      if (Math.abs(fa) < Math.abs(fb)) {
        [a, b] = [b, a];
        [fa, fb] = [fb, fa];
      }
      
      iterations++;
    }
    
    return {
      t: b,
      iterations: iterations,
      converged: Math.abs(fb) < tol,
      error: Math.abs(fb)
    };
  }

  /**
   * 智能根查找（自动选择最佳方法）
   */
  static findRoot(
    f: RootFunction,
    t0: number,
    t1: number,
    tol: number = 1e-8,
    method: 'auto' | 'bisection' | 'secant' | 'brent' = 'auto'
  ): RootResult {
    // 检查区间有效性
    const f0 = f(t0);
    const f1 = f(t1);
    
    if (Math.abs(f0) < tol) {
      return { t: t0, iterations: 0, converged: true, error: Math.abs(f0) };
    }
    if (Math.abs(f1) < tol) {
      return { t: t1, iterations: 0, converged: true, error: Math.abs(f1) };
    }
    
    if (f0 * f1 > 0) {
      throw new Error(`区间[${t0}, ${t1}]内无根：f(${t0})=${f0}, f(${t1})=${f1}`);
    }
    
    // 自动选择方法
    if (method === 'auto') {
      const interval = Math.abs(t1 - t0);
      if (interval > 1.0) {
        method = 'brent';      // 大区间用Brent（最稳健）
      } else if (interval > 0.1) {
        method = 'secant';     // 中等区间用弦截法（较快）
      } else {
        method = 'bisection';  // 小区间用二分法（最稳定）
      }
    }
    
    // 执行根查找
    switch (method) {
      case 'bisection':
        return this.bisection(f, t0, t1, tol);
      case 'secant':
        return this.secant(f, t0, t1, tol);
      case 'brent':
        return this.brent(f, t0, t1, tol);
      default:
        throw new Error(`未知的根查找方法: ${method}`);
    }
  }

  /**
   * 批量事件检测
   */
  static detectEvents(
    events: Array<{ id: string; root: RootFunction }>,
    t0: number,
    t1: number,
    tol: number = 1e-8
  ): Array<{ eventId: string; t: number; error: number }> {
    const detectedEvents = [];
    
    for (const event of events) {
      try {
        const f0 = event.root(t0);
        const f1 = event.root(t1);
        
        // 检查是否有根
        if (f0 * f1 <= 0) {
          const rootResult = this.findRoot(event.root, t0, t1, tol);
          
          if (rootResult.converged) {
            detectedEvents.push({
              eventId: event.id,
              t: rootResult.t,
              error: rootResult.error
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ 事件 ${event.id} 根查找失败:`, error.message);
      }
    }
    
    // 按时间排序
    detectedEvents.sort((a, b) => a.t - b.t);
    
    return detectedEvents;
  }

  /**
   * 验证根的准确性
   */
  static validateRoot(
    f: RootFunction,
    t: number,
    tol: number = 1e-8
  ): { valid: boolean; value: number; derivative?: number } {
    const value = f(t);
    
    // 数值导数估计
    const epsilon = 1e-8;
    const derivative = (f(t + epsilon) - f(t - epsilon)) / (2 * epsilon);
    
    return {
      valid: Math.abs(value) < tol,
      value: value,
      derivative: derivative
    };
  }
}

/**
 * 默认事件根查找器
 */
export const eventRootFinder = EventRootFinder;
