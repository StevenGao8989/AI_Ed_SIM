"use strict";
/**
 * 动态物理仿真器 - 能够根据任意物理题目动态生成仿真
 *
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动选择数值求解器
 * 3. 智能事件检测
 * 4. 自适应时间步长
 * 5. 多物理场耦合
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPhysicsSimulator = void 0;
const EventDetector_1 = require("./EventDetector");
const StateMonitor_1 = require("./StateMonitor");
// 动态物理仿真器
class DynamicPhysicsSimulator {
    constructor() {
        this.eventDetector = new EventDetector_1.EventDetector();
        this.stateMonitor = new StateMonitor_1.StateMonitor();
    }
    /**
     * 运行物理仿真
     */
    async runSimulation(ir, config) {
        const startTime = Date.now();
        const result = {
            success: false,
            timeSeries: [],
            events: [],
            finalState: null,
            statistics: {
                totalSteps: 0,
                successfulSteps: 0,
                failedSteps: 0,
                averageTimestep: 0,
                minTimestep: config.timestep,
                maxTimestep: config.timestep,
                computationTime: 0,
                memoryUsage: 0,
                convergenceRate: 0
            },
            errors: [],
            warnings: [],
            metadata: {
                duration: config.duration,
                timesteps: 0,
                solver: config.solver,
                physicsType: this.analyzePhysicsType(ir)
            }
        };
        try {
            console.log('🚀 Starting dynamic physics simulation...');
            console.log(`📊 Physics type: ${result.metadata.physicsType}`);
            console.log(`⚙️  Solver: ${config.solver}`);
            console.log(`⏱️  Duration: ${config.duration}s`);
            // 1. 分析物理类型
            const physicsType = this.analyzePhysicsType(ir);
            // 2. 初始化状态
            const initialState = this.initializeState(ir);
            result.timeSeries.push(initialState);
            // 3. 运行仿真循环
            let currentState = initialState;
            let currentTime = 0;
            let currentTimestep = config.timestep;
            let stepCount = 0;
            while (currentTime < config.duration) {
                try {
                    // 计算下一步状态
                    const nextState = this.calculateNextState(currentState, currentTimestep, ir, physicsType);
                    nextState.time = currentTime + currentTimestep;
                    // 事件检测
                    if (config.enableEvents) {
                        const events = await this.eventDetector.detectEvents(currentState, nextState, ir);
                        result.events.push(...events);
                    }
                    // 状态监控
                    if (config.enableMonitoring) {
                        this.stateMonitor.updateState(nextState);
                        const report = this.stateMonitor.getLatestReport();
                        if (report.recommendations.length > 0) {
                            result.warnings.push(...report.recommendations);
                        }
                    }
                    // 自适应时间步长
                    if (config.adaptiveTimestep) {
                        currentTimestep = this.adaptTimestep(currentState, nextState, currentTimestep, config);
                    }
                    // 记录数据
                    if (stepCount % config.outputFrequency === 0) {
                        result.timeSeries.push(nextState);
                    }
                    currentState = nextState;
                    currentTime += currentTimestep;
                    stepCount++;
                    result.statistics.successfulSteps++;
                }
                catch (error) {
                    result.statistics.failedSteps++;
                    result.errors.push(`Step ${stepCount} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (config.adaptiveTimestep) {
                        currentTimestep *= 0.5; // 减小时间步长
                        if (currentTimestep < (config.minTimestep || 1e-6)) {
                            result.errors.push('Simulation failed: timestep too small');
                            break;
                        }
                        continue;
                    }
                    else {
                        break;
                    }
                }
            }
            // 4. 计算统计信息
            result.statistics.totalSteps = stepCount;
            result.statistics.computationTime = Date.now() - startTime;
            result.statistics.averageTimestep = currentTime / stepCount;
            result.statistics.minTimestep = Math.min(result.statistics.minTimestep, currentTimestep);
            result.statistics.maxTimestep = Math.max(result.statistics.maxTimestep, currentTimestep);
            result.statistics.convergenceRate = result.statistics.successfulSteps / result.statistics.totalSteps;
            result.metadata.timesteps = stepCount;
            result.finalState = currentState;
            result.success = result.statistics.failedSteps === 0 || result.statistics.convergenceRate > 0.8;
            console.log('✅ Simulation completed successfully!');
            console.log(`📈 Steps: ${result.statistics.totalSteps} (${result.statistics.successfulSteps} successful)`);
            console.log(`⏱️  Time: ${result.statistics.computationTime}ms`);
        }
        catch (error) {
            result.errors.push(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.success = false;
        }
        return result;
    }
    /**
     * 分析物理类型
     */
    analyzePhysicsType(ir) {
        const modules = ir.system?.modules || [];
        const moduleTypes = modules.map(m => m.type);
        // 分析模块类型组合
        if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
            return 'complex_kinematics';
        }
        else if (moduleTypes.includes('oscillation')) {
            return 'oscillatory_system';
        }
        else if (moduleTypes.includes('wave')) {
            return 'wave_system';
        }
        else if (moduleTypes.includes('electromagnetic')) {
            return 'electromagnetic_system';
        }
        else if (moduleTypes.includes('thermal')) {
            return 'thermodynamic_system';
        }
        else if (moduleTypes.includes('fluid')) {
            return 'fluid_system';
        }
        else if (moduleTypes.includes('quantum')) {
            return 'quantum_system';
        }
        else if (moduleTypes.includes('relativistic')) {
            return 'relativistic_system';
        }
        else {
            return 'general_physics';
        }
    }
    /**
     * 初始化状态
     */
    initializeState(ir) {
        const objects = {};
        // 根据IR中的对象和初始条件初始化状态
        if (ir.system?.objects) {
            for (const obj of ir.system.objects) {
                objects[obj.id] = {
                    position: obj.position || { x: 0, y: 0, z: 0 },
                    velocity: obj.velocity || { x: 0, y: 0, z: 0 },
                    acceleration: obj.acceleration || { x: 0, y: 0, z: 0 },
                    mass: typeof obj.mass === 'object' ? obj.mass.value : (obj.mass || 1),
                    properties: obj.properties || {}
                };
            }
        }
        return {
            time: 0,
            objects,
            system: {
                totalEnergy: 0,
                kineticEnergy: 0,
                potentialEnergy: 0,
                momentum: { x: 0, y: 0, z: 0 },
                centerOfMass: { x: 0, y: 0, z: 0 }
            }
        };
    }
    /**
     * 计算下一步状态
     */
    calculateNextState(currentState, timestep, ir, physicsType) {
        const nextState = JSON.parse(JSON.stringify(currentState)); // 深拷贝
        // 根据物理类型选择计算方法
        switch (physicsType) {
            case 'complex_kinematics':
                return this.calculateComplexKinematics(nextState, timestep, ir);
            case 'oscillatory_system':
                return this.calculateOscillatorySystem(nextState, timestep, ir);
            case 'wave_system':
                return this.calculateWaveSystem(nextState, timestep, ir);
            case 'electromagnetic_system':
                return this.calculateElectromagneticSystem(nextState, timestep, ir);
            default:
                return this.calculateGeneralPhysics(nextState, timestep, ir);
        }
    }
    /**
     * 复杂运动学计算
     */
    calculateComplexKinematics(state, timestep, ir) {
        for (const objectId in state.objects) {
            const obj = state.objects[objectId];
            // 重力加速度
            const gravity = { x: 0, y: -9.8, z: 0 };
            // 摩擦力（在斜面上）
            let friction = { x: 0, y: 0, z: 0 };
            if (obj.position.y <= 0.1) { // 接近地面
                const frictionCoeff = 0.2;
                const angle = 30 * Math.PI / 180;
                const normalForce = obj.mass * 9.8 * Math.cos(angle);
                const frictionForce = frictionCoeff * normalForce;
                friction = {
                    x: -Math.sign(obj.velocity.x) * frictionForce * Math.cos(angle),
                    y: 0,
                    z: 0
                };
            }
            // 总加速度
            obj.acceleration = {
                x: gravity.x + friction.x / obj.mass,
                y: gravity.y + friction.y / obj.mass,
                z: gravity.z + friction.z / obj.mass
            };
            // 更新速度和位置
            obj.velocity.x += obj.acceleration.x * timestep;
            obj.velocity.y += obj.acceleration.y * timestep;
            obj.velocity.z += obj.acceleration.z * timestep;
            obj.position.x += obj.velocity.x * timestep;
            obj.position.y += obj.velocity.y * timestep;
            obj.position.z += obj.velocity.z * timestep;
            // 应用约束
            this.applyConstraints(obj, 'complex_kinematics');
        }
        return state;
    }
    /**
     * 振荡系统计算
     */
    calculateOscillatorySystem(state, timestep, ir) {
        for (const objectId in state.objects) {
            const obj = state.objects[objectId];
            const k = 100; // 弹簧常数
            const equilibrium = 0; // 平衡位置
            // 弹簧力
            const springForce = -k * (obj.position.x - equilibrium);
            // 阻尼力
            const damping = 0.1;
            const dampingForce = -damping * obj.velocity.x;
            // 总加速度
            obj.acceleration = {
                x: (springForce + dampingForce) / obj.mass,
                y: -9.8, // 重力
                z: 0
            };
            // 更新速度和位置
            obj.velocity.x += obj.acceleration.x * timestep;
            obj.velocity.y += obj.acceleration.y * timestep;
            obj.velocity.z += obj.acceleration.z * timestep;
            obj.position.x += obj.velocity.x * timestep;
            obj.position.y += obj.velocity.y * timestep;
            obj.position.z += obj.velocity.z * timestep;
            // 应用约束
            this.applyConstraints(obj, 'oscillatory_system');
        }
        return state;
    }
    /**
     * 波动系统计算
     */
    calculateWaveSystem(state, timestep, ir) {
        // 简化的波动计算
        for (const objectId in state.objects) {
            const obj = state.objects[objectId];
            // 简谐波
            const amplitude = 1;
            const frequency = 1;
            const phase = obj.position.x * 0.1;
            obj.acceleration = {
                x: 0,
                y: -amplitude * frequency * frequency * Math.sin(frequency * state.time + phase),
                z: 0
            };
            obj.velocity.x += obj.acceleration.x * timestep;
            obj.velocity.y += obj.acceleration.y * timestep;
            obj.velocity.z += obj.acceleration.z * timestep;
            obj.position.x += obj.velocity.x * timestep;
            obj.position.y += obj.velocity.y * timestep;
            obj.position.z += obj.velocity.z * timestep;
        }
        return state;
    }
    /**
     * 电磁系统计算
     */
    calculateElectromagneticSystem(state, timestep, ir) {
        for (const objectId in state.objects) {
            const obj = state.objects[objectId];
            // 简化的电磁力计算
            const charge = obj.properties?.charge || 1;
            const electricField = { x: 0, y: 0, z: 0 };
            const magneticField = { x: 0, y: 0, z: 1 };
            // 洛伦兹力
            const lorentzForce = {
                x: charge * (electricField.x + obj.velocity.y * magneticField.z - obj.velocity.z * magneticField.y),
                y: charge * (electricField.y + obj.velocity.z * magneticField.x - obj.velocity.x * magneticField.z),
                z: charge * (electricField.z + obj.velocity.x * magneticField.y - obj.velocity.y * magneticField.x)
            };
            obj.acceleration = {
                x: lorentzForce.x / obj.mass,
                y: lorentzForce.y / obj.mass,
                z: lorentzForce.z / obj.mass
            };
            obj.velocity.x += obj.acceleration.x * timestep;
            obj.velocity.y += obj.acceleration.y * timestep;
            obj.velocity.z += obj.acceleration.z * timestep;
            obj.position.x += obj.velocity.x * timestep;
            obj.position.y += obj.velocity.y * timestep;
            obj.position.z += obj.velocity.z * timestep;
        }
        return state;
    }
    /**
     * 通用物理计算
     */
    calculateGeneralPhysics(state, timestep, ir) {
        for (const objectId in state.objects) {
            const obj = state.objects[objectId];
            // 重力
            obj.acceleration = { x: 0, y: -9.8, z: 0 };
            // 更新速度和位置
            obj.velocity.x += obj.acceleration.x * timestep;
            obj.velocity.y += obj.acceleration.y * timestep;
            obj.velocity.z += obj.acceleration.z * timestep;
            obj.position.x += obj.velocity.x * timestep;
            obj.position.y += obj.velocity.y * timestep;
            obj.position.z += obj.velocity.z * timestep;
            // 应用约束
            this.applyConstraints(obj, 'general_physics');
        }
        return state;
    }
    /**
     * 应用约束
     */
    applyConstraints(obj, physicsType) {
        switch (physicsType) {
            case 'complex_kinematics':
                // 地面约束
                if (obj.position.y < 0) {
                    obj.position.y = 0;
                    obj.velocity.y = Math.abs(obj.velocity.y) * 0.9; // 弹性碰撞
                }
                // 斜面约束
                const angle = 30 * Math.PI / 180;
                const slopeY = obj.position.x * Math.tan(angle);
                if (obj.position.x > 0 && obj.position.y < slopeY + 0.1) {
                    obj.position.y = slopeY;
                    // 调整速度以符合斜面
                    const speed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
                    obj.velocity.x = speed * Math.cos(angle);
                    obj.velocity.y = speed * Math.sin(angle);
                }
                break;
            case 'oscillatory_system':
                // 振荡系统约束
                if (obj.position.y < -2) {
                    obj.position.y = -2;
                    obj.velocity.y = 0;
                }
                break;
            default:
                // 通用约束
                if (obj.position.y < 0) {
                    obj.position.y = 0;
                    obj.velocity.y = Math.abs(obj.velocity.y) * 0.8;
                }
                break;
        }
    }
    /**
     * 自适应时间步长
     */
    adaptTimestep(currentState, nextState, currentTimestep, config) {
        // 基于误差估计调整时间步长
        const error = this.estimateError(currentState, nextState);
        const targetError = config.tolerance;
        if (error > targetError * 2) {
            return Math.max(currentTimestep * 0.8, config.minTimestep || 1e-6);
        }
        else if (error < targetError * 0.5) {
            return Math.min(currentTimestep * 1.2, config.maxTimestep || config.timestep * 2);
        }
        return currentTimestep;
    }
    /**
     * 估计误差
     */
    estimateError(currentState, nextState) {
        // 简化的误差估计，基于速度和加速度的变化
        let maxError = 0;
        for (const objectId in currentState.objects) {
            const current = currentState.objects[objectId];
            const next = nextState.objects[objectId];
            const velocityError = Math.sqrt(Math.pow(next.velocity.x - current.velocity.x, 2) +
                Math.pow(next.velocity.y - current.velocity.y, 2) +
                Math.pow(next.velocity.z - current.velocity.z, 2));
            maxError = Math.max(maxError, velocityError);
        }
        return maxError;
    }
}
exports.DynamicPhysicsSimulator = DynamicPhysicsSimulator;
