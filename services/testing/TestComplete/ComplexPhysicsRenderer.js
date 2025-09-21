/**
 * 复杂物理问题渲染器
 * 专门渲染自由下落、弹性碰撞、斜面滑动的3D动画
 */

class ComplexPhysicsRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  /**
   * 渲染仿真数据
   */
  async renderSimulation(ir, simulationResult, config) {
    console.log('🎨 开始渲染复杂物理仿真...');
    
    const startTime = Date.now();
    const frameCount = Math.floor(config.duration * config.fps);
    
    console.log(`📊 渲染参数: 分辨率=${config.width}x${config.height}, 帧率=${config.fps}, 时长=${config.duration}s, 总帧数=${frameCount}`);
    
    // 创建渲染场景
    this.setupScene(config);
    
    // 创建物理对象
    this.createPhysicsObjects(ir, simulationResult);
    
    // 创建环境
    this.createEnvironment(config);
    
    // 渲染帧序列
    const frames = [];
    for (let frame = 0; frame < frameCount; frame++) {
      const time = frame / config.fps;
      const frameData = this.renderFrame(time, simulationResult, config);
      frames.push(frameData);
      
      if (frame % 30 === 0) {
        console.log(`🎬 渲染进度: ${frame}/${frameCount} (${(frame/frameCount*100).toFixed(1)}%)`);
      }
    }
    
    const endTime = Date.now();
    const renderTime = endTime - startTime;
    
    console.log(`✅ 渲染完成: ${frameCount}帧, 耗时${renderTime}ms`);
    
    return {
      success: true,
      frameCount: frameCount,
      frames: frames,
      renderTime: renderTime,
      config: config
    };
  }
  
  /**
   * 设置渲染场景
   */
  setupScene(config) {
    console.log('🏗️ 设置渲染场景...');
    
    // 创建画布
    this.canvas = {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor || '#FFFFFF'
    };
    
    // 设置相机
    this.camera = {
      type: config.cameraType || 'perspective',
      position: { x: 10, y: 5, z: 10 },
      target: { x: 0, y: 2, z: 0 },
      fov: 60,
      near: 0.1,
      far: 1000
    };
    
    // 设置光照
    this.lighting = {
      ambient: { color: '#404040', intensity: 0.3 },
      directional: [{
        color: '#FFFFFF',
        intensity: 0.8,
        position: { x: 10, y: 10, z: 5 },
        castShadow: true
      }]
    };
    
    console.log('✅ 场景设置完成');
  }
  
  /**
   * 创建物理对象
   */
  createPhysicsObjects(ir, simulationResult) {
    console.log('🔧 创建物理对象...');
    
    this.objects = {
      ball: {
        type: 'sphere',
        radius: 0.2,
        color: '#FF6B6B',
        material: 'metallic',
        castShadow: true,
        receiveShadow: true
      },
      ground: {
        type: 'plane',
        size: { width: 20, height: 20 },
        color: '#8B4513',
        material: 'rough',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      incline: {
        type: 'plane',
        size: { width: 10, height: 10 },
        color: '#A0522D',
        material: 'rough',
        position: { x: 5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 30 * Math.PI / 180 } // 30度斜面
      }
    };
    
    console.log('✅ 物理对象创建完成');
  }
  
  /**
   * 创建环境
   */
  createEnvironment(config) {
    console.log('🌍 创建环境...');
    
    this.environment = {
      background: {
        type: 'gradient',
        topColor: '#87CEEB',
        bottomColor: '#FFFFFF'
      },
      fog: {
        enabled: false,
        color: '#FFFFFF',
        near: 10,
        far: 100
      },
      grid: {
        enabled: config.showGrid || true,
        size: 20,
        divisions: 20,
        color: '#CCCCCC'
      },
      axes: {
        enabled: config.showAxes || true,
        size: 5,
        colors: {
          x: '#FF0000',
          y: '#00FF00',
          z: '#0000FF'
        }
      }
    };
    
    console.log('✅ 环境创建完成');
  }
  
  /**
   * 渲染单帧
   */
  renderFrame(time, simulationResult, config) {
    // 找到对应时间的数据
    const timeData = this.findTimeData(time, simulationResult.timeSeries);
    
    if (!timeData) {
      return this.createEmptyFrame(config);
    }
    
    // 确定当前阶段
    const phase = this.determinePhase(time);
    
    // 创建帧数据
    const frameData = {
      time: time,
      phase: phase,
      objects: {
        ball: {
          position: { ...timeData.objects.object1.position },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: this.getPhaseColor(phase),
          visible: true
        },
        ground: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#8B4513',
          visible: true
        },
        incline: {
          position: { x: 5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 30 * Math.PI / 180 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#A0522D',
          visible: time >= 1.2 // 碰撞后显示斜面
        }
      },
      environment: {
        background: this.environment.background,
        lighting: this.lighting,
        fog: this.environment.fog
      },
      camera: {
        position: this.camera.position,
        target: this.camera.target,
        fov: this.camera.fov
      },
      effects: this.getPhaseEffects(phase, timeData),
      annotations: this.getPhaseAnnotations(phase, timeData)
    };
    
    return frameData;
  }
  
  /**
   * 查找时间数据
   */
  findTimeData(time, timeSeries) {
    // 找到最接近的时间点
    let closest = null;
    let minDiff = Infinity;
    
    for (const data of timeSeries) {
      const diff = Math.abs(data.time - time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data;
      }
    }
    
    return closest;
  }
  
  /**
   * 确定当前阶段
   */
  determinePhase(time) {
    if (time < 1.0) return 'free_fall';
    if (time < 1.1) return 'elastic_collision';
    if (time < 1.2) return 'post_collision';
    return 'inclined_plane';
  }
  
  /**
   * 获取阶段颜色
   */
  getPhaseColor(phase) {
    const colors = {
      'free_fall': '#FF6B6B',
      'elastic_collision': '#4ECDC4',
      'post_collision': '#4ECDC4',
      'inclined_plane': '#45B7D1'
    };
    return colors[phase] || '#FF6B6B';
  }
  
  /**
   * 获取阶段特效
   */
  getPhaseEffects(phase, timeData) {
    const effects = {
      particles: [],
      trails: [],
      highlights: []
    };
    
    switch (phase) {
      case 'free_fall':
        effects.trails.push({
          type: 'trajectory',
          points: timeData.objects.object1.position,
          color: '#FF6B6B',
          width: 2
        });
        break;
        
      case 'elastic_collision':
        effects.particles.push({
          type: 'sparks',
          position: { x: 0, y: 0, z: 0 },
          count: 20,
          color: '#FFD700'
        });
        effects.highlights.push({
          type: 'flash',
          position: { x: 0, y: 0, z: 0 },
          color: '#FFFFFF',
          intensity: 1.0
        });
        break;
        
      case 'inclined_plane':
        effects.trails.push({
          type: 'trajectory',
          points: timeData.objects.object1.position,
          color: '#45B7D1',
          width: 2
        });
        break;
    }
    
    return effects;
  }
  
  /**
   * 获取阶段注释
   */
  getPhaseAnnotations(phase, timeData) {
    const annotations = [];
    
    switch (phase) {
      case 'free_fall':
        annotations.push({
          type: 'text',
          text: '自由下落阶段',
          position: { x: -5, y: 8, z: 0 },
          color: '#FF6B6B',
          size: 0.5
        });
        annotations.push({
          type: 'formula',
          text: 'v₁ = √(2gh) = 9.9 m/s',
          position: { x: -5, y: 7, z: 0 },
          color: '#000000',
          size: 0.3
        });
        break;
        
      case 'elastic_collision':
        annotations.push({
          type: 'text',
          text: '弹性碰撞阶段',
          position: { x: -5, y: 8, z: 0 },
          color: '#4ECDC4',
          size: 0.5
        });
        annotations.push({
          type: 'formula',
          text: 'v₂ = -e × v₁ = -9.9 m/s',
          position: { x: -5, y: 7, z: 0 },
          color: '#000000',
          size: 0.3
        });
        break;
        
      case 'inclined_plane':
        annotations.push({
          type: 'text',
          text: '斜面滑动阶段',
          position: { x: -5, y: 8, z: 0 },
          color: '#45B7D1',
          size: 0.5
        });
        annotations.push({
          type: 'formula',
          text: 's = v₂²/(2g(sinθ + μcosθ)) = 2.5 m',
          position: { x: -5, y: 7, z: 0 },
          color: '#000000',
          size: 0.3
        });
        break;
    }
    
    return annotations;
  }
  
  /**
   * 创建空帧
   */
  createEmptyFrame(config) {
    return {
      time: 0,
      phase: 'unknown',
      objects: {
        ball: {
          position: { x: 0, y: 5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#FF6B6B',
          visible: true
        },
        ground: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#8B4513',
          visible: true
        },
        incline: {
          position: { x: 5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 30 * Math.PI / 180 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#A0522D',
          visible: false
        }
      },
      environment: {
        background: this.environment?.background || { type: 'solid', color: '#FFFFFF' },
        lighting: this.lighting || { ambient: { color: '#404040', intensity: 0.3 } },
        fog: this.environment?.fog || { enabled: false }
      },
      camera: {
        position: { x: 10, y: 5, z: 10 },
        target: { x: 0, y: 2, z: 0 },
        fov: 60
      },
      effects: { particles: [], trails: [], highlights: [] },
      annotations: []
    };
  }
}

module.exports = { ComplexPhysicsRenderer };
