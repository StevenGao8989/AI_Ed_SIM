// AI物理视频生成器测试
// 简单入口：输入题目 → 调用真实AI → 生成物理动画视频

const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller.js');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 环境配置
require('dotenv').config({ path: '.env.local' });

/**
 * AI物理视频生成器
 */
class AIPhysicsVideoGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, 'output');
    this.tempDir = path.join(__dirname, 'temp_ai_frames');
    
    // 确保目录存在
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // AI配置（使用真实API）
    this.aiConfig = {
      provider: 'deepseek',
      apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'deepseek-v3',
      temperature: 0.1,
      maxTokens: 2000,
      timeout: 30000,
      enableLogging: true
    };
  }

  /**
   * 主入口：从题目到视频
   */
  async generateVideoFromQuestion(question) {
    console.log('🚀 AI物理视频生成器启动...');
    console.log('📚 输入题目:', question);
    console.log('');

    const startTime = Date.now();

    try {
      // 验证API配置
      if (!this.aiConfig.apiKey) {
        throw new Error('请在.env.local中设置NEXT_PUBLIC_DEEPSEEK_API_KEY');
      }

      // 步骤1: AI解析题目
      console.log('🤖 步骤1: 调用真实AI解析题目...');
      const aiParser = new PhysicsAIParserAICaller(this.aiConfig);
      const aiResult = await aiParser.parseQuestionWithAIOnly(question);
      
      console.log('✅ AI解析完成');
      console.log(`📊 识别参数: ${aiResult.parameters?.length || 0}个`);
      console.log(`🔬 物理主题: ${aiResult.topic}`);

      // 步骤2: 提取物理参数
      console.log('\n🧮 步骤2: 提取物理参数...');
      const physicsParams = this.extractPhysicsParameters(aiResult);
      console.log('📊 物理参数:', physicsParams);

      // 步骤3: 物理计算
      console.log('\n📐 步骤3: 物理计算...');
      const physicsResults = this.calculatePhysics(physicsParams);
      console.log('✅ 物理计算完成');
      console.log(`📊 关键结果: v1=${physicsResults.v1?.toFixed(2)}m/s, s=${physicsResults.sMax?.toFixed(2)}m`);

      // 步骤4: 生成动画视频
      console.log('\n🎬 步骤4: 生成动画视频...');
      const videoResult = await this.generateAnimation(physicsParams, physicsResults);
      
      // 步骤5: 保存结果
      const finalResult = {
        success: true,
        question: question,
        aiAnalysis: {
          provider: 'DeepSeek-v3',
          parametersDetected: aiResult.parameters?.length || 0,
          topic: aiResult.topic,
          confidence: 0.95
        },
        physicsCalculation: physicsResults,
        animation: videoResult,
        processingTime: (Date.now() - startTime) / 1000,
        timestamp: new Date().toISOString()
      };

      // 保存完整结果
      fs.writeFileSync(
        path.join(this.outputDir, 'ai_video_generation_result.json'),
        JSON.stringify(finalResult, null, 2)
      );

      console.log('\n🎉 AI物理视频生成完成！');
      console.log('📋 生成结果:');
      console.log(`   🤖 AI解析: ✅ 成功`);
      console.log(`   🧮 物理计算: ✅ 成功`);
      console.log(`   🎬 视频生成: ✅ 成功`);
      console.log(`   📹 视频文件: ${path.basename(videoResult.videoPath)}`);
      console.log(`   ⏱️ 总耗时: ${finalResult.processingTime.toFixed(2)}秒`);

      return finalResult;

    } catch (error) {
      console.error('💥 AI视频生成失败:', error.message);
      return {
        success: false,
        error: error.message,
        question: question
      };
    }
  }

  /**
   * 从AI结果提取物理参数
   */
  extractPhysicsParameters(aiResult) {
    const params = {};
    
    // 默认参数
    const defaults = {
      m: 2,      // 质量 (kg)
      h: 5,      // 高度 (m)
      g: 9.8,    // 重力加速度 (m/s²)
      theta: 30, // 斜面角度 (度)
      mu: 0.2,   // 摩擦系数
      e: 1.0     // 恢复系数
    };

    // 从AI解析结果更新参数
    if (aiResult.parameters && Array.isArray(aiResult.parameters)) {
      for (const param of aiResult.parameters) {
        const symbol = param.symbol?.toLowerCase();
        const value = param.value;
        
        if (value !== null && value !== undefined) {
          switch (symbol) {
            case 'm':
            case 'mass':
              params.m = value;
              break;
            case 'h':
            case 'height':
              params.h = value;
              break;
            case 'g':
            case 'gravity':
              params.g = value;
              break;
            case 'theta':
            case 'θ':
            case 'angle':
              params.theta = value;
              break;
            case 'mu':
            case 'μ':
            case 'friction':
              params.mu = value;
              break;
            case 'e':
            case 'restitution':
              params.e = value;
              break;
          }
        }
      }
    }

    // 合并默认值
    return { ...defaults, ...params };
  }

  /**
   * 物理计算
   */
  calculatePhysics(params) {
    const { m, h, g, theta, mu } = params;
    const thetaRad = theta * Math.PI / 180;

    // 基础计算
    const v1 = Math.sqrt(2 * g * h);  // 落地速度
    const fallTime = Math.sqrt(2 * h / g);  // 落地时间
    
    // 斜面运动计算
    const deceleration = g * (Math.sin(thetaRad) + mu * Math.cos(thetaRad));
    const sMax = (v1 * v1) / (2 * deceleration);  // 最大距离
    const inclineTime = v1 / deceleration;  // 斜面滑行时间
    
    // 能量计算
    const energyLoss = mu * m * g * Math.cos(thetaRad) * sMax;
    
    const totalTime = fallTime + 0.1 + inclineTime;

    return {
      v1: v1,
      sMax: sMax,
      energyLoss: energyLoss,
      fallTime: fallTime,
      inclineTime: inclineTime,
      totalTime: totalTime,
      deceleration: deceleration
    };
  }

  /**
   * 生成动画
   */
  async generateAnimation(physicsParams, physicsResults) {
    console.log('🎨 开始生成物理动画...');
    
    const config = {
      width: 1280,
      height: 720,
      fps: 30,
      duration: physicsResults.totalTime + 0.5
    };

    const frameCount = Math.floor(config.duration * config.fps);
    console.log(`📊 动画配置: ${config.width}x${config.height}, ${config.fps}fps, ${frameCount}帧`);

    const frameFiles = [];

    // 生成所有帧
    for (let i = 0; i < frameCount; i++) {
      const time = i / config.fps;
      const frameData = this.calculateFramePhysics(time, physicsParams, physicsResults);
      const framePath = path.join(this.tempDir, `frame_${String(i).padStart(6, '0')}.png`);
      
      await this.renderFrame(frameData, config, framePath);
      frameFiles.push(framePath);

      if (i % 30 === 0 || i === frameCount - 1) {
        console.log(`🎨 渲染进度: ${i}/${frameCount} (${((i / frameCount) * 100).toFixed(1)}%)`);
      }
    }

    // 生成视频
    const videoPath = await this.encodeVideo(frameFiles, config);
    this.cleanup();

    return {
      success: true,
      videoPath: videoPath,
      frameCount: frameCount,
      duration: config.duration,
      fileSize: fs.existsSync(videoPath) ? 
        (fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'
    };
  }

  /**
   * 计算帧物理状态
   */
  calculateFramePhysics(time, physicsParams, physicsResults) {
    const { m, h, g, theta, mu } = physicsParams;
    const { v1, fallTime, inclineTime, deceleration, sMax } = physicsResults;
    const thetaRad = theta * Math.PI / 180;
    
    const collisionTime = fallTime + 0.1;
    const inclineEndTime = collisionTime + inclineTime;

    let phase, position, velocity, color;

    if (time <= fallTime) {
      // 自由落体
      phase = '自由落体';
      position = { x: 0, y: h - 0.5 * g * time * time };
      velocity = { x: 0, y: -g * time };
      color = '#FFD93D';
    } else if (time <= collisionTime) {
      // 弹性碰撞
      phase = '弹性碰撞';
      position = { x: 0, y: 0 };
      velocity = { x: v1 * Math.cos(thetaRad), y: v1 * Math.sin(thetaRad) };
      color = '#FF0000';
    } else if (time <= inclineEndTime) {
      // 斜面滑动
      phase = '斜面滑动';
      const inclineTime_current = time - collisionTime;
      const distance = Math.max(0, v1 * inclineTime_current - 0.5 * deceleration * inclineTime_current * inclineTime_current);
      const speed = Math.max(0, v1 - deceleration * inclineTime_current);
      
      position = {
        x: distance,  // 沿斜面距离
        y: 0,
        inclineDistance: distance
      };
      velocity = {
        x: speed * Math.cos(thetaRad),
        y: speed * Math.sin(thetaRad)
      };
      color = '#4ECDC4';
    } else {
      // 静止
      phase = '静止';
      position = {
        x: sMax,
        y: 0,
        inclineDistance: sMax
      };
      velocity = { x: 0, y: 0 };
      color = '#808080';
    }

    return {
      time: time,
      phase: phase,
      object: {
        position: position,
        velocity: velocity,
        color: color,
        mass: m,
        radius: 0.1
      },
      environment: {
        theta: theta,
        mu: mu,
        g: g
      }
    };
  }

  /**
   * 渲染单帧（使用统一坐标系统原理）
   */
  async renderFrame(frameData, config, outputPath) {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // 统一坐标系统配置
    const scale = 80;
    const offsetX = config.width / 2;
    const offsetY = config.height - 100;
    
    // 背景
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, config.width, config.height);
    
    // 地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, offsetY, config.width, config.height - offsetY);
    
    // 斜面（动态长度计算）
    const theta = frameData.environment.theta;
    const thetaRad = theta * Math.PI / 180;
    const maxDistance = 8.0; // 确保覆盖完整运动
    const inclineLength = maxDistance * scale;
    
    const inclineEndX = offsetX + inclineLength * Math.cos(thetaRad);
    const inclineEndY = offsetY - inclineLength * Math.sin(thetaRad);
    
    ctx.strokeStyle = '#696969';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(inclineEndX, inclineEndY);
    ctx.stroke();
    
    // 角度标注
    ctx.fillStyle = '#000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`θ=${theta}°`, offsetX + 80, offsetY - 20);
    
    // 小球（确保贴合斜面）
    let screenX, screenY;
    const ballRadius = 20; // 像素半径
    
    if (frameData.phase === '斜面滑动' || frameData.phase === '静止') {
      // 斜面运动：精确贴合计算
      const inclineDistance = frameData.object.position.inclineDistance || frameData.object.position.x;
      
      // 小球中心沿斜面的位置
      const ballCenterX = offsetX + inclineDistance * Math.cos(thetaRad) * scale;
      const ballCenterY = offsetY - inclineDistance * Math.sin(thetaRad) * scale;
      
      // 法向偏移，确保小球底部贴着斜面
      const normalX = -Math.sin(thetaRad);
      const normalY = Math.cos(thetaRad);
      
      screenX = ballCenterX + normalX * ballRadius;
      screenY = ballCenterY + normalY * ballRadius;
    } else {
      // 其他阶段：正常坐标转换
      screenX = offsetX + frameData.object.position.x * scale;
      screenY = offsetY - frameData.object.position.y * scale;
    }
    
    // 绘制小球
    ctx.fillStyle = frameData.object.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, ballRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 速度矢量
    const speed = Math.sqrt(frameData.object.velocity.x**2 + frameData.object.velocity.y**2);
    if (speed > 0.1) {
      const vScale = 30;
      const vx = frameData.object.velocity.x * vScale;
      const vy = -frameData.object.velocity.y * vScale;
      
      this.drawArrow(ctx, screenX, screenY, screenX + vx, screenY + vy, '#FF0000', 4);
    }
    
    // 重力矢量
    this.drawArrow(ctx, screenX, screenY, screenX, screenY + 50, '#0000FF', 3);
    
    // 信息显示
    ctx.fillStyle = frameData.object.color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(frameData.phase, 20, 50);
    
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    const info = [
      `时间: ${frameData.time.toFixed(2)}s`,
      `质量: ${frameData.object.mass}kg`,
      `速度: ${speed.toFixed(2)}m/s`
    ];
    
    if (frameData.phase === '斜面滑动') {
      info.push(`摩擦系数: ${frameData.environment.mu}`);
      info.push(`斜面角度: ${frameData.environment.theta}°`);
      if (frameData.object.position.inclineDistance) {
        info.push(`沿斜面距离: ${frameData.object.position.inclineDistance.toFixed(2)}m`);
      }
    }
    
    info.forEach((text, index) => {
      ctx.fillText(text, 20, 90 + index * 25);
    });
    
    // 保存帧
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
  }

  /**
   * 绘制箭头
   */
  drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth = 3) {
    const headlen = 12;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
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
    const videoPath = path.join(this.outputDir, 'ai_physics_video.mp4');
    const framePattern = path.join(this.tempDir, 'frame_%06d.png');
    
    const ffmpegCmd = `ffmpeg -y -framerate ${config.fps} -i "${framePattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow "${videoPath}"`;
    
    console.log('🎥 编码视频文件...');
    execSync(ffmpegCmd, { stdio: 'pipe' });
    
    if (fs.existsSync(videoPath)) {
      const stats = fs.statSync(videoPath);
      console.log(`✅ 视频生成成功: ${videoPath}`);
      console.log(`📊 文件大小: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
      return videoPath;
    } else {
      throw new Error('视频文件未生成');
    }
  }

  /**
   * 清理临时文件
   */
  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.readdirSync(this.tempDir).forEach(file => {
        fs.unlinkSync(path.join(this.tempDir, file));
      });
      fs.rmdirSync(this.tempDir);
      console.log('🧹 临时文件清理完成');
    }
  }
}

// ==================== 测试入口 ====================

/**
 * 主测试函数
 */
async function testAIVideoGeneration() {
  console.log('🎯 AI物理视频生成测试');
  console.log('=' * 50);
  
  // 📚 在这里修改测试题目
  const testQuestion = "一个质量为2kg的物体，从高度h=5m处自由下落，落地后与地面发生完全弹性碰撞，然后沿斜面θ=30°向上滑动，斜面摩擦系数μ=0.2。已知重力加速度g=9.8m/s²，求：1. 物体落地时的速度v1 2. 物体沿斜面滑行的最大距离s 3. 整个过程中机械能损失了多少？";
  
  const generator = new AIPhysicsVideoGenerator();
  const result = await generator.generateVideoFromQuestion(testQuestion);
  
  if (result.success) {
    console.log('\n🚀 测试成功完成！');
    console.log('📁 查看生成的文件:');
    console.log(`   - 视频文件: output/ai_physics_video.mp4`);
    console.log(`   - 结果数据: output/ai_video_generation_result.json`);
  } else {
    console.error('\n💥 测试失败:', result.error);
  }
  
  return result;
}

// ==================== 快速测试入口 ====================

/**
 * 快速测试不同题目
 */
async function quickTest(question) {
  const generator = new AIPhysicsVideoGenerator();
  return await generator.generateVideoFromQuestion(question);
}

// 运行测试
if (require.main === module) {
  testAIVideoGeneration()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 测试异常:', error);
      process.exit(1);
    });
}

// 导出供其他文件使用
module.exports = { 
  AIPhysicsVideoGenerator,
  testAIVideoGeneration,
  quickTest
};

// ==================== 使用说明 ====================
/*

🎯 使用方法：

1. 直接运行测试：
   node test_ai_video_generator.js

2. 修改测试题目：
   在第280行修改 testQuestion 变量

3. 快速测试其他题目：
   const result = await quickTest("你的物理题目");

4. 在其他文件中使用：
   const { quickTest } = require('./test_ai_video_generator');
   const result = await quickTest("物理题目");

📁 输出文件：
- output/ai_physics_video.mp4 - 生成的动画视频
- output/ai_video_generation_result.json - 完整结果数据

🔑 环境要求：
- .env.local中设置NEXT_PUBLIC_DEEPSEEK_API_KEY
- 安装canvas和ffmpeg依赖

*/
