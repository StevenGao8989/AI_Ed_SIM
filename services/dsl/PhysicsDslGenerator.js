"use strict";
/**
 * 物理 DSL 生成器
 * 将 AI 解析的 ParsedQuestion 转换为结构化的 PhysicsDSL
 *
 * 核心职责：
 * 1. 将 ParsedQuestion 转换为 PhysicsDSL (YAML 格式)
 * 2. 为后续 IR 转换和验证提供标准化的数据结构
 * 3. 确保生成的 DSL 符合 PhysicsSchema 规范
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsDslGenerator = void 0;
class PhysicsDslGenerator {
    constructor() {
        this.VERSION = '2.0.0';
    }
    /**
     * 主入口：将 ParsedQuestion 转换为 PhysicsDSL
     */
    generateDSL(parsedQuestion) {
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
    generateMetadata(parsedQuestion) {
        return {
            version: this.VERSION,
            subject: parsedQuestion.subject || 'physics',
            topic: parsedQuestion.topic,
            topic_id: this.mapTopicToId(parsedQuestion.topic),
            grade: this.inferGrade(parsedQuestion.topic),
            timestamp: new Date().toISOString(),
            source_question: parsedQuestion.originalText || parsedQuestion.topic
        };
    }
    /**
     * 生成物理系统配置
     */
    generateSystem(parsedQuestion) {
        return {
            type: this.inferSystemType(parsedQuestion),
            parameters: this.convertParameters(parsedQuestion.parameters || []),
            initial_conditions: this.generateInitialConditions(parsedQuestion),
            constraints: this.convertConstraints(Array.isArray(parsedQuestion.constraints) ? parsedQuestion.constraints : []),
            constants: this.generateConstants(parsedQuestion),
            objects: this.generateObjects(parsedQuestion),
            materials: this.inferMaterials(parsedQuestion)
        };
    }
    /**
     * 生成仿真配置
     */
    generateSimulation(parsedQuestion) {
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
    generateOutput(parsedQuestion) {
        return {
            variables: this.extractVariables(parsedQuestion),
            export_formats: ['csv', 'json', 'yaml'],
            plots: this.generatePlots(parsedQuestion),
            animations: this.generateAnimations(parsedQuestion)
        };
    }
    /**
     * 生成课程标签
     */
    generateSyllabus(parsedQuestion) {
        return [{
                grade: this.inferGrade(parsedQuestion.topic),
                topic: this.mapTopicToCurriculumKey(parsedQuestion.topic)
            }];
    }
    // ===== 辅助方法 =====
    /**
     * 生成唯一ID
     */
    generateId() {
        return `physics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 转换参数
     */
    convertParameters(parameters) {
        return parameters.map(param => ({
            symbol: param.symbol,
            value: {
                value: param.value || 0,
                unit: param.unit || 'dimensionless'
            },
            role: param.role,
            description: param.note || `参数${param.symbol}`
        }));
    }
    /**
     * 转换约束条件
     */
    convertConstraints(constraints) {
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
    generateInitialConditions(parsedQuestion) {
        const conditions = [];
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
    generateConstants(parsedQuestion) {
        const constants = [];
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
    generateObjects(parsedQuestion) {
        const objects = [];
        // 根据题目内容推断物理对象
        const question = parsedQuestion.originalText?.toLowerCase() || '';
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
    generatePlots(parsedQuestion) {
        const plots = [];
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
    generateAnimations(parsedQuestion) {
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
    generateEvents(parsedQuestion) {
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
    generateEnvironment(parsedQuestion) {
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
    inferSystemType(parsedQuestion) {
        const topic = parsedQuestion.topic.toLowerCase();
        if (topic.includes('振动') || topic.includes('oscillation'))
            return 'kinematics_linear';
        if (topic.includes('波') || topic.includes('wave'))
            return 'kinematics_linear';
        if (topic.includes('电磁') || topic.includes('electromagnetic'))
            return 'kinematics_linear';
        if (topic.includes('电路') || topic.includes('circuit'))
            return 'kinematics_linear';
        if (topic.includes('热') || topic.includes('thermal'))
            return 'kinematics_linear';
        if (topic.includes('光') || topic.includes('optical'))
            return 'kinematics_linear';
        if (topic.includes('量子') || topic.includes('quantum'))
            return 'kinematics_linear';
        return 'kinematics_linear'; // 默认
    }
    /**
     * 推断维度
     */
    inferDimensions(parsedQuestion) {
        const topic = parsedQuestion.topic.toLowerCase();
        if (topic.includes('一维') || topic.includes('1d'))
            return 1;
        if (topic.includes('二维') || topic.includes('2d'))
            return 2;
        if (topic.includes('三维') || topic.includes('3d'))
            return 3;
        // 根据物理现象推断
        if (topic.includes('振动') || topic.includes('oscillation'))
            return 1;
        if (topic.includes('波') || topic.includes('wave'))
            return 2;
        return 3; // 默认3D
    }
    /**
     * 推断年级
     */
    inferGrade(topic) {
        const topicLower = topic.toLowerCase();
        if (topicLower.includes('初中') || topicLower.includes('middle'))
            return '初二';
        if (topicLower.includes('高中') || topicLower.includes('high'))
            return '高一';
        if (topicLower.includes('大学') || topicLower.includes('university'))
            return '高一';
        return '高一'; // 默认
    }
    /**
     * 计算仿真时长
     */
    calculateDuration(parsedQuestion) {
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
    calculateTimeStep(parsedQuestion) {
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
    selectSolver(parsedQuestion) {
        const topic = parsedQuestion.topic.toLowerCase();
        if (topic.includes('振动') || topic.includes('oscillation'))
            return 'rk4';
        if (topic.includes('碰撞') || topic.includes('collision'))
            return 'adaptive';
        return 'verlet'; // 默认
    }
    /**
     * 选择精度
     */
    selectPrecision(parsedQuestion) {
        const topic = parsedQuestion.topic.toLowerCase();
        if (topic.includes('碰撞') || topic.includes('collision'))
            return 'high';
        if (topic.includes('量子') || topic.includes('quantum'))
            return 'ultra';
        return 'medium'; // 默认
    }
    /**
     * 提取变量
     */
    extractVariables(parsedQuestion) {
        const variables = new Set();
        if (parsedQuestion.parameters) {
            parsedQuestion.parameters.forEach(param => {
                variables.add(param.symbol);
            });
        }
        if (parsedQuestion.unknowns) {
            parsedQuestion.unknowns.forEach((unknown) => {
                variables.add(unknown.symbol);
            });
        }
        return Array.from(variables);
    }
    /**
     * 提取质量
     */
    extractMass(parsedQuestion) {
        if (parsedQuestion.parameters) {
            const massParam = parsedQuestion.parameters.find(p => p.symbol.toLowerCase() === 'm' ||
                p.name?.toLowerCase().includes('质量') ||
                p.name?.toLowerCase().includes('mass'));
            if (massParam && massParam.value) {
                return { value: massParam.value, unit: massParam.unit || 'kg' };
            }
        }
        return { value: 1.0, unit: 'kg' }; // 默认
    }
    /**
     * 提取弹簧常数
     */
    extractSpringConstant(parsedQuestion) {
        if (parsedQuestion.parameters) {
            const kParam = parsedQuestion.parameters.find(p => p.symbol.toLowerCase() === 'k' ||
                p.name?.toLowerCase().includes('劲度') ||
                p.name?.toLowerCase().includes('spring'));
            if (kParam && kParam.value) {
                return { value: kParam.value, unit: kParam.unit || 'N/m' };
            }
        }
        return { value: 100, unit: 'N/m' }; // 默认
    }
    /**
     * 推断材料
     */
    inferMaterials(parsedQuestion) {
        const materials = ['default'];
        const question = parsedQuestion.originalText?.toLowerCase() || '';
        if (question.includes('金属') || question.includes('metal'))
            materials.push('metal');
        if (question.includes('塑料') || question.includes('plastic'))
            materials.push('plastic');
        if (question.includes('橡胶') || question.includes('rubber'))
            materials.push('rubber');
        return materials;
    }
    // ===== 映射方法 =====
    /**
     * 映射主题到ID
     */
    mapTopicToId(topic) {
        const topicLower = topic.toLowerCase();
        if (topicLower.includes('运动') || topicLower.includes('motion'))
            return 'kinematics';
        if (topicLower.includes('振动') || topicLower.includes('oscillation'))
            return 'oscillation';
        if (topicLower.includes('波') || topicLower.includes('wave'))
            return 'wave_motion';
        if (topicLower.includes('电磁') || topicLower.includes('electromagnetic'))
            return 'electromagnetism';
        if (topicLower.includes('热') || topicLower.includes('thermal'))
            return 'thermodynamics';
        if (topicLower.includes('光') || topicLower.includes('optical'))
            return 'optics';
        if (topicLower.includes('量子') || topicLower.includes('quantum'))
            return 'quantum_mechanics';
        return 'general_physics';
    }
    /**
     * 映射约束类型
     */
    mapConstraintType(type) {
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
    mapTopicToCurriculumKey(topic) {
        const topicLower = topic.toLowerCase();
        if (topicLower.includes('运动') || topicLower.includes('motion'))
            return 'kinematics';
        if (topicLower.includes('振动') || topicLower.includes('oscillation'))
            return 'kinematics';
        if (topicLower.includes('波') || topicLower.includes('wave'))
            return 'kinematics';
        if (topicLower.includes('电磁') || topicLower.includes('electromagnetic'))
            return 'kinematics';
        if (topicLower.includes('热') || topicLower.includes('thermal'))
            return 'kinematics';
        if (topicLower.includes('光') || topicLower.includes('optical'))
            return 'kinematics';
        if (topicLower.includes('量子') || topicLower.includes('quantum'))
            return 'kinematics';
        return 'kinematics';
    }
    /**
     * 推断章节
     */
    inferChapter(topic) {
        const topicLower = topic.toLowerCase();
        if (topicLower.includes('运动') || topicLower.includes('motion'))
            return '运动学';
        if (topicLower.includes('振动') || topicLower.includes('oscillation'))
            return '振动与波动';
        if (topicLower.includes('波') || topicLower.includes('wave'))
            return '振动与波动';
        if (topicLower.includes('电磁') || topicLower.includes('electromagnetic'))
            return '电磁学';
        if (topicLower.includes('热') || topicLower.includes('thermal'))
            return '热学';
        if (topicLower.includes('光') || topicLower.includes('optical'))
            return '光学';
        if (topicLower.includes('量子') || topicLower.includes('quantum'))
            return '量子力学';
        return '力学';
    }
    /**
     * 推断节次
     */
    inferSection(topic) {
        const topicLower = topic.toLowerCase();
        if (topicLower.includes('自由落体') || topicLower.includes('free fall'))
            return '自由落体运动';
        if (topicLower.includes('平抛') || topicLower.includes('projectile'))
            return '平抛运动';
        if (topicLower.includes('圆周') || topicLower.includes('circular'))
            return '圆周运动';
        if (topicLower.includes('简谐') || topicLower.includes('harmonic'))
            return '简谐运动';
        if (topicLower.includes('横波') || topicLower.includes('transverse'))
            return '横波';
        if (topicLower.includes('纵波') || topicLower.includes('longitudinal'))
            return '纵波';
        return '基础概念';
    }
}
exports.PhysicsDslGenerator = PhysicsDslGenerator;
