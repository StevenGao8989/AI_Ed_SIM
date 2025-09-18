// services/testing/TestAIParser/test_three_physics_problems.js
// 测试 PhysicsAIParserAICaller 纯AI解析能力（不使用回退策略）

const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller.js');
const { atomicModuleLibrary } = require('../../ai_parsing/AtomicModules.js');
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

// 三道测试题目
const TEST_PROBLEMS = [
  {
    id: 'problem_1',
    difficulty: '简单题（基础练习）',
    title: '斜面上的小球与电磁感应',
    question: `一个质量为 0.5 kg 的小球从光滑斜面顶端由静止释放，高度为 2 m。斜面底端水平放置一根长度为 0.5 m 的导体棒，棒两端接在电阻 2 Ω 的闭合电路上。整个系统处在垂直于斜面纸面向里的 0.4 T 匀强磁场中。

问题：
1. 小球到达斜面底端的速度是多少？
2. 当小球以该速度无摩擦地水平通过导体棒时，导体棒切割磁感线产生的感应电动势多大？
3. 电路中的感应电流是多少？

涉及模块：力学（能量守恒）、电磁学（电磁感应）。`,
    expectedModules: ['work_energy', 'mechanical_energy_conservation', 'electromagnetic_induction'],
    expectedParameters: ['m', 'h', 'v', 'L', 'R', 'B', 'ε', 'I'],
    complexity: 'simple'
  },
  {
    id: 'problem_2',
    difficulty: '中等题（综合运用）',
    title: '弹簧振子与简谐波',
    question: `一根劲度系数为 100 N/m 的轻弹簧竖直固定在天花板上，下端挂一质量 0.5 kg 的小球，处于平衡状态。小球被轻轻拉下 0.1 m 后释放。此时有一列简谐横波沿水平方向传播，波动方程为：

y = 0.02sin(20πt - 0.5πx) (m)

问题：
1. 小球的振动周期是多少？
2. 小球在释放后的最大加速度是多少？
3. 写出该波的频率、波长和传播速度。

涉及模块：力学（弹簧振子）、波动（简谐波）。`,
    expectedModules: ['oscillation', 'mechanical_waves'],
    expectedParameters: ['k', 'm', 'A', 'T', 'a', 'f', 'λ', 'v', 'ω'],
    complexity: 'medium'
  },
  {
    id: 'problem_3',
    difficulty: '较难题（挑战思考）',
    title: '功率与能量守恒的多模块问题',
    question: `一个水平放置的光滑圆轨道（半径 0.5 m）中，小球质量 0.2 kg，初速度为 2 m/s，小球在轨道内做匀速圆周运动。
此时在小球运动方向上方有一束单色光照射，光的波长为 600 nm，功率为 12 W，全部照射到小球表面并被吸收。假设小球表面积为 2×10⁻³ m²，光强均匀分布，且忽略热损失。

问题：
1. 小球在圆周运动中的向心力是多少？
2. 若光能全部转化为小球内能，5 分钟内小球吸收的总能量是多少？
3. 假设小球的比热容为 500 J/(kg·K)，计算小球温度升高多少？
4. 该光对应的光子能量是多少？5 分钟内小球吸收了多少个光子？

涉及模块：力学（圆周运动）、热学（比热容）、光学（光子能量）。`,
    expectedModules: ['circular_motion', 'thermal', 'modern_physics'],
    expectedParameters: ['m', 'r', 'v', 'F', 'P', 't', 'E', 'c', 'ΔT', 'λ', 'h', 'N'],
    complexity: 'complex'
  }
];

// 创建 AI 解析器实例
function createAIParser() {
  try {
    const aiParser = new PhysicsAIParserAICaller({
      apiKey: TEST_CONFIG.apiKey,
      enableLogging: TEST_CONFIG.enableLogging,
      timeout: TEST_CONFIG.timeout,
      retryCount: TEST_CONFIG.retryCount
    });
    
    console.log('✅ PhysicsAIParserAICaller 实例创建成功');
    return aiParser;
  } catch (error) {
    console.error('❌ 创建 AI 解析器失败:', error.message);
    return null;
  }
}

// 验证配置
function validateConfig() {
  const issues = [];
  
  if (!TEST_CONFIG.apiKey) {
    issues.push('API Key 未设置');
  } else if (!TEST_CONFIG.apiKey.startsWith('sk-')) {
    issues.push('API Key 格式可能不正确（应以 sk- 开头）');
  }
  
  if (issues.length > 0) {
    console.log('⚠️ 配置问题:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }
  
  console.log('✅ 配置验证通过');
  return true;
}

// 分析解析结果
function analyzeResult(result, problem) {
  const analysis = {
    success: false,
    score: 0,
    details: {
      parameters: { found: 0, expected: problem.expectedParameters.length, list: [] },
      modules: { found: 0, expected: problem.expectedModules.length, list: [] },
      solutionPath: { hasPath: false, stepCount: 0 },
      formulas: { hasFormulas: false, count: 0 },
      dslMetadata: { hasMetadata: false, complexity: null }
    },
    issues: [],
    suggestions: []
  };

  try {
    // 检查基本结构
    if (!result || typeof result !== 'object') {
      analysis.issues.push('解析结果为空或格式错误');
      return analysis;
    }

    // 检查参数识别
    if (result.parameters && Array.isArray(result.parameters)) {
      analysis.details.parameters.found = result.parameters.length;
      analysis.details.parameters.list = result.parameters.map(p => p.symbol);
      
      const foundExpectedParams = problem.expectedParameters.filter(expected => 
        result.parameters.some(p => p.symbol === expected)
      );
      
      if (foundExpectedParams.length > 0) {
        analysis.score += 20;
        analysis.details.parameters.found = foundExpectedParams.length;
      } else {
        analysis.issues.push('未识别到预期的物理参数');
      }
    } else {
      analysis.issues.push('缺少参数信息');
    }

    // 检查模块识别
    if (result.solutionPath && result.solutionPath.modules) {
      analysis.details.modules.found = result.solutionPath.modules.length;
      analysis.details.modules.list = result.solutionPath.modules;
      
      const foundExpectedModules = problem.expectedModules.filter(expected => 
        result.solutionPath.modules.includes(expected)
      );
      
      if (foundExpectedModules.length > 0) {
        analysis.score += 25;
        analysis.details.modules.found = foundExpectedModules.length;
      } else {
        analysis.issues.push('未识别到预期的物理模块');
      }
    } else {
      analysis.issues.push('缺少模块信息');
    }

    // 检查解题路径
    if (result.solutionPath && result.solutionPath.steps) {
      analysis.details.solutionPath.hasPath = true;
      analysis.details.solutionPath.stepCount = result.solutionPath.steps.length;
      analysis.score += 15;
    } else {
      analysis.issues.push('缺少解题路径');
    }

    // 检查公式信息
    if (result.formulas) {
      analysis.details.formulas.hasFormulas = true;
      const totalFormulas = (result.formulas.primary?.length || 0) + 
                           (result.formulas.intermediate?.length || 0) + 
                           (result.formulas.verification?.length || 0);
      analysis.details.formulas.count = totalFormulas;
      if (totalFormulas > 0) {
        analysis.score += 15;
      }
    } else {
      analysis.issues.push('缺少公式信息');
    }

    // 检查DSL元数据
    if (result.dslMetadata) {
      analysis.details.dslMetadata.hasMetadata = true;
      analysis.details.dslMetadata.complexity = result.dslMetadata.complexity;
      analysis.score += 10;
    } else {
      analysis.issues.push('缺少DSL元数据');
    }

    // 检查求解目标
    if (result.target && result.target.primary) {
      analysis.score += 10;
    } else {
      analysis.issues.push('缺少明确的求解目标');
    }

    // 检查约束条件
    if (result.constraints) {
      analysis.score += 5;
    }

    // 总体评估
    analysis.success = analysis.score >= 60;
    
    if (analysis.success) {
      analysis.suggestions.push('解析质量良好，可以用于DSL转换');
    } else {
      analysis.suggestions.push('解析质量需要改进，建议检查AI提示词或增加更多训练数据');
    }

  } catch (error) {
    analysis.issues.push(`分析过程中出错: ${error.message}`);
  }

  return analysis;
}

// 测试单个题目
async function testSingleProblem(aiParser, problem) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 测试题目: ${problem.difficulty}`);
  console.log(`📝 标题: ${problem.title}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📋 题目内容:`);
  console.log(problem.question);
  
  console.log(`\n🎯 预期模块: ${problem.expectedModules.join(', ')}`);
  console.log(`🎯 预期参数: ${problem.expectedParameters.join(', ')}`);
  
  try {
    console.log(`\n🔄 开始解析...`);
    const startTime = Date.now();
    
    // 使用纯AI解析方法，禁用回退策略
    const result = await aiParser.parseQuestionWithAIOnly(problem.question, {
      enableModuleDecomposition: true,
      enableModuleComposition: true,
      language: 'zh'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ 解析耗时: ${duration}ms`);
    
    // 分析结果
    const analysis = analyzeResult(result, problem);
    
    console.log(`\n📊 解析结果分析:`);
    console.log(`✅ 成功: ${analysis.success ? '是' : '否'}`);
    console.log(`📈 评分: ${analysis.score}/100`);
    
    console.log(`\n📋 详细信息:`);
    console.log(`  📝 参数识别: ${analysis.details.parameters.found}/${analysis.details.parameters.expected} (${analysis.details.parameters.list.join(', ')})`);
    console.log(`  🧩 模块识别: ${analysis.details.modules.found}/${analysis.details.modules.expected} (${analysis.details.modules.list.join(', ')})`);
    console.log(`  🛤️ 解题路径: ${analysis.details.solutionPath.hasPath ? '有' : '无'} (${analysis.details.solutionPath.stepCount} 步)`);
    console.log(`  📐 公式信息: ${analysis.details.formulas.hasFormulas ? '有' : '无'} (${analysis.details.formulas.count} 个)`);
    console.log(`  📊 DSL元数据: ${analysis.details.dslMetadata.hasMetadata ? '有' : '无'} (复杂度: ${analysis.details.dslMetadata.complexity || '未知'})`);
    
    if (analysis.issues.length > 0) {
      console.log(`\n⚠️ 问题:`);
      analysis.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (analysis.suggestions.length > 0) {
      console.log(`\n💡 建议:`);
      analysis.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
    }
    
    // 显示部分解析结果
    if (result && result.parameters) {
      console.log(`\n🔍 解析的参数示例:`);
      result.parameters.slice(0, 5).forEach(param => {
        console.log(`  - ${param.symbol}: ${param.value || '未知'} ${param.unit} (${param.role})`);
      });
    }
    
    return {
      problem: problem,
      result: result,
      analysis: analysis,
      duration: duration
    };
    
  } catch (error) {
    console.error(`❌ 纯AI解析失败: ${error.message}`);
    console.log(`💡 提示: 这是预期的行为，因为现在只使用AI解析，不使用回退策略`);
    return {
      problem: problem,
      result: null,
      analysis: { 
        success: false, 
        score: 0, 
        issues: [`纯AI解析失败: ${error.message}`],
        suggestions: ['检查AI API配置', '优化AI提示词', '检查网络连接']
      },
      duration: 0
    };
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试 PhysicsAIParserAICaller 纯AI解析能力');
  console.log('⚠️  注意: 本次测试只使用AI解析，不使用回退策略');
  console.log(`📅 测试时间: ${new Date().toLocaleString()}`);
  
  // 验证配置
  if (!validateConfig()) {
    console.log('❌ 配置验证失败，无法进行测试');
    return;
  }
  
  // 创建AI解析器
  const aiParser = createAIParser();
  if (!aiParser) {
    console.log('❌ 无法创建AI解析器，测试终止');
    return;
  }
  
  // 显示原子模块库信息
  const stats = atomicModuleLibrary.getStatistics();
  console.log(`\n📚 原子模块库信息:`);
  console.log(`  - 总模块数: ${stats.totalModules}`);
  console.log(`  - 总参数数: ${stats.totalParameters}`);
  console.log(`  - 总公式数: ${stats.totalFormulas}`);
  
  const results = [];
  
  // 测试每道题目
  for (const problem of TEST_PROBLEMS) {
    const testResult = await testSingleProblem(aiParser, problem);
    results.push(testResult);
    
    // 添加延迟避免API限制
    if (problem.id !== TEST_PROBLEMS[TEST_PROBLEMS.length - 1].id) {
      console.log('\n⏳ 等待 2 秒后继续下一个测试...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 生成测试报告
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 测试报告总结');
  console.log(`${'='.repeat(80)}`);
  
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.analysis.success).length;
  const averageScore = results.reduce((sum, r) => sum + r.analysis.score, 0) / totalTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n📈 总体统计:`);
  console.log(`  - 测试题目数: ${totalTests}`);
  console.log(`  - 成功解析数: ${successfulTests}`);
  console.log(`  - 成功率: ${(successfulTests / totalTests * 100).toFixed(1)}%`);
  console.log(`  - 平均评分: ${averageScore.toFixed(1)}/100`);
  console.log(`  - 总耗时: ${totalDuration}ms`);
  
  console.log(`\n📋 各题目详细结果:`);
  results.forEach((result, index) => {
    const problem = result.problem;
    const analysis = result.analysis;
    console.log(`\n  ${index + 1}. ${problem.title} (${problem.difficulty})`);
    console.log(`     ✅ 成功: ${analysis.success ? '是' : '否'}`);
    console.log(`     📈 评分: ${analysis.score}/100`);
    console.log(`     ⏱️ 耗时: ${result.duration}ms`);
    console.log(`     🧩 模块: ${analysis.details.modules.found}/${analysis.details.modules.expected}`);
    console.log(`     📝 参数: ${analysis.details.parameters.found}/${analysis.details.parameters.expected}`);
  });
  
  // 能力评估
  console.log(`\n🎯 PhysicsAIParserAICaller 能力评估:`);
  
  if (averageScore >= 80) {
    console.log(`  🌟 优秀: 系统能够准确解析各种难度的物理题目`);
  } else if (averageScore >= 60) {
    console.log(`  👍 良好: 系统基本能够解析物理题目，但仍有改进空间`);
  } else if (averageScore >= 40) {
    console.log(`  ⚠️ 一般: 系统能够部分解析物理题目，需要进一步优化`);
  } else {
    console.log(`  ❌ 较差: 系统解析能力有限，需要大幅改进`);
  }
  
  // 具体能力分析
  console.log(`\n🔍 具体能力分析:`);
  
  const moduleRecognition = results.filter(r => r.analysis.details.modules.found > 0).length / totalTests;
  const parameterRecognition = results.filter(r => r.analysis.details.parameters.found > 0).length / totalTests;
  const solutionPathGeneration = results.filter(r => r.analysis.details.solutionPath.hasPath).length / totalTests;
  const formulaExtraction = results.filter(r => r.analysis.details.formulas.hasFormulas).length / totalTests;
  
  console.log(`  - 模块识别能力: ${(moduleRecognition * 100).toFixed(1)}%`);
  console.log(`  - 参数识别能力: ${(parameterRecognition * 100).toFixed(1)}%`);
  console.log(`  - 解题路径生成: ${(solutionPathGeneration * 100).toFixed(1)}%`);
  console.log(`  - 公式提取能力: ${(formulaExtraction * 100).toFixed(1)}%`);
  
  // 改进建议
  console.log(`\n💡 改进建议:`);
  
  if (moduleRecognition < 0.8) {
    console.log(`  - 增强模块识别能力，优化关键词匹配算法`);
  }
  
  if (parameterRecognition < 0.8) {
    console.log(`  - 改进参数识别，增加更多物理参数符号`);
  }
  
  if (solutionPathGeneration < 0.8) {
    console.log(`  - 完善解题路径生成，优化步骤规划算法`);
  }
  
  if (formulaExtraction < 0.8) {
    console.log(`  - 增强公式提取能力，完善物理公式库`);
  }
  
  if (averageScore < 70) {
    console.log(`  - 优化AI提示词，提高解析准确性`);
    console.log(`  - 增加更多训练数据，提升模型理解能力`);
  }
  
  console.log(`\n🎉 测试完成！`);
  console.log(`📊 PhysicsAIParserAICaller 在物理题目解析方面展现了${averageScore >= 70 ? '良好的' : '需要改进的'}能力`);
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  TEST_PROBLEMS,
  analyzeResult
};
