/**
 * 视频生成器 - 将Matter.js仿真数据渲染为视频
 * 
 * 功能：
 * 1. 使用Canvas绘制每一帧
 * 2. 支持多种渲染效果
 * 3. 导出为MP4视频
 * 4. 支持服务器环境
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');

class VideoGenerator {
  constructor(options = {}) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.fps = options.fps || 60;
    this.outputDir = options.outputDir || path.join(__dirname, 'video_output');
    this.quality = options.quality || 'high'; // high, medium, low
    
    // 渲染配置
    this.renderOptions = {
      backgroundColor: options.backgroundColor || '#ffffff',
      showTrajectories: options.showTrajectories || false,
      showForces: options.showForces || false,
      showMetrics: options.showMetrics || false,
      showGrid: options.showGrid || false,
      showBounds: options.showBounds || false,
      ...options
    };
    
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 从仿真数据生成视频
   */
  async generateVideo(simulationData, options = {}) {
    try {
      const frames = simulationData.frames;
      
      if (!frames || frames.length === 0) {
        throw new Error('仿真数据中没有帧');
      }

      // 如果没有config，生成默认配置
      const config = simulationData.config || this.generateDefaultConfig(frames);

      console.log(`🎬 开始生成视频: ${frames.length}帧, ${this.fps}fps`);

      // 计算世界边界
      const bounds = this.calculateWorldBounds(frames);
      
      // 计算相机参数
      const camera = this.calculateCamera(bounds);
      
      // 生成帧图像
      const frameImages = await this.generateFrameImages(frames, config, camera, bounds);
      
      // 合成视频
      const videoPath = await this.composeVideo(frameImages, options);
      
      // 清理临时文件
      this.cleanupTempFiles(frameImages);
      
      console.log(`✅ 视频生成完成: ${videoPath}`);
      
      return {
        success: true,
        videoPath,
        stats: {
          totalFrames: frames.length,
          duration: frames.length / this.fps,
          resolution: `${this.width}x${this.height}`,
          fps: this.fps
        }
      };

    } catch (error) {
      console.error('❌ 视频生成失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 计算世界边界
   */
  calculateWorldBounds(frames) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    frames.forEach(frame => {
      frame.bodies.forEach(body => {
        const [x, y] = body.position;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });

    // 添加边距
    const margin = Math.max((maxX - minX), (maxY - minY)) * 0.1;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }

  /**
   * 计算相机参数
   */
  calculateCamera(bounds) {
    const scaleX = this.width / bounds.width;
    const scaleY = this.height / bounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 留10%边距
    
    return {
      scale,
      offsetX: (this.width - bounds.width * scale) / 2 - bounds.minX * scale,
      offsetY: (this.height - bounds.height * scale) / 2 - bounds.minY * scale
    };
  }

  /**
   * 生成帧图像
   */
  async generateFrameImages(frames, config, camera, bounds) {
    const frameImages = [];
    const tempDir = path.join(this.outputDir, 'temp_frames');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const canvas = createCanvas(this.width, this.height);
      const ctx = canvas.getContext('2d');
      
      // 绘制背景
      this.drawBackground(ctx);
      
      // 绘制网格（可选）
      if (this.renderOptions.showGrid) {
        this.drawGrid(ctx, camera, bounds);
      }
      
      // 绘制边界（可选）
      if (this.renderOptions.showBounds) {
        this.drawBounds(ctx, camera, bounds);
      }
      
      // 绘制物体
      this.drawBodies(ctx, frame.bodies, config, camera);
      
      // 绘制轨迹（可选）
      if (this.renderOptions.showTrajectories) {
        this.drawTrajectories(ctx, frames.slice(0, i + 1), camera);
      }
      
      // 绘制力向量（可选）
      if (this.renderOptions.showForces) {
        this.drawForces(ctx, frame.bodies, camera);
      }
      
      // 绘制指标（可选）
      if (this.renderOptions.showMetrics) {
        this.drawMetrics(ctx, frame, i, frames.length);
      }
      
      // 保存帧图像
      const framePath = path.join(tempDir, `frame_${i.toString().padStart(6, '0')}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      
      frameImages.push(framePath);
      
      // 显示进度
      if (i % 100 === 0) {
        console.log(`   📸 生成帧: ${i + 1}/${frames.length}`);
      }
    }

    return frameImages;
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx) {
    ctx.fillStyle = this.renderOptions.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制网格
   */
  drawGrid(ctx, camera, bounds) {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    const gridSize = 50; // 网格大小
    const startX = Math.floor(bounds.minX / gridSize) * gridSize;
    const startY = Math.floor(bounds.minY / gridSize) * gridSize;
    
    // 垂直线
    for (let x = startX; x <= bounds.maxX; x += gridSize) {
      const screenX = x * camera.scale + camera.offsetX;
      if (screenX >= 0 && screenX <= this.width) {
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, this.height);
        ctx.stroke();
      }
    }
    
    // 水平线
    for (let y = startY; y <= bounds.maxY; y += gridSize) {
      const screenY = y * camera.scale + camera.offsetY;
      if (screenY >= 0 && screenY <= this.height) {
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(this.width, screenY);
        ctx.stroke();
      }
    }
  }

  /**
   * 绘制边界
   */
  drawBounds(ctx, camera, bounds) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const x = bounds.minX * camera.scale + camera.offsetX;
    const y = bounds.minY * camera.scale + camera.offsetY;
    const w = bounds.width * camera.scale;
    const h = bounds.height * camera.scale;
    
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  /**
   * 绘制物体
   */
  drawBodies(ctx, bodies, config, camera) {
    bodies.forEach(body => {
      const [x, y] = body.position;
      const screenX = x * camera.scale + camera.offsetX;
      const screenY = y * camera.scale + camera.offsetY;
      
      // 获取物体配置
      const bodyConfig = config.bodies[body.id];
      if (!bodyConfig) return;
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(body.angle);
      
      // 设置样式
      ctx.fillStyle = bodyConfig.style.color;
      ctx.globalAlpha = bodyConfig.style.opacity;
      ctx.strokeStyle = bodyConfig.style.stroke;
      ctx.lineWidth = bodyConfig.style.strokeWidth;
      
      // 绘制形状
      switch (bodyConfig.type) {
        case 'ball':
          this.drawCircle(ctx, 0, 0, bodyConfig.radius || 10);
          break;
        case 'box':
          this.drawRectangle(ctx, 0, 0, bodyConfig.width || 20, bodyConfig.height || 20);
          break;
        case 'ramp':
          this.drawRamp(ctx, 0, 0, bodyConfig.width || 100, bodyConfig.height || 50);
          break;
        default:
          this.drawCircle(ctx, 0, 0, 10);
      }
      
      ctx.restore();
    });
  }

  /**
   * 绘制圆形
   */
  drawCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 绘制矩形
   */
  drawRectangle(ctx, x, y, width, height) {
    ctx.fillRect(x - width/2, y - height/2, width, height);
    ctx.strokeRect(x - width/2, y - height/2, width, height);
  }

  /**
   * 绘制斜坡
   */
  drawRamp(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x - width/2, y + height/2);
    ctx.lineTo(x + width/2, y - height/2);
    ctx.lineTo(x + width/2, y + height/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 绘制轨迹
   */
  drawTrajectories(ctx, frames, camera) {
    const trajectories = {};
    
    // 收集轨迹点
    frames.forEach(frame => {
      frame.bodies.forEach(body => {
        if (!trajectories[body.id]) {
          trajectories[body.id] = [];
        }
        const [x, y] = body.position;
        trajectories[body.id].push({
          x: x * camera.scale + camera.offsetX,
          y: y * camera.scale + camera.offsetY
        });
      });
    });
    
    // 绘制轨迹
    Object.keys(trajectories).forEach(bodyId => {
      const points = trajectories[bodyId];
      if (points.length < 2) return;
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    });
    
    ctx.setLineDash([]);
  }

  /**
   * 绘制力向量
   */
  drawForces(ctx, bodies, camera) {
    bodies.forEach(body => {
      const [x, y] = body.position;
      const [vx, vy] = body.velocity;
      const screenX = x * camera.scale + camera.offsetX;
      const screenY = y * camera.scale + camera.offsetY;
      
      // 绘制速度向量
      const scale = 10; // 向量缩放
      const endX = screenX + vx * scale;
      const endY = screenY + vy * scale;
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // 绘制箭头
      const angle = Math.atan2(vy, vx);
      const arrowLength = 8;
      const arrowAngle = Math.PI / 6;
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - arrowAngle),
        endY - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + arrowAngle),
        endY - arrowLength * Math.sin(angle + arrowAngle)
      );
      ctx.stroke();
    });
  }

  /**
   * 绘制指标
   */
  drawMetrics(ctx, frame, frameIndex, totalFrames) {
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    
    const time = frame.timestamp.toFixed(2);
    const progress = ((frameIndex + 1) / totalFrames * 100).toFixed(1);
    
    ctx.fillText(`Time: ${time}s`, 20, 30);
    ctx.fillText(`Frame: ${frameIndex + 1}/${totalFrames}`, 20, 50);
    ctx.fillText(`Progress: ${progress}%`, 20, 70);
  }

  /**
   * 合成视频
   */
  async composeVideo(frameImages, options = {}) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.outputDir, options.filename || 'simulation_video.mp4');
      
      // 设置视频质量
      const qualitySettings = this.getQualitySettings();
      
      ffmpeg()
        .input(path.join(this.outputDir, 'temp_frames', 'frame_%06d.png'))
        .inputFPS(this.fps)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', qualitySettings.preset,
          '-crf', qualitySettings.crf,
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎬 开始视频合成...');
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`   📹 合成进度: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ 视频合成完成');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ 视频合成失败:', err.message);
          reject(err);
        })
        .run();
    });
  }

  /**
   * 获取质量设置
   */
  getQualitySettings() {
    const settings = {
      high: { preset: 'slow', crf: '18' },
      medium: { preset: 'medium', crf: '23' },
      low: { preset: 'fast', crf: '28' }
    };
    
    return settings[this.quality] || settings.medium;
  }

  /**
   * 清理临时文件
   */
  cleanupTempFiles(frameImages) {
    const tempDir = path.join(this.outputDir, 'temp_frames');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * 生成默认配置
   */
  generateDefaultConfig(frames) {
    const firstFrame = frames[0];
    const bodies = firstFrame.bodies;
    
    const bodyConfigs = {};
    bodies.forEach(body => {
      bodyConfigs[body.id] = {
        type: this.detectBodyType(body.id),
        style: this.generateBodyStyle(body.id),
        radius: 10,
        width: 20,
        height: 20
      };
    });
    
    return {
      bodies: bodyConfigs
    };
  }

  /**
   * 检测物体类型
   */
  detectBodyType(bodyId) {
    const id = bodyId.toLowerCase();
    
    if (id.includes('ground') || id.includes('floor')) {
      return 'ground';
    } else if (id.includes('wall')) {
      return 'wall';
    } else if (id.includes('ramp') || id.includes('slope')) {
      return 'ramp';
    } else if (id.includes('ball') || id.includes('sphere')) {
      return 'ball';
    } else if (id.includes('box') || id.includes('cube')) {
      return 'box';
    } else {
      return 'object';
    }
  }

  /**
   * 生成物体样式
   */
  generateBodyStyle(bodyId) {
    const type = this.detectBodyType(bodyId);
    
    const styles = {
      ground: {
        color: '#8B4513',
        opacity: 1.0,
        stroke: '#654321',
        strokeWidth: 2
      },
      wall: {
        color: '#696969',
        opacity: 1.0,
        stroke: '#2F4F4F',
        strokeWidth: 2
      },
      ramp: {
        color: '#CD853F',
        opacity: 1.0,
        stroke: '#8B4513',
        strokeWidth: 2
      },
      ball: {
        color: '#FF6B6B',
        opacity: 0.8,
        stroke: '#FF5252',
        strokeWidth: 1
      },
      box: {
        color: '#4ECDC4',
        opacity: 0.8,
        stroke: '#26A69A',
        strokeWidth: 1
      },
      object: {
        color: '#95E1D3',
        opacity: 0.8,
        stroke: '#4DB6AC',
        strokeWidth: 1
      }
    };

    return styles[type] || styles.object;
  }

  /**
   * 从文件生成视频
   */
  async generateVideoFromFile(filePath, options = {}) {
    try {
      const simulationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return await this.generateVideo(simulationData, options);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = VideoGenerator;
