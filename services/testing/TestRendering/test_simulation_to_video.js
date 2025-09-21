/**
 * 测试仿真到视频转换功能
 */

const { SimulationToVideo } = require('../../rendering/SimulationToVideo');

// 测试用的 DSL 数据
const testDSL = {
  metadata: {
    id: 'test_simulation',
    topic: '自由落体运动',
    system_type: 'kinematics_linear',
    difficulty: 'easy'
  },
  system: {
    type: 'kinematics_linear',
    parameters: [
      { symbol: 'h', value: { value: 100, unit: 'm' }, role: 'given', description: '初始高度' },
      { symbol: 'g', value: { value: 9.8, unit: 'm/s²' }, role: 'constant', description: '重力加速度' },
      { symbol: 't', value: { value: 0, unit: 's' }, role: 'unknown', description: '时间' },
      { symbol: 'v', value: { value: 0, unit: 'm/s' }, role: 'unknown', description: '速度' }
    ],
    objects: [
      {
        name: 'ball',
        type: 'sphere',
        position: { x: 0, y: 100, z: 0 },
        properties: { radius: 0.5, mass: 1 }
      }
    ],
    environment: { gravity: { value: 9.8, unit: 'm/s²' } }
  },
  simulation: {
    duration: { value: 10, unit: 's' },
    time_step: { value: 0.01, unit: 's' }
  },
  output: {
    visualization: {
      plots: [],
      animations: []
    }
  }
};

async function testSimulationToVideo() {
  console.log('🧪 Testing Simulation to Video Conversion...\n');
  
  const converter = new SimulationToVideo();
  
  try {
    // 测试1: 快速转换
    console.log('📹 Test 1: Quick conversion');
    console.log('='.repeat(50));
    
    const quickResult = await converter.quickConvert(
      testDSL,
      './output/quick_test.mp4',
      'medium'
    );
    
    console.log(`Quick conversion result: ${quickResult.success ? 'Success' : 'Failed'}`);
    if (quickResult.success) {
      console.log(`Output: ${quickResult.outputPath}`);
      console.log(`Total time: ${quickResult.totalTime}ms`);
    } else {
      console.log(`Errors: ${quickResult.errors.join(', ')}`);
    }
    
    // 测试2: 自定义配置转换
    console.log('\n📹 Test 2: Custom configuration conversion');
    console.log('='.repeat(50));
    
    const customConfig = converter.getRecommendedConfig('high');
    customConfig.video.outputPath = './output/custom_test.mp4';
    customConfig.video.duration = 5;
    customConfig.simulation.duration = 5;
    
    const customResult = await converter.convertToVideo(testDSL, customConfig);
    
    console.log(`Custom conversion result: ${customResult.success ? 'Success' : 'Failed'}`);
    if (customResult.success) {
      console.log(`Output: ${customResult.outputPath}`);
      console.log(`Total time: ${customResult.totalTime}ms`);
    } else {
      console.log(`Errors: ${customResult.errors.join(', ')}`);
    }
    
    // 测试3: 预览生成
    console.log('\n📷 Test 3: Preview generation');
    console.log('='.repeat(50));
    
    const previewResult = await converter.generatePreview(
      testDSL,
      './output/preview.png',
      2.0 // 2秒时的预览
    );
    
    console.log(`Preview generation result: ${previewResult.success ? 'Success' : 'Failed'}`);
    if (previewResult.success) {
      console.log(`Preview: ${previewResult.outputPath}`);
    } else {
      console.log(`Errors: ${previewResult.errors.join(', ')}`);
    }
    
    // 测试4: 批量转换
    console.log('\n📹 Test 4: Batch conversion');
    console.log('='.repeat(50));
    
    const batchSimulations = [
      { dsl: testDSL, config: converter.getRecommendedConfig('low') },
      { dsl: testDSL, config: converter.getRecommendedConfig('medium') },
      { dsl: testDSL, config: converter.getRecommendedConfig('high') }
    ];
    
    // 设置不同的输出路径
    batchSimulations.forEach((sim, index) => {
      sim.config.video.outputPath = `./output/batch_test_${index + 1}.mp4`;
      sim.config.video.duration = 3;
      sim.config.simulation.duration = 3;
    });
    
    const batchResults = await converter.batchConvert(batchSimulations);
    
    console.log(`Batch conversion results:`);
    batchResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.success ? 'Success' : 'Failed'}: ${result.outputPath}`);
      if (!result.success) {
        console.log(`     Errors: ${result.errors.join(', ')}`);
      }
    });
    
    // 测试5: 支持的格式
    console.log('\n📋 Test 5: Supported formats');
    console.log('='.repeat(50));
    
    const supportedFormats = converter.getSupportedFormats();
    console.log(`Supported video formats: ${supportedFormats.join(', ')}`);
    
    // 清理资源
    console.log('\n🧹 Cleaning up...');
    await converter.cleanup();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  testSimulationToVideo().catch(console.error);
}

module.exports = { testSimulationToVideo };
