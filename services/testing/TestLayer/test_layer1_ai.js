#!/usr/bin/env node
/**
 * Layer 1: AI解析层测试
 * 直接测试PhysicsAICaller.js的原始AI输出能力
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// 直接导入PhysicsAICaller
const PhysicsAICaller = require('../../ai_parsing/PhysicsAICaller').PhysicsAICaller;

class Layer1AITester {
  constructor() {
    this.outputDir = path.join(__dirname, 'layer1_output');
    this.testResults = [];
    
    // 直接初始化PhysicsAICaller
    this.aiCaller = new PhysicsAICaller({
      enableLogging: true,
      timeout: 30000,
      apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '',
      model: 'deepseek-v3',
      temperature: 0.1,
      maxTokens: 20000,  // 增加token限制
    });
    
    // 确保输出目录存在
    const fs = require('fs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runTests() {
    console.log('🔍 Layer 1: AI解析层测试');
    console.log('='.repeat(50));

    // 用户输入的物理题目
    const question = '在斜坡上方顶端放一个质量m = 0.5kg球，坡度为30度，长5厘米，另一个质量为M = 1kg的小球离斜坡5厘米。水平面为粗糙水平面，动摩擦因数μ=0.25，计算碰撞后第二个球的速度。'
    await this.runSingleTest(question);
    await this.generateReport();
  }

  async runSingleTest(question) {
    console.log(`\n📝 AI解析结果`);
    console.log(`   问题: ${question}`);

    try {
      // 🆕 记录解析开始时间
      const startTime = Date.now();
      
      // 直接使用PhysicsAICaller进行解析
      console.log('\n🔍 正在使用PhysicsAICaller解析...');
      const result = await this.aiCaller.parseQuestionAsJSON(question);
      
      // 🆕 记录解析结束时间并计算耗时
      const endTime = Date.now();
      const duration = endTime - startTime;
    
      
      // 🆕 解析时间信息
      console.log(`⏱️  解析时间: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
      console.log('='.repeat(50));
      
      
      
    
      
      // 保存解析结果到文件
      const testResult = {
        timestamp: new Date().toISOString(),
        question: question,
        result: result,
        duration: duration
      };
      
      await this.saveTestResult(testResult);
      console.log(`\n💾 解析结果已保存到: ${path.join(this.outputDir, 'AI解析结果04.json')}`);

    } catch (error) {
      console.log(`\n❌ 解析失败: ${error.message}`);
      console.log(`   错误详情: ${error.stack}`);
    }
  }

  
  async saveTestResult(testResult) {
    const fs = require('fs');
    const filename = 'AI解析结果04.json';
    const filepath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(testResult, null, 2));
  }

  async generateReport() {
    console.log('\n✅ AI解析完成！');
    console.log('='.repeat(50));
  }
}

// 主函数
async function main() {
  const tester = new Layer1AITester();
  await tester.runTests();
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { Layer1AITester };
