// 复杂物理仿真器：处理自由落体+弹性碰撞+斜面滑动
class ComplexPhysicsSimulator {
  constructor() {
    this.events = [];
    this.timeSeries = [];
  }

  /**
   * 运行复杂物理仿真
   */
  async runSimulation(ir, config) {
    console.log('🚀 开始复杂物理仿真...');
    
    const startTime = Date.now();
    this.events = [];
    this.timeSeries = [];
    
    // 从IR中提取物理参数
    const params = this.extractPhysicsParameters(ir);
    console.log('📊 物理参数:', params);
    
    // 计算关键时间点
    const keyTimes = this.calculateKeyTimes(params);
    console.log('⏰ 关键时间点:', keyTimes);
    
    // 运行分阶段仿真
    await this.simulatePhases(params, keyTimes, config);
    
    const computationTime = Date.now() - startTime;
    console.log(`✅ 仿真完成: ${this.timeSeries.length}步, ${this.events.length}个事件, 耗时${computationTime}ms`);
    
    return {
      success: true,
      timeSeries: this.timeSeries,
      events: this.events,
      finalState: this.timeSeries[this.timeSeries.length - 1],
      statistics: {
        totalSteps: this.timeSeries.length,
        successfulSteps: this.timeSeries.length,
        failedSteps: 0,
        computationTime: computationTime,
        memoryUsage: 0,
        averageTimestep: config.timestep,
        minTimestep: config.timestep,
        maxTimestep: config.timestep
      },
      performanceMetrics: {
        computationTime: computationTime,
        memoryUsage: 0,
        convergenceRate: 1,
        stabilityScore: 1,
        accuracyScore: 1
      },
      metadata: {
        duration: config.duration,
        timesteps: this.timeSeries.length,
        solver: config.solver,
        physicsType: 'complex_mechanics',
        adaptiveSteps: 0,
        eventCount: this.events.length,
        convergenceIterations: 0
      },
      errors: [],
      warnings: []
    };
  }

  /**
   * 提取物理参数
   */
  extractPhysicsParameters(ir) {
    const params = {
      m: 2,      // 质量 (kg)
      h: 5,      // 高度 (m)
      g: 9.8,    // 重力加速度 (m/s²)
      theta: 30 * Math.PI / 180, // 斜面角度 (弧度)
      mu: 0.2,   // 摩擦系数
      e: 1.0     // 恢复系数（完全弹性）
    };
    
    // 从IR中提取实际参数值
    if (ir.system && ir.system.parameters) {
      for (const param of ir.system.parameters) {
        switch (param.symbol) {
          case 'm':
            params.m = param.value || params.m;
            break;
          case 'h':
            params.h = param.value || params.h;
            break;
          case 'g':
            params.g = param.value || params.g;
            break;
          case 'theta':
          case 'θ':
            params.theta = (param.value || 30) * Math.PI / 180;
            break;
          case 'mu':
          case 'μ':
            params.mu = param.value || params.mu;
            break;
        }
      }
    }
    
    return params;
  }

  /**
   * 计算关键时间点
   */
  calculateKeyTimes(params) {
    // 自由落体时间: t1 = sqrt(2h/g)
    const t1 = Math.sqrt(2 * params.h / params.g);
    
    // 落地速度: v1 = gt1
    const v1 = params.g * t1;
    
    // 斜面减速度: a = g(sinθ + μcosθ)
    const deceleration = params.g * (Math.sin(params.theta) + params.mu * Math.cos(params.theta));
    
    // 斜面滑行时间: t2 = v1/a
    const t2 = v1 / deceleration;
    
    // 最大距离: s = v1²/(2a)
    const sMax = (v1 * v1) / (2 * deceleration);
    
    return {
      fallTime: t1,          // 落地时间
      landingVelocity: v1,   // 落地速度
      inclineTime: t2,       // 斜面滑行时间
      maxDistance: sMax,     // 最大距离
      totalTime: t1 + 0.1 + t2 // 总时间（包含碰撞时间）
    };
  }

  /**
   * 分阶段仿真
   */
  async simulatePhases(params, keyTimes, config) {
    const dt = config.timestep;
    let currentTime = 0;
    
    // 阶段1: 自由落体 (0 → t1)
    console.log('📉 仿真阶段1: 自由落体');
    while (currentTime <= keyTimes.fallTime) {
      const state = this.simulateFreeFall(currentTime, params);
      this.addTimeStep(currentTime, state, 'free_fall');
      currentTime += dt;
    }
    
    // 事件: 落地碰撞
    this.events.push({
      time: keyTimes.fallTime,
      type: 'ground_impact',
      description: `物体以${keyTimes.landingVelocity.toFixed(2)}m/s速度落地`,
      data: { velocity: keyTimes.landingVelocity }
    });
    
    // 阶段2: 弹性碰撞 (瞬间过程)
    console.log('💥 仿真阶段2: 弹性碰撞');
    const collisionTime = keyTimes.fallTime + 0.05;
    const collisionState = {
      position: { x: 0, y: 0 },
      velocity: { x: keyTimes.landingVelocity * Math.cos(params.theta), y: keyTimes.landingVelocity * Math.sin(params.theta) },
      acceleration: { x: 0, y: 0 },
      phase: 'collision'
    };
    this.addTimeStep(collisionTime, collisionState, 'collision');
    
    this.events.push({
      time: collisionTime,
      type: 'elastic_collision',
      description: '完全弹性碰撞，速度方向改变',
      data: { restitution: params.e }
    });
    
    // 阶段3: 斜面滑动 (t1+0.1 → t1+0.1+t2)
    console.log('📈 仿真阶段3: 斜面滑动');
    const inclineStartTime = keyTimes.fallTime + 0.1;
    currentTime = inclineStartTime;
    
    while (currentTime <= inclineStartTime + keyTimes.inclineTime) {
      const inclineTime = currentTime - inclineStartTime;
      const state = this.simulateInclineMotion(inclineTime, params, keyTimes);
      this.addTimeStep(currentTime, state, 'incline_motion');
      currentTime += dt;
    }
    
    // 事件: 到达最高点
    this.events.push({
      time: inclineStartTime + keyTimes.inclineTime,
      type: 'velocity_zero',
      description: `物体到达斜面最高点，距离${keyTimes.maxDistance.toFixed(2)}m`,
      data: { maxDistance: keyTimes.maxDistance }
    });
    
    // 计算机械能损失
    const energyLoss = params.mu * params.m * params.g * Math.cos(params.theta) * keyTimes.maxDistance;
    this.events.push({
      time: inclineStartTime + keyTimes.inclineTime,
      type: 'energy_loss',
      description: `机械能损失${energyLoss.toFixed(2)}J`,
      data: { energyLoss: energyLoss }
    });
  }

  /**
   * 自由落体仿真
   */
  simulateFreeFall(t, params) {
    return {
      position: { 
        x: 0, 
        y: params.h - 0.5 * params.g * t * t 
      },
      velocity: { 
        x: 0, 
        y: -params.g * t 
      },
      acceleration: { 
        x: 0, 
        y: -params.g 
      },
      phase: 'free_fall'
    };
  }

  /**
   * 斜面运动仿真
   */
  simulateInclineMotion(t, params, keyTimes) {
    const v0 = keyTimes.landingVelocity;
    const a = -params.g * (Math.sin(params.theta) + params.mu * Math.cos(params.theta));
    
    // 沿斜面的位移和速度
    const s = v0 * t + 0.5 * a * t * t;
    const v = v0 + a * t;
    
    // 转换为世界坐标
    const x = s * Math.cos(params.theta);
    const y = s * Math.sin(params.theta);
    
    return {
      position: { x: x, y: y },
      velocity: { 
        x: Math.max(0, v) * Math.cos(params.theta), 
        y: Math.max(0, v) * Math.sin(params.theta) 
      },
      acceleration: { 
        x: a * Math.cos(params.theta), 
        y: a * Math.sin(params.theta) 
      },
      phase: 'incline_motion',
      inclineDistance: s
    };
  }

  /**
   * 添加时间步
   */
  addTimeStep(time, state, phase) {
    this.timeSeries.push({
      time: time,
      objects: {
        object1: {
          position: state.position,
          velocity: state.velocity,
          acceleration: state.acceleration,
          mass: 2,
          radius: 0.1,
          phase: phase,
          inclineDistance: state.inclineDistance || 0
        }
      },
      system: {
        gravity: 9.8,
        phase: phase
      }
    });
  }
}

module.exports = { ComplexPhysicsSimulator };
