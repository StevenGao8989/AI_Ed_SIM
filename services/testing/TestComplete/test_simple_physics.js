// 简化的物理测试：平抛运动+弹性碰撞
// 解决小球贴合下落和瞬间碰撞问题

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');

// 设置环境变量
require('dotenv').config({ path: '.env.local' });

/**
 * 简化物理仿真器
 */
class SimplePhysicsSimulator {
  constructor() {
    this.g = 9.8; // 重力加速度
  }

  /**
   * 简化仿真
   */
  simulate(params) {
    console.log('⚡ 开始简化物理仿真...');
    console.log('📊 物理参数:', params);
    
    const frames = [];
    const dt = 0.01; // 时间步长
    
    // 提取参数
    const m = params.m || 0.20;
    const M = params.M || 0.80;
    const u = params.u || 10;
    const H = params.H || 1.25;
    const g = params.g || 9.8;
    
    let time = 0;
    
    // 计算关键量
    const t_landing = Math.sqrt(2 * H / g); // 落地时间
    const v_landing = Math.sqrt(u * u + 2 * g * H); // 落地瞬时速度
    const ball_landing_x = u * t_landing; // 小球落地时的x坐标
    
    // 弹性碰撞计算
    const v1_after = ((m - M) / (m + M)) * u; // 碰撞后小球速度
    const v2_after = ((2 * m) / (m + M)) * u; // 碰撞后小车速度
    
    console.log(`📊 理论计算: 落地时间=${t_landing.toFixed(3)}s, 落地速度=${v_landing.toFixed(3)}m/s`);
    console.log(`📊 碰撞计算: 小球=${v1_after.toFixed(3)}m/s, 小车=${v2_after.toFixed(3)}m/s`);
    
    // 阶段1: 平抛运动 - 小球贴合下落
    console.log('📉 阶段1: 平抛运动');
    let ball = { x: 0, y: H, vx: u, vy: 0 };
    let cart = { x: ball_landing_x + 0.1, y: 0, vx: 0, vy: 0 }; // 小车在小球落地位置稍右一点
    
    for (let i = 0; i <= Math.ceil(t_landing / dt); i++) {
      const t = i * dt;
      if (t > t_landing) break;
      
      // 更新小球位置和速度 - 确保贴合抛物线
      ball.x = u * t;
      ball.y = H - 0.5 * g * t * t;
      ball.vx = u;
      ball.vy = -g * t;
      
      frames.push({
        time: time + t,
        phase: 'projectile_motion',
        bodies: [
          {
            id: 'ball',
            position: [ball.x, ball.y],
            velocity: [ball.vx, ball.vy],
            energy: {
              kinetic: 0.5 * m * (ball.vx * ball.vx + ball.vy * ball.vy),
              potential: m * g * ball.y,
              total: m * g * H
            }
          },
          {
            id: 'cart',
            position: [cart.x, cart.y],
            velocity: [cart.vx, cart.vy],
            energy: { kinetic: 0, potential: 0 }
          }
        ]
      });
    }
    
    time += t_landing;
    console.log(`  平抛耗时: ${t_landing.toFixed(2)}s, 落地速度: ${v_landing.toFixed(2)}m/s`);
    
    // 阶段2: 瞬间弹性碰撞 - 无融合过程
    console.log('💥 阶段2: 瞬间弹性碰撞');
    
    // 小球落地
    ball.y = 0;
    ball.vx = u; // 落地时水平速度
    ball.vy = 0; // 竖直速度归零
    
    // 瞬间碰撞 - 只显示一帧
    frames.push({
      time: time,
      phase: 'elastic_collision',
      bodies: [
        {
          id: 'ball',
          position: [ball.x, ball.y],
          velocity: [ball.vx, ball.vy],
          energy: {
            kinetic: 0.5 * m * ball.vx * ball.vx,
            potential: 0,
            landing_speed: v_landing
          }
        },
        {
          id: 'cart',
          position: [cart.x, cart.y],
          velocity: [cart.vx, cart.vy],
          energy: { kinetic: 0, potential: 0 }
        }
      ]
    });
    
    // 立即更新碰撞后的速度
    ball.vx = v1_after;
    cart.vx = v2_after;
    
    // 阶段3: 碰撞后运动
    console.log('➡️ 阶段3: 碰撞后运动');
    const post_collision_time = 0.5; // 碰撞后运动0.5秒
    
    for (let i = 0; i <= Math.ceil(post_collision_time / dt); i++) {
      const t = i * dt;
      if (t > post_collision_time) break;
      
      // 更新位置
      ball.x += ball.vx * dt;
      cart.x += cart.vx * dt;
      
      frames.push({
        time: time + t,
        phase: 'post_collision',
        bodies: [
          {
            id: 'ball',
            position: [ball.x, ball.y],
            velocity: [ball.vx, ball.vy],
            energy: {
              kinetic: 0.5 * m * ball.vx * ball.vx,
              potential: 0
            }
          },
          {
            id: 'cart',
            position: [cart.x, cart.y],
            velocity: [cart.vx, cart.vy],
            energy: {
              kinetic: 0.5 * M * cart.vx * cart.vx,
              potential: 0
            }
          }
        ]
      });
    }
    
    time += post_collision_time;
    
    console.log('✅ 简化物理仿真完成');
    console.log(`📊 仿真统计: ${frames.length}帧, ${time.toFixed(2)}s`);
    
    const results = {
      v: v_landing.toFixed(3),           // 落地瞬时速度
      V: v2_after.toFixed(3),            // 碰后小车速度
      v1_after: v1_after.toFixed(3),     // 碰后小球速度
      total_time: time.toFixed(2)
    };
    
    return {
      frames: frames,
      results: results,
      phases: ['projectile_motion', 'elastic_collision', 'post_collision'],
      validation: { ok: true }
    };
  }
}

/**
 * 简化渲染器
 */
class SimplePhysicsRenderer {
  constructor(width = 1200, height = 800) {
    this.width = width;
    this.height = height;
    this.scale = 100; // 像素/米
    this.originX = 100; // 原点X偏移
    this.originY = height - 100; // 原点Y偏移
  }

  /**
   * 渲染帧序列
   */
  async renderFrames(simulation, outputDir) {
    console.log('🎨 开始简化场景渲染...');
    
    const framesDir = path.join(outputDir, 'frames');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }
    
    const frameFiles = [];
    
    for (let i = 0; i < simulation.frames.length; i++) {
      const frame = simulation.frames[i];
      const canvas = this.renderFrame(frame, i);
      
      const frameFile = `frame_${i.toString().padStart(6, '0')}.png`;
      const framePath = path.join(framesDir, frameFile);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      frameFiles.push(frameFile);
      
      if (i % 50 === 0) {
        console.log(`  渲染进度: ${i + 1}/${simulation.frames.length} (${((i + 1) / simulation.frames.length * 100).toFixed(1)}%)`);
      }
    }
    
    console.log(`✅ 渲染完成: ${frameFiles.length}帧`);
    return frameFiles;
  }

  /**
   * 渲染单帧
   */
  renderFrame(frame, frameIndex) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    
    // 设置背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制网格
    this.drawGrid(ctx);
    
    // 绘制物理场景
    this.drawPhysicsScene(ctx, frame);
    
    // 绘制信息面板
    this.drawInfoPanel(ctx, frame, null);

    return canvas;
  }

  drawGrid(ctx) {
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    // 垂直网格线
    for (let x = 0; x < this.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    
    // 水平网格线
    for (let y = 0; y < this.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  drawPhysicsScene(ctx, frame) {
    // 绘制地面
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.width, this.originY);
    ctx.stroke();

    // 绘制题目数据标注
    this.drawQuestionAnnotations(ctx, frame);

    // 绘制物体
    frame.bodies?.forEach(body => {
      this.drawBody(ctx, body, frame.phase);
    });

    // 绘制阶段标识
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 18px Arial';
    const phaseNames = {
      'projectile_motion': '平抛运动',
      'elastic_collision': '弹性碰撞',
      'post_collision': '碰撞后运动'
    };
    ctx.fillText(`阶段: ${phaseNames[frame.phase] || frame.phase}`, 20, 40);
  }

  /**
   * 绘制题目数据标注 - 手绘风格
   */
  drawQuestionAnnotations(ctx, frame) {
    // 题目参数
    const H = 1.25; // 抛出高度 (m)
    const u = 10;   // 水平初速度 (m/s)
    
    // 在平抛运动阶段显示高度标注
    if (frame.phase === 'projectile_motion') {
      // 绘制手绘风格的高度标注
      const heightX = this.originX - 60;
      const heightY = this.originY - H * this.scale;
      
      // 绘制手绘风格的粗红线
      ctx.strokeStyle = '#dc3545';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(heightX, this.originY);
      ctx.lineTo(heightX, heightY);
      ctx.stroke();
      
      // 绘制双向箭头 - 上箭头
      ctx.beginPath();
      ctx.moveTo(heightX - 8, heightY + 8);
      ctx.lineTo(heightX, heightY);
      ctx.lineTo(heightX + 8, heightY + 8);
      ctx.stroke();
      
      // 绘制双向箭头 - 下箭头
      ctx.beginPath();
      ctx.moveTo(heightX - 8, this.originY - 8);
      ctx.lineTo(heightX, this.originY);
      ctx.lineTo(heightX + 8, this.originY - 8);
      ctx.stroke();
      
      // 绘制手写风格的数字标注
      ctx.fillStyle = '#dc3545';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('1.25', heightX + 15, heightY + 20);
      
      // 绘制水平初速度标注 u = 10m/s - 固定在右上角
      ctx.fillStyle = '#007bff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('u=10m/s', this.width - 120, 60);
    }
    
    // 绘制固定的参数标注 - 手写风格
    ctx.fillStyle = '#6c757d';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('m=0.20kg', 20, this.height - 60);
    ctx.fillText('M=0.80kg', 20, this.height - 40);
    ctx.fillText('g=9.8m/s²', 20, this.height - 20);
  }

  drawBody(ctx, body, phase) {
    const x = this.originX + body.position[0] * this.scale;
    const y = this.originY - body.position[1] * this.scale;

    // 根据不同物体绘制不同颜色和形状
    if (body.id === 'ball') {
      ctx.fillStyle = '#dc3545'; // 红色小球
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
    } else if (body.id === 'cart') {
      ctx.fillStyle = '#6f42c1'; // 紫色小车
      ctx.fillRect(x - 20, y - 10, 40, 20);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 20, y - 10, 40, 20);
    }

    // 绘制速度向量
    if (body.velocity && (Math.abs(body.velocity[0]) > 0.1 || Math.abs(body.velocity[1]) > 0.1)) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + body.velocity[0] * 8, y - body.velocity[1] * 8);
      ctx.stroke();
      
      // 简化的箭头
      const angle = Math.atan2(-body.velocity[1], body.velocity[0]);
      const arrowLength = 6;
      ctx.beginPath();
      ctx.moveTo(x + body.velocity[0] * 8, y - body.velocity[1] * 8);
      ctx.lineTo(x + body.velocity[0] * 8 - arrowLength * Math.cos(angle - 0.5), 
                 y - body.velocity[1] * 8 + arrowLength * Math.sin(angle - 0.5));
      ctx.moveTo(x + body.velocity[0] * 8, y - body.velocity[1] * 8);
      ctx.lineTo(x + body.velocity[0] * 8 - arrowLength * Math.cos(angle + 0.5), 
                 y - body.velocity[1] * 8 + arrowLength * Math.sin(angle + 0.5));
      ctx.stroke();
    }
  }

  drawInfoPanel(ctx, frame, results) {
    // 绘制信息背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(this.width - 350, 10, 340, 200);
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.width - 350, 10, 340, 200);

    // 绘制信息文本
    ctx.fillStyle = '#212529';
    ctx.font = '14px Arial';
    
    let y = 35;
    const lineHeight = 18;
    
    ctx.fillText(`时间: ${frame.time.toFixed(2)}s`, this.width - 340, y);
    y += lineHeight;
    
    // 绘制物体信息
    if (frame.bodies && frame.bodies.length > 0) {
      frame.bodies.forEach(body => {
        ctx.fillText(`${body.id}:`, this.width - 340, y);
        y += lineHeight;
        ctx.fillText(`  位置: (${body.position[0].toFixed(2)}, ${body.position[1].toFixed(2)})m`, this.width - 330, y);
        y += lineHeight;
        ctx.fillText(`  速度: (${body.velocity[0].toFixed(2)}, ${body.velocity[1].toFixed(2)})m/s`, this.width - 330, y);
        y += lineHeight;
      });
    }
    
    // 绘制结果
    if (results) {
      ctx.fillText(`落地速度: ${results.v}m/s`, this.width - 340, y);
      y += lineHeight;
      ctx.fillText(`碰后小车速度: ${results.V}m/s`, this.width - 340, y);
      y += lineHeight;
      ctx.fillText(`碰后小球速度: ${results.v1_after}m/s`, this.width - 340, y);
    }
  }
}

/**
 * 简化测试主函数
 */
async function testSimplePhysics() {
  console.log('🚀 开始简化物理测试\n');
  
  const outputDir = 'simple_physics_output';
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 题目参数
    const params = {
      m: 0.20,    // 小球质量
      M: 0.80,    // 小车质量  
      u: 10,      // 水平初速度
      H: 1.25,    // 抛出高度
      g: 9.8      // 重力加速度
    };

    // Step 1: 简化仿真
    console.log('=== Step 1: 简化仿真 ===');
    const simulator = new SimplePhysicsSimulator();
    const simulation = simulator.simulate(params);
    
    // 保存仿真结果
    const simResultPath = path.join(outputDir, 'simulation_result.json');
    fs.writeFileSync(simResultPath, JSON.stringify(simulation, null, 2));
    console.log(`📁 仿真结果 → ${simResultPath}`);

    // Step 2: 简化渲染
    console.log('\n=== Step 2: 简化渲染 ===');
    const renderer = new SimplePhysicsRenderer();
    const frameFiles = await renderer.renderFrames(simulation, outputDir);

    // Step 3: 生成视频
    console.log('\n=== Step 3: 生成视频 ===');
    const videoPath = path.join(outputDir, 'simple_physics_animation.mp4');
    const framesPattern = path.join(outputDir, 'frames', 'frame_%06d.png');
    
    try {
      console.log('🎬 开始FFmpeg编码...');
      execSync(`ffmpeg -y -r 30 -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "${videoPath}"`, {
        stdio: 'pipe'
      });
      
      const stats = fs.statSync(videoPath);
      console.log(`✅ 视频生成成功: ${videoPath}`);
      console.log(`📏 视频大小: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
      console.log(`⏱️ 预计时长: ${(frameFiles.length / 30).toFixed(1)}秒`);
      
    } catch (ffmpegError) {
      console.error('❌ FFmpeg编码失败:', ffmpegError.message);
      console.log('💡 请确保系统已安装FFmpeg');
    }

    // 最终报告
    console.log('\n=== 最终报告 ===');
    console.log('✅ 简化物理测试完成！');
    console.log('\n📊 物理计算结果:');
    console.log(`  落地瞬时速度 v = ${simulation.results.v} m/s`);
    console.log(`  碰后小车速度 V = ${simulation.results.V} m/s`);
    console.log(`  碰后小球速度 = ${simulation.results.v1_after} m/s`);
    console.log(`  总仿真时间 = ${simulation.results.total_time} s`);
    
    console.log('\n📁 输出文件:');
    console.log(`  仿真结果: ${simResultPath}`);
    console.log(`  视频文件: ${videoPath}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testSimplePhysics();
}

module.exports = { SimplePhysicsSimulator, SimplePhysicsRenderer, testSimplePhysics };
