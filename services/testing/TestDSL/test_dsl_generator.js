
// services/testing/TestAIParser/test_dsl_generator.js
// 测试更新后的 PhysicsDslGenerator

const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller.js');
const { PhysicsDslGenerator } = require('../../dsl/PhysicsDslGenerator.js');
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

// 测试题目
const TEST_QUESTION = {
  id: 'dsl_test_1',
  question: '质量为2kg的物体从斜面顶端滑下，斜面倾角为30°，摩擦系数为0.2，斜面长度为5m，求物体滑到底端时的速度。',
  expectedModules: ['kinematics_linear', 'newton_dynamics', 'work_energy'],
  difficulty: 'hard'
};

/**
 * 测试DSL生成器
 */
async function testDSLGenerator() {
  console.log('🚀 开始测试 PhysicsDslGenerator');
  console.log('='.repeat(60));
  
  // 检查API Key
  if (!TEST_CONFIG.apiKey) {
    console.error('❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量');
    console.log('请设置环境变量或创建 .env.local 文件');
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
  
  try {
    // 1. 初始化解析器和DSL生成器
    console.log('🔄 初始化解析器和DSL生成器...');
    const parser = new PhysicsAIParserAICaller(TEST_CONFIG);
    const dslGenerator = new PhysicsDslGenerator();
    
    // 2. 解析题目
    console.log('🔄 解析题目...');
    const startTime = Date.now();
    const parsedQuestion = await parser.parseQuestionWithAtomicModules(TEST_QUESTION.question, {
      enableModuleDecomposition: true,
      enableModuleComposition: true,
      language: 'zh'
    });
    const parseTime = Date.now() - startTime;
    
    console.log(`⏱️ 解析时间: ${parseTime}ms`);
    console.log(`📊 解析结果参数数量: ${parsedQuestion.parameters?.length || 0}`);
    console.log('');
    
    // 3. 生成DSL
    console.log('🔄 生成DSL...');
    const dslStartTime = Date.now();
    const dsl = dslGenerator.generateDSL(parsedQuestion);
    const dslTime = Date.now() - dslStartTime;
    
    console.log(`⏱️ DSL生成时间: ${dslTime}ms`);
    console.log('');
    
    // 4. 分析DSL结构
    console.log('📊 DSL结构分析:');
    console.log('='.repeat(50));
    
    console.log(`元数据: ${dsl.metadata ? '✅' : '❌'}`);
    console.log(`物理系统: ${dsl.system ? '✅' : '❌'}`);
    console.log(`仿真配置: ${dsl.simulation ? '✅' : '❌'}`);
    console.log(`输出配置: ${dsl.output ? '✅' : '❌'}`);
    console.log(`学段标签: ${dsl.syllabus ? '✅' : '❌'}`);
    
    // 检查新增的DSL增强字段
    console.log('\n🔍 DSL增强字段检查:');
    console.log(`解题路径: ${dsl.solution_path ? '✅' : '❌'}`);
    console.log(`求解目标: ${dsl.target ? '✅' : '❌'}`);
    console.log(`公式体系: ${dsl.formulas ? '✅' : '❌'}`);
    console.log(`约束条件: ${dsl.constraints ? '✅' : '❌'}`);
    console.log(`DSL元数据: ${dsl.dsl_metadata ? '✅' : '❌'}`);
    
    // 5. 详细分析
    if (dsl.metadata) {
      console.log('\n📋 元数据详情:');
      console.log(`   主题: ${dsl.metadata.topic}`);
      console.log(`   学段: ${dsl.metadata.grade}`);
      console.log(`   难度: ${dsl.metadata.difficulty}`);
    }
    
    if (dsl.system) {
      console.log('\n🔧 物理系统详情:');
      console.log(`   系统类型: ${dsl.system.type}`);
      console.log(`   参数数量: ${dsl.system.parameters?.length || 0}`);
      console.log(`   初始条件: ${dsl.system.initial_conditions?.length || 0}`);
      console.log(`   约束条件: ${dsl.system.constraints?.length || 0}`);
      console.log(`   常量数量: ${dsl.system.constants?.length || 0}`);
    }
    
    if (dsl.simulation) {
      console.log('\n⚙️ 仿真配置详情:');
      console.log(`   持续时间: ${dsl.simulation.duration?.value}${dsl.simulation.duration?.unit}`);
      console.log(`   时间步长: ${dsl.simulation.time_step?.value}${dsl.simulation.time_step?.unit}`);
      console.log(`   求解器: ${dsl.simulation.solver}`);
      console.log(`   精度: ${dsl.simulation.precision}`);
    }
    
    if (dsl.dsl_metadata) {
      console.log('\n📈 DSL元数据详情:');
      console.log(`   复杂度: ${dsl.dsl_metadata.complexity}`);
      console.log(`   模块数量: ${dsl.dsl_metadata.moduleCount}`);
      console.log(`   参数数量: ${dsl.dsl_metadata.parameterCount}`);
      console.log(`   预估步骤: ${dsl.dsl_metadata.estimatedSteps}`);
      console.log(`   置信度: ${dsl.dsl_metadata.confidence}`);
    }
    
    // 6. 生成YAML输出
    console.log('\n🔄 生成YAML格式...');
    const yamlStartTime = Date.now();
    const yaml = dslGenerator.generateYAML(parsedQuestion);
    const yamlTime = Date.now() - yamlStartTime;
    
    console.log(`⏱️ YAML生成时间: ${yamlTime}ms`);
    console.log(`📄 YAML长度: ${yaml.length} 字符`);
    
    // 7. 保存结果
    const outputPath = path.join(__dirname, 'dsl_output.json');
    const yamlPath = path.join(__dirname, 'dsl_output.yaml');
    
    fs.writeFileSync(outputPath, JSON.stringify(dsl, null, 2));
    fs.writeFileSync(yamlPath, yaml);
    
    console.log(`\n💾 结果已保存:`);
    console.log(`   JSON: ${outputPath}`);
    console.log(`   YAML: ${yamlPath}`);
    
    // 8. 性能统计
    console.log('\n📊 性能统计:');
    console.log(`解析时间: ${parseTime}ms`);
    console.log(`DSL生成时间: ${dslTime}ms`);
    console.log(`YAML生成时间: ${yamlTime}ms`);
    console.log(`总时间: ${parseTime + dslTime + yamlTime}ms`);
    
    console.log('\n🎉 DSL生成器测试完成！');
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
    console.error('错误详情:', error.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testDSLGenerator().then(() => {
    console.log('\n✅ 测试完成！');
    process.exit(0);
  }).catch(error => {
    console.error('💥 测试失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testDSLGenerator,
  TEST_QUESTION,
  TEST_CONFIG
};
