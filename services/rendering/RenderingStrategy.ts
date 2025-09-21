// services/rendering/RenderingStrategy.ts
// 渲染策略接口：确保所有渲染器遵循一致的几何规则

import { UnifiedCoordinateSystem, InclineDefinition, PhysicsPoint } from './CoordinateSystem';

/**
 * 渲染策略接口
 */
export interface IRenderingStrategy {
  /**
   * 统一坐标转换（必须实现）
   */
  worldToScreen(physicsPoint: PhysicsPoint): { x: number; y: number };
  
  /**
   * 斜面位置计算（必须实现）
   */
  calculateInclinePosition(
    distanceAlongIncline: number,
    inclineAngle: number,
    objectRadius: number
  ): PhysicsPoint;
  
  /**
   * 几何一致性验证（必须实现）
   */
  validateGeometry(maxDistance: number, screenConfig: any): { valid: boolean; issues: string[] };
}

/**
 * 基础渲染策略（所有渲染器的基类）
 */
export abstract class BaseRenderingStrategy implements IRenderingStrategy {
  protected coordinateSystem: UnifiedCoordinateSystem;
  
  constructor(coordinateConfig?: any) {
    this.coordinateSystem = new UnifiedCoordinateSystem(coordinateConfig);
  }

  /**
   * 统一坐标转换（所有子类必须使用此方法）
   */
  worldToScreen(physicsPoint: PhysicsPoint): { x: number; y: number } {
    return this.coordinateSystem.worldToScreen(physicsPoint);
  }

  /**
   * 斜面位置计算（确保小球贴合斜面）
   */
  calculateInclinePosition(
    distanceAlongIncline: number,
    inclineAngle: number,
    objectRadius: number
  ): PhysicsPoint {
    const incline: InclineDefinition = {
      angle: inclineAngle,
      length: distanceAlongIncline * 2,
      startPoint: { x: 0, y: 0 }
    };
    
    return this.coordinateSystem.calculateInclinePoint(
      distanceAlongIncline,
      incline,
      objectRadius
    );
  }

  /**
   * 几何一致性验证
   */
  validateGeometry(maxDistance: number, screenConfig: any): { valid: boolean; issues: string[] } {
    const incline: InclineDefinition = {
      angle: 30, // 默认角度，实际使用时应该从物理参数获取
      length: maxDistance * 1.2,
      startPoint: { x: 0, y: 0 }
    };
    
    return this.coordinateSystem.validateGeometry(incline, maxDistance, screenConfig);
  }

  /**
   * 自动优化渲染配置
   */
  optimizeRenderConfig(
    physicsParams: any,
    calculationResults: any,
    screenConfig: { width: number; height: number }
  ): any {
    // 使用工厂方法生成最优配置
    const { PhysicsRenderFactory } = require('./PhysicsRenderFactory');
    const recommendation = PhysicsRenderFactory.generateOptimalRenderConfig(
      PhysicsRenderFactory.analyzePhysicsProblem(physicsParams, calculationResults),
      screenConfig.width,
      screenConfig.height
    );
    
    // 更新坐标系统
    this.coordinateSystem.updateConfig(recommendation.coordinateConfig);
    
    return recommendation;
  }

  /**
   * 获取坐标系统配置
   */
  getCoordinateConfig(): any {
    return this.coordinateSystem.getConfig();
  }
}

/**
 * 2D Canvas渲染策略
 */
export class Canvas2DRenderingStrategy extends BaseRenderingStrategy {
  
  /**
   * 渲染斜面（确保与小球轨迹一致）
   */
  renderIncline(
    ctx: any,
    inclineAngle: number,
    maxDistance: number,
    config: any
  ): void {
    const incline: InclineDefinition = {
      angle: inclineAngle,
      length: this.coordinateSystem.calculateOptimalInclineLength(
        maxDistance,
        config.width,
        50
      ),
      startPoint: { x: 0, y: 0 }
    };
    
    const screenPoints = this.coordinateSystem.calculateInclineScreenPoints(incline);
    
    // 绘制斜面
    ctx.strokeStyle = '#696969';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(screenPoints.start.x, screenPoints.start.y);
    ctx.lineTo(screenPoints.end.x, screenPoints.end.y);
    ctx.stroke();
    
    // 角度标注
    ctx.fillStyle = '#000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`θ=${inclineAngle}°`, screenPoints.start.x + 80, screenPoints.start.y - 20);
  }

  /**
   * 渲染物体（确保在斜面上时贴合斜面）
   */
  renderObject(
    ctx: any,
    objectState: any,
    environment: any,
    config: any
  ): void {
    let physicsPosition: PhysicsPoint;

    if (objectState.phase === '斜面滑动' || objectState.phase === '静止') {
      // 斜面运动：使用精确的斜面位置计算
      physicsPosition = this.calculateInclinePosition(
        objectState.inclineDistance || objectState.position.x,
        environment.theta || 30,
        config.ballRadius || 0.1
      );
    } else {
      // 其他阶段：直接使用物体位置
      physicsPosition = objectState.position;
    }

    // 转换为屏幕坐标
    const screenPosition = this.worldToScreen(physicsPosition);
    const ballRadiusPixels = (config.ballRadius || 0.1) * this.getCoordinateConfig().scale;

    // 绘制小球
    const colors = {
      '自由落体': '#FFD93D',
      '弹性碰撞': '#FF0000',
      '斜面滑动': '#4ECDC4',
      '静止': '#808080'
    };

    ctx.fillStyle = colors[objectState.phase as keyof typeof colors] || '#FFD93D';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenPosition.x, screenPosition.y, ballRadiusPixels, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * 3D WebGL渲染策略
 */
export class WebGL3DRenderingStrategy extends BaseRenderingStrategy {
  // 3D渲染的具体实现
  // （保留原有3D渲染逻辑，但使用统一坐标系统）
}

/**
 * 渲染策略工厂
 */
export class RenderingStrategyFactory {
  /**
   * 创建渲染策略
   */
  static createStrategy(
    type: '2d_canvas' | '3d_webgl',
    physicsParams: any,
    calculationResults: any,
    screenConfig: { width: number; height: number }
  ): BaseRenderingStrategy {
    switch (type) {
      case '2d_canvas':
        const strategy2D = new Canvas2DRenderingStrategy();
        strategy2D.optimizeRenderConfig(physicsParams, calculationResults, screenConfig);
        return strategy2D;
      
      case '3d_webgl':
        const strategy3D = new WebGL3DRenderingStrategy();
        strategy3D.optimizeRenderConfig(physicsParams, calculationResults, screenConfig);
        return strategy3D;
      
      default:
        throw new Error(`未支持的渲染策略: ${type}`);
    }
  }
}

/**
 * 几何一致性保证装饰器
 */
export function ensureGeometryConsistency(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    // 在渲染前验证几何一致性
    if (this.coordinateSystem && typeof this.validateGeometry === 'function') {
      const validation = this.validateGeometry(args[0], args[1]);
      if (!validation.valid) {
        console.warn('⚠️ 几何一致性警告:', validation.issues.join('; '));
      }
    }
    
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}
