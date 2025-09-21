/**
 * 动态物理渲染器 - 能够根据任意物理题目动态生成3D场景
 * 
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动生成3D场景
 * 3. 智能相机控制
 * 4. 自适应光照
 * 5. 动态特效
 * 6. 统一坐标系统（v2.1.0新增）
 * 7. 几何一致性保证（v2.1.0新增）
 */

import { UnifiedCoordinateSystem, InclineDefinition } from './CoordinateSystem';
import { PhysicsRenderFactory } from './PhysicsRenderFactory';

import { SimulationResult, TimeSeriesData } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/simulation/DynamicPhysicsSimulator';
import { PhysicsIR } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/ir/PhysicsIR';

// 渲染配置
export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'gif' | 'png_sequence';
  backgroundColor: string;
  camera: {
    mode: 'fixed' | 'orbit' | 'follow' | 'free';
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
    near: number;
    far: number;
  };
  lighting: {
    ambient: number;
    directional: number;
    shadows: boolean;
    color: string;
  };
  effects: {
    particles: boolean;
    trails: boolean;
    forces: boolean;
    energy: boolean;
    grid: boolean;
  };
}

// 渲染结果
export interface RenderResult {
  success: boolean;
  frames: string[]; // Base64编码的帧数据
  frameCount: number;
  duration: number;
  resolution: { width: number; height: number };
  errors: string[];
  warnings: string[];
}

// 3D场景对象
export interface SceneObject {
  id: string;
  type: 'sphere' | 'box' | 'cylinder' | 'plane' | 'mesh' | 'particle';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material: {
    color: string;
    opacity: number;
    transparent: boolean;
    emissive?: string;
    roughness?: number;
    metalness?: number;
  };
  geometry: {
    type: string;
    parameters: any;
  };
  properties?: { [key: string]: any };
}

// 动态物理渲染器
export class DynamicPhysicsRenderer {
  private scene: any; // Three.js Scene
  private camera: any; // Three.js Camera
  private renderer: any; // Three.js Renderer
  private objects: Map<string, any> = new Map();
  private lights: any[] = [];
  private effects: any[] = [];
  private coordinateSystem: UnifiedCoordinateSystem; // 统一坐标系统

  constructor() {
    this.initializeRenderer();
    this.coordinateSystem = new UnifiedCoordinateSystem();
  }

  /**
   * 设置坐标系统（确保几何一致性）
   */
  setCoordinateSystem(config: any): void {
    this.coordinateSystem.updateConfig(config);
    console.log('📐 坐标系统已更新:', this.coordinateSystem.getConfig());
  }

  /**
   * 统一的坐标转换函数（单一转换源）
   */
  worldToScreen(physicsPoint: { x: number; y: number }): { x: number; y: number } {
    return this.coordinateSystem.worldToScreen(physicsPoint);
  }

  /**
   * 计算斜面上的精确位置（确保小球贴合）
   */
  calculateInclinePosition(
    distanceAlongIncline: number,
    inclineAngle: number,
    objectRadius: number = 0.1,
    startPoint: { x: number; y: number } = { x: 0, y: 0 }
  ): { x: number; y: number } {
    const incline: InclineDefinition = {
      angle: inclineAngle,
      length: distanceAlongIncline * 2,
      startPoint: startPoint
    };
    
    return this.coordinateSystem.calculateInclinePoint(
      distanceAlongIncline,
      incline,
      objectRadius
    );
  }

  /**
   * 渲染仿真结果
   */
  async renderSimulation(
    simulationResult: SimulationResult,
    ir: PhysicsIR,
    config: RenderConfig
  ): Promise<RenderResult> {
    const startTime = Date.now();
    
    const result: RenderResult = {
      success: false,
      frames: [],
      frameCount: 0,
      duration: 0,
      resolution: { width: config.width, height: config.height },
      errors: [],
      warnings: []
    };

    try {
      console.log('🎨 Starting dynamic physics rendering...');
      console.log(`📊 Physics type: ${this.analyzePhysicsType(ir)}`);
      console.log(`📐 Resolution: ${config.width}x${config.height}`);
      console.log(`🎬 Duration: ${config.duration}s @ ${config.fps}fps`);

      // 1. 分析物理类型
      const physicsType = this.analyzePhysicsType(ir);
      
      // 2. 设置场景
      this.setupScene(config, physicsType);
      
      // 3. 创建3D对象
      this.createObjects(ir, physicsType);
      
      // 4. 设置光照
      this.setupLighting(config, physicsType);
      
      // 5. 设置特效
      this.setupEffects(config, physicsType);
      
      // 6. 渲染帧序列
      const totalFrames = Math.floor(config.duration * config.fps);
      const timeStep = config.duration / totalFrames;
      
      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame * timeStep;
        
        // 更新对象状态
        this.updateObjects(simulationResult, time, physicsType);
        
        // 更新相机
        this.updateCamera(time, config, physicsType);
        
        // 更新特效
        this.updateEffects(time, physicsType);
        
        // 渲染帧
        const frameData = this.renderFrame();
        result.frames.push(frameData);
        
        if (frame % Math.floor(totalFrames / 10) === 0) {
          console.log(`📸 Rendered ${frame + 1}/${totalFrames} frames`);
        }
      }

      result.frameCount = totalFrames;
      result.duration = Date.now() - startTime;
      result.success = true;

      console.log('✅ Rendering completed successfully!');
      console.log(`📸 Frames: ${result.frameCount}`);
      console.log(`⏱️  Time: ${result.duration}ms`);

    } catch (error) {
      result.errors.push(`Rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 分析物理类型
   */
  private analyzePhysicsType(ir: PhysicsIR): string {
    const modules = ir.system?.modules || [];
    const moduleTypes = modules.map(m => m.type);
    
    if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
      return 'complex_kinematics';
    } else if (moduleTypes.includes('oscillation')) {
      return 'oscillatory_system';
    } else if (moduleTypes.includes('wave')) {
      return 'wave_system';
    } else if (moduleTypes.includes('electromagnetic')) {
      return 'electromagnetic_system';
    } else if (moduleTypes.includes('thermal')) {
      return 'thermodynamic_system';
    } else if (moduleTypes.includes('fluid')) {
      return 'fluid_system';
    } else if (moduleTypes.includes('quantum')) {
      return 'quantum_system';
    } else if (moduleTypes.includes('relativistic')) {
      return 'relativistic_system';
    } else {
      return 'general_physics';
    }
  }

  /**
   * 初始化渲染器
   */
  private initializeRenderer(): void {
    // 这里应该初始化Three.js渲染器
    // 由于这是TypeScript接口，实际实现需要Three.js库
    console.log('🎨 Initializing Three.js renderer...');
  }

  /**
   * 设置场景
   */
  private setupScene(config: RenderConfig, physicsType: string): void {
    console.log(`🏗️  Setting up scene for ${physicsType}...`);
    
    // 根据物理类型设置不同的场景
    switch (physicsType) {
      case 'complex_kinematics':
        this.setupComplexKinematicsScene(config);
        break;
      case 'oscillatory_system':
        this.setupOscillatorySystemScene(config);
        break;
      case 'wave_system':
        this.setupWaveSystemScene(config);
        break;
      case 'electromagnetic_system':
        this.setupElectromagneticSystemScene(config);
        break;
      default:
        this.setupGeneralPhysicsScene(config);
        break;
    }
  }

  /**
   * 设置复杂运动学场景
   */
  private setupComplexKinematicsScene(config: RenderConfig): void {
    // 创建地面
    const ground = this.createGround(20, 20, '#666666');
    this.scene.add(ground);
    
    // 创建斜面
    const incline = this.createIncline(10, 5, 30, '#888888');
    this.scene.add(incline);
    
    // 设置相机位置
    this.camera.position.set(15, 10, 15);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 设置振荡系统场景
   */
  private setupOscillatorySystemScene(config: RenderConfig): void {
    // 创建弹簧
    const spring = this.createSpring(0, 0, 0, 0, -2, 0, '#FFD700');
    this.scene.add(spring);
    
    // 创建支撑点
    const support = this.createBox(0, 1, 0, 2, 0.2, 2, '#8B4513');
    this.scene.add(support);
    
    // 设置相机位置
    this.camera.position.set(8, 5, 8);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 设置波动系统场景
   */
  private setupWaveSystemScene(config: RenderConfig): void {
    // 创建波动表面
    const waveSurface = this.createWaveSurface(20, 20, '#0066CC');
    this.scene.add(waveSurface);
    
    // 设置相机位置
    this.camera.position.set(0, 15, 15);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 设置电磁系统场景
   */
  private setupElectromagneticSystemScene(config: RenderConfig): void {
    // 创建电场线
    const fieldLines = this.createFieldLines();
    this.scene.add(fieldLines);
    
    // 设置相机位置
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 设置通用物理场景
   */
  private setupGeneralPhysicsScene(config: RenderConfig): void {
    // 创建简单的地面
    const ground = this.createGround(10, 10, '#666666');
    this.scene.add(ground);
    
    // 设置相机位置
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 创建3D对象
   */
  private createObjects(ir: PhysicsIR, physicsType: string): void {
    console.log(`🎯 Creating objects for ${physicsType}...`);
    
    if (ir.system?.objects) {
      for (const obj of ir.system.objects) {
        const sceneObject = this.createObjectFromIR(obj, physicsType);
        this.scene.add(sceneObject);
        this.objects.set(obj.id, sceneObject);
      }
    }
  }

  /**
   * 从IR创建3D对象
   */
  private createObjectFromIR(obj: any, physicsType: string): any {
    const objectType = this.determineObjectType(obj, physicsType);
    
    switch (objectType) {
      case 'sphere':
        return this.createSphere(
          obj.initialPosition?.x || 0,
          obj.initialPosition?.y || 0,
          obj.initialPosition?.z || 0,
          obj.radius || 0.5,
          obj.color || '#FF0000'
        );
      case 'box':
        return this.createBox(
          obj.initialPosition?.x || 0,
          obj.initialPosition?.y || 0,
          obj.initialPosition?.z || 0,
          obj.width || 1,
          obj.height || 1,
          obj.depth || 1,
          obj.color || '#FF0000'
        );
      case 'cylinder':
        return this.createCylinder(
          obj.initialPosition?.x || 0,
          obj.initialPosition?.y || 0,
          obj.initialPosition?.z || 0,
          obj.radius || 0.5,
          obj.height || 1,
          obj.color || '#FF0000'
        );
      default:
        return this.createSphere(
          obj.initialPosition?.x || 0,
          obj.initialPosition?.y || 0,
          obj.initialPosition?.z || 0,
          0.5,
          '#FF0000'
        );
    }
  }

  /**
   * 确定对象类型
   */
  private determineObjectType(obj: any, physicsType: string): string {
    // 根据物理类型和对象属性确定3D对象类型
    if (obj.type) {
      return obj.type;
    }
    
    switch (physicsType) {
      case 'complex_kinematics':
        return 'sphere'; // 通常是小球
      case 'oscillatory_system':
        return 'box'; // 通常是方块
      case 'wave_system':
        return 'sphere'; // 通常是粒子
      case 'electromagnetic_system':
        return 'sphere'; // 通常是带电粒子
      default:
        return 'sphere';
    }
  }

  /**
   * 设置光照
   */
  private setupLighting(config: RenderConfig, physicsType: string): void {
    console.log(`💡 Setting up lighting for ${physicsType}...`);
    
    // 环境光
    const ambientLight = this.createAmbientLight(config.lighting.ambient, config.lighting.color);
    this.scene.add(ambientLight);
    
    // 方向光
    const directionalLight = this.createDirectionalLight(
      config.lighting.directional,
      config.lighting.color,
      { x: 10, y: 10, z: 5 }
    );
    this.scene.add(directionalLight);
    
    // 根据物理类型添加特殊光照
    switch (physicsType) {
      case 'electromagnetic_system':
        this.addElectromagneticLighting();
        break;
      case 'wave_system':
        this.addWaveLighting();
        break;
    }
  }

  /**
   * 设置特效
   */
  private setupEffects(config: RenderConfig, physicsType: string): void {
    console.log(`✨ Setting up effects for ${physicsType}...`);
    
    if (config.effects.particles) {
      this.createParticleSystem(physicsType);
    }
    
    if (config.effects.trails) {
      this.createTrailSystem(physicsType);
    }
    
    if (config.effects.forces) {
      this.createForceVisualization(physicsType);
    }
    
    if (config.effects.energy) {
      this.createEnergyVisualization(physicsType);
    }
    
    if (config.effects.grid) {
      this.createGrid(physicsType);
    }
  }

  /**
   * 更新对象状态
   */
  private updateObjects(simulationResult: SimulationResult, time: number, physicsType: string): void {
    // 找到对应时间的仿真数据
    const timeData = this.findTimeData(simulationResult, time);
    
    if (timeData) {
      for (const objectId in timeData.objects) {
        const obj = timeData.objects[objectId];
        const sceneObject = this.objects.get(objectId);
        
        if (sceneObject) {
          // 更新位置
          sceneObject.position.set(obj.position.x, obj.position.y, obj.position.z);
          
          // 更新旋转
          if (obj.rotation) {
            sceneObject.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
          }
          
          // 根据物理类型更新特殊属性
          this.updateObjectProperties(sceneObject, obj, physicsType);
        }
      }
    }
  }

  /**
   * 更新相机
   */
  private updateCamera(time: number, config: RenderConfig, physicsType: string): void {
    switch (config.camera.mode) {
      case 'orbit':
        this.updateOrbitCamera(time, config);
        break;
      case 'follow':
        this.updateFollowCamera(time, config, physicsType);
        break;
      case 'free':
        this.updateFreeCamera(time, config);
        break;
      default:
        // 固定相机，不需要更新
        break;
    }
  }

  /**
   * 更新特效
   */
  private updateEffects(time: number, physicsType: string): void {
    // 更新粒子系统
    this.updateParticleSystem(time, physicsType);
    
    // 更新轨迹
    this.updateTrailSystem(time, physicsType);
    
    // 更新力可视化
    this.updateForceVisualization(time, physicsType);
    
    // 更新能量可视化
    this.updateEnergyVisualization(time, physicsType);
  }

  /**
   * 渲染帧
   */
  private renderFrame(): string {
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
    
    // 获取帧数据
    const canvas = this.renderer.domElement;
    return canvas.toDataURL('image/png');
  }

  // 辅助方法 - 创建3D对象
  private createSphere(x: number, y: number, z: number, radius: number, color: string): any {
    // Three.js SphereGeometry 和 MeshBasicMaterial
    return { type: 'sphere', position: { x, y, z }, radius, color };
  }

  private createBox(x: number, y: number, z: number, width: number, height: number, depth: number, color: string): any {
    return { type: 'box', position: { x, y, z }, width, height, depth, color };
  }

  private createCylinder(x: number, y: number, z: number, radius: number, height: number, color: string): any {
    return { type: 'cylinder', position: { x, y, z }, radius, height, color };
  }

  private createGround(width: number, depth: number, color: string): any {
    return { type: 'plane', width, depth, color };
  }

  private createIncline(width: number, height: number, angle: number, color: string): any {
    return { type: 'incline', width, height, angle, color };
  }

  private createSpring(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: string): any {
    return { type: 'spring', start: { x: x1, y: y1, z: z1 }, end: { x: x2, y: y2, z: z2 }, color };
  }

  private createWaveSurface(width: number, depth: number, color: string): any {
    return { type: 'waveSurface', width, depth, color };
  }

  private createFieldLines(): any {
    return { type: 'fieldLines' };
  }

  // 辅助方法 - 创建光照
  private createAmbientLight(intensity: number, color: string): any {
    return { type: 'ambientLight', intensity, color };
  }

  private createDirectionalLight(intensity: number, color: string, position: { x: number; y: number; z: number }): any {
    return { type: 'directionalLight', intensity, color, position };
  }

  // 辅助方法 - 特效
  private createParticleSystem(physicsType: string): void {
    console.log(`✨ Creating particle system for ${physicsType}`);
  }

  private createTrailSystem(physicsType: string): void {
    console.log(`🌊 Creating trail system for ${physicsType}`);
  }

  private createForceVisualization(physicsType: string): void {
    console.log(`⚡ Creating force visualization for ${physicsType}`);
  }

  private createEnergyVisualization(physicsType: string): void {
    console.log(`🔋 Creating energy visualization for ${physicsType}`);
  }

  private createGrid(physicsType: string): void {
    console.log(`📐 Creating grid for ${physicsType}`);
  }

  // 辅助方法 - 更新
  private findTimeData(simulationResult: SimulationResult, time: number): TimeSeriesData | null {
    // 找到最接近指定时间的仿真数据
    let closest: TimeSeriesData | null = null;
    let minDiff = Infinity;
    
    for (const data of simulationResult.timeSeries) {
      const diff = Math.abs(data.time - time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data;
      }
    }
    
    return closest;
  }

  private updateObjectProperties(sceneObject: any, obj: any, physicsType: string): void {
    // 根据物理类型更新对象特殊属性
    switch (physicsType) {
      case 'electromagnetic_system':
        // 更新电磁场可视化
        break;
      case 'wave_system':
        // 更新波动效果
        break;
    }
  }

  private updateOrbitCamera(time: number, config: RenderConfig): void {
    const radius = 15;
    const angle = time * 0.1;
    this.camera.position.x = Math.cos(angle) * radius;
    this.camera.position.z = Math.sin(angle) * radius;
    this.camera.lookAt(0, 0, 0);
  }

  private updateFollowCamera(time: number, config: RenderConfig, physicsType: string): void {
    // 跟随主要对象的相机
    const mainObject = this.objects.values().next().value;
    if (mainObject) {
      this.camera.position.x = mainObject.position.x + 5;
      this.camera.position.y = mainObject.position.y + 5;
      this.camera.position.z = mainObject.position.z + 5;
      this.camera.lookAt(mainObject.position.x, mainObject.position.y, mainObject.position.z);
    }
  }

  private updateFreeCamera(time: number, config: RenderConfig): void {
    // 自由相机移动
    this.camera.position.x = Math.sin(time * 0.05) * 10;
    this.camera.position.y = 5 + Math.sin(time * 0.1) * 2;
    this.camera.position.z = Math.cos(time * 0.05) * 10;
  }

  private updateParticleSystem(time: number, physicsType: string): void {
    // 更新粒子系统
  }

  private updateTrailSystem(time: number, physicsType: string): void {
    // 更新轨迹系统
  }

  private updateForceVisualization(time: number, physicsType: string): void {
    // 更新力可视化
  }

  private updateEnergyVisualization(time: number, physicsType: string): void {
    // 更新能量可视化
  }

  private addElectromagneticLighting(): void {
    // 添加电磁场特殊光照
  }

  private addWaveLighting(): void {
    // 添加波动特殊光照
  }
}
