// 物理动画生成器：符合物理逻辑的动画视频生成
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PhysicsAnimationGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, 'temp_frames');
    this.outputDir = path.join(__dirname, 'output');
    
    // 确保目录存在
    [this.tempDir, this.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 生成符合物理逻辑的动画视频
   */
  async generatePhysicsVideo(ir, simulationResult, config) {
    console.log('🎬 开始生成符合物理逻辑的动画视频...');
    
    const duration = config.duration || 4.0;
    const fps = config.fps || 30;
    const frameCount = Math.floor(duration * fps);
    
    console.log(`📊 动画配置: ${config.width}x${config.height}, ${fps}fps, ${duration}s, ${frameCount}帧`);
    
    // 1. 分析物理过程
    const physicsAnalysis = this.analyzePhysicsProcess(ir, simulationResult);
    console.log(`🔬 物理分析: ${physicsAnalysis.phases.length}个阶段, ${physicsAnalysis.events.length}个关键事件`);
    
    // 2. 生成帧序列
    console.log('🎨 生成物理动画帧...');
    const frameFiles = [];
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / fps;
      const frameData = this.generatePhysicsFrame(time, simulationResult, physicsAnalysis, config);
      const framePath = path.join(this.tempDir, `frame_${String(i).padStart(6, '0')}.png`);
      
      await this.renderPhysicsFrame(frameData, config, framePath);
      frameFiles.push(framePath);
      
      if (i % 30 === 0 || i === frameCount - 1) {
        console.log(`🎬 渲染进度: ${i}/${frameCount} (${((i / frameCount) * 100).toFixed(1)}%)`);
      }
    }
    
    // 3. 生成视频
    console.log('🎥 编码视频文件...');
    const videoPath = await this.encodeVideo(frameFiles, config);
    
    // 4. 清理临时文件
    this.cleanupTempFiles();
    
    console.log('✅ 物理动画视频生成完成');
    return {
      success: true,
      videoPath: videoPath,
      frameCount: frameCount,
      physicsAnalysis: physicsAnalysis,
      errors: [],
      warnings: []
    };
  }

  /**
   * 分析物理过程
   */
  analyzePhysicsProcess(ir, simulationResult) {
    const analysis = {
      phases: [],
      events: [],
      keyTimes: [],
      physicsConstants: {}
    };
    
    // 提取物理常数
    if (ir.system && ir.system.parameters) {
      for (const param of ir.system.parameters) {
        if (['g', 'm', 'h', 'theta', 'mu'].includes(param.symbol)) {
          analysis.physicsConstants[param.symbol] = param.value;
        }
      }
    }
    
    // 分析仿真事件，确定阶段
    if (simulationResult.events) {
      for (const event of simulationResult.events) {
        analysis.events.push({
          time: event.time,
          type: event.type,
          description: event.description || event.type
        });
        analysis.keyTimes.push(event.time);
      }
    }
    
    // 定义物理阶段
    analysis.phases = [
      {
        id: 'free_fall',
        name: '自由落体',
        startTime: 0,
        endTime: analysis.keyTimes[0] || 1.0,
        color: '#FFD93D',
        description: '物体在重力作用下自由下落'
      },
      {
        id: 'collision',
        name: '弹性碰撞',
        startTime: analysis.keyTimes[0] || 1.0,
        endTime: (analysis.keyTimes[0] || 1.0) + 0.1,
        color: '#FF0000',
        description: '物体与地面发生完全弹性碰撞'
      },
      {
        id: 'incline_motion',
        name: '斜面滑动',
        startTime: (analysis.keyTimes[0] || 1.0) + 0.1,
        endTime: analysis.keyTimes[analysis.keyTimes.length - 1] || 4.0,
        color: '#4ECDC4',
        description: '物体沿斜面向上滑动直至停止'
      }
    ];
    
    return analysis;
  }

  /**
   * 生成物理帧数据
   */
  generatePhysicsFrame(time, simulationResult, physicsAnalysis, config) {
    // 找到最接近的仿真数据点
    let simData = simulationResult.timeSeries[0];
    for (const data of simulationResult.timeSeries) {
      if (data.time <= time) {
        simData = data;
      } else {
        break;
      }
    }
    
    // 确定当前物理阶段
    let currentPhase = physicsAnalysis.phases[0];
    for (const phase of physicsAnalysis.phases) {
      if (time >= phase.startTime && time <= phase.endTime) {
        currentPhase = phase;
        break;
      }
    }
    
    // 坐标转换（物理 → 屏幕）
    const scale = 80; // 像素/米
    const offsetX = config.width / 2;
    const offsetY = config.height - 100;
    
    const object = simData.objects?.object1 || { position: { x: 0, y: 5 }, velocity: { x: 0, y: 0 } };
    
    // 根据阶段调整坐标计算
    let screenX, screenY;
    if (currentPhase.id === 'incline_motion' && object.position.x !== undefined) {
      // 斜面滑动：沿斜面的距离转换为屏幕坐标
      const inclineDistance = object.position.x;
      const theta = 30 * Math.PI / 180;
      screenX = offsetX + inclineDistance * Math.cos(theta) * scale;
      screenY = offsetY - inclineDistance * Math.sin(theta) * scale;
    } else {
      // 其他阶段：直接坐标转换
      screenX = offsetX + (object.position.x || 0) * scale;
      screenY = offsetY - (object.position.y || 0) * scale;
    }
    
    return {
      time: time,
      phase: currentPhase,
      object: {
        position: { x: screenX, y: screenY },
        velocity: object.velocity || { x: 0, y: 0 },
        radius: 15,
        color: currentPhase.color
      },
      environment: {
        ground: { y: offsetY },
        incline: {
          enabled: currentPhase.id === 'incline_motion',
          angle: 30,
          startX: offsetX - 200,
          endX: offsetX + 200,
          startY: offsetY,
          endY: offsetY - 200 * Math.tan(30 * Math.PI / 180)
        }
      },
      annotations: this.generatePhysicsAnnotations(time, currentPhase, physicsAnalysis, object)
    };
  }

  /**
   * 生成物理注释
   */
  generatePhysicsAnnotations(time, phase, analysis, object) {
    const annotations = [];
    
    // 阶段信息
    annotations.push(`阶段: ${phase.name}`);
    annotations.push(`时间: ${time.toFixed(2)}s`);
    
    // 物理参数
    if (analysis.physicsConstants.m) {
      annotations.push(`质量: ${analysis.physicsConstants.m}kg`);
    }
    if (analysis.physicsConstants.g) {
      annotations.push(`重力: ${analysis.physicsConstants.g}m/s²`);
    }
    
    // 阶段特定信息
    switch (phase.id) {
      case 'free_fall':
        annotations.push('自由落体运动');
        annotations.push('只受重力作用');
        break;
      case 'collision':
        annotations.push('完全弹性碰撞');
        annotations.push('动量守恒，动能守恒');
        break;
      case 'incline_motion':
        if (analysis.physicsConstants.theta) {
          annotations.push(`斜面角度: ${(analysis.physicsConstants.theta * 180 / Math.PI).toFixed(1)}°`);
        }
        if (analysis.physicsConstants.mu) {
          annotations.push(`摩擦系数: ${analysis.physicsConstants.mu}`);
        }
        annotations.push('受重力、法向力、摩擦力');
        break;
    }
    
    // 速度信息
    if (object.velocity) {
      const speed = Math.sqrt(object.velocity.x**2 + object.velocity.y**2);
      annotations.push(`速度: ${speed.toFixed(2)}m/s`);
    }
    
    return annotations;
  }

  /**
   * 渲染物理帧
   */
  async renderPhysicsFrame(frameData, config, outputPath) {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = config.backgroundColor || '#F0F8FF';
    ctx.fillRect(0, 0, config.width, config.height);
    
    // 地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, frameData.environment.ground.y, config.width, config.height - frameData.environment.ground.y);
    
    // 斜面
    if (frameData.environment.incline.enabled) {
      const incline = frameData.environment.incline;
      ctx.strokeStyle = '#696969';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(incline.startX, incline.startY);
      ctx.lineTo(incline.endX, incline.endY);
      ctx.stroke();
      
      // 斜面角度标注
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`θ=${incline.angle}°`, incline.startX + 50, incline.startY - 10);
    }
    
    // 物体（小球）
    ctx.fillStyle = frameData.object.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(frameData.object.position.x, frameData.object.position.y, frameData.object.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 速度矢量
    if (config.showVectors && frameData.object.velocity) {
      const speed = Math.sqrt(frameData.object.velocity.x**2 + frameData.object.velocity.y**2);
      if (speed > 0.1) {
        const scale = 20; // 矢量显示比例
        const vx = frameData.object.velocity.x * scale;
        const vy = -frameData.object.velocity.y * scale; // 屏幕坐标y反向
        
        this.drawArrow(
          ctx,
          frameData.object.position.x,
          frameData.object.position.y,
          frameData.object.position.x + vx,
          frameData.object.position.y + vy,
          '#FF0000',
          3
        );
      }
    }
    
    // 重力矢量（始终向下）
    if (config.showVectors) {
      this.drawArrow(
        ctx,
        frameData.object.position.x,
        frameData.object.position.y,
        frameData.object.position.x,
        frameData.object.position.y + 40,
        '#0000FF',
        2
      );
    }
    
    // 阶段标签
    ctx.fillStyle = frameData.phase.color;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(frameData.phase.name, 20, 40);
    
    // 物理注释
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    frameData.annotations.forEach((annotation, index) => {
      ctx.fillText(annotation, 20, 70 + index * 25);
    });
    
    // 保存帧
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
  }

  /**
   * 绘制箭头
   */
  drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth = 2) {
    const headlen = 8;
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
   * 编码视频
   */
  async encodeVideo(frameFiles, config) {
    const videoPath = path.join(this.outputDir, 'physics_animation.mp4');
    const framePattern = path.join(this.tempDir, 'frame_%06d.png');
    
    const ffmpegCmd = `ffmpeg -y -framerate ${config.fps} -i "${framePattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow "${videoPath}"`;
    
    try {
      execSync(ffmpegCmd, { stdio: 'pipe' });
      
      if (fs.existsSync(videoPath)) {
        const stats = fs.statSync(videoPath);
        console.log(`✅ 视频编码成功: ${videoPath}`);
        console.log(`📊 文件大小: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
        return videoPath;
      } else {
        throw new Error('视频文件未生成');
      }
    } catch (error) {
      console.error('❌ FFmpeg编码失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理临时文件
   */
  cleanupTempFiles() {
    if (fs.existsSync(this.tempDir)) {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.tempDir, file));
      });
      fs.rmdirSync(this.tempDir);
      console.log('🧹 临时文件清理完成');
    }
  }
}

module.exports = { PhysicsAnimationGenerator };
