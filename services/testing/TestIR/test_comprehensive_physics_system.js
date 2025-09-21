/**
 * 综合物理系统测试
 * 测试增强后的 IRConverter 和 IRValidator 对多种物理题目的处理能力
 */

const fs = require('fs');
const path = require('path');

// 导入编译后的模块
const { IRConverter } = require('../../ir/IRConverter');
const { IRValidator } = require('../../ir/IRValidator');

// 测试题目配置
const TEST_PROBLEMS = [
  {
    id: 'spring_oscillator',
    title: '弹簧振子',
    dsl: {
      metadata: {
        id: 'spring_test',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        subject: 'physics',
        topic: '简谐运动',
        topic_id: 'oscillation',
        system_type: 'oscillatory_system',
        grade: '高一',
        difficulty: 'medium',
        timestamp: new Date().toISOString(),
        source_question: '弹簧振子简谐运动'
      },
      system: {
        type: 'oscillatory_system',
        dimensions: 2,
        parameters: [
          { symbol: 'm', value: { value: 0.5, unit: 'kg' }, role: 'given', description: '质量' },
          { symbol: 'k', value: { value: 100, unit: 'N/m' }, role: 'given', description: '弹簧常数' },
          { symbol: 'A', value: { value: 0.1, unit: 'm' }, role: 'given', description: '振幅' }
        ],
        initial_conditions: [
          { name: 'x0', value: { value: 0.1, unit: 'm' }, description: '初始位移' },
          { name: 'v0', value: { value: 0, unit: 'm/s' }, description: '初始速度' }
        ],
        constraints: [],
        constants: [],
        objects: [],
        materials: [],
        environment: { gravity: { value: 9.8, unit: 'm/s²' } }
      },
      simulation: {
        duration: { value: 10, unit: 's' },
        time_step: { value: 0.01, unit: 's' },
        solver: 'rk4',
        precision: 'high'
      },
      output: {
        variables: ['x', 'v', 'a', 'E'],
        export_formats: ['csv', 'json'],
        plots: [
          { type: 'time_series', variables: ['x', 'v'], title: '位移和速度随时间变化' }
        ],
        animations: [
          { type: '2d', duration: 10, speed: 1.0, easing: 'ease_in_out' }
        ]
      },
      syllabus: {
        grade: '高一',
        topic: '简谐运动'
      }
    }
  },
  {
    id: 'projectile_motion',
    title: '抛体运动',
    dsl: {
      metadata: {
        id: 'projectile_test',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        subject: 'physics',
        topic: '抛体运动',
        topic_id: 'kinematics',
        system_type: 'kinematics_2d',
        grade: '高一',
        difficulty: 'medium',
        timestamp: new Date().toISOString(),
        source_question: '斜抛运动'
      },
      system: {
        type: 'kinematics_2d',
        dimensions: 2,
        parameters: [
          { symbol: 'v0', value: { value: 20, unit: 'm/s' }, role: 'given', description: '初速度' },
          { symbol: 'θ', value: { value: 45, unit: '°' }, role: 'given', description: '抛射角' },
          { symbol: 'g', value: { value: 9.8, unit: 'm/s²' }, role: 'constant', description: '重力加速度' }
        ],
        initial_conditions: [
          { name: 'x0', value: { value: 0, unit: 'm' }, description: '初始x坐标' },
          { name: 'y0', value: { value: 0, unit: 'm' }, description: '初始y坐标' },
          { name: 'vx0', value: { value: 14.14, unit: 'm/s' }, description: '初始x速度' },
          { name: 'vy0', value: { value: 14.14, unit: 'm/s' }, description: '初始y速度' }
        ],
        constraints: [],
        constants: [],
        objects: [],
        materials: [],
        environment: { gravity: { value: 9.8, unit: 'm/s²' } }
      },
      simulation: {
        duration: { value: 5, unit: 's' },
        time_step: { value: 0.01, unit: 's' },
        solver: 'rk4',
        precision: 'high'
      },
      output: {
        variables: ['x', 'y', 'vx', 'vy', 'v', 'θ'],
        export_formats: ['csv', 'json'],
        plots: [
          { type: 'trajectory', variables: ['x', 'y'], title: '抛体轨迹' }
        ],
        animations: [
          { type: '2d', duration: 5, speed: 1.0, easing: 'ease_in_out' }
        ]
      },
      syllabus: {
        grade: '高一',
        topic: '抛体运动'
      }
    }
  },
  {
    id: 'electromagnetic_field',
    title: '电磁场',
    dsl: {
      metadata: {
        id: 'em_field_test',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        subject: 'physics',
        topic: '电磁场',
        topic_id: 'electromagnetic',
        system_type: 'electromagnetic_field',
        grade: '高二',
        difficulty: 'hard',
        timestamp: new Date().toISOString(),
        source_question: '带电粒子在电磁场中的运动'
      },
      system: {
        type: 'electromagnetic_field',
        dimensions: 3,
        parameters: [
          { symbol: 'q', value: { value: 1.6e-19, unit: 'C' }, role: 'given', description: '电荷' },
          { symbol: 'm', value: { value: 9.1e-31, unit: 'kg' }, role: 'given', description: '质量' },
          { symbol: 'E', value: { value: 1000, unit: 'V/m' }, role: 'given', description: '电场强度' },
          { symbol: 'B', value: { value: 0.1, unit: 'T' }, role: 'given', description: '磁感应强度' }
        ],
        initial_conditions: [
          { name: 'x0', value: { value: 0, unit: 'm' }, description: '初始x坐标' },
          { name: 'y0', value: { value: 0, unit: 'm' }, description: '初始y坐标' },
          { name: 'z0', value: { value: 0, unit: 'm' }, description: '初始z坐标' },
          { name: 'vx0', value: { value: 1e6, unit: 'm/s' }, description: '初始x速度' },
          { name: 'vy0', value: { value: 0, unit: 'm/s' }, description: '初始y速度' },
          { name: 'vz0', value: { value: 0, unit: 'm/s' }, description: '初始z速度' }
        ],
        constraints: [],
        constants: [],
        objects: [],
        materials: [],
        environment: { 
          gravity: { value: 9.8, unit: 'm/s²' },
          electric_field: { x: 1000, y: 0, z: 0 },
          magnetic_field: { x: 0, y: 0, z: 0.1 }
        }
      },
      simulation: {
        duration: { value: 1e-6, unit: 's' },
        time_step: { value: 1e-9, unit: 's' },
        solver: 'rk4',
        precision: 'ultra'
      },
      output: {
        variables: ['x', 'y', 'z', 'vx', 'vy', 'vz', 'F', 'a'],
        export_formats: ['csv', 'json'],
        plots: [
          { type: 'trajectory', variables: ['x', 'y'], title: '粒子轨迹' }
        ],
        animations: [
          { type: '3d', duration: 1e-6, speed: 1.0, easing: 'ease_in_out' }
        ]
      },
      syllabus: {
        grade: '高二',
        topic: '电磁场'
      }
    }
  }
];

/**
 * 运行综合测试
 */
async function runComprehensiveTest() {
  console.log('🚀 开始综合物理系统测试...\n');

  const results = [];
  const irConverter = new IRConverter();
  const irValidator = new IRValidator();

  for (const problem of TEST_PROBLEMS) {
    console.log(`📋 测试题目: ${problem.title} (${problem.id})`);
    console.log(`   📚 主题: ${problem.dsl.metadata.topic}`);
    console.log(`   🎯 系统类型: ${problem.dsl.metadata.system_type}`);
    console.log(`   📊 难度: ${problem.dsl.metadata.difficulty}`);
    console.log(`   ⚙️ 参数数量: ${problem.dsl.system.parameters.length}`);

    try {
      // 1. DSL 到 IR 转换
      console.log('   🔄 执行 DSL 到 IR 转换...');
      const conversionResult = await irConverter.convertDSLToIR(problem.dsl, { verbose: false });
      
      if (!conversionResult.success) {
        throw new Error(`转换失败: ${conversionResult.error}`);
      }

      const ir = conversionResult.ir;
      console.log(`   ✅ 转换成功 (耗时: ${conversionResult.duration}ms)`);
      console.log(`   📊 生成模块数量: ${ir.system.modules.length}`);
      console.log(`   ⚙️ 系统参数数量: ${ir.system.parameters.length}`);

      // 2. IR 验证
      console.log('   🔍 执行 IR 验证...');
      const validationResult = irValidator.validate(ir, {
        check_physics: true,
        check_units: true,
        check_dependencies: true,
        verbose: false
      });

      console.log(`   ✅ 验证完成 (耗时: ${validationResult.statistics?.total_checks || 0}ms)`);
      console.log(`   📊 质量评分: ${validationResult.statistics?.passed_checks || 0}/${validationResult.statistics?.total_checks || 0}`);
      console.log(`   ❌ 错误数量: ${validationResult.errors.length}`);
      console.log(`   ⚠️ 警告数量: ${validationResult.warnings.length}`);

      // 3. 保存结果
      const outputDir = path.join(__dirname, 'outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = Date.now();
      const irFile = path.join(outputDir, `ir_${problem.id}_${timestamp}.json`);
      const validationFile = path.join(outputDir, `validation_${problem.id}_${timestamp}.json`);

      fs.writeFileSync(irFile, JSON.stringify(ir, null, 2));
      fs.writeFileSync(validationFile, JSON.stringify(validationResult, null, 2));

      // 4. 记录结果
      const result = {
        problem: {
          id: problem.id,
          title: problem.title,
          topic: problem.dsl.metadata.topic,
          system_type: problem.dsl.metadata.system_type,
          difficulty: problem.dsl.metadata.difficulty
        },
        conversion: {
          success: conversionResult.success,
          duration: conversionResult.duration,
          modules_count: ir.system.modules.length,
          parameters_count: ir.system.parameters.length,
          equations_count: ir.system.modules.reduce((sum, m) => sum + m.equations.length, 0)
        },
        validation: {
          is_valid: validationResult.is_valid,
          errors_count: validationResult.errors.length,
          warnings_count: validationResult.warnings.length,
          quality_score: validationResult.statistics ? 
            Math.round((validationResult.statistics.passed_checks / validationResult.statistics.total_checks) * 100) : 0
        },
        files: {
          ir: irFile,
          validation: validationFile
        }
      };

      results.push(result);

      // 5. 显示详细结果
      if (validationResult.errors.length > 0) {
        console.log('   ❌ 验证错误:');
        validationResult.errors.forEach((error, index) => {
          console.log(`      ${index + 1}. ${error}`);
        });
      }

      if (validationResult.warnings.length > 0) {
        console.log('   ⚠️ 验证警告:');
        validationResult.warnings.forEach((warning, index) => {
          console.log(`      ${index + 1}. ${warning}`);
        });
      }

      console.log(`   💾 IR 已保存到: ${irFile}`);
      console.log(`   💾 验证报告已保存到: ${validationFile}\n`);

    } catch (error) {
      console.error(`   ❌ 测试失败: ${error.message}\n`);
      
      results.push({
        problem: {
          id: problem.id,
          title: problem.title,
          topic: problem.dsl.metadata.topic,
          system_type: problem.dsl.metadata.system_type,
          difficulty: problem.dsl.metadata.difficulty
        },
        conversion: { success: false, error: error.message },
        validation: { is_valid: false, error: error.message }
      });
    }
  }

  // 生成综合报告
  console.log('📊 综合测试结果汇总:');
  console.log('='.repeat(60));

  const successfulTests = results.filter(r => r.conversion.success && r.validation.is_valid);
  const failedTests = results.filter(r => !r.conversion.success || !r.validation.is_valid);

  console.log(`✅ 成功测试: ${successfulTests.length}/${results.length}`);
  console.log(`❌ 失败测试: ${failedTests.length}/${results.length}`);

  if (successfulTests.length > 0) {
    const avgQualityScore = successfulTests.reduce((sum, r) => sum + (r.validation.quality_score || 0), 0) / successfulTests.length;
    console.log(`📈 平均质量评分: ${Math.round(avgQualityScore)}/100`);
  }

  console.log('\n📋 详细结果:');
  results.forEach((result, index) => {
    const status = result.conversion.success && result.validation.is_valid ? '✅' : '❌';
    const qualityScore = result.validation.quality_score || 0;
    console.log(`${index + 1}. ${status} ${result.problem.title} (${result.problem.difficulty}) - 质量: ${qualityScore}/100`);
  });

  // 保存综合报告
  const reportFile = path.join(__dirname, 'outputs', `comprehensive_test_report_${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total_tests: results.length,
      successful_tests: successfulTests.length,
      failed_tests: failedTests.length,
      average_quality_score: successfulTests.length > 0 ? 
        Math.round(successfulTests.reduce((sum, r) => sum + (r.validation.quality_score || 0), 0) / successfulTests.length) : 0
    },
    results: results
  }, null, 2));

  console.log(`\n💾 综合报告已保存到: ${reportFile}`);
  console.log('🎉 综合物理系统测试完成！');

  return results;
}

// 运行测试
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest, TEST_PROBLEMS };
