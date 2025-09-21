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

import { PhysicsIR, IRConstraint, IRModule } from '../ir/PhysicsIR';
import { SimulationEvent, TimeSeriesData } from './DynamicPhysicsSimulator';

// 定义SimulationState类型
type SimulationState = TimeSeriesData;

// 事件检测器接口
export interface EventDetectorInterface {
  detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]>;
}

// 碰撞事件检测器
export class CollisionDetector implements EventDetectorInterface {
  async detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]> {
    const events: SimulationEvent[] = [];
    
    // 获取所有对象
    const objects = Object.values(newState.objects);
    
    // 检查每对对象之间的碰撞
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];
        
        if (this.checkCollision(obj1, obj2, oldState, newState)) {
          events.push({
            time: newState.time,
            type: 'collision',
            objectId: `obj_${i}_${j}`,
            description: `Collision detected between objects`,
            data: {
              object1: obj1,
              object2: obj2,
              collisionPoint: this.calculateCollisionPoint(obj1, obj2),
              relativeVelocity: this.calculateRelativeVelocity(obj1, obj2)
            }
          });
        }
      }
    }
    
    return events;
  }

  private checkCollision(obj1: any, obj2: any, oldState: SimulationState, newState: SimulationState): boolean {
    // 简化的碰撞检测逻辑
    const pos1 = obj1.position;
    const pos2 = obj2.position;
    
    const distance = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2) + 
      Math.pow(pos1.z - pos2.z, 2)
    );
    
    const radius1 = obj1.radius || 0.5;
    const radius2 = obj2.radius || 0.5;
    
    return distance <= (radius1 + radius2);
  }

  private calculateCollisionPoint(obj1: any, obj2: any): { x: number; y: number; z: number } {
    // 简化的碰撞点计算
    return {
      x: (obj1.position.x + obj2.position.x) / 2,
      y: (obj1.position.y + obj2.position.y) / 2,
      z: (obj1.position.z + obj2.position.z) / 2
    };
  }

  private calculateRelativeVelocity(obj1: any, obj2: any): { x: number; y: number; z: number } {
    return {
      x: obj1.velocity.x - obj2.velocity.x,
      y: obj1.velocity.y - obj2.velocity.y,
      z: obj1.velocity.z - obj2.velocity.z
    };
  }
}

// 边界检测器
export class BoundaryDetector implements EventDetectorInterface {
  async detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]> {
    const events: SimulationEvent[] = [];
    
    // 检查每个对象是否穿越边界
    for (const [objectId, obj] of Object.entries(newState.objects)) {
      if (this.checkBoundaryCrossing(obj, oldState.objects[objectId])) {
        events.push({
          time: newState.time,
          type: 'boundary',
          objectId: objectId,
          description: `Object ${objectId} crossed boundary`,
          data: {
            object: obj,
            boundary: 'default_boundary',
            crossingPoint: obj.position
          }
        });
      }
    }
    
    return events;
  }

  private checkBoundaryCrossing(currentObj: any, previousObj: any): boolean {
    if (!previousObj) return false;
    
    // 简化的边界检测 - 检查是否超出某个范围
    const boundary = 10; // 假设边界为10单位
    const currentDistance = Math.sqrt(
      Math.pow(currentObj.position.x, 2) + 
      Math.pow(currentObj.position.y, 2) + 
      Math.pow(currentObj.position.z, 2)
    );
    const previousDistance = Math.sqrt(
      Math.pow(previousObj.position.x, 2) + 
      Math.pow(previousObj.position.y, 2) + 
      Math.pow(previousObj.position.z, 2)
    );
    
    return currentDistance > boundary && previousDistance <= boundary;
  }
}

// 阈值检测器
export class ThresholdDetector implements EventDetectorInterface {
  async detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]> {
    const events: SimulationEvent[] = [];
    
    // 检查速度阈值
    for (const [objectId, obj] of Object.entries(newState.objects)) {
      const speed = Math.sqrt(
        Math.pow(obj.velocity.x, 2) + 
        Math.pow(obj.velocity.y, 2) + 
        Math.pow(obj.velocity.z, 2)
      );
      
      if (speed > 10) { // 速度阈值
        events.push({
          time: newState.time,
          type: 'threshold',
          objectId: objectId,
          description: `Object ${objectId} exceeded speed threshold`,
          data: {
            object: obj,
            threshold: 'speed',
            value: speed,
            limit: 10
          }
        });
      }
    }
    
    return events;
  }
}

// 平衡检测器
export class EquilibriumDetector implements EventDetectorInterface {
  async detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]> {
    const events: SimulationEvent[] = [];
    
    // 检查对象是否达到平衡状态
    for (const [objectId, obj] of Object.entries(newState.objects)) {
      const speed = Math.sqrt(
        Math.pow(obj.velocity.x, 2) + 
        Math.pow(obj.velocity.y, 2) + 
        Math.pow(obj.velocity.z, 2)
      );
      
      if (speed < 0.01) { // 接近静止
        events.push({
          time: newState.time,
          type: 'equilibrium',
          objectId: objectId,
          description: `Object ${objectId} reached equilibrium`,
          data: {
            object: obj,
            equilibriumType: 'static',
            speed: speed
          }
        });
      }
    }
    
    return events;
  }
}

// 不稳定性检测器
export class InstabilityDetector implements EventDetectorInterface {
  async detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]> {
    const events: SimulationEvent[] = [];
    
    // 检查数值不稳定性
    for (const [objectId, obj] of Object.entries(newState.objects)) {
      const acceleration = Math.sqrt(
        Math.pow(obj.acceleration.x, 2) + 
        Math.pow(obj.acceleration.y, 2) + 
        Math.pow(obj.acceleration.z, 2)
      );
      
      if (acceleration > 100) { // 异常大的加速度
        events.push({
          time: newState.time,
          type: 'instability',
          objectId: objectId,
          description: `Object ${objectId} shows numerical instability`,
          data: {
            object: obj,
            instabilityType: 'high_acceleration',
            acceleration: acceleration
          }
        });
      }
    }
    
    return events;
  }
}

// 主事件检测器 - 组合所有检测器
export class EventDetector implements EventDetectorInterface {
  private detectors: EventDetectorInterface[];

  constructor() {
    this.detectors = [
      new CollisionDetector(),
      new BoundaryDetector(),
      new ThresholdDetector(),
      new EquilibriumDetector(),
      new InstabilityDetector()
    ];
  }

  async detectEvents(
    oldState: SimulationState, 
    newState: SimulationState, 
    ir: PhysicsIR
  ): Promise<SimulationEvent[]> {
    const allEvents: SimulationEvent[] = [];
    
    // 运行所有检测器
    for (const detector of this.detectors) {
      try {
        const events = await detector.detectEvents(oldState, newState, ir);
        allEvents.push(...events);
      } catch (error) {
        console.warn(`Event detector failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // 按时间排序
    allEvents.sort((a, b) => a.time - b.time);
    
    return allEvents;
  }
}