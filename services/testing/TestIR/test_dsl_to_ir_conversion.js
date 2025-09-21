/**
 * 测试 DSL 到 IR 转换
 * 
 * 测试流程：
 * 1. 加载现有的 DSL 文件
 * 2. 使用 IRConverter 转换为 IR
 * 3. 验证 IR 结构
 * 4. 生成测试报告
 */

const fs = require('fs');
const path = require('path');

// 导入 IR 转换器
const { IRConverter } = require('../../ir/IRConverter.js');

async function testDSLToIRConversion() {
  console.log('🔄 开始测试 DSL 到 IR 转换...\n');

  try {
    // 1. 加载现有的 DSL 文件
    const dslPath = path.join(__dirname, '../TestDSL/outputs/dsl_spring_oscillation_wave.json');
    
    if (!fs.existsSync(dslPath)) {
      throw new Error(`DSL 文件不存在: ${dslPath}`);
    }

    const dslContent = fs.readFileSync(dslPath, 'utf8');
    const dsl = JSON.parse(dslContent);
    
    console.log('📋 加载的 DSL 信息:');
    console.log(`   🆔 ID: ${dsl.metadata?.id || 'unknown'}`);
    console.log(`   📚 主题: ${dsl.metadata?.topic || 'unknown'}`);
    console.log(`   🎯 系统类型: ${dsl.metadata?.system_type || 'unknown'}`);
    console.log(`   ⚙️ 参数数量: ${dsl.system?.parameters?.length || 0}`);
    console.log(`   🎬 动画数量: ${dsl.output?.animations?.length || 0}\n`);

    // 2. 初始化 IR 转换器
    const converter = new IRConverter();
    
    // 3. 执行转换
    console.log('🔄 执行 DSL 到 IR 转换...');
    const startTime = Date.now();
    
    const result = await converter.convertDSLToIR(dsl, {
      optimize_for_simulation: true,
      include_derivatives: true,
      precompute_constants: true,
      validate_physics: true,
      verbose: true
    });
    
    const conversionTime = Date.now() - startTime;

    // 4. 验证转换结果
    console.log('\n📊 转换结果:');
    console.log(`   ✅ 成功: ${result.success}`);
    console.log(`   ⏱️ 耗时: ${result.conversion_time}ms`);
    console.log(`   ⚠️ 警告数量: ${result.warnings.length}`);
    console.log(`   ❌ 错误数量: ${result.errors.length}`);
    console.log(`   🚀 优化应用: ${result.optimization_applied.join(', ')}`);

    if (result.success && result.ir) {
      const ir = result.ir;
      
      console.log('\n📋 生成的 IR 信息:');
      console.log(`   🆔 ID: ${ir.metadata.id}`);
      console.log(`   📚 系统类型: ${ir.metadata.system_type}`);
      console.log(`   🎯 难度: ${ir.metadata.difficulty}`);
      console.log(`   📊 模块数量: ${ir.system.modules.length}`);
      console.log(`   ⚙️ 参数数量: ${ir.system.parameters.length}`);
      console.log(`   🎬 对象数量: ${ir.system.objects.length}`);
      console.log(`   📐 方程数量: ${ir.system.modules.reduce((sum, m) => sum + m.equations.length, 0)}`);
      
      console.log('\n🔧 系统模块详情:');
      ir.system.modules.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.name} (${module.type})`);
        console.log(`      📝 描述: ${module.description}`);
        console.log(`      ⚙️ 参数: ${module.parameters.map(p => p.symbol).join(', ')}`);
        console.log(`      📐 方程: ${module.equations.length} 个`);
        console.log(`      📤 输出: ${module.output.join(', ')}`);
      });

      console.log('\n⚙️ 仿真配置:');
      console.log(`   ⏱️ 时长: ${ir.simulation.duration.value} ${ir.simulation.duration.unit}`);
      console.log(`   📊 时间步长: ${ir.simulation.time_step.value} ${ir.simulation.time_step.unit}`);
      console.log(`   🔧 求解器: ${ir.simulation.solver}`);
      console.log(`   🎯 精度: ${ir.simulation.precision}`);

      console.log('\n🎬 输出配置:');
      console.log(`   📊 图表数量: ${ir.output.plots.length}`);
      console.log(`   🎬 动画数量: ${ir.output.animations.length}`);
      console.log(`   📤 导出格式: ${ir.output.export_formats.join(', ')}`);

      console.log('\n🚀 优化配置:');
      console.log(`   💾 预计算值: ${Object.keys(ir.optimization.precomputed_values).length} 个`);
      console.log(`   📐 缓存导数: ${Object.keys(ir.optimization.cached_derivatives).length} 个`);
      console.log(`   🔗 依赖关系: ${Object.keys(ir.optimization.dependency_graph).length} 个模块`);

      console.log('\n✅ 验证结果:');
      console.log(`   🏗️ 结构有效: ${ir.validation.structure_valid ? '✅' : '❌'}`);
      console.log(`   🔬 物理有效: ${ir.validation.physics_valid ? '✅' : '❌'}`);
      console.log(`   📏 单位一致: ${ir.validation.units_consistent ? '✅' : '❌'}`);
      console.log(`   🔗 约束满足: ${ir.validation.constraints_satisfied ? '✅' : '❌'}`);

      // 5. 保存 IR 文件
      const outputDir = path.join(__dirname, 'outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const irPath = path.join(outputDir, `ir_${ir.metadata.id}.json`);
      fs.writeFileSync(irPath, JSON.stringify(ir, null, 2));
      console.log(`\n💾 IR 已保存到: ${irPath}`);

      // 6. 生成测试报告
      const report = {
        test_name: 'DSL 到 IR 转换测试',
        timestamp: new Date().toISOString(),
        input: {
          dsl_file: dslPath,
          dsl_id: dsl.metadata?.id,
          dsl_topic: dsl.metadata?.topic,
          dsl_system_type: dsl.metadata?.system_type
        },
        conversion: {
          success: result.success,
          duration: result.conversion_time,
          optimizations: result.optimization_applied,
          warnings: result.warnings,
          errors: result.errors
        },
        output: {
          ir_id: ir.metadata.id,
          ir_system_type: ir.metadata.system_type,
          modules_count: ir.system.modules.length,
          parameters_count: ir.system.parameters.length,
          objects_count: ir.system.objects.length,
          equations_count: ir.system.modules.reduce((sum, m) => sum + m.equations.length, 0)
        },
        validation: ir.validation,
        files: {
          ir_output: irPath
        }
      };

      const reportPath = path.join(outputDir, `test_report_dsl_to_ir.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`💾 测试报告已保存到: ${reportPath}`);

    } else {
      console.log('\n❌ 转换失败:');
      result.errors.forEach(error => console.log(`   ❌ ${error}`));
      result.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
    }

    console.log(`\n⏱️ 总耗时: ${conversionTime}ms`);
    console.log('🎉 DSL 到 IR 转换测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testDSLToIRConversion();
}

module.exports = { testDSLToIRConversion };
