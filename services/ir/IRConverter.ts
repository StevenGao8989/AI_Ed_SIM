/**
 * IR 转换器 - 将 PhysicsDSL 转换为中间表示 IR
 * 
 * 功能：
 * 1. DSL 到 IR 的结构转换
 * 2. 物理量纲计算和验证
 * 3. 数学表达式解析和优化
 * 4. 依赖关系分析
 * 5. 计算优化预处理
 */

import { 
  PhysicsIR, IRConversionOptions, IRConversionResult, IRParameter, IRModule, IRObject, 
  IRConstraint, IREquation, IRVector3, IRPhysicalQuantity, IRConservationLaw, 
  DimensionCalculator, PHYSICS_CONSTANTS, IRDimension 
} from './PhysicsIR';
import { AtomicModuleLibrary, AtomicModule } from '../ai_parsing/AtomicModules';

// 导入 DSL 类型（从 PhysicsDslGenerator 中定义的类型）
interface DSLParameter {
  symbol: string;
  value: { value: number; unit: string };
  role: 'given' | 'unknown' | 'constant' | 'derived';
  description: string;
}

interface PhysicsDSL {
  metadata: any;
  system: any;
  simulation: any;
  output: any;
  syllabus: any;
}

export class IRConverter {
  private readonly VERSION = '1.0.0';
  private readonly DEFAULT_OPTIONS: IRConversionOptions = {
    optimize_for_simulation: true,
    include_derivatives: true,
    precompute_constants: true,
    validate_physics: true,
    verbose: false
  };
  private atomicModuleLibrary: AtomicModuleLibrary;
  private dimensionCalculator: DimensionCalculator;

  constructor() {
    this.dimensionCalculator = new DimensionCalculator();
    this.atomicModuleLibrary = new AtomicModuleLibrary();
  }

  /**
   * 将 PhysicsDSL 转换为 PhysicsIR
   */
  async convertDSLToIR(
    dsl: PhysicsDSL,
    options: Partial<IRConversionOptions> = {}
  ): Promise<IRConversionResult> {
    const startTime = Date.now();
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      if (opts.verbose) console.log('🔄 开始 DSL 到 IR 转换...');

      // 1. 转换元数据
      const metadata = this.convertMetadata(dsl.metadata);
      
      // 2. 转换系统配置
      const system = await this.convertSystem(dsl.system, opts);
      
      // 3. 转换仿真配置
      const simulation = this.convertSimulation(dsl.simulation);
      
      // 4. 转换输出配置
      const output = this.convertOutput(dsl.output);
      
      // 5. 生成计算优化
      const optimization = this.generateOptimization(system, opts);
      
      // 6. 验证转换结果
      const validation = this.validateIR({
        metadata,
        system,
        simulation,
        output,
        optimization,
        validation: { 
          structure_valid: false, 
          physics_valid: false, 
          units_consistent: false, 
          constraints_satisfied: false,
          conservation_laws_satisfied: false,
          numerical_stability: false,
          warnings: [], 
          errors: [],
          physics_consistency_score: 0,
          validation_timestamp: new Date().toISOString()
        },
        physics_analysis: {
          dominant_effects: [],
          approximation_level: 'phenomenological',
          physical_interpretation: '',
          educational_value: {
            concepts: [],
            difficulty_level: 0,
            prerequisites: []
          }
        }
      });

      // 先创建基础 IR 对象
      const baseIR = {
        metadata,
        system,
        simulation,
        output,
        optimization,
        validation: {
          structure_valid: validation.structure_valid,
          physics_valid: validation.physics_valid,
          units_consistent: validation.units_consistent,
          constraints_satisfied: validation.constraints_satisfied,
          conservation_laws_satisfied: false,
          numerical_stability: false,
          warnings: validation.warnings,
          errors: validation.errors,
          physics_consistency_score: 0,
          validation_timestamp: new Date().toISOString()
        }
      };

      // 然后添加物理分析
      const ir: PhysicsIR = {
        ...baseIR,
        physics_analysis: {
          dominant_effects: this.identifyDominantPhysics(baseIR),
          approximation_level: this.determineApproximationLevel(baseIR),
          physical_interpretation: this.generatePhysicalInterpretation(baseIR),
          educational_value: {
            concepts: this.extractConcepts(baseIR),
            difficulty_level: baseIR.metadata.complexity_score,
            prerequisites: this.identifyPrerequisites(baseIR)
          }
        }
      };

      const conversionTime = Date.now() - startTime;
      
      if (opts.verbose) console.log(`✅ DSL 到 IR 转换完成 (耗时: ${conversionTime}ms)`);

      return {
        success: true,
        ir,
        warnings: validation.warnings,
        errors: validation.errors,
        conversion_time: conversionTime,
        optimization_applied: this.getAppliedOptimizations(opts),
        physics_analysis: {
          complexity_assessment: this.assessComplexity(ir),
          dominant_physics: this.identifyDominantPhysics(ir),
          approximation_quality: this.evaluateApproximationQuality(ir)
        }
      };

    } catch (error) {
      const conversionTime = Date.now() - startTime;
      return {
        success: false,
        ir: null,
        warnings: [],
        errors: [`转换失败: ${error instanceof Error ? error.message : String(error)}`],
        conversion_time: conversionTime,
        optimization_applied: [],
        physics_analysis: {
          complexity_assessment: '无法评估',
          dominant_physics: [],
          approximation_quality: 0
        }
      };
    }
  }

  /**
   * 转换元数据
   */
  private convertMetadata(dslMetadata: any) {
    return {
      id: dslMetadata.id || this.generateId(),
      version: this.VERSION,
      created_at: new Date().toISOString(),
      source_dsl_id: dslMetadata.id || 'unknown',
      system_type: dslMetadata.system_type || 'unknown',
      difficulty: dslMetadata.difficulty || 'medium',
      grade: dslMetadata.grade || 'unknown',
      physics_domain: this.inferPhysicsDomains(dslMetadata),
      complexity_score: this.calculateComplexityScore(dslMetadata),
      estimated_solve_time: this.estimateSolveTime(dslMetadata)
    };
  }

  /**
   * 转换系统配置
   */
  private async convertSystem(dslSystem: any, options: IRConversionOptions) {
    // 转换参数
    const baseParameters = this.convertParameters(dslSystem.parameters || []);
    
    // 转换对象
    const objects = this.convertObjects(dslSystem.objects || []);
    
    // 转换约束
    const constraints = this.convertConstraints(dslSystem.constraints || []);
    
    // 生成模块
    const modules = this.generateModules(dslSystem, baseParameters, options);
    
    // 合并所有模块参数到系统参数中
    const allParameters = this.mergeModuleParameters(baseParameters, modules);
    
    // 转换环境
    const environment = this.convertEnvironment(dslSystem.environment);

    return {
      type: dslSystem.type || 'unknown',
      dimensions: dslSystem.dimensions || 2,
      modules,
      objects,
      parameters: allParameters,
      constraints,
      conservation_laws: this.extractConservationLaws(modules),
      symmetries: this.identifySymmetries(dslSystem),
      environment,
      boundary_conditions: this.extractBoundaryConditions(dslSystem),
      initial_conditions: this.extractInitialConditions(dslSystem)
    };
  }

  /**
   * 转换参数
   */
  private convertParameters(dslParameters: DSLParameter[]): IRParameter[] {
    return dslParameters.map(param => ({
      symbol: param.symbol,
      value: {
        value: param.value.value,
        unit: param.value.unit,
        dimension: this.calculateDimension(param.value.unit)
      },
      role: param.role,
      description: param.description,
      dependencies: this.findParameterDependencies(param, dslParameters),
      constraints: []
    }));
  }

  /**
   * 转换对象
   */
  private convertObjects(dslObjects: any[]): IRObject[] {
    return dslObjects.map(obj => ({
      id: obj.id || this.generateId(),
      name: obj.name || 'unnamed',
      type: obj.type || 'particle',
      position: this.convertVector3(obj.position),
      velocity: this.convertVector3(obj.velocity),
      acceleration: this.convertVector3(obj.acceleration),
      mass: this.convertPhysicalQuantity(obj.mass),
      properties: this.convertProperties(obj.properties || {}),
      constraints: []
    }));
  }

  /**
   * 转换约束
   */
  private convertConstraints(dslConstraints: any[]): IRConstraint[] {
    return dslConstraints.map(constraint => ({
      type: this.mapConstraintType(constraint.type),
      expression: constraint.expression || '',
      parameters: constraint.parameters || [],
      description: constraint.description || '',
      priority: constraint.priority || 'important',
      tolerance: constraint.tolerance || 1e-6,
      domain: constraint.domain || {},
      physics_law: constraint.physics_law || ''
    }));
  }

  /**
   * 生成物理模块
   */
  private generateModules(system: any, parameters: IRParameter[], options: IRConversionOptions): IRModule[] {
    const modules: IRModule[] = [];
    
    // 智能识别物理模块
    const detectedModules = this.detectPhysicsModules(system, parameters);
    
    // 使用原子模块库生成模块
    const allAtomicModules = this.atomicModuleLibrary.getAllModules();
    const paramSymbols = parameters.map(p => p.symbol.toLowerCase());
    const systemType = system.type?.toLowerCase() || '';
    const question = (system as any).originalText?.toLowerCase() || '';
    
    // 为每个检测到的模块类型找到最匹配的原子模块
    detectedModules.forEach(moduleType => {
      const relevantAtomicModules = Array.from(allAtomicModules.values())
        .filter(atomicModule => atomicModule.type === moduleType)
        .filter(atomicModule => this.isModuleRelevant(atomicModule, paramSymbols, systemType, question));
      
      if (relevantAtomicModules.length > 0) {
        // 选择最相关的原子模块
        const bestMatch = relevantAtomicModules[0];
        const irModule = this.convertAtomicModuleToIR(bestMatch, parameters);
        modules.push(irModule);
      } else {
        // 如果没有找到匹配的原子模块，使用传统方法创建
        switch (moduleType) {
          case 'oscillation':
            modules.push(this.createOscillationModule(parameters));
            break;
          case 'wave':
            modules.push(this.createWaveModule(parameters));
            break;
          case 'kinematics':
            modules.push(this.createKinematicsModule(parameters));
            break;
          case 'dynamics':
            modules.push(this.createDynamicsModule(parameters));
            break;
          case 'electromagnetic':
            modules.push(this.createElectromagneticModule(parameters));
            break;
          case 'thermal':
            modules.push(this.createThermalModule(parameters));
            break;
          case 'optical':
            modules.push(this.createOpticalModule(parameters));
            break;
          case 'quantum':
            modules.push(this.createQuantumModule(parameters));
            break;
          case 'acoustics':
            modules.push(this.createAcousticsModule(parameters));
            break;
          case 'phase_change':
            modules.push(this.createPhaseChangeModule(parameters));
            break;
          case 'simple_machines':
            modules.push(this.createSimpleMachinesModule(parameters));
            break;
          case 'pressure':
            modules.push(this.createPressureModule(parameters));
            break;
          case 'basic_electricity':
            modules.push(this.createBasicElectricityModule(parameters));
            break;
          default:
            modules.push(this.createDefaultModule(parameters));
        }
      }
    });
    
    // 如果没有检测到任何模块，创建默认模块
    if (modules.length === 0) {
      modules.push(this.createDefaultModule(parameters));
    }
    
    return modules;
  }

  /**
   * 智能检测物理模块类型
   */
  private detectPhysicsModules(system: any, parameters: IRParameter[]): string[] {
    const detectedModules: string[] = [];
    const paramSymbols = parameters.map(p => p.symbol.toLowerCase());
    const systemType = system.type?.toLowerCase() || '';
    const question = (system as any).originalText?.toLowerCase() || '';
    
    // 使用原子模块库进行智能检测
    const allAtomicModules = this.atomicModuleLibrary.getAllModules();
    
    // 遍历所有原子模块，检查是否匹配
    for (const [moduleId, atomicModule] of allAtomicModules) {
      if (this.isModuleRelevant(atomicModule, paramSymbols, systemType, question)) {
        detectedModules.push(atomicModule.type);
      }
    }
    
    // 去重并返回
    return [...new Set(detectedModules)];
  }

  /**
   * 检查原子模块是否与当前系统相关
   */
  private isModuleRelevant(atomicModule: AtomicModule, paramSymbols: string[], systemType: string, question: string): boolean {
    // 1. 检查参数符号匹配
    const moduleParamSymbols = atomicModule.parameters.map(p => p.symbol.toLowerCase());
    const hasMatchingParams = moduleParamSymbols.some(symbol => paramSymbols.includes(symbol));
    
    // 2. 检查系统类型匹配
    const hasMatchingSystemType = systemType.includes(atomicModule.type.toLowerCase()) || 
                                 atomicModule.type.toLowerCase().includes(systemType);
    
    // 3. 检查问题描述匹配
    const hasMatchingDescription = question.includes(atomicModule.name.toLowerCase()) ||
                                  atomicModule.description.toLowerCase().split(' ').some(word => 
                                    question.includes(word) && word.length > 2
                                  );
    
    // 4. 检查模块名称中的关键词
    const moduleKeywords = atomicModule.name.toLowerCase().split(/[\s，,、]/);
    const hasMatchingKeywords = moduleKeywords.some(keyword => 
      question.includes(keyword) && keyword.length > 1
    );
    
    // 至少满足两个条件才认为相关
    const matchCount = [hasMatchingParams, hasMatchingSystemType, hasMatchingDescription, hasMatchingKeywords]
      .filter(Boolean).length;
    
    return matchCount >= 2;
  }

  /**
   * 将原子模块转换为 IR 模块
   */
  private convertAtomicModuleToIR(atomicModule: AtomicModule, parameters: IRParameter[]): IRModule {
    // 转换参数
    const irParameters: IRParameter[] = atomicModule.parameters.map(param => ({
      symbol: param.symbol,
      value: {
        value: param.value || 0,
        unit: param.unit || 'unknown',
        dimension: DimensionCalculator.parseDimension(param.unit || 'unknown').toString(),
        uncertainty: 0,
        precision: 3,
        range: undefined
      },
      role: param.role as 'given' | 'unknown' | 'constant' | 'derived',
      description: param.note || param.symbol,
      domain: this.inferParameterDomain(param.symbol),
      dependencies: [],
      constraints: []
    }));

    // 转换公式为方程
    const irEquations: IREquation[] = atomicModule.formulas.map((formula, index) => ({
      id: `${atomicModule.id}_equation_${index}`,
      type: 'algebraic',
      expression: formula,
      variables: this.extractVariablesFromFormula(formula),
      parameters: this.extractParametersFromFormula(formula),
      description: `来自原子模块 ${atomicModule.name} 的公式`,
      order: 1,
      linearity: 'linear',
      stability: 'stable',
      boundary_conditions: [],
      initial_conditions: [],
      physics_meaning: `原子模块 ${atomicModule.name} 的物理关系`,
      derivation: '来自原子模块库'
    }));

    return {
      id: `${atomicModule.id}_ir_module`,
      type: atomicModule.type as any,
      name: atomicModule.name,
      description: atomicModule.description,
      parameters: irParameters,
      equations: irEquations,
      dependencies: atomicModule.dependencies,
      output: atomicModule.output,
      conservation_laws: [],
      assumptions: [],
      limitations: [],
      complexity: 'basic',
      domain: {
        spatial: '1d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 从公式中提取变量
   */
  private extractVariablesFromFormula(formula: string): string[] {
    // 简单的变量提取逻辑，匹配字母开头的标识符
    const variablePattern = /\b[a-zA-Z_α-ωΑ-Ω][a-zA-Z0-9_α-ωΑ-Ω]*\b/g;
    const matches = formula.match(variablePattern) || [];
    return [...new Set(matches)]; // 去重
  }

  /**
   * 从公式中提取参数
   */
  private extractParametersFromFormula(formula: string): string[] {
    // 参数通常是常数，这里简化处理
    return [];
  }

  /**
   * 推断参数域
   */
  private inferParameterDomain(symbol: string): string {
    const symbolLower = symbol.toLowerCase();
    if (['x', 'y', 'z', 'r', 'l', 'd', 'h'].includes(symbolLower)) return 'spatial';
    if (['t', 'time'].includes(symbolLower)) return 'temporal';
    if (['m', 'mass'].includes(symbolLower)) return 'material';
    if (['v', 'velocity', 'speed'].includes(symbolLower)) return 'kinematic';
    if (['f', 'force'].includes(symbolLower)) return 'dynamic';
    if (['e', 'energy', 'u', 'voltage'].includes(symbolLower)) return 'energetic';
    return 'generic';
  }

  /**
   * 创建振动模块
   */
  private createOscillationModule(parameters: IRParameter[]): IRModule {
    // 获取系统参数中已有的参数
    const existingParams = parameters.filter(p => ['k', 'm', 'A', 'x', 'v', 'a'].includes(p.symbol));
    
    // 为方程中需要的变量和参数创建完整定义
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      // 添加方程中需要的变量
      this.createParameter('x', 'L', 'unknown', '位移', 0),
      this.createParameter('t', 'T', 'given', '时间变量', 0),
      this.createParameter('v', 'LT^-1', 'derived', '速度', 0),
      this.createParameter('a', 'LT^-2', 'derived', '加速度', 0),
      // 添加方程中需要的参数（如果不存在）
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'k', dimension: 'MT^-2', role: 'given', description: '弹簧劲度系数', defaultValue: 100 },
        { symbol: 'm', dimension: 'M', role: 'given', description: '质量', defaultValue: 0.5 },
        { symbol: 'A', dimension: 'L', role: 'given', description: '振幅', defaultValue: 0.1 }
      ])
    ];
    
    return {
      id: 'oscillation_module',
      type: 'oscillation',
      name: '简谐振动',
      description: '弹簧振子的简谐振动',
      parameters: moduleParameters,
      equations: [
        {
          id: 'oscillation_equation',
          type: 'differential',
          expression: 'd²x/dt² = -(k/m) * x',
          variables: ['x', 't'],
          parameters: ['k', 'm'],
          description: '简谐振动微分方程',
          order: 2,
          linearity: 'linear',
          stability: 'stable',
          physics_meaning: '简谐振动的动力学方程'
        }
      ],
      dependencies: [],
      output: ['x', 'v', 'a', 'T', 'ω'],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'E = (1/2)kx² + (1/2)mv²',
          variables: ['E', 'x', 'v'],
          tolerance: 1e-6,
          description: '简谐振动的能量守恒'
        }
      ],
      assumptions: ['小振幅近似', '无阻尼', '线性恢复力'],
      limitations: ['不适用于大振幅', '忽略非线性效应'],
      complexity: 'intermediate',
      domain: {
        spatial: '1d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建波动模块
   */
  private createWaveModule(parameters: IRParameter[]): IRModule {
    // 获取系统参数中已有的参数
    const existingParams = parameters.filter(p => ['y', 'A', 'ω', 'k', 'v'].includes(p.symbol));
    
    // 为方程中需要的变量和参数创建完整定义
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      // 添加方程中需要的变量
      this.createParameter('x', 'L', 'given', '空间坐标', 0),
      this.createParameter('t', 'T', 'given', '时间变量', 0),
      // 添加方程中需要的参数（如果不存在）
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'A', dimension: 'L', role: 'given', description: '振幅', defaultValue: 0.02 },
        { symbol: 'ω', dimension: 'T^-1', role: 'given', description: '角频率', defaultValue: 20 },
        { symbol: 'k', dimension: 'L^-1', role: 'given', description: '波数', defaultValue: 0.5 }
      ])
    ];

    return {
      id: 'wave_module',
      type: 'wave',
      name: '简谐波',
      description: '简谐横波传播',
      parameters: moduleParameters,
      equations: [
        {
          id: 'wave_equation',
          type: 'algebraic',
          expression: 'y = A * sin(ωt - kx)',
          variables: ['y', 'x', 't'],
          parameters: ['A', 'ω', 'k'],
          description: '简谐波方程',
          linearity: 'linear',
          physics_meaning: '简谐波的数学描述'
        }
      ],
      dependencies: [],
      output: ['y', 'f', 'λ', 'v'],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'E ∝ A²ω²',
          variables: ['E', 'A', 'ω'],
          tolerance: 1e-6,
          description: '波的能量与振幅和频率的关系'
        }
      ],
      assumptions: ['线性介质', '小振幅', '无耗散'],
      limitations: ['不适用于非线性介质', '忽略色散效应'],
      complexity: 'intermediate',
      domain: {
        spatial: '1d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建运动学模块
   */
  private createKinematicsModule(parameters: IRParameter[]): IRModule {
    // 获取系统参数中已有的参数
    const existingParams = parameters.filter(p => ['x', 'v', 'a', 't'].includes(p.symbol));
    
    // 为方程中需要的变量创建完整定义
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      // 添加方程中需要的变量（如果不存在）
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'x', dimension: 'L', role: 'unknown', description: '位移', defaultValue: 0 },
        { symbol: 'v', dimension: 'LT^-1', role: 'unknown', description: '速度', defaultValue: 0 },
        { symbol: 'a', dimension: 'LT^-2', role: 'given', description: '加速度', defaultValue: 0 },
        { symbol: 't', dimension: 'T', role: 'given', description: '时间变量', defaultValue: 0 }
      ])
    ];
    
    return {
      id: 'kinematics_module',
      type: 'kinematics',
      name: '运动学',
      description: '基本运动学方程',
      parameters: moduleParameters,
      equations: [
        {
          id: 'kinematics_equation',
          type: 'differential',
          expression: 'dx/dt = v, dv/dt = a',
          variables: ['x', 'v', 'a', 't'],
          parameters: [],
          description: '运动学基本方程',
          order: 1,
          linearity: 'linear',
          physics_meaning: '速度是位移对时间的导数，加速度是速度对时间的导数'
        }
      ],
      dependencies: [],
      output: ['x', 'v', 'a'],
      conservation_laws: [],
      assumptions: ['质点模型', '经典力学适用'],
      limitations: ['不适用于相对论情况', '忽略量子效应'],
      complexity: 'basic',
      domain: {
        spatial: '1d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建默认模块
   */
  private createDefaultModule(parameters: IRParameter[]): IRModule {
    return {
      id: 'default_module',
      type: 'generic',
      name: '通用物理模块',
      description: '通用物理系统',
      parameters,
      equations: [],
      dependencies: [],
      output: [],
      conservation_laws: [],
      assumptions: ['经典物理适用'],
      limitations: ['仅适用于宏观低速情况'],
      complexity: 'basic',
      domain: {
        spatial: '3d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  // ===== 物理模块检测方法 =====

  private detectOscillationModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const oscillationKeywords = ['k', 'ω', 'omega', 't', 'period', 'frequency', 'amplitude', 'spring', 'pendulum'];
    const oscillationTerms = ['振动', '振荡', '简谐', '弹簧', '摆', '周期', '频率', '振幅'];
    
    return oscillationKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           oscillationTerms.some(term => question.includes(term)) ||
           systemType.includes('oscillation');
  }

  private detectWaveModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const waveKeywords = ['λ', 'lambda', 'k', 'ω', 'omega', 'v', 'f', 'wave', 'amplitude'];
    const waveTerms = ['波', '波动', '横波', '纵波', '波长', '波速', '波频', '干涉', '衍射'];
    
    return waveKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           waveTerms.some(term => question.includes(term)) ||
           systemType.includes('wave');
  }

  private detectKinematicsModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const kinematicsKeywords = ['x', 'v', 'a', 't', 's', 'u', 'displacement', 'velocity', 'acceleration'];
    const kinematicsTerms = ['运动', '位移', '速度', '加速度', '匀速', '匀加速', '自由落体', '抛体'];
    
    return kinematicsKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           kinematicsTerms.some(term => question.includes(term)) ||
           systemType.includes('kinematics');
  }

  private detectDynamicsModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const dynamicsKeywords = ['f', 'm', 'a', 'force', 'mass', 'momentum', 'energy', 'work', 'power'];
    const dynamicsTerms = ['力', '质量', '动量', '能量', '功', '功率', '牛顿', '碰撞', '冲量'];
    
    return dynamicsKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           dynamicsTerms.some(term => question.includes(term)) ||
           systemType.includes('dynamics');
  }

  private detectElectromagneticModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const emKeywords = ['e', 'b', 'q', 'i', 'r', 'c', 'electric', 'magnetic', 'field', 'charge', 'current'];
    const emTerms = ['电场', '磁场', '电荷', '电流', '电阻', '电容', '电感', '电磁', '感应', '洛伦兹'];
    
    return emKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           emTerms.some(term => question.includes(term)) ||
           systemType.includes('electromagnetic');
  }

  private detectThermalModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const thermalKeywords = ['t', 'q', 'c', 'k', 'h', 'temperature', 'heat', 'thermal', 'entropy'];
    const thermalTerms = ['温度', '热量', '热', '熵', '热力学', '比热', '热传导', '热辐射'];
    
    return thermalKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           thermalTerms.some(term => question.includes(term)) ||
           systemType.includes('thermal');
  }

  private detectOpticalModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const opticalKeywords = ['n', 'θ', 'theta', 'f', 'd', 'refractive', 'index', 'lens', 'mirror'];
    const opticalTerms = ['光', '光学', '折射', '反射', '透镜', '镜', '干涉', '衍射', '偏振'];
    
    return opticalKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           opticalTerms.some(term => question.includes(term)) ||
           systemType.includes('optical');
  }

  private detectQuantumModule(paramSymbols: string[], systemType: string, question: string): boolean {
    const quantumKeywords = ['h', 'ħ', 'hbar', 'ψ', 'psi', 'φ', 'phi', 'quantum', 'wavefunction'];
    const quantumTerms = ['量子', '波函数', '薛定谔', '不确定性', '量子化', '能级', '跃迁'];
    
    return quantumKeywords.some(keyword => paramSymbols.includes(keyword)) ||
           quantumTerms.some(term => question.includes(term)) ||
           systemType.includes('quantum');
  }

  // ===== 新增物理模块创建方法 =====

  private createDynamicsModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['f', 'm', 'a', 'p', 'e', 'w', 'v'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'F', dimension: 'MLT^-2', role: 'unknown', description: '力', defaultValue: 0 },
        { symbol: 'm', dimension: 'M', role: 'given', description: '质量', defaultValue: 1 },
        { symbol: 'a', dimension: 'LT^-2', role: 'unknown', description: '加速度', defaultValue: 0 },
        { symbol: 'v', dimension: 'LT^-1', role: 'unknown', description: '速度', defaultValue: 0 },
        { symbol: 'p', dimension: 'MLT^-1', role: 'unknown', description: '动量', defaultValue: 0 },
        { symbol: 'E', dimension: 'ML^2T^-2', role: 'unknown', description: '能量', defaultValue: 0 }
      ])
    ];
    
    return {
      id: 'dynamics_module',
      type: 'dynamics',
      name: '动力学',
      description: '牛顿力学和能量守恒',
      parameters: moduleParameters,
      equations: [
        {
          id: 'newton_second_law',
          type: 'algebraic',
          expression: 'F = ma',
          variables: ['F', 'm', 'a'],
          parameters: [],
          description: '牛顿第二定律',
          linearity: 'linear',
          physics_meaning: '力等于质量乘以加速度'
        },
        {
          id: 'momentum_definition',
          type: 'algebraic',
          expression: 'p = mv',
          variables: ['p', 'm', 'v'],
          parameters: [],
          description: '动量定义',
          linearity: 'linear',
          physics_meaning: '动量等于质量乘以速度'
        }
      ],
      dependencies: [],
      output: ['F', 'a', 'p', 'E'],
      conservation_laws: [
        {
          type: 'momentum',
          expression: 'p_total = constant',
          variables: ['p'],
          tolerance: 1e-6,
          description: '动量守恒定律'
        },
        {
          type: 'energy',
          expression: 'E_total = constant',
          variables: ['E'],
          tolerance: 1e-6,
          description: '能量守恒定律'
        }
      ],
      assumptions: ['经典力学适用', '质点模型'],
      limitations: ['不适用于相对论情况', '不适用于量子效应'],
      complexity: 'intermediate',
      domain: {
        spatial: '3d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  private createElectromagneticModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['e', 'b', 'q', 'i', 'r', 'c'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'E', dimension: 'MLT^-3I^-1', role: 'unknown', description: '电场强度', defaultValue: 0 },
        { symbol: 'B', dimension: 'MT^-2I^-1', role: 'unknown', description: '磁感应强度', defaultValue: 0 },
        { symbol: 'q', dimension: 'IT', role: 'given', description: '电荷量', defaultValue: 1 },
        { symbol: 'I', dimension: 'I', role: 'given', description: '电流', defaultValue: 1 },
        { symbol: 'R', dimension: 'ML^2T^-3I^-2', role: 'given', description: '电阻', defaultValue: 1 }
      ])
    ];
    
    return {
      id: 'electromagnetic_module',
      type: 'electromagnetic',
      name: '电磁学',
      description: '电磁场和电路',
      parameters: moduleParameters,
      equations: [
        {
          id: 'coulomb_law',
          type: 'algebraic',
          expression: 'F = k*q1*q2/r^2',
          variables: ['F', 'q1', 'q2', 'r'],
          parameters: ['k'],
          description: '库仑定律',
          linearity: 'nonlinear',
          physics_meaning: '点电荷间的静电力'
        },
        {
          id: 'ohms_law',
          type: 'algebraic',
          expression: 'V = IR',
          variables: ['V', 'I', 'R'],
          parameters: [],
          description: '欧姆定律',
          linearity: 'linear',
          physics_meaning: '电压等于电流乘以电阻'
        }
      ],
      dependencies: [],
      output: ['E', 'B', 'F', 'V'],
      conservation_laws: [
        {
          type: 'charge',
          expression: 'q_total = constant',
          variables: ['q'],
          tolerance: 1e-12,
          description: '电荷守恒定律'
        }
      ],
      assumptions: ['准静态近似', '线性介质'],
      limitations: ['不适用于高频情况', '忽略辐射效应'],
      complexity: 'advanced',
      domain: {
        spatial: '3d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  private createThermalModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['t', 'q', 'c', 'k', 'h'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'T', dimension: 'Θ', role: 'unknown', description: '温度', defaultValue: 300 },
        { symbol: 'Q', dimension: 'ML^2T^-2', role: 'unknown', description: '热量', defaultValue: 0 },
        { symbol: 'c', dimension: 'L^2T^-2Θ^-1', role: 'given', description: '比热容', defaultValue: 1000 },
        { symbol: 'k', dimension: 'MLT^-3Θ^-1', role: 'given', description: '热导率', defaultValue: 1 }
      ])
    ];
    
    return {
      id: 'thermal_module',
      type: 'thermal',
      name: '热学',
      description: '热力学和传热',
      parameters: moduleParameters,
      equations: [
        {
          id: 'heat_capacity',
          type: 'algebraic',
          expression: 'Q = mcΔT',
          variables: ['Q', 'm', 'c', 'T'],
          parameters: [],
          description: '热容量方程',
          linearity: 'linear',
          physics_meaning: '热量等于质量乘以比热容乘以温度变化'
        }
      ],
      dependencies: [],
      output: ['T', 'Q'],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'Q_in = Q_out + ΔU',
          variables: ['Q', 'U'],
          tolerance: 1e-6,
          description: '热力学第一定律'
        }
      ],
      assumptions: ['理想气体', '准静态过程'],
      limitations: ['不适用于非平衡态', '忽略量子效应'],
      complexity: 'intermediate',
      domain: {
        spatial: '3d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  private createOpticalModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['n', 'θ', 'f', 'd', 'λ'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'n', dimension: '1', role: 'given', description: '折射率', defaultValue: 1.5 },
        { symbol: 'θ', dimension: '1', role: 'unknown', description: '角度', defaultValue: 0 },
        { symbol: 'f', dimension: 'L', role: 'given', description: '焦距', defaultValue: 0.1 },
        { symbol: 'λ', dimension: 'L', role: 'given', description: '波长', defaultValue: 500e-9 }
      ])
    ];
    
    return {
      id: 'optical_module',
      type: 'optical',
      name: '光学',
      description: '几何光学和波动光学',
      parameters: moduleParameters,
      equations: [
        {
          id: 'snells_law',
          type: 'algebraic',
          expression: 'n1*sin(θ1) = n2*sin(θ2)',
          variables: ['n1', 'θ1', 'n2', 'θ2'],
          parameters: [],
          description: '斯涅尔定律',
          linearity: 'nonlinear',
          physics_meaning: '折射定律'
        }
      ],
      dependencies: [],
      output: ['θ', 'f'],
      conservation_laws: [],
      assumptions: ['几何光学近似', '单色光'],
      limitations: ['不适用于强非线性', '忽略衍射效应'],
      complexity: 'intermediate',
      domain: {
        spatial: '3d',
        temporal: 'static',
        scale: 'macroscopic'
      }
    };
  }

  private createQuantumModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['h', 'ħ', 'ψ', 'φ', 'e'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'ψ', dimension: 'L^-3/2', role: 'unknown', description: '波函数', defaultValue: 0 },
        { symbol: 'E', dimension: 'ML^2T^-2', role: 'unknown', description: '能量', defaultValue: 0 },
        { symbol: 'ħ', dimension: 'ML^2T^-1', role: 'constant', description: '约化普朗克常数', defaultValue: 1.055e-34 }
      ])
    ];
    
    return {
      id: 'quantum_module',
      type: 'quantum',
      name: '量子力学',
      description: '量子力学基础',
      parameters: moduleParameters,
      equations: [
        {
          id: 'schrodinger_equation',
          type: 'differential',
          expression: 'iħ∂ψ/∂t = Hψ',
          variables: ['ψ', 't'],
          parameters: ['ħ', 'H'],
          description: '薛定谔方程',
          linearity: 'linear',
          order: 1,
          physics_meaning: '量子态的时间演化'
        }
      ],
      dependencies: [],
      output: ['ψ', 'E'],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'E = constant',
          variables: ['E'],
          tolerance: 1e-15,
          description: '能量守恒'
        }
      ],
      assumptions: ['非相对论量子力学', '孤立系统'],
      limitations: ['不适用于相对论情况', '忽略环境相互作用'],
      complexity: 'expert',
      domain: {
        spatial: '3d',
        temporal: 'dynamic',
        scale: 'microscopic'
      }
    };
  }

  /**
   * 转换仿真配置
   */
  private convertSimulation(dslSimulation: any) {
    return {
      duration: this.convertPhysicalQuantity(dslSimulation.duration),
      time_step: this.convertPhysicalQuantity(dslSimulation.time_step),
      solver: dslSimulation.solver || 'verlet',
      precision: dslSimulation.precision || 'medium',
      tolerance: 1e-6,
      max_iterations: 1000,
      events: this.convertEvents(dslSimulation.events || [])
    };
  }

  /**
   * 转换输出配置
   */
  private convertOutput(dslOutput: any) {
    return {
      variables: dslOutput.variables || [],
      export_formats: dslOutput.export_formats || ['csv', 'json'],
      plots: this.convertPlots(dslOutput.plots || []),
      animations: this.convertAnimations(dslOutput.animations || []),
      checkpoints: this.convertCheckpoints(dslOutput.checkpoints || [])
    };
  }

  /**
   * 生成计算优化
   */
  private generateOptimization(system: any, options: IRConversionOptions) {
    const optimization: any = {
      precomputed_values: {},
      cached_derivatives: {},
      parallel_modules: [],
      dependency_graph: {}
    };

    if (options.precompute_constants) {
      // 预计算常量
      system.parameters.forEach((param: IRParameter) => {
        if (param.role === 'constant') {
          optimization.precomputed_values[param.symbol] = param.value.value;
        }
      });
    }

    if (options.include_derivatives) {
      // 缓存导数
      system.modules.forEach((module: IRModule) => {
        module.equations.forEach(eq => {
          if (eq.type === 'differential') {
            optimization.cached_derivatives[eq.id] = eq.expression;
          }
        });
      });
    }

    // 分析依赖关系
    optimization.dependency_graph = this.analyzeDependencies(system.modules);

    return optimization;
  }

  /**
   * 验证 IR
   */
  private validateIR(ir: PhysicsIR) {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 结构验证
    if (!ir.metadata.id) errors.push('缺少元数据 ID');
    if (!ir.system.modules.length) warnings.push('没有定义物理模块');

    // 物理验证
    if (ir.system.parameters.length === 0) warnings.push('没有定义参数');

    // 单位一致性验证
    const unitErrors = this.validateUnits(ir.system.parameters);
    errors.push(...unitErrors);

    return {
      structure_valid: errors.length === 0,
      physics_valid: warnings.length === 0,
      units_consistent: unitErrors.length === 0,
      constraints_satisfied: true,
      warnings,
      errors
    };
  }

  // ===== 工具方法 =====

  private generateId(): string {
    return `ir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建参数
   */
  private createParameter(symbol: string, dimension: string, role: 'given' | 'unknown' | 'constant' | 'derived', description: string, value: number): IRParameter {
    return {
      symbol,
      value: {
        value,
        unit: this.getUnitFromDimension(dimension),
        dimension
      },
      role,
      description,
      dependencies: [],
      constraints: []
    };
  }

  /**
   * 确保参数存在，如果不存在则创建
   */
  private ensureParametersExist(existingParams: IRParameter[], requiredParams: Array<{
    symbol: string;
    dimension: string;
    role: 'given' | 'unknown' | 'constant' | 'derived';
    description: string;
    defaultValue: number;
  }>): IRParameter[] {
    const newParams: IRParameter[] = [];
    
    requiredParams.forEach(reqParam => {
      const exists = existingParams.find(p => p.symbol === reqParam.symbol);
      if (!exists) {
        newParams.push(this.createParameter(
          reqParam.symbol,
          reqParam.dimension,
          reqParam.role,
          reqParam.description,
          reqParam.defaultValue
        ));
      }
    });
    
    return newParams;
  }

  /**
   * 根据量纲获取单位
   */
  private getUnitFromDimension(dimension: string): string {
    const dimensionToUnit: Record<string, string> = {
      'L': 'm',
      'T': 's',
      'M': 'kg',
      'LT^-1': 'm/s',
      'LT^-2': 'm/s²',
      'T^-1': 'rad/s',
      'L^-1': 'rad/m',
      'MLT^-2': 'N',
      'ML^2T^-2': 'J',
      'ML^2T^-3': 'W',
      'MLT^-1': 'kg⋅m/s',  // 动量单位
      '1': '1',            // 无量纲
      'rad': 'rad',        // 弧度
      'Θ': 'K',            // 温度
      'I': 'A',            // 电流
      'IT': 'C',           // 电荷
      'ML^-1T^-2': 'Pa',   // 压强
      'ML^2T^-1': 'J⋅s',   // 角动量
      'MLT^-3I^-1': 'V/m', // 电场强度
      'MT^-2I^-1': 'T',    // 磁感应强度
      'ML^2T^-3I^-2': 'Ω', // 电阻
      'ML^2I^-2T^-3': 'F', // 电容
      'ML^2I^-2T^-2': 'H', // 电感
      'ML^2T^-2Θ^-1': 'J/K', // 热容
      'MLT^-3Θ^-1': 'W/(m⋅K)', // 热导率
      'L^2T^-2Θ^-1': 'J/(kg⋅K)', // 比热容
      'N': 'mol',          // 物质的量
      'N^-1': 'mol^-1',    // 阿伏伽德罗常数
      'ML^2T^-2Θ^-1N^-1': 'J/(mol⋅K)', // 气体常数
      'L^3M^-1T^-2': 'm^3/(kg⋅s^2)', // 万有引力常数
      'I^2T^4M^-1L^-3': 'F/m', // 真空介电常数
      'MLI^-2T^-2': 'H/m'  // 真空磁导率
    };
    return dimensionToUnit[dimension] || 'unknown';
  }

  /**
   * 合并模块参数到系统参数中
   */
  private mergeModuleParameters(baseParameters: IRParameter[], modules: IRModule[]): IRParameter[] {
    const parameterMap = new Map<string, IRParameter>();
    
    // 添加基础参数
    baseParameters.forEach(param => {
      parameterMap.set(param.symbol, param);
    });
    
    // 添加模块参数（如果不存在或更新）
    modules.forEach(module => {
      module.parameters.forEach(moduleParam => {
        const existingParam = parameterMap.get(moduleParam.symbol);
        if (!existingParam) {
          // 如果不存在，添加新参数
          parameterMap.set(moduleParam.symbol, moduleParam);
        } else {
          // 如果存在，更新参数信息（保留基础参数的值，更新其他信息）
          parameterMap.set(moduleParam.symbol, {
            ...existingParam,
            description: moduleParam.description,
            role: moduleParam.role,
            dependencies: moduleParam.dependencies,
            constraints: moduleParam.constraints
          });
        }
      });
    });
    
    return Array.from(parameterMap.values());
  }

  private calculateDimension(unit: string): string {
    // 简化的量纲计算
    const dimensionMap: Record<string, string> = {
      'm': 'L',
      's': 'T',
      'kg': 'M',
      'N': 'MLT^-2',
      'J': 'ML^2T^-2',
      'W': 'ML^2T^-3',
      'Hz': 'T^-1',
      'rad': '1',
      'rad/s': 'T^-1'
    };
    return dimensionMap[unit] || 'unknown';
  }

  private convertVector3(vector: any): IRVector3 {
    if (typeof vector === 'object' && vector.value !== undefined) {
      return { x: vector.value, y: 0, z: 0 };
    }
    return { x: 0, y: 0, z: 0 };
  }

  private convertPhysicalQuantity(quantity: any): IRPhysicalQuantity {
    const unit = quantity.unit || 'unknown';
    return {
      value: quantity.value || 0,
      unit: unit,
      dimension: this.calculateDimension(unit)
    };
  }

  private convertProperties(properties: any): Record<string, IRPhysicalQuantity> {
    const result: Record<string, IRPhysicalQuantity> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = this.convertPhysicalQuantity(value);
      }
    }
    return result;
  }

  private mapConstraintType(type: string): 'equality' | 'inequality' | 'boundary' | 'initial' | 'physical' {
    const typeMap: Record<string, any> = {
      'custom': 'equality',
      'boundary': 'boundary',
      'gravity': 'physical',
      'initial': 'initial'
    };
    return typeMap[type] || 'equality';
  }

  private findParameterDependencies(param: DSLParameter, allParams: DSLParameter[]): string[] {
    // 简化的依赖关系分析
    return [];
  }

  private convertEnvironment(env: any) {
    return {
      gravity: this.convertPhysicalQuantity(env.gravity || { value: 9.8, unit: 'm/s²' }),
      air_resistance: env.air_resistance || false,
      temperature: this.convertPhysicalQuantity(env.temperature || { value: 20, unit: '°C' })
    };
  }

  private convertEvents(events: any[]) {
    return events.map(event => ({
      id: event.id || this.generateId(),
      type: event.type || 'time',
      trigger: {
        condition: event.trigger?.condition || 'time_reached',
        value: this.convertPhysicalQuantity(event.trigger?.value || { value: 5, unit: 's' })
      },
      action: event.action || 'checkpoint',
      description: event.description || 'Simulation checkpoint'
    }));
  }

  private convertPlots(plots: any[]) {
    return plots.map(plot => ({
      id: plot.id || this.generateId(),
      type: plot.type || 'time_series',
      title: plot.title || '',
      x_axis: plot.x_axis || 't',
      y_axis: plot.y_axis || 'x',
      variables: [plot.x_axis, plot.y_axis].filter(Boolean),
      style: {}
    }));
  }

  private convertAnimations(animations: any[]) {
    return animations.map(anim => ({
      id: anim.id || this.generateId(),
      type: anim.type || '2d',
      camera: anim.camera || 'fixed',
      speed: anim.speed || 1.0,
      loop: anim.loop !== undefined ? anim.loop : true,
      duration: anim.duration || 10.0,
      easing: anim.easing || 'ease_in_out',
      objects: [],
      style: {}
    }));
  }

  private convertCheckpoints(checkpoints: any[]) {
    return checkpoints.map(cp => ({
      id: cp.id || this.generateId(),
      time: this.convertPhysicalQuantity(cp.time || { value: 5, unit: 's' }),
      variables: cp.variables || [],
      description: cp.description || ''
    }));
  }

  private analyzeDependencies(modules: IRModule[]): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    modules.forEach(module => {
      graph[module.id] = module.dependencies;
    });
    return graph;
  }

  private validateUnits(parameters: IRParameter[]): string[] {
    const errors: string[] = [];
    // 简化的单位验证
    return errors;
  }

  private getAppliedOptimizations(options: IRConversionOptions): string[] {
    const optimizations: string[] = [];
    if (options.optimize_for_simulation) optimizations.push('simulation_optimization');
    if (options.include_derivatives) optimizations.push('derivative_caching');
    if (options.precompute_constants) optimizations.push('constant_precomputation');
    return optimizations;
  }

  // ===== 新增辅助方法 =====

  private inferPhysicsDomains(dslMetadata: any): string[] {
    const domains: string[] = [];
    const systemType = dslMetadata.system_type?.toLowerCase() || '';
    const topic = dslMetadata.topic?.toLowerCase() || '';
    
    if (systemType.includes('oscillation') || topic.includes('振动') || topic.includes('振荡')) {
      domains.push('mechanics');
    }
    if (systemType.includes('wave') || topic.includes('波') || topic.includes('波动')) {
      domains.push('waves');
    }
    if (systemType.includes('electromagnetic') || topic.includes('电磁') || topic.includes('电场') || topic.includes('磁场')) {
      domains.push('electromagnetism');
    }
    if (systemType.includes('thermal') || topic.includes('热') || topic.includes('温度')) {
      domains.push('thermodynamics');
    }
    if (systemType.includes('optical') || topic.includes('光') || topic.includes('光学')) {
      domains.push('optics');
    }
    if (systemType.includes('quantum') || topic.includes('量子')) {
      domains.push('quantum_mechanics');
    }
    
    return domains.length > 0 ? domains : ['general_physics'];
  }

  private calculateComplexityScore(dslMetadata: any): number {
    let score = 50; // 基础分数
    
    const difficulty = dslMetadata.difficulty?.toLowerCase() || 'medium';
    switch (difficulty) {
      case 'easy': score += 10; break;
      case 'medium': score += 20; break;
      case 'hard': score += 30; break;
      case 'expert': score += 40; break;
    }
    
    const systemType = dslMetadata.system_type?.toLowerCase() || '';
    if (systemType.includes('quantum')) score += 30;
    if (systemType.includes('relativistic')) score += 25;
    if (systemType.includes('electromagnetic')) score += 15;
    if (systemType.includes('wave')) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }

  private estimateSolveTime(dslMetadata: any): number {
    const complexity = this.calculateComplexityScore(dslMetadata);
    const systemType = dslMetadata.system_type?.toLowerCase() || '';
    
    let baseTime = 1; // 基础时间（秒）
    
    if (systemType.includes('quantum')) baseTime *= 10;
    if (systemType.includes('relativistic')) baseTime *= 8;
    if (systemType.includes('electromagnetic')) baseTime *= 5;
    if (systemType.includes('wave')) baseTime *= 3;
    
    return baseTime * (complexity / 50);
  }

  private extractConservationLaws(modules: IRModule[]): IRConservationLaw[] {
    const laws: IRConservationLaw[] = [];
    
    modules.forEach(module => {
      laws.push(...module.conservation_laws);
    });
    
    return laws;
  }

  private identifySymmetries(dslSystem: any): string[] {
    const symmetries: string[] = [];
    const systemType = dslSystem.type?.toLowerCase() || '';
    
    if (systemType.includes('oscillation')) {
      symmetries.push('time_translation');
      symmetries.push('spatial_reflection');
    }
    if (systemType.includes('wave')) {
      symmetries.push('space_translation');
      symmetries.push('time_translation');
    }
    if (systemType.includes('electromagnetic')) {
      symmetries.push('gauge_symmetry');
    }
    
    return symmetries;
  }

  private extractBoundaryConditions(dslSystem: any): IRConstraint[] {
    const conditions: IRConstraint[] = [];
    
    // 从系统约束中提取边界条件
    if (dslSystem.constraints) {
      dslSystem.constraints.forEach((constraint: any) => {
        if (constraint.type === 'boundary') {
          conditions.push({
            type: 'boundary',
            expression: constraint.expression || '',
            parameters: constraint.parameters || [],
            description: constraint.description || '',
            priority: 'critical',
            tolerance: 1e-6,
            domain: constraint.domain || {},
            physics_law: constraint.physics_law || ''
          });
        }
      });
    }
    
    return conditions;
  }

  private extractInitialConditions(dslSystem: any): IRConstraint[] {
    const conditions: IRConstraint[] = [];
    
    // 从系统约束中提取初始条件
    if (dslSystem.constraints) {
      dslSystem.constraints.forEach((constraint: any) => {
        if (constraint.type === 'initial') {
          conditions.push({
            type: 'initial',
            expression: constraint.expression || '',
            parameters: constraint.parameters || [],
            description: constraint.description || '',
            priority: 'critical',
            tolerance: 1e-6,
            domain: constraint.domain || {},
            physics_law: constraint.physics_law || ''
          });
        }
      });
    }
    
    return conditions;
  }

  private assessComplexity(ir: PhysicsIR): string {
    const score = ir.metadata.complexity_score;
    const moduleCount = ir.system.modules.length;
    const equationCount = ir.system.modules.reduce((sum, m) => sum + m.equations.length, 0);
    
    if (score >= 80) return '极高复杂度';
    if (score >= 60) return '高复杂度';
    if (score >= 40) return '中等复杂度';
    if (score >= 20) return '低复杂度';
    return '极低复杂度';
  }

  private identifyDominantPhysics(ir: any): string[] {
    const dominant: string[] = [];
    
    ir.system.modules.forEach(module => {
      switch (module.type) {
        case 'oscillation':
          dominant.push('简谐振动');
          break;
        case 'wave':
          dominant.push('波动现象');
          break;
        case 'dynamics':
          dominant.push('牛顿力学');
          break;
        case 'electromagnetic':
          dominant.push('电磁学');
          break;
        case 'thermal':
          dominant.push('热力学');
          break;
        case 'optical':
          dominant.push('光学');
          break;
        case 'quantum':
          dominant.push('量子力学');
          break;
        default:
          dominant.push('经典物理');
      }
    });
    
    return dominant.length > 0 ? dominant : ['经典物理'];
  }

  private evaluateApproximationQuality(ir: PhysicsIR): number {
    let quality = 100;
    
    ir.system.modules.forEach(module => {
      // 根据模块的假设和限制评估近似质量
      if (module.assumptions.includes('小振幅近似')) quality -= 5;
      if (module.assumptions.includes('线性近似')) quality -= 10;
      if (module.assumptions.includes('准静态近似')) quality -= 8;
      if (module.limitations.includes('不适用于相对论情况')) quality -= 15;
      if (module.limitations.includes('忽略量子效应')) quality -= 20;
    });
    
    return Math.max(0, Math.min(100, quality));
  }

  private determineApproximationLevel(ir: any): 'exact' | 'first_order' | 'second_order' | 'phenomenological' {
    const modules = ir.system.modules;
    
    if (modules.some(m => m.type === 'quantum')) return 'exact';
    if (modules.some(m => m.assumptions.includes('小振幅近似'))) return 'first_order';
    if (modules.some(m => m.assumptions.includes('线性近似'))) return 'second_order';
    return 'phenomenological';
  }

  private generatePhysicalInterpretation(ir: any): string {
    const dominant = this.identifyDominantPhysics(ir);
    const systemType = ir.metadata.system_type;
    
    if (dominant.includes('简谐振动')) {
      return '这是一个简谐振动系统，物体在恢复力作用下做周期性运动，能量在动能和势能之间转换。';
    }
    if (dominant.includes('波动现象')) {
      return '这是一个波动系统，能量通过介质传播，具有频率、波长和波速等特征。';
    }
    if (dominant.includes('牛顿力学')) {
      return '这是一个经典力学系统，遵循牛顿运动定律，涉及力、质量和加速度的关系。';
    }
    if (dominant.includes('电磁学')) {
      return '这是一个电磁系统，涉及电场、磁场和电荷的相互作用。';
    }
    
    return `这是一个${systemType}物理系统，涉及多个物理现象的相互作用。`;
  }

  private extractConcepts(ir: any): string[] {
    const concepts: string[] = [];
    
    ir.system.modules.forEach(module => {
      switch (module.type) {
        case 'oscillation':
          concepts.push('简谐振动', '周期', '频率', '振幅', '相位');
          break;
        case 'wave':
          concepts.push('波动', '波长', '波速', '干涉', '衍射');
          break;
        case 'dynamics':
          concepts.push('牛顿定律', '动量', '能量', '力', '加速度');
          break;
        case 'electromagnetic':
          concepts.push('电场', '磁场', '电荷', '电流', '电磁感应');
          break;
        case 'thermal':
          concepts.push('温度', '热量', '熵', '热力学定律');
          break;
        case 'optical':
          concepts.push('折射', '反射', '干涉', '衍射', '偏振');
          break;
        case 'quantum':
          concepts.push('波函数', '量子化', '不确定性原理', '薛定谔方程');
          break;
        case 'acoustics':
          concepts.push('声波', '频率', '波长', '声速', '音调', '响度');
          break;
        case 'phase_change':
          concepts.push('物态变化', '热量', '比热容', '潜热', '熔化', '汽化');
          break;
        case 'simple_machines':
          concepts.push('杠杆', '滑轮', '机械效率', '功', '力', '距离');
          break;
        case 'pressure':
          concepts.push('压强', '浮力', '阿基米德原理', '液体压强', '密度');
          break;
        case 'basic_electricity':
          concepts.push('电流', '电压', '电阻', '欧姆定律', '电功率', '电路');
          break;
      }
    });
    
    return [...new Set(concepts)]; // 去重
  }

  private identifyPrerequisites(ir: any): string[] {
    const prerequisites: string[] = [];
    const complexity = ir.metadata.complexity_score;
    
    prerequisites.push('基础数学', '微积分');
    
    if (complexity >= 60) {
      prerequisites.push('线性代数', '微分方程');
    }
    
    if (ir.system.modules.some(m => m.type === 'electromagnetic')) {
      prerequisites.push('向量分析', '电磁学基础');
    }
    
    if (ir.system.modules.some(m => m.type === 'quantum')) {
      prerequisites.push('量子力学基础', '复分析');
    }
    
    if (ir.system.modules.some(m => m.type === 'thermal')) {
      prerequisites.push('热力学基础', '统计力学');
    }
    
    return prerequisites;
  }

  // ===== 初中物理模块创建方法 =====

  private createAcousticsModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['f', 'λ', 'v', 'a', 't'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'f', dimension: 'T^-1', role: 'unknown', description: '频率', defaultValue: 440 },
        { symbol: 'λ', dimension: 'L', role: 'unknown', description: '波长', defaultValue: 0.78 },
        { symbol: 'v', dimension: 'LT^-1', role: 'given', description: '声速', defaultValue: 340 },
        { symbol: 'A', dimension: 'L', role: 'given', description: '振幅', defaultValue: 0.01 },
        { symbol: 't', dimension: 'T', role: 'unknown', description: '时间', defaultValue: 0 }
      ])
    ];
    
    return {
      id: 'acoustics_module',
      type: 'wave',
      name: '声学',
      description: '声音的产生、传播和特性',
      parameters: moduleParameters,
      dependencies: [],
      output: ['f', 'λ', 'v', 'A', 't'],
      equations: [
        {
          id: 'sound_velocity',
          type: 'algebraic',
          expression: 'v = f * λ',
          variables: ['v', 'f', 'λ'],
          parameters: [],
          description: '声速公式',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '声波传播速度与频率和波长的关系',
          derivation: '基于波动方程'
        },
        {
          id: 'sound_intensity',
          type: 'algebraic',
          expression: 'I = 0.5 * ρ * v * A² * ω²',
          variables: ['I', 'ρ', 'v', 'A', 'ω'],
          parameters: [],
          description: '声强公式',
          order: 2,
          linearity: 'nonlinear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '声波强度与介质密度、声速、振幅和角频率的关系',
          derivation: '基于能量密度和功率'
        }
      ],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'E_total = E_kinetic + E_potential',
          variables: ['E_total', 'E_kinetic', 'E_potential'],
          tolerance: 1e-6,
          description: '声波能量守恒'
        }
      ],
      assumptions: ['小振幅近似', '线性介质', '无耗散'],
      limitations: ['忽略非线性效应', '忽略介质色散'],
      complexity: 'intermediate',
      domain: {
        spatial: '3d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建物态变化模块
   */
  private createPhaseChangeModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['q', 'm', 'c', 'l', 't', 't'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'Q', dimension: 'ML^2T^-2', role: 'unknown', description: '热量', defaultValue: 0 },
        { symbol: 'm', dimension: 'M', role: 'given', description: '质量', defaultValue: 1 },
        { symbol: 'c', dimension: 'L^2T^-2Θ^-1', role: 'given', description: '比热容', defaultValue: 4200 },
        { symbol: 'L', dimension: 'L^2T^-2', role: 'given', description: '潜热', defaultValue: 2.26e6 },
        { symbol: 'ΔT', dimension: 'Θ', role: 'unknown', description: '温度变化', defaultValue: 0 },
        { symbol: 'T', dimension: 'Θ', role: 'given', description: '温度', defaultValue: 20 }
      ])
    ];
    
    return {
      id: 'phase_change_module',
      type: 'thermal',
      name: '物态变化',
      description: '物质的熔化、凝固、汽化、液化等相变过程',
      parameters: moduleParameters,
      dependencies: [],
      output: ['Q', 'm', 'c', 'L', 'ΔT', 'T'],
      equations: [
        {
          id: 'heat_transfer',
          type: 'algebraic',
          expression: 'Q = m * c * ΔT',
          variables: ['Q', 'm', 'c', 'ΔT'],
          parameters: [],
          description: '热量传递公式',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '热量传递与质量、比热容和温度变化的关系',
          derivation: '基于热力学第一定律'
        },
        {
          id: 'phase_change_heat',
          type: 'algebraic',
          expression: 'Q = m * L',
          variables: ['Q', 'm', 'L'],
          parameters: [],
          description: '相变热量公式',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '相变过程中吸收或释放的热量',
          derivation: '基于潜热定义'
        }
      ],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'Q_in = Q_out + ΔU',
          variables: ['Q_in', 'Q_out', 'ΔU'],
          tolerance: 1e-6,
          description: '能量守恒'
        }
      ],
      assumptions: ['等压过程', '忽略体积变化', '理想相变'],
      limitations: ['忽略过冷过热现象', '忽略相变动力学'],
      complexity: 'intermediate',
      domain: {
        spatial: '1d',
        temporal: 'dynamic',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建简单机械模块
   */
  private createSimpleMachinesModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['f', 'd', 'w', 'e'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'F', dimension: 'MLT^-2', role: 'unknown', description: '力', defaultValue: 0 },
        { symbol: 'd', dimension: 'L', role: 'given', description: '距离', defaultValue: 1 },
        { symbol: 'W', dimension: 'ML^2T^-2', role: 'unknown', description: '功', defaultValue: 0 },
        { symbol: 'η', dimension: '1', role: 'unknown', description: '机械效率', defaultValue: 1 },
        { symbol: 'F_in', dimension: 'MLT^-2', role: 'given', description: '输入力', defaultValue: 10 },
        { symbol: 'F_out', dimension: 'MLT^-2', role: 'unknown', description: '输出力', defaultValue: 0 }
      ])
    ];
    
    return {
      id: 'simple_machines_module',
      type: 'dynamics',
      name: '简单机械',
      description: '杠杆、滑轮、斜面等简单机械的工作原理',
      parameters: moduleParameters,
      dependencies: [],
      output: ['F', 'd', 'W', 'η', 'F_in', 'F_out'],
      equations: [
        {
          id: 'work_definition',
          type: 'algebraic',
          expression: 'W = F * d',
          variables: ['W', 'F', 'd'],
          parameters: [],
          description: '功的定义',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '力对物体做功与力和位移的关系',
          derivation: '基于功的定义'
        },
        {
          id: 'mechanical_advantage',
          type: 'algebraic',
          expression: 'MA = F_out / F_in',
          variables: ['MA', 'F_out', 'F_in'],
          parameters: [],
          description: '机械利益',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '简单机械的力放大倍数',
          derivation: '基于杠杆原理'
        }
      ],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'W_input = W_output + W_loss',
          variables: ['W_input', 'W_output', 'W_loss'],
          tolerance: 1e-6,
          description: '能量守恒'
        }
      ],
      assumptions: ['无摩擦', '刚体', '准静态过程'],
      limitations: ['忽略摩擦损失', '忽略机械变形'],
      complexity: 'basic',
      domain: {
        spatial: '2d',
        temporal: 'static',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建压强模块
   */
  private createPressureModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['p', 'f', 'a', 'ρ', 'g', 'h'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'p', dimension: 'ML^-1T^-2', role: 'unknown', description: '压强', defaultValue: 0 },
        { symbol: 'F', dimension: 'MLT^-2', role: 'given', description: '压力', defaultValue: 100 },
        { symbol: 'A', dimension: 'L^2', role: 'given', description: '面积', defaultValue: 0.01 },
        { symbol: 'ρ', dimension: 'ML^-3', role: 'given', description: '密度', defaultValue: 1000 },
        { symbol: 'g', dimension: 'LT^-2', role: 'constant', description: '重力加速度', defaultValue: 9.8 },
        { symbol: 'h', dimension: 'L', role: 'given', description: '深度', defaultValue: 1 },
        { symbol: 'F_b', dimension: 'MLT^-2', role: 'unknown', description: '浮力', defaultValue: 0 }
      ])
    ];
    
    return {
      id: 'pressure_module',
      type: 'fluid',
      name: '压强',
      description: '液体压强、大气压强和浮力',
      parameters: moduleParameters,
      dependencies: [],
      output: ['p', 'F', 'A', 'ρ', 'g', 'h', 'F_b'],
      equations: [
        {
          id: 'pressure_definition',
          type: 'algebraic',
          expression: 'p = F / A',
          variables: ['p', 'F', 'A'],
          parameters: [],
          description: '压强定义',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '压强与压力和受力面积的关系',
          derivation: '基于压强定义'
        },
        {
          id: 'hydrostatic_pressure',
          type: 'algebraic',
          expression: 'p = ρ * g * h',
          variables: ['p', 'ρ', 'g', 'h'],
          parameters: [],
          description: '液体压强公式',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '液体内部压强与深度、密度和重力的关系',
          derivation: '基于帕斯卡原理'
        },
        {
          id: 'buoyancy_force',
          type: 'algebraic',
          expression: 'F_b = ρ * g * V',
          variables: ['F_b', 'ρ', 'g', 'V'],
          parameters: [],
          description: '阿基米德浮力公式',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '浮力与液体密度、重力和排开液体体积的关系',
          derivation: '基于阿基米德原理'
        }
      ],
      conservation_laws: [
        {
          type: 'energy',
          expression: 'p₁ + 0.5 * ρ * v₁² + ρ * g * h₁ = p₂ + 0.5 * ρ * v₂² + ρ * g * h₂',
          variables: ['p₁', 'p₂', 'v₁', 'v₂', 'h₁', 'h₂'],
          tolerance: 1e-6,
          description: '伯努利方程'
        }
      ],
      assumptions: ['不可压缩流体', '无粘性', '稳态流动'],
      limitations: ['忽略表面张力', '忽略温度变化'],
      complexity: 'intermediate',
      domain: {
        spatial: '3d',
        temporal: 'static',
        scale: 'macroscopic'
      }
    };
  }

  /**
   * 创建电学基础模块
   */
  private createBasicElectricityModule(parameters: IRParameter[]): IRModule {
    const existingParams = parameters.filter(p => ['i', 'u', 'r', 'p', 'q', 't'].includes(p.symbol.toLowerCase()));
    
    const moduleParameters: IRParameter[] = [
      ...existingParams,
      ...this.ensureParametersExist(existingParams, [
        { symbol: 'I', dimension: 'I', role: 'unknown', description: '电流', defaultValue: 0 },
        { symbol: 'U', dimension: 'ML^2T^-3I^-1', role: 'given', description: '电压', defaultValue: 12 },
        { symbol: 'R', dimension: 'ML^2T^-3I^-2', role: 'given', description: '电阻', defaultValue: 10 },
        { symbol: 'P', dimension: 'ML^2T^-3', role: 'unknown', description: '电功率', defaultValue: 0 },
        { symbol: 'Q', dimension: 'IT', role: 'unknown', description: '电荷量', defaultValue: 0 },
        { symbol: 't', dimension: 'T', role: 'given', description: '时间', defaultValue: 1 }
      ])
    ];
    
    return {
      id: 'basic_electricity_module',
      type: 'electromagnetic',
      name: '电学基础',
      description: '电流、电压、电阻和欧姆定律',
      parameters: moduleParameters,
      dependencies: [],
      output: ['I', 'U', 'R', 'P', 'Q', 't'],
      equations: [
        {
          id: 'ohms_law',
          type: 'algebraic',
          expression: 'U = I * R',
          variables: ['U', 'I', 'R'],
          parameters: [],
          description: '欧姆定律',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '电压与电流和电阻的关系',
          derivation: '基于欧姆定律'
        },
        {
          id: 'electrical_power',
          type: 'algebraic',
          expression: 'P = U * I',
          variables: ['P', 'U', 'I'],
          parameters: [],
          description: '电功率公式',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '电功率与电压和电流的关系',
          derivation: '基于功率定义'
        },
        {
          id: 'charge_current',
          type: 'algebraic',
          expression: 'I = Q / t',
          variables: ['I', 'Q', 't'],
          parameters: [],
          description: '电流定义',
          order: 1,
          linearity: 'linear',
          stability: 'stable',
          boundary_conditions: [],
          initial_conditions: [],
          physics_meaning: '电流与电荷量和时间的关系',
          derivation: '基于电流定义'
        }
      ],
      conservation_laws: [
        {
          type: 'charge',
          expression: 'ΣI_in = ΣI_out',
          variables: ['I_in', 'I_out'],
          tolerance: 1e-6,
          description: '基尔霍夫电流定律'
        }
      ],
      assumptions: ['线性电阻', '稳态电流', '无电磁感应'],
      limitations: ['忽略温度效应', '忽略频率效应'],
      complexity: 'basic',
      domain: {
        spatial: '1d',
        temporal: 'static',
        scale: 'macroscopic'
      }
    };
  }
}
