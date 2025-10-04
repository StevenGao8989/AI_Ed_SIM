// 测试竖直圆环轨道题目：小车下滑进入圆环轨道
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');

// 设置环境变量
require('dotenv').config({ path: '.env.local' });

/**
 * 竖直圆环轨道题目AI解析器
 */
class CircularTrackParser {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }

  async parseCircularTrackQuestion(question) {
    console.log('🤖 调用真实AI解析竖直圆环轨道题目...');
    console.log('📝 题目:', question);
    console.log('🔑 API端点:', this.baseURL);
    
    try {
      console.log('📡 发送API请求...');
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-v3',
          messages: [
            {
              role: 'system',
              content: `你是专业的物理题目解析专家。请将竖直圆环轨道题目解析为结构化的JSON格式，包含以下信息：
1. 物理场景描述：小车从高度下滑进入竖直圆环轨道
2. 物体信息：小车质量m，圆环半径R=1m
3. 运动阶段：下滑→进入圆环→圆周运动→顶点
4. 关键参数：H=2.5m, R=1m, g=9.8m/s²
5. 求解目标：最小高度H_min, 顶点法向力N

输出格式：
{
  "scenario": "竖直圆环轨道系统",
  "objects": [
    {"id": "cart", "mass": "m", "initial_position": "高度H处"}
  ],
  "phases": ["sliding_down", "entering_circle", "circular_motion", "at_top"],
  "parameters": {"H": 2.5, "R": 1.0, "g": 9.8},
  "targets": ["H_min", "N_at_top"]
}`
            },
            {
              role: 'user',
              content: question
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      console.log(`📊 API响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API响应错误: ${response.status} ${response.statusText}`);
        console.error(`❌ 错误详情: ${errorText}`);
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ 收到AI响应');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('AI响应格式异常');
      }
      
      const content = data.choices[0].message.content;
      
      // 尝试解析JSON
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI输出不是有效的JSON格式');
        }
      }

      console.log('✅ AI解析完成');
      return parsed;

    } catch (error) {
      console.error('❌ AI解析失败:', error.message);
      throw error;
    }
  }
}

/**
 * 竖直圆环轨道物理仿真器
 */
class CircularTrackSimulator {
  constructor() {
    this.g = 9.8; // 重力加速度
  }

  simulate(params) {
    console.log('🎯 开始竖直圆环轨道物理仿真...');
    
    // 提取参数
    const m = params.m || 1.0;        // 小车质量
    const H = params.H || 2.5;         // 初始高度
    const R = params.R || 1.0;         // 圆环半径
    const dt = params.dt || 0.01;      // 时间步长

    console.log(`📐 参数确认: m=${m}kg, H=${H}m, R=${R}m`);

    const frames = [];
    let time = 0;

    // 计算关键物理量
    const H_min = 2.5 * R; // 最小高度：H_min = 2.5R
    const v_entry = Math.sqrt(2 * this.g * H); // 进入圆环时的速度
    const v_top = Math.sqrt(this.g * R); // 顶点处的最小速度（不脱离轨道）

    console.log(`📊 关键计算结果:`);
    console.log(`  最小高度 H_min = ${H_min.toFixed(2)}m`);
    console.log(`  进入速度 v_entry = ${v_entry.toFixed(2)}m/s`);
    console.log(`  顶点最小速度 v_top = ${v_top.toFixed(2)}m/s`);

    // 阶段1: 小车从高度H下滑
    console.log('📉 阶段1: 小车从高度H下滑');
    const t1 = Math.sqrt(2 * H / this.g); // 下滑时间
    
    for (let i = 0; i <= Math.ceil(t1 / dt); i++) {
      const t = i * dt;
      if (t > t1) break;
      
      const y = H - 0.5 * this.g * t * t; // 垂直位置
      const v = this.g * t; // 速度
      const x = 0; // 水平位置（垂直下滑）
      
      frames.push({
        time: time + t,
        phase: 'sliding_down',
        bodies: [
          {
            id: 'cart',
            position: [x, y],
            velocity: [0, -v],
            energy: {
              kinetic: 0.5 * m * v * v,
              potential: m * this.g * y
            }
          }
        ]
      });
    }
    time += t1;

    // 阶段2: 进入圆环轨道
    console.log('🔄 阶段2: 进入圆环轨道');
    const entryAngle = Math.PI / 2; // 从底部进入
    const t2 = 0.5; // 进入过程时间
    
    for (let i = 0; i <= Math.ceil(t2 / dt); i++) {
      const t = i * dt;
      if (t > t2) break;
      
      const angle = entryAngle + (Math.PI / 2) * (t / t2); // 从π/2到π
      const x = R * Math.cos(angle);
      const y = R * Math.sin(angle);
      const v_tangent = v_entry; // 切向速度保持
      const vx = -v_tangent * Math.sin(angle);
      const vy = v_tangent * Math.cos(angle);
      
      frames.push({
        time: time + t,
        phase: 'entering_circle',
        bodies: [
          {
            id: 'cart',
            position: [x, y],
            velocity: [vx, vy],
            energy: {
              kinetic: 0.5 * m * v_tangent * v_tangent,
              potential: m * this.g * y
            },
            angle: angle
          }
        ]
      });
    }
    time += t2;

    // 阶段3: 圆周运动到顶点
    console.log('🌀 阶段3: 圆周运动到顶点');
    const startAngle = Math.PI; // 从底部开始
    const endAngle = 0; // 到顶点
    const angularVelocity = v_entry / R; // 角速度
    const t3 = Math.abs(endAngle - startAngle) / angularVelocity; // 运动时间
    
    for (let i = 0; i <= Math.ceil(t3 / dt); i++) {
      const t = i * dt;
      if (t > t3) break;
      
      const angle = startAngle - angularVelocity * t; // 逆时针运动
      const x = R * Math.cos(angle);
      const y = R * Math.sin(angle);
      const v_tangent = v_entry; // 假设无摩擦，速度不变
      const vx = -v_tangent * Math.sin(angle);
      const vy = v_tangent * Math.cos(angle);
      
      // 计算法向力
      const N = m * (v_tangent * v_tangent / R + this.g * Math.sin(angle));
      
      frames.push({
        time: time + t,
        phase: 'circular_motion',
        bodies: [
          {
            id: 'cart',
            position: [x, y],
            velocity: [vx, vy],
            energy: {
              kinetic: 0.5 * m * v_tangent * v_tangent,
              potential: m * this.g * y
            },
            angle: angle,
            normal_force: N
          }
        ]
      });
    }
    time += t3;

    // 阶段4: 在顶点处
    console.log('🎯 阶段4: 在顶点处');
    const t4 = 1.0; // 在顶点停留时间
    const N_at_top = m * (v_entry * v_entry / R - this.g); // 顶点处法向力
    
    for (let i = 0; i <= Math.ceil(t4 / dt); i++) {
      const t = i * dt;
      if (t > t4) break;
      
      frames.push({
        time: time + t,
        phase: 'at_top',
        bodies: [
          {
            id: 'cart',
            position: [R, 0], // 顶点位置
            velocity: [0, -v_entry], // 水平速度为0，垂直向下
            energy: {
              kinetic: 0.5 * m * v_entry * v_entry,
              potential: 0 // 在顶点，势能为0
            },
            angle: 0,
            normal_force: N_at_top
          }
        ]
      });
    }

    console.log(`✅ 仿真完成! 总时间: ${time.toFixed(2)}s, 帧数: ${frames.length}`);

    return {
      frames: frames,
      results: {
        H_min: H_min.toFixed(3),           // 最小高度
        v_entry: v_entry.toFixed(3),       // 进入速度
        v_top: v_top.toFixed(3),           // 顶点最小速度
        N_at_top: N_at_top.toFixed(3),     // 顶点法向力
        total_time: time.toFixed(2)         // 总时间
      },
      phases: ['sliding_down', 'entering_circle', 'circular_motion', 'at_top']
    };
  }
}

/**
 * 竖直圆环轨道渲染器
 */
class CircularTrackRenderer {
  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.scale = 100; // 像素/米
    this.originX = width / 2;
    this.originY = height - 50;
  }

  renderFrames(frames, outputDir) {
    console.log(`🎨 开始渲染 ${frames.length} 帧...`);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    frames.forEach((frame, index) => {
      const canvas = createCanvas(this.width, this.height);
      const ctx = canvas.getContext('2d');
      
      // 清空画布
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      
      // 绘制物理场景
      this.drawPhysicsScene(ctx, frame);
      
      // 保存帧
      const framePath = path.join(outputDir, `frame_${String(index + 1).padStart(6, '0')}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      
      if ((index + 1) % 50 === 0) {
        console.log(`  渲染进度: ${index + 1}/${frames.length} (${((index + 1) / frames.length * 100).toFixed(1)}%)`);
      }
    });

    console.log(`✅ 渲染完成: ${frames.length}帧`);
  }

  drawPhysicsScene(ctx, frame) {
    // 绘制竖直圆环轨道
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(this.originX, this.originY - this.scale, this.scale, 0, 2 * Math.PI);
    ctx.stroke();

    // 绘制下滑轨道
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.originX, this.originY - 2.5 * this.scale);
    ctx.lineTo(this.originX, this.originY - this.scale);
    ctx.stroke();

    // 绘制小车
    frame.bodies?.forEach(body => {
      this.drawBody(ctx, body, frame.phase);
    });

    // 绘制阶段标识
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 18px Arial';
    const phaseNames = {
      'sliding_down': '垂直下滑',
      'entering_circle': '进入圆环',
      'circular_motion': '圆周运动',
      'at_top': '到达顶点'
    };
    ctx.fillText(`阶段: ${phaseNames[frame.phase] || frame.phase}`, 20, 40);

    // 绘制物理量
    this.drawPhysicsInfo(ctx, frame);
  }

  drawBody(ctx, body, phase) {
    const x = this.originX + body.position[0] * this.scale;
    const y = this.originY - body.position[1] * this.scale;

    // 绘制小车
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(x - 8, y - 4, 16, 8);

    // 绘制速度矢量
    if (body.velocity) {
      const vx = body.velocity[0] * this.scale * 0.5;
      const vy = -body.velocity[1] * this.scale * 0.5;
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + vx, y + vy);
      ctx.stroke();

      // 绘制速度箭头
      const angle = Math.atan2(vy, vx);
      const arrowLength = 10;
      ctx.beginPath();
      ctx.moveTo(x + vx, y + vy);
      ctx.lineTo(x + vx - arrowLength * Math.cos(angle - Math.PI / 6), 
                 y + vy - arrowLength * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x + vx, y + vy);
      ctx.lineTo(x + vx - arrowLength * Math.cos(angle + Math.PI / 6), 
                 y + vy - arrowLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }

    // 绘制法向力（在顶点处）
    if (phase === 'at_top' && body.normal_force) {
      ctx.strokeStyle = '#ffc107';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 30);
      ctx.stroke();

      // 绘制法向力标签
      ctx.fillStyle = '#ffc107';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`N=${body.normal_force.toFixed(1)}N`, x + 10, y - 15);
    }
  }

  drawPhysicsInfo(ctx, frame) {
    const lineHeight = 20;
    let y = 80;

    frame.bodies?.forEach(body => {
      if (body.energy) {
        ctx.fillStyle = '#495057';
        ctx.font = '14px Arial';
        ctx.fillText(`动能: ${body.energy.kinetic.toFixed(2)}J`, this.width - 200, y);
        y += lineHeight;
        ctx.fillText(`势能: ${body.energy.potential.toFixed(2)}J`, this.width - 200, y);
        y += lineHeight;
      }
      if (body.normal_force !== undefined) {
        ctx.fillText(`法向力: ${body.normal_force.toFixed(2)}N`, this.width - 200, y);
        y += lineHeight;
      }
    });
  }
}

/**
 * 主测试函数
 */
async function testCircularTrack() {
  console.log('🚀 开始竖直圆环轨道物理测试...');
  
  const outputDir = path.join(__dirname, 'circular_track_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 题目内容
    const question = `小车自高度 2.5m处由静止下滑进入半径为1m的竖直圆环轨道(轨道光滑)(1)求小车通过圆环顶点不脱离轨道的最小 Hin;(2)求顶点处法向力大小。`;

    console.log('📝 测试题目:');
    console.log(question);

    // 初始化AI解析器
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.log('⚠️ 未找到API密钥，使用模拟数据');
      
      // 创建基于题目的解析结果
      const aiResult = {
        scenario: "竖直圆环轨道系统",
        objects: [
          {"id": "cart", "mass": "m", "initial_position": "高度H处"}
        ],
        phases: ["sliding_down", "entering_circle", "circular_motion", "at_top"],
        parameters: {"H": 2.5, "R": 1.0, "g": 9.8},
        targets: ["H_min", "N_at_top"],
        note: "基于题目直接提取的参数"
      };
      
      console.log('✅ 使用模拟AI解析结果');
    } else {
      const parser = new CircularTrackParser(apiKey);
      const aiResult = await parser.parseCircularTrackQuestion(question);
      console.log('✅ AI解析完成');
    }

    // 初始化仿真器
    const simulator = new CircularTrackSimulator();
    
    // 设置仿真参数
    const params = {
      m: 1.0,    // 小车质量
      H: 2.5,    // 初始高度
      R: 1.0,    // 圆环半径
      dt: 0.01   // 时间步长
    };

    const simulation = simulator.simulate(params);

    // 初始化渲染器
    const renderer = new CircularTrackRenderer();
    
    // 渲染帧
    const framesDir = path.join(outputDir, 'frames');
    renderer.renderFrames(simulation.frames, framesDir);

    // 生成视频
    console.log('🎬 开始生成MP4视频...');
    const videoPath = path.join(outputDir, 'circular_track_animation.mp4');
    
    try {
      const ffmpegCmd = `ffmpeg -y -framerate 30 -i ${framesDir}/frame_%06d.png -c:v libx264 -preset medium -crf 23 -b:v 2000k -pix_fmt yuv420p -movflags +faststart "${videoPath}"`;
      console.log(`FFmpeg 命令: ${ffmpegCmd}`);
      
      execSync(ffmpegCmd, { stdio: 'inherit' });
      
      const stats = fs.statSync(videoPath);
      console.log(`✅ 视频生成完成: ${videoPath} (${stats.size} 字节)`);
    } catch (ffmpegError) {
      console.error('❌ FFmpeg视频生成失败:', ffmpegError.message);
      console.log('💡 请确保已安装FFmpeg并添加到PATH');
    }

    // 保存仿真结果
    const resultsPath = path.join(outputDir, 'simulation_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      question: question,
      parameters: params,
      results: simulation.results,
      phases: simulation.phases,
      frameCount: simulation.frames.length
    }, null, 2));

    // 显示最终结果
    console.log('\n🎉 竖直圆环轨道测试完成！');
    console.log('\n📊 物理计算结果:');
    console.log(`  最小高度 H_min = ${simulation.results.H_min} m`);
    console.log(`  进入速度 v_entry = ${simulation.results.v_entry} m/s`);
    console.log(`  顶点最小速度 v_top = ${simulation.results.v_top} m/s`);
    console.log(`  顶点法向力 N_at_top = ${simulation.results.N_at_top} N`);
    console.log(`  总仿真时间 = ${simulation.results.total_time} s`);
    
    console.log('\n📁 输出文件:');
    console.log(`  仿真结果: ${resultsPath}`);
    console.log(`  PNG帧目录: ${framesDir}`);
    console.log(`  MP4视频: ${videoPath}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testCircularTrack().catch(console.error);
}

module.exports = { CircularTrackParser, CircularTrackSimulator, CircularTrackRenderer };
