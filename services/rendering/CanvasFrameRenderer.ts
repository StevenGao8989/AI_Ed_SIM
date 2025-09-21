// services/rendering/CanvasFrameRenderer.ts
// Canvas帧渲染器：世界坐标→屏幕坐标、图元绘制、叠加层

import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import type { ResampledFrame } from './FrameResampler';
import type { RenderConfig } from './RenderCfgBuilder';

/**
 * 渲染结果
 */
export interface RenderResult {
  frameIndex: number;
  filePath: string;
  renderTime: number;
  size: { width: number; height: number };
}

/**
 * 图元渲染器接口
 */
interface PrimitiveRenderer {
  drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, style: any): void;
  drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, angle: number, style: any): void;
  drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, style: any): void;
  drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, style: any): void;
}

/**
 * Canvas帧渲染器
 */
export class CanvasFrameRenderer implements PrimitiveRenderer {
  private config: RenderConfig;
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(config: RenderConfig) {
    this.config = config;
    this.canvas = createCanvas(config.width, config.height);
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * 渲染帧序列到PNG文件
   */
  async renderFrames(
    frames: ResampledFrame[],
    outputDir: string,
    filenamePattern: string = 'frame_%06d.png'
  ): Promise<RenderResult[]> {
    console.log('🎨 开始Canvas帧渲染...');
    console.log(`📊 帧数: ${frames.length}, 输出目录: ${outputDir}`);
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results: RenderResult[] = [];
    const startTime = performance.now();
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameStartTime = performance.now();
      
      // 清空画布
      this.clearCanvas();
      
      // 渲染帧
      this.renderFrame(frame);
      
      // 保存到文件
      const filename = this.formatFilename(filenamePattern, i);
      const filePath = path.join(outputDir, filename);
      
      const buffer = this.canvas.toBuffer('image/png');
      fs.writeFileSync(filePath, buffer);
      
      const frameRenderTime = performance.now() - frameStartTime;
      
      results.push({
        frameIndex: i,
        filePath: filePath,
        renderTime: frameRenderTime,
        size: { width: this.config.width, height: this.config.height }
      });
      
      // 进度显示
      if (i % 10 === 0 || i === frames.length - 1) {
        const progress = ((i + 1) / frames.length * 100).toFixed(1);
        console.log(`🎬 渲染进度: ${progress}% (${i + 1}/${frames.length})`);
      }
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ 帧渲染完成，总耗时: ${totalTime.toFixed(2)}ms`);
    
    return results;
  }

  /**
   * 渲染单帧
   */
  private renderFrame(frame: ResampledFrame): void {
    // 1. 绘制背景
    this.drawBackground();
    
    // 2. 绘制网格（可选）
    if (this.config.style.gridEnabled) {
      this.drawGrid();
    }
    
    // 3. 绘制坐标轴（可选）
    if (this.config.style.axesEnabled) {
      this.drawAxes();
    }
    
    // 4. 绘制环境（表面）
    this.drawEnvironment();
    
    // 5. 绘制轨迹（可选）
    this.drawTrajectories(frame);
    
    // 6. 绘制物体
    this.drawBodies(frame);
    
    // 7. 绘制力和速度向量（可选）
    this.drawVectors(frame);
    
    // 8. 绘制事件高亮
    this.drawEventHighlights(frame);
    
    // 9. 绘制叠加层
    this.drawOverlays(frame);
  }

  /**
   * 清空画布
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
  }

  /**
   * 绘制背景
   */
  private drawBackground(): void {
    this.ctx.fillStyle = this.config.style.backgroundColor;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  /**
   * 绘制网格
   */
  private drawGrid(): void {
    const { scale, offsetX, offsetY } = this.config.coordinate;
    
    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    
    // 垂直网格线
    for (let x = 0; x < this.config.width; x += scale) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + offsetX % scale, 0);
      this.ctx.lineTo(x + offsetX % scale, this.config.height);
      this.ctx.stroke();
    }
    
    // 水平网格线
    for (let y = 0; y < this.config.height; y += scale) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + offsetY % scale);
      this.ctx.lineTo(this.config.width, y + offsetY % scale);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }

  /**
   * 绘制坐标轴
   */
  private drawAxes(): void {
    const { scale, offsetX, offsetY } = this.config.coordinate;
    
    this.ctx.strokeStyle = '#808080';
    this.ctx.lineWidth = 2;
    
    // X轴
    this.ctx.beginPath();
    this.ctx.moveTo(0, offsetY);
    this.ctx.lineTo(this.config.width, offsetY);
    this.ctx.stroke();
    
    // Y轴
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, 0);
    this.ctx.lineTo(offsetX, this.config.height);
    this.ctx.stroke();
    
    // 轴标签
    this.ctx.fillStyle = '#404040';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('X', this.config.width - 20, offsetY - 10);
    this.ctx.fillText('Y', offsetX + 10, 20);
  }

  /**
   * 绘制环境（表面）
   */
  private drawEnvironment(): void {
    for (const [surfaceId, surfaceStyle] of Object.entries(this.config.environment.surfaces)) {
      // 简化：绘制地面
      if (surfaceId === 'ground' || surfaceId.includes('ground')) {
        this.drawGround(surfaceStyle);
      } else if (surfaceId.includes('incline')) {
        this.drawIncline(surfaceStyle);
      }
    }
  }

  /**
   * 绘制地面
   */
  private drawGround(style: any): void {
    const { offsetY } = this.config.coordinate;
    
    this.ctx.fillStyle = style.color;
    this.ctx.fillRect(0, offsetY, this.config.width, this.config.height - offsetY);
    
    // 地面线
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, offsetY);
    this.ctx.lineTo(this.config.width, offsetY);
    this.ctx.stroke();
  }

  /**
   * 绘制斜面
   */
  private drawIncline(style: any): void {
    const { scale, offsetX, offsetY } = this.config.coordinate;
    
    // 简化：30度斜面
    const angle = Math.PI / 6; // 30度
    const startX = this.worldToScreenX(2);
    const startY = this.worldToScreenY(0);
    const length = 300; // 像素长度
    
    const endX = startX + length * Math.cos(angle);
    const endY = startY - length * Math.sin(angle);
    
    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // 斜面填充（可选）
    if (style.opacity > 0.1) {
      this.ctx.fillStyle = style.color + '40'; // 添加透明度
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.lineTo(endX, startY);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  /**
   * 绘制轨迹
   */
  private drawTrajectories(frame: ResampledFrame): void {
    // 简化实现：不绘制轨迹
    // 实际实现中可以维护历史位置并绘制轨迹线
  }

  /**
   * 绘制物体
   */
  private drawBodies(frame: ResampledFrame): void {
    for (const [bodyId, bodyState] of Object.entries(frame.bodies)) {
      const objectConfig = this.config.objects[bodyId];
      if (!objectConfig) continue;
      
      const screenX = this.worldToScreenX(bodyState.x);
      const screenY = this.worldToScreenY(bodyState.y);
      
      // 根据物体类型绘制
      this.drawBody(screenX, screenY, bodyState, objectConfig);
    }
  }

  /**
   * 绘制单个物体
   */
  private drawBody(x: number, y: number, state: any, style: any): void {
    // 简化：绘制为圆形
    const radius = 20; // 固定半径
    
    this.drawCircle(this.ctx, x, y, radius, {
      fillStyle: style.color,
      strokeStyle: '#000000',
      lineWidth: 2,
      opacity: style.opacity
    });
    
    // 绘制方向指示（可选）
    if (Math.abs(state.omega) > 0.1) {
      this.drawRotationIndicator(x, y, radius, state.theta);
    }
  }

  /**
   * 绘制旋转指示
   */
  private drawRotationIndicator(x: number, y: number, radius: number, angle: number): void {
    const arrowLength = radius * 0.8;
    const arrowX = x + arrowLength * Math.cos(angle);
    const arrowY = y + arrowLength * Math.sin(angle);
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(arrowX, arrowY);
    this.ctx.stroke();
  }

  /**
   * 绘制向量
   */
  private drawVectors(frame: ResampledFrame): void {
    for (const [bodyId, bodyState] of Object.entries(frame.bodies)) {
      const objectConfig = this.config.objects[bodyId];
      if (!objectConfig) continue;
      
      const screenX = this.worldToScreenX(bodyState.x);
      const screenY = this.worldToScreenY(bodyState.y);
      
      // 绘制速度向量
      if (objectConfig.showVelocity) {
        this.drawVelocityVector(screenX, screenY, bodyState);
      }
      
      // 绘制力向量
      if (objectConfig.showForces) {
        this.drawForceVectors(screenX, screenY, bodyState);
      }
    }
  }

  /**
   * 绘制速度向量
   */
  private drawVelocityVector(x: number, y: number, state: any): void {
    const scale = 10; // 速度缩放因子
    const vx = state.vx * scale;
    const vy = -state.vy * scale; // 屏幕坐标Y轴向下
    
    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      this.drawArrow(this.ctx, x, y, x + vx, y + vy, {
        strokeStyle: '#FF0000',
        lineWidth: 2,
        arrowSize: 8
      });
      
      // 速度标签
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '12px Arial';
      const speed = Math.sqrt(state.vx**2 + state.vy**2);
      this.ctx.fillText(`v=${speed.toFixed(1)}m/s`, x + vx + 5, y + vy - 5);
    }
  }

  /**
   * 绘制力向量
   */
  private drawForceVectors(x: number, y: number, state: any): void {
    // 简化：绘制重力
    const g = 9.8;
    const forceScale = 5;
    const forceY = g * forceScale;
    
    this.drawArrow(this.ctx, x, y, x, y + forceY, {
      strokeStyle: '#0000FF',
      lineWidth: 2,
      arrowSize: 6
    });
    
    // 力标签
    this.ctx.fillStyle = '#0000FF';
    this.ctx.font = '10px Arial';
    this.ctx.fillText('mg', x + 5, y + forceY + 15);
  }

  /**
   * 绘制事件高亮
   */
  private drawEventHighlights(frame: ResampledFrame): void {
    if (frame.events.length > 0) {
      // 绘制事件高亮效果
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([10, 5]);
      
      // 高亮边框
      this.ctx.strokeRect(5, 5, this.config.width - 10, this.config.height - 10);
      
      // 事件文本
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 16px Arial';
      const eventText = frame.events.map(e => e.id).join(', ');
      this.ctx.fillText(`事件: ${eventText}`, 20, 30);
      
      this.ctx.setLineDash([]);
    }
  }

  /**
   * 绘制叠加层
   */
  private drawOverlays(frame: ResampledFrame): void {
    // 时间显示
    if (this.config.overlays.showTime) {
      this.ctx.fillStyle = '#000000';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.fillText(`t = ${frame.time.toFixed(3)}s`, 20, this.config.height - 80);
    }
    
    // 能量显示
    if (this.config.overlays.showEnergy && frame.energy) {
      this.ctx.fillStyle = '#000000';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`动能: ${frame.energy.Ek.toFixed(2)}J`, 20, this.config.height - 60);
      this.ctx.fillText(`势能: ${frame.energy.Ep.toFixed(2)}J`, 20, this.config.height - 40);
      this.ctx.fillText(`机械能: ${frame.energy.Em.toFixed(2)}J`, 20, this.config.height - 20);
    }
    
    // 参数注释
    for (const annotation of this.config.overlays.annotations) {
      this.ctx.fillStyle = annotation.style.color || '#000000';
      this.ctx.font = annotation.style.font || '14px Arial';
      this.ctx.fillText(annotation.text, annotation.position[0], annotation.position[1]);
    }
  }

  /**
   * 世界坐标转屏幕坐标X
   */
  private worldToScreenX(worldX: number): number {
    return this.config.coordinate.offsetX + worldX * this.config.coordinate.scale;
  }

  /**
   * 世界坐标转屏幕坐标Y
   */
  private worldToScreenY(worldY: number): number {
    return this.config.coordinate.offsetY - worldY * this.config.coordinate.scale;
  }

  /**
   * 格式化文件名
   */
  private formatFilename(pattern: string, frameIndex: number): string {
    return pattern.replace('%06d', frameIndex.toString().padStart(6, '0'));
  }

  // 图元渲染方法实现

  /**
   * 绘制圆形
   */
  drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, style: any): void {
    ctx.save();
    
    if (style.opacity !== undefined) {
      ctx.globalAlpha = style.opacity;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    
    if (style.fillStyle) {
      ctx.fillStyle = style.fillStyle;
      ctx.fill();
    }
    
    if (style.strokeStyle) {
      ctx.strokeStyle = style.strokeStyle;
      ctx.lineWidth = style.lineWidth || 1;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * 绘制矩形
   */
  drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, angle: number, style: any): void {
    ctx.save();
    
    if (style.opacity !== undefined) {
      ctx.globalAlpha = style.opacity;
    }
    
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    if (style.fillStyle) {
      ctx.fillStyle = style.fillStyle;
      ctx.fillRect(-width/2, -height/2, width, height);
    }
    
    if (style.strokeStyle) {
      ctx.strokeStyle = style.strokeStyle;
      ctx.lineWidth = style.lineWidth || 1;
      ctx.strokeRect(-width/2, -height/2, width, height);
    }
    
    ctx.restore();
  }

  /**
   * 绘制直线
   */
  drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, style: any): void {
    ctx.save();
    
    if (style.strokeStyle) {
      ctx.strokeStyle = style.strokeStyle;
    }
    ctx.lineWidth = style.lineWidth || 1;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * 绘制箭头
   */
  drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, style: any): void {
    const arrowSize = style.arrowSize || 10;
    
    // 绘制线段
    this.drawLine(ctx, x1, y1, x2, y2, style);
    
    // 计算箭头角度
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // 绘制箭头头部
    ctx.save();
    ctx.strokeStyle = style.strokeStyle || '#000000';
    ctx.lineWidth = style.lineWidth || 1;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI/6), y2 - arrowSize * Math.sin(angle - Math.PI/6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI/6), y2 - arrowSize * Math.sin(angle + Math.PI/6));
    ctx.stroke();
    
    ctx.restore();
  }
}

/**
 * 便捷渲染函数
 */
export async function renderFrames(
  frames: ResampledFrame[],
  config: RenderConfig,
  outputDir: string,
  filenamePattern?: string
): Promise<RenderResult[]> {
  const renderer = new CanvasFrameRenderer(config);
  return await renderer.renderFrames(frames, outputDir, filenamePattern);
}

/**
 * 默认帧渲染器工厂
 */
export const canvasFrameRenderer = (config: RenderConfig) => new CanvasFrameRenderer(config);
