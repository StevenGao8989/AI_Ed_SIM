#!/usr/bin/env node
/**
 * Adapter测试脚本
 * 测试AI解析结果通过Adapter.ts处理后的输出
 * 输入：AI解析结果03.json
 * 输出：仿真结果JSON文件
 */

const fs = require('fs');
const path = require('path');

// 设置环境变量
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

// 由于这是Node.js环境，我们需要使用编译后的JS文件
const { adaptPhysicsContract } = require('../../matter_adapter/Adapter.js');

class AdapterTester {
  constructor() {
    this.outputDir = path.join(__dirname, 'adapter_output');
    this.inputFile = path.join(__dirname, 'layer1_output', 'AI解析结果03.json');
    
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    console.log('🔧 Adapter测试器初始化完成');
    console.log(`📁 输出目录: ${this.outputDir}`);
    console.log(`📄 输入文件: ${this.inputFile}`);
  }

  /**
   * 运行适配器测试
   */
  async runTest() {
    console.log('\n🚀 开始Adapter测试');
    console.log('='.repeat(50));

    try {
      // 1. 读取AI解析结果
      console.log('\n📖 读取AI解析结果...');
      const aiResult = this.loadAIResult();
      console.log(`✅ 成功读取AI解析结果 (耗时: ${aiResult.duration}ms)`);

      // 2. 提取PhysicsContract
      console.log('\n🔍 提取PhysicsContract...');
      const contract = this.extractPhysicsContract(aiResult);
      console.log('✅ 成功提取PhysicsContract');

      // 3. 调用适配器
      console.log('\n⚙️  调用Adapter处理PhysicsContract...');
      const startTime = Date.now();
      const simulationResult = await adaptPhysicsContract(contract);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ 适配器处理完成 (耗时: ${duration}ms)`);

      // 4. 保存结果
      console.log('\n💾 保存测试结果...');
      await this.saveResults(aiResult, contract, simulationResult, duration);

      // 5. 分析结果
      console.log('\n📊 分析结果...');
      this.analyzeResults(simulationResult);

      console.log('\n✅ Adapter测试完成！');
      console.log('='.repeat(50));

    } catch (error) {
      console.error('\n❌ 测试失败:', error.message);
      console.error('错误详情:', error.stack);
      
      // 保存错误报告
      await this.saveErrorReport(error);
    }
  }

  /**
   * 加载AI解析结果
   */
  loadAIResult() {
    if (!fs.existsSync(this.inputFile)) {
      throw new Error(`输入文件不存在: ${this.inputFile}`);
    }

    const content = fs.readFileSync(this.inputFile, 'utf8');
    return JSON.parse(content);
  }

  /**
   * 提取PhysicsContract
   */
  extractPhysicsContract(aiResult) {
    if (!aiResult.result || !aiResult.result.parsed) {
      throw new Error('AI解析结果格式错误：缺少parsed字段');
    }

    return aiResult.result.parsed;
  }

  /**
   * 保存测试结果
   */
  async saveResults(aiResult, contract, simulationResult, duration) {
    const timestamp = new Date().toISOString();
    
    // 保存原始AI结果
    const aiResultFile = path.join(this.outputDir, '01_ai_input.json');
    fs.writeFileSync(aiResultFile, JSON.stringify(aiResult, null, 2));
    console.log(`  📄 AI输入结果: ${aiResultFile}`);

    // 保存PhysicsContract
    const contractFile = path.join(this.outputDir, '02_physics_contract.json');
    fs.writeFileSync(contractFile, JSON.stringify(contract, null, 2));
    console.log(`  📄 PhysicsContract: ${contractFile}`);

    // 保存仿真结果
    const simulationFile = path.join(this.outputDir, '03_simulation_result.json');
    fs.writeFileSync(simulationFile, JSON.stringify(simulationResult, null, 2));
    console.log(`  📄 仿真结果: ${simulationFile}`);

    // 保存测试报告
    const reportFile = path.join(this.outputDir, '04_test_report.json');
    const report = {
      timestamp,
      testName: 'Adapter Test',
      input: {
        file: this.inputFile,
        question: aiResult.question,
        aiDuration: aiResult.duration
      },
      processing: {
        adapterDuration: duration,
        success: simulationResult.success
      },
      output: {
        frames: simulationResult.data?.frames?.length || 0,
        events: simulationResult.data?.finalState?.endReason || 'unknown',
        totalTime: simulationResult.data?.finalState?.totalTime || 0
      },
      physicsMetrics: simulationResult.data?.physicsMetrics || null
    };
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`  📄 测试报告: ${reportFile}`);

    // 保存简化版帧数据（用于快速查看）
    if (simulationResult.success && simulationResult.data?.frames) {
      const framesFile = path.join(this.outputDir, '05_frames_summary.json');
      const framesSummary = simulationResult.data.frames.map((frame, index) => ({
        frameIndex: index,
        timestamp: frame.timestamp,
        bodyCount: frame.bodies.length,
        bodies: frame.bodies.map(body => ({
          id: body.id,
          position: body.position,
          velocity: body.velocity
        })),
        eventCount: frame.events.length
      })).slice(0, 10); // 只保存前10帧作为示例
      
      fs.writeFileSync(framesFile, JSON.stringify(framesSummary, null, 2));
      console.log(`  📄 帧数据摘要: ${framesFile}`);
    }
  }

  /**
   * 分析结果
   */
  analyzeResults(simulationResult) {
    if (!simulationResult.success) {
      console.log('❌ 仿真失败:', simulationResult.error);
      return;
    }

    const data = simulationResult.data;
    console.log(`📊 仿真统计:`);
    console.log(`   总帧数: ${data.frames.length}`);
    console.log(`   仿真时间: ${data.finalState.totalTime.toFixed(2)}s`);
    console.log(`   结束原因: ${data.finalState.endReason}`);
    console.log(`   物体数量: ${data.finalState.bodies.length}`);
    console.log(`   碰撞次数: ${data.physicsMetrics.collisionCount}`);

    if (data.frames.length > 0) {
      const firstFrame = data.frames[0];
      const lastFrame = data.frames[data.frames.length - 1];
      
      console.log(`\n📈 物体状态变化:`);
      firstFrame.bodies.forEach(body => {
        const lastBody = lastFrame.bodies.find(b => b.id === body.id);
        if (lastBody) {
          const distance = Math.sqrt(
            Math.pow(lastBody.position[0] - body.position[0], 2) + 
            Math.pow(lastBody.position[1] - body.position[1], 2)
          );
          console.log(`   ${body.id}: 位移 ${distance.toFixed(3)}m`);
        }
      });
    }
  }

  /**
   * 保存错误报告
   */
  async saveErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      testName: 'Adapter Test',
      error: {
        message: error.message,
        stack: error.stack
      },
      input: {
        file: this.inputFile,
        exists: fs.existsSync(this.inputFile)
      }
    };

    const errorFile = path.join(this.outputDir, 'error_report.json');
    fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
    console.log(`📄 错误报告已保存: ${errorFile}`);
  }
}

// 主函数
async function main() {
  console.log('🔬 Adapter测试脚本启动');
  console.log('='.repeat(50));

  const tester = new AdapterTester();
  await tester.runTest();

  console.log('\n🎯 测试完成，请查看输出目录中的结果文件');
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    console.error('💥 测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { AdapterTester };
