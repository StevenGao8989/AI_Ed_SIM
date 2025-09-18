// services/dsl/PhysicsDslGenerator.ts
// DSL 生成器：将 PhysicsAIParserAICaller 输出转换为 PhysicsDSL (YAML 格式)

import type { 
  ParsedQuestion, 
  Parameter,
  SolutionStep,
  ModuleDependency,
  Formula,
  Constraint as ParserConstraint,
  Target,
  SolutionPath
} from '../ai_parsing/PhysicsAIParserAICaller';
import type { UnitMapping } from '../ai_parsing/PhysicsAIParser';
import type {
  PhysicsDSL,
  DSLMetadata,
  PhysicsSystem,
  PhysicsObject,
  DSLParameter,
  InitialCondition,
  Constraint,
  Constant,
  SimulationConfig,
  SimulationEvent,
  OutputConfig,
  PlotConfig,
  AnimationConfig
} from '../../frontend/types/dsl';
import type {
  PhysicalQuantity,
  ExtendedPhysicsSystemType,
  ParameterRole,
  SyllabusTag,
  COMMON_MATERIALS,
  PHYSICAL_CONSTANTS
} from '../../frontend/types/PhysicsTypes';

/**
 * 物理 DSL 生成器
 * 将 AI 解析的题目转换为结构化的物理 DSL
 */
export class PhysicsDslGenerator {
  private readonly VERSION = '1.0.0';
  private readonly DEFAULT_TIME_STEP = 0.01;
  private readonly DEFAULT_DURATION = 5.0;

  /**
   * 生成完整的 PhysicsDSL
   */
  generateDSL(parsedQuestion: ParsedQuestion): PhysicsDSL {
    const topicId = this.mapTopicToId(parsedQuestion.topic);
    const systemType = this.mapTopicToSystemType(topicId);

    const baseDSL = {
      metadata: this.generateMetadata(parsedQuestion, topicId),
      system: this.generateSystem(parsedQuestion, systemType),
      simulation: this.generateSimulation(systemType, parsedQuestion),
      output: this.generateOutput(systemType, parsedQuestion),
      syllabus: this.generateSyllabus(parsedQuestion.topic)
    };

    // 添加DSL增强字段（作为扩展）
    const enhancedDSL = {
      ...baseDSL,
      // 新增DSL增强字段
      solution_path: this.generateSolutionPath(parsedQuestion),
      target: this.generateTarget(parsedQuestion),
      formulas: this.generateFormulas(parsedQuestion),
      constraints: this.generateConstraints(parsedQuestion),
      dsl_metadata: this.generateDSLMetadata(parsedQuestion)
    };

    return enhancedDSL as any;
  }

  /**
   * 生成 YAML 格式的 DSL
   */
  generateYAML(parsedQuestion: ParsedQuestion): string {
    const dsl = this.generateDSL(parsedQuestion);
    return this.convertToYAML(dsl);
  }

  /**
   * 生成元数据
   */
  private generateMetadata(parsedQuestion: ParsedQuestion, topicId: string): DSLMetadata {
    return {
      subject: parsedQuestion.subject,
      topic: parsedQuestion.topic,
      topic_id: topicId,
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      source_question: parsedQuestion.question,
      grade: this.detectGrade(parsedQuestion.topic),
      difficulty: this.assessDifficulty(parsedQuestion)
    };
  }

  /**
   * 生成物理系统配置
   */
  private generateSystem(parsedQuestion: ParsedQuestion, systemType: ExtendedPhysicsSystemType): PhysicsSystem {
    return {
      type: systemType,
      parameters: this.convertParameters(parsedQuestion.parameters),
      initial_conditions: this.generateInitialConditions(systemType, parsedQuestion.parameters),
      constraints: this.generateSystemConstraints(systemType),
      constants: this.generateConstants(systemType, parsedQuestion.parameters),
      objects: this.generatePhysicsObjects(systemType, parsedQuestion.parameters),
      materials: this.detectMaterials(parsedQuestion.question)
    };
  }

  /**
   * 生成仿真配置
   */
  private generateSimulation(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): SimulationConfig {
    const duration = this.calculateDuration(systemType, parsedQuestion);
    const timeStep = this.calculateTimeStep(systemType, parsedQuestion);
    
    return {
      duration: { value: duration, unit: 's' },
      time_step: { value: timeStep, unit: 's' },
      events: this.generateEvents(systemType, parsedQuestion),
      solver: this.selectSolver(systemType, parsedQuestion),
      precision: this.selectPrecision(parsedQuestion),
      max_iterations: this.calculateMaxIterations(parsedQuestion),
      tolerance: this.calculateTolerance(parsedQuestion)
    };
  }

  /**
   * 生成输出配置
   */
  private generateOutput(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): OutputConfig {
    return {
      variables: this.getOutputVariables(systemType, parsedQuestion),
      plots: this.generatePlots(systemType, parsedQuestion),
      animations: this.generateAnimations(systemType, parsedQuestion),
      export_formats: ['json', 'yaml', 'csv'],
      resolution: this.selectResolution(parsedQuestion),
      frame_rate: this.selectFrameRate(parsedQuestion)
    };
  }

  /**
   * 转换参数格式
   */
  private convertParameters(parameters: Parameter[]): DSLParameter[] {
    return parameters.map(param => ({
      symbol: param.symbol,
      value: {
        value: param.value || 0,
        unit: param.unit || '1',
        description: param.note || ''
      },
      role: param.role || 'unknown',
      description: param.note || `参数 ${param.symbol}`,
      standard_value: param.value ? {
        value: param.value,
        unit: param.unit || '1',
        description: '标准化值'
      } : null,
      constraints: this.generateParameterConstraints(param),
      uncertainty: 0.01, // 默认不确定性
      // 新增DSL相关字段
      dsl_type: param.dslType || 'scalar',
      domain: param.domain || 'kinematics',
      priority: param.priority || 1,
      dependencies: param.dependencies || [],
      formula: param.formula || ''
    }));
  }

  /**
   * 生成参数约束
   */
  private generateParameterConstraints(param: Parameter): Array<{min: number; max: number; unit: string; inclusive: boolean}> {
    const constraints: Array<{min: number; max: number; unit: string; inclusive: boolean}> = [];
    
    // 根据参数类型生成约束
    if (param.symbol === 'g' && param.unit === 'm/s²') {
      constraints.push({
        min: 9.0,
        max: 10.0,
        unit: 'm/s²',
        inclusive: true
      });
    }
    
    return constraints;
  }

  /**
   * 生成初始条件
   */
  private generateInitialConditions(systemType: ExtendedPhysicsSystemType, parameters: Parameter[]): InitialCondition[] {
    const conditions: InitialCondition[] = [];

    switch (systemType) {
      case 'projectile':
        conditions.push(
          {
            name: 'x0',
            value: { value: 0, unit: 'm', description: '初始水平位置' },
            description: '初始水平位置',
            time: 0
          },
          {
            name: 'y0',
            value: { value: 0, unit: 'm', description: '初始垂直位置' },
            description: '初始垂直位置',
            time: 0
          }
        );
        break;
      case 'oscillation':
        conditions.push(
          {
            name: 'x0',
            value: { value: 0.1, unit: 'm', description: '初始位移' },
            description: '初始位移',
            time: 0
          }
        );
        break;
    }

    return conditions;
  }

  /**
   * 生成系统约束条件
   */
  private generateSystemConstraints(systemType: ExtendedPhysicsSystemType): Constraint[] {
    const constraints: Constraint[] = [];

    // 重力约束（适用于大多数力学系统）
    if (['projectile', 'free_fall', 'oscillation'].includes(systemType)) {
      constraints.push({
        type: 'gravity',
        value: { value: 9.81, unit: 'm/s²', description: '重力加速度' },
        description: '重力约束',
        expression: 'g = 9.81 m/s²'
      });
    }

    // 摩擦约束
    if (['newton_dynamics', 'simple_machines'].includes(systemType)) {
      constraints.push({
        type: 'friction',
        value: { value: 0.3, unit: '1', description: '摩擦系数' },
        description: '摩擦约束',
        expression: 'μ = 0.3'
      });
    }

    return constraints;
  }

  /**
   * 生成常量
   */
  private generateConstants(systemType: ExtendedPhysicsSystemType, parameters: Parameter[]): Constant[] {
    const constants: Constant[] = [];

    // 添加物理常量
    constants.push({
      name: 'π',
      value: { value: Math.PI, unit: 'rad', description: '圆周率' },
      description: '圆周率',
      source: 'standard',
      category: 'mechanical'
    });

    // 根据系统类型添加特定常量
    switch (systemType) {
      case 'electrostatics':
        constants.push({
          name: 'k',
          value: { value: 8.99e9, unit: 'N·m²/C²', description: '库仑常量' },
          description: '库仑常量',
          source: 'standard',
          category: 'electrical'
        });
        break;
      case 'gravitation':
        constants.push({
          name: 'G',
          value: { value: 6.67e-11, unit: 'N·m²/kg²', description: '万有引力常量' },
          description: '万有引力常量',
          source: 'standard',
          category: 'mechanical'
        });
        break;
    }

    return constants;
  }

  /**
   * 生成物理对象
   */
  private generatePhysicsObjects(systemType: ExtendedPhysicsSystemType, parameters: Parameter[]): PhysicsObject[] {
    const objects: PhysicsObject[] = [];

    switch (systemType) {
      case 'projectile':
        objects.push({
          id: 'projectile',
          name: '抛射体',
          type: 'particle',
          mass: { value: 1, unit: 'kg', description: '抛射体质量' },
          position: { value: 0, unit: 'm', description: '初始位置' },
          velocity: { value: 20, unit: 'm/s', description: '初始速度' },
          acceleration: { value: 0, unit: 'm/s²', description: '初始加速度' },
          properties: { shape: 'sphere', radius: 0.1 }
        });
        break;
    }

    return objects;
  }

  /**
   * 检测材料
   */
  private detectMaterials(question: string): string[] {
    const materials: string[] = [];
    
    if (question.includes('钢') || question.includes('steel')) materials.push('steel');
    if (question.includes('铝') || question.includes('aluminum')) materials.push('aluminum');
    if (question.includes('水') || question.includes('water')) materials.push('water');
    if (question.includes('空气') || question.includes('air')) materials.push('air');
    
    return materials;
  }

  /**
   * 生成学段标签
   */
  private generateSyllabus(topic: string): SyllabusTag[] {
    // 根据主题判断学段
    const juniorTopics = ['mechanics_basics', 'pressure_buoyancy_junior', 'simple_machines_junior'];
    const seniorTopics = ['kinematics', 'dynamics', 'electrostatics_senior'];
    
    if (juniorTopics.some(t => topic.includes(t))) {
      return [{ grade: '初三', topic: 'mechanics_basics', note: '初中物理' }];
    } else if (seniorTopics.some(t => topic.includes(t))) {
      return [{ grade: '高一', topic: 'kinematics', note: '高中物理' }];
    }
    
    return [];
  }

  /**
   * 检测学段
   */
  private detectGrade(topic: string): string {
    if (topic.includes('初中') || topic.includes('junior')) return '初三';
    if (topic.includes('高中') || topic.includes('senior')) return '高一';
    return '高一'; // 默认
  }

  /**
   * 评估难度
   */
  private assessDifficulty(parsedQuestion: ParsedQuestion): 'easy' | 'medium' | 'hard' {
    const complexity = this.assessComplexity(parsedQuestion);
    return complexity === 'simple' ? 'easy' : complexity === 'complex' ? 'hard' : 'medium';
  }

  /**
   * 映射主题到 ID
   */
  private mapTopicToId(topic: string): string {
    const topicMap: Record<string, string> = {
      '抛体运动': 'projectile',
      '自由落体': 'free_fall',
      '匀变速直线运动': 'kinematics_linear',
      '圆周运动': 'circular_motion',
      '简谐振动': 'oscillation',
      '牛顿动力学': 'newton_dynamics',
      '功、能、功率': 'energy_work_power',
      '压强与浮力': 'pressure_buoyancy',
      '简单机械': 'simple_machines',
      '热学': 'thermal',
      '波与声音': 'waves_sound',
      '几何光学': 'geometric_optics',
      '万有引力': 'gravitation',
      '静电场': 'electrostatics',
      '直流电路': 'dc_circuits',
      '磁场': 'magnetism',
      '电磁感应': 'em_induction',
      '交流电': 'ac',
      '近代物理': 'modern_intro'
    };

    for (const [key, value] of Object.entries(topicMap)) {
      if (topic.includes(key)) return value;
    }

    return 'projectile'; // 默认
  }

  /**
   * 映射主题到系统类型
   */
  private mapTopicToSystemType(topicId: string): ExtendedPhysicsSystemType {
    const systemMap: Record<string, ExtendedPhysicsSystemType> = {
      'projectile': 'projectile',
      'free_fall': 'free_fall',
      'kinematics_linear': 'kinematics_linear',
      'circular_motion': 'circular_motion',
      'oscillation': 'oscillation',
      'newton_dynamics': 'newton_dynamics',
      'energy_work_power': 'energy_work_power',
      'pressure_buoyancy': 'pressure_buoyancy',
      'simple_machines': 'simple_machines',
      'thermal': 'thermal',
      'waves_sound': 'waves_sound',
      'geometric_optics': 'geometric_optics',
      'gravitation': 'gravitation',
      'electrostatics': 'electrostatics',
      'dc_circuits': 'dc_circuits',
      'magnetism': 'magnetism',
      'em_induction': 'em_induction',
      'ac': 'ac',
      'modern_intro': 'modern_intro'
    };

    return systemMap[topicId] || 'projectile';
  }

  /**
   * 计算仿真持续时间
   */
  private calculateDuration(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): number {
    // 基于DSL元数据调整持续时间
    const baseDuration = this.getBaseDuration(systemType);
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    
    const multiplier = complexity === 'simple' ? 0.8 : complexity === 'complex' ? 1.5 : 1.0;
    return baseDuration * multiplier;
  }

  /**
   * 获取基础持续时间
   */
  private getBaseDuration(systemType: ExtendedPhysicsSystemType): number {
    const durationMap: Record<string, number> = {
      'projectile': 3.0,
      'free_fall': 2.0,
      'oscillation': 4.0,
      'circular_motion': 3.0,
      'dc_circuits': 5.0,
      'ac': 6.0
    };

    return durationMap[systemType] || this.DEFAULT_DURATION;
  }

  /**
   * 计算时间步长
   */
  private calculateTimeStep(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): number {
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    
    // 复杂系统需要更小的时间步长
    const multiplier = complexity === 'simple' ? 1.5 : complexity === 'complex' ? 0.5 : 1.0;
    return this.DEFAULT_TIME_STEP * multiplier;
  }

  /**
   * 选择精度
   */
  private selectPrecision(parsedQuestion: ParsedQuestion): 'low' | 'medium' | 'high' {
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    return complexity === 'complex' ? 'high' : complexity === 'simple' ? 'low' : 'medium';
  }

  /**
   * 计算最大迭代次数
   */
  private calculateMaxIterations(parsedQuestion: ParsedQuestion): number {
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    return complexity === 'complex' ? 20000 : complexity === 'simple' ? 5000 : 10000;
  }

  /**
   * 计算容差
   */
  private calculateTolerance(parsedQuestion: ParsedQuestion): number {
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    return complexity === 'complex' ? 1e-8 : complexity === 'simple' ? 1e-4 : 1e-6;
  }

  /**
   * 选择分辨率
   */
  private selectResolution(parsedQuestion: ParsedQuestion): 'low' | 'medium' | 'high' {
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    return complexity === 'complex' ? 'high' : complexity === 'simple' ? 'low' : 'medium';
  }

  /**
   * 选择帧率
   */
  private selectFrameRate(parsedQuestion: ParsedQuestion): number {
    const complexity = parsedQuestion.dslMetadata?.complexity || 'medium';
    return complexity === 'complex' ? 120 : complexity === 'simple' ? 30 : 60;
  }

  /**
   * 生成仿真事件
   */
  private generateEvents(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): SimulationEvent[] {
    const events: SimulationEvent[] = [];

    switch (systemType) {
      case 'projectile':
        events.push({
          type: 'condition',
          condition: 'y <= 0',
          action: 'stop',
          description: '落地停止',
          time: 3.0
        });
        break;
      case 'oscillation':
        events.push({
          type: 'time',
          condition: 't >= 4.0',
          action: 'log',
          description: '记录最终状态',
          time: 4.0
        });
        break;
    }

    return events;
  }

  /**
   * 选择求解器
   */
  private selectSolver(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): 'euler' | 'rk4' | 'verlet' | 'adaptive' {
    const solverMap: Record<string, 'euler' | 'rk4' | 'verlet' | 'adaptive'> = {
      'projectile': 'rk4',
      'oscillation': 'rk4',
      'circular_motion': 'rk4',
      'dc_circuits': 'euler',
      'ac': 'adaptive'
    };

    return solverMap[systemType] || 'rk4';
  }

  /**
   * 获取输出变量
   */
  private getOutputVariables(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): string[] {
    const variableMap: Record<string, string[]> = {
      'projectile': ['x', 'y', 'vx', 'vy', 't'],
      'free_fall': ['y', 'vy', 't'],
      'kinematics_linear': ['x', 'v', 'a', 't'],
      'circular_motion': ['x', 'y', 'v', 'a', 't'],
      'oscillation': ['x', 'v', 'a', 't'],
      'newton_dynamics': ['x', 'v', 'a', 'F', 't'],
      'energy_work_power': ['x', 'v', 'E_k', 'E_p', 'W', 't'],
      'pressure_buoyancy': ['h', 'p', 'F_b', 't'],
      'simple_machines': ['F_in', 'F_out', 'd_in', 'd_out', 'η'],
      'thermal': ['T', 'Q', 'm', 'c', 't'],
      'waves_sound': ['λ', 'f', 'T', 'v', 't'],
      'geometric_optics': ['u', 'v', 'f', 'M'],
      'gravitation': ['r', 'v', 'T', 'E', 't'],
      'electrostatics': ['E', 'V', 'F', 'r', 't'],
      'dc_circuits': ['I', 'U', 'R', 'P', 't'],
      'magnetism': ['B', 'F', 'r', 'v', 't'],
      'em_induction': ['Φ', 'ε', 'I', 't'],
      'ac': ['I', 'U', 'Z', 'φ', 't'],
      'modern_intro': ['E', 'λ', 'f', 't']
    };

    return variableMap[systemType] || ['x', 'y', 't'];
  }

  /**
   * 生成图表配置
   */
  private generatePlots(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): PlotConfig[] {
    const plots: PlotConfig[] = [];

    switch (systemType) {
      case 'projectile':
        plots.push(
          { type: 'trajectory', x_axis: 'x', y_axis: 'y', title: '抛体运动轨迹', x_label: '水平距离 (m)', y_label: '高度 (m)', grid: true, legend: true },
          { type: 'time_series', x_axis: 't', y_axis: 'vx', title: '水平速度时间曲线', x_label: '时间 (s)', y_label: '水平速度 (m/s)', grid: true, legend: false },
          { type: 'time_series', x_axis: 't', y_axis: 'vy', title: '垂直速度时间曲线', x_label: '时间 (s)', y_label: '垂直速度 (m/s)', grid: true, legend: false }
        );
        break;
      case 'free_fall':
        plots.push(
          { type: 'time_series', x_axis: 't', y_axis: 'y', title: '自由落体位移时间曲线', x_label: '时间 (s)', y_label: '高度 (m)', grid: true, legend: false },
          { type: 'time_series', x_axis: 't', y_axis: 'vy', title: '自由落体速度时间曲线', x_label: '时间 (s)', y_label: '速度 (m/s)', grid: true, legend: false }
        );
        break;
      case 'oscillation':
        plots.push(
          { type: 'time_series', x_axis: 't', y_axis: 'x', title: '简谐振动位移时间曲线', x_label: '时间 (s)', y_label: '位移 (m)', grid: true, legend: false },
          { type: 'phase_space', x_axis: 'x', y_axis: 'v', title: '简谐振动相空间图', x_label: '位移 (m)', y_label: '速度 (m/s)', grid: true, legend: false }
        );
        break;
    }

    return plots;
  }

  /**
   * 生成动画配置
   */
  private generateAnimations(systemType: ExtendedPhysicsSystemType, parsedQuestion: ParsedQuestion): AnimationConfig[] {
    const animations: AnimationConfig[] = [];

    switch (systemType) {
      case 'projectile':
        animations.push({
          type: '3d',
          camera: 'follow',
          speed: 1.0,
          loop: true,
          duration: 3.0,
          easing: 'ease_in_out'
        });
        break;
      case 'free_fall':
        animations.push({
          type: '2d',
          camera: 'fixed',
          speed: 1.0,
          loop: true,
          duration: 2.0,
          easing: 'linear'
        });
        break;
      case 'circular_motion':
        animations.push({
          type: '3d',
          camera: 'orbit',
          speed: 0.5,
          loop: true,
          duration: 3.0,
          easing: 'linear'
        });
        break;
    }

    return animations;
  }

  /**
   * 生成解题路径
   */
  private generateSolutionPath(parsedQuestion: ParsedQuestion): any {
    if (!parsedQuestion.solutionPath) {
      return null;
    }

    return {
      steps: parsedQuestion.solutionPath.steps.map(step => ({
        id: step.id,
        type: step.type,
        module: step.module,
        action: step.action,
        inputs: step.inputs,
        outputs: step.outputs,
        formula: step.formula,
        order: step.order,
        description: step.description
      })),
      modules: parsedQuestion.solutionPath.modules,
      dependencies: parsedQuestion.solutionPath.dependencies.map(dep => ({
        from: dep.from,
        to: dep.to,
        parameter: dep.parameter,
        type: dep.type,
        reason: dep.reason
      })),
      execution_order: parsedQuestion.solutionPath.executionOrder,
      checkpoints: parsedQuestion.solutionPath.checkpoints
    };
  }

  /**
   * 生成求解目标
   */
  private generateTarget(parsedQuestion: ParsedQuestion): any {
    if (!parsedQuestion.target) {
      return null;
    }

    return {
      primary: parsedQuestion.target.primary,
      secondary: parsedQuestion.target.secondary,
      method: parsedQuestion.target.method,
      priority: parsedQuestion.target.priority
    };
  }

  /**
   * 生成公式体系
   */
  private generateFormulas(parsedQuestion: ParsedQuestion): any {
    if (!parsedQuestion.formulas) {
      return null;
    }

    return {
      primary: parsedQuestion.formulas.primary.map(formula => ({
        name: formula.name,
        expression: formula.expression,
        description: formula.description,
        type: formula.type,
        module: formula.module,
        variables: formula.variables
      })),
      intermediate: parsedQuestion.formulas.intermediate.map(formula => ({
        name: formula.name,
        expression: formula.expression,
        description: formula.description,
        type: formula.type,
        module: formula.module,
        variables: formula.variables
      })),
      verification: parsedQuestion.formulas.verification.map(formula => ({
        name: formula.name,
        expression: formula.expression,
        description: formula.description,
        type: formula.type,
        module: formula.module,
        variables: formula.variables
      }))
    };
  }

  /**
   * 生成约束条件
   */
  private generateConstraints(parsedQuestion: ParsedQuestion): any {
    if (!parsedQuestion.constraints) {
      return null;
    }

    return {
      initial: parsedQuestion.constraints.initial.map(constraint => ({
        type: constraint.type,
        description: constraint.description,
        expression: constraint.expression,
        parameters: constraint.parameters
      })),
      boundary: parsedQuestion.constraints.boundary.map(constraint => ({
        type: constraint.type,
        description: constraint.description,
        expression: constraint.expression,
        parameters: constraint.parameters
      })),
      physical: parsedQuestion.constraints.physical.map(constraint => ({
        type: constraint.type,
        description: constraint.description,
        expression: constraint.expression,
        parameters: constraint.parameters
      })),
      mathematical: parsedQuestion.constraints.mathematical.map(constraint => ({
        type: constraint.type,
        description: constraint.description,
        expression: constraint.expression,
        parameters: constraint.parameters
      }))
    };
  }

  /**
   * 生成DSL元数据
   */
  private generateDSLMetadata(parsedQuestion: ParsedQuestion): any {
    if (!parsedQuestion.dslMetadata) {
      return {
        complexity: this.assessComplexity(parsedQuestion),
        moduleCount: 0,
        parameterCount: parsedQuestion.parameters.length,
        estimatedSteps: 0,
        confidence: 0.8
      };
    }

    return {
      complexity: parsedQuestion.dslMetadata.complexity,
      moduleCount: parsedQuestion.dslMetadata.moduleCount,
      parameterCount: parsedQuestion.dslMetadata.parameterCount,
      estimatedSteps: parsedQuestion.dslMetadata.estimatedSteps,
      confidence: parsedQuestion.dslMetadata.confidence
    };
  }

  /**
   * 评估复杂度
   */
  private assessComplexity(parsedQuestion: ParsedQuestion): 'simple' | 'medium' | 'complex' {
    const parameterCount = parsedQuestion.parameters.length;
    const questionLength = parsedQuestion.question.length;
    
    if (parameterCount <= 5 && questionLength <= 100) return 'simple';
    if (parameterCount <= 10 && questionLength <= 200) return 'medium';
    return 'complex';
  }

  /**
   * 转换为 YAML 格式
   */
  private convertToYAML(dsl: PhysicsDSL): string {
    // 这里实现 YAML 转换逻辑
    // 为了简化，先返回 JSON 格式
    return JSON.stringify(dsl, null, 2);
  }
}

// 导出默认实例
export const physicsDSLGenerator = new PhysicsDslGenerator();
