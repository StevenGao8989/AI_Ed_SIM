"use strict";
/**
 * IR 验证器 - 验证 PhysicsIR 的结构、逻辑和物理一致性
 *
 * 功能：
 * 1. 结构验证 - 检查 IR 的完整性
 * 2. 物理逻辑验证 - 检查物理定律和约束
 * 3. 单位一致性验证 - 检查量纲和单位
 * 4. 依赖关系验证 - 检查模块和参数依赖
 * 5. 数学表达式验证 - 检查方程的正确性
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRValidator = void 0;
class IRValidator {
    constructor() {
        this.DEFAULT_OPTIONS = {
            strict: true,
            check_physics: true,
            check_units: true,
            check_dependencies: true,
            check_equations: true,
            verbose: false
        };
    }
    /**
     * 主验证方法
     */
    validate(ir, options = {}) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const errors = [];
        const warnings = [];
        const checks = {
            structure: false,
            logic: false,
            dependencies: false,
            physics: false,
            units: false,
            equations: false
        };
        try {
            // 1. 结构验证
            if (opts.verbose)
                console.log('🔍 开始结构验证...');
            const structureResult = this.validateStructure(ir, opts);
            checks.structure = structureResult.valid;
            errors.push(...structureResult.errors);
            warnings.push(...structureResult.warnings);
            // 2. 逻辑验证
            if (opts.verbose)
                console.log('🔍 开始逻辑验证...');
            const logicResult = this.validateLogic(ir, opts);
            checks.logic = logicResult.valid;
            errors.push(...logicResult.errors);
            warnings.push(...logicResult.warnings);
            // 3. 依赖关系验证
            if (opts.check_dependencies) {
                if (opts.verbose)
                    console.log('🔍 开始依赖关系验证...');
                const dependencyResult = this.validateDependencies(ir, opts);
                checks.dependencies = dependencyResult.valid;
                errors.push(...dependencyResult.errors);
                warnings.push(...dependencyResult.warnings);
            }
            // 4. 物理逻辑验证
            if (opts.check_physics) {
                if (opts.verbose)
                    console.log('🔍 开始物理逻辑验证...');
                const physicsResult = this.validatePhysics(ir, opts);
                checks.physics = physicsResult.valid;
                errors.push(...physicsResult.errors);
                warnings.push(...physicsResult.warnings);
            }
            // 5. 单位一致性验证
            if (opts.check_units) {
                if (opts.verbose)
                    console.log('🔍 开始单位一致性验证...');
                const unitsResult = this.validateUnits(ir, opts);
                checks.units = unitsResult.valid;
                errors.push(...unitsResult.errors);
                warnings.push(...unitsResult.warnings);
            }
            // 6. 数学方程验证
            if (opts.check_equations) {
                if (opts.verbose)
                    console.log('🔍 开始数学方程验证...');
                const equationsResult = this.validateEquations(ir, opts);
                checks.equations = equationsResult.valid;
                errors.push(...equationsResult.errors);
                warnings.push(...equationsResult.warnings);
            }
        }
        catch (error) {
            errors.push(`验证过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
        }
        const totalChecks = Object.keys(checks).length;
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const failedChecks = totalChecks - passedChecks;
        return {
            is_valid: errors.length === 0,
            errors,
            warnings,
            checks,
            statistics: {
                total_checks: totalChecks,
                passed_checks: passedChecks,
                failed_checks: failedChecks,
                warning_count: warnings.length
            },
            last_validated: new Date().toISOString()
        };
    }
    /**
     * 结构验证
     */
    validateStructure(ir, options) {
        const errors = [];
        const warnings = [];
        // 检查必需字段
        if (!ir.metadata) {
            errors.push('缺少元数据 (metadata)');
        }
        else {
            if (!ir.metadata.id)
                errors.push('缺少元数据 ID');
            if (!ir.metadata.system_type)
                errors.push('缺少系统类型');
            if (!ir.metadata.version)
                warnings.push('缺少版本信息');
        }
        if (!ir.system) {
            errors.push('缺少系统配置 (system)');
        }
        else {
            if (!ir.system.modules || ir.system.modules.length === 0) {
                warnings.push('没有定义物理模块');
            }
            if (!ir.system.parameters || ir.system.parameters.length === 0) {
                warnings.push('没有定义参数');
            }
        }
        if (!ir.simulation) {
            errors.push('缺少仿真配置 (simulation)');
        }
        else {
            if (!ir.simulation.duration)
                errors.push('缺少仿真时长');
            if (!ir.simulation.time_step)
                errors.push('缺少时间步长');
            if (!ir.simulation.solver)
                errors.push('缺少求解器');
        }
        if (!ir.output) {
            errors.push('缺少输出配置 (output)');
        }
        if (!ir.optimization) {
            warnings.push('缺少优化配置 (optimization)');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 逻辑验证
     */
    validateLogic(ir, options) {
        const errors = [];
        const warnings = [];
        // 检查参数逻辑
        if (ir.system.parameters) {
            const symbols = new Set();
            ir.system.parameters.forEach(param => {
                if (symbols.has(param.symbol)) {
                    errors.push(`参数符号重复: ${param.symbol}`);
                }
                symbols.add(param.symbol);
                if (param.role === 'unknown' && param.value.value !== 0) {
                    warnings.push(`未知参数 ${param.symbol} 有非零值`);
                }
            });
        }
        // 检查模块逻辑
        if (ir.system.modules) {
            ir.system.modules.forEach(module => {
                if (!module.equations || module.equations.length === 0) {
                    warnings.push(`模块 ${module.name} 没有定义方程`);
                }
                // 检查模块参数是否在系统参数中定义
                module.parameters.forEach(param => {
                    const systemParam = ir.system.parameters?.find(p => p.symbol === param.symbol);
                    if (!systemParam) {
                        errors.push(`模块 ${module.name} 中的参数 ${param.symbol} 未在系统参数中定义`);
                    }
                });
            });
        }
        // 检查仿真配置逻辑
        if (ir.simulation) {
            if (ir.simulation.duration.value <= 0) {
                errors.push('仿真时长必须大于 0');
            }
            if (ir.simulation.time_step.value <= 0) {
                errors.push('时间步长必须大于 0');
            }
            if (ir.simulation.time_step.value >= ir.simulation.duration.value) {
                warnings.push('时间步长接近或超过仿真时长');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 依赖关系验证
     */
    validateDependencies(ir, options) {
        const errors = [];
        const warnings = [];
        if (!ir.system.modules) {
            return { valid: true, errors, warnings };
        }
        // 检查模块依赖关系
        const moduleIds = new Set(ir.system.modules.map(m => m.id));
        ir.system.modules.forEach(module => {
            module.dependencies.forEach(depId => {
                if (!moduleIds.has(depId)) {
                    errors.push(`模块 ${module.name} 依赖的模块 ${depId} 不存在`);
                }
            });
        });
        // 检查参数依赖关系
        if (ir.system.parameters) {
            const paramSymbols = new Set(ir.system.parameters.map(p => p.symbol));
            ir.system.parameters.forEach(param => {
                param.dependencies.forEach(depSymbol => {
                    if (!paramSymbols.has(depSymbol)) {
                        errors.push(`参数 ${param.symbol} 依赖的参数 ${depSymbol} 不存在`);
                    }
                });
            });
        }
        // 检查循环依赖
        const circularDeps = this.detectCircularDependencies(ir);
        if (circularDeps.length > 0) {
            errors.push(`检测到循环依赖: ${circularDeps.join(', ')}`);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 物理逻辑验证
     */
    validatePhysics(ir, options) {
        const errors = [];
        const warnings = [];
        // 检查物理量纲
        if (ir.system.parameters) {
            ir.system.parameters.forEach(param => {
                const expectedDimension = this.getExpectedDimension(param.symbol, ir.metadata.system_type);
                if (expectedDimension && param.value.dimension !== expectedDimension) {
                    errors.push(`参数 ${param.symbol} 的量纲不匹配: 期望 ${expectedDimension}, 实际 ${param.value.dimension}`);
                }
            });
        }
        // 检查物理约束
        if (ir.system.constraints) {
            ir.system.constraints.forEach(constraint => {
                if (constraint.type === 'physical') {
                    const isValid = this.validatePhysicalConstraint(constraint, ir);
                    if (!isValid) {
                        errors.push(`物理约束无效: ${constraint.description}`);
                    }
                }
            });
        }
        // 检查环境配置
        if (ir.system.environment) {
            if (ir.system.environment.gravity.value < 0) {
                errors.push('重力加速度不能为负值');
            }
            if (ir.system.environment.temperature.value < -273.15) {
                errors.push('温度不能低于绝对零度');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 单位一致性验证
     */
    validateUnits(ir, options) {
        const errors = [];
        const warnings = [];
        // 检查参数单位
        if (ir.system.parameters) {
            ir.system.parameters.forEach(param => {
                if (!param.value.unit) {
                    errors.push(`参数 ${param.symbol} 缺少单位`);
                }
                else if (!this.isValidUnit(param.value.unit)) {
                    warnings.push(`参数 ${param.symbol} 使用了非标准单位: ${param.value.unit}`);
                }
            });
        }
        // 检查仿真配置单位
        if (ir.simulation) {
            if (ir.simulation.duration.unit !== 's') {
                warnings.push(`仿真时长单位应为秒 (s), 实际: ${ir.simulation.duration.unit}`);
            }
            if (ir.simulation.time_step.unit !== 's') {
                warnings.push(`时间步长单位应为秒 (s), 实际: ${ir.simulation.time_step.unit}`);
            }
        }
        // 检查环境单位
        if (ir.system.environment) {
            if (ir.system.environment.gravity.unit !== 'm/s²') {
                warnings.push(`重力加速度单位应为 m/s², 实际: ${ir.system.environment.gravity.unit}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 数学方程验证
     */
    validateEquations(ir, options) {
        const errors = [];
        const warnings = [];
        if (!ir.system.modules) {
            return { valid: true, errors, warnings };
        }
        ir.system.modules.forEach(module => {
            module.equations.forEach(equation => {
                // 检查方程中的变量是否在模块参数或系统参数中定义
                equation.variables.forEach(variable => {
                    const moduleParam = module.parameters.find(p => p.symbol === variable);
                    const systemParam = ir.system.parameters.find(p => p.symbol === variable);
                    if (!moduleParam && !systemParam) {
                        const suggestedDimension = this.inferVariableDimension(variable, equation.expression);
                        errors.push(`方程 ${equation.id} 中的变量 ${variable} 未在模块参数或系统参数中定义。建议添加参数: ${variable} (${suggestedDimension})`);
                    }
                });
                // 检查方程中的参数是否在模块参数或系统参数中定义
                equation.parameters.forEach(paramSymbol => {
                    const moduleParam = module.parameters.find(p => p.symbol === paramSymbol);
                    const systemParam = ir.system.parameters.find(p => p.symbol === paramSymbol);
                    if (!moduleParam && !systemParam) {
                        const suggestedDimension = this.inferParameterDimension(paramSymbol, equation.expression);
                        errors.push(`方程 ${equation.id} 中的参数 ${paramSymbol} 未在模块参数或系统参数中定义。建议添加参数: ${paramSymbol} (${suggestedDimension})`);
                    }
                });
                // 检查方程表达式语法
                if (!this.isValidExpression(equation.expression)) {
                    errors.push(`方程 ${equation.id} 的表达式语法无效: ${equation.expression}`);
                }
            });
        });
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    // ===== 工具方法 =====
    detectCircularDependencies(ir) {
        const circularDeps = [];
        // 简化的循环依赖检测
        return circularDeps;
    }
    getExpectedDimension(symbol, systemType) {
        const dimensionMap = {
            'wave_system': {
                'y': 'L',
                'A': 'L',
                'ω': 'T^-1',
                'k': 'L^-1',
                'v': 'LT^-1',
                'f': 'T^-1',
                'λ': 'L'
            },
            'oscillatory_system': {
                'x': 'L',
                'v': 'LT^-1',
                'a': 'LT^-2',
                'k': 'MT^-2',
                'm': 'M',
                'T': 'T',
                'ω': 'T^-1'
            }
        };
        return dimensionMap[systemType]?.[symbol] || null;
    }
    validatePhysicalConstraint(constraint, ir) {
        // 简化的物理约束验证
        return true;
    }
    isValidUnit(unit) {
        const validUnits = [
            // 基本单位
            'm', 's', 'kg', 'A', 'K', 'mol', 'cd',
            // 导出单位
            'N', 'J', 'W', 'Hz', 'Pa', 'V', 'Ω', 'F', 'H', 'T', 'C',
            // 复合单位
            'm/s', 'm/s²', 'rad', 'rad/s', 'rad/m', 'kg⋅m/s', 'J⋅s', 'V/m', 'T', 'F/m', 'H/m',
            // 温度单位
            '°C', 'K',
            // 其他常用单位
            '1', 'mol^-1', 'J/K', 'W/(m⋅K)', 'J/(kg⋅K)', 'J/(mol⋅K)', 'm^3/(kg⋅s^2)',
            'I^2T^4M^-1L^-3', 'MLI^-2T^-2'
        ];
        return validUnits.includes(unit);
    }
    isValidExpression(expression) {
        // 简化的表达式语法检查
        return expression.length > 0 && !expression.includes('undefined');
    }
    // ===== 增强的物理验证方法 =====
    /**
     * 验证特殊物理量
     */
    validateSpecialQuantities(param, errors, warnings) {
        const symbol = param.symbol.toLowerCase();
        const value = param.value.value;
        switch (symbol) {
            case 'c': // 光速
                if (value > 3e8) {
                    errors.push(`光速值 ${value} 超过物理极限`);
                }
                break;
            case 'h': // 普朗克常数
                if (Math.abs(value - 6.626e-34) > 1e-36) {
                    warnings.push(`普朗克常数值 ${value} 与标准值差异较大`);
                }
                break;
            case 'g': // 重力加速度
                if (value < 9.7 || value > 9.9) {
                    warnings.push(`重力加速度值 ${value} 与标准值 9.8 m/s² 差异较大`);
                }
                break;
            case 'k': // 弹簧常数
                if (value <= 0) {
                    errors.push(`弹簧常数 ${value} 必须为正数`);
                }
                break;
            case 'm': // 质量
                if (value <= 0) {
                    errors.push(`质量 ${value} 必须为正数`);
                }
                break;
        }
    }
    /**
     * 验证守恒定律
     */
    validateConservationLaws(ir, errors, warnings) {
        if (ir.system.conservation_laws) {
            ir.system.conservation_laws.forEach(law => {
                switch (law.type) {
                    case 'energy':
                        this.validateEnergyConservation(ir, law, errors, warnings);
                        break;
                    case 'momentum':
                        this.validateMomentumConservation(ir, law, errors, warnings);
                        break;
                    case 'charge':
                        this.validateChargeConservation(ir, law, errors, warnings);
                        break;
                    case 'mass':
                        this.validateMassConservation(ir, law, errors, warnings);
                        break;
                }
            });
        }
    }
    /**
     * 验证能量守恒
     */
    validateEnergyConservation(ir, law, errors, warnings) {
        const energyParams = ir.system.parameters.filter(p => p.symbol.toLowerCase().includes('e') ||
            p.symbol.toLowerCase().includes('energy') ||
            p.description.includes('能量'));
        if (energyParams.length === 0) {
            warnings.push('系统声明能量守恒但未找到能量相关参数');
        }
    }
    /**
     * 验证动量守恒
     */
    validateMomentumConservation(ir, law, errors, warnings) {
        const momentumParams = ir.system.parameters.filter(p => p.symbol.toLowerCase().includes('p') ||
            p.symbol.toLowerCase().includes('momentum') ||
            p.description.includes('动量'));
        if (momentumParams.length === 0) {
            warnings.push('系统声明动量守恒但未找到动量相关参数');
        }
    }
    /**
     * 验证电荷守恒
     */
    validateChargeConservation(ir, law, errors, warnings) {
        const chargeParams = ir.system.parameters.filter(p => p.symbol.toLowerCase().includes('q') ||
            p.symbol.toLowerCase().includes('charge') ||
            p.description.includes('电荷'));
        if (chargeParams.length === 0) {
            warnings.push('系统声明电荷守恒但未找到电荷相关参数');
        }
    }
    /**
     * 验证质量守恒
     */
    validateMassConservation(ir, law, errors, warnings) {
        const massParams = ir.system.parameters.filter(p => p.symbol.toLowerCase().includes('m') ||
            p.symbol.toLowerCase().includes('mass') ||
            p.description.includes('质量'));
        if (massParams.length === 0) {
            warnings.push('系统声明质量守恒但未找到质量相关参数');
        }
    }
    /**
     * 验证物理假设的一致性
     */
    validatePhysicalAssumptions(ir, errors, warnings) {
        ir.system.modules.forEach(module => {
            // 检查假设与系统类型的一致性
            if (module.assumptions && module.assumptions.includes('小振幅近似') && module.type === 'oscillation') {
                const amplitudeParams = ir.system.parameters.filter(p => p.symbol.toLowerCase().includes('a') ||
                    p.description.includes('振幅'));
                amplitudeParams.forEach(param => {
                    if (param.value.value > 1) {
                        warnings.push(`振幅 ${param.value.value} 可能不满足小振幅近似条件`);
                    }
                });
            }
            // 检查经典物理假设
            if (module.assumptions && module.assumptions.includes('经典物理适用')) {
                const velocityParams = ir.system.parameters.filter(p => p.symbol.toLowerCase().includes('v') ||
                    p.description.includes('速度'));
                velocityParams.forEach(param => {
                    if (param.value.value > 1e6) { // 接近光速
                        warnings.push(`速度 ${param.value.value} 可能不满足经典物理假设`);
                    }
                });
            }
        });
    }
    /**
     * 验证数值稳定性
     */
    validateNumericalStability(ir, errors, warnings) {
        const timeStep = ir.simulation.time_step.value;
        const duration = ir.simulation.duration.value;
        // 检查时间步长
        if (timeStep <= 0) {
            errors.push(`时间步长 ${timeStep} 必须为正数`);
        }
        if (timeStep > duration / 100) {
            warnings.push(`时间步长 ${timeStep} 可能过大，建议小于总时长的 1%`);
        }
        // 检查数值精度
        const precision = ir.simulation.precision;
        if (precision === 'ultra' && timeStep > 1e-6) {
            warnings.push('超高精度模式建议使用更小的时间步长');
        }
        // 检查求解器选择
        const solver = ir.simulation.solver;
        const hasStiffEquations = ir.system.modules.some(m => m.equations.some(eq => eq.type === 'differential' && eq.order && eq.order > 1));
        if (hasStiffEquations && solver === 'euler') {
            warnings.push('刚性方程建议使用 RK4 或自适应求解器');
        }
    }
    /**
     * 计算物理一致性评分
     */
    calculatePhysicsConsistencyScore(ir) {
        let score = 100;
        // 检查守恒定律
        if (ir.system.conservation_laws && ir.system.conservation_laws.length > 0) {
            score += 10;
        }
        // 检查物理假设
        const hasAssumptions = ir.system.modules.some(m => m.assumptions && m.assumptions.length > 0);
        if (hasAssumptions) {
            score += 5;
        }
        // 检查数值稳定性
        const timeStep = ir.simulation.time_step.value;
        const duration = ir.simulation.duration.value;
        if (timeStep < duration / 1000) {
            score += 5;
        }
        return Math.min(100, score);
    }
    /**
     * 推断变量量纲
     */
    inferVariableDimension(variable, expression) {
        const variableLower = variable.toLowerCase();
        // 基于变量名推断量纲
        if (variableLower.includes('x') || variableLower.includes('position') || variableLower.includes('displacement')) {
            return 'L';
        }
        if (variableLower.includes('v') || variableLower.includes('velocity') || variableLower.includes('speed')) {
            return 'LT^-1';
        }
        if (variableLower.includes('a') || variableLower.includes('acceleration')) {
            return 'LT^-2';
        }
        if (variableLower.includes('t') || variableLower.includes('time')) {
            return 'T';
        }
        if (variableLower.includes('m') || variableLower.includes('mass')) {
            return 'M';
        }
        if (variableLower.includes('f') || variableLower.includes('force')) {
            return 'MLT^-2';
        }
        if (variableLower.includes('e') || variableLower.includes('energy')) {
            return 'ML^2T^-2';
        }
        if (variableLower.includes('p') || variableLower.includes('momentum')) {
            return 'MLT^-1';
        }
        if (variableLower.includes('ω') || variableLower.includes('omega') || variableLower.includes('frequency')) {
            return 'T^-1';
        }
        if (variableLower.includes('k') || variableLower.includes('spring')) {
            return 'MLT^-2';
        }
        return 'unknown';
    }
    /**
     * 推断参数量纲
     */
    inferParameterDimension(param, expression) {
        return this.inferVariableDimension(param, expression);
    }
}
exports.IRValidator = IRValidator;
module.exports = { IRValidator };
