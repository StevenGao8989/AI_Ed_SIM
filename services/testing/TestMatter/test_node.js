/**
 * 斜坡碰撞动画示例 - Node.js版本 + 视频生成
 * 题目：在斜坡上方顶端放一个质量m = 0.5kg球，坡度为30度，长5厘米，
 * 另一个质量为M = 1kg的小球离斜坡5厘米。水平面为粗糙水平面，动摩擦因数μ=0.25，
 * 计算碰撞后第二个球的速度。
 */

const Matter = require('matter-js');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

class RampCollisionTestWithVideo {
  constructor(options = {}) {
    this.options = {
      width: options.width || 1000,
      height: options.height || 600,
      fps: options.fps || 30,
      duration: options.duration || 10,
      outputDir: options.outputDir || path.join(__dirname, 'output'),
      ...options
    };
    
    this.ensureOutputDir();
    this.setupEngine();
    this.createPhysicsWorld();
    this.setupEventListeners();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  setupEngine() {
    // 创建引擎
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    // 设置重力
    this.engine.world.gravity.y = 9.8; // 标准重力加速度
    
    // 创建Canvas
    this.canvas = createCanvas(this.options.width, this.options.height);
    this.ctx = this.canvas.getContext('2d');
    
    console.log('✅ Matter.js引擎初始化完成');
  }

  createPhysicsWorld() {
    // 物理参数
    const rampAngle = Math.PI / 6; // 30度 = π/6 弧度
    const rampLength = 250; // 斜坡长度 (像素) - 延长至400像素
    const ball1Mass = 0.5; // 小球质量
    const ball2Mass = 1.0; // 大球质量
    const friction = 0.25; // 动摩擦因数

    // 地面位置 - 延长至画布边界
    const groundY = 550;
    const groundWidth = this.options.width; // 使用画布宽度
    const groundX = this.options.width / 2; // 地面中心X坐标

    // 重新计算斜坡位置，使右端与地面接触
    const rampWidth = 20;
    
    // 斜坡右端点位置（与地面接触）
    const rampRightX = groundX - 150; // 斜坡右端距离画布中心150像素
    const rampRightY = groundY - 10; // 斜坡右端在地面上方10像素
    
    // 计算斜坡中心位置
    const rampX = rampRightX - (rampLength / 2) * Math.cos(rampAngle);
    const rampY = rampRightY - (rampLength / 2) * Math.sin(rampAngle);

    // 创建斜坡 (静态矩形)
    this.ramp = Matter.Bodies.rectangle(rampX, rampY, rampLength, rampWidth, {
      isStatic: true,
      angle: rampAngle,
      render: {
        fillStyle: '#8B4513',
        strokeStyle: '#654321',
        lineWidth: 2
      }
    });

    // 创建粗糙水平面 (静态矩形)
    this.ground = Matter.Bodies.rectangle(groundX, groundY, groundWidth, 20, {
      isStatic: true,
      friction: friction,
      frictionStatic: friction,
      render: {
        fillStyle: '#666666',
        strokeStyle: '#333333',
        lineWidth: 2
      }
    });

    // 计算小球初始位置 (斜坡顶端)
    const ball1Radius = 15;
    this.ball1X = rampX - (rampLength / 2) * Math.cos(rampAngle) + ball1Radius * Math.sin(rampAngle);
    this.ball1Y = rampY - (rampLength / 2) * Math.sin(rampAngle) - ball1Radius * Math.cos(rampAngle);

    // 创建小球 (m = 0.5kg)
    this.ball1 = Matter.Bodies.circle(this.ball1X, this.ball1Y, ball1Radius, {
      mass: ball1Mass,
      friction: 0.1,
      frictionStatic: 0.1,
      restitution: 0.3,
      render: {
        fillStyle: '#FF6B6B',
        strokeStyle: '#CC5555',
        lineWidth: 2
      }
    });

    // 计算大球初始位置 (离斜坡右端5厘米，转换为像素约50像素)
    const ball2Radius = 20;
    this.ball2X = rampRightX + 100; // 斜坡右端向右50像素
    this.ball2Y = rampRightY - ball2Radius; // 在地面上方

    // 创建大球 (M = 1kg)
    this.ball2 = Matter.Bodies.circle(this.ball2X, this.ball2Y, ball2Radius, {
      mass: ball2Mass,
      friction: friction,
      frictionStatic: friction,
      restitution: 0.3,
      render: {
        fillStyle: '#4ECDC4',
        strokeStyle: '#3BA39C',
        lineWidth: 2
      }
    });

    // 添加所有物体到世界
    Matter.Composite.add(this.world, [this.ramp, this.ground, this.ball1, this.ball2]);

    console.log('✅ 物理世界创建完成');
    console.log(`   - 斜坡角度: ${(rampAngle * 180 / Math.PI).toFixed(1)}°`);
    console.log(`   - 小球质量: ${ball1Mass}kg`);
    console.log(`   - 大球质量: ${ball2Mass}kg`);
    console.log(`   - 摩擦因数: ${friction}`);
  }

  setupEventListeners() {
    // 添加碰撞事件监听器
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 检查是否是小球和大球的碰撞
        if ((bodyA === this.ball1 && bodyB === this.ball2) || (bodyA === this.ball2 && bodyB === this.ball1)) {
          console.log('🎯 球体碰撞发生！');
          
          const v1 = bodyA === this.ball1 ? bodyA.velocity : bodyB.velocity;
          const v2 = bodyA === this.ball2 ? bodyA.velocity : bodyB.velocity;
          
          const speed1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const speed2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          
          console.log(`   小球速度: ${speed1.toFixed(2)} m/s`);
          console.log(`   大球速度: ${speed2.toFixed(2)} m/s`);

          // 计算碰撞后的速度 (简化的弹性碰撞)
          const ball1Mass = 0.5;
          const ball2Mass = 1.0;
          const totalMass = ball1Mass + ball2Mass;
          
          const v1New = {
            x: (v1.x * (ball1Mass - ball2Mass) + 2 * ball2Mass * v2.x) / totalMass,
            y: (v1.y * (ball1Mass - ball2Mass) + 2 * ball2Mass * v2.y) / totalMass
          };
          const v2New = {
            x: (v2.x * (ball2Mass - ball1Mass) + 2 * ball1Mass * v1.x) / totalMass,
            y: (v2.y * (ball2Mass - ball1Mass) + 2 * ball1Mass * v1.y) / totalMass
          };

          const speed1New = Math.sqrt(v1New.x * v1New.x + v1New.y * v1New.y);
          const speed2New = Math.sqrt(v2New.x * v2New.x + v2New.y * v2New.y);

          console.log(`   碰撞后小球速度: ${speed1New.toFixed(2)} m/s`);
          console.log(`   碰撞后大球速度: ${speed2New.toFixed(2)} m/s`);
          
          // 应用碰撞后的速度到球体
          Matter.Body.setVelocity(this.ball1, v1New);
          Matter.Body.setVelocity(this.ball2, v2New);
        }
      }
    });

    console.log('✅ 事件监听器设置完成');
  }

  renderFrame(frameNumber) {
    // 清空画布
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.options.width, this.options.height);

    // 绘制斜坡
    this.ctx.save();
    this.ctx.translate(this.ramp.position.x, this.ramp.position.y);
    this.ctx.rotate(this.ramp.angle);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 2;
    // 使用斜坡的实际长度和宽度
    const rampLength = 250; // 与物理世界保持一致
    const rampWidth = 20;
    this.ctx.fillRect(-rampLength/2, -rampWidth/2, rampLength, rampWidth);
    this.ctx.strokeRect(-rampLength/2, -rampWidth/2, rampLength, rampWidth);
    this.ctx.restore();

    // 绘制地面 - 延长至画布边界
    this.ctx.fillStyle = '#666666';
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(0, 540, this.options.width, 20);
    this.ctx.strokeRect(0, 540, this.options.width, 20);

    // 绘制小球
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.strokeStyle = '#CC5555';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.ball1.position.x, this.ball1.position.y, 15, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    // 绘制大球
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.strokeStyle = '#3BA39C';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.ball2.position.x, this.ball2.position.y, 20, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    // 绘制速度矢量
    this.drawVelocityVector(this.ball1, '#FF6B6B');
    this.drawVelocityVector(this.ball2, '#4ECDC4');

    // 绘制信息
    this.drawInfo(frameNumber);
  }

  drawVelocityVector(body, color) {
    const scale = 10; // 速度矢量缩放
    const vx = body.velocity.x * scale;
    const vy = body.velocity.y * scale;
    
    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(body.position.x, body.position.y);
      this.ctx.lineTo(body.position.x + vx, body.position.y + vy);
      this.ctx.stroke();
      
      // 绘制箭头
      const angle = Math.atan2(vy, vx);
      const arrowLength = 8;
      this.ctx.beginPath();
      this.ctx.moveTo(body.position.x + vx, body.position.y + vy);
      this.ctx.lineTo(
        body.position.x + vx - arrowLength * Math.cos(angle - Math.PI / 6),
        body.position.y + vy - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.moveTo(body.position.x + vx, body.position.y + vy);
      this.ctx.lineTo(
        body.position.x + vx - arrowLength * Math.cos(angle + Math.PI / 6),
        body.position.y + vy - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.stroke();
    }
  }

  drawInfo(frameNumber) {
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '16px Arial';
    
    // 计算速度
    const ball1Speed = Math.sqrt(this.ball1.velocity.x ** 2 + this.ball1.velocity.y ** 2);
    const ball2Speed = Math.sqrt(this.ball2.velocity.x ** 2 + this.ball2.velocity.y ** 2);
    
    // 绘制信息
    this.ctx.fillText(`时间: ${(frameNumber / this.options.fps).toFixed(2)}s`, 20, 30);
    this.ctx.fillText(`小球速度: ${ball1Speed.toFixed(2)} m/s`, 20, 50);
    this.ctx.fillText(`大球速度: ${ball2Speed.toFixed(2)} m/s`, 20, 70);
    this.ctx.fillText(`帧数: ${frameNumber}`, 20, 90);
    
    // 绘制物理参数
    this.ctx.fillText('斜坡角度: 30°', 20, 120);
    this.ctx.fillText('小球质量: 0.5kg', 20, 140);
    this.ctx.fillText('大球质量: 1.0kg', 20, 160);
    this.ctx.fillText('摩擦因数: 0.25', 20, 180);
  }

  resetSimulation() {
    // 重置小球位置
    Matter.Body.setPosition(this.ball1, { x: this.ball1X, y: this.ball1Y });
    Matter.Body.setVelocity(this.ball1, { x: 0, y: 0 });
    Matter.Body.setAngle(this.ball1, 0);
    Matter.Body.setAngularVelocity(this.ball1, 0);

    // 重置大球位置
    Matter.Body.setPosition(this.ball2, { x: this.ball2X, y: this.ball2Y });
    Matter.Body.setVelocity(this.ball2, { x: 0, y: 0 });
    Matter.Body.setAngle(this.ball2, 0);
    Matter.Body.setAngularVelocity(this.ball2, 0);

    console.log('🔄 仿真已重置');
  }

  async generateVideo() {
    try {
      console.log('🎬 开始生成斜坡碰撞视频');
      console.log('='.repeat(50));

      const totalFrames = this.options.duration * this.options.fps;
      const frameDir = path.join(this.options.outputDir, 'temp_frames');
      
      // 创建临时帧目录
      if (!fs.existsSync(frameDir)) {
        fs.mkdirSync(frameDir, { recursive: true });
      }

      // 重置仿真
      this.resetSimulation();

      // 生成帧
      console.log('📸 开始生成帧...');
      for (let frame = 0; frame < totalFrames; frame++) {
        // 更新物理引擎
        Matter.Engine.update(this.engine, 1000 / this.options.fps);
        
        // 渲染帧
        this.renderFrame(frame);
        
        // 保存帧
        const framePath = path.join(frameDir, `frame_${frame.toString().padStart(6, '0')}.png`);
        const buffer = this.canvas.toBuffer('image/png');
        fs.writeFileSync(framePath, buffer);
        
        // 显示进度
        if (frame % 30 === 0) {
          console.log(`   📸 生成帧: ${frame + 1}/${totalFrames}`);
        }
      }

      console.log('✅ 帧生成完成');

      // 使用ffmpeg合成视频
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const outputPath = path.join(this.options.outputDir, 'ramp_collision_test.mp4');
      
      console.log('🎬 开始视频合成...');
      const ffmpegCommand = `ffmpeg -y -framerate ${this.options.fps} -i "${frameDir}/frame_%06d.png" -c:v libx264 -pix_fmt yuv420p -crf 23 "${outputPath}"`;
      
      try {
        const { stdout, stderr } = await execAsync(ffmpegCommand);
        console.log('✅ 视频合成完成');
      } catch (error) {
        throw new Error(`FFmpeg错误: ${error.message}`);
      }

      // 清理临时文件
      console.log('🧹 清理临时文件...');
      const files = fs.readdirSync(frameDir);
      for (const file of files) {
        fs.unlinkSync(path.join(frameDir, file));
      }
      fs.rmdirSync(frameDir);

      // 检查文件大小
      const stats = fs.statSync(outputPath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

      console.log('✅ 视频生成成功');
      console.log(`   - 视频路径: ${outputPath}`);
      console.log(`   - 总帧数: ${totalFrames}`);
      console.log(`   - 时长: ${this.options.duration}s`);
      console.log(`   - 分辨率: ${this.options.width}x${this.options.height}`);
      console.log(`   - 帧率: ${this.options.fps}fps`);
      console.log(`   - 文件大小: ${fileSizeMB}MB`);

      return {
        success: true,
        outputPath,
        stats: {
          totalFrames,
          duration: this.options.duration,
          resolution: `${this.options.width}x${this.options.height}`,
          fps: this.options.fps,
          fileSize: stats.size
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

  runSimulation(duration = 5) {
    console.log(`🚀 开始运行仿真 (${duration}秒)`);
    console.log('='.repeat(50));

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    let frameCount = 0;

    const runFrame = () => {
      const currentTime = Date.now();
      
      if (currentTime >= endTime) {
        console.log('✅ 仿真完成');
        console.log(`   - 总帧数: ${frameCount}`);
        console.log(`   - 运行时间: ${((currentTime - startTime) / 1000).toFixed(2)}s`);
        
        const ball1Speed = Math.sqrt(this.ball1.velocity.x ** 2 + this.ball1.velocity.y ** 2);
        const ball2Speed = Math.sqrt(this.ball2.velocity.x ** 2 + this.ball2.velocity.y ** 2);
        
        console.log(`   - 最终小球速度: ${ball1Speed.toFixed(2)} m/s`);
        console.log(`   - 最终大球速度: ${ball2Speed.toFixed(2)} m/s`);
        
        return;
      }

      // 更新物理引擎
      Matter.Engine.update(this.engine, 16.67); // 60fps
      frameCount++;

      // 每100帧显示一次状态
      if (frameCount % 100 === 0) {
        const ball1Speed = Math.sqrt(this.ball1.velocity.x ** 2 + this.ball1.velocity.y ** 2);
        const ball2Speed = Math.sqrt(this.ball2.velocity.x ** 2 + this.ball2.velocity.y ** 2);
        const elapsed = (currentTime - startTime) / 1000;
        console.log(`   📊 时间: ${elapsed.toFixed(1)}s, 小球速度: ${ball1Speed.toFixed(2)} m/s, 大球速度: ${ball2Speed.toFixed(2)} m/s`);
      }

      // 继续下一帧
      setImmediate(runFrame);
    };

    runFrame();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  console.log('🎮 斜坡碰撞物理仿真测试 + 视频生成');
  console.log('='.repeat(50));
  
  const test = new RampCollisionTestWithVideo({
    width: 1000,
    height: 600,
    fps: 30,
    duration: 10
  });
  
  // 运行仿真并生成视频
  test.generateVideo().then(result => {
    if (result.success) {
      console.log('\n🎉 测试完成！视频已生成。');
    } else {
      console.log('\n❌ 测试失败:', result.error);
    }
  }).catch(console.error);
}

module.exports = RampCollisionTestWithVideo;
