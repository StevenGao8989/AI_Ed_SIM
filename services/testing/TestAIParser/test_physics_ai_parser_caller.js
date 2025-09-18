// services/testing/TestAIParser/test_physics_ai_parser_caller.js
// 测试 PhysicsAIParserAICaller 是否能够调用真实AI解析题目

const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller.js');
const path = require('path');
const fs = require('fs');

// 加载 .env.local 文件
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
          // 如果是 NEXT_PUBLIC_DEEPSEEK_API_KEY，也设置 DEEPSEEK_API_KEY 以便兼容
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

// 在模块加载时加载环境变量
loadEnvLocal();

// 配置验证函数
function validateConfig() {
  const issues = [];
  
  if (!TEST_CONFIG.apiKey) {
    issues.push('API Key 未设置');
  } else if (!TEST_CONFIG.apiKey.startsWith('sk-')) {
    issues.push('API Key 格式可能不正确（应以 sk- 开头）');
  }
  
  if (TEST_CONFIG.temperature < 0 || TEST_CONFIG.temperature > 2) {
    issues.push('Temperature 应在 0-2 之间');
  }
  
  if (TEST_CONFIG.maxTokens < 100) {
    issues.push('Max Tokens 设置过小，可能影响输出质量');
  }
  
  if (TEST_CONFIG.timeout < 5000) {
    issues.push('Timeout 设置过短，可能导致请求失败');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// 测试配置
const TEST_CONFIG = {
  provider: 'deepseek',
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v3',
  temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE) || 0.1,
  maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 2000,
  timeout: parseInt(process.env.DEEPSEEK_TIMEOUT) || 30000,
  retryCount: 2,
  retryDelay: 1000,
  enableLogging: true
};

// 测试题目 - 只测试一道多模块题目
const TEST_QUESTION = {
  id: 'complex_1',
  question: '一个质量为 0.5 kg 的小球从光滑斜面顶端由静止释放，高度为 2 m。斜面底端水平放置一根长度为 0.5 m 的导体棒，棒两端接在电阻 2 Ω 的闭合电路上。整个系统处在垂直于斜面纸面向里的 0.4 T 匀强磁场中。问题：1.小球到达斜面底端的速度是多少？2.当小球以该速度无摩擦地水平通过导体棒时，导体棒切割磁感线产生的感应电动势多大？3.电路中的感应电流是多少？',
  expectedModules: ['kinematics_linear', 'newton_dynamics', 'work_energy'],
  difficulty: 'hard'
};

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

/**
 * 运行单个测试
 */
async function runSingleTest(questionData, parser) {
  const { id, question, expectedModules, difficulty } = questionData;
  
  console.log(`\n🧪 测试 ${id} (${difficulty}): ${question.substring(0, 50)}...`);
  
  try {
    const startTime = Date.now();
    
    // 测试基础解析
    const basicResult = await parser.parseQuestion(question);
    const basicTime = Date.now() - startTime;
    
    // 测试原子模块解析
    const moduleStartTime = Date.now();
    const moduleResult = await parser.parseQuestionWithAtomicModules(question, {
      enableModuleDecomposition: true,
      enableModuleComposition: true,
      language: 'zh'
    });
    const moduleTime = Date.now() - moduleStartTime;
    
    // 验证结果
    const validation = validateResult(basicResult, moduleResult, expectedModules, id);
    
    const testDetail = {
      id,
      question,
      difficulty,
      basicResult,
      moduleResult,
      basicTime,
      moduleTime,
      validation,
      success: validation.success
    };
    
    testResults.details.push(testDetail);
    
    if (validation.success) {
      testResults.passed++;
      console.log(`✅ 测试通过 - 基础解析: ${basicTime}ms, 模块解析: ${moduleTime}ms`);
    } else {
      testResults.failed++;
      console.log(`❌ 测试失败 - ${validation.errors.join(', ')}`);
    }
    
    return testDetail;
    
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({
      id,
      error: error.message,
      stack: error.stack
    });
    
    console.log(`💥 测试异常 - ${error.message}`);
    
    return {
      id,
      question,
      success: false,
      error: error.message
    };
  }
}

/**
 * 验证测试结果
 */
function validateResult(basicResult, moduleResult, expectedModules, testId) {
  const errors = [];
  
  // 基础验证
  if (!basicResult || typeof basicResult !== 'object') {
    errors.push('基础解析结果无效');
  } else {
    if (basicResult.subject !== 'physics') {
      errors.push('主题不是physics');
    }
    if (!basicResult.parameters || !Array.isArray(basicResult.parameters)) {
      errors.push('参数数组无效');
    }
    if (!basicResult.units || !Array.isArray(basicResult.units)) {
      errors.push('单位数组无效');
    }
  }
  
  // 模块解析验证
  if (!moduleResult || typeof moduleResult !== 'object') {
    errors.push('模块解析结果无效');
  } else {
    // 检查是否包含预期的物理参数
    const hasExpectedParams = checkExpectedParameters(moduleResult, expectedModules);
    if (!hasExpectedParams) {
      errors.push('缺少预期的物理参数');
    }
  }
  
  // 性能验证
  if (basicResult && moduleResult) {
    const paramCount = moduleResult.parameters ? moduleResult.parameters.length : 0;
    if (paramCount < 3) {
      errors.push('参数数量过少，可能解析不完整');
    }
  }
  
  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * 检查是否包含预期的物理参数
 */
function checkExpectedParameters(result, expectedModules) {
  if (!result.parameters || !Array.isArray(result.parameters)) {
    return false;
  }
  
  // 根据模块类型检查关键参数
  const moduleParamMap = {
    'kinematics_linear': ['v', 'v0', 'a', 's', 't'],
    'newton_dynamics': ['F', 'm', 'a', 'g'],
    'work_energy': ['W', 'P', 'Ek', 'Ep'],
    'circular_motion': ['v', 'ω', 'T', 'f', 'a', 'F'],
    'dc_circuit': ['U', 'I', 'R', 'P']
  };
  
  const foundParams = result.parameters.map(p => p.symbol);
  
  for (const module of expectedModules) {
    const expectedParams = moduleParamMap[module] || [];
    const hasModuleParams = expectedParams.some(param => foundParams.includes(param));
    if (!hasModuleParams) {
      return false;
    }
  }
  
  return true;
}

/**
 * 打印详细测试结果
 */
function printDetailedResults() {
  console.log('\n📊 详细测试结果:');
  console.log('='.repeat(80));
  
  for (const detail of testResults.details) {
    console.log(`\n🔍 测试 ${detail.id}:`);
    console.log(`   题目: ${detail.question}`);
    console.log(`   难度: ${detail.difficulty}`);
    console.log(`   状态: ${detail.success ? '✅ 通过' : '❌ 失败'}`);
    
    if (detail.basicResult) {
      console.log(`   基础解析参数数量: ${detail.basicResult.parameters?.length || 0}`);
      console.log(`   基础解析时间: ${detail.basicTime}ms`);
    }
    
    if (detail.moduleResult) {
      console.log(`   模块解析参数数量: ${detail.moduleResult.parameters?.length || 0}`);
      console.log(`   模块解析时间: ${detail.moduleTime}ms`);
    }
    
    if (detail.validation && !detail.validation.success) {
      console.log(`   错误: ${detail.validation.errors.join(', ')}`);
    }
  }
}

/**
 * 打印测试统计
 */
function printTestStatistics() {
  console.log('\n📈 测试统计:');
  console.log('='.repeat(50));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过数: ${testResults.passed}`);
  console.log(`失败数: ${testResults.failed}`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n💥 异常错误:`);
    for (const error of testResults.errors) {
      console.log(`   ${error.id}: ${error.error}`);
    }
  }
}

/**
 * 主测试函数 - 测试一道多模块题目
 */
async function runTests() {
  console.log('🚀 开始测试 PhysicsAIParserAICaller - 多模块题目解析');
  console.log('='.repeat(70));
  
  // 显示当前配置
  console.log('📋 当前配置:');
  console.log(`   API Key: ${TEST_CONFIG.apiKey ? '已设置' : '未设置'}`);
  console.log(`   Base URL: ${TEST_CONFIG.baseURL}`);
  console.log(`   Model: ${TEST_CONFIG.model}`);
  console.log(`   Temperature: ${TEST_CONFIG.temperature}`);
  console.log(`   Max Tokens: ${TEST_CONFIG.maxTokens}`);
  console.log(`   Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log('');
  
  // 验证配置
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    console.error('❌ 配置验证失败:');
    configValidation.issues.forEach(issue => {
      console.error(`   - ${issue}`);
    });
    console.log('');
    console.log('解决方案:');
    console.log('1. 在 .env.local 文件中设置: DEEPSEEK_API_KEY=your_api_key');
    console.log('2. 或设置系统环境变量: export DEEPSEEK_API_KEY=your_api_key');
    console.log('');
    console.log('示例 .env.local 文件内容:');
    console.log('DEEPSEEK_API_KEY=sk-your-actual-api-key-here');
    process.exit(1);
  }
  
  console.log('✅ 配置验证通过');
  console.log('');
  
  // 显示测试题目
  console.log('📝 测试题目:');
  console.log(`   题目: ${TEST_QUESTION.question}`);
  console.log(`   难度: ${TEST_QUESTION.difficulty}`);
  console.log(`   预期模块: ${TEST_QUESTION.expectedModules.join(', ')}`);
  console.log('');
  
  // 初始化解析器
  const parser = new PhysicsAIParserAICaller(TEST_CONFIG);
  
  try {
    console.log('🔄 开始解析...');
    console.log('='.repeat(50));
    
    // 1. 基础解析
    console.log('\n📊 1. 基础解析结果:');
    const basicStartTime = Date.now();
    const basicResult = await parser.parseQuestion(TEST_QUESTION.question);
    const basicTime = Date.now() - basicStartTime;
    
    console.log(`⏱️ 解析时间: ${basicTime}ms`);
    console.log('📋 解析结果:');
    console.log(JSON.stringify(basicResult, null, 2));
    
    // 2. 原子模块解析
    console.log('\n🧩 2. 原子模块解析结果:');
    const moduleStartTime = Date.now();
    const moduleResult = await parser.parseQuestionWithAtomicModules(TEST_QUESTION.question, {
      enableModuleDecomposition: true,
      enableModuleComposition: true,
      language: 'zh'
    });
    const moduleTime = Date.now() - moduleStartTime;
    
    console.log(`⏱️ 解析时间: ${moduleTime}ms`);
    console.log('📋 解析结果:');
    console.log(JSON.stringify(moduleResult, null, 2));
    
    // 3. 对比分析
    console.log('\n📈 3. 解析结果对比分析:');
    console.log('='.repeat(50));
    
    console.log(`基础解析参数数量: ${basicResult.parameters?.length || 0}`);
    console.log(`模块解析参数数量: ${moduleResult.parameters?.length || 0}`);
    console.log(`参数增加: ${(moduleResult.parameters?.length || 0) - (basicResult.parameters?.length || 0)}`);
    
    console.log(`基础解析单位数量: ${basicResult.units?.length || 0}`);
    console.log(`模块解析单位数量: ${moduleResult.units?.length || 0}`);
    console.log(`单位增加: ${(moduleResult.units?.length || 0) - (basicResult.units?.length || 0)}`);
    
    // 4. 验证结果
    console.log('\n✅ 4. 结果验证:');
    const validation = validateResult(basicResult, moduleResult, TEST_QUESTION.expectedModules, TEST_QUESTION.id);
    
    if (validation.success) {
      console.log('🎉 解析成功！');
      console.log('✅ 基础解析: 通过');
      console.log('✅ 模块解析: 通过');
    } else {
      console.log('⚠️ 解析存在问题:');
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    // 5. 性能统计
    console.log('\n📊 5. 性能统计:');
    console.log(`基础解析时间: ${basicTime}ms`);
    console.log(`模块解析时间: ${moduleTime}ms`);
    console.log(`总解析时间: ${basicTime + moduleTime}ms`);
    console.log(`模块解析额外时间: ${moduleTime - basicTime}ms`);
    
    console.log('\n🎯 测试完成！');
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
    console.error('错误详情:', error.stack);
  }
}

/**
 * 运行单个题目测试（用于调试）
 */
async function runSingleQuestionTest(questionText) {
  console.log('🔬 单题目测试模式');
  console.log('='.repeat(40));
  
  if (!TEST_CONFIG.apiKey) {
    console.error('❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量');
    return;
  }
  
  const parser = new PhysicsAIParserAICaller(TEST_CONFIG);
  
  try {
    console.log(`题目: ${questionText}`);
    
    // 基础解析
    console.log('\n📝 基础解析:');
    const basicResult = await parser.parseQuestion(questionText);
    console.log(JSON.stringify(basicResult, null, 2));
    
    // 模块解析
    console.log('\n🧩 原子模块解析:');
    const moduleResult = await parser.parseQuestionWithAtomicModules(questionText, {
      enableModuleDecomposition: true,
      enableModuleComposition: true,
      language: 'zh'
    });
    console.log(JSON.stringify(moduleResult, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 导出函数
module.exports = {
  runTests,
  runSingleQuestionTest,
  TEST_QUESTION,
  testResults
};

// 如果直接运行此文件
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'single') {
    // 单题目测试模式
    const question = args.slice(1).join(' ') || '一辆汽车以20m/s的速度匀速行驶，经过5秒后速度变为30m/s，求汽车的加速度和行驶的距离。';
    runSingleQuestionTest(question);
  } else {
    // 完整测试模式
    runTests().then(() => {
      console.log('\n🎉 测试完成！');
      process.exit(0);
    }).catch(error => {
      console.error('💥 测试运行失败:', error);
      process.exit(1);
    });
  }
}
