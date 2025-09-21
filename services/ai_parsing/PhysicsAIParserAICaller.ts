// services/ai_parsing/PhysicsAIParserAICaller.ts

import { type ParsedQuestion as BaseParsedQuestion, type Parameter as BaseParameter, type UnitMapping, parseQuestion } from './PhysicsAIParser';
import { UnitConverter } from './unitConverter';
import { atomicModuleLibrary, type AtomicModule } from './AtomicModules';

// ==== NEW: 通用合约生成选项 ====
export interface ContractGenerationOptions {
  defaultWorld?: {
    coord?: "xy_y_up" | "xy_y_down";
    gravity?: [number, number];                // 仅当业务需要默认重力时显式注入
    constants?: Record<string, number>;
  };
  requireAtLeastOneSurface?: boolean;
  requireAtLeastOneBody?: boolean;
  defaultTolerances?: {
    r2_min?: number;
    rel_err?: number;
    event_time_sec?: number;
    energy_drift_rel?: number;
    v_eps?: number;
  };
}

// ==== NEW: 小工具 ====
function hasVec2(v?: number[] | [number, number]): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
}

// 扩展的Parameter接口，增加DSL相关字段
export interface Parameter extends BaseParameter {
  dslType?: 'scalar' | 'vector' | 'tensor';
  domain?: 'kinematics' | 'dynamics' | 'energy' | 'electricity' | 'optics' | 'thermal' | 'magnetism' | 'fluid' | 'oscillation' | 'waves' | 'electrostatics' | 'electromagnetic_induction' | 'ac_circuit' | 'physical_optics' | 'modern_physics' | 'nuclear_physics' | 'astrophysics' | 'biophysics' | 'condensed_matter' | 'plasma_physics' | 'quantum_physics';
  priority?: number;        // 求解优先级
  dependencies?: string[];  // 依赖的其他参数
  formula?: string;         // 计算该参数的公式
}

// 解题步骤接口
export interface SolutionStep {
  id: string;
  type: 'calculate' | 'substitute' | 'solve' | 'verify' | 'convert';
  module: string;          // 使用的原子模块
  action: string;          // 具体操作描述
  inputs: string[];        // 输入参数
  outputs: string[];       // 输出参数
  formula: string;         // 使用的公式
  order: number;           // 执行顺序
  description?: string;    // 步骤描述
}

// 模块依赖接口
export interface ModuleDependency {
  from: string;
  to: string;
  parameter: string;
  type: 'input' | 'output' | 'shared' | 'derived';
  reason?: string;         // 依赖原因
}

// 公式接口
export interface Formula {
  name: string;
  expression: string;
  description?: string;
  type: 'primary' | 'intermediate' | 'verification';
  module?: string;
  variables: string[];     // 涉及的变量
}

// 约束条件接口
export interface Constraint {
  type: 'initial' | 'boundary' | 'physical' | 'mathematical';
  description: string;
  expression?: string;
  parameters: string[];
}

// 求解目标接口
export interface Target {
  primary: string;         // 主要求解目标
  secondary: string[];     // 次要求解目标
  method: 'kinematics' | 'dynamics' | 'energy' | 'mixed';
  priority: number;        // 优先级
}

// 解题路径接口
export interface SolutionPath {
  steps: SolutionStep[];
  modules: string[];       // 涉及的原子模块
  dependencies: ModuleDependency[];
  executionOrder: string[]; // 模块执行顺序
  checkpoints: string[];   // 关键检查点
}

// 扩展的ParsedQuestion接口
export interface ParsedQuestion extends BaseParsedQuestion {
  parameters: Parameter[];
  
  // 新增DSL转换所需字段
  target?: Target;
  solutionPath?: SolutionPath;
  formulas?: {
    primary: Formula[];
    intermediate: Formula[];
    verification: Formula[];
  };
  constraints?: {
    initial: Constraint[];
    boundary: Constraint[];
    physical: Constraint[];
    mathematical: Constraint[];
  };
  
  // DSL转换元数据
  dslMetadata?: {
    complexity: 'simple' | 'medium' | 'complex';
    moduleCount: number;
    parameterCount: number;
    estimatedSteps: number;
    confidence: number;    // 解析置信度
  };
}

// AI 提供商类型
export type AIProvider = 'deepseek';

// AI 配置接口
export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

// 默认配置
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'deepseek',
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'deepseek-v3',
  temperature: 0.1,
  maxTokens: 2000,
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  enableLogging: process.env.NODE_ENV === 'development'
};

// 解析策略配置
export interface ParsingStrategyConfig {
  enableAIEnhancement: boolean;
  enableTemplateMatching: boolean;
  aiTimeout: number;
  maxRetries: number;
  fallbackToBasic: boolean;
}

// AI 调用结果接口
export interface AICallResult {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}



// 模块组合结果接口
export interface ModuleComposition {
  modules: AtomicModule[];
  connections: ModuleConnection[];
  globalParameters: Parameter[];
  globalUnits: UnitMapping[];
  executionOrder?: string[];     // 模块执行顺序
  dataFlow?: any[];             // 数据流信息
  checkpoints?: string[];       // 关键检查点
}

// 模块连接接口
export interface ModuleConnection {
  from: string;
  to: string;
  parameter: string;
  type: 'input' | 'output' | 'shared';
}

// 增强版 AI 解析器
export class PhysicsAIParserAICaller {
  private config: AIConfig;
  private unitConverter: UnitConverter;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      ...DEFAULT_AI_CONFIG,
      ...config,
      provider: 'deepseek' // 确保始终使用 deepseek
    };
    this.unitConverter = new UnitConverter();
    
    // 验证配置
    const validation = this.validateConfig();
    if (!validation.valid && this.config.enableLogging) {
      console.warn('PhysicsAIParserAICaller 配置警告:', validation.errors.join(', '));
    }
  }

  /**
   * 使用 AI 增强解析物理题目（与 PhysicsAIParser 格式完全一致）
   * @param question 原始题目文本
   * @param options 解析选项
   * @returns 解析结果
   */
  async parseQuestion(question: string, options: any = {}): Promise<ParsedQuestion> {
    try {
      // 1. 基础解析
      const basicResult = parseQuestion(question);
      
      // 2. 多级降级策略
      return await this.parseWithFallbackStrategy(question, basicResult, options);
      
    } catch (error) {
      console.warn('解析失败，使用基础解析:', error);
      return parseQuestion(question);
    }
  }

  /**
   * 纯AI解析方法，不使用回退策略
   */
  async parseQuestionWithAIOnly(
    question: string,
    options: {
      enableModuleDecomposition?: boolean;
      enableModuleComposition?: boolean;
      language?: 'zh' | 'en';
    } = {}
  ): Promise<ParsedQuestion> {
    try {
      const { enableModuleDecomposition = true, enableModuleComposition = true, language = 'zh' } = options;

      // 1. 基础解析（仅用于AI增强的输入）
      const basicResult = parseQuestion(question);
      
      if (enableModuleDecomposition) {
        // 2. 模块分解分析
        const moduleAnalysis = await this.decomposeIntoAtomicModules(question, language);
        
        if (moduleAnalysis.success && moduleAnalysis.modules.length > 0) {
          // 3. 模块组合分析
          let moduleComposition: ModuleComposition | null = null;
          if (enableModuleComposition && moduleAnalysis.modules.length > 1) {
            moduleComposition = await this.buildModuleComposition(moduleAnalysis.modules, question, language);
          }

          // 4. 使用模块化思维增强 AI 解析
          const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
            ...options,
            enableAdvancedAnalysis: true,
            enableFormulaExtraction: true,
            enableUnitOptimization: true,
            moduleAnalysis: moduleAnalysis,
            moduleComposition: moduleComposition
          });

          if (aiEnhanced.success && aiEnhanced.data) {
            const enhanced = this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
            
            // 生成解题路径规划
            if (moduleComposition) {
              enhanced.solutionPath = this.generateSolutionPath(enhanced, moduleComposition);
            }
            
            return enhanced;
          }
        }
      }

      // 5. 标准 AI 增强解析
      const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
        ...options,
        enableAdvancedAnalysis: true,
        enableFormulaExtraction: true,
        enableUnitOptimization: true
      });

      if (aiEnhanced.success && aiEnhanced.data) {
        return this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
      }
      
      // 如果AI解析完全失败，抛出错误而不是回退
      throw new Error('AI解析失败：无法生成有效的解析结果');
      
    } catch (error) {
      throw new Error(`纯AI解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 双级降级解析策略
   */
  private async parseWithFallbackStrategy(
    question: string, 
    basicResult: ParsedQuestion, 
    options: any
  ): Promise<ParsedQuestion> {
    // 策略1: AI增强解析
    try {
      if (this.config.enableLogging) {
        console.log('🔄 尝试策略: AI增强解析');
      }
      
      const aiResult = await this.enhanceWithAI(question, basicResult, options);
      
      if (aiResult.success && aiResult.data) {
        if (this.config.enableLogging) {
          console.log('✅ 策略成功: AI增强解析');
        }
        return this.optimizeParsedQuestion(basicResult, aiResult.data);
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('❌ 策略失败: AI增强解析', (error as Error).message);
      }
    }

    // 策略2: 模板匹配解析（PhysicsAIParser）
    try {
      if (this.config.enableLogging) {
        console.log('🔄 尝试策略: 模板匹配解析');
      }
      
      // 直接使用PhysicsAIParser的基础解析结果
      if (this.config.enableLogging) {
        console.log('✅ 策略成功: 模板匹配解析');
      }
      return basicResult;
      
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('❌ 策略失败: 模板匹配解析', (error as Error).message);
      }
    }

    // 所有策略都失败，返回基础解析结果
    if (this.config.enableLogging) {
      console.warn('⚠️ 所有解析策略都失败，使用基础解析结果');
    }
    return basicResult;
  }

  /**
   * 使用原子模块解析复杂物理题目
   */
  async parseQuestionWithAtomicModules(
    question: string,
    options: {
      enableModuleDecomposition?: boolean;
      enableModuleComposition?: boolean;
      language?: 'zh' | 'en';
    } = {}
  ): Promise<ParsedQuestion> {
    try {
      const { enableModuleDecomposition = true, enableModuleComposition = true, language = 'zh' } = options;

      // 1. 基础解析
      const basicResult = parseQuestion(question);
      
      if (enableModuleDecomposition) {
        // 2. 模块分解分析
        const moduleAnalysis = await this.decomposeIntoAtomicModules(question, language);
        
        if (moduleAnalysis.success && moduleAnalysis.modules.length > 0) {
          // 3. 模块组合分析
          let moduleComposition: ModuleComposition | null = null;
          if (enableModuleComposition && moduleAnalysis.modules.length > 1) {
            moduleComposition = await this.buildModuleComposition(moduleAnalysis.modules, question, language);
          }

          // 4. 使用模块化思维增强 AI 解析
          const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
            ...options,
            enableAdvancedAnalysis: true,
            enableFormulaExtraction: true,
            enableUnitOptimization: true,
            moduleAnalysis: moduleAnalysis,
            moduleComposition: moduleComposition
          });

          if (aiEnhanced.success && aiEnhanced.data) {
            const enhanced = this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
            
            // 生成解题路径规划
            if (moduleComposition) {
              enhanced.solutionPath = this.generateSolutionPath(enhanced, moduleComposition);
            }
            
            return enhanced;
          }
        }
      }

      // 5. 回退到标准 AI 增强解析
      const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
        ...options,
        enableAdvancedAnalysis: true,
        enableFormulaExtraction: true,
        enableUnitOptimization: true
      });

      if (aiEnhanced.success && aiEnhanced.data) {
        return this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
      }
      
      return basicResult;
      
    } catch (error) {
      console.warn('原子模块解析失败，使用基础解析:', error);
      return parseQuestion(question);
    }
  }

  /**
   * 使用 AI 增强信息优化解析结果
   */
  private optimizeParsedQuestion(
    basicResult: ParsedQuestion, 
    aiEnhanced: ParsedQuestion | null
  ): ParsedQuestion {
    let result: ParsedQuestion;
    
    // 如果 AI 返回了完整的 ParsedQuestion，使用 AI 的结果
    if (aiEnhanced && this.isValidParsedQuestion(aiEnhanced)) {
      result = aiEnhanced;
    } else {
      // 否则使用基础解析结果并尝试智能增强
      result = this.enhanceBasicResult(basicResult);
    }
    
    // 增强解析结果，添加DSL转换所需信息
    const enhanced = this.enhanceForDSL(result);
    
    // 验证DSL转换兼容性
    const dslValidation = this.validateDSLCompatibility(enhanced);
    
    if (this.config.enableLogging) {
      console.log('🔍 DSL转换兼容性验证:');
      console.log(`   兼容性: ${dslValidation.compatible ? '✅ 通过' : '❌ 不通过'}`);
      console.log(`   评分: ${dslValidation.score}/100`);
      
      if (dslValidation.issues.length > 0) {
        console.log('   问题:');
        dslValidation.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
      
      if (dslValidation.suggestions.length > 0) {
        console.log('   建议:');
        dslValidation.suggestions.forEach(suggestion => {
          console.log(`     - ${suggestion}`);
        });
      }
    }
    
    return enhanced;
  }

  /**
   * 增强基础解析结果
   */
  private enhanceBasicResult(basicResult: ParsedQuestion): ParsedQuestion {
    const enhanced = { ...basicResult };
    
    // 尝试从参数中推断模块
    const inferredModules = this.inferModulesFromParameters(enhanced.parameters);
    if (inferredModules.length > 0) {
      enhanced.solutionPath = {
        steps: [],
        modules: inferredModules,
        dependencies: [],
        executionOrder: inferredModules,
        checkpoints: []
      };
    }
    
    // 尝试推断求解目标
    const unknownParams = enhanced.parameters.filter(p => p.role === 'unknown');
    if (unknownParams.length > 0) {
      enhanced.target = {
        primary: unknownParams[0].symbol,
        secondary: unknownParams.slice(1).map(p => p.symbol),
        method: this.inferSolutionMethod(enhanced.parameters),
        priority: 1
      };
    }
    
    return enhanced;
  }

  /**
   * 从参数推断模块
   */
  private inferModulesFromParameters(parameters: Parameter[]): string[] {
    const modules: string[] = [];
    const paramSymbols = parameters.map(p => p.symbol);
    
    // 基于参数符号推断可能的模块
    const moduleInference: Record<string, string[]> = {
      'v': ['kinematics_linear', 'projectile_motion'],
      'v0': ['kinematics_linear', 'projectile_motion'],
      'a': ['kinematics_linear', 'newton_dynamics'],
      's': ['kinematics_linear'],
      'h': ['work_energy', 'mechanical_energy_conservation'],
      'm': ['newton_dynamics', 'work_energy'],
      'F': ['newton_dynamics'],
      'E': ['work_energy', 'mechanical_energy_conservation'],
      'W': ['work_energy'],
      'P': ['work_energy', 'power_efficiency'],
      'k': ['oscillation'],
      'T': ['oscillation', 'mechanical_waves'],
      'f': ['oscillation', 'mechanical_waves'],
      'λ': ['mechanical_waves', 'modern_physics'],
      'I': ['dc_circuit', 'electromagnetic_induction'],
      'U': ['dc_circuit', 'electrostatics'],
      'R': ['dc_circuit'],
      'B': ['magnetism', 'electromagnetic_induction'],
      'ε': ['electromagnetic_induction'],
      'Q': ['thermal', 'dc_circuit'],
      'c': ['thermal'],
      'ΔT': ['thermal']
    };
    
    for (const symbol of paramSymbols) {
      if (moduleInference[symbol]) {
        modules.push(...moduleInference[symbol]);
      }
    }
    
    // 去重并返回
    return [...new Set(modules)];
  }

  /**
   * 推断求解方法
   */
  private inferSolutionMethod(parameters: Parameter[]): 'kinematics' | 'dynamics' | 'energy' | 'mixed' {
    const paramSymbols = parameters.map(p => p.symbol);
    
    if (paramSymbols.some(s => ['v', 'v0', 'a', 's', 't'].includes(s))) {
      return 'kinematics';
    } else if (paramSymbols.some(s => ['F', 'm', 'g'].includes(s))) {
      return 'dynamics';
    } else if (paramSymbols.some(s => ['E', 'W', 'P', 'h'].includes(s))) {
      return 'energy';
    } else {
      return 'mixed';
    }
  }

  /**
   * 使用 AI 增强解析结果
   */
  private async enhanceWithAI(
    question: string,
    basicData: ParsedQuestion,
    options: any = {}
  ): Promise<AICallResult> {
    try {
      const prompt = this.buildEnhancementPrompt(question, basicData, options);
      const response = await this.callAI(prompt);
      
      if (response.success && response.data) {
        const aiEnhanced = this.parseAIResponse(response.data);
        if (aiEnhanced) {
          return {
            success: true,
            data: aiEnhanced
          };
        }
      }
      
      return {
        success: false,
        error: 'AI 解析失败'
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 构建增强提示词
   */
  private buildEnhancementPrompt(
    question: string,
    basicData: ParsedQuestion,
    options: any
  ): string {
    return `你是物理题目解析专家。请将以下物理题目解析为JSON格式，不要包含任何markdown标记或额外文字。

题目：${question}

基础解析：
${JSON.stringify(basicData, null, 2)}

请输出完整的JSON，格式如下：
{
  "subject": "physics",
  "topic": "物理主题",
  "question": "${question}",
  "parameters": [
    {
      "symbol": "参数符号",
      "value": 数值或null,
      "unit": "单位",
      "role": "given|unknown|constant|derived",
      "note": "参数说明",
      "dslType": "scalar|vector|tensor",
      "domain": "物理域",
      "priority": 优先级数字,
      "dependencies": ["依赖的参数符号"],
      "formula": "计算该参数的公式"
    }
  ],
  "constraints": [
    {
      "type": "initial|boundary|physical|mathematical",
      "description": "约束条件描述",
      "parameters": ["涉及的参数"],
      "expression": "约束表达式"
    }
  ],
  "units": [
    {
      "original": "原始单位",
      "standard": "标准单位", 
      "conversion": 转换系数
    }
  ],
  "target": {
    "primary": "主要求解目标",
    "secondary": ["次要求解目标"],
    "method": "kinematics|dynamics|energy|mixed",
    "priority": 1
  },
  "solutionPath": {
    "steps": [
      {
        "id": "step1",
        "type": "calculate",
        "module": "模块ID",
        "action": "操作描述",
        "inputs": ["输入参数"],
        "outputs": ["输出参数"],
        "formula": "公式",
        "order": 1
      }
    ],
    "modules": ["模块ID列表"],
    "dependencies": [
      {
        "from": "模块A",
        "to": "模块B", 
        "parameter": "共享参数",
        "type": "input|output|shared|derived",
        "reason": "依赖原因说明"
      }
    ],
    "executionOrder": ["模块执行顺序"],
    "checkpoints": []
  },
  "formulas": {
    "primary": [
      {
        "name": "公式名",
        "expression": "公式表达式",
        "description": "公式说明",
        "type": "primary",
        "module": "所属模块",
        "variables": ["变量列表"]
      }
    ],
    "intermediate": [],
    "verification": []
  },
  "constraints": {
    "initial": [],
    "boundary": [],
    "physical": [],
    "mathematical": []
  },
  "dslMetadata": {
    "complexity": "simple|medium|complex",
    "moduleCount": 1,
    "parameterCount": 1,
    "estimatedSteps": 1,
    "confidence": 0.8
  }
}

可用模块：kinematics_linear, projectile_motion, newton_dynamics, work_energy, mechanical_energy_conservation, circular_motion, oscillation, mechanical_waves, dc_circuit, electrostatics, magnetism, electromagnetic_induction, geometric_optics, thermal, pressure_buoyancy, gravitation, momentum, modern_physics, nuclear_physics

只输出JSON，不要其他内容。`;
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(response: string): ParsedQuestion | null {
    if (!response || typeof response !== 'string') {
      return null;
    }

    // 清理响应文本
    const cleanedResponse = this.cleanAIResponse(response);
    
    try {
      // 尝试直接解析清理后的 JSON
      const parsed = JSON.parse(cleanedResponse);
      if (this.isValidParsedQuestion(parsed)) {
        return parsed;
      }
    } catch (error) {
      // 如果直接解析失败，尝试多种提取策略
      const extractedJson = this.extractJsonFromResponse(response);
      if (extractedJson) {
        try {
          const parsed = JSON.parse(extractedJson);
          if (this.isValidParsedQuestion(parsed)) {
            return parsed;
          }
        } catch (e) {
          if (this.config.enableLogging) {
            console.warn('提取的 JSON 解析失败:', e.message);
          }
        }
      }
    }
    
    if (this.config.enableLogging) {
      console.warn('AI 响应解析失败，响应内容:', response.substring(0, 200) + '...');
    }
    return null;
  }

  /**
   * 清理 AI 响应文本
   */
  private cleanAIResponse(response: string): string {
    return response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^[\s\n\r]+/, '')
      .replace(/[\s\n\r]+$/, '')
      .trim();
  }

  /**
   * 从响应中提取 JSON 内容
   */
  private extractJsonFromResponse(response: string): string | null {
    // 策略1: 查找完整的 JSON 对象
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return this.cleanAIResponse(jsonMatch[0]);
    }

    // 策略2: 查找 JSON 数组
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return this.cleanAIResponse(arrayMatch[0]);
    }

    // 策略3: 查找被 markdown 包围的 JSON
    const markdownMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) {
      return this.cleanAIResponse(markdownMatch[1]);
    }

    // 策略4: 查找行内 JSON
    const lines = response.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          JSON.parse(trimmed);
          return trimmed;
        } catch (e) {
          // 继续尝试下一行
        }
      }
    }

    return null;
  }

  /**
   * 验证 ParsedQuestion 格式
   */
  private isValidParsedQuestion(obj: any): obj is ParsedQuestion {
    return (
      obj &&
      typeof obj === 'object' &&
      obj.subject === 'physics' &&
      typeof obj.topic === 'string' &&
      typeof obj.question === 'string' &&
      Array.isArray(obj.parameters) &&
      Array.isArray(obj.units)
    );
  }

  /**
   * 验证DSL转换兼容性
   */
  private validateDSLCompatibility(parsedQuestion: ParsedQuestion): {
    compatible: boolean;
    issues: string[];
    suggestions: string[];
    score: number;
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 检查是否有明确的求解目标
    if (!parsedQuestion.target?.primary) {
      issues.push('缺少明确的求解目标');
      suggestions.push('请明确标识主要求解参数');
      score -= 20;
    }

    // 检查解题步骤是否完整
    if (!parsedQuestion.solutionPath?.steps?.length) {
      issues.push('缺少解题步骤规划');
      suggestions.push('请提供详细的解题步骤和模块执行顺序');
      score -= 25;
    }

    // 检查参数依赖关系
    const parameters = parsedQuestion.parameters || [];
    const hasDependencies = parameters.some(p => p.dependencies && p.dependencies.length > 0);
    if (!hasDependencies && parameters.length > 3) {
      issues.push('缺少参数依赖关系');
      suggestions.push('请标识参数间的计算依赖关系');
      score -= 15;
    }

    // 检查公式完整性
    const formulas = parsedQuestion.formulas;
    if (!formulas?.primary?.length) {
      issues.push('缺少主要物理公式');
      suggestions.push('请提供解题所需的主要物理公式');
      score -= 20;
    }

    // 检查模块信息
    if (!parsedQuestion.solutionPath?.modules?.length) {
      issues.push('缺少模块信息');
      suggestions.push('请标识涉及的物理模块');
      score -= 10;
    }

    // 检查约束条件
    const constraints = parsedQuestion.constraints;
    if (!constraints?.physical?.length && !constraints?.initial?.length) {
      issues.push('缺少物理约束条件');
      suggestions.push('请提供物理约束和边界条件');
      score -= 10;
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions,
      score: Math.max(0, score)
    };
  }

  /**
   * 增强解析结果，添加DSL转换所需信息
   */
  private enhanceForDSL(parsedQuestion: ParsedQuestion): ParsedQuestion {
    const enhanced = { ...parsedQuestion };

    // 添加DSL元数据
    enhanced.dslMetadata = {
      complexity: this.assessComplexity(enhanced),
      moduleCount: enhanced.solutionPath?.modules?.length || 0,
      parameterCount: enhanced.parameters?.length || 0,
      estimatedSteps: enhanced.solutionPath?.steps?.length || 0,
      confidence: this.calculateGenericConfidence(enhanced, {})
    };

    // 增强参数信息
    if (enhanced.parameters) {
      enhanced.parameters = enhanced.parameters.map(param => ({
        ...param,
        dslType: this.inferDSLType(param),
        domain: this.inferDomain(param),
        priority: this.calculatePriority(param, enhanced),
        dependencies: this.findDependencies(param, enhanced.parameters || []),
        formula: this.findFormula(param, enhanced)
      }));
    }

    return enhanced;
  }

  /**
   * 评估题目复杂度
   */
  private assessComplexity(parsedQuestion: ParsedQuestion): 'simple' | 'medium' | 'complex' {
    const moduleCount = parsedQuestion.solutionPath?.modules?.length || 0;
    const parameterCount = parsedQuestion.parameters?.length || 0;
    const stepCount = parsedQuestion.solutionPath?.steps?.length || 0;

    if (moduleCount <= 1 && parameterCount <= 5 && stepCount <= 3) {
      return 'simple';
    } else if (moduleCount <= 3 && parameterCount <= 10 && stepCount <= 6) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * 推断参数的DSL类型
   */
  private inferDSLType(param: Parameter): 'scalar' | 'vector' | 'tensor' {
    const vectorSymbols = ['v', 'a', 'F', 'p', 'E', 'B'];
    const tensorSymbols = ['σ', 'ε', 'I'];
    
    if (vectorSymbols.some(s => param.symbol.includes(s))) {
      return 'vector';
    } else if (tensorSymbols.some(s => param.symbol.includes(s))) {
      return 'tensor';
    } else {
      return 'scalar';
    }
  }

  /**
   * 推断参数所属领域
   */
  private inferDomain(param: Parameter): 'kinematics' | 'dynamics' | 'energy' | 'electricity' | 'optics' | 'thermal' | 'magnetism' | 'fluid' | 'oscillation' | 'waves' | 'electrostatics' | 'electromagnetic_induction' | 'ac_circuit' | 'physical_optics' | 'modern_physics' | 'nuclear_physics' | 'astrophysics' | 'biophysics' | 'condensed_matter' | 'plasma_physics' | 'quantum_physics' {
    const kinematicsSymbols = ['v', 'v0', 'a', 's', 't', 'x', 'y', 'r', 'θ'];
    const dynamicsSymbols = ['F', 'm', 'g', 'μ', 'N', 'M', 'I', 'α', 'ω', 'L'];
    const energySymbols = ['E', 'W', 'P', 'Ek', 'Ep', 'Ep弹'];
    const electricitySymbols = ['U', 'I', 'R', 'Q', 'C', 'P输入', 'P输出', 'η'];
    const opticsSymbols = ['f', 'n', 'c', 'u', 'v_img', 'i', 'r'];
    const thermalSymbols = ['T', 'Q', 'c', 'L', 'Δt', 'T1', 'T2', 'p', 'V', 'n', 'R', 'N', 'NA'];
    const magnetismSymbols = ['B', 'H', 'Φ', 'ε', 'ΔΦ', 'L', 'M', 'ε自', 'ε互'];
    const fluidSymbols = ['p', 'ρ', 'h', 'v', 'A', 'Q', 'η', 'Re', 'F浮', 'V排'];
    const oscillationSymbols = ['A', 'T', 'f', 'k', 'l', 'x', 'γ', 'ω0', 'ω', 'Q', 'τ', 'F0'];
    const wavesSymbols = ['λ', 'f', 'T', 'v', 'A', 'k', 'ω', 'v声', 'I', 'L', 'f\'', 'vs', 'vo', 'd', 'x', 'Δr', 'δ', 'a', 'θ'];
    const electrostaticsSymbols = ['F', 'k', 'q1', 'q2', 'r', 'E', 'U', 'C', 'Q', 'ε', 'S', 'd'];
    const electromagneticSymbols = ['ε', 'Φ', 'ΔΦ', 'Δt', 'B', 'S', 'θ', 'L', 'M', 'ε自', 'ε互', 'c', 'λ', 'E', 'B', 'S', 'P'];
    const acSymbols = ['u', 'i', 'Um', 'Im', 'U', 'I', 'ω', 'T', 'f'];
    const physicalOpticsSymbols = ['λ', 'd', 'L', 'x', 'a', 'θ', 'n', 'I0', 'I', 'n0', 'ne', 'Δn', 'P', 'A', 'Δλ', 'τ'];
    const modernPhysicsSymbols = ['h', 'c', 'λ', 'f', 'E', 'Ek', 'W', 'n', 'En', 'Z', 'rn', 'vn', 'ΔE'];
    const nuclearSymbols = ['N', 'N0', 'λ', 'T', 't', 'Δm', 'E'];
    const astrophysicsSymbols = ['M', 'R', 'v', 'T', 'H0', 'z', 'd'];
    const biophysicsSymbols = ['F', 'A', 'σ', 'E', 'ε', 'P', 'η'];
    const condensedMatterSymbols = ['a', 'Eg', 'EF', 'n', 'μ', 'σ', 'E', 'K', 'α', 'ρ', 'μ'];
    const plasmaSymbols = ['ne', 'ni', 'Te', 'Ti', 'ωp', 'λD', 'B'];
    const quantumSymbols = ['ψ', '|ψ|²', 'E', 'p', 'x', 'Δx', 'Δp'];

    if (kinematicsSymbols.some(s => param.symbol.includes(s))) return 'kinematics';
    if (dynamicsSymbols.some(s => param.symbol.includes(s))) return 'dynamics';
    if (energySymbols.some(s => param.symbol.includes(s))) return 'energy';
    if (electricitySymbols.some(s => param.symbol.includes(s))) return 'electricity';
    if (opticsSymbols.some(s => param.symbol.includes(s))) return 'optics';
    if (thermalSymbols.some(s => param.symbol.includes(s))) return 'thermal';
    if (magnetismSymbols.some(s => param.symbol.includes(s))) return 'magnetism';
    if (fluidSymbols.some(s => param.symbol.includes(s))) return 'fluid';
    if (oscillationSymbols.some(s => param.symbol.includes(s))) return 'oscillation';
    if (wavesSymbols.some(s => param.symbol.includes(s))) return 'waves';
    if (electrostaticsSymbols.some(s => param.symbol.includes(s))) return 'electrostatics';
    if (electromagneticSymbols.some(s => param.symbol.includes(s))) return 'electromagnetic_induction';
    if (acSymbols.some(s => param.symbol.includes(s))) return 'ac_circuit';
    if (physicalOpticsSymbols.some(s => param.symbol.includes(s))) return 'physical_optics';
    if (modernPhysicsSymbols.some(s => param.symbol.includes(s))) return 'modern_physics';
    if (nuclearSymbols.some(s => param.symbol.includes(s))) return 'nuclear_physics';
    if (astrophysicsSymbols.some(s => param.symbol.includes(s))) return 'astrophysics';
    if (biophysicsSymbols.some(s => param.symbol.includes(s))) return 'biophysics';
    if (condensedMatterSymbols.some(s => param.symbol.includes(s))) return 'condensed_matter';
    if (plasmaSymbols.some(s => param.symbol.includes(s))) return 'plasma_physics';
    if (quantumSymbols.some(s => param.symbol.includes(s))) return 'quantum_physics';

    return 'kinematics'; // 默认
  }

  /**
   * 计算参数优先级
   */
  private calculatePriority(param: Parameter, parsedQuestion: ParsedQuestion): number {
    let priority = 1;

    // 已知参数优先级较低
    if (param.role === 'given') priority = 1;
    // 未知参数优先级较高
    else if (param.role === 'unknown') priority = 10;
    // 常量优先级中等
    else if (param.role === 'constant') priority = 2;
    // 派生参数根据依赖关系确定优先级
    else if (param.role === 'derived') priority = 5;

    // 如果是主要求解目标，优先级最高
    if (parsedQuestion.target?.primary === param.symbol) {
      priority = 20;
    }

    return priority;
  }

  /**
   * 查找参数依赖关系
   */
  private findDependencies(param: Parameter, allParams: Parameter[]): string[] {
    const dependencies: string[] = [];
    
    // 基于公式查找依赖
    if (param.formula) {
      const formula = param.formula;
      allParams.forEach(p => {
        if (p.symbol !== param.symbol && formula.includes(p.symbol)) {
          dependencies.push(p.symbol);
        }
      });
    }

    return dependencies;
  }

  /**
   * 查找参数对应的公式
   */
  private findFormula(param: Parameter, parsedQuestion: ParsedQuestion): string {
    // 这里可以根据参数符号和物理规律推断公式
    // 简化实现，实际可以更复杂
    const formulaMap: Record<string, string> = {
      'v': 'v = v0 + at',
      's': 's = v0t + ½at²',
      'F': 'F = ma',
      'E': 'E = mc²',
      'U': 'U = IR',
      'P': 'P = UI'
    };

    return formulaMap[param.symbol] || '';
  }

  /**
   * 调用 AI API
   */
  private async callAI(prompt: string): Promise<AICallResult> {
    const { retryCount = 3, retryDelay = 1000 } = this.config;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const result = await this.callDeepSeek(prompt, this.config);
        if (result.success) {
          return result;
        }
        
        if (attempt === retryCount) {
          return {
            success: false,
            error: `DeepSeek AI 调用失败 (${retryCount} 次尝试): ${result.error}`
          };
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        const errorMessage = (error as Error).message || '未知错误';
        
        if (attempt === retryCount) {
          return {
            success: false,
            error: `DeepSeek AI 调用失败 (${retryCount} 次尝试): ${errorMessage}`
          };
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    return {
      success: false,
      error: 'AI 调用失败：未知错误'
    };
  }

  /**
   * 调用 DeepSeek API
   */
  private async callDeepSeek(prompt: string, config: any): Promise<AICallResult> {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-v3',
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    };
  }

  /**
   * 验证配置
   */
  private validateConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!this.config.apiKey) {
      errors.push('API Key 未设置');
    }
    
    if (this.config.temperature && (this.config.temperature < 0 || this.config.temperature > 2)) {
      warnings.push('温度参数应在 0-2 之间');
    }
    
    if (this.config.maxTokens && this.config.maxTokens < 100) {
      warnings.push('最大令牌数设置较小，可能影响输出质量');
    }
    
    if (this.config.timeout && this.config.timeout < 5000) {
      warnings.push('超时时间设置较短，可能导致请求失败');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ==================== 原子模块功能实现 ====================



  /**
   * 将复杂题目分解为原子模块
   */
  private async decomposeIntoAtomicModules(
    question: string, 
    language: 'zh' | 'en' = 'zh'
  ): Promise<{ success: boolean; modules: AtomicModule[]; error?: string }> {
    try {
      const prompt = this.buildModuleDecompositionPrompt(question, language);
      const response = await this.callAI(prompt);
      
      if (response.success && response.data) {
        const moduleAnalysis = this.parseModuleDecompositionResponse(response.data, language);
        return { success: true, modules: moduleAnalysis };
      }
      
      return { success: false, modules: [], error: 'AI 调用失败' };
    } catch (error) {
      return { success: false, modules: [], error: (error as Error).message };
    }
  }

  /**
   * 构建模块分解提示词
   */
  private buildModuleDecompositionPrompt(question: string, language: 'zh' | 'en' = 'zh'): string {
    return `分析物理题目并识别相关模块。只输出JSON格式。

题目：${question}

输出格式：
{
  "modules": [
    {
      "id": "模块ID",
      "confidence": 0.9,
      "reason": "选择原因",
      "parameters": ["参数符号"]
    }
  ],
  "connections": [
    {
      "from": "模块1",
      "to": "模块2",
      "parameter": "连接参数",
      "type": "shared"
    }
  ]
}

可用模块：kinematics_linear, projectile_motion, newton_dynamics, work_energy, mechanical_energy_conservation, circular_motion, oscillation, mechanical_waves, dc_circuit, electrostatics, magnetism, electromagnetic_induction, geometric_optics, thermal, pressure_buoyancy, gravitation, momentum, modern_physics, nuclear_physics

只输出JSON，不要其他内容。`;
  }

  /**
   * 解析模块分解响应
   */
  private parseModuleDecompositionResponse(response: string, language: 'zh' | 'en' = 'zh'): AtomicModule[] {
    try {
      // 清理响应文本
      const cleanedResponse = this.cleanAIResponse(response);
      const data = JSON.parse(cleanedResponse);
      const modules: AtomicModule[] = [];

      if (data.modules && Array.isArray(data.modules)) {
        for (const moduleData of data.modules) {
          if (moduleData.confidence > 0.5 && atomicModuleLibrary.getModule(moduleData.id)) {
            const baseModule = atomicModuleLibrary.getModule(moduleData.id)!;
            modules.push({
              ...baseModule,
              parameters: baseModule.parameters.filter(param => 
                moduleData.parameters && moduleData.parameters.includes(param.symbol)
              )
            });
          }
        }
      }

      return modules;
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('解析模块分解响应失败:', error);
        console.warn('响应内容:', response.substring(0, 200) + '...');
      }
      return [];
    }
  }

  /**
   * 构建模块组合
   */
  private async buildModuleComposition(
    modules: AtomicModule[], 
    question: string, 
    language: 'zh' | 'en' = 'zh'
  ): Promise<ModuleComposition> {
    try {
      // 分析模块间的连接关系
      const connections: ModuleConnection[] = [];
      const globalParameters: Parameter[] = [];
      const globalUnits: UnitMapping[] = [];

      // 收集所有模块的参数
      const allParameters = new Map<string, Parameter>();
      const allUnits = new Map<string, UnitMapping>();

      for (const module of modules) {
        for (const param of module.parameters) {
          if (!allParameters.has(param.symbol)) {
            allParameters.set(param.symbol, param);
          }
        }
      }

      // 分析模块间的参数连接
      for (let i = 0; i < modules.length; i++) {
        for (let j = i + 1; j < modules.length; j++) {
          const module1 = modules[i];
          const module2 = modules[j];
          
          // 查找共同参数
          const commonParams = module1.parameters.filter(p1 => 
            module2.parameters.some(p2 => p2.symbol === p1.symbol)
          );

          for (const param of commonParams) {
            connections.push({
              from: module1.id,
              to: module2.id,
              parameter: param.symbol,
              type: 'shared'
            });
          }
        }
      }

      // 构建全局参数和单位映射
      globalParameters.push(...Array.from(allParameters.values()));
      
      // 去重单位映射
      for (const param of globalParameters) {
        if (param.unit && !allUnits.has(param.unit)) {
          allUnits.set(param.unit, {
            original: param.unit,
            standard: param.unit,
            conversion: 1
          });
        }
      }
      globalUnits.push(...Array.from(allUnits.values()));

      // 分析数据流和执行顺序
      const dataFlow = this.analyzeDataFlow(modules, connections, question);
      const executionOrder = this.determineExecutionOrder(modules, connections);

      return {
        modules,
        connections,
        globalParameters,
        globalUnits,
        executionOrder: dataFlow.executionOrder,
        dataFlow: dataFlow.flow,
        checkpoints: dataFlow.checkpoints
      };
    } catch (error) {
      console.warn('构建模块组合失败:', error);
      return this.buildBasicModuleComposition(modules);
    }
  }

  /**
   * 分析模块间数据流
   */
  private analyzeDataFlow(
    modules: AtomicModule[], 
    connections: ModuleConnection[], 
    question: string
  ): {
    executionOrder: string[];
    flow: any[];
    checkpoints: string[];
  } {
    const executionOrder: string[] = [];
    const flow: any[] = [];
    const checkpoints: string[] = [];

    // 基于模块依赖关系确定执行顺序
    const moduleDeps = new Map<string, string[]>();
    const moduleOutputs = new Map<string, string[]>();

    // 初始化模块依赖
    modules.forEach(module => {
      moduleDeps.set(module.id, []);
      moduleOutputs.set(module.id, module.parameters
        .filter(p => p.role === 'unknown' || p.role === 'derived')
        .map(p => p.symbol));
    });

    // 分析连接关系，建立依赖图
    connections.forEach(conn => {
      if (conn.type === 'input' || conn.type === 'shared') {
        const deps = moduleDeps.get(conn.to) || [];
        if (!deps.includes(conn.from)) {
          deps.push(conn.from);
          moduleDeps.set(conn.to, deps);
        }
      }
    });

    // 拓扑排序确定执行顺序
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (moduleId: string) => {
      if (visiting.has(moduleId)) {
        throw new Error(`循环依赖检测到: ${moduleId}`);
      }
      if (visited.has(moduleId)) return;

      visiting.add(moduleId);
      const deps = moduleDeps.get(moduleId) || [];
      deps.forEach(dep => visit(dep));
      visiting.delete(moduleId);
      visited.add(moduleId);
      executionOrder.push(moduleId);
    };

    modules.forEach(module => {
      if (!visited.has(module.id)) {
        visit(module.id);
      }
    });

    // 生成数据流信息
    executionOrder.forEach((moduleId, index) => {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        flow.push({
          step: index + 1,
          module: moduleId,
          action: `执行${module.name}`,
          inputs: module.parameters
            .filter(p => p.role === 'given' || p.role === 'constant')
            .map(p => p.symbol),
          outputs: module.parameters
            .filter(p => p.role === 'unknown' || p.role === 'derived')
            .map(p => p.symbol)
        });

        // 添加关键检查点
        if (module.type === 'dynamics' || module.type === 'energy') {
          checkpoints.push(`${moduleId}_${module.type}`);
        }
      }
    });

    return {
      executionOrder,
      flow,
      checkpoints
    };
  }

  /**
   * 确定模块执行顺序
   */
  private determineExecutionOrder(modules: AtomicModule[], connections: ModuleConnection[]): string[] {
    // 基于模块类型和依赖关系确定执行顺序
    const typePriority: Record<string, number> = {
      'kinematics': 1,
      'dynamics': 2,
      'energy': 3,
      'oscillation': 4,
      'waves': 5,
      'electricity': 6,
      'electrostatics': 7,
      'magnetism': 8,
      'electromagnetic_induction': 9,
      'ac_circuit': 10,
      'optics': 11,
      'physical_optics': 12,
      'thermal': 13,
      'fluid': 14,
      'gravitation': 15,
      'momentum': 16,
      'modern_physics': 17,
      'quantum_physics': 18,
      'nuclear_physics': 19,
      'astrophysics': 20,
      'biophysics': 21,
      'condensed_matter': 22,
      'plasma_physics': 23
    };

    return modules
      .sort((a, b) => {
        const priorityA = typePriority[a.type] || 999;
        const priorityB = typePriority[b.type] || 999;
        return priorityA - priorityB;
      })
      .map(m => m.id);
  }

  /**
   * 构建基础模块组合（回退方案）
   */
  private buildBasicModuleComposition(modules: AtomicModule[]): ModuleComposition {
    const globalParameters: Parameter[] = [];
    const globalUnits: UnitMapping[] = [];
    const allUnits = new Map<string, UnitMapping>();

    // 收集所有参数和单位
    for (const module of modules) {
      globalParameters.push(...module.parameters);
      
      for (const param of module.parameters) {
        if (param.unit && !allUnits.has(param.unit)) {
          allUnits.set(param.unit, {
            original: param.unit,
            standard: param.unit,
            conversion: 1
          });
        }
      }
    }

    globalUnits.push(...Array.from(allUnits.values()));

    // 基础执行顺序
    const executionOrder = modules.map(m => m.id);

    return {
      modules,
      connections: [],
      globalParameters,
      globalUnits,
      executionOrder,
      dataFlow: [],
      checkpoints: []
    };
  }

  /**
   * 生成解题路径规划
   */
  private generateSolutionPath(
    parsedQuestion: ParsedQuestion,
    moduleComposition: ModuleComposition
  ): SolutionPath {
    const steps: SolutionStep[] = [];
    const modules = moduleComposition.modules || [];
    const executionOrder = moduleComposition.executionOrder || modules.map(m => m.id);
    
    // 基于执行顺序生成解题步骤
    executionOrder.forEach((moduleId, index) => {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        const step: SolutionStep = {
          id: `step_${index + 1}`,
          type: this.determineStepType(module),
          module: moduleId,
          action: this.generateActionDescription(module, parsedQuestion),
          inputs: this.extractInputParameters(module, parsedQuestion),
          outputs: this.extractOutputParameters(module, parsedQuestion),
          formula: this.selectPrimaryFormula(module),
          order: index + 1,
          description: this.generateStepDescription(module, parsedQuestion)
        };
        steps.push(step);
      }
    });

    // 生成模块依赖关系
    const dependencies: ModuleDependency[] = [];
    for (let i = 0; i < executionOrder.length - 1; i++) {
      const currentModule = modules.find(m => m.id === executionOrder[i]);
      const nextModule = modules.find(m => m.id === executionOrder[i + 1]);
      
      if (currentModule && nextModule) {
        const commonParams = this.findCommonParameters(currentModule, nextModule);
        commonParams.forEach(param => {
          dependencies.push({
            from: currentModule.id,
            to: nextModule.id,
            parameter: param,
            type: 'shared',
            reason: `${currentModule.name}的输出参数${param}作为${nextModule.name}的输入`
          });
        });
      }
    }

    return {
      steps,
      modules: executionOrder,
      dependencies,
      executionOrder,
      checkpoints: this.generateCheckpoints(modules, parsedQuestion)
    };
  }

  /**
   * 确定步骤类型
   */
  private determineStepType(module: AtomicModule): 'calculate' | 'substitute' | 'solve' | 'verify' | 'convert' {
    switch (module.type) {
      case 'kinematics':
      case 'oscillation':
      case 'waves':
      case 'electricity':
      case 'electrostatics':
      case 'ac_circuit':
      case 'optics':
      case 'physical_optics':
      case 'thermal':
      case 'fluid':
      case 'gravitation':
      case 'momentum':
      case 'modern_physics':
      case 'nuclear_physics':
      case 'astrophysics':
        return 'calculate';
      case 'dynamics':
      case 'magnetism':
      case 'electromagnetic_induction':
      case 'quantum_physics':
        return 'solve';
      case 'energy':
      case 'biophysics':
      case 'condensed_matter':
        return 'verify';
      case 'plasma_physics':
        return 'convert';
      default:
        return 'calculate';
    }
  }

  /**
   * 生成操作描述
   */
  private generateActionDescription(module: AtomicModule, parsedQuestion: ParsedQuestion): string {
    const target = parsedQuestion.target?.primary;
    const moduleName = module.name;
    
    if (target && module.parameters.some(p => p.symbol === target)) {
      return `使用${moduleName}计算${target}`;
    }
    
    return `执行${moduleName}相关计算`;
  }

  /**
   * 提取输入参数
   */
  private extractInputParameters(module: AtomicModule, parsedQuestion: ParsedQuestion): string[] {
    return module.parameters
      .filter(p => p.role === 'given' || p.role === 'constant')
      .map(p => p.symbol);
  }

  /**
   * 提取输出参数
   */
  private extractOutputParameters(module: AtomicModule, parsedQuestion: ParsedQuestion): string[] {
    return module.parameters
      .filter(p => p.role === 'unknown' || p.role === 'derived')
      .map(p => p.symbol);
  }

  /**
   * 选择主要公式
   */
  private selectPrimaryFormula(module: AtomicModule): string {
    if (module.formulas && module.formulas.length > 0) {
      return module.formulas[0];
    }
    return '';
  }

  /**
   * 生成步骤描述
   */
  private generateStepDescription(module: AtomicModule, parsedQuestion: ParsedQuestion): string {
    const inputs = this.extractInputParameters(module, parsedQuestion);
    const outputs = this.extractOutputParameters(module, parsedQuestion);
    
    return `使用${module.name}，输入参数：${inputs.join(', ')}，输出参数：${outputs.join(', ')}`;
  }

  /**
   * 查找共同参数
   */
  private findCommonParameters(module1: AtomicModule, module2: AtomicModule): string[] {
    const params1 = module1.parameters.map(p => p.symbol);
    const params2 = module2.parameters.map(p => p.symbol);
    
    return params1.filter(p => params2.includes(p));
  }

  /**
   * 生成检查点
   */
  private generateCheckpoints(modules: AtomicModule[], parsedQuestion: ParsedQuestion): string[] {
    const checkpoints: string[] = [];
    
    modules.forEach(module => {
      // 为关键模块类型生成检查点
      if (['dynamics', 'energy', 'electromagnetic_induction', 'quantum_physics', 'nuclear_physics'].includes(module.type)) {
        checkpoints.push(`${module.id}_${module.type}`);
      }
      
      // 为复杂模块生成额外检查点
      if (['rigid_body', 'fluid_mechanics', 'plasma_physics', 'astrophysics'].includes(module.id)) {
        checkpoints.push(`${module.id}_complex`);
      }
    });
    
    return checkpoints;
  }

  /**
   * 解析物理题目并生成Contract（通用版）
   */
  async parseQuestionWithContract(
    question: string,
    options: ContractGenerationOptions = {}
  ): Promise<any> {
    if (this.config.enableLogging) {
      console.log('🤖 开始AI解析并生成 Physics Contract...');
    }

    // 1) 解析（保留你现有 AI-only 逻辑）
    const parsedQuestion = await this.parseQuestionWithAIOnly(question);

    // 2) 生成 Contract（仅使用"已知事实 + 显式默认"；不做题目特例推断）
    const contract = await this.generatePhysicsContract(parsedQuestion, question, options);

    // 3) 结构型置信度
    const confidence = this.calculateGenericConfidence(parsedQuestion, contract);

    // 4) 是否 Abstain
    const shouldAbstain = this.shouldAbstainGeneric(confidence, parsedQuestion, contract, options);

    const result = {
      dsl: parsedQuestion,
      contract,
      confidence,
      abstain: shouldAbstain,
      metadata: {
        source: 'PhysicsAIParserAICaller',
        timestamp: Date.now(),
        processingTime: 0,
        warnings: []
      }
    };

    if (this.config.enableLogging) {
      console.log(`✅ Contract生成完成，置信度: ${confidence.toFixed(2)}, Abstain: ${shouldAbstain}`);
    }
    return result;
  }

  /**
   * 通用：从"解析产物 + 显式默认 + 空值"构造 Contract
   */
  private async generatePhysicsContract(
    parsedQuestion: ParsedQuestion,
    originalQuestion: string,
    options: ContractGenerationOptions = {}
  ): Promise<any> {

    const world = {
      coord: options.defaultWorld?.coord ?? "xy_y_up" as const,
      gravity: hasVec2(options.defaultWorld?.gravity) ? options.defaultWorld!.gravity : undefined,
      constants: options.defaultWorld?.constants ?? {}
    };

    const surfaces = this.extractSurfacesGeneric(parsedQuestion);
    const bodies = this.extractBodiesGeneric(parsedQuestion);
    const phases = this.extractPhasesGeneric(parsedQuestion);
    const expected_events = this.extractExpectedEventsGeneric(parsedQuestion);
    const acceptance_tests = this.generateAcceptanceTestsGeneric(parsedQuestion);

    const tolerances = {
      r2_min: options.defaultTolerances?.r2_min,
      rel_err: options.defaultTolerances?.rel_err,
      event_time_sec: options.defaultTolerances?.event_time_sec,
      energy_drift_rel: options.defaultTolerances?.energy_drift_rel,
      v_eps: options.defaultTolerances?.v_eps
    };

    // 若业务要求至少存在一个 surface/body，缺失则保持为空 → Pre-Sim Gate 或 abstain 会处理
    return { world, surfaces, bodies, phases, expected_events, acceptance_tests, tolerances };
  }

  // 仅依据解析产物抽取已知表面；不再关键词/默认θ/μ/e
  private extractSurfacesGeneric(parsed: ParsedQuestion): any[] {
    const out: any[] = [];
    const maybeSurfaces = (parsed as any)?.surfaces ?? [];

    for (const s of (maybeSurfaces as any[])) {
      if (s?.type === "plane" && hasVec2(s.normal)) {
        out.push({
          id: String(s.id ?? `surface_${out.length+1}`),
          type: "plane",
          point: hasVec2(s.point) ? s.point : [0, 0],
          normal: s.normal,
          mu_s: typeof s.mu_s === 'number' ? s.mu_s : undefined,
          mu_k: typeof s.mu_k === 'number' ? s.mu_k : undefined,
          restitution: typeof s.restitution === 'number' ? s.restitution : undefined
        });
      }
    }
    return out;
  }

  // 仅依据解析产物抽取已知刚体；不再默认 1kg/尺寸/数量
  private extractBodiesGeneric(parsed: ParsedQuestion): any[] {
    const out: any[] = [];
    const maybeBodies = (parsed as any)?.bodies ?? [];

    for (const b of (maybeBodies as any[])) {
      if (!b?.id) continue;
      out.push({
        id: String(b.id),
        shape: b.shape ?? "point",
        size: Array.isArray(b.size) ? b.size : undefined,
        mass: Number.isFinite(b.mass) ? b.mass : undefined,
        init: {
          x: Number.isFinite(b?.init?.x) ? b.init.x : 0,
          y: Number.isFinite(b?.init?.y) ? b.init.y : 0,
          vx: Number.isFinite(b?.init?.vx) ? b.init.vx : 0,
          vy: Number.isFinite(b?.init?.vy) ? b.init.vy : 0
        },
        contacts: Array.isArray(b.contacts) ? b.contacts : undefined
      });
    }
    return out;
  }

  // phases：优先用解析器显式结果，否则给一个最小占位
  private extractPhasesGeneric(parsed: ParsedQuestion): any[] {
    const phases = (parsed as any)?.phases;
    if (Array.isArray(phases) && phases.length) return phases;
    return [{ id: "phase_1", name: "generic_phase", description: "auto-generated", dominantForces: [] }];
  }

  // expected_events：不造场景，不估时间窗；解析器不给就留空
  private extractExpectedEventsGeneric(parsed: ParsedQuestion): any[] {
    const events = (parsed as any)?.expected_events;
    if (Array.isArray(events) && events.length) return events;
    return [];
  }

  // 通用断言模板：存在性/守恒/单调等（无题目数值）
  private generateAcceptanceTestsGeneric(parsed: ParsedQuestion): any[] {
    const tests: any[] = [];
    tests.push({ kind: "shape", name: "phases_exist", of: "phases_count", pattern: "monotonic" });
    tests.push({ kind: "ratio", name: "has_any_contact", expr: "contact_events_count > 0", tol: 0 });
    tests.push({ kind: "conservation", name: "energy_bounded", quantity: "energy" });
    return tests;
  }

  // 结构化置信度（不看题目数值）
  private calculateGenericConfidence(parsed: ParsedQuestion, contract: any): number {
    let c = 0.5;
    if (parsed?.parameters?.length) c += 0.1;
    if (parsed?.solutionPath?.modules?.length) c += 0.1;
    if (Array.isArray(contract?.bodies) && contract.bodies.length) c += 0.1;
    if (Array.isArray(contract?.surfaces) && contract.surfaces.length) c += 0.1;
    if (Array.isArray(contract?.acceptance_tests) && contract.acceptance_tests.length) c += 0.1;
    if (contract?.world?.coord) c += 0.05;
    if (hasVec2(contract?.world?.gravity)) c += 0.05;
    return Math.min(1, c);
  }

  // Abstain 决策：关键块缺失且无显式默认 → abstain
  private shouldAbstainGeneric(
    confidence: number,
    parsed: ParsedQuestion,
    contract: any,
    options: ContractGenerationOptions
  ): boolean {
    const gravityMissing = !hasVec2(contract?.world?.gravity);
    if (gravityMissing && !hasVec2(options.defaultWorld?.gravity)) return true;
    if (options.requireAtLeastOneBody && (!contract?.bodies?.length)) return true;
    if (options.requireAtLeastOneSurface && (!contract?.surfaces?.length)) return true;
    if (!contract?.world?.coord) return true;
    return confidence < 0.6;
  }

  // ==================== 保留的辅助方法 ====================

  /**
   * 检查文本是否包含关键词（保留用于其他功能）
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }
}