// 测试复杂物理题目：斜面+摩擦+非弹性碰撞+弹簧压缩
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');

// 设置环境变量
require('dotenv').config({ path: '.env.local' });

// /**
//  * 复杂物理题目AI解析器
//  */
// class ComplexPhysicsParser {
//   constructor(apiKey) {
//     this.apiKey = apiKey;
//     this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
//   }

//   async parseComplexQuestion(question) {
//     console.log('🤖 调用真实AI解析复杂物理题目...');
//     console.log('📝 题目:', question);
//     console.log('🔑 API端点:', this.baseURL);
    
//     try {
//       console.log('📡 发送API请求...');
//       const response = await fetch(`${this.baseURL}/chat/completions`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${this.apiKey}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           model: 'deepseek-v3',
//           messages: [
//             {
//               role: 'system',
//               content: `你是专业的物理题目解析专家。请将物理题目解析为结构化的JSON格式，包含以下信息：
// 1. 物理场景描述  
// 2. 物体信息：小滑块(m=1kg)和静止木块(M=2kg)
// 3. 运动阶段：光滑斜面→粗糙面→非弹性碰撞→弹簧压缩
// 4. 关键参数：h=1.25m, μ=0.25, d=2.0m, k=150N/m
// 5. 求解目标：v₀, v₁, v'

// 输出格式：
// {
//   "scenario": "斜面-摩擦-碰撞-弹簧系统",
//   "objects": [
//     {"id": "block1", "mass": 1.0, "initial_position": "斜面顶端"},
//     {"id": "block2", "mass": 2.0, "initial_position": "静止等待"}
//   ],
//   "phases": ["smooth_ramp", "rough_surface", "collision", "spring"],
//   "parameters": {"h": 1.25, "mu": 0.25, "d": 2.0, "k": 150, "g": 9.8},
//   "targets": ["v0", "v1", "v_combined"]
// }`
//             },
//             {
//               role: 'user',
//               content: question
//             }
//           ],
//           temperature: 0.1,
//           max_tokens: 2000
//         })
//       });

//       console.log(`📊 API响应状态: ${response.status}`);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(`❌ API响应错误: ${response.status} ${response.statusText}`);
//         console.error(`❌ 错误详情: ${errorText}`);
//         throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
//       }

//       const data = await response.json();
//       console.log('✅ 收到AI响应');
      
//       if (!data.choices || !data.choices[0] || !data.choices[0].message) {
//         throw new Error('AI响应格式异常');
//       }
      
//       const content = data.choices[0].message.content;
      
//       // 尝试解析JSON
//       let parsed;
//       try {
//         parsed = JSON.parse(content);
//       } catch (parseError) {
//         // 如果直接解析失败，尝试提取JSON部分
//         const jsonMatch = content.match(/\{[\s\S]*\}/);
//         if (jsonMatch) {
//           parsed = JSON.parse(jsonMatch[0]);
//         } else {
//           throw new Error('AI输出不是有效的JSON格式');
//         }
//       }

//       console.log('✅ AI解析完成');
//       return parsed;

//     } catch (error) {
//       console.error('❌ AI解析失败:', error.message);
//       throw error;
//     }
//   }
// }

/**
 * 复杂物理仿真器
 */
class ComplexPhysicsSimulator {
  constructor() {
    this.g = 9.8; // 重力加速度
  }

  /**
   * 仿真复杂物理过程
   */
  simulate(params) {
    console.log('⚡ 开始复杂物理仿真...');
    console.log('📊 物理参数:', params);

    const frames = [];
    const dt = 0.005; // 更小的时间步长，展示更流畅的运动
    
    // 提取参数
    const m1 = params.m1 || 1.0;      // 小滑块质量
    const M = params.M || 2.0;        // 大木块质量
    const h = params.h || 1.25;       // 斜面高度
    const mu = params.mu || 0.25;     // 摩擦系数
    const d = params.d || 2.0;        // 粗糙段长度
    const k = params.k || 150;        // 弹簧劲度系数
    const angle = params.angle || 30; // 斜面角度（度）



    const angleRad = angle * Math.PI / 180;
    let time = 0;

    // 计算关键位置
    // 定义物体尺寸（用于位置计算）
    const block1_width = 0.08; // 小滑块宽度 (8cm)
    const block2_width = 0.12; // 大木块宽度 (12cm)
    
    // 粗糙面终点 = 绿色物块左边界位置
    const rough_surface_end = h / Math.tan(angleRad) + d - block1_width; // 粗糙面终点
    const x_collision = rough_surface_end + block2_width/2; // 绿色物块中心位置

    // 阶段1: 光滑斜面滑下
    console.log('📉 阶段1: 光滑斜面滑下');
    const v0 = Math.sqrt(2 * this.g * h); // 到达斜面底端的速度
    const rampLength = h / Math.sin(angleRad); // 斜面总长度
    const t1 = Math.sqrt(2 * rampLength / (this.g * Math.sin(angleRad))); // 滑下时间（基于斜面长度）
    
    for (let i = 0; i <= Math.ceil(t1 / dt); i++) {
      const t = i * dt;
      if (t > t1) break;
      
      const s = 0.5 * this.g * Math.sin(angleRad) * t * t; // 沿斜面距离
      const v = this.g * Math.sin(angleRad) * t; // 沿斜面速度
      
      // 确保物块不会超出斜面范围
      const clampedS = Math.min(s, rampLength);
      const clampedX = clampedS * Math.cos(angleRad);
      const clampedY = h - clampedS * Math.sin(angleRad);
      
      frames.push({
        time: time + t,
        phase: 'smooth_ramp',
        bodies: [
          {
            id: 'block1',
            position: [clampedX, clampedY], // 使用修正后的位置
            velocity: [v * Math.cos(angleRad), -v * Math.sin(angleRad)],
            energy: {
              kinetic: 0.5 * m1 * v * v,
              potential: m1 * this.g * clampedY,
              total: m1 * this.g * h
            }
          },
          {
            id: 'block2',
            position: [x_collision, 0], // 静止木块始终在碰撞位置
            velocity: [0, 0],
            energy: { kinetic: 0, potential: 0 }
          }
        ]
      });
    }
    
    time += t1;
    console.log(`  滑下耗时: ${t1.toFixed(2)}s, 底端速度: ${v0.toFixed(2)}m/s`);

    // 阶段2: 水平粗糙面减速
    console.log('🛤️ 阶段2: 水平粗糙面减速');
    const a2 = -mu * this.g; // 减速度
    const t2 = Math.min(v0 / (mu * this.g), Math.sqrt(2 * d / (mu * this.g))); // 减速时间
    const v1 = Math.max(0, v0 + a2 * t2); // 粗糙段末端速度
    
    for (let i = 0; i <= Math.ceil(t2 / dt); i++) {
      const t = i * dt;
      if (t > t2) break;
      
      const x = h / Math.tan(angleRad) + v0 * t + 0.5 * a2 * t * t ;
      const v = v0 + a2 * t;
      
      if (x > rough_surface_end) break; // 超过粗糙段（绿色物块左边界）
      
      frames.push({
        time: time + t,
        phase: 'rough_surface',
        bodies: [
          {
            id: 'block1',
            position: [x, 0],
            velocity: [v, 0],
            energy: {
              kinetic: 0.5 * m1 * v * v,
              potential: 0,
              work_friction: -mu * m1 * this.g * (x - h / Math.tan(angleRad))
            }
          },
          {
            id: 'block2',
            position: [x_collision, 0], // 静止木块始终在碰撞位置
            velocity: [0, 0],
            energy: { kinetic: 0, potential: 0 }
          }
        ]
      });
    }
    
    time += t2;
    console.log(`  减速耗时: ${t2.toFixed(2)}s, 末端速度: ${v1.toFixed(2)}m/s`);

    // 阶段3: 完全非弹性碰撞
    console.log('💥 阶段3: 完全非弹性碰撞');
    const v_after = (m1 * v1) / (m1 + M); // 碰撞后共同速度
    
    // 物体尺寸已在前面定义
    
    // 碰撞前：两个物体接近
    frames.push({
      time: time,
      phase: 'inelastic_collision',
      bodies: [
        {
          id: 'block1',
          position: [x_collision - block2_width/2 - block1_width/2, 0], // 小滑块接近大木块
          velocity: [v1, 0],
          energy: { kinetic: 0.5 * m1 * v1 * v1 }
        },
        {
          id: 'block2',
          position: [x_collision, 0], // 大木块在碰撞位置
          velocity: [0, 0],
          energy: { kinetic: 0 }
        }
      ]
    });
    
    // 碰撞瞬间：两个物体贴合
    frames.push({
      time: time + dt/2,
      phase: 'inelastic_collision',
      bodies: [
        {
          id: 'block1',
          position: [x_collision - block2_width/2 - block1_width/2, 0], // 小滑块在绿色物块左边界
          velocity: [v1, 0],
          energy: { kinetic: 0.5 * m1 * v1 * v1 }
        },
        {
          id: 'block2',
          position: [x_collision + block1_width/2 + block2_width/2, 0], // 大木块在碰撞位置
          velocity: [0, 0],
          energy: { kinetic: 0 }
        }
      ]
    });
    
    // 碰撞后：两个物体紧密接触，共同运动，但保持各自的形状
    
    frames.push({
      time: time + dt,
      phase: 'combined_motion',
      bodies: [
        {
          id: 'block1_stuck',
          position: [x_collision - block2_width/2 - block1_width/2, 0], // 小滑块右边界与绿色物块左边界重合
          velocity: [v_after, 0],
          energy: {
            kinetic: 0.5 * m1 * v_after * v_after,
            lost: 0.5 * m1 * v1 * v1 - 0.5 * (m1 + M) * v_after * v_after
          }
        },
        {
          id: 'block2_stuck',
          position: [x_collision + block1_width/2 + block2_width/2, 0], // 大木块左边界与蓝色物块右边界重合
          velocity: [v_after, 0],
          energy: {
            kinetic: 0.5 * M * v_after * v_after
          }
        }
      ]
    });
    
    time += dt;
    console.log(`  碰撞后共同速度: ${v_after.toFixed(2)}m/s`);

    // 阶段4: 弹簧压缩（只到最大压缩量，不展示振动）
    console.log('🌀 阶段4: 弹簧压缩');
    const omega = Math.sqrt(k / (m1 + M)); // 角频率
    const A = v_after / omega; // 振幅（最大压缩量）
    
    // 使用匀减速运动计算到最大压缩的时间
    // 从碰撞后速度 v_after 减速到 0，加速度为 -k*x/(m1+M)
    // 当弹簧压缩 x 时，恢复力为 kx，加速度为 -kx/(m1+M)
    // 使用能量守恒：0.5*(m1+M)*v_after^2 = 0.5*k*A^2
    const t4_max = Math.PI / (2 * omega); // 到达最大压缩的时间
    
    for (let i = 0; i <= Math.ceil(t4_max / dt); i++) {
      const t = i * dt;
      if (t > t4_max) break;
      
      const x_spring = A * Math.sin(omega * t); // 弹簧压缩位移（向右为正）
      const v_spring = A * omega * Math.cos(omega * t); // 速度
      const compression = x_spring; // 压缩量
      
      frames.push({
        time: time + t,
        phase: 'spring_compression',
        bodies: [
        {
          id: 'block1_stuck',
          position: [x_collision + x_spring - block2_width/2 - block1_width/2, 0], // 小滑块右边界与绿色物块左边界重合
          velocity: [v_spring, 0],
            energy: {
              kinetic: 0.5 * m1 * v_spring * v_spring,
              elastic: 0.5 * k * compression * compression * (m1 / (m1 + M))
            },
            spring_compression: compression
          },
          {
            id: 'block2_stuck',
            position: [x_collision + x_spring + block1_width/2 + block2_width/2, 0], // 大木块左边界与蓝色物块右边界重合
            velocity: [v_spring, 0],
            energy: {
              kinetic: 0.5 * M * v_spring * v_spring,
              elastic: 0.5 * k * compression * compression * (M / (m1 + M))
            },
            spring_compression: compression
          }
        ]
      });
    }
    
    // 添加最终状态：弹簧达到最大压缩，物体停止
    frames.push({
      time: time + t4_max,
      phase: 'spring_max_compression',
      bodies: [
        {
          id: 'block1_stuck',
          position: [x_collision + A - block2_width/2 - block1_width/2, 0], // 小滑块右边界与绿色物块左边界重合
          velocity: [0, 0], // 停止
          energy: {
            kinetic: 0,
            elastic: 0.5 * k * A * A * (m1 / (m1 + M))
          },
          spring_compression: A
        },
        {
          id: 'block2_stuck',
          position: [x_collision + A + block1_width/2 + block2_width/2, 0], // 大木块左边界与蓝色物块右边界重合
          velocity: [0, 0], // 停止
          energy: {
            kinetic: 0,
            elastic: 0.5 * k * A * A * (M / (m1 + M))
          },
          spring_compression: A
        }
      ]
    });
    
    time += t4_max;
    const max_compression = A;
    console.log(`  最大压缩量: ${max_compression.toFixed(3)}m`);

    console.log('✅ 复杂物理仿真完成');
    console.log(`📊 仿真统计: ${frames.length}帧, ${time.toFixed(2)}s`);

    return {
      frames: frames,
      results: {
        v0: v0.toFixed(3),           // 到达斜面底端速度
        v1: v1.toFixed(3),           // 穿过粗糙段速度  
        v_combined: v_after.toFixed(3), // 碰撞后共同速度
        max_compression: max_compression.toFixed(3), // 最大压缩量
        total_time: time.toFixed(2)
      },
      phases: ['smooth_ramp', 'rough_surface', 'inelastic_collision', 'spring_compression']
    };
  }
}

/**
 * 复杂物理渲染器
 */
class ComplexPhysicsRenderer {
  constructor(width = 1200, height = 800) {
    this.width = width;
    this.height = height;
    this.scale = 100; // 像素/米
    this.originX = 100; // 原点X偏移
    this.originY = height - 100; // 原点Y偏移
  }

  /**
   * 渲染复杂物理场景
   */
  async renderFrames(simulation, outputDir) {
    console.log('🎨 开始渲染复杂物理场景...');
    
    const framesDir = path.join(outputDir, 'frames');
  // ✅ 清空旧帧，避免把历史帧编码进新视频
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
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制网格
      //this.drawGrid(ctx);
      
      // 绘制物理场景
      this.drawPhysicsScene(ctx, frame);
      
      // 绘制信息面板
      //this.drawInfoPanel(ctx, frame, simulation.results);

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
    // 绘制斜面 (h=1.25m, 角度30°)
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const angleRad = 30 * Math.PI / 180;
    const rampLength = 1.25 / Math.sin(angleRad) * this.scale;
    const rampEndX = this.originX + rampLength * Math.cos(angleRad);
    const rampEndY = this.originY;
    
    // 斜面起点（顶部）
    const rampStartX = this.originX;
    const rampStartY = this.originY - 1.25 * this.scale;
    
    // 绘制斜面
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(rampEndX, rampEndY);
    ctx.stroke();
    
    // 绘制斜面延长线（确保物块运动轨迹可见）
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(rampStartX - 50, rampStartY + 50 * Math.tan(angleRad));
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制水平面
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rampEndX, rampEndY);
    ctx.lineTo(rampEndX + 2.0 * this.scale, rampEndY); // 粗糙段 d=2.0m
    ctx.stroke();
    
    // 绘制光滑段
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rampEndX + 2.0 * this.scale, rampEndY);
    ctx.lineTo(rampEndX + 4.0 * this.scale, rampEndY); // 光滑段
    ctx.stroke();

    // 绘制弹簧 - 弹簧最左端与绿色物块最右端贴合
    const block2_width_spring = 0.12; // 大木块宽度 (12cm)
    const h_spring = 1.25; // 斜面高度
    const d_spring = 2.0; // 粗糙段长度
    const angleRad_spring = 30 * Math.PI / 180;
    const rough_surface_end_spring = h_spring / Math.tan(angleRad_spring) + d_spring - 0.08; // 粗糙面终点
    const x_collision_spring = rough_surface_end_spring + block2_width_spring/2; // 绿色物块中心位置
    const greenBlockRightEdge = x_collision_spring + block2_width_spring/2; // 绿色物块右边界
    const springStartX = this.originX + greenBlockRightEdge * this.scale; // 弹簧起始位置（绿色物块右边界）
    
    if (frame.phase === 'spring_compression') {
      this.drawSpring(ctx, springStartX, rampEndY, frame.bodies[0]?.spring_compression || 0);
    } else {
      this.drawSpring(ctx, springStartX, rampEndY, 0);
    }

    // 绘制物体
    frame.bodies?.forEach(body => {
      this.drawBody(ctx, body, frame.phase);
    });

    // 绘制粘合连接线（如果存在粘合状态的物体）
    if (frame.phase === 'combined_motion' || frame.phase === 'spring_compression' || frame.phase === 'spring_max_compression') {
      this.drawConnectionLine(ctx, frame);
    }

    // 绘制阶段标识
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 18px Arial';
    const phaseNames = {
      'smooth_ramp': '光滑斜面',
      'rough_surface': '粗糙面减速', 
      'inelastic_collision': '非弹性碰撞',
      'combined_motion': '粘合运动',
      'spring_compression': '弹簧压缩',
      'spring_max_compression': '弹簧最大压缩'
    };
    ctx.fillText(`阶段: ${phaseNames[frame.phase] || frame.phase}`, 20, 40);
  }

  drawBody(ctx, body, phase) {
    const x = this.originX + body.position[0] * this.scale;
    
    // 根据物体位置计算正确的y坐标和旋转角度
    let y, rotationAngle = 0;
    const angleRad = 30 * Math.PI / 180;
    const rampLength = 1.25 / Math.sin(angleRad);
    const rampEndX = rampLength * Math.cos(angleRad);
    
    if (body.position[0] <= rampEndX) {
      // 物体在斜面上 - 需要旋转以贴合斜面
      const s = body.position[0] / Math.cos(angleRad); // 沿斜面的距离
      y = this.originY - (1.25 - s * Math.sin(angleRad)) * this.scale;
      rotationAngle = angleRad; // 与斜面角度一致
    } else {
      // 物体在水平地面上 - 保持水平
      y = this.originY;
      rotationAngle = 0;
    }

    // 保存当前画布状态
    ctx.save();
    
    // 移动到物体中心并旋转
    ctx.translate(x, y);
    ctx.rotate(rotationAngle);

    // 根据物体ID设置不同的颜色和样式
    if (body.id === 'block1' || body.id === 'block1_stuck') {
      ctx.fillStyle = '#007bff'; // 蓝色小滑块
      ctx.strokeStyle = '#0056b3';
      ctx.lineWidth = 2;
    } else if (body.id === 'block2' || body.id === 'block2_stuck') {
      ctx.fillStyle = '#28a745'; // 绿色大木块
      ctx.strokeStyle = '#1e7e34';
      ctx.lineWidth = 2;
    } else if (body.id === 'combined') {
      ctx.fillStyle = '#fd7e14'; // 橙色组合体（如果存在）
    }

    // 绘制物体 - 底部边缘贴合表面
    ctx.beginPath();
    if (body.id === 'block1' || body.id === 'block1_stuck') {
      ctx.rect(-12, -24, 24, 24); // 小滑块：底部在y=0，顶部在y=-24 (增大50%)
    } else if (body.id === 'block2' || body.id === 'block2_stuck') {
      ctx.rect(-18, -36, 36, 36); // 大木块：底部在y=0，顶部在y=-36 (增大50%)
    } else if (body.id === 'combined') {
      ctx.rect(-22, -30, 44, 30); // 组合体：底部在y=0，顶部在y=-30 (增大约47%)
    }
    ctx.fill();
    ctx.stroke();
    
    // 恢复画布状态
    ctx.restore();
    
    // 添加标签（不旋转）
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 12px Arial';
    if (body.id === 'block1' || body.id === 'block1_stuck') {
      ctx.fillText('m=1kg', x - 20, y - 20); // 标签在物块上方
    } else if (body.id === 'block2' || body.id === 'block2_stuck') {
      ctx.fillText('M=2kg', x - 25, y - 28); // 标签在物块上方
    }

    // 速度向量已删除
  }

  /**
   * 绘制两个粘合物体之间的连接线
   */
  drawConnectionLine(ctx, frame) {
    // 查找粘合状态的物体
    const stuckBodies = frame.bodies?.filter(body => 
      body.id === 'block1_stuck' || body.id === 'block2_stuck'
    );
    
    if (stuckBodies && stuckBodies.length >= 2) {
      const body1 = stuckBodies[0];
      const body2 = stuckBodies[1];
      
      const x1 = this.originX + body1.position[0] * this.scale;
      const y1 = this.originY - body1.position[1] * this.scale;
      const x2 = this.originX + body2.position[0] * this.scale;
      const y2 = this.originY - body2.position[1] * this.scale;
      
      // 绘制接触面标识（在接触点绘制一条线）
      ctx.strokeStyle = '#ffc107';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      const contactX = (x1 + x2) / 2; // 接触面中心
      ctx.moveTo(contactX, y1 - 15);
      ctx.lineTo(contactX, y1 + 15);
      ctx.stroke();
      
      // 在接触面上方添加"接触"标识
      ctx.fillStyle = '#ffc107';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('接触', contactX - 10, y1 - 20);
    }
  }

  drawSpring(ctx, x, y, compression) {
    const springLength = 50;
    const compressedLength = springLength - compression * this.scale;
    
    // 弹簧绘制在水平面上方，避免穿插
    const springY = y - 30; // 弹簧中心在水平面上方30像素
    
    // 弹簧左端直接连接到物块，无需连接杆
    
    // 绘制弹簧螺旋（从左到右被压缩）
    ctx.strokeStyle = '#212529';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const coils = 8;
    const coilWidth = 10;
    
    for (let i = 0; i <= coils * 4; i++) {
      const t = i / (coils * 4);
      const springX = x + t * compressedLength; // 弹簧从x开始，向右延伸到压缩后的长度
      const springYPos = springY + coilWidth * Math.sin(i * Math.PI / 2);
      
      if (i === 0) {
        ctx.moveTo(springX, springYPos);
      } else {
        ctx.lineTo(springX, springYPos);
      }
    }
    ctx.stroke();

    // 绘制弹簧右端固定端（红色墙壁，向右挤压弹簧）
    ctx.strokeStyle = '#dc3545'; // 红色
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + compressedLength, springY - 25);
    ctx.lineTo(x + compressedLength, springY + 25);
    ctx.stroke();
    
    // 挤压箭头已删除
    
    // 添加固定端标识
    ctx.fillStyle = '#dc3545';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('固定挤压', x + compressedLength - 25, springY - 30);
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
    
    ctx.fillText(`阶段: ${frame.phase}`, this.width - 340, y);
    y += lineHeight;

    if (frame.bodies && frame.bodies.length > 0) {
      const body = frame.bodies[0];
      ctx.fillText(`位置: (${body.position[0].toFixed(2)}, ${body.position[1].toFixed(2)})m`, this.width - 340, y);
      y += lineHeight;
      
      ctx.fillText(`速度: (${body.velocity[0].toFixed(2)}, ${body.velocity[1].toFixed(2)})m/s`, this.width - 340, y);
      y += lineHeight;

      if (body.energy) {
        if (body.energy.kinetic !== undefined) {
          ctx.fillText(`动能: ${body.energy.kinetic.toFixed(2)}J`, this.width - 340, y);
          y += lineHeight;
        }
        if (body.energy.potential !== undefined) {
          ctx.fillText(`势能: ${body.energy.potential.toFixed(2)}J`, this.width - 340, y);
          y += lineHeight;
        }
        if (body.spring_compression !== undefined) {
          ctx.fillText(`弹簧压缩: ${body.spring_compression.toFixed(3)}m`, this.width - 340, y);
          y += lineHeight;
        }
      }
    }

    // 绘制最终结果（如果有）
    if (results && frame.time > 2.0) {
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#28a745';
      ctx.fillText(`v₀ = ${results.v0} m/s`, this.width - 340, y);
      y += lineHeight;
      ctx.fillText(`v₁ = ${results.v1} m/s`, this.width - 340, y);
      y += lineHeight;
      ctx.fillText(`最大压缩 = ${results.max_compression} m`, this.width - 340, y);
    }
  }
}

/**
 * 主测试函数
 */
async function testComplexPhysics() {
  console.log('🚀 开始复杂物理题目测试');
  
  // // 检查API密钥（已注释）
  // const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  // if (!apiKey) {
  //   console.error('❌ 未找到DeepSeek API密钥');
  //   console.error('请在.env.local文件中设置 NEXT_PUBLIC_DEEPSEEK_API_KEY');
  //   process.exit(1);
  // }

  const outputDir = './output_complex';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 题目内容
    const question = `质量为 m = 1.0kg 的小滑块从光滑斜面顶端由静止释放。斜面高度 h = 1.25 m。滑到最低点后进入水平粗糙面，动摩擦因数 μ = 0.25，粗糙段长度 d = 2.0 m。通过粗糙段末端时，小滑块与一静止木块（质量 M = 2.0 kg）完全非弹性碰撞并粘在一起，随后共同压缩前方一轻弹簧（劲度系数 k = 150 N/m），直到瞬时停下。取 g = 9.8 m/s²。

1. 求小滑块到达斜面底端的速度 v₀。
2. 求小滑块穿过粗糙段末端的速度 v₁。  
3. 求粘在一起后组合体的速度 v'。`;

    // // Step 1: AI解析（已注释）
    // console.log('\n=== Step 1: AI解析复杂物理题目 ===');
    // let aiResult;
    
    // try {
    //   const parser = new ComplexPhysicsParser(apiKey);
    //   aiResult = await parser.parseComplexQuestion(question);
      
    //   // 保存AI解析结果
    //   const aiResultPath = path.join(outputDir, 'ai_analysis.json');
    //   fs.writeFileSync(aiResultPath, JSON.stringify(aiResult, null, 2));
    //   console.log('📁 AI解析结果保存到:', aiResultPath);
      
    // } catch (aiError) {
    //   console.log(`⚠️ AI解析失败: ${aiError.message}`);
    //   console.log('🔧 使用题目直接提取的参数继续...');
      
      // 创建基于题目的解析结果
      const aiResult = {
        scenario: "斜面-摩擦-碰撞-弹簧系统",
        objects: [
          {"id": "block1", "mass": 1.0, "initial_position": "斜面顶端"},
          {"id": "block2", "mass": 2.0, "initial_position": "静止等待"}
        ],
        phases: ["smooth_ramp", "rough_surface", "collision", "spring"],
        parameters: {"h": 1.25, "mu": 0.25, "d": 2.0, "k": 150, "g": 9.8},
        targets: ["v0", "v1", "v_combined"],
        note: "基于题目直接提取的参数（AI解析已禁用）"
      };
      
      const aiResultPath = path.join(outputDir, 'ai_analysis_fallback.json');
      fs.writeFileSync(aiResultPath, JSON.stringify(aiResult, null, 2));
      console.log('📁 参数配置保存到:', aiResultPath);
    // }

    // Step 1: 物理仿真（AI解析已禁用）
    console.log('\n=== Step 1: 复杂物理仿真 ===');
    const simulator = new ComplexPhysicsSimulator();
    
    // 直接使用硬编码的物理参数
    const params = {
      m1: 1.0,    // 小滑块质量
      M: 2.0,     // 大木块质量  
      h: 1.25,    // 斜面高度
      mu: 0.25,   // 摩擦系数
      d: 2.0,     // 粗糙段长度
      k: 150,     // 弹簧劲度系数
      angle: 30   // 斜面角度
    };

    const simulation = simulator.simulate(params);
    
    // 保存仿真结果
    const simResultPath = path.join(outputDir, 'simulation_result.json');
    fs.writeFileSync(simResultPath, JSON.stringify(simulation, null, 2));
    console.log('📁 仿真结果保存到:', simResultPath);

    // Step 2: 渲染视频帧
    console.log('\n=== Step 2: 渲染复杂物理动画 ===');
    const renderer = new ComplexPhysicsRenderer();
    const frameFiles = await renderer.renderFrames(simulation, outputDir);

    // Step 3: 生成视频
    console.log('\n=== Step 3: 生成视频 ===');
    const videoPath = path.join(outputDir, 'complex_physics_animation.mp4');
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
    console.log('\n🎉 复杂物理测试完成！');
    console.log(`  总仿真时间 = ${simulation.results.total_time} s`);
    
    console.log('\n📁 输出文件:');
    console.log(`  参数配置: ${outputDir}/ai_analysis_fallback.json`);
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
  testComplexPhysics();
}

// module.exports = { ComplexPhysicsParser, ComplexPhysicsSimulator, ComplexPhysicsRenderer };
module.exports = { ComplexPhysicsSimulator, ComplexPhysicsRenderer };
 