/**
 * 物理测试接口 - 简化的测试接口
 * 
 * 功能：
 * 1. 提供简化的测试接口
 * 2. 支持快速测试单个题目
 * 3. 返回详细的测试结果
 * 4. 支持批量测试
 */

import { PhysicsCore, AIConfig, TestResult } from './PhysicsCore';

// 测试题目接口
export interface TestQuestion {
  id: string;
  question: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedStages?: string[];
}

// 测试结果接口
export interface TestQuestionResult {
  questionId: string;
  question: string;
  result: TestResult;
  stageAnimation?: any;
  summary: {
    success: boolean;
    totalTime: number;
    successfulStages: number;
    totalStages: number;
    errors: string[];
    warnings: string[];
  };
}

/**
 * 物理测试接口类
 */
export class PhysicsTestInterface {
  private core: PhysicsCore;

  constructor(aiConfig: AIConfig) {
    this.core = new PhysicsCore(aiConfig);
  }

  /**
   * 测试单个题目
   */
  async testQuestion(
    question: TestQuestion,
    quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
  ): Promise<TestQuestionResult> {
    console.log(`\n🎯 测试题目: ${question.id}`);
    console.log(`📝 题目: ${question.question.substring(0, 100)}...`);
    console.log(`📊 类型: ${question.type}, 难度: ${question.difficulty}`);
    console.log('----------------------------------------');

    const config = this.core.getRecommendedTestConfig(quality);
    const result = await this.core.testPhysicsQuestion(question.question, config);

    // 生成分阶段动画配置
    let stageAnimation = null;
    if (result.stages.simulation.success && result.stages.simulation.data) {
      stageAnimation = this.core.generateStageAnimationConfig(question.question, result.stages.simulation.data);
    }

    // 计算摘要
    const allStages = Object.values(result.stages);
    const successfulStages = allStages.filter(stage => stage.success).length;
    const totalStages = allStages.length;

    const summary = {
      success: result.success,
      totalTime: result.totalTime,
      successfulStages,
      totalStages,
      errors: result.errors,
      warnings: result.warnings
    };

    const testResult: TestQuestionResult = {
      questionId: question.id,
      question: question.question,
      result,
      stageAnimation,
      summary
    };

    // 输出结果
    if (result.success) {
      console.log(`✅ ${question.id} 测试成功!`);
      console.log(`⏱️ 总耗时: ${result.totalTime}ms`);
      console.log(`🎭 阶段数量: ${successfulStages}/${totalStages}`);
      if (stageAnimation) {
        console.log(`🎬 动画阶段: ${stageAnimation.stages.length}个`);
        stageAnimation.stages.forEach((stage: any, index: number) => {
          console.log(`   ${index + 1}. ${stage.name} (${stage.duration}s) - ${stage.description}`);
        });
      }
    } else {
      console.log(`❌ ${question.id} 测试失败!`);
      console.log(`🔍 错误: ${result.errors.join(', ')}`);
      if (result.warnings.length > 0) {
        console.log(`⚠️ 警告: ${result.warnings.join(', ')}`);
      }
    }

    return testResult;
  }

  /**
   * 批量测试题目
   */
  async testQuestions(
    questions: TestQuestion[],
    quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
  ): Promise<TestQuestionResult[]> {
    console.log(`\n📦 批量测试 ${questions.length} 个题目...`);
    console.log('==================================================');

    const results: TestQuestionResult[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n📝 处理题目 ${i + 1}/${questions.length}: ${question.id}`);
      
      try {
        const result = await this.testQuestion(question, quality);
        results.push(result);
      } catch (error) {
        console.error(`❌ 题目 ${question.id} 测试异常:`, error);
        results.push({
          questionId: question.id,
          question: question.question,
          result: {
            success: false,
            stages: {
              ai: { success: false, errors: [] },
              dsl: { success: false, errors: [] },
              ir: { success: false, errors: [] },
              simulation: { success: false, errors: [] },
              validation: { success: false, errors: [] },
              rendering: { success: false, errors: [] }
            },
            totalTime: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: []
          },
          summary: {
            success: false,
            totalTime: 0,
            successfulStages: 0,
            totalStages: 6,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: []
          }
        });
      }
    }

    // 输出批量测试结果
    const successCount = results.filter(r => r.summary.success).length;
    console.log(`\n🎉 批量测试完成: ${successCount}/${questions.length} 成功`);

    results.forEach(result => {
      const status = result.summary.success ? '✅' : '❌';
      console.log(`   ${status} ${result.questionId}: ${result.summary.successfulStages}/${result.summary.totalStages} 阶段成功`);
    });

    return results;
  }

  /**
   * 运行自定义题目测试
   */
  async runCustomTests(questions: TestQuestion[], quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'): Promise<TestQuestionResult[]> {
    return await this.testQuestions(questions, quality);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.core.cleanup();
  }
}

/**
 * 创建物理测试接口实例
 */
export function createPhysicsTestInterface(aiConfig: AIConfig): PhysicsTestInterface {
  return new PhysicsTestInterface(aiConfig);
}

/**
 * 快速测试函数
 */
export async function quickTestQuestion(
  question: string,
  aiConfig: AIConfig,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): Promise<TestQuestionResult> {
  const testInterface = createPhysicsTestInterface(aiConfig);
  
  const testQuestion: TestQuestion = {
    id: 'quick_test',
    question,
    type: 'unknown',
    difficulty: 'medium'
  };

  try {
    const result = await testInterface.testQuestion(testQuestion, quality);
    await testInterface.cleanup();
    return result;
  } catch (error) {
    await testInterface.cleanup();
    throw error;
  }
}
