"use strict";
/**
 * 事件检测器 - 检测仿真过程中的物理事件
 *
 * 功能：
 * 1. 碰撞检测
 * 2. 分离检测
 * 3. 状态变化检测
 * 4. 边界穿越检测
 * 5. 自定义事件检测
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDetector = exports.CustomEventDetector = exports.StateChangeDetector = exports.CollisionDetector = void 0;
// 碰撞事件检测器
class CollisionDetector {
    async detectEvents(oldState, newState, ir) {
        const events = [];
        // 检测物体间碰撞
        const collisionEvents = this.detectObjectCollisions(oldState, newState, ir);
        events.push(...collisionEvents);
        // 检测边界碰撞
        const boundaryEvents = this.detectBoundaryCollisions(oldState, newState, ir);
        events.push(...boundaryEvents);
        return events;
    }
    detectObjectCollisions(oldState, newState, ir) {
        const events = [];
        const objects = ir.system.objects || [];
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const obj1 = objects[i];
                const obj2 = objects[j];
                if (this.checkCollision(obj1, obj2, oldState, newState)) {
                    events.push({
                        id: `collision_${obj1.name}_${obj2.name}_${newState.time}`,
                        type: 'collision',
                        time: newState.time,
                        description: `Collision between ${obj1.name} and ${obj2.name}`,
                        parameters: new Map([
                            ['object1', obj1.name],
                            ['object2', obj2.name],
                            ['position1', JSON.stringify(this.getObjectPosition(obj1, newState))],
                            ['position2', JSON.stringify(this.getObjectPosition(obj2, newState))],
                            ['velocity1', JSON.stringify(this.getObjectVelocity(obj1, newState))],
                            ['velocity2', JSON.stringify(this.getObjectVelocity(obj2, newState))]
                        ]),
                        severity: 'high'
                    });
                }
            }
        }
        return events;
    }
    detectBoundaryCollisions(oldState, newState, ir) {
        const events = [];
        const objects = ir.system.objects || [];
        const constraints = ir.system.constraints || [];
        for (const obj of objects) {
            for (const constraint of constraints) {
                if (constraint.type === 'boundary' && this.checkBoundaryCollision(obj, constraint, oldState, newState)) {
                    events.push({
                        id: `boundary_collision_${obj.name}_${newState.time}`,
                        type: 'boundary_crossing',
                        time: newState.time,
                        description: `${obj.name} collided with boundary`,
                        parameters: new Map([
                            ['object', obj.name],
                            ['boundary', constraint.expression],
                            ['position', JSON.stringify(this.getObjectPosition(obj, newState))],
                            ['velocity', JSON.stringify(this.getObjectVelocity(obj, newState))]
                        ]),
                        severity: 'medium'
                    });
                }
            }
        }
        return events;
    }
    checkCollision(obj1, obj2, oldState, newState) {
        // 简化的碰撞检测 - 检查距离
        const pos1 = this.getObjectPosition(obj1, newState);
        const pos2 = this.getObjectPosition(obj2, newState);
        const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2));
        const radius1 = obj1.properties?.radius || 0.5;
        const radius2 = obj2.properties?.radius || 0.5;
        return distance <= (radius1 + radius2);
    }
    checkBoundaryCollision(obj, constraint, oldState, newState) {
        // 简化的边界碰撞检测
        const position = this.getObjectPosition(obj, newState);
        // 检查是否超出边界
        if (constraint.expression.includes('x >')) {
            const boundary = parseFloat(constraint.expression.split('x >')[1]);
            return position.x > boundary;
        }
        else if (constraint.expression.includes('x <')) {
            const boundary = parseFloat(constraint.expression.split('x <')[1]);
            return position.x < boundary;
        }
        else if (constraint.expression.includes('y >')) {
            const boundary = parseFloat(constraint.expression.split('y >')[1]);
            return position.y > boundary;
        }
        else if (constraint.expression.includes('y <')) {
            const boundary = parseFloat(constraint.expression.split('y <')[1]);
            return position.y < boundary;
        }
        return false;
    }
    getObjectPosition(obj, state) {
        return {
            x: state.variables.get(`${obj.name}_x`) || 0,
            y: state.variables.get(`${obj.name}_y`) || 0,
            z: state.variables.get(`${obj.name}_z`) || 0
        };
    }
    getObjectVelocity(obj, state) {
        return {
            x: state.variables.get(`${obj.name}_vx`) || 0,
            y: state.variables.get(`${obj.name}_vy`) || 0,
            z: state.variables.get(`${obj.name}_vz`) || 0
        };
    }
}
exports.CollisionDetector = CollisionDetector;
// 状态变化检测器
class StateChangeDetector {
    async detectEvents(oldState, newState, ir) {
        const events = [];
        // 检测速度方向变化
        const velocityEvents = this.detectVelocityDirectionChanges(oldState, newState, ir);
        events.push(...velocityEvents);
        // 检测加速度变化
        const accelerationEvents = this.detectAccelerationChanges(oldState, newState, ir);
        events.push(...accelerationEvents);
        // 检测能量变化
        const energyEvents = this.detectEnergyChanges(oldState, newState, ir);
        events.push(...energyEvents);
        return events;
    }
    detectVelocityDirectionChanges(oldState, newState, ir) {
        const events = [];
        const objects = ir.system.objects || [];
        for (const obj of objects) {
            const oldVel = this.getObjectVelocity(obj, oldState);
            const newVel = this.getObjectVelocity(obj, newState);
            // 检查速度方向是否发生显著变化
            const oldMagnitude = Math.sqrt(oldVel.x ** 2 + oldVel.y ** 2 + oldVel.z ** 2);
            const newMagnitude = Math.sqrt(newVel.x ** 2 + newVel.y ** 2 + newVel.z ** 2);
            if (oldMagnitude > 0.1 && newMagnitude > 0.1) {
                const dotProduct = oldVel.x * newVel.x + oldVel.y * newVel.y + oldVel.z * newVel.z;
                const cosAngle = dotProduct / (oldMagnitude * newMagnitude);
                // 如果角度变化超过90度
                if (cosAngle < 0) {
                    events.push({
                        id: `velocity_direction_change_${obj.name}_${newState.time}`,
                        type: 'state_change',
                        time: newState.time,
                        description: `${obj.name} velocity direction changed significantly`,
                        parameters: new Map([
                            ['object', obj.name],
                            ['old_velocity', JSON.stringify(oldVel)],
                            ['new_velocity', JSON.stringify(newVel)],
                            ['angle_change', (Math.acos(Math.abs(cosAngle)) * 180 / Math.PI).toString()]
                        ]),
                        severity: 'medium'
                    });
                }
            }
        }
        return events;
    }
    detectAccelerationChanges(oldState, newState, ir) {
        const events = [];
        const objects = ir.system.objects || [];
        for (const obj of objects) {
            const oldAcc = this.getObjectAcceleration(obj, oldState);
            const newAcc = this.getObjectAcceleration(obj, newState);
            const oldMagnitude = Math.sqrt(oldAcc.x ** 2 + oldAcc.y ** 2 + oldAcc.z ** 2);
            const newMagnitude = Math.sqrt(newAcc.x ** 2 + newAcc.y ** 2 + newAcc.z ** 2);
            // 检测加速度的显著变化
            if (Math.abs(newMagnitude - oldMagnitude) > 0.1) {
                events.push({
                    id: `acceleration_change_${obj.name}_${newState.time}`,
                    type: 'state_change',
                    time: newState.time,
                    description: `${obj.name} acceleration changed significantly`,
                    parameters: new Map([
                        ['object', obj.name],
                        ['old_acceleration', JSON.stringify(oldAcc)],
                        ['new_acceleration', JSON.stringify(newAcc)],
                        ['magnitude_change', (newMagnitude - oldMagnitude).toString()]
                    ]),
                    severity: 'low'
                });
            }
        }
        return events;
    }
    detectEnergyChanges(oldState, newState, ir) {
        const events = [];
        const oldEnergy = this.calculateTotalEnergy(oldState);
        const newEnergy = this.calculateTotalEnergy(newState);
        // 检测能量显著变化（可能是非弹性碰撞或其他能量转换）
        const energyChange = Math.abs(newEnergy - oldEnergy);
        if (energyChange > 0.1 && oldEnergy > 0.1) {
            events.push({
                id: `energy_change_${newState.time}`,
                type: 'state_change',
                time: newState.time,
                description: `System energy changed significantly`,
                parameters: new Map([
                    ['old_energy', oldEnergy],
                    ['new_energy', newEnergy],
                    ['energy_change', newEnergy - oldEnergy],
                    ['relative_change', energyChange / oldEnergy]
                ]),
                severity: 'high'
            });
        }
        return events;
    }
    getObjectVelocity(obj, state) {
        return {
            x: state.variables.get(`${obj.name}_vx`) || 0,
            y: state.variables.get(`${obj.name}_vy`) || 0,
            z: state.variables.get(`${obj.name}_vz`) || 0
        };
    }
    getObjectAcceleration(obj, state) {
        return {
            x: state.variables.get(`${obj.name}_ax`) || 0,
            y: state.variables.get(`${obj.name}_ay`) || 0,
            z: state.variables.get(`${obj.name}_az`) || 0
        };
    }
    calculateTotalEnergy(state) {
        let totalEnergy = 0;
        // 简化的总能量计算
        const objects = ['object1', 'object2']; // 假设有两个物体
        for (const objName of objects) {
            const m = state.variables.get(`${objName}_m`) || 1;
            const vx = state.variables.get(`${objName}_vx`) || 0;
            const vy = state.variables.get(`${objName}_vy`) || 0;
            const vz = state.variables.get(`${objName}_vz`) || 0;
            const h = state.variables.get(`${objName}_h`) || 0;
            const g = state.variables.get('g') || 9.8;
            const kinetic = 0.5 * m * (vx * vx + vy * vy + vz * vz);
            const potential = m * g * h;
            totalEnergy += kinetic + potential;
        }
        return totalEnergy;
    }
}
exports.StateChangeDetector = StateChangeDetector;
// 自定义事件检测器
class CustomEventDetector {
    async detectEvents(oldState, newState, ir) {
        const events = [];
        // 检测自定义约束违反
        const constraintEvents = this.detectConstraintViolations(oldState, newState, ir);
        events.push(...constraintEvents);
        // 检测阈值事件
        const thresholdEvents = this.detectThresholdEvents(oldState, newState, ir);
        events.push(...thresholdEvents);
        return events;
    }
    detectConstraintViolations(oldState, newState, ir) {
        const events = [];
        const constraints = ir.system.constraints || [];
        for (const constraint of constraints) {
            if (constraint.type === 'physical') {
                const isViolated = this.evaluateConstraint(constraint, newState);
                if (isViolated) {
                    events.push({
                        id: `constraint_violation_${constraint.expression}_${newState.time}`,
                        type: 'custom',
                        time: newState.time,
                        description: `Constraint violated: ${constraint.expression}`,
                        parameters: new Map([
                            ['constraint', constraint.expression],
                            ['tolerance', (constraint.tolerance || 0.01).toString()],
                            ['priority', constraint.priority || 'medium']
                        ]),
                        severity: constraint.priority === 'important' ? 'high' : 'medium'
                    });
                }
            }
        }
        return events;
    }
    detectThresholdEvents(oldState, newState, ir) {
        const events = [];
        // 检测速度阈值
        const velocityThreshold = 10.0; // m/s
        const objects = ir.system.objects || [];
        for (const obj of objects) {
            const velocity = this.getObjectVelocity(obj, newState);
            const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
            if (speed > velocityThreshold) {
                events.push({
                    id: `high_speed_${obj.name}_${newState.time}`,
                    type: 'custom',
                    time: newState.time,
                    description: `${obj.name} reached high speed`,
                    parameters: new Map([
                        ['object', obj.name],
                        ['speed', speed.toString()],
                        ['threshold', velocityThreshold.toString()]
                    ]),
                    severity: 'low'
                });
            }
        }
        return events;
    }
    evaluateConstraint(constraint, state) {
        // 简化的约束求值
        try {
            const expression = constraint.expression;
            let evaluatedExpression = expression;
            // 替换变量
            for (const [variable, value] of state.variables) {
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                evaluatedExpression = evaluatedExpression.replace(regex, value.toString());
            }
            // 简单的表达式求值
            const result = this.safeEval(evaluatedExpression);
            const tolerance = constraint.tolerance || 0.01;
            return Math.abs(result) > tolerance;
        }
        catch (error) {
            console.warn(`Constraint evaluation failed: ${constraint.expression}`, error);
            return false;
        }
    }
    getObjectVelocity(obj, state) {
        return {
            x: state.variables.get(`${obj.name}_vx`) || 0,
            y: state.variables.get(`${obj.name}_vy`) || 0,
            z: state.variables.get(`${obj.name}_vz`) || 0
        };
    }
    safeEval(expression) {
        const cleanExpression = expression
            .replace(/[^0-9+\-*/.() ]/g, '')
            .replace(/\^/g, '**');
        try {
            return Function(`"use strict"; return (${cleanExpression})`)();
        }
        catch (error) {
            return 0;
        }
    }
}
exports.CustomEventDetector = CustomEventDetector;
// 主事件检测器类
class EventDetector {
    constructor() {
        this.detectors = [
            new CollisionDetector(),
            new StateChangeDetector(),
            new CustomEventDetector()
        ];
    }
    /**
     * 检测所有事件
     */
    async detectEvents(oldState, newState, ir) {
        const allEvents = [];
        for (const detector of this.detectors) {
            try {
                const events = await detector.detectEvents(oldState, newState, ir);
                allEvents.push(...events);
            }
            catch (error) {
                console.warn(`Event detection failed:`, error);
            }
        }
        // 按时间排序
        allEvents.sort((a, b) => a.time - b.time);
        return allEvents;
    }
    /**
     * 添加自定义检测器
     */
    addDetector(detector) {
        this.detectors.push(detector);
    }
    /**
     * 移除检测器
     */
    removeDetector(detector) {
        const index = this.detectors.indexOf(detector);
        if (index > -1) {
            this.detectors.splice(index, 1);
        }
    }
    /**
     * 获取所有检测器
     */
    getDetectors() {
        return [...this.detectors];
    }
}
exports.EventDetector = EventDetector;
