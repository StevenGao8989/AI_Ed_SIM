// services/testing/TestDSL/test_physics_dsl_generator.js
// 测试完整的端到端流程：用户输入 → AI解析 → DSL生成

const { PhysicsDslGenerator } = require('../../PhysicsDslGenerator.js');
const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller.js');
const path = require('path');
const fs = require('fs');

// 加载环境变量
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key] = value;
          if (key === 'NEXT_PUBLIC_DEEPSEEK_API_KEY') {
            process.env.DEEPSEEK_API_KEY = value;
          }
        }
      }
    }
    
    console.log('✅ 已加载 .env.local 文件');
    console.log(`🔑 检测到 API Key: ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
  } else {
    console.log('⚠️ 未找到 .env.local 文件，使用系统环境变量');
  }
}

loadEnvLocal();

// 测试配置
const TEST_CONFIG = {
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
  enableLogging: true,
  timeout: 30000,
  retryCount: 2
};

// ============================================================================
// 📝 题目配置区域 - 在这里修改要测试的题目
// ============================================================================
const TEST_PROBLEM = {
  id: 'spring_oscillation_wave',
  title: '弹簧振子与简谐波',
  question: `一根劲度系数为 100 N/m 的轻弹簧竖直固定在天花板上，下端挂一质量 0.5 kg 的小球，处于平衡状态。小球被轻轻拉下 0.1 m 后释放。此时有一列简谐横波沿水平方向传播，波动方程为：

y = 0.02sin(20πt - 0.5πx) (m)

问题：
1. 小球的振动周期是多少？
2. 小球在释放后的最大加速度是多少？
3. 写出该波的频率、波长和传播速度。

涉及模块：力学（弹簧振子）、波动（简谐波）。`,
  expectedTopics: ['oscillation', 'wave_motion'],
  expectedSystemType: 'oscillatory_system',
  difficulty: 'medium'
};

// 如果你想测试其他题目，只需要修改上面的 TEST_PROBLEM 对象即可
// 例如：
// const TEST_PROBLEM = {
//   id: 'your_problem_id',
//   title: '你的题目标题',
//   question: '你的题目内容...',
//   expectedTopics: ['topic1', 'topic2'],
//   expectedSystemType: 'system_type',
//   difficulty: 'easy/medium/hard'
// };
// ============================================================================

// 创建测试用的模拟 ParsedQuestion 数据
function createMockParsedQuestion(problem) {
  const baseQuestion = {
    id: `test_${problem.id}`,
    originalText: problem.question,
    topic: problem.expectedTopics[0],
    difficulty: problem.difficulty,
    parameters: [],
    unknowns: [],
    constants: [],
    formulas: [],
    constraints: [],
    target: {
      primary: '计算主要物理量',
      secondary: []
    },
    solutionPath: {
      steps: [],
      modules: [],
      dependencies: [],
      executionOrder: []
    },
    dslMetadata: {
      complexity: problem.difficulty,
      moduleCount: 2,
      confidence: 0.85
    }
  };

  // 根据题目类型添加特定参数
  switch (problem.id) {
    case 'simple_mechanics':
      baseQuestion.parameters = [
        { symbol: 'm', name: '质量', value: 2, unit: 'kg', role: 'given', domain: 'mechanics' },
        { symbol: 'h', name: '高度', value: 10, unit: 'm', role: 'given', domain: 'mechanics' },
        { symbol: 'g', name: '重力加速度', value: 9.8, unit: 'm/s²', role: 'constant', domain: 'mechanics' }
      ];
      baseQuestion.unknowns = [
        { symbol: 'v', name: '落地速度', unit: 'm/s', role: 'unknown', domain: 'mechanics' }
      ];
      baseQuestion.formulas = [
        { id: 'kinematic_equation', expression: 'v² = 2gh', description: '运动学方程' }
      ];
      break;

    case 'medium_electromagnetism':
      baseQuestion.parameters = [
        { symbol: 'l', name: '导体棒长度', value: 0.5, unit: 'm', role: 'given', domain: 'electromagnetism' },
        { symbol: 'B', name: '磁感应强度', value: 0.2, unit: 'T', role: 'given', domain: 'electromagnetism' },
        { symbol: 'v', name: '运动速度', value: 3, unit: 'm/s', role: 'given', domain: 'mechanics' }
      ];
      baseQuestion.unknowns = [
        { symbol: 'ε', name: '感应电动势', unit: 'V', role: 'unknown', domain: 'electromagnetism' }
      ];
      baseQuestion.formulas = [
        { id: 'faraday_law', expression: 'ε = Blv', description: '法拉第电磁感应定律' }
      ];
      break;

    case 'complex_thermodynamics':
      baseQuestion.parameters = [
        { symbol: 'n', name: '物质的量', value: 1, unit: 'mol', role: 'given', domain: 'thermodynamics' },
        { symbol: 'T', name: '温度', value: 300, unit: 'K', role: 'given', domain: 'thermodynamics' },
        { symbol: 'V1', name: '初始体积', value: 1, unit: 'L', role: 'given', domain: 'thermodynamics' },
        { symbol: 'V2', name: '最终体积', value: 3, unit: 'L', role: 'given', domain: 'thermodynamics' },
        { symbol: 'R', name: '气体常数', value: 8.314, unit: 'J/(mol·K)', role: 'constant', domain: 'thermodynamics' }
      ];
      baseQuestion.unknowns = [
        { symbol: 'W', name: '气体对外做功', unit: 'J', role: 'unknown', domain: 'thermodynamics' }
      ];
      baseQuestion.formulas = [
        { id: 'isothermal_work', expression: 'W = nRT ln(V2/V1)', description: '等温过程做功公式' }
      ];
      break;

    case 'oscillation_wave':
      baseQuestion.parameters = [
        { symbol: 'm', name: '物体质量', value: 0.5, unit: 'kg', role: 'given', domain: 'mechanics' },
        { symbol: 'k', name: '劲度系数', value: 100, unit: 'N/m', role: 'given', domain: 'mechanics' }
      ];
      baseQuestion.unknowns = [
        { symbol: 'T', name: '振动周期', unit: 's', role: 'unknown', domain: 'oscillation' },
        { symbol: 'f', name: '振动频率', unit: 'Hz', role: 'unknown', domain: 'oscillation' }
      ];
      baseQuestion.formulas = [
        { id: 'period_formula', expression: 'T = 2π√(m/k)', description: '简谐振动周期公式' },
        { id: 'frequency_formula', expression: 'f = 1/T', description: '频率公式' }
      ];
      break;

    case 'optics_quantum':
      baseQuestion.parameters = [
        { symbol: 'λ', name: '波长', value: 500e-9, unit: 'm', role: 'given', domain: 'optics' },
        { symbol: 'h', name: '普朗克常数', value: 6.626e-34, unit: 'J·s', role: 'constant', domain: 'quantum_mechanics' },
        { symbol: 'c', name: '光速', value: 3e8, unit: 'm/s', role: 'constant', domain: 'optics' }
      ];
      baseQuestion.unknowns = [
        { symbol: 'E', name: '光子能量', unit: 'J', role: 'unknown', domain: 'quantum_mechanics' },
        { symbol: 'p', name: '光子动量', unit: 'kg·m/s', role: 'unknown', domain: 'quantum_mechanics' }
      ];
      baseQuestion.formulas = [
        { id: 'photon_energy', expression: 'E = hc/λ', description: '光子能量公式' },
        { id: 'photon_momentum', expression: 'p = h/λ', description: '光子动量公式' }
      ];
      break;
  }

  return baseQuestion;
}

// 测试单道题目的端到端流程
async function testSingleProblem() {
  console.log('🚀 开始测试单道物理题目...\n');
  console.log('📋 流程: 用户输入题目 → AI解析 → DSL生成\n');

  // 检查 API Key
  if (!TEST_CONFIG.apiKey) {
    console.error('❌ 未找到 DEEPSEEK_API_KEY，请设置环境变量');
    console.log('💡 提示: 在 .env.local 文件中设置 NEXT_PUBLIC_DEEPSEEK_API_KEY');
    console.log('💡 或者设置环境变量: export DEEPSEEK_API_KEY=your_api_key');
    return;
  }

  console.log(`${'='.repeat(80)}`);
  console.log(`📝 测试题目: ${TEST_PROBLEM.title}`);
  console.log(`📊 难度等级: ${TEST_PROBLEM.difficulty}`);
  console.log(`🎯 预期主题: ${TEST_PROBLEM.expectedTopics.join(', ')}`);
  console.log(`⚙️ 预期系统类型: ${TEST_PROBLEM.expectedSystemType}`);
  console.log(`${'='.repeat(80)}`);

  console.log(`\n📋 题目内容:`);
  console.log(TEST_PROBLEM.question);

  try {
    const totalStartTime = Date.now();

    // 初始化组件
    console.log('\n🔄 初始化 AI 解析器和 DSL 生成器...');
    const aiParser = new PhysicsAIParserAICaller(TEST_CONFIG.apiKey);
    const dslGenerator = new PhysicsDslGenerator();
    console.log('✅ 组件初始化完成');

    // 步骤 1: AI 解析题目
    console.log('\n🔄 步骤 1: 使用 AI 解析题目...');
    const parseStartTime = Date.now();
    
    // 使用带回退的解析方法，但确保优先使用 AI 解析
    const parsedQuestion = await aiParser.parseQuestionWithAtomicModules(TEST_PROBLEM.question, {
      enableModuleDecomposition: true,
      enableModuleComposition: true,
      language: 'zh',
      enableAdvancedAnalysis: true,
      enableFormulaExtraction: true,
      enableUnitOptimization: true
    });
    
    const parseDuration = Date.now() - parseStartTime;
    console.log(`✅ AI 解析成功 (耗时: ${parseDuration}ms)`);
    
    // 检查解析结果是否包含 AI 增强的数据
    const hasAIEnhancement = parsedQuestion.formulas && parsedQuestion.formulas.length > 0;
    console.log(`🤖 AI 增强状态: ${hasAIEnhancement ? '已启用' : '未启用'}`);
    
    // 输出解析结果摘要
    console.log(`\n📊 解析结果摘要:`);
    console.log(`   🎯 主题: ${parsedQuestion.topic}`);
    console.log(`   📋 参数数量: ${parsedQuestion.parameters?.length || 0}`);
    console.log(`   ❓ 未知量数量: ${parsedQuestion.unknowns?.length || 0}`);
    console.log(`   📐 公式数量: ${parsedQuestion.formulas?.length || 0}`);
    console.log(`   🔗 约束条件数量: ${parsedQuestion.constraints?.length || 0}`);
    
    // 显示完整的解析结果结构
    console.log(`\n📋 完整解析结果:`);
    console.log(JSON.stringify(parsedQuestion, null, 2));

    // 显示解析的详细参数
    if (parsedQuestion.parameters && parsedQuestion.parameters.length > 0) {
      console.log(`\n📋 解析的参数:`);
      parsedQuestion.parameters.forEach((param, index) => {
        console.log(`   ${index + 1}. ${param.symbol} (${param.name}): ${param.value} ${param.unit} [${param.role}]`);
      });
    }

    if (parsedQuestion.unknowns && parsedQuestion.unknowns.length > 0) {
      console.log(`\n❓ 未知量:`);
      parsedQuestion.unknowns.forEach((unknown, index) => {
        console.log(`   ${index + 1}. ${unknown.symbol} (${unknown.name}): ${unknown.unit} [${unknown.role}]`);
      });
    }

    if (parsedQuestion.formulas && parsedQuestion.formulas.length > 0) {
      console.log(`\n📐 公式:`);
      parsedQuestion.formulas.forEach((formula, index) => {
        console.log(`   ${index + 1}. ${formula.expression} - ${formula.description}`);
      });
    }

    // 步骤 2: 生成 DSL
    console.log('\n🔄 步骤 2: 生成 PhysicsDSL...');
    const dslStartTime = Date.now();
    
    const dsl = dslGenerator.generateDSL(parsedQuestion);
    
    const dslDuration = Date.now() - dslStartTime;
    console.log(`✅ DSL 生成成功 (耗时: ${dslDuration}ms)`);

    const totalDuration = Date.now() - totalStartTime;

    // 步骤 3: 验证生成的 DSL
    console.log('\n🔄 步骤 3: 验证 DSL 结构...');
    const validation = validateDSLStructure(dsl, TEST_PROBLEM);
    
    // 输出详细验证结果
    console.log(`\n📊 DSL 验证结果:`);
    console.log(`   ✅ 结构完整性: ${validation.structureValid ? '通过' : '失败'}`);
    console.log(`   ✅ 元数据正确性: ${validation.metadataValid ? '通过' : '失败'}`);
    console.log(`   ✅ 系统配置正确性: ${validation.systemValid ? '通过' : '失败'}`);
    console.log(`   ✅ 仿真配置正确性: ${validation.simulationValid ? '通过' : '失败'}`);
    console.log(`   ✅ 输出配置正确性: ${validation.outputValid ? '通过' : '失败'}`);
    
    if (validation.errors.length > 0) {
      console.log(`   ❌ 错误:`);
      validation.errors.forEach(error => console.log(`      - ${error}`));
    }
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️ 警告:`);
      validation.warnings.forEach(warning => console.log(`      - ${warning}`));
    }

    // 输出 DSL 摘要
    console.log(`\n📋 生成的 DSL 摘要:`);
    console.log(`   🆔 系统ID: ${dsl.metadata?.id || 'N/A'}`);
    console.log(`   📚 主题: ${dsl.metadata?.topic || 'N/A'}`);
    console.log(`   🎯 系统类型: ${dsl.metadata?.system_type || 'N/A'}`);
    console.log(`   📊 难度: ${dsl.metadata?.difficulty || 'N/A'}`);
    console.log(`   🎓 学段: ${dsl.metadata?.grade || 'N/A'}`);
    console.log(`   ⚙️ 系统参数数量: ${dsl.system?.parameters?.length || 0}`);
    console.log(`   🎬 动画配置数量: ${dsl.output?.visualization?.animations?.length || 0}`);
    console.log(`   📊 图表配置数量: ${dsl.output?.visualization?.plots?.length || 0}`);

    // 显示系统参数详情
    if (dsl.system?.parameters?.length > 0) {
      console.log(`\n⚙️ 系统参数详情:`);
      dsl.system.parameters.forEach((param, index) => {
        console.log(`   ${index + 1}. ${param.symbol} (${param.name}): ${param.value?.value} ${param.value?.unit} [${param.role}]`);
      });
    }

    // 显示仿真配置
    if (dsl.simulation) {
      console.log(`\n🎮 仿真配置:`);
      console.log(`   时长: ${dsl.simulation.duration?.value} ${dsl.simulation.duration?.unit}`);
      console.log(`   时间步长: ${dsl.simulation.time_step?.value} ${dsl.simulation.time_step?.unit}`);
      console.log(`   求解器: ${dsl.simulation.solver}`);
      console.log(`   精度: ${dsl.simulation.precision}`);
    }

    // 保存结果到文件
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 保存解析结果
    const parseOutputPath = path.join(outputDir, `parsed_${TEST_PROBLEM.id}.json`);
    fs.writeFileSync(parseOutputPath, JSON.stringify(parsedQuestion, null, 2));
    console.log(`\n💾 解析结果已保存到: ${parseOutputPath}`);

    // 保存 DSL 结果
    const dslOutputPath = path.join(outputDir, `dsl_${TEST_PROBLEM.id}.json`);
    fs.writeFileSync(dslOutputPath, JSON.stringify(dsl, null, 2));
    console.log(`💾 DSL 已保存到: ${dslOutputPath}`);

    // 生成测试报告
    const report = {
      timestamp: new Date().toISOString(),
      problem: TEST_PROBLEM,
      success: validation.isValid,
      timings: {
        parse: parseDuration,
        dsl: dslDuration,
        total: totalDuration
      },
      validation: validation,
      summary: {
        parsedParameters: parsedQuestion.parameters?.length || 0,
        parsedUnknowns: parsedQuestion.unknowns?.length || 0,
        parsedFormulas: parsedQuestion.formulas?.length || 0,
        dslParameters: dsl.system?.parameters?.length || 0,
        dslAnimations: dsl.output?.visualization?.animations?.length || 0,
        dslPlots: dsl.output?.visualization?.plots?.length || 0
      }
    };

    const reportPath = path.join(outputDir, `test_report_${TEST_PROBLEM.id}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 测试报告已保存到: ${reportPath}`);

    console.log(`\n⏱️ 总耗时: ${totalDuration}ms (AI解析: ${parseDuration}ms, DSL生成: ${dslDuration}ms)`);

    if (validation.isValid) {
      console.log(`\n🎉 测试成功！端到端流程工作正常`);
    } else {
      console.log(`\n⚠️ 测试完成，但存在验证错误`);
    }

  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    console.error(`   错误详情: ${error.stack}`);
    
    // 保存错误报告
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      problem: TEST_PROBLEM,
      success: false,
      error: error.message,
      stack: error.stack
    };
    
    const errorPath = path.join(outputDir, `error_report_${TEST_PROBLEM.id}.json`);
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    console.log(`💾 错误报告已保存到: ${errorPath}`);
  }
}

// 验证 DSL 结构
function validateDSLStructure(dsl, problem) {
  const errors = [];
  const warnings = [];
  let structureValid = false;
  let metadataValid = false;
  let systemValid = false;
  let simulationValid = false;
  let outputValid = false;

  try {
    // 1. 检查基本结构
    if (!dsl) {
      errors.push('DSL 对象为空');
      return { isValid: false, errors, warnings, structureValid, metadataValid, systemValid, simulationValid, outputValid };
    }

    const requiredSections = ['metadata', 'system', 'simulation', 'output', 'syllabus'];
    const missingSections = requiredSections.filter(section => !dsl[section]);
    
    if (missingSections.length > 0) {
      errors.push(`缺少必需部分: ${missingSections.join(', ')}`);
    } else {
      structureValid = true;
    }

    // 2. 验证元数据
    if (dsl.metadata) {
      const requiredMetadata = ['id', 'version', 'created_at', 'subject', 'topic', 'topic_id', 'system_type', 'grade', 'difficulty'];
      const missingMetadata = requiredMetadata.filter(field => !dsl.metadata[field]);
      
      if (missingMetadata.length > 0) {
        errors.push(`元数据缺少字段: ${missingMetadata.join(', ')}`);
      } else {
        metadataValid = true;
      }

      // 检查主题匹配
      if (dsl.metadata.topic && !problem.expectedTopics.includes(dsl.metadata.topic)) {
        warnings.push(`主题不匹配: 预期 ${problem.expectedTopics.join(' 或 ')}, 实际 ${dsl.metadata.topic}`);
      }

      // 检查系统类型匹配
      if (dsl.metadata.system_type && dsl.metadata.system_type !== problem.expectedSystemType) {
        warnings.push(`系统类型不匹配: 预期 ${problem.expectedSystemType}, 实际 ${dsl.metadata.system_type}`);
      }
    }

    // 3. 验证系统配置
    if (dsl.system) {
      const requiredSystemFields = ['type', 'dimensions', 'parameters', 'initial_conditions', 'constraints', 'constants', 'objects', 'materials', 'environment'];
      const missingSystemFields = requiredSystemFields.filter(field => !dsl.system[field]);
      
      if (missingSystemFields.length > 0) {
        errors.push(`系统配置缺少字段: ${missingSystemFields.join(', ')}`);
      } else {
        systemValid = true;
      }

      // 检查参数数组
      if (!Array.isArray(dsl.system.parameters)) {
        errors.push('系统参数必须是数组');
      }

      // 检查初始条件数组
      if (!Array.isArray(dsl.system.initial_conditions)) {
        errors.push('初始条件必须是数组');
      }
    }

    // 4. 验证仿真配置
    if (dsl.simulation) {
      const requiredSimulationFields = ['duration', 'time_step', 'solver', 'precision', 'events'];
      const missingSimulationFields = requiredSimulationFields.filter(field => !dsl.simulation[field]);
      
      if (missingSimulationFields.length > 0) {
        errors.push(`仿真配置缺少字段: ${missingSimulationFields.join(', ')}`);
      } else {
        simulationValid = true;
      }

      // 检查时间配置
      if (dsl.simulation.duration && typeof dsl.simulation.duration.value !== 'number') {
        errors.push('仿真时长必须是数字');
      }

      if (dsl.simulation.time_step && typeof dsl.simulation.time_step.value !== 'number') {
        errors.push('时间步长必须是数字');
      }
    }

    // 5. 验证输出配置
    if (dsl.output) {
      const requiredOutputFields = ['variables', 'export_formats', 'visualization'];
      const missingOutputFields = requiredOutputFields.filter(field => !dsl.output[field]);
      
      if (missingOutputFields.length > 0) {
        errors.push(`输出配置缺少字段: ${missingOutputFields.join(', ')}`);
      } else {
        outputValid = true;
      }

      // 检查可视化配置
      if (dsl.output.visualization) {
        if (!Array.isArray(dsl.output.visualization.plots)) {
          errors.push('可视化图表必须是数组');
        }
        if (!Array.isArray(dsl.output.visualization.animations)) {
          errors.push('可视化动画必须是数组');
        }
      }
    }

  } catch (error) {
    errors.push(`验证过程中发生错误: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    structureValid,
    metadataValid,
    systemValid,
    simulationValid,
    outputValid
  };
}

// 生成测试报告
function generateTestReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 端到端流程测试报告');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  
  const totalParseTime = results.reduce((sum, r) => sum + (r.timings?.parse || 0), 0);
  const totalDslTime = results.reduce((sum, r) => sum + (r.timings?.dsl || 0), 0);
  const totalTime = results.reduce((sum, r) => sum + (r.timings?.total || 0), 0);
  
  const averageParseTime = totalParseTime / totalTests;
  const averageDslTime = totalDslTime / totalTests;
  const averageTotalTime = totalTime / totalTests;

  console.log(`\n📈 总体统计:`);
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   成功测试: ${successfulTests} (${(successfulTests/totalTests*100).toFixed(1)}%)`);
  console.log(`   失败测试: ${failedTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`   总耗时: ${totalTime}ms`);
  console.log(`   平均总耗时: ${averageTotalTime.toFixed(1)}ms`);
  console.log(`   平均AI解析耗时: ${averageParseTime.toFixed(1)}ms`);
  console.log(`   平均DSL生成耗时: ${averageDslTime.toFixed(1)}ms`);

  console.log(`\n📋 详细结果:`);
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const timings = result.timings || { parse: 0, dsl: 0, total: 0 };
    console.log(`   ${index + 1}. ${status} ${result.problem.title}`);
    console.log(`      ⏱️ 总耗时: ${timings.total}ms (AI解析: ${timings.parse}ms, DSL生成: ${timings.dsl}ms)`);
    
    if (!result.success && result.validation.errors.length > 0) {
      result.validation.errors.forEach(error => {
        console.log(`      ❌ ${error}`);
      });
    }
    
    if (result.validation.warnings.length > 0) {
      result.validation.warnings.forEach(warning => {
        console.log(`      ⚠️ ${warning}`);
      });
    }
  });

  // 保存报告到文件
  const reportPath = path.join(__dirname, 'end_to_end_test_report.json');
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'end_to_end_flow',
    summary: {
      totalTests,
      successfulTests,
      failedTests,
      successRate: (successfulTests/totalTests*100).toFixed(1) + '%',
      totalTime,
      averageTotalTime: averageTotalTime.toFixed(1),
      averageParseTime: averageParseTime.toFixed(1),
      averageDslTime: averageDslTime.toFixed(1)
    },
    results: results.map(r => ({
      problem: r.problem,
      success: r.success,
      timings: r.timings,
      validation: r.validation,
      hasParsedQuestion: !!r.parsedQuestion,
      hasDsl: !!r.dsl
    }))
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 详细报告已保存到: ${reportPath}`);

  // 性能分析
  console.log(`\n⚡ 性能分析:`);
  const fastParseTests = results.filter(r => (r.timings?.parse || 0) < 5000).length;
  const mediumParseTests = results.filter(r => (r.timings?.parse || 0) >= 5000 && (r.timings?.parse || 0) < 15000).length;
  const slowParseTests = results.filter(r => (r.timings?.parse || 0) >= 15000).length;
  
  const fastDslTests = results.filter(r => (r.timings?.dsl || 0) < 100).length;
  const mediumDslTests = results.filter(r => (r.timings?.dsl || 0) >= 100 && (r.timings?.dsl || 0) < 500).length;
  const slowDslTests = results.filter(r => (r.timings?.dsl || 0) >= 500).length;
  
  console.log(`   AI解析性能:`);
  console.log(`     快速 (< 5s): ${fastParseTests} 个`);
  console.log(`     中等 (5-15s): ${mediumParseTests} 个`);
  console.log(`     较慢 (> 15s): ${slowParseTests} 个`);
  
  console.log(`   DSL生成性能:`);
  console.log(`     快速 (< 100ms): ${fastDslTests} 个`);
  console.log(`     中等 (100-500ms): ${mediumDslTests} 个`);
  console.log(`     较慢 (> 500ms): ${slowDslTests} 个`);

  // 建议
  console.log(`\n💡 建议:`);
  if (failedTests > 0) {
    console.log(`   - 修复 ${failedTests} 个失败的测试`);
  }
  if (slowParseTests > 0) {
    console.log(`   - 优化 ${slowParseTests} 个较慢的AI解析性能`);
  }
  if (slowDslTests > 0) {
    console.log(`   - 优化 ${slowDslTests} 个较慢的DSL生成性能`);
  }
  if (successfulTests === totalTests) {
    console.log(`   - 🎉 所有测试通过！端到端流程工作正常`);
  }

  console.log('\n' + '='.repeat(80));
}

// 运行测试
if (require.main === module) {
  testSingleProblem().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testSingleProblem,
  createMockParsedQuestion,
  validateDSLStructure,
  generateTestReport
};
