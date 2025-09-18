"use strict";
// services/dsl/PhysicsDslGenerator.ts
// DSL 生成器：将 PhysicsAIParserAICaller 输出转换为 PhysicsDSL (YAML 格式)
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.physicsDSLGenerator = exports.PhysicsDslGenerator = void 0;
/**
 * 物理 DSL 生成器
 * 将 AI 解析的题目转换为结构化的物理 DSL
 */
var PhysicsDslGenerator = /** @class */ (function () {
    function PhysicsDslGenerator() {
        this.VERSION = '1.0.0';
        this.DEFAULT_TIME_STEP = 0.01;
        this.DEFAULT_DURATION = 5.0;
    }
    /**
     * 生成完整的 PhysicsDSL
     */
    PhysicsDslGenerator.prototype.generateDSL = function (parsedQuestion) {
        var topicId = this.mapTopicToId(parsedQuestion.topic);
        var systemType = this.mapTopicToSystemType(topicId);
        var baseDSL = {
            metadata: this.generateMetadata(parsedQuestion, topicId),
            system: this.generateSystem(parsedQuestion, systemType),
            simulation: this.generateSimulation(systemType, parsedQuestion),
            output: this.generateOutput(systemType, parsedQuestion),
            syllabus: this.generateSyllabus(parsedQuestion.topic)
        };
        // 添加DSL增强字段（作为扩展）
        var enhancedDSL = __assign(__assign({}, baseDSL), { 
            // 新增DSL增强字段
            solution_path: this.generateSolutionPath(parsedQuestion), target: this.generateTarget(parsedQuestion), formulas: this.generateFormulas(parsedQuestion), constraints: this.generateConstraints(parsedQuestion), dsl_metadata: this.generateDSLMetadata(parsedQuestion) });
        return enhancedDSL;
    };
    /**
     * 生成 YAML 格式的 DSL
     */
    PhysicsDslGenerator.prototype.generateYAML = function (parsedQuestion) {
        var dsl = this.generateDSL(parsedQuestion);
        return this.convertToYAML(dsl);
    };
    /**
     * 生成元数据
     */
    PhysicsDslGenerator.prototype.generateMetadata = function (parsedQuestion, topicId) {
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
    };
    /**
     * 生成物理系统配置
     */
    PhysicsDslGenerator.prototype.generateSystem = function (parsedQuestion, systemType) {
        return {
            type: systemType,
            parameters: this.convertParameters(parsedQuestion.parameters),
            initial_conditions: this.generateInitialConditions(systemType, parsedQuestion.parameters),
            constraints: this.generateSystemConstraints(systemType),
            constants: this.generateConstants(systemType, parsedQuestion.parameters),
            objects: this.generatePhysicsObjects(systemType, parsedQuestion.parameters),
            materials: this.detectMaterials(parsedQuestion.question)
        };
    };
    /**
     * 生成仿真配置
     */
    PhysicsDslGenerator.prototype.generateSimulation = function (systemType, parsedQuestion) {
        var duration = this.calculateDuration(systemType, parsedQuestion);
        var timeStep = this.calculateTimeStep(systemType, parsedQuestion);
        return {
            duration: { value: duration, unit: 's' },
            time_step: { value: timeStep, unit: 's' },
            events: this.generateEvents(systemType, parsedQuestion),
            solver: this.selectSolver(systemType, parsedQuestion),
            precision: this.selectPrecision(parsedQuestion),
            max_iterations: this.calculateMaxIterations(parsedQuestion),
            tolerance: this.calculateTolerance(parsedQuestion)
        };
    };
    /**
     * 生成输出配置
     */
    PhysicsDslGenerator.prototype.generateOutput = function (systemType, parsedQuestion) {
        return {
            variables: this.getOutputVariables(systemType, parsedQuestion),
            plots: this.generatePlots(systemType, parsedQuestion),
            animations: this.generateAnimations(systemType, parsedQuestion),
            export_formats: ['json', 'yaml', 'csv'],
            resolution: this.selectResolution(parsedQuestion),
            frame_rate: this.selectFrameRate(parsedQuestion)
        };
    };
    /**
     * 转换参数格式
     */
    PhysicsDslGenerator.prototype.convertParameters = function (parameters) {
        var _this = this;
        return parameters.map(function (param) { return ({
            symbol: param.symbol,
            value: {
                value: param.value || 0,
                unit: param.unit || '1',
                description: param.note || ''
            },
            role: param.role || 'unknown',
            description: param.note || "\u53C2\u6570 ".concat(param.symbol),
            standard_value: param.value ? {
                value: param.value,
                unit: param.unit || '1',
                description: '标准化值'
            } : null,
            constraints: _this.generateParameterConstraints(param),
            uncertainty: 0.01, // 默认不确定性
            // 新增DSL相关字段
            dsl_type: param.dslType || 'scalar',
            domain: param.domain || 'kinematics',
            priority: param.priority || 1,
            dependencies: param.dependencies || [],
            formula: param.formula || ''
        }); });
    };
    /**
     * 生成参数约束
     */
    PhysicsDslGenerator.prototype.generateParameterConstraints = function (param) {
        var constraints = [];
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
    };
    /**
     * 生成初始条件
     */
    PhysicsDslGenerator.prototype.generateInitialConditions = function (systemType, parameters) {
        var conditions = [];
        switch (systemType) {
            case 'projectile':
                conditions.push({
                    name: 'x0',
                    value: { value: 0, unit: 'm', description: '初始水平位置' },
                    description: '初始水平位置',
                    time: 0
                }, {
                    name: 'y0',
                    value: { value: 0, unit: 'm', description: '初始垂直位置' },
                    description: '初始垂直位置',
                    time: 0
                });
                break;
            case 'oscillation':
                conditions.push({
                    name: 'x0',
                    value: { value: 0.1, unit: 'm', description: '初始位移' },
                    description: '初始位移',
                    time: 0
                });
                break;
        }
        return conditions;
    };
    /**
     * 生成系统约束条件
     */
    PhysicsDslGenerator.prototype.generateSystemConstraints = function (systemType) {
        var constraints = [];
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
    };
    /**
     * 生成常量
     */
    PhysicsDslGenerator.prototype.generateConstants = function (systemType, parameters) {
        var constants = [];
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
    };
    /**
     * 生成物理对象
     */
    PhysicsDslGenerator.prototype.generatePhysicsObjects = function (systemType, parameters) {
        var objects = [];
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
    };
    /**
     * 检测材料
     */
    PhysicsDslGenerator.prototype.detectMaterials = function (question) {
        var materials = [];
        if (question.includes('钢') || question.includes('steel'))
            materials.push('steel');
        if (question.includes('铝') || question.includes('aluminum'))
            materials.push('aluminum');
        if (question.includes('水') || question.includes('water'))
            materials.push('water');
        if (question.includes('空气') || question.includes('air'))
            materials.push('air');
        return materials;
    };
    /**
     * 生成学段标签
     */
    PhysicsDslGenerator.prototype.generateSyllabus = function (topic) {
        // 根据主题判断学段
        var juniorTopics = ['mechanics_basics', 'pressure_buoyancy_junior', 'simple_machines_junior'];
        var seniorTopics = ['kinematics', 'dynamics', 'electrostatics_senior'];
        if (juniorTopics.some(function (t) { return topic.includes(t); })) {
            return [{ grade: '初三', topic: 'mechanics_basics', note: '初中物理' }];
        }
        else if (seniorTopics.some(function (t) { return topic.includes(t); })) {
            return [{ grade: '高一', topic: 'kinematics', note: '高中物理' }];
        }
        return [];
    };
    /**
     * 检测学段
     */
    PhysicsDslGenerator.prototype.detectGrade = function (topic) {
        if (topic.includes('初中') || topic.includes('junior'))
            return '初三';
        if (topic.includes('高中') || topic.includes('senior'))
            return '高一';
        return '高一'; // 默认
    };
    /**
     * 评估难度
     */
    PhysicsDslGenerator.prototype.assessDifficulty = function (parsedQuestion) {
        var complexity = this.assessComplexity(parsedQuestion);
        return complexity === 'simple' ? 'easy' : complexity === 'complex' ? 'hard' : 'medium';
    };
    /**
     * 映射主题到 ID
     */
    PhysicsDslGenerator.prototype.mapTopicToId = function (topic) {
        var topicMap = {
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
        for (var _i = 0, _a = Object.entries(topicMap); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (topic.includes(key))
                return value;
        }
        return 'projectile'; // 默认
    };
    /**
     * 映射主题到系统类型
     */
    PhysicsDslGenerator.prototype.mapTopicToSystemType = function (topicId) {
        var systemMap = {
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
    };
    /**
     * 计算仿真持续时间
     */
    PhysicsDslGenerator.prototype.calculateDuration = function (systemType, parsedQuestion) {
        var _a;
        // 基于DSL元数据调整持续时间
        var baseDuration = this.getBaseDuration(systemType);
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        var multiplier = complexity === 'simple' ? 0.8 : complexity === 'complex' ? 1.5 : 1.0;
        return baseDuration * multiplier;
    };
    /**
     * 获取基础持续时间
     */
    PhysicsDslGenerator.prototype.getBaseDuration = function (systemType) {
        var durationMap = {
            'projectile': 3.0,
            'free_fall': 2.0,
            'oscillation': 4.0,
            'circular_motion': 3.0,
            'dc_circuits': 5.0,
            'ac': 6.0
        };
        return durationMap[systemType] || this.DEFAULT_DURATION;
    };
    /**
     * 计算时间步长
     */
    PhysicsDslGenerator.prototype.calculateTimeStep = function (systemType, parsedQuestion) {
        var _a;
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        // 复杂系统需要更小的时间步长
        var multiplier = complexity === 'simple' ? 1.5 : complexity === 'complex' ? 0.5 : 1.0;
        return this.DEFAULT_TIME_STEP * multiplier;
    };
    /**
     * 选择精度
     */
    PhysicsDslGenerator.prototype.selectPrecision = function (parsedQuestion) {
        var _a;
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        return complexity === 'complex' ? 'high' : complexity === 'simple' ? 'low' : 'medium';
    };
    /**
     * 计算最大迭代次数
     */
    PhysicsDslGenerator.prototype.calculateMaxIterations = function (parsedQuestion) {
        var _a;
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        return complexity === 'complex' ? 20000 : complexity === 'simple' ? 5000 : 10000;
    };
    /**
     * 计算容差
     */
    PhysicsDslGenerator.prototype.calculateTolerance = function (parsedQuestion) {
        var _a;
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        return complexity === 'complex' ? 1e-8 : complexity === 'simple' ? 1e-4 : 1e-6;
    };
    /**
     * 选择分辨率
     */
    PhysicsDslGenerator.prototype.selectResolution = function (parsedQuestion) {
        var _a;
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        return complexity === 'complex' ? 'high' : complexity === 'simple' ? 'low' : 'medium';
    };
    /**
     * 选择帧率
     */
    PhysicsDslGenerator.prototype.selectFrameRate = function (parsedQuestion) {
        var _a;
        var complexity = ((_a = parsedQuestion.dslMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 'medium';
        return complexity === 'complex' ? 120 : complexity === 'simple' ? 30 : 60;
    };
    /**
     * 生成仿真事件
     */
    PhysicsDslGenerator.prototype.generateEvents = function (systemType, parsedQuestion) {
        var events = [];
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
    };
    /**
     * 选择求解器
     */
    PhysicsDslGenerator.prototype.selectSolver = function (systemType, parsedQuestion) {
        var solverMap = {
            'projectile': 'rk4',
            'oscillation': 'rk4',
            'circular_motion': 'rk4',
            'dc_circuits': 'euler',
            'ac': 'adaptive'
        };
        return solverMap[systemType] || 'rk4';
    };
    /**
     * 获取输出变量
     */
    PhysicsDslGenerator.prototype.getOutputVariables = function (systemType, parsedQuestion) {
        var variableMap = {
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
    };
    /**
     * 生成图表配置
     */
    PhysicsDslGenerator.prototype.generatePlots = function (systemType, parsedQuestion) {
        var plots = [];
        switch (systemType) {
            case 'projectile':
                plots.push({ type: 'trajectory', x_axis: 'x', y_axis: 'y', title: '抛体运动轨迹', x_label: '水平距离 (m)', y_label: '高度 (m)', grid: true, legend: true }, { type: 'time_series', x_axis: 't', y_axis: 'vx', title: '水平速度时间曲线', x_label: '时间 (s)', y_label: '水平速度 (m/s)', grid: true, legend: false }, { type: 'time_series', x_axis: 't', y_axis: 'vy', title: '垂直速度时间曲线', x_label: '时间 (s)', y_label: '垂直速度 (m/s)', grid: true, legend: false });
                break;
            case 'free_fall':
                plots.push({ type: 'time_series', x_axis: 't', y_axis: 'y', title: '自由落体位移时间曲线', x_label: '时间 (s)', y_label: '高度 (m)', grid: true, legend: false }, { type: 'time_series', x_axis: 't', y_axis: 'vy', title: '自由落体速度时间曲线', x_label: '时间 (s)', y_label: '速度 (m/s)', grid: true, legend: false });
                break;
            case 'oscillation':
                plots.push({ type: 'time_series', x_axis: 't', y_axis: 'x', title: '简谐振动位移时间曲线', x_label: '时间 (s)', y_label: '位移 (m)', grid: true, legend: false }, { type: 'phase_space', x_axis: 'x', y_axis: 'v', title: '简谐振动相空间图', x_label: '位移 (m)', y_label: '速度 (m/s)', grid: true, legend: false });
                break;
        }
        return plots;
    };
    /**
     * 生成动画配置
     */
    PhysicsDslGenerator.prototype.generateAnimations = function (systemType, parsedQuestion) {
        var animations = [];
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
    };
    /**
     * 生成解题路径
     */
    PhysicsDslGenerator.prototype.generateSolutionPath = function (parsedQuestion) {
        if (!parsedQuestion.solutionPath) {
            return null;
        }
        return {
            steps: parsedQuestion.solutionPath.steps.map(function (step) { return ({
                id: step.id,
                type: step.type,
                module: step.module,
                action: step.action,
                inputs: step.inputs,
                outputs: step.outputs,
                formula: step.formula,
                order: step.order,
                description: step.description
            }); }),
            modules: parsedQuestion.solutionPath.modules,
            dependencies: parsedQuestion.solutionPath.dependencies.map(function (dep) { return ({
                from: dep.from,
                to: dep.to,
                parameter: dep.parameter,
                type: dep.type,
                reason: dep.reason
            }); }),
            execution_order: parsedQuestion.solutionPath.executionOrder,
            checkpoints: parsedQuestion.solutionPath.checkpoints
        };
    };
    /**
     * 生成求解目标
     */
    PhysicsDslGenerator.prototype.generateTarget = function (parsedQuestion) {
        if (!parsedQuestion.target) {
            return null;
        }
        return {
            primary: parsedQuestion.target.primary,
            secondary: parsedQuestion.target.secondary,
            method: parsedQuestion.target.method,
            priority: parsedQuestion.target.priority
        };
    };
    /**
     * 生成公式体系
     */
    PhysicsDslGenerator.prototype.generateFormulas = function (parsedQuestion) {
        if (!parsedQuestion.formulas) {
            return null;
        }
        return {
            primary: parsedQuestion.formulas.primary.map(function (formula) { return ({
                name: formula.name,
                expression: formula.expression,
                description: formula.description,
                type: formula.type,
                module: formula.module,
                variables: formula.variables
            }); }),
            intermediate: parsedQuestion.formulas.intermediate.map(function (formula) { return ({
                name: formula.name,
                expression: formula.expression,
                description: formula.description,
                type: formula.type,
                module: formula.module,
                variables: formula.variables
            }); }),
            verification: parsedQuestion.formulas.verification.map(function (formula) { return ({
                name: formula.name,
                expression: formula.expression,
                description: formula.description,
                type: formula.type,
                module: formula.module,
                variables: formula.variables
            }); })
        };
    };
    /**
     * 生成约束条件
     */
    PhysicsDslGenerator.prototype.generateConstraints = function (parsedQuestion) {
        if (!parsedQuestion.constraints) {
            return null;
        }
        return {
            initial: parsedQuestion.constraints.initial.map(function (constraint) { return ({
                type: constraint.type,
                description: constraint.description,
                expression: constraint.expression,
                parameters: constraint.parameters
            }); }),
            boundary: parsedQuestion.constraints.boundary.map(function (constraint) { return ({
                type: constraint.type,
                description: constraint.description,
                expression: constraint.expression,
                parameters: constraint.parameters
            }); }),
            physical: parsedQuestion.constraints.physical.map(function (constraint) { return ({
                type: constraint.type,
                description: constraint.description,
                expression: constraint.expression,
                parameters: constraint.parameters
            }); }),
            mathematical: parsedQuestion.constraints.mathematical.map(function (constraint) { return ({
                type: constraint.type,
                description: constraint.description,
                expression: constraint.expression,
                parameters: constraint.parameters
            }); })
        };
    };
    /**
     * 生成DSL元数据
     */
    PhysicsDslGenerator.prototype.generateDSLMetadata = function (parsedQuestion) {
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
    };
    /**
     * 评估复杂度
     */
    PhysicsDslGenerator.prototype.assessComplexity = function (parsedQuestion) {
        var parameterCount = parsedQuestion.parameters.length;
        var questionLength = parsedQuestion.question.length;
        if (parameterCount <= 5 && questionLength <= 100)
            return 'simple';
        if (parameterCount <= 10 && questionLength <= 200)
            return 'medium';
        return 'complex';
    };
    /**
     * 转换为 YAML 格式
     */
    PhysicsDslGenerator.prototype.convertToYAML = function (dsl) {
        // 这里实现 YAML 转换逻辑
        // 为了简化，先返回 JSON 格式
        return JSON.stringify(dsl, null, 2);
    };
    return PhysicsDslGenerator;
}());
exports.PhysicsDslGenerator = PhysicsDslGenerator;
// 导出默认实例
exports.physicsDSLGenerator = new PhysicsDslGenerator();
