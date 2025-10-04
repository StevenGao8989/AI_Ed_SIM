/**
 * Matter.js 渲染器 - 完整的物理仿真渲染和运行
 * 
 * 功能：
 * 1. 将PhysicsContract转换为Matter.js世界
 * 2. 实现事件规则和终止条件
 * 3. 提供渲染和运行功能
 * 4. 支持浏览器和服务器环境
 */

const Matter = require('matter-js');
const path = require('path');
const fs = require('fs');

class MatterRenderer {
  constructor(options = {}) {
    this.scale = options.scale || 100; // 像素/米，默认100px/m
    this.outputDir = options.outputDir || path.join(__dirname, 'render_output');
    this.ensureOutputDir();
    
    // Matter.js 组件
    this.engine = null;
    this.world = null;
    this.render = null;
    this.runner = null;
    
    // 状态管理
    this.bodies = new Map();
    this.constraints = new Map();
    this.eventRules = [];
    this.endConditions = null;
    this.triggeredEvents = new Set();
    this.frameData = [];
    this.events = [];
    
    // 渲染配置
    this.renderOptions = {
      width: options.width || 1920,
      height: options.height || 1080,
      wireframes: options.wireframes || false,
      background: options.background || '#ffffff',
      showVelocity: options.showVelocity || false,
      showCollisions: options.showCollisions || true,
      showBroadphase: options.showBroadphase || false,
      showDebug: options.showDebug || false,
      ...options
    };
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 从PhysicsContract创建Matter.js世界
   */
  createWorld(contract) {
    try {
      // 创建引擎和世界
      this.engine = Matter.Engine.create();
      this.world = this.engine.world;
      
      // 设置世界参数
      this.setupWorld(contract.world);
      
      // 设置引擎参数
      this.setupEngine(contract.engine);
      
      // 创建刚体（应用缩放）
      this.createBodies(contract.bodies);
      
      // 创建约束
      this.createConstraints(contract.constraints);
      
      // 设置事件规则
      this.eventRules = contract.event_rules || [];
      this.endConditions = contract.end_conditions;
      
      // 设置碰撞检测和事件处理
      this.setupCollisionDetection();
      
      return {
        success: true,
        engine: this.engine,
        world: this.world
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 设置世界参数
   */
  setupWorld(worldConfig) {
    // 设置重力（不需要缩放，重力本身就是加速度）
    this.engine.world.gravity.x = worldConfig.gravity[0];
    this.engine.world.gravity.y = worldConfig.gravity[1];
    
    // 创建边界墙（应用缩放）
    this.createBoundaryWalls(worldConfig.bounds);
  }

  /**
   * 设置引擎参数
   */
  setupEngine(engineConfig) {
    this.engine.timing.timeScale = 1.0;
    this.engine.positionIterations = engineConfig.positionIterations;
    this.engine.velocityIterations = engineConfig.velocityIterations;
  }

  /**
   * 创建边界墙
   */
  createBoundaryWalls(bounds) {
    const thickness = 0.1 * this.scale; // 转换为像素
    const minX = bounds.min[0] * this.scale;
    const minY = bounds.min[1] * this.scale;
    const maxX = bounds.max[0] * this.scale;
    const maxY = bounds.max[1] * this.scale;
    
    const walls = [
      // 左墙
      Matter.Bodies.rectangle(minX - thickness/2, (minY + maxY)/2, thickness, maxY - minY, { 
        isStatic: true,
        label: 'wall_left'
      }),
      // 右墙
      Matter.Bodies.rectangle(maxX + thickness/2, (minY + maxY)/2, thickness, maxY - minY, { 
        isStatic: true,
        label: 'wall_right'
      }),
      // 上墙
      Matter.Bodies.rectangle((minX + maxX)/2, minY - thickness/2, maxX - minX, thickness, { 
        isStatic: true,
        label: 'wall_top'
      }),
      // 下墙
      Matter.Bodies.rectangle((minX + maxX)/2, maxY + thickness/2, maxX - minX, thickness, { 
        isStatic: true,
        label: 'wall_bottom'
      })
    ];
    
    Matter.World.add(this.world, walls);
  }

  /**
   * 创建刚体（应用缩放和轻微抬高）
   */
  createBodies(bodiesConfig) {
    for (const bodyConfig of bodiesConfig) {
      let body;
      
      // 应用缩放
      const x = bodyConfig.position[0] * this.scale;
      const y = bodyConfig.position[1] * this.scale;
      const angle = bodyConfig.angle;
      
      // 动态体轻微抬高避免初始穿透
      const elevation = bodyConfig.isStatic ? 0 : 2; // 2像素抬高
      
      switch (bodyConfig.shape) {
        case 'box':
          const w = bodyConfig.size.w * this.scale;
          const h = bodyConfig.size.h * this.scale;
          body = Matter.Bodies.rectangle(x, y - elevation, w, h, {
            isStatic: bodyConfig.isStatic,
            angle: angle,
            mass: bodyConfig.mass,
            friction: bodyConfig.friction,
            frictionStatic: bodyConfig.frictionStatic,
            restitution: bodyConfig.restitution,
            collisionFilter: bodyConfig.collisionFilter
          });
          break;
          
        case 'circle':
          const r = bodyConfig.r * this.scale;
          body = Matter.Bodies.circle(x, y - elevation, r, {
            isStatic: bodyConfig.isStatic,
            angle: angle,
            mass: bodyConfig.mass,
            friction: bodyConfig.friction,
            frictionStatic: bodyConfig.frictionStatic,
            restitution: bodyConfig.restitution,
            collisionFilter: bodyConfig.collisionFilter
          });
          break;
          
        case 'polygon':
          const vertices = bodyConfig.vertices.map(vertex => ({ 
            x: vertex[0] * this.scale, 
            y: vertex[1] * this.scale 
          }));
          body = Matter.Bodies.fromVertices(x, y - elevation, [vertices], {
            isStatic: bodyConfig.isStatic,
            angle: angle,
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
      
      // 设置标签
      body.label = bodyConfig.id;
      
      // 存储到映射
      this.bodies.set(bodyConfig.id, body);
      
      // 添加到世界
      Matter.World.add(this.world, body);
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
          const constraint = Matter.Constraint.create({
            bodyA: bodyA,
            bodyB: bodyB,
            length: constraintConfig.length * this.scale, // 应用缩放
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
   * 设置碰撞检测和事件处理
   */
  setupCollisionDetection() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
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
        Matter.World.remove(this.world, body);
        this.bodies.delete(body.label);
      }
      
      // 创建合并后的刚体
      const mergedBody = Matter.Bodies.circle(centerX, centerY, 10, {
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
  attachConstraint(constraintConfig) {
    const bodyA = this.bodies.get(constraintConfig.a.body);
    const bodyB = this.bodies.get(constraintConfig.b.body);
    
    if (bodyA && bodyB) {
      const constraint = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
        length: constraintConfig.length * this.scale,
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
   * 检查终止条件
   */
  checkEndConditions() {
    if (!this.endConditions) return false;
    
    // 检查最大时间
    if (this.engine.timing.timestamp > this.endConditions.maxTime * 1000) {
      return true;
    }
    
    // 检查停止条件
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
            const tol = (condition.tol || 0.01) * this.scale;
            if (condition.x !== undefined && Math.abs(targetBody.position.x - condition.x * this.scale) < tol) {
              return true;
            }
            if (condition.y !== undefined && Math.abs(targetBody.position.y - condition.y * this.scale) < tol) {
              return true;
            }
          }
          break;
      }
    }
    
    return false;
  }

  /**
   * 创建渲染器（浏览器环境）
   */
  createRender(canvas) {
    if (typeof window === 'undefined') {
      throw new Error('createRender只能在浏览器环境中使用');
    }
    
    this.render = Matter.Render.create({
      canvas: canvas,
      engine: this.engine,
      options: this.renderOptions
    });
    
    return this.render;
  }

  /**
   * 创建运行器
   */
  createRunner() {
    this.runner = Matter.Runner.create();
    return this.runner;
  }

  /**
   * 运行仿真（浏览器环境）
   */
  run() {
    if (!this.engine) {
      throw new Error('请先创建世界');
    }
    
    if (!this.runner) {
      this.createRunner();
    }
    
    // 开始运行
    Matter.Runner.run(this.runner, this.engine);
    
    // 开始渲染（如果存在）
    if (this.render) {
      Matter.Render.run(this.render);
    }
    
    return {
      engine: this.engine,
      runner: this.runner,
      render: this.render
    };
  }

  /**
   * 停止仿真
   */
  stop() {
    if (this.runner) {
      Matter.Runner.stop(this.runner);
    }
    
    if (this.render) {
      Matter.Render.stop(this.render);
    }
  }

  /**
   * 运行仿真并收集数据（服务器环境）
   */
  async runSimulation() {
    if (!this.engine) {
      throw new Error('请先创建世界');
    }
    
    const startTime = Date.now();
    const maxTime = this.endConditions ? this.endConditions.maxTime * 1000 : 10000; // 默认10秒
    const dt = 16.67; // 60 FPS
    
    let currentTime = 0;
    let frameCount = 0;
    
    while (currentTime < maxTime) {
      // 更新物理引擎
      Matter.Engine.update(this.engine, dt);
      
      // 记录帧数据
      const frameData = {
        frameIndex: frameCount,
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
      
      // 检查终止条件
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
      success: true,
      data: {
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
        events: this.events
      }
    };
  }

  /**
   * 保存仿真数据
   */
  async saveSimulationData(filename = 'simulation_data.json') {
    const result = await this.runSimulation();
    
    if (result.success) {
      const outputPath = path.join(this.outputDir, filename);
      fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
      return {
        success: true,
        outputPath,
        data: result.data
      };
    }
    
    return result;
  }
}

module.exports = MatterRenderer;
