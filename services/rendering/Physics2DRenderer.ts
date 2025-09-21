// services/rendering/Physics2DRenderer.ts
// 2D物理渲染器：确保几何一致性和物理准确性

import { UnifiedCoordinateSystem, InclineDefinition, PhysicsPoint, ScreenPoint } from './CoordinateSystem';

/**
 * 2D渲染配置
 */
export interface Physics2DRenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor: string;
  showVectors: boolean;
  showAnnotations: boolean;
  showTrajectory: boolean;
  ballRadius: number;      // 物理半径（米）
  vectorScale: number;     // 矢量显示比例
}

/**
 * 物体状态
 */
export interface ObjectState {
  position: PhysicsPoint;
  velocity: PhysicsPoint;
  acceleration?: PhysicsPoint;
  mass?: number;
  phase: string;
  inclineDistance?: number; // 沿斜面的距离
}

/**
 * 环境定义
 */
export interface Environment {
  inclines: InclineDefinition[];
  gravity: PhysicsPoint;
  surfaces: Array<{
    id: string;
    type: 'ground' | 'wall' | 'incline';
    points: PhysicsPoint[];
    color: string;
  }>;
}

/**
 * 2D物理渲染器
 */
export class Physics2DRenderer {
  private coordinateSystem: UnifiedCoordinateSystem;
  private canvas: any;
  private ctx: any;

  constructor(coordinateConfig?: Partial<any>) {
    this.coordinateSystem = new UnifiedCoordinateSystem(coordinateConfig);
  }

  /**
   * 渲染单帧物理场景
   */
  async renderFrame(
    objectStates: ObjectState[],
    environment: Environment,
    config: Physics2DRenderConfig,
    outputPath: string
  ): Promise<void> {
    // 动态导入canvas（支持Node.js环境）
    const { createCanvas } = await import('canvas');
    
    this.canvas = createCanvas(config.width, config.height);
    this.ctx = this.canvas.getContext('2d');

    // 1. 绘制背景
    this.renderBackground(config);

    // 2. 绘制环境（地面、斜面等）
    this.renderEnvironment(environment, config);

    // 3. 绘制物体
    for (const objectState of objectStates) {
      this.renderObject(objectState, environment, config);
    }

    // 4. 绘制矢量（如果启用）
    if (config.showVectors) {
      for (const objectState of objectStates) {
        this.renderVectors(objectState, config);
      }
    }

    // 5. 绘制注释（如果启用）
    if (config.showAnnotations) {
      this.renderAnnotations(objectStates, environment, config);
    }

    // 6. 保存帧
    await this.saveFrame(outputPath);
  }

  /**
   * 渲染背景
   */
  private renderBackground(config: Physics2DRenderConfig): void {
    this.ctx.fillStyle = config.backgroundColor;
    this.ctx.fillRect(0, 0, config.width, config.height);
  }

  /**
   * 渲染环境（地面、斜面等）
   */
  private renderEnvironment(environment: Environment, config: Physics2DRenderConfig): void {
    // 渲染地面
    const groundY = this.coordinateSystem.worldToScreen({ x: 0, y: 0 }).y;
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, groundY, config.width, config.height - groundY);

    // 渲染斜面
    for (const incline of environment.inclines) {
      this.renderIncline(incline, config);
    }

    // 渲染其他表面
    for (const surface of environment.surfaces) {
      this.renderSurface(surface);
    }
  }

  /**
   * 渲染斜面（核心方法）
   */
  private renderIncline(incline: InclineDefinition, config: Physics2DRenderConfig): void {
    const screenPoints = this.coordinateSystem.calculateInclineScreenPoints(incline);
    
    // 绘制斜面线条
    this.ctx.strokeStyle = '#696969';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(screenPoints.start.x, screenPoints.start.y);
    this.ctx.lineTo(screenPoints.end.x, screenPoints.end.y);
    this.ctx.stroke();

    // 绘制角度标注
    this.ctx.fillStyle = '#000';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    const labelX = screenPoints.start.x + 80;
    const labelY = screenPoints.start.y - 20;
    this.ctx.fillText(`θ=${incline.angle}°`, labelX, labelY);
  }

  /**
   * 渲染物体（确保贴合斜面）
   */
  private renderObject(
    objectState: ObjectState, 
    environment: Environment, 
    config: Physics2DRenderConfig
  ): void {
    let physicsPosition: PhysicsPoint;

    // 根据物体状态确定物理位置
    if (objectState.phase === '斜面滑动' || objectState.phase === '静止') {
      // 斜面运动：使用斜面坐标系统
      const incline = environment.inclines[0]; // 假设第一个斜面
      if (incline && objectState.inclineDistance !== undefined) {
        // 计算小球在斜面上的精确位置（考虑半径）
        physicsPosition = this.coordinateSystem.calculateInclinePoint(
          objectState.inclineDistance,
          incline,
          config.ballRadius // 物理半径
        );
      } else {
        physicsPosition = objectState.position;
      }
    } else {
      // 其他阶段：直接使用物体位置
      physicsPosition = objectState.position;
    }

    // 转换为屏幕坐标
    const screenPosition = this.coordinateSystem.worldToScreen(physicsPosition);

    // 绘制小球
    const ballRadiusPixels = config.ballRadius * this.coordinateSystem.getConfig().scale;
    
    // 根据阶段设置颜色
    const colors = {
      '自由落体': '#FFD93D',
      '弹性碰撞': '#FF0000', 
      '斜面滑动': '#4ECDC4',
      '静止': '#808080'
    };
    
    this.ctx.fillStyle = colors[objectState.phase as keyof typeof colors] || '#FFD93D';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(screenPosition.x, screenPosition.y, ballRadiusPixels, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * 渲染矢量
   */
  private renderVectors(objectState: ObjectState, config: Physics2DRenderConfig): void {
    const screenPosition = this.coordinateSystem.worldToScreen(objectState.position);
    const speed = Math.sqrt(objectState.velocity.x**2 + objectState.velocity.y**2);
    
    if (speed > 0.1) {
      // 速度矢量
      const velocityEnd = {
        x: objectState.position.x + objectState.velocity.x * config.vectorScale,
        y: objectState.position.y + objectState.velocity.y * config.vectorScale
      };
      const velocityScreenEnd = this.coordinateSystem.worldToScreen(velocityEnd);
      
      this.drawArrow(
        this.ctx,
        screenPosition.x, screenPosition.y,
        velocityScreenEnd.x, velocityScreenEnd.y,
        '#FF0000', 3
      );
    }

    // 重力矢量（始终向下）
    if (objectState.acceleration) {
      const gravityEnd = {
        x: objectState.position.x,
        y: objectState.position.y + objectState.acceleration.y * config.vectorScale
      };
      const gravityScreenEnd = this.coordinateSystem.worldToScreen(gravityEnd);
      
      this.drawArrow(
        this.ctx,
        screenPosition.x, screenPosition.y,
        gravityScreenEnd.x, gravityScreenEnd.y,
        '#0000FF', 2
      );
    }
  }

  /**
   * 渲染注释
   */
  private renderAnnotations(
    objectStates: ObjectState[],
    environment: Environment,
    config: Physics2DRenderConfig
  ): void {
    if (objectStates.length === 0) return;
    
    const mainObject = objectStates[0];
    const speed = Math.sqrt(mainObject.velocity.x**2 + mainObject.velocity.y**2);
    
    // 阶段标签
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(mainObject.phase, 20, 50);
    
    // 物理参数
    this.ctx.font = '16px Arial';
    const annotations = [
      `位置: (${mainObject.position.x.toFixed(2)}, ${mainObject.position.y.toFixed(2)})m`,
      `速度: ${speed.toFixed(2)}m/s`,
      `质量: ${mainObject.mass || 2}kg`
    ];
    
    if (mainObject.inclineDistance !== undefined) {
      annotations.push(`沿斜面距离: ${mainObject.inclineDistance.toFixed(2)}m`);
    }
    
    annotations.forEach((annotation, index) => {
      this.ctx.fillText(annotation, 20, 90 + index * 25);
    });
  }

  /**
   * 渲染表面
   */
  private renderSurface(surface: any): void {
    if (surface.points.length < 2) return;
    
    this.ctx.strokeStyle = surface.color || '#888';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    
    const firstPoint = this.coordinateSystem.worldToScreen(surface.points[0]);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < surface.points.length; i++) {
      const point = this.coordinateSystem.worldToScreen(surface.points[i]);
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.stroke();
  }

  /**
   * 绘制箭头
   */
  private drawArrow(
    ctx: any,
    fromX: number, fromY: number,
    toX: number, toY: number,
    color: string, lineWidth: number = 2
  ): void {
    const headlen = 12;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    
    // 箭头线
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // 箭头头部
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * 保存帧
   */
  private async saveFrame(outputPath: string): Promise<void> {
    const fs = await import('fs');
    const buffer = this.canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
  }

  /**
   * 创建标准斜面定义
   */
  static createStandardIncline(
    angle: number,
    maxDistance: number,
    startPoint: PhysicsPoint = { x: 0, y: 0 },
    mu_k: number = 0.2
  ): InclineDefinition {
    return {
      angle: angle,
      length: maxDistance * 1.2, // 增加20%余量
      startPoint: startPoint,
      mu_k: mu_k
    };
  }

  /**
   * 创建标准环境
   */
  static createStandardEnvironment(
    inclineAngle: number,
    maxDistance: number,
    mu_k: number = 0.2
  ): Environment {
    const incline = Physics2DRenderer.createStandardIncline(inclineAngle, maxDistance, { x: 0, y: 0 }, mu_k);
    
    return {
      inclines: [incline],
      gravity: { x: 0, y: -9.8 },
      surfaces: [
        {
          id: 'ground',
          type: 'ground',
          points: [{ x: -10, y: 0 }, { x: 10, y: 0 }],
          color: '#8B4513'
        }
      ]
    };
  }
}

/**
 * 默认2D渲染器实例
 */
export const defaultPhysics2DRenderer = new Physics2DRenderer();
