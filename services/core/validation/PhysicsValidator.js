"use strict";
/**
 * 物理验证器 - 验证仿真结果的物理合理性
 *
 * 功能：
 * 1. 守恒定律验证
 * 2. 物理约束检查
 * 3. 数值稳定性分析
 * 4. 物理合理性评估
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsValidator = void 0;
// 物理验证器类
class PhysicsValidator {
    constructor(config = {}) {
        this.config = {
            tolerance: {
                energy: 0.01, // 1%
                momentum: 0.01, // 1%
                angularMomentum: 0.01, // 1%
                mass: 0.001 // 0.1%
            },
            enableConservationChecks: true,
            enableConstraintChecks: true,
            enableStabilityChecks: true,
            enableCausalityChecks: true,
            ...config
        };
    }
    /**
     * 验证仿真结果
     */
    async validateSimulation(simulationResult, ir) {
        const result = {
            success: false,
            overallScore: 0,
            conservationChecks: [],
            constraintViolations: [],
            stabilityIssues: [],
            causalityViolations: [],
            recommendations: [],
            errors: [],
            warnings: []
        };
        try {
            console.log('🔍 Starting physics validation...');
            // 1. 守恒定律验证
            if (this.config.enableConservationChecks) {
                result.conservationChecks = await this.validateConservationLaws(simulationResult);
            }
            // 2. 物理约束检查
            if (this.config.enableConstraintChecks) {
                result.constraintViolations = await this.validatePhysicalConstraints(simulationResult, ir);
            }
            // 3. 数值稳定性分析
            if (this.config.enableStabilityChecks) {
                result.stabilityIssues = await this.validateNumericalStability(simulationResult);
            }
            // 4. 因果关系检查
            if (this.config.enableCausalityChecks) {
                result.causalityViolations = await this.validateCausality(simulationResult);
            }
            // 5. 计算总体分数
            result.overallScore = this.calculateOverallScore(result);
            // 6. 生成建议
            result.recommendations = this.generateRecommendations(result);
            // 7. 确定是否成功
            result.success = result.overallScore >= 0.8 && result.errors.length === 0;
            console.log(`✅ Physics validation completed. Score: ${result.overallScore.toFixed(2)}`);
        }
        catch (error) {
            result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.success = false;
        }
        return result;
    }
    /**
     * 验证守恒定律
     */
    async validateConservationLaws(simulationResult) {
        const checks = [];
        const timeSeries = simulationResult.timeSeries;
        if (timeSeries.length < 2) {
            return checks;
        }
        // 能量守恒检查
        const energyCheck = this.checkEnergyConservation(timeSeries);
        if (energyCheck)
            checks.push(energyCheck);
        // 动量守恒检查
        const momentumCheck = this.checkMomentumConservation(timeSeries);
        if (momentumCheck)
            checks.push(momentumCheck);
        // 角动量守恒检查
        const angularMomentumCheck = this.checkAngularMomentumConservation(timeSeries);
        if (angularMomentumCheck)
            checks.push(angularMomentumCheck);
        // 质量守恒检查
        const massCheck = this.checkMassConservation(timeSeries);
        if (massCheck)
            checks.push(massCheck);
        return checks;
    }
    /**
     * 检查能量守恒
     */
    checkEnergyConservation(timeSeries) {
        if (timeSeries.length < 2)
            return null;
        const initialEnergy = this.calculateTotalEnergy(timeSeries[0]);
        const finalEnergy = this.calculateTotalEnergy(timeSeries[timeSeries.length - 1]);
        const deviation = Math.abs(finalEnergy - initialEnergy);
        const deviationPercent = Math.abs(deviation) / Math.abs(initialEnergy);
        const passed = deviationPercent <= this.config.tolerance.energy;
        return {
            type: 'energy',
            initialValue: initialEnergy,
            finalValue: finalEnergy,
            deviation,
            deviationPercent,
            passed,
            tolerance: this.config.tolerance.energy
        };
    }
    /**
     * 计算总能量
     */
    calculateTotalEnergy(data) {
        let totalEnergy = 0;
        for (const obj of Object.values(data.objects)) {
            const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                Math.pow(obj.velocity.y, 2) +
                Math.pow(obj.velocity.z, 2));
            const kineticEnergy = 0.5 * obj.mass * speed * speed;
            const potentialEnergy = obj.mass * 9.8 * obj.position.y; // 重力势能
            totalEnergy += kineticEnergy + potentialEnergy;
        }
        return totalEnergy;
    }
    /**
     * 检查动量守恒
     */
    checkMomentumConservation(timeSeries) {
        if (timeSeries.length < 2)
            return null;
        const initialMomentum = this.calculateTotalMomentum(timeSeries[0]);
        const finalMomentum = this.calculateTotalMomentum(timeSeries[timeSeries.length - 1]);
        const deviation = Math.abs(finalMomentum - initialMomentum);
        const deviationPercent = Math.abs(deviation) / Math.abs(initialMomentum);
        const passed = deviationPercent <= this.config.tolerance.momentum;
        return {
            type: 'momentum',
            initialValue: initialMomentum,
            finalValue: finalMomentum,
            deviation,
            deviationPercent,
            passed,
            tolerance: this.config.tolerance.momentum
        };
    }
    /**
     * 计算总动量
     */
    calculateTotalMomentum(data) {
        let totalMomentum = 0;
        for (const obj of Object.values(data.objects)) {
            const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                Math.pow(obj.velocity.y, 2) +
                Math.pow(obj.velocity.z, 2));
            totalMomentum += obj.mass * speed;
        }
        return totalMomentum;
    }
    /**
     * 检查角动量守恒
     */
    checkAngularMomentumConservation(timeSeries) {
        if (timeSeries.length < 2)
            return null;
        const initialAngularMomentum = this.calculateTotalAngularMomentum(timeSeries[0]);
        const finalAngularMomentum = this.calculateTotalAngularMomentum(timeSeries[timeSeries.length - 1]);
        const deviation = Math.abs(finalAngularMomentum - initialAngularMomentum);
        const deviationPercent = Math.abs(deviation) / Math.abs(initialAngularMomentum);
        const passed = deviationPercent <= this.config.tolerance.angularMomentum;
        return {
            type: 'angular_momentum',
            initialValue: initialAngularMomentum,
            finalValue: finalAngularMomentum,
            deviation,
            deviationPercent,
            passed,
            tolerance: this.config.tolerance.angularMomentum
        };
    }
    /**
     * 计算总角动量
     */
    calculateTotalAngularMomentum(data) {
        let totalAngularMomentum = 0;
        for (const obj of Object.values(data.objects)) {
            // 简化的角动量计算
            const angularSpeed = Math.sqrt(Math.pow(obj.angularVelocity?.x || 0, 2) +
                Math.pow(obj.angularVelocity?.y || 0, 2) +
                Math.pow(obj.angularVelocity?.z || 0, 2));
            const momentOfInertia = obj.mass * 0.1; // 简化的转动惯量
            totalAngularMomentum += momentOfInertia * angularSpeed;
        }
        return totalAngularMomentum;
    }
    /**
     * 检查质量守恒
     */
    checkMassConservation(timeSeries) {
        if (timeSeries.length < 2)
            return null;
        const initialMass = this.calculateTotalMass(timeSeries[0]);
        const finalMass = this.calculateTotalMass(timeSeries[timeSeries.length - 1]);
        const deviation = Math.abs(finalMass - initialMass);
        const deviationPercent = Math.abs(deviation) / Math.abs(initialMass);
        const passed = deviationPercent <= this.config.tolerance.mass;
        return {
            type: 'mass',
            initialValue: initialMass,
            finalValue: finalMass,
            deviation,
            deviationPercent,
            passed,
            tolerance: this.config.tolerance.mass
        };
    }
    /**
     * 计算总质量
     */
    calculateTotalMass(data) {
        let totalMass = 0;
        for (const obj of Object.values(data.objects)) {
            totalMass += obj.mass;
        }
        return totalMass;
    }
    /**
     * 验证物理约束
     */
    async validatePhysicalConstraints(simulationResult, ir) {
        const violations = [];
        const timeSeries = simulationResult.timeSeries;
        // 检查速度约束
        for (const data of timeSeries) {
            for (const [objectId, obj] of Object.entries(data.objects)) {
                const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                    Math.pow(obj.velocity.y, 2) +
                    Math.pow(obj.velocity.z, 2));
                if (speed > 1000) { // 光速的1/300000
                    violations.push(`Object ${objectId} exceeds speed limit at time ${data.time}`);
                }
            }
        }
        // 检查位置约束
        for (const data of timeSeries) {
            for (const [objectId, obj] of Object.entries(data.objects)) {
                if (isNaN(obj.position.x) || isNaN(obj.position.y) || isNaN(obj.position.z)) {
                    violations.push(`Object ${objectId} has invalid position at time ${data.time}`);
                }
            }
        }
        return violations;
    }
    /**
     * 验证数值稳定性
     */
    async validateNumericalStability(simulationResult) {
        const issues = [];
        const timeSeries = simulationResult.timeSeries;
        // 检查时间步长稳定性
        if (timeSeries.length > 1) {
            const timeSteps = [];
            for (let i = 1; i < timeSeries.length; i++) {
                timeSteps.push(timeSeries[i].time - timeSeries[i - 1].time);
            }
            const avgTimeStep = timeSteps.reduce((sum, dt) => sum + dt, 0) / timeSteps.length;
            const maxTimeStep = Math.max(...timeSteps);
            const minTimeStep = Math.min(...timeSteps);
            if (maxTimeStep > avgTimeStep * 10) {
                issues.push('Large time step variations detected');
            }
            if (minTimeStep < avgTimeStep * 0.1) {
                issues.push('Very small time steps detected');
            }
        }
        // 检查数值发散
        for (const data of timeSeries) {
            for (const [objectId, obj] of Object.entries(data.objects)) {
                if (!isFinite(obj.position.x) || !isFinite(obj.position.y) || !isFinite(obj.position.z)) {
                    issues.push(`Object ${objectId} position diverged at time ${data.time}`);
                }
                if (!isFinite(obj.velocity.x) || !isFinite(obj.velocity.y) || !isFinite(obj.velocity.z)) {
                    issues.push(`Object ${objectId} velocity diverged at time ${data.time}`);
                }
            }
        }
        return issues;
    }
    /**
     * 验证因果关系
     */
    async validateCausality(simulationResult) {
        const violations = [];
        const timeSeries = simulationResult.timeSeries;
        // 检查时间顺序
        for (let i = 1; i < timeSeries.length; i++) {
            if (timeSeries[i].time <= timeSeries[i - 1].time) {
                violations.push(`Time sequence violation at index ${i}`);
            }
        }
        // 检查物理因果关系
        for (let i = 1; i < timeSeries.length; i++) {
            const prev = timeSeries[i - 1];
            const curr = timeSeries[i];
            for (const [objectId, currObj] of Object.entries(curr.objects)) {
                const prevObj = prev.objects[objectId];
                if (prevObj) {
                    // 检查位置变化的合理性
                    const displacement = Math.sqrt(Math.pow(currObj.position.x - prevObj.position.x, 2) +
                        Math.pow(currObj.position.y - prevObj.position.y, 2) +
                        Math.pow(currObj.position.z - prevObj.position.z, 2));
                    const timeDiff = curr.time - prev.time;
                    const maxDisplacement = Math.sqrt(Math.pow(prevObj.velocity.x, 2) +
                        Math.pow(prevObj.velocity.y, 2) +
                        Math.pow(prevObj.velocity.z, 2)) * timeDiff * 2; // 允许2倍的最大可能位移
                    if (displacement > maxDisplacement) {
                        violations.push(`Object ${objectId} moved too far in time step at ${curr.time}`);
                    }
                }
            }
        }
        return violations;
    }
    /**
     * 计算总体分数
     */
    calculateOverallScore(result) {
        let score = 1.0;
        // 守恒定律检查
        const conservationScore = result.conservationChecks.length > 0
            ? result.conservationChecks.filter(check => check.passed).length / result.conservationChecks.length
            : 1.0;
        score *= conservationScore;
        // 约束违反
        if (result.constraintViolations.length > 0) {
            score *= Math.max(0, 1 - result.constraintViolations.length * 0.1);
        }
        // 稳定性问题
        if (result.stabilityIssues.length > 0) {
            score *= Math.max(0, 1 - result.stabilityIssues.length * 0.1);
        }
        // 因果关系违反
        if (result.causalityViolations.length > 0) {
            score *= Math.max(0, 1 - result.causalityViolations.length * 0.2);
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * 生成建议
     */
    generateRecommendations(result) {
        const recommendations = [];
        // 守恒定律建议
        const failedConservation = result.conservationChecks.filter(check => !check.passed);
        if (failedConservation.length > 0) {
            recommendations.push('Consider reducing time step size for better conservation');
            recommendations.push('Check for energy dissipation mechanisms');
        }
        // 约束违反建议
        if (result.constraintViolations.length > 0) {
            recommendations.push('Review physical constraints and boundary conditions');
            recommendations.push('Check for numerical instabilities');
        }
        // 稳定性建议
        if (result.stabilityIssues.length > 0) {
            recommendations.push('Use adaptive time stepping');
            recommendations.push('Consider using more stable numerical methods');
        }
        // 因果关系建议
        if (result.causalityViolations.length > 0) {
            recommendations.push('Check time step size and integration method');
            recommendations.push('Verify initial conditions');
        }
        return recommendations;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.PhysicsValidator = PhysicsValidator;
