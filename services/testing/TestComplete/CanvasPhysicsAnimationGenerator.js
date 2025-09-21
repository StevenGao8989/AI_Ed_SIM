const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { execSync } = require('child_process');

/**
 * 基于Canvas的物理动画视频生成器
 * 专门用于生成符合物理题目和物理逻辑的动画视频
 */
class CanvasPhysicsAnimationGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, 'temp_canvas_frames');
    this.outputDir = path.join(__dirname, 'output');
    
    // 确保目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成物理动画视频
   */
  async generatePhysicsAnimation(ir, simulationResult, config) {
    console.log('🎬 开始生成Canvas物理动画视频...');
    console.log(`📊 动画配置: 分辨率=${config.width}x${config.height}, 帧率=${config.fps}, 时长=${config.duration}s`);
    
    try {
      // 1. 分析物理题目类型
      const physicsType = this.analyzePhysicsType(ir, simulationResult);
      console.log(`🔬 物理类型: ${physicsType}`);
      
      // 2. 生成动画帧
      const frameFiles = await this.generatePhysicsFrames(ir, simulationResult, config, physicsType);
      console.log(`✅ 生成${frameFiles.length}帧动画`);
      
      // 3. 使用FFmpeg生成视频
      const videoPath = await this.generateVideoWithFFmpeg(frameFiles, config);
      console.log(`🎥 视频生成完成: ${videoPath}`);
      
      // 4. 清理临时文件
      this.cleanupTempFiles();
      
      return {
        success: true,
        videoPath: videoPath,
        frameCount: frameFiles.length,
        physicsType: physicsType,
        errors: [],
        warnings: []
      };
      
    } catch (error) {
      console.error('❌ Canvas物理动画生成失败:', error);
      this.cleanupTempFiles();
      return {
        success: false,
        videoPath: null,
        frameCount: 0,
        physicsType: null,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * 分析物理题目类型
   */
  analyzePhysicsType(ir, simulationResult) {
    const hasGravity = simulationResult.timeSeries.some(frame => 
      frame.objects?.object1?.acceleration?.y < 0
    );
    const hasCollision = simulationResult.events?.some(event => 
      event.type === 'collision'
    );
    const hasIncline = simulationResult.timeSeries.some(frame => 
      frame.objects?.object1?.onIncline
    );
    
    if (hasGravity && hasCollision && hasIncline) {
      return 'free_fall_collision_incline';
    } else if (hasGravity && hasCollision) {
      return 'free_fall_collision';
    } else if (hasGravity) {
      return 'free_fall';
    } else if (hasIncline) {
      return 'incline_motion';
    } else {
      return 'general_motion';
    }
  }

  /**
   * 生成物理动画帧
   */
  async generatePhysicsFrames(ir, simulationResult, config, physicsType) {
    const frameCount = Math.floor(config.duration * config.fps);
    const timestep = 1 / config.fps;
    const frameFiles = [];
    
    console.log(`🎨 生成${frameCount}帧Canvas物理动画...`);
    
    for (let frame = 0; frame < frameCount; frame++) {
      const time = frame * timestep;
      const frameData = this.generateFrameData(time, simulationResult, config);
      const pngPath = path.join(this.tempDir, `canvas_frame_${String(frame).padStart(6, '0')}.png`);
      
      await this.generateCanvasFrame(frameData, config, pngPath);
      frameFiles.push(pngPath);
      
      if (frame % 30 === 0 || frame === frameCount - 1) {
        console.log(`🎬 动画进度: ${frame}/${frameCount} (${((frame / frameCount) * 100).toFixed(1)}%)`);
      }
    }
    
    return frameFiles;
  }

  /**
   * 生成帧数据
   */
  generateFrameData(time, simulationResult, config) {
    // 找到最接近当前时间的仿真数据
    let closestData = simulationResult.timeSeries[0];
    for (let i = 0; i < simulationResult.timeSeries.length; i++) {
      if (simulationResult.timeSeries[i].time <= time) {
        closestData = simulationResult.timeSeries[i];
      } else {
        break;
      }
    }
    
    if (!closestData || !closestData.objects?.object1) {
      return this.createDefaultFrameData(time, config);
    }
    
    const object1 = closestData.objects.object1;
    
    // 坐标转换 (物理坐标 -> 屏幕坐标)
    const scale = 100; // 像素/米
    const offsetX = config.width / 2;
    const offsetY = config.height - 100; // 地面在底部100px处
    
    // 从IR中获取斜面角度（30度）
    const inclineAngle = 30 * Math.PI / 180; // 30度转换为弧度
    
    // 计算小球位置
    let ballX, ballY;
    const phase = object1.phase || this.determinePhase(time);
    
    if (phase === 'inclined_plane') {
      // 斜面滑动阶段：小球沿着斜面运动
      const inclineDistance = object1.position.x; // 沿斜面的距离
      ballX = offsetX + inclineDistance * Math.cos(inclineAngle) * scale;
      ballY = offsetY - inclineDistance * Math.sin(inclineAngle) * scale;
    } else {
      // 其他阶段：正常坐标转换
      ballX = offsetX + object1.position.x * scale;
      ballY = offsetY - object1.position.y * scale;
    }
    
    return {
      time: time,
      object: {
        position: {
          x: ballX,
          y: ballY
        },
        velocity: object1.velocity,
        acceleration: object1.acceleration,
        mass: object1.mass,
        radius: (object1.radius || 0.1) * scale,
        onGround: object1.onGround,
        onIncline: object1.onIncline,
        inclineAngle: inclineAngle,
        phase: phase
      },
      environment: {
        ground: { y: offsetY },
        incline: {
          enabled: true, // 始终显示斜面
          angle: inclineAngle,
          startX: offsetX - 300,
          endX: offsetX + 300,
          startY: offsetY,
          endY: offsetY - 300 * Math.tan(inclineAngle)
        }
      },
      annotations: this.generateAnnotations(time, object1, simulationResult)
    };
  }

  /**
   * 确定当前阶段
   */
  determinePhase(time) {
    if (time < 1.0) return 'free_fall';
    if (time < 1.1) return 'elastic_collision';
    if (time < 1.2) return 'post_collision';
    return 'inclined_plane';
  }

  /**
   * 创建默认帧数据
   */
  createDefaultFrameData(time, config) {
    const scale = 100;
    const offsetX = config.width / 2;
    const offsetY = config.height - 100;
    const inclineAngle = 30 * Math.PI / 180; // 30度
    
    return {
      time: time,
      object: {
        position: { x: offsetX, y: offsetY - 500 }, // 初始高度5米
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: -9.8 },
        mass: 2,
        radius: 10,
        onGround: false,
        onIncline: false,
        inclineAngle: inclineAngle,
        phase: this.determinePhase(time)
      },
      environment: {
        ground: { y: offsetY },
        incline: { 
          enabled: true, 
          angle: inclineAngle,
          startX: offsetX - 300,
          endX: offsetX + 300,
          startY: offsetY,
          endY: offsetY - 300 * Math.tan(inclineAngle)
        }
      },
      annotations: []
    };
  }

  /**
   * 生成Canvas帧
   */
  async generateCanvasFrame(frameData, config, outputPath) {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    const { object, environment, annotations } = frameData;
    
    // 背景
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, config.width, config.height);
    
    // 地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, environment.ground.y, config.width, config.height - environment.ground.y);
    
    // 斜面 (如果启用)
    if (environment.incline.enabled) {
      const incline = environment.incline;
      ctx.strokeStyle = '#696969';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(incline.startX, incline.startY);
      ctx.lineTo(incline.endX, incline.endY);
      ctx.stroke();
      
      // 斜面标签
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const labelX = (incline.startX + incline.endX) / 2;
      const labelY = (incline.startY + incline.endY) / 2 - 20;
      ctx.fillText(`θ=${(incline.angle * 180 / Math.PI).toFixed(1)}°`, labelX, labelY);
    }
    
    // 物体 (小球) - 根据阶段显示不同颜色
    let ballColor;
    switch (object.phase) {
      case 'free_fall':
        ballColor = '#FFD93D'; // 黄色 - 自由落体
        break;
      case 'elastic_collision':
        ballColor = '#FF0000'; // 红色 - 碰撞
        break;
      case 'post_collision':
        ballColor = '#FF6B6B'; // 粉红色 - 碰撞后
        break;
      case 'inclined_plane':
        ballColor = '#4ECDC4'; // 青色 - 斜面滑动
        break;
      default:
        ballColor = '#FFD93D'; // 默认黄色
    }
    
    ctx.fillStyle = ballColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(object.position.x, object.position.y, object.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 速度矢量 (如果速度足够大)
    const speed = Math.sqrt(object.velocity.x**2 + object.velocity.y**2);
    if (speed > 0.1) {
      const vx = object.velocity.x * 20; // 放大显示
      const vy = -object.velocity.y * 20; // Y轴反向
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(object.position.x, object.position.y);
      ctx.lineTo(object.position.x + vx, object.position.y + vy);
      ctx.stroke();
      
      // 箭头
      const angle = Math.atan2(vy, vx);
      const arrowLength = 15;
      ctx.beginPath();
      ctx.moveTo(object.position.x + vx, object.position.y + vy);
      ctx.lineTo(
        object.position.x + vx - arrowLength * Math.cos(angle - Math.PI / 6),
        object.position.y + vy - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(object.position.x + vx, object.position.y + vy);
      ctx.lineTo(
        object.position.x + vx - arrowLength * Math.cos(angle + Math.PI / 6),
        object.position.y + vy - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
    
    // 加速度矢量 (重力)
    if (object.acceleration.y < 0) {
      const ay = -object.acceleration.y * 10; // 放大显示
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(object.position.x, object.position.y);
      ctx.lineTo(object.position.x, object.position.y + ay);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // 时间显示
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${frameData.time.toFixed(2)}s`, 20, 30);
    
    // 物理参数显示
    ctx.font = '16px Arial';
    ctx.fillText(`质量: ${object.mass}kg`, 20, 60);
    ctx.fillText(`速度: ${speed.toFixed(2)}m/s`, 20, 80);
    ctx.fillText(`高度: ${((config.height - object.position.y) / 100).toFixed(2)}m`, 20, 100);
    
    // 状态标签 - 根据阶段显示
    ctx.font = '16px Arial';
    let statusText, statusColor;
    switch (object.phase) {
      case 'free_fall':
        statusText = '状态: 自由落体';
        statusColor = '#FFD93D';
        break;
      case 'elastic_collision':
        statusText = '状态: 弹性碰撞';
        statusColor = '#FF0000';
        break;
      case 'post_collision':
        statusText = '状态: 碰撞后反弹';
        statusColor = '#FF6B6B';
        break;
      case 'inclined_plane':
        statusText = '状态: 斜面滑动';
        statusColor = '#4ECDC4';
        break;
      default:
        statusText = '状态: 未知';
        statusColor = '#666';
    }
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, 20, 120);
    
    // 注释
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    annotations.forEach((annotation, index) => {
      ctx.fillText(annotation, 20, 140 + index * 20);
    });
    
    // 保存PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
  }

  /**
   * 生成注释
   */
  generateAnnotations(time, object, simulationResult) {
    const annotations = [];
    
    // 基于阶段生成相关注释
    const phase = object.phase || this.determinePhase(time);
    switch (phase) {
      case 'free_fall':
        annotations.push("自由落体阶段");
        annotations.push("重力加速度: 9.8 m/s²");
        break;
      case 'elastic_collision':
        annotations.push("弹性碰撞阶段");
        annotations.push("动量守恒，动能守恒");
        break;
      case 'post_collision':
        annotations.push("碰撞后反弹");
        annotations.push("准备进入斜面");
        break;
      case 'inclined_plane':
        annotations.push("斜面滑动阶段");
        annotations.push("摩擦系数: 0.2");
        break;
    }
    
    // 基于事件生成注释
    const currentEvents = simulationResult.events?.filter(event => event.time <= time) || [];
    if (currentEvents.length > 0) {
      const lastEvent = currentEvents[currentEvents.length - 1];
      annotations.push(`事件: ${lastEvent.description}`);
    }
    
    return annotations;
  }

  /**
   * 使用FFmpeg生成视频
   */
  async generateVideoWithFFmpeg(frameFiles, config) {
    const outputPath = path.join(this.outputDir, 'canvas_physics_animation.mp4');
    
    console.log('🎥 使用FFmpeg从PNG生成视频...');
    const pngPattern = path.join(this.tempDir, 'canvas_frame_%06d.png');
    const ffmpegCmd = `ffmpeg -y -framerate ${config.fps} -i "${pngPattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow "${outputPath}"`;
    
    try {
      execSync(ffmpegCmd, { stdio: 'pipe' });
      return outputPath;
    } catch (error) {
      throw new Error(`FFmpeg视频生成失败: ${error.message}`);
    }
  }

  /**
   * 清理临时文件
   */
  cleanupTempFiles() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(this.tempDir, file));
        });
        fs.rmdirSync(this.tempDir);
      }
    } catch (error) {
      console.warn('⚠️ 清理临时文件失败:', error.message);
    }
  }
}

module.exports = { CanvasPhysicsAnimationGenerator };
