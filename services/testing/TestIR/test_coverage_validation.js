/**
 * 验证系统对中国初一到高三物理题目的覆盖率
 * 测试涵盖各个年级和知识点的代表性题目
 */

const { PhysicsAIParserAICaller } = require('../../ai_parsing/PhysicsAIParserAICaller');
const { PhysicsDslGenerator } = require('../../dsl/PhysicsDslGenerator');
const { IRConverter } = require('../../ir/IRConverter');

// 测试题目集合 - 按年级和知识点分类
const testProblems = {
  // 初中物理 (初一-初三)
  junior_high: {
    // 力学
    mechanics: [
      {
        id: 'junior_mechanics_1',
        grade: '初二',
        topic: '运动学',
        question: '一辆汽车以20m/s的速度行驶，刹车后以2m/s²的加速度减速，求刹车后5秒内的位移',
        expected_modules: ['kinematics'],
        difficulty: 'medium'
      },
      {
        id: 'junior_mechanics_2', 
        grade: '初二',
        topic: '简单机械',
        question: '用杠杆举起100N的重物，动力臂长2m，阻力臂长0.5m，求需要的动力',
        expected_modules: ['simple_machines'],
        difficulty: 'easy'
      },
      {
        id: 'junior_mechanics_3',
        grade: '初二', 
        topic: '压强',
        question: '一个物体在密度为1000kg/m³的液体中，浸入深度为2m，求液体压强',
        expected_modules: ['pressure'],
        difficulty: 'easy'
      }
    ],
    
    // 热学
    thermal: [
      {
        id: 'junior_thermal_1',
        grade: '初二',
        topic: '物态变化',
        question: '将1kg的冰从-10°C加热到0°C，然后完全熔化，求需要的总热量',
        expected_modules: ['phase_change'],
        difficulty: 'medium'
      },
      {
        id: 'junior_thermal_2',
        grade: '初二',
        topic: '热量计算',
        question: '质量为2kg的水从20°C加热到80°C，水的比热容为4200J/(kg·K)，求吸收的热量',
        expected_modules: ['thermal'],
        difficulty: 'easy'
      }
    ],
    
    // 声学
    acoustics: [
      {
        id: 'junior_acoustics_1',
        grade: '初二',
        topic: '声学',
        question: '一个声源发出频率为440Hz的声音，在空气中传播速度为340m/s，求波长',
        expected_modules: ['acoustics'],
        difficulty: 'easy'
      }
    ],
    
    // 光学
    optics: [
      {
        id: 'junior_optics_1',
        grade: '初二',
        topic: '光的反射',
        question: '一束光线以30°角入射到平面镜上，求反射角',
        expected_modules: ['optics'],
        difficulty: 'easy'
      }
    ],
    
    // 电学
    electricity: [
      {
        id: 'junior_electricity_1',
        grade: '初三',
        topic: '欧姆定律',
        question: '一个电阻为10Ω的电路，通过电流为2A，求电压和电功率',
        expected_modules: ['basic_electricity'],
        difficulty: 'easy'
      },
      {
        id: 'junior_electricity_2',
        grade: '初三',
        topic: '串联电路',
        question: '两个电阻R1=5Ω，R2=10Ω串联，总电压为15V，求总电阻和总电流',
        expected_modules: ['electricity'],
        difficulty: 'medium'
      }
    ]
  },
  
  // 高中物理 (高一-高三)
  senior_high: {
    // 力学
    mechanics: [
      {
        id: 'senior_mechanics_1',
        grade: '高一',
        topic: '曲线运动',
        question: '一个物体以10m/s的初速度水平抛出，求2秒后的位置和速度',
        expected_modules: ['kinematics'],
        difficulty: 'medium'
      },
      {
        id: 'senior_mechanics_2',
        grade: '高一',
        topic: '圆周运动',
        question: '质量为1kg的物体在半径为2m的圆周上以5m/s的速度运动，求向心力',
        expected_modules: ['dynamics'],
        difficulty: 'medium'
      },
      {
        id: 'senior_mechanics_3',
        grade: '高一',
        topic: '机械能守恒',
        question: '质量为2kg的物体从10m高处自由落下，求落地时的动能',
        expected_modules: ['energy'],
        difficulty: 'easy'
      }
    ],
    
    // 热学
    thermal: [
      {
        id: 'senior_thermal_1',
        grade: '高二',
        topic: '气体状态方程',
        question: '一定质量的理想气体在等温过程中，体积从2L变为4L，求压强变化',
        expected_modules: ['thermal'],
        difficulty: 'medium'
      }
    ],
    
    // 电磁学
    electromagnetism: [
      {
        id: 'senior_electromagnetism_1',
        grade: '高二',
        topic: '静电场',
        question: '两个点电荷q1=2×10^-6C，q2=-3×10^-6C，相距0.1m，求它们之间的库仑力',
        expected_modules: ['electrostatics'],
        difficulty: 'medium'
      },
      {
        id: 'senior_electromagnetism_2',
        grade: '高二',
        topic: '电磁感应',
        question: '一个面积为0.01m²的线圈在0.5T的磁场中以10m/s的速度运动，求感应电动势',
        expected_modules: ['electromagnetic_induction'],
        difficulty: 'medium'
      }
    ],
    
    // 光学
    optics: [
      {
        id: 'senior_optics_1',
        grade: '高二',
        topic: '光的干涉',
        question: '两束相干光在屏幕上产生干涉条纹，光程差为λ/2时，求干涉结果',
        expected_modules: ['physical_optics'],
        difficulty: 'hard'
      }
    ],
    
    // 现代物理
    modern_physics: [
      {
        id: 'senior_modern_1',
        grade: '高三',
        topic: '原子结构',
        question: '氢原子从n=3能级跃迁到n=1能级，求辐射光子的能量',
        expected_modules: ['modern_physics'],
        difficulty: 'hard'
      }
    ]
  }
};

async function testCoverageValidation() {
  console.log('🧪 开始验证系统对中国初一到高三物理题目的覆盖率...\n');
  
  const aiParser = new PhysicsAIParserAICaller();
  const dslGenerator = new PhysicsDslGenerator();
  const irConverter = new IRConverter();
  
  let totalTests = 0;
  let successfulTests = 0;
  let results = {
    junior_high: { total: 0, success: 0, details: {} },
    senior_high: { total: 0, success: 0, details: {} }
  };
  
  // 测试初中物理题目
  console.log('📚 测试初中物理题目...\n');
  for (const [category, problems] of Object.entries(testProblems.junior_high)) {
    console.log(`\n🔍 测试 ${category} 类别:`);
    results.junior_high.details[category] = { total: 0, success: 0 };
    
    for (const problem of problems) {
      totalTests++;
      results.junior_high.total++;
      results.junior_high.details[category].total++;
      
      console.log(`\n  📝 ${problem.grade} - ${problem.topic}`);
      console.log(`  题目: ${problem.question}`);
      
      try {
        // 1. AI 解析
        const parsedQuestion = await aiParser.parseQuestionWithAIOnly(problem.question);
        console.log(`  ✅ AI 解析成功`);
        
        // 2. DSL 生成
        const dsl = dslGenerator.generateDSL(parsedQuestion);
        console.log(`  ✅ DSL 生成成功`);
        
        // 3. IR 转换
        const irResult = await irConverter.convertDSLToIR(dsl);
        if (irResult.success && irResult.ir && irResult.ir.system && irResult.ir.system.modules) {
          console.log(`  ✅ IR 转换成功`);
          console.log(`  生成模块: ${irResult.ir.system.modules.map(m => m.name).join(', ')}`);
          
          successfulTests++;
          results.junior_high.success++;
          results.junior_high.details[category].success++;
        } else {
          console.log(`  ❌ IR 转换失败: ${irResult.errors?.join(', ') || '未知错误'}`);
        }
        
      } catch (error) {
        console.log(`  ❌ 处理失败: ${error.message}`);
      }
    }
  }
  
  // 测试高中物理题目
  console.log('\n\n📚 测试高中物理题目...\n');
  for (const [category, problems] of Object.entries(testProblems.senior_high)) {
    console.log(`\n🔍 测试 ${category} 类别:`);
    results.senior_high.details[category] = { total: 0, success: 0 };
    
    for (const problem of problems) {
      totalTests++;
      results.senior_high.total++;
      results.senior_high.details[category].total++;
      
      console.log(`\n  📝 ${problem.grade} - ${problem.topic}`);
      console.log(`  题目: ${problem.question}`);
      
      try {
        // 1. AI 解析
        const parsedQuestion = await aiParser.parseQuestionWithAIOnly(problem.question);
        console.log(`  ✅ AI 解析成功`);
        
        // 2. DSL 生成
        const dsl = dslGenerator.generateDSL(parsedQuestion);
        console.log(`  ✅ DSL 生成成功`);
        
        // 3. IR 转换
        const irResult = await irConverter.convertDSLToIR(dsl);
        if (irResult.success && irResult.ir && irResult.ir.system && irResult.ir.system.modules) {
          console.log(`  ✅ IR 转换成功`);
          console.log(`  生成模块: ${irResult.ir.system.modules.map(m => m.name).join(', ')}`);
          
          successfulTests++;
          results.senior_high.success++;
          results.senior_high.details[category].success++;
        } else {
          console.log(`  ❌ IR 转换失败: ${irResult.errors?.join(', ') || '未知错误'}`);
        }
        
      } catch (error) {
        console.log(`  ❌ 处理失败: ${error.message}`);
      }
    }
  }
  
  // 生成覆盖率报告
  console.log('\n\n📊 覆盖率验证报告');
  console.log('='.repeat(50));
  
  const overallSuccessRate = (successfulTests / totalTests * 100).toFixed(1);
  const juniorSuccessRate = (results.junior_high.success / results.junior_high.total * 100).toFixed(1);
  const seniorSuccessRate = (results.senior_high.success / results.senior_high.total * 100).toFixed(1);
  
  console.log(`\n🎯 总体覆盖率: ${overallSuccessRate}% (${successfulTests}/${totalTests})`);
  console.log(`📚 初中物理覆盖率: ${juniorSuccessRate}% (${results.junior_high.success}/${results.junior_high.total})`);
  console.log(`📚 高中物理覆盖率: ${seniorSuccessRate}% (${results.senior_high.success}/${results.senior_high.total})`);
  
  console.log('\n📋 详细分类覆盖率:');
  console.log('\n初中物理:');
  for (const [category, data] of Object.entries(results.junior_high.details)) {
    const rate = (data.success / data.total * 100).toFixed(1);
    console.log(`  ${category}: ${rate}% (${data.success}/${data.total})`);
  }
  
  console.log('\n高中物理:');
  for (const [category, data] of Object.entries(results.senior_high.details)) {
    const rate = (data.success / data.total * 100).toFixed(1);
    console.log(`  ${category}: ${rate}% (${data.success}/${data.total})`);
  }
  
  console.log('\n💡 结论:');
  if (parseFloat(overallSuccessRate) >= 95) {
    console.log('🎉 系统已经能够解析 95% 以上的中国初一到高三物理题目！');
  } else if (parseFloat(overallSuccessRate) >= 90) {
    console.log('✅ 系统基本能够解析 90% 以上的物理题目，接近 95% 目标。');
  } else {
    console.log('⚠️  系统需要进一步优化才能达到 95% 的覆盖率目标。');
  }
  
  return {
    overallSuccessRate: parseFloat(overallSuccessRate),
    juniorSuccessRate: parseFloat(juniorSuccessRate),
    seniorSuccessRate: parseFloat(seniorSuccessRate),
    results
  };
}

// 运行测试
if (require.main === module) {
  testCoverageValidation().catch(console.error);
}

module.exports = { testCoverageValidation };
