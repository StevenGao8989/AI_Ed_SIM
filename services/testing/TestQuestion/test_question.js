#!/usr/bin/env node
// services/testing/TestQuestion/test_question.js
// 统一测试入口 - 基于ARCHITECTURE.md v4.1.0架构
// 调用真实AI解析，生成符合物理逻辑的动画视频

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 设置环境变量
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

// 导入架构模块
const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller');
const { ContractAdapter } = require('../../dsl/adapter');
const { ContractValidator } = require('../../dsl/validator');
const { PhysicsSimulationEngine } = require('../../simulation/engine');
const { VCSEvaluator } = require('../../qa/vcs');
const { FrameRasterizer } = require('../../rendering/rasterizer');
const { FFmpegEncoder } = require('../../export/ffmpeg');

/**
 * 统一物理测试入口
 * 基于ARCHITECTURE.md v4.1.0确定性流水线架构
 */
class UniversalPhysicsTest {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './test_output';
    this.question = options.question || '';
    this.apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('❌ 未找到API密钥，请设置NEXT_PUBLIC_DEEPSEEK_API_KEY或DEEPSEEK_API_KEY');
    }
    
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 运行完整的物理测试流水线
   */
  async runTest(question) {
    console.log('🚀 开始统一物理测试');
    console.log('📝 题目:', question);
    console.log('🎯 架构版本: v4.1.0 (确定性流水线)');
    console.log('');

    const startTime = Date.now();
    const results = {};

    try {
      // Step 1: AI解析 - 生成结构化Contract
      console.log('=== Step 1: AI解析 ===');
      results.aiParsing = await this.step1_AIParsing(question);
      
      // Step 2: Contract适配 - AI结果转换为PhysicsContract
      console.log('\n=== Step 2: Contract适配 ===');
      results.contractAdaptation = await this.step2_ContractAdaptation(results.aiParsing);
      
      // Step 3: Pre-Sim Gate - 硬校验
      console.log('\n=== Step 3: Pre-Sim Gate ===');
      results.preSimGate = await this.step3_PreSimGate(results.contractAdaptation);
      
      if (!results.preSimGate.ok) {
        throw new Error(`❌ Pre-Sim Gate失败: ${results.preSimGate.errors.join(', ')}`);
      }
      
      // Step 4: 确定性仿真
      console.log('\n=== Step 4: 确定性仿真 ===');
      results.simulation = await this.step4_Simulation(results.contractAdaptation);
      
      // Step 5: Post-Sim Gate - 验收测试 + VCS评分
      console.log('\n=== Step 5: Post-Sim Gate ===');
      results.postSimGate = await this.step5_PostSimGate(results.simulation, results.contractAdaptation);
      
      // Step 6: 帧渲染
      console.log('\n=== Step 6: 帧渲染 ===');
      results.rendering = await this.step6_Rendering(results.simulation, results.contractAdaptation);
      
      // Step 7: 视频导出
      console.log('\n=== Step 7: 视频导出 ===');
      results.export = await this.step7_Export(results.rendering);
      
      // Step 8: 结果汇总
      console.log('\n=== Step 8: 结果汇总 ===');
      results.summary = await this.step8_Summary(results);
      
      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`\n✅ 统一物理测试完成! 总耗时: ${totalTime.toFixed(2)}s`);
      
      return results;
      
    } catch (error) {
      console.error('\n❌ 测试失败:', error.message);
      console.error(error.stack);
      
      // 保存错误信息
      const errorReport = {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        question: question,
        results: results
      };
      
      fs.writeFileSync(
        path.join(this.outputDir, 'error_report.json'),
        JSON.stringify(errorReport, null, 2)
      );
      
      throw error;
    }
  }

  /**
   * Step 1: AI解析 - 调用真实AI生成结构化Contract
   */
  async step1_AIParsing(question) {
    console.log('🤖 调用真实AI解析物理题目...');
    
    const parser = new PhysicsAIParserAICaller(this.apiKey);
    const aiResult = await parser.parseQuestion(question);
    
    // 保存AI解析结果
    const aiResultPath = path.join(this.outputDir, '01_ai_analysis.json');
    fs.writeFileSync(aiResultPath, JSON.stringify(aiResult, null, 2));
    console.log('✅ AI解析完成');
    console.log('📁 AI解析结果 →', aiResultPath);
    
    return aiResult;
  }

  /**
   * Step 2: Contract适配 - AI结果转换为PhysicsContract
   */
  async step2_ContractAdaptation(aiResult) {
    console.log('🔄 适配AI结果为PhysicsContract...');
    
    const adapter = new ContractAdapter();
    const adaptedContract = adapter.adapt(aiResult);
    
    // 保存适配后的Contract
    const contractPath = path.join(this.outputDir, '02_physics_contract.json');
    fs.writeFileSync(contractPath, JSON.stringify(adaptedContract, null, 2));
    console.log('✅ Contract适配完成');
    console.log('📁 PhysicsContract →', contractPath);
    
    return adaptedContract;
  }

  /**
   * Step 3: Pre-Sim Gate - 硬校验
   */
  async step3_PreSimGate(contract) {
    console.log('🔍 Pre-Sim Gate硬校验...');
    
    const validator = new ContractValidator();
    const validationResult = validator.validate(contract);
    
    // 保存校验结果
    const validationPath = path.join(this.outputDir, '03_pre_sim_validation.json');
    fs.writeFileSync(validationPath, JSON.stringify(validationResult, null, 2));
    
    if (validationResult.ok) {
      console.log('✅ Pre-Sim Gate通过');
    } else {
      console.log('❌ Pre-Sim Gate失败');
      console.log('错误:', validationResult.errors.join(', '));
    }
    
    console.log('📁 Pre-Sim报告 →', validationPath);
    return validationResult;
  }

  /**
   * Step 4: 确定性仿真
   */
  async step4_Simulation(contract) {
    console.log('⚡ 开始确定性物理仿真...');
    
    // 使用验证后的contract（normalized版本）
    const normalizedContract = contract.normalized || contract;
    
    const engine = new PhysicsSimulationEngine(normalizedContract, {
      debug: true,  // 启用调试模式
      maxTime: normalizedContract.simulation?.t_end || 10,  // 仿真时间
      maxFrames: normalizedContract.simulation?.max_steps || 20000,  // 最大帧数
      frameRate: normalizedContract.simulation?.output_fps || 30,  // 帧率
      maxIterations: 1000
    });
    
    const simulationResult = await engine.simulate();
    
    // 保存仿真结果
    const simulationPath = path.join(this.outputDir, '04_simulation_result.json');
    fs.writeFileSync(simulationPath, JSON.stringify(simulationResult, null, 2));
    
    console.log('✅ 确定性仿真完成');
    console.log('📊 仿真统计:', simulationResult.frames.length, '帧,', (simulationResult.meta?.dt_avg || 0).toFixed(2), 's');
    console.log('📁 仿真结果 →', simulationPath);
    
    return simulationResult;
  }

  /**
   * Step 5: Post-Sim Gate - 验收测试 + VCS评分
   */
  async step5_PostSimGate(simulation, contract) {
    console.log('📊 Post-Sim Gate验收测试...');
    
    const vcsEvaluator = new VCSEvaluator();
    const vcsResult = await vcsEvaluator.evaluate(simulation, contract);
    
    // 保存VCS评分结果
    const vcsPath = path.join(this.outputDir, '05_vcs_report.json');
    fs.writeFileSync(vcsPath, JSON.stringify(vcsResult, null, 2));
    
    console.log('✅ Post-Sim Gate完成');
    console.log('📊 VCS评分:', vcsResult.score?.overall?.toFixed(2) || 'N/A');
    console.log('📁 VCS报告 →', vcsPath);
    
    return vcsResult;
  }

  /**
   * Step 6: 帧渲染
   */
  async step6_Rendering(simulation, contract) {
    console.log('🎨 开始帧渲染...');
    
    const framesDir = path.join(this.outputDir, 'frames');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }
    
    // 使用简化的Canvas渲染器，绕过FrameRasterizer的问题
    const renderingResult = await this.renderFramesWithSimpleCanvas(contract, simulation, framesDir);
    
    console.log('✅ 帧渲染完成');
    console.log('📁 渲染帧数:', renderingResult.frameCount || simulation.frames.length);
    console.log('📁 帧目录 →', framesDir);
    
    return renderingResult;
  }

  async renderFramesWithSimpleCanvas(contract, simulation, framesDir) {
    const { createCanvas } = require('canvas');
    const fs = require('fs');
    
    const width = 1200;
    const height = 800;
    const frames = [];
    
    // 计算世界边界
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    // 从表面计算边界
    if (contract.surfaces) {
      for (const surface of contract.surfaces) {
        if (surface.points) {
          for (const point of surface.points) {
            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minY = Math.min(minY, point[1]);
            maxY = Math.max(maxY, point[1]);
          }
        }
      }
    }
    
    // 从物体轨迹计算边界
    for (const frame of simulation.frames) {
      for (const body of frame.bodies) {
        minX = Math.min(minX, body.x);
        maxX = Math.max(maxX, body.x);
        minY = Math.min(minY, body.y);
        maxY = Math.max(maxY, body.y);
      }
    }
    
    // 添加边距
    const margin = 0.5;
    minX -= margin; maxX += margin;
    minY -= margin; maxY += margin;
    
    // 坐标转换函数
    const worldToScreen = (worldX, worldY) => {
      const screenX = ((worldX - minX) / (maxX - minX)) * width;
      const screenY = height - ((worldY - minY) / (maxY - minY)) * height; // Y轴翻转
      return [screenX, screenY];
    };
    
    console.log(`🎬 开始生成 ${simulation.frames.length} 帧...`);
    
    for (let i = 0; i < simulation.frames.length; i++) {
      const frame = simulation.frames[i];
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // 白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // 渲染表面
      if (contract.surfaces) {
        for (const surface of contract.surfaces) {
          if (surface.points && surface.points.length >= 2) {
            ctx.strokeStyle = surface.id === 'ramp' ? '#8B4513' : '#654321';
            ctx.lineWidth = 4;
            ctx.beginPath();
            
            const [startX, startY] = worldToScreen(surface.points[0][0], surface.points[0][1]);
            ctx.moveTo(startX, startY);
            
            for (let j = 1; j < surface.points.length; j++) {
              const [x, y] = worldToScreen(surface.points[j][0], surface.points[j][1]);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      }
      
      // 渲染物体
      for (const body of frame.bodies) {
        const [screenX, screenY] = worldToScreen(body.x, body.y);
        
        // 根据物体ID设置颜色
        let color = '#00FF00';
        if (body.id === 'slider') {
          const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
          color = speed > 5 ? '#FF0000' : speed > 2 ? '#FFA500' : '#00FF00';
        } else if (body.id === 'block') {
          color = '#8B4513';
        } else if (body.id === 'combo') {
          color = '#FF69B4';
        }
        
        // 渲染物体
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        const size = 10;
        ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
        ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
        
        // 添加物体ID标签
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(body.id, screenX - 20, screenY - 15);
      }
      
      // 保存帧
      const buffer = canvas.toBuffer('image/png');
      const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
      fs.writeFileSync(framePath, buffer);
      
      frames.push({
        frameIndex: i,
        filePath: framePath,
        renderTime: 0,
        size: { width, height }
      });
      
      if (i % 50 === 0) {
        console.log(`生成进度: ${i + 1}/${simulation.frames.length} 帧`);
      }
    }
    
    return {
      frames,
      frameCount: frames.length,
      totalFrames: frames.length,
      renderTime: 0,
      outputDirectory: framesDir
    };
  }

  /**
   * Step 7: 视频导出
   */
  async step7_Export(renderingResult) {
    console.log('🎬 开始视频导出...');
    
    const videoPath = path.join(this.outputDir, 'physics_animation.mp4');
    const framesDir = path.join(this.outputDir, 'frames');
    
    const encoder = new FFmpegEncoder();
    const exportResult = await encoder.encodeVideo({
      inputDir: framesDir,
      outputPath: videoPath,
      fps: 30,
      quality: 'high',
      format: 'mp4'
    });
    
    console.log('✅ 视频导出完成');
    console.log('📹 视频文件 →', videoPath);
    
    return exportResult;
  }

  /**
   * Step 8: 结果汇总
   */
  async step8_Summary(results) {
    console.log('📋 生成测试报告...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      architecture: 'v4.1.0',
      question: this.question,
      results: {
        aiParsing: {
          success: !!results.aiParsing,
          physicsType: results.aiParsing?.physics_type || 'unknown'
        },
        contractAdaptation: {
          success: !!results.contractAdaptation,
          bodyCount: results.contractAdaptation?.bodies?.length || 0,
          surfaceCount: results.contractAdaptation?.surfaces?.length || 0
        },
        preSimGate: {
          passed: results.preSimGate?.passed || false,
          errorCount: results.preSimGate?.errors?.length || 0
        },
        simulation: {
          success: !!results.simulation,
          frameCount: results.simulation?.frames?.length || 0,
          totalTime: results.simulation?.totalTime || 0
        },
        postSimGate: {
          vcsScore: results.postSimGate?.overallScore || 0,
          passed: (results.postSimGate?.overallScore || 0) > 0.5
        },
        rendering: {
          success: !!results.rendering,
          frameCount: results.rendering?.frameCount || 0
        },
        export: {
          success: !!results.export,
          videoPath: results.export?.outputPath || ''
        }
      },
      performance: {
        totalTime: Date.now() - Date.now(), // 将在调用时更新
        architecture: 'v4.1.0'
      }
    };
    
    // 保存汇总报告
    const summaryPath = path.join(this.outputDir, 'test_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('✅ 测试报告生成完成');
    console.log('📁 汇总报告 →', summaryPath);
    
    return summary;
  }
}

/**
 * 命令行接口
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 使用方法:');
    console.log('  node test_question.js "物理题目内容"');
    console.log('');
    console.log('📝 示例:');
    console.log('  node test_question.js "质量为2kg的物体从高度5m处自由下落，求落地时的速度"');
    console.log('');
    process.exit(1);
  }
  
  const question = args.join(' ');
  
  try {
    const test = new UniversalPhysicsTest({
      outputDir: './test_output',
      question: question
    });
    
    const result = await test.runTest(question);
    
    console.log('\n🎉 测试成功完成!');
    console.log('📹 视频文件:', result.export?.outputPath || '未生成');
    console.log('📊 VCS评分:', result.postSimGate?.overallScore?.toFixed(2) || 'N/A');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { UniversalPhysicsTest };
