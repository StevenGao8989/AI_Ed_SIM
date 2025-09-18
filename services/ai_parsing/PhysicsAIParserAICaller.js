"use strict";
// services/ai_parsing/PhysicsAIParserAICaller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsAIParserAICaller = exports.DEFAULT_AI_CONFIG = void 0;
const PhysicsAIParser_1 = require("./PhysicsAIParser");
const unitConverter_1 = require("./unitConverter");
const AtomicModules_1 = require("./AtomicModules");
// 默认配置
exports.DEFAULT_AI_CONFIG = {
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
// 增强版 AI 解析器
class PhysicsAIParserAICaller {
    constructor(config = {}) {
        this.config = Object.assign(Object.assign(Object.assign({}, exports.DEFAULT_AI_CONFIG), config), { provider: 'deepseek' // 确保始终使用 deepseek
         });
        this.unitConverter = new unitConverter_1.UnitConverter();
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
    async parseQuestion(question, options = {}) {
        try {
            // 1. 基础解析
            const basicResult = (0, PhysicsAIParser_1.parseQuestion)(question);
            // 2. 多级降级策略
            return await this.parseWithFallbackStrategy(question, basicResult, options);
        }
        catch (error) {
            console.warn('解析失败，使用基础解析:', error);
            return (0, PhysicsAIParser_1.parseQuestion)(question);
        }
    }
    /**
     * 纯AI解析方法，不使用回退策略
     */
    async parseQuestionWithAIOnly(question, options = {}) {
        try {
            const { enableModuleDecomposition = true, enableModuleComposition = true, language = 'zh' } = options;
            // 1. 基础解析（仅用于AI增强的输入）
            const basicResult = (0, PhysicsAIParser_1.parseQuestion)(question);
            if (enableModuleDecomposition) {
                // 2. 模块分解分析
                const moduleAnalysis = await this.decomposeIntoAtomicModules(question, language);
                if (moduleAnalysis.success && moduleAnalysis.modules.length > 0) {
                    // 3. 模块组合分析
                    let moduleComposition = null;
                    if (enableModuleComposition && moduleAnalysis.modules.length > 1) {
                        moduleComposition = await this.buildModuleComposition(moduleAnalysis.modules, question, language);
                    }
                    // 4. 使用模块化思维增强 AI 解析
                    const aiEnhanced = await this.enhanceWithAI(question, basicResult, Object.assign(Object.assign({}, options), { enableAdvancedAnalysis: true, enableFormulaExtraction: true, enableUnitOptimization: true, moduleAnalysis: moduleAnalysis, moduleComposition: moduleComposition }));
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
            const aiEnhanced = await this.enhanceWithAI(question, basicResult, Object.assign(Object.assign({}, options), { enableAdvancedAnalysis: true, enableFormulaExtraction: true, enableUnitOptimization: true }));
            if (aiEnhanced.success && aiEnhanced.data) {
                return this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
            }
            // 如果AI解析完全失败，抛出错误而不是回退
            throw new Error('AI解析失败：无法生成有效的解析结果');
        }
        catch (error) {
            throw new Error(`纯AI解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 双级降级解析策略
     */
    async parseWithFallbackStrategy(question, basicResult, options) {
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
        }
        catch (error) {
            if (this.config.enableLogging) {
                console.warn('❌ 策略失败: AI增强解析', error.message);
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
        }
        catch (error) {
            if (this.config.enableLogging) {
                console.warn('❌ 策略失败: 模板匹配解析', error.message);
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
    async parseQuestionWithAtomicModules(question, options = {}) {
        try {
            const { enableModuleDecomposition = true, enableModuleComposition = true, language = 'zh' } = options;
            // 1. 基础解析
            const basicResult = (0, PhysicsAIParser_1.parseQuestion)(question);
            if (enableModuleDecomposition) {
                // 2. 模块分解分析
                const moduleAnalysis = await this.decomposeIntoAtomicModules(question, language);
                if (moduleAnalysis.success && moduleAnalysis.modules.length > 0) {
                    // 3. 模块组合分析
                    let moduleComposition = null;
                    if (enableModuleComposition && moduleAnalysis.modules.length > 1) {
                        moduleComposition = await this.buildModuleComposition(moduleAnalysis.modules, question, language);
                    }
                    // 4. 使用模块化思维增强 AI 解析
                    const aiEnhanced = await this.enhanceWithAI(question, basicResult, Object.assign(Object.assign({}, options), { enableAdvancedAnalysis: true, enableFormulaExtraction: true, enableUnitOptimization: true, moduleAnalysis: moduleAnalysis, moduleComposition: moduleComposition }));
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
            const aiEnhanced = await this.enhanceWithAI(question, basicResult, Object.assign(Object.assign({}, options), { enableAdvancedAnalysis: true, enableFormulaExtraction: true, enableUnitOptimization: true }));
            if (aiEnhanced.success && aiEnhanced.data) {
                return this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
            }
            return basicResult;
        }
        catch (error) {
            console.warn('原子模块解析失败，使用基础解析:', error);
            return (0, PhysicsAIParser_1.parseQuestion)(question);
        }
    }
    /**
     * 使用 AI 增强信息优化解析结果
     */
    optimizeParsedQuestion(basicResult, aiEnhanced) {
        let result;
        // 如果 AI 返回了完整的 ParsedQuestion，使用 AI 的结果
        if (aiEnhanced && this.isValidParsedQuestion(aiEnhanced)) {
            result = aiEnhanced;
        }
        else {
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
    enhanceBasicResult(basicResult) {
        const enhanced = Object.assign({}, basicResult);
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
    inferModulesFromParameters(parameters) {
        const modules = [];
        const paramSymbols = parameters.map(p => p.symbol);
        // 基于参数符号推断可能的模块
        const moduleInference = {
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
    inferSolutionMethod(parameters) {
        const paramSymbols = parameters.map(p => p.symbol);
        if (paramSymbols.some(s => ['v', 'v0', 'a', 's', 't'].includes(s))) {
            return 'kinematics';
        }
        else if (paramSymbols.some(s => ['F', 'm', 'g'].includes(s))) {
            return 'dynamics';
        }
        else if (paramSymbols.some(s => ['E', 'W', 'P', 'h'].includes(s))) {
            return 'energy';
        }
        else {
            return 'mixed';
        }
    }
    /**
     * 使用 AI 增强解析结果
     */
    async enhanceWithAI(question, basicData, options = {}) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * 构建增强提示词
     */
    buildEnhancementPrompt(question, basicData, options) {
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
      "note": "参数说明"
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
    "dependencies": [],
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
    parseAIResponse(response) {
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
        }
        catch (error) {
            // 如果直接解析失败，尝试多种提取策略
            const extractedJson = this.extractJsonFromResponse(response);
            if (extractedJson) {
                try {
                    const parsed = JSON.parse(extractedJson);
                    if (this.isValidParsedQuestion(parsed)) {
                        return parsed;
                    }
                }
                catch (e) {
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
    cleanAIResponse(response) {
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
    extractJsonFromResponse(response) {
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
                }
                catch (e) {
                    // 继续尝试下一行
                }
            }
        }
        return null;
    }
    /**
     * 验证 ParsedQuestion 格式
     */
    isValidParsedQuestion(obj) {
        return (obj &&
            typeof obj === 'object' &&
            obj.subject === 'physics' &&
            typeof obj.topic === 'string' &&
            typeof obj.question === 'string' &&
            Array.isArray(obj.parameters) &&
            Array.isArray(obj.units));
    }
    /**
     * 验证DSL转换兼容性
     */
    validateDSLCompatibility(parsedQuestion) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const issues = [];
        const suggestions = [];
        let score = 100;
        // 检查是否有明确的求解目标
        if (!((_a = parsedQuestion.target) === null || _a === void 0 ? void 0 : _a.primary)) {
            issues.push('缺少明确的求解目标');
            suggestions.push('请明确标识主要求解参数');
            score -= 20;
        }
        // 检查解题步骤是否完整
        if (!((_c = (_b = parsedQuestion.solutionPath) === null || _b === void 0 ? void 0 : _b.steps) === null || _c === void 0 ? void 0 : _c.length)) {
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
        if (!((_d = formulas === null || formulas === void 0 ? void 0 : formulas.primary) === null || _d === void 0 ? void 0 : _d.length)) {
            issues.push('缺少主要物理公式');
            suggestions.push('请提供解题所需的主要物理公式');
            score -= 20;
        }
        // 检查模块信息
        if (!((_f = (_e = parsedQuestion.solutionPath) === null || _e === void 0 ? void 0 : _e.modules) === null || _f === void 0 ? void 0 : _f.length)) {
            issues.push('缺少模块信息');
            suggestions.push('请标识涉及的物理模块');
            score -= 10;
        }
        // 检查约束条件
        const constraints = parsedQuestion.constraints;
        if (!((_g = constraints === null || constraints === void 0 ? void 0 : constraints.physical) === null || _g === void 0 ? void 0 : _g.length) && !((_h = constraints === null || constraints === void 0 ? void 0 : constraints.initial) === null || _h === void 0 ? void 0 : _h.length)) {
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
    enhanceForDSL(parsedQuestion) {
        var _a, _b, _c, _d, _e;
        const enhanced = Object.assign({}, parsedQuestion);
        // 添加DSL元数据
        enhanced.dslMetadata = {
            complexity: this.assessComplexity(enhanced),
            moduleCount: ((_b = (_a = enhanced.solutionPath) === null || _a === void 0 ? void 0 : _a.modules) === null || _b === void 0 ? void 0 : _b.length) || 0,
            parameterCount: ((_c = enhanced.parameters) === null || _c === void 0 ? void 0 : _c.length) || 0,
            estimatedSteps: ((_e = (_d = enhanced.solutionPath) === null || _d === void 0 ? void 0 : _d.steps) === null || _e === void 0 ? void 0 : _e.length) || 0,
            confidence: this.calculateConfidence(enhanced)
        };
        // 增强参数信息
        if (enhanced.parameters) {
            enhanced.parameters = enhanced.parameters.map(param => (Object.assign(Object.assign({}, param), { dslType: this.inferDSLType(param), domain: this.inferDomain(param), priority: this.calculatePriority(param, enhanced), dependencies: this.findDependencies(param, enhanced.parameters || []), formula: this.findFormula(param, enhanced) })));
        }
        return enhanced;
    }
    /**
     * 评估题目复杂度
     */
    assessComplexity(parsedQuestion) {
        var _a, _b, _c, _d, _e;
        const moduleCount = ((_b = (_a = parsedQuestion.solutionPath) === null || _a === void 0 ? void 0 : _a.modules) === null || _b === void 0 ? void 0 : _b.length) || 0;
        const parameterCount = ((_c = parsedQuestion.parameters) === null || _c === void 0 ? void 0 : _c.length) || 0;
        const stepCount = ((_e = (_d = parsedQuestion.solutionPath) === null || _d === void 0 ? void 0 : _d.steps) === null || _e === void 0 ? void 0 : _e.length) || 0;
        if (moduleCount <= 1 && parameterCount <= 5 && stepCount <= 3) {
            return 'simple';
        }
        else if (moduleCount <= 3 && parameterCount <= 10 && stepCount <= 6) {
            return 'medium';
        }
        else {
            return 'complex';
        }
    }
    /**
     * 计算解析置信度
     */
    calculateConfidence(parsedQuestion) {
        var _a, _b, _c, _d, _e;
        let confidence = 0.8; // 基础置信度
        // 有明确求解目标
        if ((_a = parsedQuestion.target) === null || _a === void 0 ? void 0 : _a.primary)
            confidence += 0.1;
        // 有解题步骤
        if ((_c = (_b = parsedQuestion.solutionPath) === null || _b === void 0 ? void 0 : _b.steps) === null || _c === void 0 ? void 0 : _c.length)
            confidence += 0.05;
        // 有公式信息
        if ((_e = (_d = parsedQuestion.formulas) === null || _d === void 0 ? void 0 : _d.primary) === null || _e === void 0 ? void 0 : _e.length)
            confidence += 0.05;
        return Math.min(1.0, confidence);
    }
    /**
     * 推断参数的DSL类型
     */
    inferDSLType(param) {
        const vectorSymbols = ['v', 'a', 'F', 'p', 'E', 'B'];
        const tensorSymbols = ['σ', 'ε', 'I'];
        if (vectorSymbols.some(s => param.symbol.includes(s))) {
            return 'vector';
        }
        else if (tensorSymbols.some(s => param.symbol.includes(s))) {
            return 'tensor';
        }
        else {
            return 'scalar';
        }
    }
    /**
     * 推断参数所属领域
     */
    inferDomain(param) {
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
        if (kinematicsSymbols.some(s => param.symbol.includes(s)))
            return 'kinematics';
        if (dynamicsSymbols.some(s => param.symbol.includes(s)))
            return 'dynamics';
        if (energySymbols.some(s => param.symbol.includes(s)))
            return 'energy';
        if (electricitySymbols.some(s => param.symbol.includes(s)))
            return 'electricity';
        if (opticsSymbols.some(s => param.symbol.includes(s)))
            return 'optics';
        if (thermalSymbols.some(s => param.symbol.includes(s)))
            return 'thermal';
        if (magnetismSymbols.some(s => param.symbol.includes(s)))
            return 'magnetism';
        if (fluidSymbols.some(s => param.symbol.includes(s)))
            return 'fluid';
        if (oscillationSymbols.some(s => param.symbol.includes(s)))
            return 'oscillation';
        if (wavesSymbols.some(s => param.symbol.includes(s)))
            return 'waves';
        if (electrostaticsSymbols.some(s => param.symbol.includes(s)))
            return 'electrostatics';
        if (electromagneticSymbols.some(s => param.symbol.includes(s)))
            return 'electromagnetic_induction';
        if (acSymbols.some(s => param.symbol.includes(s)))
            return 'ac_circuit';
        if (physicalOpticsSymbols.some(s => param.symbol.includes(s)))
            return 'physical_optics';
        if (modernPhysicsSymbols.some(s => param.symbol.includes(s)))
            return 'modern_physics';
        if (nuclearSymbols.some(s => param.symbol.includes(s)))
            return 'nuclear_physics';
        if (astrophysicsSymbols.some(s => param.symbol.includes(s)))
            return 'astrophysics';
        if (biophysicsSymbols.some(s => param.symbol.includes(s)))
            return 'biophysics';
        if (condensedMatterSymbols.some(s => param.symbol.includes(s)))
            return 'condensed_matter';
        if (plasmaSymbols.some(s => param.symbol.includes(s)))
            return 'plasma_physics';
        if (quantumSymbols.some(s => param.symbol.includes(s)))
            return 'quantum_physics';
        return 'kinematics'; // 默认
    }
    /**
     * 计算参数优先级
     */
    calculatePriority(param, parsedQuestion) {
        var _a;
        let priority = 1;
        // 已知参数优先级较低
        if (param.role === 'given')
            priority = 1;
        // 未知参数优先级较高
        else if (param.role === 'unknown')
            priority = 10;
        // 常量优先级中等
        else if (param.role === 'constant')
            priority = 2;
        // 派生参数根据依赖关系确定优先级
        else if (param.role === 'derived')
            priority = 5;
        // 如果是主要求解目标，优先级最高
        if (((_a = parsedQuestion.target) === null || _a === void 0 ? void 0 : _a.primary) === param.symbol) {
            priority = 20;
        }
        return priority;
    }
    /**
     * 查找参数依赖关系
     */
    findDependencies(param, allParams) {
        const dependencies = [];
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
    findFormula(param, parsedQuestion) {
        // 这里可以根据参数符号和物理规律推断公式
        // 简化实现，实际可以更复杂
        const formulaMap = {
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
    async callAI(prompt) {
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
            }
            catch (error) {
                const errorMessage = error.message || '未知错误';
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
    async callDeepSeek(prompt, config) {
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
    validateConfig() {
        const errors = [];
        const warnings = [];
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
    async decomposeIntoAtomicModules(question, language = 'zh') {
        try {
            const prompt = this.buildModuleDecompositionPrompt(question, language);
            const response = await this.callAI(prompt);
            if (response.success && response.data) {
                const moduleAnalysis = this.parseModuleDecompositionResponse(response.data, language);
                return { success: true, modules: moduleAnalysis };
            }
            return { success: false, modules: [], error: 'AI 调用失败' };
        }
        catch (error) {
            return { success: false, modules: [], error: error.message };
        }
    }
    /**
     * 构建模块分解提示词
     */
    buildModuleDecompositionPrompt(question, language = 'zh') {
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
    parseModuleDecompositionResponse(response, language = 'zh') {
        try {
            // 清理响应文本
            const cleanedResponse = this.cleanAIResponse(response);
            const data = JSON.parse(cleanedResponse);
            const modules = [];
            if (data.modules && Array.isArray(data.modules)) {
                for (const moduleData of data.modules) {
                    if (moduleData.confidence > 0.5 && AtomicModules_1.atomicModuleLibrary.getModule(moduleData.id)) {
                        const baseModule = AtomicModules_1.atomicModuleLibrary.getModule(moduleData.id);
                        modules.push(Object.assign(Object.assign({}, baseModule), { parameters: baseModule.parameters.filter(param => moduleData.parameters && moduleData.parameters.includes(param.symbol)) }));
                    }
                }
            }
            return modules;
        }
        catch (error) {
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
    async buildModuleComposition(modules, question, language = 'zh') {
        try {
            // 分析模块间的连接关系
            const connections = [];
            const globalParameters = [];
            const globalUnits = [];
            // 收集所有模块的参数
            const allParameters = new Map();
            const allUnits = new Map();
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
                    const commonParams = module1.parameters.filter(p1 => module2.parameters.some(p2 => p2.symbol === p1.symbol));
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
        }
        catch (error) {
            console.warn('构建模块组合失败:', error);
            return this.buildBasicModuleComposition(modules);
        }
    }
    /**
     * 分析模块间数据流
     */
    analyzeDataFlow(modules, connections, question) {
        const executionOrder = [];
        const flow = [];
        const checkpoints = [];
        // 基于模块依赖关系确定执行顺序
        const moduleDeps = new Map();
        const moduleOutputs = new Map();
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
        const visited = new Set();
        const visiting = new Set();
        const visit = (moduleId) => {
            if (visiting.has(moduleId)) {
                throw new Error(`循环依赖检测到: ${moduleId}`);
            }
            if (visited.has(moduleId))
                return;
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
    determineExecutionOrder(modules, connections) {
        // 基于模块类型和依赖关系确定执行顺序
        const typePriority = {
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
    buildBasicModuleComposition(modules) {
        const globalParameters = [];
        const globalUnits = [];
        const allUnits = new Map();
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
    generateSolutionPath(parsedQuestion, moduleComposition) {
        const steps = [];
        const modules = moduleComposition.modules || [];
        const executionOrder = moduleComposition.executionOrder || modules.map(m => m.id);
        // 基于执行顺序生成解题步骤
        executionOrder.forEach((moduleId, index) => {
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                const step = {
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
        const dependencies = [];
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
    determineStepType(module) {
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
    generateActionDescription(module, parsedQuestion) {
        var _a;
        const target = (_a = parsedQuestion.target) === null || _a === void 0 ? void 0 : _a.primary;
        const moduleName = module.name;
        if (target && module.parameters.some(p => p.symbol === target)) {
            return `使用${moduleName}计算${target}`;
        }
        return `执行${moduleName}相关计算`;
    }
    /**
     * 提取输入参数
     */
    extractInputParameters(module, parsedQuestion) {
        return module.parameters
            .filter(p => p.role === 'given' || p.role === 'constant')
            .map(p => p.symbol);
    }
    /**
     * 提取输出参数
     */
    extractOutputParameters(module, parsedQuestion) {
        return module.parameters
            .filter(p => p.role === 'unknown' || p.role === 'derived')
            .map(p => p.symbol);
    }
    /**
     * 选择主要公式
     */
    selectPrimaryFormula(module) {
        if (module.formulas && module.formulas.length > 0) {
            return module.formulas[0];
        }
        return '';
    }
    /**
     * 生成步骤描述
     */
    generateStepDescription(module, parsedQuestion) {
        const inputs = this.extractInputParameters(module, parsedQuestion);
        const outputs = this.extractOutputParameters(module, parsedQuestion);
        return `使用${module.name}，输入参数：${inputs.join(', ')}，输出参数：${outputs.join(', ')}`;
    }
    /**
     * 查找共同参数
     */
    findCommonParameters(module1, module2) {
        const params1 = module1.parameters.map(p => p.symbol);
        const params2 = module2.parameters.map(p => p.symbol);
        return params1.filter(p => params2.includes(p));
    }
    /**
     * 生成检查点
     */
    generateCheckpoints(modules, parsedQuestion) {
        const checkpoints = [];
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
}
exports.PhysicsAIParserAICaller = PhysicsAIParserAICaller;
