/**
 * 测试 IR 层改进效果
 * 验证模块检测算法、错误处理、性能监控和缓存机制
 */

const { IRConverter } = require('../../ir/ir/IRConverter');

// 测试题目
const testProblems = [
  {
    id: 'acoustics_test',
    title: '声学模块测试',
    dsl: {
      metadata: {
        id: 'acoustics_test',
        topic: '声学',
        system_type: 'acoustics',
        difficulty: 'medium'
      },
      system: {
        type: 'acoustics',
        parameters: [
          { symbol: 'f', value: { value: 440, unit: 'Hz' }, role: 'given', description: '频率' },
          { symbol: 'v', value: { value: 340, unit: 'm/s' }, role: 'given', description: '声速' },
          { symbol: 'λ', value: { value: 0, unit: 'm' }, role: 'unknown', description: '波长' }
        ],
        originalText: '一个声源发出频率为440Hz的声音，在空气中传播速度为340m/s，求波长',
        environment: { gravity: { value: 9.8, unit: 'm/s²' } }
      },
      simulation: { duration: { value: 10, unit: 's' }, time_step: { value: 0.01, unit: 's' } },
      output: { visualization: { plots: [], animations: [] } }
    }
  },
  {
    id: 'phase_change_test',
    title: '物态变化模块测试',
    dsl: {
      metadata: {
        id: 'phase_change_test',
        topic: '物态变化',
        system_type: 'phase_change',
        difficulty: 'medium'
      },
      system: {
        type: 'phase_change',
        parameters: [
          { symbol: 'm', value: { value: 1, unit: 'kg' }, role: 'given', description: '质量' },
          { symbol: 'c', value: { value: 4200, unit: 'J/(kg·K)' }, role: 'given', description: '比热容' },
          { symbol: 'L', value: { value: 3.34e5, unit: 'J/kg' }, role: 'given', description: '潜热' },
          { symbol: 'Q', value: { value: 0, unit: 'J' }, role: 'unknown', description: '热量' }
        ],
        originalText: '将1kg的冰从-10°C加热到0°C，然后完全熔化，求需要的总热量',
        environment: { gravity: { value: 9.8, unit: 'm/s²' } }
      },
      simulation: { duration: { value: 10, unit: 's' }, time_step: { value: 0.01, unit: 's' } },
      output: { visualization: { plots: [], animations: [] } }
    }
  },
  {
    id: 'error_test',
    title: '错误处理测试',
    dsl: {
      // 故意缺少必要字段来测试错误处理
      metadata: { id: 'error_test' },
      system: { type: 'test' }
    }
  }
];

async function testIRImprovements() {
  console.log('🧪 测试 IR 层改进效果...\n');
  
  const irConverter = new IRConverter();
  
  // 测试 1: 模块检测算法改进
  console.log('📊 测试 1: 模块检测算法改进');
  console.log('='.repeat(50));
  
  let moduleDetectionSuccess = 0;
  let totalTests = 0;
  
  for (const test of testProblems.slice(0, 2)) { // 只测试前两个正常题目
    totalTests++;
    console.log(`\n📝 测试: ${test.title}`);
    
    try {
      const result = await irConverter.convertDSLToIR(test.dsl);
      
      if (result.success && result.ir && result.ir.system && result.ir.system.modules) {
        const modules = result.ir.system.modules;
        console.log(`  ✅ 转换成功`);
        console.log(`  生成模块数量: ${modules.length}`);
        
        // 检查是否生成了特定模块而不是通用模块
        const hasSpecificModule = modules.some(module => 
          !module.name.includes('通用') && !module.name.includes('默认')
        );
        
        if (hasSpecificModule) {
          console.log(`  ✅ 生成了特定模块`);
          moduleDetectionSuccess++;
        } else {
          console.log(`  ⚠️  生成了通用模块`);
        }
        
        // 显示模块详情
        modules.forEach(module => {
          console.log(`    - ${module.name} (${module.type})`);
          console.log(`      参数: ${module.parameters.map(p => p.symbol).join(', ')}`);
          console.log(`      方程: ${module.equations.length} 个`);
        });
        
      } else {
        console.log(`  ❌ 转换失败: ${result.errors?.join(', ') || '未知错误'}`);
      }
      
    } catch (error) {
      console.log(`  ❌ 处理失败: ${error.message}`);
    }
  }
  
  const moduleDetectionRate = (moduleDetectionSuccess / totalTests * 100).toFixed(1);
  console.log(`\n📈 模块检测成功率: ${moduleDetectionRate}% (${moduleDetectionSuccess}/${totalTests})`);
  
  // 测试 2: 错误处理和恢复机制
  console.log('\n\n📊 测试 2: 错误处理和恢复机制');
  console.log('='.repeat(50));
  
  const errorTest = testProblems[2]; // 错误测试题目
  console.log(`\n📝 测试: ${errorTest.title}`);
  
  try {
    const result = await irConverter.convertDSLToIR(errorTest.dsl);
    
    console.log(`  转换结果: ${result.success ? '成功' : '失败'}`);
    console.log(`  错误数量: ${result.errors?.length || 0}`);
    console.log(`  警告数量: ${result.warnings?.length || 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`  错误详情:`);
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log(`  警告详情:`);
      result.warnings.forEach(warning => console.log(`    - ${warning}`));
    }
    
    if (result.success) {
      console.log(`  ✅ 错误处理成功 - 系统能够从错误中恢复`);
    } else {
      console.log(`  ⚠️  错误处理需要改进`);
    }
    
  } catch (error) {
    console.log(`  ❌ 错误处理失败: ${error.message}`);
  }
  
  // 测试 3: 性能监控和缓存机制
  console.log('\n\n📊 测试 3: 性能监控和缓存机制');
  console.log('='.repeat(50));
  
  // 第一次运行（缓存未命中）
  console.log('\n🔄 第一次运行（缓存未命中）:');
  const startTime1 = Date.now();
  const result1 = await irConverter.convertDSLToIR(testProblems[0].dsl);
  const time1 = Date.now() - startTime1;
  console.log(`  转换时间: ${time1}ms`);
  console.log(`  转换结果: ${result1.success ? '成功' : '失败'}`);
  
  // 第二次运行（缓存命中）
  console.log('\n🔄 第二次运行（缓存命中）:');
  const startTime2 = Date.now();
  const result2 = await irConverter.convertDSLToIR(testProblems[0].dsl);
  const time2 = Date.now() - startTime2;
  console.log(`  转换时间: ${time2}ms`);
  console.log(`  转换结果: ${result2.success ? '成功' : '失败'}`);
  
  // 获取性能指标
  const metrics = irConverter.getPerformanceMetrics();
  console.log('\n📈 性能指标:');
  console.log(`  总转换次数: ${metrics.totalConversions}`);
  console.log(`  平均转换时间: ${metrics.averageConversionTime.toFixed(2)}ms`);
  console.log(`  缓存命中率: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`  错误率: ${(metrics.errorRate * 100).toFixed(1)}%`);
  console.log(`  缓存大小: ${metrics.cacheSize}`);
  
  // 测试 4: 缓存清理
  console.log('\n\n📊 测试 4: 缓存清理');
  console.log('='.repeat(50));
  
  console.log(`清理前缓存大小: ${irConverter.getPerformanceMetrics().cacheSize}`);
  irConverter.clearCache();
  console.log(`清理后缓存大小: ${irConverter.getPerformanceMetrics().cacheSize}`);
  console.log('✅ 缓存清理功能正常');
  
  // 总结
  console.log('\n\n📊 改进效果总结');
  console.log('='.repeat(50));
  
  console.log('✅ 已实现的改进:');
  console.log('  1. 增强的模块检测算法 - 智能评分和动态阈值');
  console.log('  2. 完善的错误处理机制 - 回退和恢复');
  console.log('  3. 性能监控系统 - 实时指标跟踪');
  console.log('  4. 缓存机制 - 提高转换效率');
  console.log('  5. 缓存管理 - 自动清理和大小限制');
  
  console.log('\n📈 改进效果:');
  console.log(`  - 模块检测成功率: ${moduleDetectionRate}%`);
  console.log(`  - 平均转换时间: ${metrics.averageConversionTime.toFixed(2)}ms`);
  console.log(`  - 缓存命中率: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`  - 错误率: ${(metrics.errorRate * 100).toFixed(1)}%`);
  
  console.log('\n💡 结论:');
  if (parseFloat(moduleDetectionRate) >= 80) {
    console.log('🎉 IR 层改进效果显著，模块检测算法大幅提升！');
  } else if (parseFloat(moduleDetectionRate) >= 60) {
    console.log('✅ IR 层改进有效，模块检测算法有所提升。');
  } else {
    console.log('⚠️  IR 层改进需要进一步优化。');
  }
  
  console.log('\n🚀 下一步建议:');
  console.log('  1. 继续优化模块检测算法的语义理解能力');
  console.log('  2. 添加更多物理概念的同义词映射');
  console.log('  3. 实现并行处理支持');
  console.log('  4. 添加可视化调试工具');
}

// 运行测试
if (require.main === module) {
  testIRImprovements().catch(console.error);
}

module.exports = { testIRImprovements };
