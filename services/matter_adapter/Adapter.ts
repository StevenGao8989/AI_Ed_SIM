/**
 * PhysicsContract → Matter.js 适配器
 * 
 * 功能：
 * 1. 将AI解析的PhysicsContract转换为Matter.js世界
 * 2. 处理事件规则（粘连、动态约束等）
 * 3. 执行仿真并收集数据
 * 4. 输出给simulation层
 */

import Matter from 'matter-js';

// PhysicsContract 类型定义
export interface PhysicsContract {
  world: {
    coord: 'xy_y_down';
    units: {
      length: string;
      time: string;
      mass: string;
      angle: string;
    };
    gravity: [number, number];
    bounds: {
      min: [number, number];
      max: [number, number];
    };
  };
  engine: {
    dt: number;
    substeps: number;
    positionIterations: number;
    velocityIterations: number;
  };
  bodies: Array<{
    id: string;
    shape: 'box' | 'circle' | 'polygon';
    isStatic: boolean;
    position: [number, number];
    angle: number;
    size?: { w: number; h: number };
    r?: number;
    vertices?: Array<[number, number]>;
    mass?: number;
    density?: number | null;
    friction: number;
    frictionStatic: number;
    restitution: number;
    collisionFilter: {
      category: number;
      mask: number;
      group: number;
    };
  }>;
  constraints: Array<{
    id: string;
    type: 'spring';
    a: { body: string | null; point: null };
    b: { body: string | null; point: null };
    length: number;
    stiffness: number;
    damping: number;
  }>;
  event_rules: Array<{
    when: {
      on: 'collisionStart' | 'collisionActive' | 'time' | 'position';
      a: string;
      b: string;
    };
    do: Array<{
      action: 'merge_bodies' | 'attach_constraint' | 'set_property';
      ids?: string[];
      newId?: string;
      constraint?: any;
      id?: string;
      prop?: string;
      value?: any;
    }>;
    once: boolean;
  }>;
  end_conditions: {
    maxTime: number;
    stopWhen: Array<{
      type: 'speedBelow' | 'positionReached' | 'collisionOnce';
      id: string;
      v?: number;
      hold?: number;
      x?: number;
      y?: number;
      tol?: number;
    }>;
  };
}

// 仿真结果类型
export interface SimulationResult {
  success: boolean;
  data?: {
    frames: Array<{
      timestamp: number;
      bodies: Array<{
        id: string;
        position: [number, number];
        velocity: [number, number];
        angle: number;
        angularVelocity: number;
      }>;
      events: Array<{
        type: string;
        timestamp: number;
        participants: string[];
        data?: any;
      }>;
    }>;
    finalState: {
      bodies: Array<{
        id: string;
        position: [number, number];
        velocity: [number, number];
        angle: number;
      }>;
      totalTime: number;
      endReason: string;
    };
    physicsMetrics: {
      totalEnergy: number[];
      totalMomentum: number[];
      collisionCount: number;
    };
  };
  error?: string;
}

/**
 * PhysicsContract → Matter.js 适配器主类
 */
export class PhysicsContractAdapter {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Map<string, Matter.Body> = new Map();
  private constraints: Map<string, Matter.Constraint> = new Map();
  private eventRules: Array<any> = [];
  private endConditions: any;
  private triggeredEvents: Set<string> = new Set();
  private frameData: Array<any> = [];
  private events: Array<any> = [];
  private physicsMetrics: {
    totalEnergy: number[];
    totalMomentum: number[];
    collisionCount: number;
  } = {
    totalEnergy: [],
    totalMomentum: [],
    collisionCount: 0
  };

  constructor() {
    // 创建Matter.js引擎和世界
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    // 设置碰撞检测
    this.setupCollisionDetection();
  }

  /**
   * 将PhysicsContract转换为Matter.js世界
   */
  async adapt(contract: PhysicsContract): Promise<SimulationResult> {
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
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 设置世界参数
   */
  private setupWorld(worldConfig: PhysicsContract['world']) {
    // 设置重力
    this.engine.world.gravity.x = worldConfig.gravity[0];
    this.engine.world.gravity.y = worldConfig.gravity[1];
    
    // 设置边界（通过创建边界墙实现）
    this.createBoundaryWalls(worldConfig.bounds);
  }

  /**
   * 设置引擎参数
   */
  private setupEngine(engineConfig: PhysicsContract['engine']) {
    // 设置时间步长
    this.engine.timing.timeScale = 1.0;
    
    // 设置迭代次数
    this.engine.positionIterations = engineConfig.positionIterations;
    this.engine.velocityIterations = engineConfig.velocityIterations;
  }

  /**
   * 创建边界墙
   */
  private createBoundaryWalls(bounds: PhysicsContract['world']['bounds']) {
    const thickness = 0.1;
    const [minX, minY] = bounds.min;
    const [maxX, maxY] = bounds.max;
    
    // 创建四面墙
    const walls = [
      // 左墙
      Matter.Bodies.rectangle(minX - thickness/2, (minY + maxY)/2, thickness, maxY - minY, { isStatic: true }),
      // 右墙
      Matter.Bodies.rectangle(maxX + thickness/2, (minY + maxY)/2, thickness, maxY - minY, { isStatic: true }),
      // 上墙
      Matter.Bodies.rectangle((minX + maxX)/2, minY - thickness/2, maxX - minX, thickness, { isStatic: true }),
      // 下墙
      Matter.Bodies.rectangle((minX + maxX)/2, maxY + thickness/2, maxX - minX, thickness, { isStatic: true })
    ];
    
    Matter.World.add(this.world, walls);
  }

  /**
   * 创建刚体
   */
  private createBodies(bodiesConfig: PhysicsContract['bodies']) {
    for (const bodyConfig of bodiesConfig) {
      let body: Matter.Body;
      
      switch (bodyConfig.shape) {
        case 'box':
          body = Matter.Bodies.rectangle(
            bodyConfig.position[0],
            bodyConfig.position[1],
            bodyConfig.size!.w,
            bodyConfig.size!.h,
            {
              isStatic: bodyConfig.isStatic,
              angle: bodyConfig.angle,
              mass: bodyConfig.mass,
              friction: bodyConfig.friction,
              frictionStatic: bodyConfig.frictionStatic,
              restitution: bodyConfig.restitution,
              collisionFilter: bodyConfig.collisionFilter
            }
          );
          break;
          
        case 'circle':
          body = Matter.Bodies.circle(
            bodyConfig.position[0],
            bodyConfig.position[1],
            bodyConfig.r!,
            {
              isStatic: bodyConfig.isStatic,
              angle: bodyConfig.angle,
              mass: bodyConfig.mass,
              friction: bodyConfig.friction,
              frictionStatic: bodyConfig.frictionStatic,
              restitution: bodyConfig.restitution,
              collisionFilter: bodyConfig.collisionFilter
            }
          );
          break;
          
        case 'polygon':
          // 转换顶点格式为Matter.js格式
          const vertices = bodyConfig.vertices!.map(vertex => ({ x: vertex[0], y: vertex[1] }));
          body = Matter.Bodies.fromVertices(
            bodyConfig.position[0],
            bodyConfig.position[1],
            [vertices],
            {
              isStatic: bodyConfig.isStatic,
              angle: bodyConfig.angle,
              mass: bodyConfig.mass,
              friction: bodyConfig.friction,
              frictionStatic: bodyConfig.frictionStatic,
              restitution: bodyConfig.restitution,
              collisionFilter: bodyConfig.collisionFilter
            }
          );
          break;
          
        default:
          throw new Error(`Unsupported body shape: ${bodyConfig.shape}`);
      }
      
      // 设置标签用于识别
      body.label = bodyConfig.id;
      
      // 存储到映射中
      this.bodies.set(bodyConfig.id, body);
      
      // 添加到世界
      Matter.World.add(this.world, body);
    }
  }

  /**
   * 创建约束
   */
  private createConstraints(constraintsConfig: PhysicsContract['constraints']) {
    for (const constraintConfig of constraintsConfig) {
      if (constraintConfig.type === 'spring') {
        const bodyA = constraintConfig.a.body ? this.bodies.get(constraintConfig.a.body) : null;
        const bodyB = constraintConfig.b.body ? this.bodies.get(constraintConfig.b.body) : null;
        
        if (bodyA && bodyB) {
          const constraint = Matter.Constraint.create({
            bodyA: bodyA,
            bodyB: bodyB,
            length: constraintConfig.length,
            stiffness: constraintConfig.stiffness,
            damping: constraintConfig.damping
          });
          
          this.constraints.set(constraintConfig.id, constraint);
          Matter.World.add(this.world, constraint);
        }
      }
    }
  }

  /**
   * 设置碰撞检测
   */
  private setupCollisionDetection() {
    Matter.Events.on(this.engine, 'collisionStart', (event: any) => {
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
  private handleEventRules(eventType: string, bodyA: string, bodyB: string) {
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
  private executeAction(action: any) {
    switch (action.action) {
      case 'merge_bodies':
        this.mergeBodies(action.ids!, action.newId!);
        break;
        
      case 'attach_constraint':
        this.attachConstraint(action.constraint);
        break;
        
      case 'set_property':
        this.setProperty(action.id!, action.prop!, action.value);
        break;
    }
  }

  /**
   * 合并刚体
   */
  private mergeBodies(ids: string[], newId: string) {
    const bodiesToMerge = ids.map(id => this.bodies.get(id)).filter(Boolean) as Matter.Body[];
    
    if (bodiesToMerge.length >= 2) {
      // 计算合并后的位置和速度
      const totalMass = bodiesToMerge.reduce((sum, body) => sum + body.mass, 0);
      const centerX = bodiesToMerge.reduce((sum, body) => sum + body.position.x * body.mass, 0) / totalMass;
      const centerY = bodiesToMerge.reduce((sum, body) => sum + body.position.y * body.mass, 0) / totalMass;
      const velocityX = bodiesToMerge.reduce((sum, body) => sum + body.velocity.x * body.mass, 0) / totalMass;
      const velocityY = bodiesToMerge.reduce((sum, body) => sum + body.velocity.y * body.mass, 0) / totalMass;
      
      // 移除原刚体
      for (const body of bodiesToMerge) {
        Matter.World.remove(this.world, body);
        this.bodies.delete(body.label);
      }
      
      // 创建合并后的刚体
      const mergedBody = Matter.Bodies.circle(centerX, centerY, 0.1, {
        mass: totalMass,
        friction: 0.1,
        frictionStatic: 0.1,
        restitution: 0.0
      });
      
      // 设置速度
      Matter.Body.setVelocity(mergedBody, { x: velocityX, y: velocityY });
      
      // 设置标签
      mergedBody.label = newId;
      
      // 添加到世界和映射
      this.bodies.set(newId, mergedBody);
      Matter.World.add(this.world, mergedBody);
      
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
  private attachConstraint(constraintConfig: any) {
    const bodyA = this.bodies.get(constraintConfig.a.body);
    const bodyB = this.bodies.get(constraintConfig.b.body);
    
    if (bodyA && bodyB) {
      const constraint = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
        length: constraintConfig.length,
        stiffness: constraintConfig.stiffness,
        damping: constraintConfig.damping
      });
      
      this.constraints.set(constraintConfig.id, constraint);
      Matter.World.add(this.world, constraint);
      
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
  private setProperty(bodyId: string, prop: string, value: any) {
    const body = this.bodies.get(bodyId);
    if (body) {
      (body as any)[prop] = value;
      
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
  private async runSimulation(): Promise<any> {
    const startTime = Date.now();
    const maxTime = this.endConditions.maxTime * 1000; // 转换为毫秒
    const dt = 16.67; // 60 FPS
    
    let currentTime = 0;
    let frameCount = 0;
    
    while (currentTime < maxTime) {
      // 更新物理引擎
      Matter.Engine.update(this.engine, dt);
      
      // 记录帧数据
      const frameData = {
        timestamp: currentTime / 1000,
        bodies: Array.from(this.bodies.values()).map(body => ({
          id: body.label,
          position: [body.position.x, body.position.y] as [number, number],
          velocity: [body.velocity.x, body.velocity.y] as [number, number],
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
          position: [body.position.x, body.position.y] as [number, number],
          velocity: [body.velocity.x, body.velocity.y] as [number, number],
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
  private calculatePhysicsMetrics() {
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
  private checkEndConditions(): boolean {
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

/**
 * 导出适配器工厂函数
 */
export function createPhysicsContractAdapter(): PhysicsContractAdapter {
  return new PhysicsContractAdapter();
}

/**
 * 导出主要适配函数
 */
export async function adaptPhysicsContract(contract: PhysicsContract): Promise<SimulationResult> {
  const adapter = createPhysicsContractAdapter();
  return await adapter.adapt(contract);
}
