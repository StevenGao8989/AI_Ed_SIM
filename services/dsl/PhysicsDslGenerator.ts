/**
 * 物理 DSL 生成器
 * 将 AI 解析的 ParsedQuestion 转换为结构化的 PhysicsDSL
 * 
 * 核心职责：
 * 1. 将 ParsedQuestion 转换为 PhysicsDSL (YAML 格式)
 * 2. 为后续 IR 转换和验证提供标准化的数据结构
 * 3. 确保生成的 DSL 符合 PhysicsSchema 规范
 */

// 使用绝对路径导入，直接调用 services/ai_parsing 里的文件
import { ParsedQuestion } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/ai_parsing/PhysicsAIParserAICaller';

// 定义必要的类型接口，避免复杂的导入路径
interface PhysicalQuantity {
  value: number;
  unit: string;
}

interface DSLParameter {
  symbol: string;
  value: PhysicalQuantity;
  role: 'given' | 'unknown' | 'constant' | 'derived';
  description: string;
}

interface InitialCondition {
  name: string;
  value: PhysicalQuantity;
  description: string;
}

interface Constraint {
  type: 'custom' | 'boundary' | 'gravity' | 'friction' | 'spring' | 'air_resistance' | 'rope';
  expression: string;
  value: PhysicalQuantity;
  description: string;
}

interface Constant {
  name: string;
  value: PhysicalQuantity;
  source: 'given' | 'derived' | 'calculated' | 'standard';
  description: string;
}

interface PhysicsObject {
  id: string;
  name: string;
  type: 'particle' | 'rigid_body' | 'field' | 'wave';
  position: PhysicalQuantity;
  velocity: PhysicalQuantity;
  acceleration: PhysicalQuantity;
  mass: PhysicalQuantity;
  properties: any;
}

interface PlotConfig {
  type: 'trajectory' | 'time_series' | 'phase_space' | 'energy' | 'velocity' | 'acceleration';
  title: string;
  x_axis: string;
  y_axis: string;
}

interface AnimationConfig {
  type: '2d' | '3d';
  camera: 'fixed' | 'follow' | 'orbit' | 'first_person';
  speed: number;
  loop: boolean;
  duration: number;
  easing?: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';
}

interface DSLMetadata {
  id: string;
  version: string;
  created_at: string;
  subject: string;
  topic: string;
  topic_id: string;
  system_type: string;
  grade: string;
  difficulty: string;
  timestamp: string;
  source_question: string;
}

interface PhysicsSystem {
  type: string;
  dimensions: number;
  parameters: DSLParameter[];
  initial_conditions: InitialCondition[];
  constraints: Constraint[];
  constants: Constant[];
  objects: PhysicsObject[];
  materials: string[];
  environment: any;
}

interface SimulationConfig {
  duration: PhysicalQuantity;
  time_step: PhysicalQuantity;
  solver: 'euler' | 'rk4' | 'verlet' | 'adaptive';
  precision: 'low' | 'medium' | 'high' | 'ultra';
  events: any[];
}

interface OutputConfig {
  variables: string[];
  export_formats: string[];
  plots: PlotConfig[];
  animations: AnimationConfig[];
  visualization: {
    plots: PlotConfig[];
    animations: AnimationConfig[];
  };
}

interface SyllabusTag {
  grade: string;
  topic: string;
}

// 额外的类型定义
type ParameterRole = 'given' | 'unknown' | 'constant' | 'derived';
type ExtendedPhysicsSystemType = string;
type CNGrade = string;
type CurriculumTopicKey = string;

interface PhysicsDSL {
  metadata: DSLMetadata;
  system: PhysicsSystem;
  simulation: SimulationConfig;
  output: OutputConfig;
  syllabus: SyllabusTag[];
}

export class PhysicsDslGenerator {
  private readonly VERSION = '2.0.0';

  /**
   * 主入口：将 ParsedQuestion 转换为 PhysicsDSL
   */
  generateDSL(parsedQuestion: ParsedQuestion): PhysicsDSL {
    return {
      metadata: this.generateMetadata(parsedQuestion),
      system: this.generateSystem(parsedQuestion),
      simulation: this.generateSimulation(parsedQuestion),
      output: this.generateOutput(parsedQuestion),
      syllabus: this.generateSyllabus(parsedQuestion)
    };
  }

  /**
   * 生成元数据
   */
  private generateMetadata(parsedQuestion: ParsedQuestion): DSLMetadata {
    const now = new Date().toISOString();
    return {
      id: this.generateId(),
      version: this.VERSION,
      created_at: now,
      subject: parsedQuestion.subject || 'physics',
      topic: parsedQuestion.topic,
      topic_id: this.mapTopicToId(parsedQuestion.topic),
      system_type: this.inferSystemType(parsedQuestion),
      grade: this.inferGrade(parsedQuestion.topic),
      difficulty: this.inferDifficulty(parsedQuestion),
      timestamp: now,
      source_question: (parsedQuestion as any).originalText || parsedQuestion.topic
    };
  }

  /**
   * 生成物理系统配置
   */
  private generateSystem(parsedQuestion: ParsedQuestion): PhysicsSystem {
    return {
      type: this.inferSystemType(parsedQuestion),
      dimensions: this.inferDimensions(parsedQuestion),
      parameters: this.convertParameters(parsedQuestion.parameters || []),
      initial_conditions: this.generateInitialConditions(parsedQuestion),
      constraints: this.convertConstraints(Array.isArray(parsedQuestion.constraints) ? parsedQuestion.constraints : []),
      constants: this.generateConstants(parsedQuestion),
      objects: this.generateObjects(parsedQuestion),
      materials: this.inferMaterials(parsedQuestion),
      environment: this.generateEnvironment(parsedQuestion)
    };
  }

  /**
   * 生成仿真配置
   */
  private generateSimulation(parsedQuestion: ParsedQuestion): SimulationConfig {
    return {
      duration: this.calculateDuration(parsedQuestion),
      time_step: this.calculateTimeStep(parsedQuestion),
      solver: this.selectSolver(parsedQuestion),
      precision: this.selectPrecision(parsedQuestion),
      events: this.generateEvents(parsedQuestion)
    };
  }

  /**
   * 生成输出配置
   */
  private generateOutput(parsedQuestion: ParsedQuestion): OutputConfig {
    const plots = this.generatePlots(parsedQuestion);
    const animations = this.generateAnimations(parsedQuestion);
    
    return {
      variables: this.extractVariables(parsedQuestion),
      export_formats: ['csv', 'json', 'yaml'],
      plots: plots,
      animations: animations,
      visualization: {
        plots: plots,
        animations: animations
      }
    };
  }

  /**
   * 生成课程标签
   */
  private generateSyllabus(parsedQuestion: ParsedQuestion): SyllabusTag[] {
    return [{
      grade: this.inferGrade(parsedQuestion.topic),
      topic: this.mapTopicToCurriculumKey(parsedQuestion.topic)
    }];
  }

  // ===== 辅助方法 =====

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `physics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 转换参数
   */
  private convertParameters(parameters: any[]): DSLParameter[] {
    const convertedParams = parameters.map(param => ({
      symbol: param.symbol,
      value: {
        value: param.value || 0,
        unit: this.normalizeUnit(param.unit) || 'dimensionless'
      },
      role: param.role as ParameterRole,
      description: param.note || `参数${param.symbol}`
    }));

    // 为弹簧振子问题补充缺失的关键参数
    return this.enhanceParametersForPhysics(convertedParams);
  }

  /**
   * 标准化单位
   */
  private normalizeUnit(unit: string): string {
    if (!unit) return 'dimensionless';
    
    const unitMap: { [key: string]: string } = {
      'sin': 'm',
      'm/s^2': 'm/s²',
      'm/s2': 'm/s²',
      'N/m': 'N/m',
      'kg': 'kg',
      'm': 'm',
      's': 's',
      'Hz': 'Hz',
      'rad/s': 'rad/s'
    };
    
    return unitMap[unit] || unit;
  }

  /**
   * 根据物理现象增强参数
   */
  private enhanceParametersForPhysics(parameters: DSLParameter[]): DSLParameter[] {
    const enhancedParams = [...parameters];
    const symbols = parameters.map(p => p.symbol.toLowerCase());
    
    // 检查是否是弹簧振子问题
    const hasSpring = symbols.includes('k') || parameters.some(p => 
      p.description.includes('劲度') || p.description.includes('spring')
    );
    const hasMass = symbols.includes('m');
    const hasAmplitude = symbols.includes('a') || symbols.includes('x');
    
    // 补充弹簧常数
    if (hasSpring && !symbols.includes('k')) {
      enhancedParams.push({
        symbol: 'k',
        value: { value: 100, unit: 'N/m' },
        role: 'given',
        description: '弹簧劲度系数'
      });
    }
    
    // 补充振幅
    if (hasSpring && !hasAmplitude) {
      enhancedParams.push({
        symbol: 'A',
        value: { value: 0.1, unit: 'm' },
        role: 'given',
        description: '振动振幅'
      });
    }
    
    // 补充角频率
    if (hasSpring && !symbols.includes('ω') && !symbols.includes('omega')) {
      enhancedParams.push({
        symbol: 'ω',
        value: { value: 0, unit: 'rad/s' },
        role: 'unknown',
        description: '角频率'
      });
    }
    
    return enhancedParams;
  }

  /**
   * 转换约束条件
   */
  private convertConstraints(constraints: any[]): Constraint[] {
    return constraints.map(constraint => ({
      type: this.mapConstraintType(constraint.type),
      expression: constraint.expression,
      value: {
        value: constraint.value || 0,
        unit: constraint.unit || 'dimensionless'
      },
      description: constraint.description || '约束条件'
    }));
  }

  /**
   * 生成初始条件
   */
  private generateInitialConditions(parsedQuestion: ParsedQuestion): InitialCondition[] {
    const conditions: InitialCondition[] = [];
    
    // 从参数中提取初始条件
    if (parsedQuestion.parameters) {
      parsedQuestion.parameters.forEach(param => {
        if (param.role === 'given' && param.value !== null) {
          conditions.push({
            name: param.symbol,
            value: {
              value: param.value,
              unit: param.unit || 'dimensionless'
            },
            description: param.note || `初始${param.symbol}`
          });
        }
      });
    }
    
    return conditions;
  }

  /**
   * 生成常量
   */
  private generateConstants(parsedQuestion: ParsedQuestion): Constant[] {
    const constants: Constant[] = [];
    
    // 从参数中提取常量
    if (parsedQuestion.parameters) {
      parsedQuestion.parameters.forEach(param => {
        if (param.role === 'constant' && param.value !== null) {
        constants.push({
          name: param.symbol,
          value: {
            value: param.value,
            unit: param.unit || 'dimensionless'
          },
          source: 'given',
          description: param.note || `常量${param.symbol}`
        });
        }
      });
    }
    
    return constants;
  }

  /**
   * 生成物理对象
   */
  private generateObjects(parsedQuestion: ParsedQuestion): PhysicsObject[] {
    const objects: PhysicsObject[] = [];
    
    // 根据题目内容推断物理对象
    const question = (parsedQuestion as any).originalText?.toLowerCase() || '';
    
    if (question.includes('球') || question.includes('ball')) {
      objects.push({
        id: 'ball',
        name: '小球',
        type: 'particle',
        position: { value: 0, unit: 'm' },
        velocity: { value: 0, unit: 'm/s' },
        acceleration: { value: 0, unit: 'm/s²' },
        mass: this.extractMass(parsedQuestion),
        properties: {
          radius: { value: 0.1, unit: 'm' },
          material: 'default'
        }
      });
    }
    
    if (question.includes('弹簧') || question.includes('spring')) {
      objects.push({
        id: 'spring',
        name: '弹簧',
        type: 'field',
        position: { value: 0, unit: 'm' },
        velocity: { value: 0, unit: 'm/s' },
        acceleration: { value: 0, unit: 'm/s²' },
        mass: { value: 0, unit: 'kg' },
        properties: {
          stiffness: this.extractSpringConstant(parsedQuestion),
          rest_length: { value: 1, unit: 'm' }
        }
      });
    }
    
    return objects;
  }

  /**
   * 生成图表配置
   */
  private generatePlots(parsedQuestion: ParsedQuestion): PlotConfig[] {
    const plots: PlotConfig[] = [];
    const topic = parsedQuestion.topic.toLowerCase();
    
    // 根据物理主题生成相应的图表
    if (topic.includes('运动') || topic.includes('motion')) {
      plots.push({
        type: 'time_series',
        title: '位置-时间图',
        x_axis: 't',
        y_axis: 'x'
      });
      plots.push({
        type: 'time_series',
        title: '速度-时间图',
        x_axis: 't',
        y_axis: 'v'
      });
    }
    
    if (topic.includes('振动') || topic.includes('oscillation')) {
      plots.push({
        type: 'time_series',
        title: '位移-时间图',
        x_axis: 't',
        y_axis: 'x'
      });
    }
    
    if (topic.includes('波') || topic.includes('wave')) {
      plots.push({
        type: 'trajectory',
        title: '波形图',
        x_axis: 'x',
        y_axis: 'y'
      });
    }
    
    return plots;
  }

  /**
   * 生成动画配置
   */
  private generateAnimations(parsedQuestion: ParsedQuestion): AnimationConfig[] {
    return [{
      type: '3d',
      camera: 'fixed',
      speed: 1.0,
      loop: true,
      duration: 10.0,
      easing: 'ease_in_out'
    }];
  }

  /**
   * 生成事件配置
   */
  private generateEvents(parsedQuestion: ParsedQuestion): any[] {
    return [{
      type: 'time',
      trigger: { value: 5, unit: 's' },
      action: 'checkpoint',
      description: '仿真检查点'
    }];
  }

  /**
   * 生成环境配置
   */
  private generateEnvironment(parsedQuestion: ParsedQuestion): any {
    return {
      gravity: { value: 9.8, unit: 'm/s²' },
      air_resistance: false,
      temperature: { value: 20, unit: '°C' }
    };
  }

  // ===== 推断方法 =====

  /**
   * 推断系统类型
   */
  private inferSystemType(parsedQuestion: ParsedQuestion): ExtendedPhysicsSystemType {
    const topic = parsedQuestion.topic.toLowerCase();
    
    if (topic.includes('振动') || topic.includes('oscillation')) return 'kinematics_linear';
    if (topic.includes('波') || topic.includes('wave')) return 'kinematics_linear';
    if (topic.includes('电磁') || topic.includes('electromagnetic')) return 'kinematics_linear';
    if (topic.includes('电路') || topic.includes('circuit')) return 'kinematics_linear';
    if (topic.includes('热') || topic.includes('thermal')) return 'kinematics_linear';
    if (topic.includes('光') || topic.includes('optical')) return 'kinematics_linear';
    if (topic.includes('量子') || topic.includes('quantum')) return 'kinematics_linear';
    
    return 'kinematics_linear'; // 默认
  }

  /**
   * 推断维度
   */
  private inferDimensions(parsedQuestion: ParsedQuestion): number {
    const topic = parsedQuestion.topic.toLowerCase();
    
    if (topic.includes('一维') || topic.includes('1d')) return 1;
    if (topic.includes('二维') || topic.includes('2d')) return 2;
    if (topic.includes('三维') || topic.includes('3d')) return 3;
    
    // 根据物理现象推断
    if (topic.includes('振动') || topic.includes('oscillation')) return 1;
    if (topic.includes('波') || topic.includes('wave')) return 2;
    
    return 3; // 默认3D
  }

  /**
   * 推断年级
   */
  private inferGrade(topic: string): CNGrade {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('初中') || topicLower.includes('middle')) return '初二';
    if (topicLower.includes('高中') || topicLower.includes('high')) return '高一';
    if (topicLower.includes('大学') || topicLower.includes('university')) return '高一';
    
    return '高一'; // 默认
  }

  /**
   * 推断难度
   */
  private inferDifficulty(parsedQuestion: ParsedQuestion): string {
    const topic = parsedQuestion.topic.toLowerCase();
    const question = (parsedQuestion as any).originalText?.toLowerCase() || '';
    
    // 根据关键词判断难度
    if (question.includes('简单') || question.includes('基础') || question.includes('基本')) {
      return 'easy';
    }
    if (question.includes('复杂') || question.includes('综合') || question.includes('多模块')) {
      return 'hard';
    }
    if (topic.includes('量子') || topic.includes('相对论') || topic.includes('advanced')) {
      return 'hard';
    }
    if (topic.includes('振动') || topic.includes('波') || topic.includes('电磁')) {
      return 'medium';
    }
    
    return 'medium'; // 默认中等难度
  }

  /**
   * 计算仿真时长
   */
  private calculateDuration(parsedQuestion: ParsedQuestion): PhysicalQuantity {
    const topic = parsedQuestion.topic.toLowerCase();
    
    if (topic.includes('振动') || topic.includes('oscillation')) {
      return { value: 20, unit: 's' };
    }
    if (topic.includes('碰撞') || topic.includes('collision')) {
      return { value: 5, unit: 's' };
    }
    
    return { value: 10, unit: 's' }; // 默认
  }

  /**
   * 计算时间步长
   */
  private calculateTimeStep(parsedQuestion: ParsedQuestion): PhysicalQuantity {
    const topic = parsedQuestion.topic.toLowerCase();
    
    if (topic.includes('碰撞') || topic.includes('collision')) {
      return { value: 0.001, unit: 's' };
    }
    if (topic.includes('振动') || topic.includes('oscillation')) {
      return { value: 0.005, unit: 's' };
    }
    
    return { value: 0.01, unit: 's' }; // 默认
  }

  /**
   * 选择求解器
   */
  private selectSolver(parsedQuestion: ParsedQuestion): 'euler' | 'rk4' | 'verlet' | 'adaptive' {
    const topic = parsedQuestion.topic.toLowerCase();
    
    if (topic.includes('振动') || topic.includes('oscillation')) return 'rk4';
    if (topic.includes('碰撞') || topic.includes('collision')) return 'adaptive';
    
    return 'verlet'; // 默认
  }

  /**
   * 选择精度
   */
  private selectPrecision(parsedQuestion: ParsedQuestion): 'low' | 'medium' | 'high' | 'ultra' {
    const topic = parsedQuestion.topic.toLowerCase();
    
    if (topic.includes('碰撞') || topic.includes('collision')) return 'high';
    if (topic.includes('量子') || topic.includes('quantum')) return 'ultra';
    
    return 'medium'; // 默认
  }

  /**
   * 提取变量
   */
  private extractVariables(parsedQuestion: ParsedQuestion): string[] {
    const variables = new Set<string>();
    
    if (parsedQuestion.parameters) {
      parsedQuestion.parameters.forEach(param => {
        variables.add(param.symbol);
      });
    }
    
    if ((parsedQuestion as any).unknowns) {
      (parsedQuestion as any).unknowns.forEach((unknown: any) => {
        variables.add(unknown.symbol);
      });
    }
    
    return Array.from(variables);
  }

  /**
   * 提取质量
   */
  private extractMass(parsedQuestion: ParsedQuestion): PhysicalQuantity {
    if (parsedQuestion.parameters) {
      const massParam = parsedQuestion.parameters.find(p => 
        p.symbol.toLowerCase() === 'm' || 
        (p as any).name?.toLowerCase().includes('质量') ||
        (p as any).name?.toLowerCase().includes('mass')
      );
      if (massParam && massParam.value) {
        return { value: massParam.value, unit: massParam.unit || 'kg' };
      }
    }
    return { value: 1.0, unit: 'kg' }; // 默认
  }

  /**
   * 提取弹簧常数
   */
  private extractSpringConstant(parsedQuestion: ParsedQuestion): PhysicalQuantity {
    if (parsedQuestion.parameters) {
      const kParam = parsedQuestion.parameters.find(p => 
        p.symbol.toLowerCase() === 'k' || 
        (p as any).name?.toLowerCase().includes('劲度') ||
        (p as any).name?.toLowerCase().includes('spring')
      );
      if (kParam && kParam.value) {
        return { value: kParam.value, unit: kParam.unit || 'N/m' };
      }
    }
    return { value: 100, unit: 'N/m' }; // 默认
  }

  /**
   * 推断材料
   */
  private inferMaterials(parsedQuestion: ParsedQuestion): string[] {
    const materials = ['default'];
    const question = (parsedQuestion as any).originalText?.toLowerCase() || '';
    
    if (question.includes('金属') || question.includes('metal')) materials.push('metal');
    if (question.includes('塑料') || question.includes('plastic')) materials.push('plastic');
    if (question.includes('橡胶') || question.includes('rubber')) materials.push('rubber');
    
    return materials;
  }

  // ===== 映射方法 =====

  /**
   * 映射主题到ID
   */
  private mapTopicToId(topic: string): string {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('运动') || topicLower.includes('motion')) return 'kinematics';
    if (topicLower.includes('振动') || topicLower.includes('oscillation')) return 'oscillation';
    if (topicLower.includes('波') || topicLower.includes('wave')) return 'wave_motion';
    if (topicLower.includes('电磁') || topicLower.includes('electromagnetic')) return 'electromagnetism';
    if (topicLower.includes('热') || topicLower.includes('thermal')) return 'thermodynamics';
    if (topicLower.includes('光') || topicLower.includes('optical')) return 'optics';
    if (topicLower.includes('量子') || topicLower.includes('quantum')) return 'quantum_mechanics';
    
    return 'general_physics';
  }

  /**
   * 映射约束类型
   */
  private mapConstraintType(type: string): 'custom' | 'boundary' | 'gravity' | 'friction' | 'spring' | 'air_resistance' | 'rope' {
    switch (type) {
      case 'initial': return 'custom';
      case 'boundary': return 'boundary';
      case 'physical': return 'gravity';
      case 'mathematical': return 'custom';
      default: return 'custom';
    }
  }

  /**
   * 映射课程主题
   */
  private mapTopicToCurriculumKey(topic: string): CurriculumTopicKey {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('运动') || topicLower.includes('motion')) return 'kinematics';
    if (topicLower.includes('振动') || topicLower.includes('oscillation')) return 'kinematics';
    if (topicLower.includes('波') || topicLower.includes('wave')) return 'kinematics';
    if (topicLower.includes('电磁') || topicLower.includes('electromagnetic')) return 'kinematics';
    if (topicLower.includes('热') || topicLower.includes('thermal')) return 'kinematics';
    if (topicLower.includes('光') || topicLower.includes('optical')) return 'kinematics';
    if (topicLower.includes('量子') || topicLower.includes('quantum')) return 'kinematics';
    
    return 'kinematics';
  }

  /**
   * 推断章节
   */
  private inferChapter(topic: string): string {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('运动') || topicLower.includes('motion')) return '运动学';
    if (topicLower.includes('振动') || topicLower.includes('oscillation')) return '振动与波动';
    if (topicLower.includes('波') || topicLower.includes('wave')) return '振动与波动';
    if (topicLower.includes('电磁') || topicLower.includes('electromagnetic')) return '电磁学';
    if (topicLower.includes('热') || topicLower.includes('thermal')) return '热学';
    if (topicLower.includes('光') || topicLower.includes('optical')) return '光学';
    if (topicLower.includes('量子') || topicLower.includes('quantum')) return '量子力学';
    
    return '力学';
  }

  /**
   * 推断节次
   */
  private inferSection(topic: string): string {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('自由落体') || topicLower.includes('free fall')) return '自由落体运动';
    if (topicLower.includes('平抛') || topicLower.includes('projectile')) return '平抛运动';
    if (topicLower.includes('圆周') || topicLower.includes('circular')) return '圆周运动';
    if (topicLower.includes('简谐') || topicLower.includes('harmonic')) return '简谐运动';
    if (topicLower.includes('横波') || topicLower.includes('transverse')) return '横波';
    if (topicLower.includes('纵波') || topicLower.includes('longitudinal')) return '纵波';
    
    return '基础概念';
  }
}


