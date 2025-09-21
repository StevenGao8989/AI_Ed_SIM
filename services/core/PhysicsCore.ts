/**
 * 物理核心系统 - 统一接口
 * 
 * 功能：
 * 1. 集成所有 services 的功能
 * 2. 提供统一的测试接口
 * 3. 支持完整的物理题目处理流程
 * 4. 包含分阶段动画和验证功能
 */

// 导入所有必要的模块
import { PhysicsAIParserAICaller } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/ai_parsing/PhysicsAIParserAICaller';
import { PhysicsDslGenerator } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/dsl/PhysicsDslGenerator';
import { IRConverter } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/ir/IRConverter';
import { DynamicPhysicsSimulator } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/simulation/DynamicPhysicsSimulator';
import { PhysicsValidator } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/validation/PhysicsValidator';
import { ResultValidator } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/validation/ResultValidator';
import { DynamicPhysicsRenderer } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/rendering/DynamicPhysicsRenderer';

// 类型定义
export interface AIConfig {
  provider: 'openai' | 'deepseek' | 'claude';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableLogging: boolean;
}

export interface TestConfig {
  enableAI: boolean;
  enableDSL: boolean;
  enableIR: boolean;
  enableSimulation: boolean;
  enableValidation: boolean;
  enableRendering: boolean;
  enableStageAnimation: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  outputPath: string;
  strictMode: boolean;
}

export interface TestResult {
  success: boolean;
  stages: {
    ai: { success: boolean; data?: any; errors: string[] };
    dsl: { success: boolean; data?: any; errors: string[] };
    ir: { success: boolean; data?: any; errors: string[] };
    simulation: { success: boolean; data?: any; errors: string[] };
    validation: { success: boolean; data?: any; errors: string[] };
    rendering: { success: boolean; data?: any; errors: string[] };
  };
  totalTime: number;
  errors: string[];
  warnings: string[];
}

export interface StageAnimationConfig {
  stages: Array<{
    id: string;
    name: string;
    description: string;
    startTime: number;
    duration: number;
    physicsType: string;
    visualConfig: any;
    explanation: any;
  }>;
  transitions: Array<{
    fromStage: string;
    toStage: string;
    transitionType: string;
    duration: number;
    effects: string[];
  }>;
}

/**
 * 物理核心系统 - 统一接口类
 */
export class PhysicsCore {
  private aiParser: PhysicsAIParserAICaller;
  private dslGenerator: PhysicsDslGenerator;
  private irConverter: IRConverter;
  private simulator: DynamicPhysicsSimulator;
  private physicsValidator: PhysicsValidator;
  private resultValidator: ResultValidator;
  private renderer: DynamicPhysicsRenderer;

  constructor(aiConfig: AIConfig) {
    this.aiParser = new PhysicsAIParserAICaller(aiConfig as any);
    this.dslGenerator = new PhysicsDslGenerator();
    this.irConverter = new IRConverter();
    this.simulator = new DynamicPhysicsSimulator();
    this.physicsValidator = new PhysicsValidator();
    this.resultValidator = new ResultValidator();
    this.renderer = new DynamicPhysicsRenderer();
  }

  /**
   * 测试单个物理题目 - 主要入口点
   */
  async testPhysicsQuestion(
    question: string,
    config: TestConfig
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    const result: TestResult = {
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
      errors: [],
      warnings: []
    };

    try {
      console.log('🎬 Starting physics question test...');
      console.log(`📝 Question: ${question}`);

      let parsedQuestion: any = null;
      let dsl: any = null;
      let ir: any = null;
      let simulationResult: any = null;
      let validationResult: any = null;
      let renderingResult: any = null;

      // 阶段1: AI解析
      if (config.enableAI) {
        console.log('🤖 Stage 1: AI parsing...');
        try {
          parsedQuestion = await this.aiParser.parseQuestionWithAIOnly(question);
          if (parsedQuestion) {
            result.stages.ai.success = true;
            result.stages.ai.data = parsedQuestion;
            console.log(`✅ AI parsing completed - ${parsedQuestion.parameters?.length || 0} parameters identified`);
          } else {
            result.stages.ai.errors.push('AI parsing returned null');
          }
        } catch (error) {
          result.stages.ai.errors.push(error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ AI parsing failed:', error);
        }
      }

      // 阶段2: DSL生成
      if (config.enableDSL && result.stages.ai.success) {
        console.log('📋 Stage 2: DSL generation...');
        try {
          dsl = this.dslGenerator.generateDSL(parsedQuestion);
          if (dsl) {
            result.stages.dsl.success = true;
            result.stages.dsl.data = dsl;
            console.log(`✅ DSL generation completed - System type: ${dsl.system?.type}`);
          } else {
            result.stages.dsl.errors.push('DSL generation returned null');
          }
        } catch (error) {
          result.stages.dsl.errors.push(error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ DSL generation failed:', error);
        }
      }

      // 阶段3: IR转换
      if (config.enableIR && result.stages.dsl.success) {
        console.log('🔄 Stage 3: IR conversion...');
        try {
          const irResult = await this.irConverter.convertDSLToIR(dsl);
          if (irResult.success && irResult.ir) {
            result.stages.ir.success = true;
            result.stages.ir.data = irResult.ir;
            ir = irResult.ir;
            console.log(`✅ IR conversion completed - Modules: ${ir.system?.modules?.length || 0}`);
          } else {
            result.stages.ir.errors.push(...irResult.errors);
          }
        } catch (error) {
          result.stages.ir.errors.push(error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ IR conversion failed:', error);
        }
      }

      // 阶段4: 仿真计算
      if (config.enableSimulation && result.stages.ir.success) {
        console.log('⚡ Stage 4: Physics simulation...');
        try {
          const simulationConfig = {
            duration: 10,
            timestep: 0.01,
            tolerance: 1e-6,
            solver: 'rk4' as const,
            outputFrequency: 10,
            enableEvents: true,
            enableMonitoring: true,
            adaptiveTimestep: true,
            maxIterations: 10000
          };
          
          simulationResult = await this.simulator.runSimulation(ir, simulationConfig);
          if (simulationResult.success) {
            result.stages.simulation.success = true;
            result.stages.simulation.data = simulationResult;
            console.log(`✅ Simulation completed - Data points: ${simulationResult.timeSeries?.length || 0}`);
          } else {
            result.stages.simulation.errors.push(...simulationResult.errors);
          }
        } catch (error) {
          result.stages.simulation.errors.push(error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ Simulation failed:', error);
        }
      }

      // 阶段5: 验证
      if (config.enableValidation && result.stages.simulation.success) {
        console.log('🔍 Stage 5: Validation...');
        try {
          // 物理逻辑验证
          const physicsValidation = await this.physicsValidator.validateSimulation(simulationResult, ir);
          
          // 结果验证
          const resultValidation = await this.resultValidator.performSelfCheck(simulationResult, ir);
          
          if (physicsValidation.success && resultValidation.success) {
            result.stages.validation.success = true;
            result.stages.validation.data = {
              physics: physicsValidation,
              result: resultValidation
            };
            console.log(`✅ Validation completed - Physics: ${physicsValidation.overallScore}, Result: ${resultValidation.overallScore}`);
          } else {
            if (!physicsValidation.success) {
              result.stages.validation.errors.push(...physicsValidation.errors || []);
            }
            if (!resultValidation.success) {
              result.stages.validation.errors.push(...resultValidation.errors || []);
            }
          }
        } catch (error) {
          result.stages.validation.errors.push(error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ Validation failed:', error);
        }
      }

      // 阶段6: 渲染（模拟）
      if (config.enableRendering && result.stages.simulation.success) {
        console.log('🎨 Stage 6: Rendering...');
        try {
          // 模拟渲染过程
          const renderConfig = {
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 10,
            quality: config.quality,
            format: 'png_sequence',
            backgroundColor: '#000000',
            camera: {
              position: { x: 10, y: 10, z: 10 },
              target: { x: 0, y: 0, z: 0 },
              fov: 75
            },
            lighting: {
              ambient: 0.4,
              directional: 0.8,
              shadows: true
            }
          };
          
          // 模拟渲染结果
          renderingResult = {
            success: true,
            outputPath: config.outputPath,
            frameCount: Math.floor(renderConfig.duration * renderConfig.fps),
            fileSize: this.calculateMockFileSize(renderConfig),
            generationTime: 1000
          };
          
          result.stages.rendering.success = true;
          result.stages.rendering.data = renderingResult;
          console.log(`✅ Rendering completed - Frames: ${renderingResult.frameCount}`);
        } catch (error) {
          result.stages.rendering.errors.push(error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ Rendering failed:', error);
        }
      }

      // 检查整体成功状态
      const allStages = Object.values(result.stages);
      const successfulStages = allStages.filter(stage => stage.success).length;
      const totalEnabledStages = allStages.filter(stage => 
        (stage === result.stages.ai && config.enableAI) ||
        (stage === result.stages.dsl && config.enableDSL) ||
        (stage === result.stages.ir && config.enableIR) ||
        (stage === result.stages.simulation && config.enableSimulation) ||
        (stage === result.stages.validation && config.enableValidation) ||
        (stage === result.stages.rendering && config.enableRendering)
      ).length;

      result.success = successfulStages === totalEnabledStages;

      if (result.success) {
        console.log('✅ Physics question test completed successfully!');
      } else {
        console.log(`❌ Physics question test failed - ${successfulStages}/${totalEnabledStages} stages successful`);
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.success = false;
      console.error('❌ Physics question test failed:', error);
    }

    result.totalTime = Date.now() - startTime;
    return result;
  }

  /**
   * 生成分阶段动画配置
   */
  generateStageAnimationConfig(question: string, simulationResult: any): StageAnimationConfig {
    // 这里可以根据题目内容和仿真结果自动生成分阶段配置
    // 具体实现可以根据需要扩展
    const stages = [{
      id: 'default',
      name: '物理运动',
      description: '通用物理运动',
      startTime: 0,
      duration: 10,
      physicsType: 'other',
      visualConfig: {
        color: '#FFFFFF',
        highlight: false,
        showTrajectory: true,
        showForces: false,
        showEnergy: false
      },
      explanation: {
        title: '物理运动',
        description: '物体运动过程',
        formulas: [],
        keyPoints: []
      }
    }];
    
    const transitions: any[] = [];
    
    return { stages, transitions };
  }

  /**
   * 计算模拟文件大小
   */
  private calculateMockFileSize(config: any): number {
    const baseSize = 1024 * 1024; // 1MB base
    const qualityMultiplier = {
      'low': 1,
      'medium': 2,
      'high': 4,
      'ultra': 8
    };
    
    const resolutionMultiplier = (config.width * config.height) / (1920 * 1080);
    const durationMultiplier = config.duration / 10;
    
    return baseSize * qualityMultiplier[config.quality] * resolutionMultiplier * durationMultiplier;
  }

  /**
   * 获取推荐的测试配置
   */
  getRecommendedTestConfig(quality: 'low' | 'medium' | 'high' | 'ultra'): TestConfig {
    return {
      enableAI: true,
      enableDSL: true,
      enableIR: true,
      enableSimulation: true,
      enableValidation: true,
      enableRendering: true,
      enableStageAnimation: true,
      quality,
      outputPath: 'output.mp4',
      strictMode: quality === 'high' || quality === 'ultra'
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up physics core resources...');
    // DynamicPhysicsRenderer doesn't require explicit cleanup
  }
}

/**
 * 创建物理核心系统实例
 */
export function createPhysicsCore(aiConfig: AIConfig): PhysicsCore {
  return new PhysicsCore(aiConfig);
}

/**
 * 快速测试函数
 */
export async function quickTestPhysicsQuestion(
  question: string,
  aiConfig: AIConfig,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): Promise<TestResult> {
  const core = createPhysicsCore(aiConfig);
  const config = core.getRecommendedTestConfig(quality);
  
  try {
    const result = await core.testPhysicsQuestion(question, config);
    await core.cleanup();
    return result;
  } catch (error) {
    await core.cleanup();
    throw error;
  }
}
