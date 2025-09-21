/**
 * 测试 IR 验证器
 * 
 * 测试流程：
 * 1. 加载现有的 IR 文件
 * 2. 使用 IRValidator 进行验证
 * 3. 分析验证结果
 * 4. 生成验证报告
 */

const fs = require('fs');
const path = require('path');

// 导入 IR 验证器
const { IRValidator } = require('../../ir/IRValidator.js');

async function testIRValidator() {
  console.log('🔄 开始测试 IR 验证器...\n');

  try {
    // 1. 加载现有的 IR 文件
    const irPath = path.join(__dirname, 'outputs/ir_physics_1758187216354_g95x0grlx.json');
    
    if (!fs.existsSync(irPath)) {
      throw new Error(`IR 文件不存在: ${irPath}`);
    }

    const irContent = fs.readFileSync(irPath, 'utf8');
    const ir = JSON.parse(irContent);
    
    console.log('📋 加载的 IR 信息:');
    console.log(`   🆔 ID: ${ir.metadata?.id || 'unknown'}`);
    console.log(`   📚 系统类型: ${ir.metadata?.system_type || 'unknown'}`);
    console.log(`   📊 模块数量: ${ir.system?.modules?.length || 0}`);
    console.log(`   ⚙️ 参数数量: ${ir.system?.parameters?.length || 0}`);
    console.log(`   🎬 对象数量: ${ir.system?.objects?.length || 0}\n`);

    // 2. 初始化 IR 验证器
    const validator = new IRValidator();
    
    // 3. 执行验证
    console.log('🔄 执行 IR 验证...');
    const startTime = Date.now();
    
    const result = validator.validate(ir, {
      strict: true,
      check_physics: true,
      check_units: true,
      check_dependencies: true,
      check_equations: true,
      verbose: true
    });
    
    const validationTime = Date.now() - startTime;

    // 4. 分析验证结果
    console.log('\n📊 验证结果:');
    console.log(`   ✅ 整体有效: ${result.is_valid ? '✅' : '❌'}`);
    console.log(`   ⏱️ 耗时: ${validationTime}ms`);
    console.log(`   ⚠️ 警告数量: ${result.warnings.length}`);
    console.log(`   ❌ 错误数量: ${result.errors.length}`);

    console.log('\n🔍 详细检查结果:');
    console.log(`   🏗️ 结构验证: ${result.checks.structure ? '✅' : '❌'}`);
    console.log(`   🧠 逻辑验证: ${result.checks.logic ? '✅' : '❌'}`);
    console.log(`   🔗 依赖关系验证: ${result.checks.dependencies ? '✅' : '❌'}`);
    console.log(`   🔬 物理逻辑验证: ${result.checks.physics ? '✅' : '❌'}`);
    console.log(`   📏 单位一致性验证: ${result.checks.units ? '✅' : '❌'}`);
    console.log(`   📐 数学方程验证: ${result.checks.equations ? '✅' : '❌'}`);

    console.log('\n📊 验证统计:');
    console.log(`   📋 总检查项: ${result.statistics.total_checks}`);
    console.log(`   ✅ 通过检查: ${result.statistics.passed_checks}`);
    console.log(`   ❌ 失败检查: ${result.statistics.failed_checks}`);
    console.log(`   ⚠️ 警告数量: ${result.statistics.warning_count}`);

    // 5. 显示详细错误和警告
    if (result.errors.length > 0) {
      console.log('\n❌ 验证错误:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ 验证警告:');
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // 6. 分析 IR 质量
    console.log('\n📈 IR 质量分析:');
    const qualityScore = calculateQualityScore(result);
    console.log(`   🎯 质量评分: ${qualityScore}/100`);
    
    if (qualityScore >= 90) {
      console.log('   🌟 优秀: IR 质量很高，可以直接用于仿真');
    } else if (qualityScore >= 70) {
      console.log('   👍 良好: IR 质量良好，建议修复警告后使用');
    } else if (qualityScore >= 50) {
      console.log('   ⚠️ 一般: IR 质量一般，需要修复错误和警告');
    } else {
      console.log('   ❌ 较差: IR 质量较差，需要大量修复');
    }

    // 7. 保存验证报告
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = {
      test_name: 'IR 验证器测试',
      timestamp: new Date().toISOString(),
      input: {
        ir_file: irPath,
        ir_id: ir.metadata?.id,
        ir_system_type: ir.metadata?.system_type
      },
      validation: {
        success: result.is_valid,
        duration: validationTime,
        quality_score: qualityScore,
        checks: result.checks,
        statistics: result.statistics,
        errors: result.errors,
        warnings: result.warnings
      },
      recommendations: generateRecommendations(result)
    };

    const reportPath = path.join(outputDir, `validation_report_${ir.metadata?.id || 'unknown'}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 验证报告已保存到: ${reportPath}`);

    console.log(`\n⏱️ 总耗时: ${validationTime}ms`);
    console.log('🎉 IR 验证器测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

/**
 * 计算质量评分
 */
function calculateQualityScore(result) {
  const totalChecks = result.statistics.total_checks;
  const passedChecks = result.statistics.passed_checks;
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;
  
  // 基础分数：通过检查的比例
  let score = (passedChecks / totalChecks) * 100;
  
  // 错误扣分：每个错误扣 10 分
  score -= errorCount * 10;
  
  // 警告扣分：每个警告扣 2 分
  score -= warningCount * 2;
  
  // 确保分数在 0-100 之间
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 生成改进建议
 */
function generateRecommendations(result) {
  const recommendations = [];
  
  if (!result.checks.structure) {
    recommendations.push('修复结构问题：检查必需字段是否完整');
  }
  
  if (!result.checks.logic) {
    recommendations.push('修复逻辑问题：检查参数重复和模块配置');
  }
  
  if (!result.checks.dependencies) {
    recommendations.push('修复依赖关系：检查模块和参数依赖是否正确');
  }
  
  if (!result.checks.physics) {
    recommendations.push('修复物理逻辑：检查物理量纲和约束条件');
  }
  
  if (!result.checks.units) {
    recommendations.push('修复单位问题：使用标准单位制');
  }
  
  if (!result.checks.equations) {
    recommendations.push('修复数学方程：检查方程语法和变量定义');
  }
  
  if (result.warnings.length > 0) {
    recommendations.push('处理警告：虽然不影响功能，但建议修复以提高质量');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('IR 质量优秀，可以直接用于后续仿真');
  }
  
  return recommendations;
}

// 运行测试
if (require.main === module) {
  testIRValidator();
}

module.exports = { testIRValidator };
