"use strict";
/**
 * PhysicsContract → Matter.js 适配器
 *
 * 功能：
 * 1. 将AI解析的PhysicsContract转换为Matter.js世界
 * 2. 处理事件规则（粘连、动态约束等）
 * 3. 执行仿真并收集数据
 * 4. 输出给simulation层
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsContractAdapter = void 0;
exports.createPhysicsContractAdapter = createPhysicsContractAdapter;
exports.adaptPhysicsContract = adaptPhysicsContract;
const matter_js_1 = __importDefault(require("matter-js"));
/**
 * PhysicsContract → Matter.js 适配器主类
 */
class PhysicsContractAdapter {
    constructor() {
        this.bodies = new Map();
        this.constraints = new Map();
        this.eventRules = [];
        this.triggeredEvents = new Set();
        this.frameData = [];
        this.events = [];
        this.physicsMetrics = {
            totalEnergy: [],
            totalMomentum: [],
            collisionCount: 0
        };
        // 创建Matter.js引擎和世界
        this.engine = matter_js_1.default.Engine.create();
        this.world = this.engine.world;
        // 设置碰撞检测
        this.setupCollisionDetection();
    }
    /**
     * 将PhysicsContract转换为Matter.js世界
     */
    async adapt(contract) {
        try {
            // 1. 设置世界参数
            this.setupWorld(contract.world);
            // 2. 设置引擎参数
            this.setupEngine(contract.engine);
            // 3. 创建刚体
            this.createBodies(contract.bodies);
            // 4. 创建约束
            this.createConstraints(contract.constraints);
            // 5. 设置事件规则
            this.eventRules = contract.event_rules;
            this.endConditions = contract.end_conditions;
            // 6. 执行仿真
            const result = await this.runSimulation();
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * 设置世界参数
     */
    setupWorld(worldConfig) {
        // 设置重力
        this.engine.world.gravity.x = worldConfig.gravity[0];
        this.engine.world.gravity.y = worldConfig.gravity[1];
        // 设置边界（通过创建边界墙实现）
        this.createBoundaryWalls(worldConfig.bounds);
    }
    /**
     * 设置引擎参数
     */
    setupEngine(engineConfig) {
        // 设置时间步长
        this.engine.timing.timeScale = 1.0;
        // 设置迭代次数
        this.engine.positionIterations = engineConfig.positionIterations;
        this.engine.velocityIterations = engineConfig.velocityIterations;
    }
    /**
     * 创建边界墙
     */
    createBoundaryWalls(bounds) {
        const thickness = 0.1;
        const [minX, minY] = bounds.min;
        const [maxX, maxY] = bounds.max;
        // 创建四面墙
        const walls = [
            // 左墙
            matter_js_1.default.Bodies.rectangle(minX - thickness / 2, (minY + maxY) / 2, thickness, maxY - minY, { isStatic: true }),
            // 右墙
            matter_js_1.default.Bodies.rectangle(maxX + thickness / 2, (minY + maxY) / 2, thickness, maxY - minY, { isStatic: true }),
            // 上墙
            matter_js_1.default.Bodies.rectangle((minX + maxX) / 2, minY - thickness / 2, maxX - minX, thickness, { isStatic: true }),
            // 下墙
            matter_js_1.default.Bodies.rectangle((minX + maxX) / 2, maxY + thickness / 2, maxX - minX, thickness, { isStatic: true })
        ];
        matter_js_1.default.World.add(this.world, walls);
    }
    /**
     * 创建刚体
     */
    createBodies(bodiesConfig) {
        for (const bodyConfig of bodiesConfig) {
            let body;
            switch (bodyConfig.shape) {
                case 'box':
                    body = matter_js_1.default.Bodies.rectangle(bodyConfig.position[0], bodyConfig.position[1], bodyConfig.size.w, bodyConfig.size.h, {
                        isStatic: bodyConfig.isStatic,
                        angle: bodyConfig.angle,
                        mass: bodyConfig.mass,
                        friction: bodyConfig.friction,
                        frictionStatic: bodyConfig.frictionStatic,
                        restitution: bodyConfig.restitution,
                        collisionFilter: bodyConfig.collisionFilter
                    });
                    break;
                case 'circle':
                    body = matter_js_1.default.Bodies.circle(bodyConfig.position[0], bodyConfig.position[1], bodyConfig.r, {
                        isStatic: bodyConfig.isStatic,
                        angle: bodyConfig.angle,
                        mass: bodyConfig.mass,
                        friction: bodyConfig.friction,
                        frictionStatic: bodyConfig.frictionStatic,
                        restitution: bodyConfig.restitution,
                        collisionFilter: bodyConfig.collisionFilter
                    });
                    break;
                case 'polygon':
                    // 转换顶点格式为Matter.js格式
                    const vertices = bodyConfig.vertices.map(vertex => ({ x: vertex[0], y: vertex[1] }));
                    body = matter_js_1.default.Bodies.fromVertices(bodyConfig.position[0], bodyConfig.position[1], [vertices], {
                        isStatic: bodyConfig.isStatic,
                        angle: bodyConfig.angle,
                        mass: bodyConfig.mass,
                        friction: bodyConfig.friction,
                        frictionStatic: bodyConfig.frictionStatic,
                        restitution: bodyConfig.restitution,
                        collisionFilter: bodyConfig.collisionFilter
                    });
                    break;
                default:
                    throw new Error(`Unsupported body shape: ${bodyConfig.shape}`);
            }
            // 设置标签用于识别
            body.label = bodyConfig.id;
            // 存储到映射中
            this.bodies.set(bodyConfig.id, body);
            // 添加到世界
            matter_js_1.default.World.add(this.world, body);
        }
    }
    /**
     * 创建约束
     */
    createConstraints(constraintsConfig) {
        for (const constraintConfig of constraintsConfig) {
            if (constraintConfig.type === 'spring') {
                const bodyA = constraintConfig.a.body ? this.bodies.get(constraintConfig.a.body) : null;
                const bodyB = constraintConfig.b.body ? this.bodies.get(constraintConfig.b.body) : null;
                if (bodyA && bodyB) {
                    const constraint = matter_js_1.default.Constraint.create({
                        bodyA: bodyA,
                        bodyB: bodyB,
                        length: constraintConfig.length,
                        stiffness: constraintConfig.stiffness,
                        damping: constraintConfig.damping
                    });
                    this.constraints.set(constraintConfig.id, constraint);
                    matter_js_1.default.World.add(this.world, constraint);
                }
            }
        }
    }
    /**
     * 设置碰撞检测
     */
    setupCollisionDetection() {
        matter_js_1.default.Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (const pair of pairs) {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                // 记录碰撞事件
                this.events.push({
                    type: 'collision',
                    timestamp: this.engine.timing.timestamp,
                    participants: [bodyA.label, bodyB.label],
                    data: {
                        position: bodyA.position,
                        velocity: bodyA.velocity
                    }
                });
                // 增加碰撞计数
                this.physicsMetrics.collisionCount++;
                // 处理事件规则
                this.handleEventRules('collisionStart', bodyA.label, bodyB.label);
            }
        });
    }
    /**
     * 处理事件规则
     */
    handleEventRules(eventType, bodyA, bodyB) {
        for (const rule of this.eventRules) {
            if (rule.when.on === eventType &&
                ((rule.when.a === bodyA && rule.when.b === bodyB) ||
                    (rule.when.a === bodyB && rule.when.b === bodyA))) {
                // 检查是否已经触发过（once规则）
                const ruleKey = `${rule.when.on}_${rule.when.a}_${rule.when.b}`;
                if (rule.once && this.triggeredEvents.has(ruleKey)) {
                    continue;
                }
                // 执行动作
                for (const action of rule.do) {
                    this.executeAction(action);
                }
                // 标记为已触发
                this.triggeredEvents.add(ruleKey);
            }
        }
    }
    /**
     * 执行动作
     */
    executeAction(action) {
        switch (action.action) {
            case 'merge_bodies':
                this.mergeBodies(action.ids, action.newId);
                break;
            case 'attach_constraint':
                this.attachConstraint(action.constraint);
                break;
            case 'set_property':
                this.setProperty(action.id, action.prop, action.value);
                break;
        }
    }
    /**
     * 合并刚体
     */
    mergeBodies(ids, newId) {
        const bodiesToMerge = ids.map(id => this.bodies.get(id)).filter(Boolean);
        if (bodiesToMerge.length >= 2) {
            // 计算合并后的位置和速度
            const totalMass = bodiesToMerge.reduce((sum, body) => sum + body.mass, 0);
            const centerX = bodiesToMerge.reduce((sum, body) => sum + body.position.x * body.mass, 0) / totalMass;
            const centerY = bodiesToMerge.reduce((sum, body) => sum + body.position.y * body.mass, 0) / totalMass;
            const velocityX = bodiesToMerge.reduce((sum, body) => sum + body.velocity.x * body.mass, 0) / totalMass;
            const velocityY = bodiesToMerge.reduce((sum, body) => sum + body.velocity.y * body.mass, 0) / totalMass;
            // 移除原刚体
            for (const body of bodiesToMerge) {
                matter_js_1.default.World.remove(this.world, body);
                this.bodies.delete(body.label);
            }
            // 创建合并后的刚体
            const mergedBody = matter_js_1.default.Bodies.circle(centerX, centerY, 0.1, {
                mass: totalMass,
                friction: 0.1,
                frictionStatic: 0.1,
                restitution: 0.0
            });
            // 设置速度
            matter_js_1.default.Body.setVelocity(mergedBody, { x: velocityX, y: velocityY });
            // 设置标签
            mergedBody.label = newId;
            // 添加到世界和映射
            this.bodies.set(newId, mergedBody);
            matter_js_1.default.World.add(this.world, mergedBody);
            // 记录事件
            this.events.push({
                type: 'merge_bodies',
                timestamp: this.engine.timing.timestamp,
                participants: ids,
                data: { newId, position: [centerX, centerY], velocity: [velocityX, velocityY] }
            });
        }
    }
    /**
     * 附加约束
     */
    attachConstraint(constraintConfig) {
        const bodyA = this.bodies.get(constraintConfig.a.body);
        const bodyB = this.bodies.get(constraintConfig.b.body);
        if (bodyA && bodyB) {
            const constraint = matter_js_1.default.Constraint.create({
                bodyA: bodyA,
                bodyB: bodyB,
                length: constraintConfig.length,
                stiffness: constraintConfig.stiffness,
                damping: constraintConfig.damping
            });
            this.constraints.set(constraintConfig.id, constraint);
            matter_js_1.default.World.add(this.world, constraint);
            // 记录事件
            this.events.push({
                type: 'attach_constraint',
                timestamp: this.engine.timing.timestamp,
                participants: [constraintConfig.a.body, constraintConfig.b.body],
                data: { constraintId: constraintConfig.id }
            });
        }
    }
    /**
     * 设置属性
     */
    setProperty(bodyId, prop, value) {
        const body = this.bodies.get(bodyId);
        if (body) {
            body[prop] = value;
            // 记录事件
            this.events.push({
                type: 'set_property',
                timestamp: this.engine.timing.timestamp,
                participants: [bodyId],
                data: { prop, value }
            });
        }
    }
    /**
     * 运行仿真
     */
    async runSimulation() {
        const startTime = Date.now();
        const maxTime = this.endConditions.maxTime * 1000; // 转换为毫秒
        const dt = 16.67; // 60 FPS
        let currentTime = 0;
        let frameCount = 0;
        while (currentTime < maxTime) {
            // 更新物理引擎
            matter_js_1.default.Engine.update(this.engine, dt);
            // 记录帧数据
            const frameData = {
                timestamp: currentTime / 1000,
                bodies: Array.from(this.bodies.values()).map(body => ({
                    id: body.label,
                    position: [body.position.x, body.position.y],
                    velocity: [body.velocity.x, body.velocity.y],
                    angle: body.angle,
                    angularVelocity: body.angularVelocity
                })),
                events: this.events.filter(event => event.timestamp <= currentTime)
            };
            this.frameData.push(frameData);
            // 计算物理指标
            this.calculatePhysicsMetrics();
            // 检查结束条件
            if (this.checkEndConditions()) {
                break;
            }
            currentTime += dt;
            frameCount++;
            // 防止无限循环
            if (frameCount > 10000) {
                break;
            }
        }
        // 返回仿真结果
        return {
            frames: this.frameData,
            finalState: {
                bodies: Array.from(this.bodies.values()).map(body => ({
                    id: body.label,
                    position: [body.position.x, body.position.y],
                    velocity: [body.velocity.x, body.velocity.y],
                    angle: body.angle
                })),
                totalTime: currentTime / 1000,
                endReason: currentTime >= maxTime ? 'time_limit' : 'end_condition_met'
            },
            physicsMetrics: this.physicsMetrics
        };
    }
    /**
     * 计算物理指标
     */
    calculatePhysicsMetrics() {
        let totalEnergy = 0;
        let totalMomentum = 0;
        for (const body of this.bodies.values()) {
            if (!body.isStatic) {
                // 动能
                const kineticEnergy = 0.5 * body.mass * (body.velocity.x ** 2 + body.velocity.y ** 2);
                totalEnergy += kineticEnergy;
                // 动量
                const momentum = body.mass * Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                totalMomentum += momentum;
            }
        }
        this.physicsMetrics.totalEnergy.push(totalEnergy);
        this.physicsMetrics.totalMomentum.push(totalMomentum);
    }
    /**
     * 检查结束条件
     */
    checkEndConditions() {
        for (const condition of this.endConditions.stopWhen) {
            switch (condition.type) {
                case 'speedBelow':
                    const body = this.bodies.get(condition.id);
                    if (body) {
                        const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                        if (speed < (condition.v || 0.02)) {
                            return true;
                        }
                    }
                    break;
                case 'positionReached':
                    const targetBody = this.bodies.get(condition.id);
                    if (targetBody) {
                        const tol = condition.tol || 0.01;
                        if (condition.x !== undefined && Math.abs(targetBody.position.x - condition.x) < tol) {
                            return true;
                        }
                        if (condition.y !== undefined && Math.abs(targetBody.position.y - condition.y) < tol) {
                            return true;
                        }
                    }
                    break;
            }
        }
        return false;
    }
}
exports.PhysicsContractAdapter = PhysicsContractAdapter;
/**
 * 导出适配器工厂函数
 */
function createPhysicsContractAdapter() {
    return new PhysicsContractAdapter();
}
/**
 * 导出主要适配函数
 */
async function adaptPhysicsContract(contract) {
    const adapter = createPhysicsContractAdapter();
    return await adapter.adapt(contract);
}
