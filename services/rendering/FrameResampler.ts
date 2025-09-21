// services/rendering/FrameResampler.ts
// 帧重采样器：固定帧率重采样 + 事件对齐

import type { SimTrace } from '../simulation/Simulator';

/**
 * 重采样帧
 */
export interface ResampledFrame {
  frameIndex: number;
  time: number;
  bodies: Record<string, {
    x: number; y: number; theta: number;
    vx: number; vy: number; omega: number;
  }>;
  energy: {
    Ek: number;
    Ep: number;
    Em: number;
  };
  events: Array<{
    id: string;
    t: number;
    highlight: boolean; // 是否为事件高亮帧
  }>;
  interpolated: boolean; // 是否为插值帧
}

/**
 * 重采样配置
 */
export interface ResampleConfig {
  fps: number;
  eventAlignment: boolean;    // 是否对齐事件
  eventHighlightFrames: number; // 事件高亮帧数
  interpolationMethod: 'linear' | 'cubic' | 'hermite';
  smoothing: boolean;         // 是否平滑轨迹
}

/**
 * 帧重采样器
 */
export class FrameResampler {
  
  /**
   * 重采样到固定帧率
   */
  static resample(
    trace: SimTrace,
    fps: number,
    config: Partial<ResampleConfig> = {}
  ): ResampledFrame[] {
    console.log('🎬 开始帧重采样...');
    console.log(`📊 原始样本: ${trace.samples.length}个, 目标帧率: ${fps}fps`);
    
    const fullConfig: ResampleConfig = {
      fps: fps,
      eventAlignment: true,
      eventHighlightFrames: 3,
      interpolationMethod: 'linear',
      smoothing: true,
      ...config
    };
    
    if (trace.samples.length === 0) {
      return [];
    }
    
    const tStart = trace.samples[0].t;
    const tEnd = trace.samples[trace.samples.length - 1].t;
    const duration = tEnd - tStart;
    const frameCount = Math.ceil(duration * fps);
    const frameInterval = 1 / fps;
    
    console.log(`⏱️ 时间范围: ${tStart.toFixed(3)}s - ${tEnd.toFixed(3)}s (${duration.toFixed(3)}s)`);
    console.log(`🎞️ 目标帧数: ${frameCount}帧, 帧间隔: ${frameInterval.toFixed(4)}s`);
    
    const resampledFrames: ResampledFrame[] = [];
    const eventTimes = new Set(trace.events.map(e => e.t));
    
    // 生成帧时间序列
    const frameTimes = this.generateFrameTimes(
      tStart, tEnd, fps, 
      fullConfig.eventAlignment ? Array.from(eventTimes) : []
    );
    
    console.log(`📐 实际帧数: ${frameTimes.length}帧 (包含${eventTimes.size}个事件对齐帧)`);
    
    // 为每个帧时间插值
    for (let i = 0; i < frameTimes.length; i++) {
      const frameTime = frameTimes[i];
      const frame = this.interpolateFrame(trace, frameTime, i, fullConfig);
      
      // 检查是否为事件帧
      const nearbyEvents = trace.events.filter(e => 
        Math.abs(e.t - frameTime) < frameInterval / 2
      );
      
      frame.events = nearbyEvents.map(e => ({
        id: e.id,
        t: e.t,
        highlight: true
      }));
      
      resampledFrames.push(frame);
    }
    
    console.log('✅ 帧重采样完成');
    return resampledFrames;
  }

  /**
   * 生成帧时间序列（含事件对齐）
   */
  private static generateFrameTimes(
    tStart: number,
    tEnd: number,
    fps: number,
    eventTimes: number[]
  ): number[] {
    const frameInterval = 1 / fps;
    const times: number[] = [];
    
    // 生成基础帧时间
    for (let t = tStart; t <= tEnd; t += frameInterval) {
      times.push(t);
    }
    
    // 添加事件时间（确保事件不被错过）
    for (const eventTime of eventTimes) {
      if (eventTime >= tStart && eventTime <= tEnd) {
        // 检查是否已有接近的帧时间
        const hasNearbyFrame = times.some(t => Math.abs(t - eventTime) < frameInterval / 4);
        
        if (!hasNearbyFrame) {
          times.push(eventTime);
        }
      }
    }
    
    // 排序并去重
    times.sort((a, b) => a - b);
    const uniqueTimes = [];
    for (let i = 0; i < times.length; i++) {
      if (i === 0 || times[i] - times[i-1] > 1e-6) {
        uniqueTimes.push(times[i]);
      }
    }
    
    return uniqueTimes;
  }

  /**
   * 插值单帧
   */
  private static interpolateFrame(
    trace: SimTrace,
    targetTime: number,
    frameIndex: number,
    config: ResampleConfig
  ): ResampledFrame {
    // 找到目标时间的邻近样本
    const { before, after, alpha } = this.findNeighboringSamples(trace, targetTime);
    
    if (!before) {
      // 使用第一个样本
      return this.createFrameFromSample(trace.samples[0], frameIndex, false);
    }
    
    if (!after) {
      // 使用最后一个样本
      return this.createFrameFromSample(before, frameIndex, false);
    }
    
    // 插值计算
    const interpolatedBodies: Record<string, any> = {};
    
    for (const bodyId of Object.keys(before.bodies)) {
      const bodyBefore = before.bodies[bodyId];
      const bodyAfter = after.bodies[bodyId];
      
      if (bodyAfter) {
        interpolatedBodies[bodyId] = this.interpolateBodyState(
          bodyBefore, bodyAfter, alpha, config.interpolationMethod
        );
      } else {
        interpolatedBodies[bodyId] = bodyBefore;
      }
    }
    
    // 插值能量
    const interpolatedEnergy = before.energy && after.energy ? {
      Ek: this.lerp(before.energy.Ek, after.energy.Ek, alpha),
      Ep: this.lerp(before.energy.Ep, after.energy.Ep, alpha),
      Em: this.lerp(before.energy.Em, after.energy.Em, alpha)
    } : (before.energy || after.energy || { Ek: 0, Ep: 0, Em: 0 });
    
    return {
      frameIndex: frameIndex,
      time: targetTime,
      bodies: interpolatedBodies,
      energy: interpolatedEnergy,
      events: [],
      interpolated: true
    };
  }

  /**
   * 查找邻近样本
   */
  private static findNeighboringSamples(
    trace: SimTrace,
    targetTime: number
  ): { before: any; after: any; alpha: number } {
    const samples = trace.samples;
    
    // 二分查找
    let left = 0;
    let right = samples.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      if (samples[mid].t === targetTime) {
        return { before: samples[mid], after: null, alpha: 0 };
      } else if (samples[mid].t < targetTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    // 找到插值区间
    const beforeIndex = Math.max(0, right);
    const afterIndex = Math.min(samples.length - 1, left);
    
    if (beforeIndex === afterIndex) {
      return { before: samples[beforeIndex], after: null, alpha: 0 };
    }
    
    const before = samples[beforeIndex];
    const after = samples[afterIndex];
    const alpha = (targetTime - before.t) / (after.t - before.t);
    
    return { before, after, alpha };
  }

  /**
   * 插值刚体状态
   */
  private static interpolateBodyState(
    stateBefore: any,
    stateAfter: any,
    alpha: number,
    method: 'linear' | 'cubic' | 'hermite'
  ): any {
    switch (method) {
      case 'linear':
        return {
          x: this.lerp(stateBefore.x, stateAfter.x, alpha),
          y: this.lerp(stateBefore.y, stateAfter.y, alpha),
          theta: this.lerpAngle(stateBefore.theta, stateAfter.theta, alpha),
          vx: this.lerp(stateBefore.vx, stateAfter.vx, alpha),
          vy: this.lerp(stateBefore.vy, stateAfter.vy, alpha),
          omega: this.lerp(stateBefore.omega, stateAfter.omega, alpha)
        };
      
      case 'cubic':
      case 'hermite':
        // 简化实现，实际可以使用更复杂的插值
        return this.interpolateBodyState(stateBefore, stateAfter, alpha, 'linear');
      
      default:
        return stateBefore;
    }
  }

  /**
   * 线性插值
   */
  private static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * 角度插值（处理周期性）
   */
  private static lerpAngle(a: number, b: number, t: number): number {
    const diff = b - a;
    const wrappedDiff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + wrappedDiff * t;
  }

  /**
   * 从样本创建帧
   */
  private static createFrameFromSample(
    sample: any,
    frameIndex: number,
    interpolated: boolean
  ): ResampledFrame {
    return {
      frameIndex: frameIndex,
      time: sample.t,
      bodies: sample.bodies,
      energy: sample.energy || { Ek: 0, Ep: 0, Em: 0 },
      events: [],
      interpolated: interpolated
    };
  }
}

/**
 * 便捷重采样函数
 */
export function resample(
  trace: SimTrace,
  fps: number,
  config?: Partial<ResampleConfig>
): ResampledFrame[] {
  return FrameResampler.resample(trace, fps, config);
}

/**
 * 默认重采样器
 */
export const frameResampler = FrameResampler;
