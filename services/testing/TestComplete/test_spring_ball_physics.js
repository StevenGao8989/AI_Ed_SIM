// 测试弹簧发射小球物理题目：弹簧压缩→斜面滑行→抛射→非弹性碰撞
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');

// 设置环境变量
require('dotenv').config({ path: '.env.local' });

/**
 * 弹簧发射小球物理仿真器
 */
class SpringBallPhysicsSimulator {
  constructor() {
    this.g = 9.8; // 重力加速度
  }

  /**
   * 仿真弹簧发射小球物理过程
   */
  simulate(params) {
    console.log('⚡ 开始弹簧发射小球物理仿真...');
    console.log('📊 物理参数:', params);

    const frames = [];
    const dt = 0.005; // 时间步长
    
    // 提取参数
    const m = params.m || 0.5;        // 小球质量
    const k = params.k || 200;        // 弹簧劲度系数
    const x0 = params.x0 || 0.15;     // 弹簧压缩量
    const angle = params.angle || 30; // 斜面角度（度）
    const M = params.M || 0.3;        // 目标球质量
    const H = params.H || 0.40;       // 相遇点高度

    const angleRad = angle * Math.PI / 180;
    let time = 0;

    // 计算关键位置和参数
    const ball_radius = 0.02; // 小球半径 (2cm)
    const target_radius = 0.02; // 目标球半径 (2cm)
    
    // 阶段1: 弹簧发射
    console.log('🌀 阶段1: 弹簧发射');
    const v0 = Math.sqrt(k * x0 * x0 / m); // 发射速度（能量守恒）
    const t1 = 0.1; // 弹簧释放时间（短时间）
    
    for (let i = 0; i <= Math.ceil(t1 / dt); i++) {
      const t = i * dt;
      if (t > t1) break;
      
      // 弹簧压缩逐渐释放
      const compression = x0 * (1 - t / t1);
      const x = -x0 + compression; // 位置（负值表示压缩）
      const v = v0 * (t / t1); // 速度逐渐增加
      
      frames.push({
        time: time + t,
        phase: 'spring_launch',
        bodies: [
          {
            id: 'ball',
            position: [x, 0],
            velocity: [v, 0],
            energy: {
              kinetic: 0.5 * m * v * v,
              elastic: 0.5 * k * compression * compression
            },
            spring_compression: compression
          }
        ]
      });
    }
    
    time += t1;
    console.log(`  发射耗时: ${t1.toFixed(2)}s, 发射速度: ${v0.toFixed(2)}m/s`);

    // 阶段2: 沿斜面滑行
    console.log('📉 阶段2: 沿斜面滑行');
    const rampLength = H / Math.sin(angleRad); // 斜面长度
    const t2 = Math.sqrt(2 * rampLength / (this.g * Math.sin(angleRad))); // 滑行时间
    
    for (let i = 0; i <= Math.ceil(t2 / dt); i++) {
      const t = i * dt;
      if (t > t2) break;
      
      const s = v0 * t + 0.5 * this.g * Math.sin(angleRad) * t * t; // 沿斜面距离
      const v = v0 + this.g * Math.sin(angleRad) * t; // 沿斜面速度
      
      // 确保小球不会超出斜面范围
      const clampedS = Math.min(s, rampLength);
      const x = clampedS * Math.cos(angleRad);
      const y = clampedS * Math.sin(angleRad);
      
      frames.push({
        time: time + t,
        phase: 'ramp_slide',
        bodies: [
          {
            id: 'ball',
            position: [x, y],
            velocity: [v * Math.cos(angleRad), v * Math.sin(angleRad)],
            energy: {
              kinetic: 0.5 * m * v * v,
              potential: m * this.g * y
            }
          }
        ]
      });
    }
    
    time += t2;
    const v_ramp_exit = v0 + this.g * Math.sin(angleRad) * t2; // 离开斜面时的速度
    console.log(`  滑行耗时: ${t2.toFixed(2)}s, 离轨速度: ${v_ramp_exit.toFixed(2)}m/s`);

    // 阶段3: 抛射运动
    console.log('🚀 阶段3: 抛射运动');
    const vx = v_ramp_exit * Math.cos(angleRad); // 水平速度分量
    const vy = v_ramp_exit * Math.sin(angleRad); // 垂直速度分量
    
    // 计算到达相遇点的时间
    const t3 = (vy - Math.sqrt(vy * vy - 2 * this.g * H)) / this.g; // 到达高度H的时间
    
    for (let i = 0; i <= Math.ceil(t3 / dt); i++) {
      const t = i * dt;
      if (t > t3) break;
      
      const x = rampLength * Math.cos(angleRad) + vx * t; // 水平位置
      const y = H - vy * t + 0.5 * this.g * t * t; // 垂直位置
      
      frames.push({
        time: time + t,
        phase: 'projectile',
        bodies: [
          {
            id: 'ball',
            position: [x, y],
            velocity: [vx, vy - this.g * t],
            energy: {
              kinetic: 0.5 * m * (vx * vx + (vy - this.g * t) * (vy - this.g * t)),
              potential: m * this.g * y
            }
          }
        ]
      });
    }
    
    time += t3;
    const x_meeting = rampLength * Math.cos(angleRad) + vx * t3; // 相遇点水平位置
    console.log(`  抛射耗时: ${t3.toFixed(2)}s, 相遇点位置: (${x_meeting.toFixed(2)}, ${H.toFixed(2)})`);

    // 阶段4: 非弹性碰撞
    console.log('💥 阶段4: 非弹性碰撞');
    const vx_meeting = vx; // 相遇时水平速度
    const vy_meeting = vy - this.g * t3; // 相遇时垂直速度
    
    // 碰撞前：两个小球接近
    frames.push({
      time: time,
      phase: 'inelastic_collision',
      bodies: [
        {
          id: 'ball',
          position: [x_meeting - ball_radius - target_radius, H],
          velocity: [vx_meeting, vy_meeting],
          energy: { kinetic: 0.5 * m * (vx_meeting * vx_meeting + vy_meeting * vy_meeting) }
        },
        {
          id: 'target',
          position: [x_meeting, H],
          velocity: [0, 0],
          energy: { kinetic: 0 }
        }
      ]
    });
    
    // 碰撞后：两个小球黏结，共同运动
    const vx_combined = (m * vx_meeting) / (m + M); // 碰撞后水平速度
    const vy_combined = (m * vy_meeting) / (m + M); // 碰撞后垂直速度
    
    frames.push({
      time: time + dt,
      phase: 'combined_motion',
      bodies: [
        {
          id: 'ball_combined',
          position: [x_meeting, H],
          velocity: [vx_combined, vy_combined],
          energy: {
            kinetic: 0.5 * m * (vx_combined * vx_combined + vy_combined * vy_combined),
            lost: 0.5 * m * (vx_meeting * vx_meeting + vy_meeting * vy_meeting) - 
                  0.5 * (m + M) * (vx_combined * vx_combined + vy_combined * vy_combined)
          }
        },
        {
          id: 'target_combined',
          position: [x_meeting, H],
          velocity: [vx_combined, vy_combined],
          energy: {
            kinetic: 0.5 * M * (vx_combined * vx_combined + vy_combined * vy_combined)
          }
        }
      ]
    });
    
    time += dt;
    console.log(`  碰撞后合体速度: ${Math.sqrt(vx_combined * vx_combined + vy_combined * vy_combined).toFixed(2)}m/s`);

    // 阶段5: 合体落地
    console.log('🏃 阶段5: 合体落地');
    const t5 = (vy_combined + Math.sqrt(vy_combined * vy_combined + 2 * this.g * H)) / this.g; // 落地时间
    const x_landing = x_meeting + vx_combined * t5; // 落地点水平位置
    
    for (let i = 0; i <= Math.ceil(t5 / dt); i++) {
      const t = i * dt;
      if (t > t5) break;
      
      const x = x_meeting + vx_combined * t; // 水平位置
      const y = H - vy_combined * t - 0.5 * this.g * t * t; // 垂直位置
      
      frames.push({
        time: time + t,
        phase: 'landing',
        bodies: [
          {
            id: 'ball_combined',
            position: [x, y],
            velocity: [vx_combined, vy_combined - this.g * t],
            energy: {
              kinetic: 0.5 * (m + M) * (vx_combined * vx_combined + (vy_combined - this.g * t) * (vy_combined - this.g * t)),
              potential: (m + M) * this.g * y
            }
          },
          {
            id: 'target_combined',
            position: [x, y],
            velocity: [vx_combined, vy_combined - this.g * t],
            energy: {
              kinetic: 0.5 * (m + M) * (vx_combined * vx_combined + (vy_combined - this.g * t) * (vy_combined - this.g * t)),
              potential: (m + M) * this.g * y
            }
          }
        ]
      });
    }
    
    time += t5;
    console.log(`  落地耗时: ${t5.toFixed(2)}s, 落地点: (${x_landing.toFixed(2)}, 0)`);

    console.log('✅ 弹簧发射小球物理仿真完成');
    console.log(`📊 仿真统计: ${frames.length}帧, ${time.toFixed(2)}s`);

    return {
      frames: frames,
      results: {
        v0: v0.toFixed(3),           // 发射速度
        v_ramp_exit: v_ramp_exit.toFixed(3), // 离轨速度
        v_combined: Math.sqrt(vx_combined * vx_combined + vy_combined * vy_combined).toFixed(3), // 合体速度
        x_landing: x_landing.toFixed(3), // 落地点水平距离
        total_time: time.toFixed(2)
      },
      phases: ['spring_launch', 'ramp_slide', 'projectile', 'inelastic_collision', 'landing']
    };
  }
}

/**
 * 弹簧发射小球物理渲染器
 */
class SpringBallPhysicsRenderer {
  constructor(width = 1200, height = 800) {
    this.width = width;
    this.height = height;
    this.scale = 200; // 像素/米
    this.originX = 150; // 原点X偏移
    this.originY = height - 150; // 原点Y偏移
  }

  /**
   * 渲染弹簧发射小球物理场景
   */
  async renderFrames(simulation, outputDir) {
    console.log('🎨 开始渲染弹簧发射小球物理场景...');
    
    const framesDir = path.join(outputDir, 'frames');
    // 清空旧帧
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
    fs.mkdirSync(framesDir, { recursive: true });

    const frameFiles = [];
    for (let i = 0; i < simulation.frames.length; i++) {
      const frame = simulation.frames[i];
      const canvas = createCanvas(this.width, this.height);
      const ctx = canvas.getContext('2d');

      // 清除背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制物理场景
      this.drawPhysicsScene(ctx, frame);
      
      // 保存帧
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

  drawPhysicsScene(ctx, frame) {
    // 绘制弹簧（在左侧）
    this.drawSpring(ctx, frame);
    
    // 绘制斜面
    this.drawRamp(ctx);
    
    // 绘制地面
    this.drawGround(ctx);
    
    // 绘制小球
    this.drawBalls(ctx, frame);
    
    // 绘制轨迹
    this.drawTrajectory(ctx, frame);
  }

  drawSpring(ctx, frame) {
    const springX = this.originX - 50;
    const springY = this.originY;
    
    // 绘制弹簧固定点
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(springX - 5, springY - 20, 10, 40);
    
    // 绘制弹簧
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const compression = frame.bodies[0]?.spring_compression || 0;
    const springLength = 30 - compression * this.scale;
    
    for (let i = 0; i < 5; i++) {
      const x = springX + (i * springLength / 4);
      const y = springY + Math.sin(i * Math.PI) * 5;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  drawRamp(ctx) {
    // 绘制斜面 (角度30°)
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const angleRad = 30 * Math.PI / 180;
    const rampLength = 0.4 / Math.sin(angleRad) * this.scale; // H=0.4m
    const rampEndX = this.originX + rampLength * Math.cos(angleRad);
    const rampEndY = this.originY;
    
    // 斜面起点（底部）
    const rampStartX = this.originX;
    const rampStartY = this.originY;
    
    // 绘制斜面
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(rampEndX, rampEndY - 0.4 * this.scale);
    ctx.stroke();
    
    // 绘制斜面支撑
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(rampStartX, rampStartY + 20);
    ctx.stroke();
  }

  drawGround(ctx) {
    // 绘制水平地面
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.width, this.originY);
    ctx.stroke();
  }

  drawBalls(ctx, frame) {
    frame.bodies.forEach(body => {
      const x = this.originX + body.position[0] * this.scale;
      const y = this.originY - body.position[1] * this.scale;
      
      // 根据物体类型选择颜色
      let color = '#007bff'; // 默认蓝色
      if (body.id === 'target' || body.id === 'target_combined') {
        color = '#28a745'; // 绿色
      } else if (body.id === 'ball_combined' || body.id === 'target_combined') {
        color = '#ffc107'; // 黄色（合体后）
      }
      
      // 绘制小球
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制小球边框
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 绘制速度向量
      if (body.velocity) {
        const vx = body.velocity[0];
        const vy = body.velocity[1];
        const speed = Math.sqrt(vx * vx + vy * vy);
        
        if (speed > 0.1) {
          ctx.strokeStyle = '#dc3545';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx * this.scale * 0.1, y - vy * this.scale * 0.1);
          ctx.stroke();
        }
      }
    });
  }

  drawTrajectory(ctx, frame) {
    // 绘制轨迹（简化版）
    if (frame.phase === 'projectile' || frame.phase === 'landing') {
      const ball = frame.bodies.find(b => b.id === 'ball' || b.id === 'ball_combined');
      if (ball) {
        const x = this.originX + ball.position[0] * this.scale;
        const y = this.originY - ball.position[1] * this.scale;
        
        // 绘制轨迹点
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

/**
 * 测试弹簧发射小球物理
 */
async function testSpringBallPhysics() {
  try {
    console.log('🚀 开始弹簧发射小球物理测试...');
    
    // 创建输出目录
    const outputDir = path.join(__dirname, 'output_spring_ball');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 创建基于题目的解析结果
    const aiResult = {
      scenario: "弹簧发射-斜面滑行-抛射-非弹性碰撞系统",
      objects: [
        {"id": "ball", "mass": 0.5, "initial_position": "弹簧压缩位置"},
        {"id": "target", "mass": 0.3, "initial_position": "空中等待"}
      ],
      phases: ["spring_launch", "ramp_slide", "projectile", "inelastic_collision", "landing"],
      parameters: {"m": 0.5, "k": 200, "x0": 0.15, "angle": 30, "M": 0.3, "H": 0.40, "g": 9.8},
      targets: ["v0", "v_ramp_exit", "v_combined", "x_landing"],
      note: "基于题目直接提取的参数"
    };
    
    const aiResultPath = path.join(outputDir, 'ai_analysis_spring_ball.json');
    fs.writeFileSync(aiResultPath, JSON.stringify(aiResult, null, 2));
    console.log('📁 参数配置保存到:', aiResultPath);

    // Step 1: 物理仿真
    console.log('\n=== Step 1: 弹簧发射小球物理仿真 ===');
    const simulator = new SpringBallPhysicsSimulator();
    
    // 直接使用硬编码的物理参数
    const params = {
      m: 0.5,     // 小球质量
      k: 200,     // 弹簧劲度系数
      x0: 0.15,   // 弹簧压缩量
      angle: 30,  // 斜面角度
      M: 0.3,     // 目标球质量
      H: 0.40     // 相遇点高度
    };

    const simulation = simulator.simulate(params);
    
    // 保存仿真结果
    const simResultPath = path.join(outputDir, 'simulation_result_spring_ball.json');
    fs.writeFileSync(simResultPath, JSON.stringify(simulation, null, 2));
    console.log('📁 仿真结果保存到:', simResultPath);

    // Step 2: 渲染视频帧
    console.log('\n=== Step 2: 渲染弹簧发射小球动画 ===');
    const renderer = new SpringBallPhysicsRenderer();
    const frameFiles = await renderer.renderFrames(simulation, outputDir);

    // Step 3: 生成视频
    console.log('\n=== Step 3: 生成视频 ===');
    const videoPath = path.join(outputDir, 'spring_ball_physics_animation.mp4');
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

    // 显示最终结果
    console.log('\n🎉 弹簧发射小球物理测试完成！');
    console.log(`  总仿真时间 = ${simulation.results.total_time} s`);
    
    console.log('\n📊 计算结果:');
    console.log(`  1) 离轨速度 v₀ = ${simulation.results.v_ramp_exit} m/s`);
    console.log(`  2) 合体速度大小 = ${simulation.results.v_combined} m/s`);
    console.log(`  3) 落地点水平距离 = ${simulation.results.x_landing} m`);
    
    console.log('\n📁 输出文件:');
    console.log(`  参数配置: ${outputDir}/ai_analysis_spring_ball.json`);
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
  testSpringBallPhysics();
}

module.exports = { SpringBallPhysicsSimulator, SpringBallPhysicsRenderer };
