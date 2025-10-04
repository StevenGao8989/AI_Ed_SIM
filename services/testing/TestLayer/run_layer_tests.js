#!/usr/bin/env node
/**
 * 架构分层测试运行器
 * 可以单独运行每个层的测试，或运行所有层的测试
 */

const path = require('path');

// 导入所有层测试器
const { Layer1AITester } = require('./test_layer1_ai');
const { Layer2ContractTester } = require('./test_layer2_contract');
const { Layer3ValidationTester } = require('./test_layer3_validation');
const { Layer4SimulationTester } = require('./test_layer4_simulation');
const { Layer5QualityTester } = require('./test_layer5_quality');
const { Layer6RenderingTester } = require('./test_layer6_rendering');
const { Layer7ExportTester } = require('./test_layer7_export');
const { Layer8IntegrationTester } = require('./test_layer8_integration');

class LayerTestRunner {
  constructor() {
    this.testers = {
      'layer1': Layer1AITester,
      'layer2': Layer2ContractTester,
      'layer3': Layer3ValidationTester,
      'layer4': Layer4SimulationTester,
      'layer5': Layer5QualityTester,
      'layer6': Layer6RenderingTester,
      'layer7': Layer7ExportTester,
      'layer8': Layer8IntegrationTester
    };
    
    this.layerNames = {
      'layer1': 'Layer 1: AI解析层',
      'layer2': 'Layer 2: Contract适配层',
      'layer3': 'Layer 3: 验证层',
      'layer4': 'Layer 4: 仿真层',
      'layer5': 'Layer 5: 质量评估层',
      'layer6': 'Layer 6: 渲染层',
      'layer7': 'Layer 7: 导出层',
      'layer8': 'Layer 8: 端到端集成层'
    };
  }

  async runAllTests() {
    console.log('🏗️  开始运行所有架构层测试...\n');
    
    const results = {};
    const startTime = Date.now();
    
    for (const [layerId, TesterClass] of Object.entries(this.testers)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 运行 ${this.layerNames[layerId]}`);
      console.log('='.repeat(60));
      
      try {
        const tester = new TesterClass();
        await tester.runTests();
        
        results[layerId] = {
          success: true,
          summary: tester.testResults ? this.extractSummary(tester.testResults) : null
        };
        
      } catch (error) {
        console.error(`❌ ${this.layerNames[layerId]} 测试失败:`, error.message);
        results[layerId] = {
          success: false,
          error: error.message
        };
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    await this.generateOverallReport(results, totalTime);
  }

  async runSingleLayer(layerId) {
    if (!this.testers[layerId]) {
      console.error(`❌ 未知的层ID: ${layerId}`);
      console.log(`可用的层ID: ${Object.keys(this.testers).join(', ')}`);
      return;
    }

    console.log(`🔍 运行 ${this.layerNames[layerId]}...\n`);
    
    try {
      const TesterClass = this.testers[layerId];
      const tester = new TesterClass();
      await tester.runTests();
      
      console.log(`\n✅ ${this.layerNames[layerId]} 测试完成`);
      
    } catch (error) {
      console.error(`❌ ${this.layerNames[layerId]} 测试失败:`, error.message);
    }
  }

  extractSummary(testResults) {
    if (!testResults || testResults.length === 0) {
      return { totalTests: 0, successTests: 0, failureTests: 0, successRate: '0%' };
    }
    
    const totalTests = testResults.length;
    const successTests = testResults.filter(r => r.success).length;
    const failureTests = totalTests - successTests;
    
    return {
      totalTests,
      successTests,
      failureTests,
      successRate: `${Math.round((successTests / totalTests) * 100)}%`
    };
  }

  async generateOverallReport(results, totalTime) {
    console.log('\n' + '='.repeat(80));
    console.log('🏗️  架构分层测试总结报告');
    console.log('='.repeat(80));
    
    const totalLayers = Object.keys(results).length;
    const successLayers = Object.values(results).filter(r => r.success).length;
    const failureLayers = totalLayers - successLayers;
    
    console.log(`📊 总体统计:`);
    console.log(`   总层数: ${totalLayers}`);
    console.log(`   成功: ${successLayers}`);
    console.log(`   失败: ${failureLayers}`);
    console.log(`   成功率: ${Math.round((successLayers / totalLayers) * 100)}%`);
    console.log(`   总耗时: ${totalTime.toFixed(2)}s`);
    
    console.log(`\n📋 各层详细结果:`);
    Object.entries(results).forEach(([layerId, result]) => {
      const status = result.success ? '✅' : '❌';
      const layerName = this.layerNames[layerId];
      
      if (result.success && result.summary) {
        console.log(`   ${status} ${layerName}: ${result.summary.successRate} (${result.summary.successTests}/${result.summary.totalTests})`);
      } else {
        console.log(`   ${status} ${layerName}: ${result.success ? '通过' : '失败'}`);
        if (result.error) {
          console.log(`     错误: ${result.error}`);
        }
      }
    });
    
    // 保存汇总报告
    const report = {
      timestamp: new Date().toISOString(),
      totalTime: totalTime,
      summary: {
        totalLayers,
        successLayers,
        failureLayers,
        successRate: `${Math.round((successLayers / totalLayers) * 100)}%`
      },
      results: results
    };
    
    const fs = require('fs');
    const reportPath = path.join(__dirname, 'overall_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📁 汇总报告 → ${reportPath}`);
    console.log('='.repeat(80));
    
    if (failureLayers > 0) {
      console.log(`\n⚠️  有 ${failureLayers} 个层测试失败，请检查相关层的实现`);
      process.exit(1);
    } else {
      console.log(`\n🎉 所有架构层测试通过！架构完整性验证成功`);
    }
  }

  showHelp() {
    console.log('🏗️  架构分层测试运行器');
    console.log('');
    console.log('用法:');
    console.log('  node run_layer_tests.js [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --all, -a              运行所有层的测试');
    console.log('  --layer <id>, -l <id>  运行指定层的测试');
    console.log('  --help, -h             显示帮助信息');
    console.log('');
    console.log('可用的层ID:');
    Object.entries(this.layerNames).forEach(([id, name]) => {
      console.log(`  ${id.padEnd(8)} - ${name}`);
    });
    console.log('');
    console.log('示例:');
    console.log('  node run_layer_tests.js --all');
    console.log('  node run_layer_tests.js --layer layer1');
    console.log('  node run_layer_tests.js -l layer4');
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const runner = new LayerTestRunner();
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    runner.showHelp();
    return;
  }
  
  if (args.includes('--all') || args.includes('-a')) {
    await runner.runAllTests();
  } else if (args.includes('--layer') || args.includes('-l')) {
    const layerIndex = args.findIndex(arg => arg === '--layer' || arg === '-l');
    if (layerIndex !== -1 && layerIndex + 1 < args.length) {
      const layerId = args[layerIndex + 1];
      await runner.runSingleLayer(layerId);
    } else {
      console.error('❌ 请指定要测试的层ID');
      runner.showHelp();
    }
  } else {
    console.error('❌ 未知的选项');
    runner.showHelp();
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LayerTestRunner };
