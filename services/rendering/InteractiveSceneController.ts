// services/rendering/InteractiveSceneController.ts
// 交互式场景控制器：允许用户实时调整物理参数和动画控制

import type { SimulationResult } from '../simulation/DynamicPhysicsSimulator';
import type { PhysicsIR } from '../ir/PhysicsIR';

/**
 * 交互控制配置
 */
export interface InteractiveConfig {
  enableRealTimeControl: boolean;
  enableParameterSliders: boolean;
  enableTimeControl: boolean;
  enableCameraControl: boolean;
  enablePhysicsToggle: boolean;
  maxFrameRate: number;
  responseDelay: number;
}

/**
 * 控制参数
 */
export interface ControlParameter {
  id: string;
  name: string;
  symbol: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  unit: string;
  description: string;
  category: 'physics' | 'simulation' | 'rendering';
  realTimeUpdate: boolean;
}

/**
 * 时间控制
 */
export interface TimeControl {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  loop: boolean;
  markers: TimeMarker[];
}

/**
 * 时间标记
 */
export interface TimeMarker {
  time: number;
  label: string;
  description: string;
  color: string;
}

/**
 * 相机控制
 */
export interface CameraControl {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  zoom: number;
  fov: number;
  enableAutoRotate: boolean;
  rotationSpeed: number;
}

/**
 * 场景状态
 */
export interface SceneState {
  parameters: Map<string, ControlParameter>;
  timeControl: TimeControl;
  cameraControl: CameraControl;
  physicsEnabled: boolean;
  renderingMode: '2D' | '3D' | 'Mixed';
  qualityLevel: 'Low' | 'Medium' | 'High' | 'Ultra';
}

/**
 * 交互事件
 */
export interface InteractiveEvent {
  type: 'parameter_change' | 'time_control' | 'camera_move' | 'physics_toggle' | 'quality_change';
  timestamp: number;
  data: any;
  source: 'user' | 'system' | 'auto';
}

/**
 * 交互式场景控制器
 */
export class InteractiveSceneController {
  private config: InteractiveConfig;
  private sceneState: SceneState;
  private eventHistory: InteractiveEvent[] = [];
  private updateCallbacks: Map<string, Function> = new Map();
  private isUpdating: boolean = false;

  constructor(config: Partial<InteractiveConfig> = {}) {
    this.config = {
      enableRealTimeControl: true,
      enableParameterSliders: true,
      enableTimeControl: true,
      enableCameraControl: true,
      enablePhysicsToggle: true,
      maxFrameRate: 60,
      responseDelay: 16, // ~60fps
      ...config
    };

    this.sceneState = this.initializeSceneState();
  }

  /**
   * 初始化场景状态
   */
  private initializeSceneState(): SceneState {
    return {
      parameters: new Map(),
      timeControl: {
        isPlaying: false,
        currentTime: 0,
        duration: 3.1,
        playbackSpeed: 1.0,
        loop: true,
        markers: [
          { time: 0, label: '开始', description: '物体开始下落', color: '#00FF00' },
          { time: 1.0, label: '落地', description: '物体撞击地面', color: '#FF0000' },
          { time: 1.1, label: '反弹', description: '弹性碰撞反弹', color: '#FF6B6B' },
          { time: 1.2, label: '斜面', description: '开始斜面滑动', color: '#4ECDC4' }
        ]
      },
      cameraControl: {
        position: { x: 5, y: 5, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        zoom: 1.0,
        fov: 75,
        enableAutoRotate: false,
        rotationSpeed: 0.01
      },
      physicsEnabled: true,
      renderingMode: '3D',
      qualityLevel: 'High'
    };
  }

  /**
   * 初始化控制参数
   */
  initializeControlParameters(ir: PhysicsIR): void {
    console.log('🎛️ 初始化交互控制参数...');

    // 清空现有参数
    this.sceneState.parameters.clear();

    // 从IR中提取可控制的物理参数
    if (ir.system.parameters) {
      for (const param of ir.system.parameters) {
        if (param.role === 'given' || param.role === 'unknown') {
          const controlParam: ControlParameter = {
            id: param.symbol,
            name: param.description || param.symbol,
            symbol: param.symbol,
            currentValue: typeof param.value === 'number' ? param.value : (param.value?.value || 0),
            minValue: this.getMinValue(param.symbol),
            maxValue: this.getMaxValue(param.symbol),
            step: this.getStep(param.symbol),
            unit: this.extractUnit(param) || '',
            description: param.description || `控制参数 ${param.symbol}`,
            category: this.getCategoryFromSymbol(param.symbol),
            realTimeUpdate: this.isRealTimeParameter(param.symbol)
          };

          this.sceneState.parameters.set(param.symbol, controlParam);
        }
      }
    }

    // 添加仿真控制参数
    this.addSimulationControlParameters();
    
    // 添加渲染控制参数
    this.addRenderingControlParameters();

    console.log(`✅ 初始化了${this.sceneState.parameters.size}个控制参数`);
  }

  /**
   * 添加仿真控制参数
   */
  private addSimulationControlParameters(): void {
    const simParams: ControlParameter[] = [
      {
        id: 'timestep',
        name: '时间步长',
        symbol: 'dt',
        currentValue: 0.01,
        minValue: 0.001,
        maxValue: 0.1,
        step: 0.001,
        unit: 's',
        description: '仿真计算的时间步长',
        category: 'simulation',
        realTimeUpdate: false
      },
      {
        id: 'tolerance',
        name: '计算精度',
        symbol: 'tol',
        currentValue: 1e-6,
        minValue: 1e-8,
        maxValue: 1e-3,
        step: 1e-7,
        unit: '',
        description: '数值计算的容差',
        category: 'simulation',
        realTimeUpdate: false
      }
    ];

    simParams.forEach(param => {
      this.sceneState.parameters.set(param.id, param);
    });
  }

  /**
   * 添加渲染控制参数
   */
  private addRenderingControlParameters(): void {
    const renderParams: ControlParameter[] = [
      {
        id: 'camera_distance',
        name: '相机距离',
        symbol: 'cam_dist',
        currentValue: 10,
        minValue: 5,
        maxValue: 50,
        step: 1,
        unit: 'm',
        description: '相机到场景中心的距离',
        category: 'rendering',
        realTimeUpdate: true
      },
      {
        id: 'animation_speed',
        name: '动画速度',
        symbol: 'anim_speed',
        currentValue: 1.0,
        minValue: 0.1,
        maxValue: 5.0,
        step: 0.1,
        unit: 'x',
        description: '动画播放速度倍数',
        category: 'rendering',
        realTimeUpdate: true
      }
    ];

    renderParams.forEach(param => {
      this.sceneState.parameters.set(param.id, param);
    });
  }

  /**
   * 更新参数值
   */
  updateParameter(parameterId: string, newValue: number): boolean {
    const parameter = this.sceneState.parameters.get(parameterId);
    if (!parameter) {
      console.warn(`⚠️ 参数不存在: ${parameterId}`);
      return false;
    }

    // 验证参数范围
    const clampedValue = Math.max(
      parameter.minValue,
      Math.min(parameter.maxValue, newValue)
    );

    const oldValue = parameter.currentValue;
    parameter.currentValue = clampedValue;

    // 记录事件
    this.recordEvent({
      type: 'parameter_change',
      timestamp: Date.now(),
      data: {
        parameterId,
        oldValue,
        newValue: clampedValue,
        realTimeUpdate: parameter.realTimeUpdate
      },
      source: 'user'
    });

    // 如果支持实时更新，触发回调
    if (parameter.realTimeUpdate && this.config.enableRealTimeControl) {
      this.triggerUpdate('parameter_change', { parameterId, newValue: clampedValue });
    }

    console.log(`🎛️ 参数更新: ${parameter.symbol} = ${clampedValue} ${parameter.unit}`);
    return true;
  }

  /**
   * 时间控制
   */
  controlTime(action: 'play' | 'pause' | 'stop' | 'seek', value?: number): void {
    const timeControl = this.sceneState.timeControl;

    switch (action) {
      case 'play':
        timeControl.isPlaying = true;
        break;
      case 'pause':
        timeControl.isPlaying = false;
        break;
      case 'stop':
        timeControl.isPlaying = false;
        timeControl.currentTime = 0;
        break;
      case 'seek':
        if (typeof value === 'number') {
          timeControl.currentTime = Math.max(0, Math.min(timeControl.duration, value));
        }
        break;
    }

    this.recordEvent({
      type: 'time_control',
      timestamp: Date.now(),
      data: { action, value, currentTime: timeControl.currentTime },
      source: 'user'
    });

    this.triggerUpdate('time_control', { action, currentTime: timeControl.currentTime });
  }

  /**
   * 相机控制
   */
  controlCamera(type: 'position' | 'target' | 'zoom' | 'fov', value: any): void {
    const cameraControl = this.sceneState.cameraControl;

    switch (type) {
      case 'position':
        if (value.x !== undefined) cameraControl.position.x = value.x;
        if (value.y !== undefined) cameraControl.position.y = value.y;
        if (value.z !== undefined) cameraControl.position.z = value.z;
        break;
      case 'target':
        if (value.x !== undefined) cameraControl.target.x = value.x;
        if (value.y !== undefined) cameraControl.target.y = value.y;
        if (value.z !== undefined) cameraControl.target.z = value.z;
        break;
      case 'zoom':
        cameraControl.zoom = Math.max(0.1, Math.min(10, value));
        break;
      case 'fov':
        cameraControl.fov = Math.max(10, Math.min(170, value));
        break;
    }

    this.recordEvent({
      type: 'camera_move',
      timestamp: Date.now(),
      data: { type, value },
      source: 'user'
    });

    if (this.config.enableCameraControl) {
      this.triggerUpdate('camera_control', { type, value });
    }
  }

  /**
   * 注册更新回调
   */
  onUpdate(eventType: string, callback: Function): void {
    this.updateCallbacks.set(eventType, callback);
  }

  /**
   * 触发更新
   */
  private triggerUpdate(eventType: string, data: any): void {
    if (this.isUpdating) return;

    this.isUpdating = true;
    setTimeout(() => {
      const callback = this.updateCallbacks.get(eventType);
      if (callback) {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ 更新回调失败: ${eventType}`, error);
        }
      }
      this.isUpdating = false;
    }, this.config.responseDelay);
  }

  /**
   * 记录交互事件
   */
  private recordEvent(event: InteractiveEvent): void {
    this.eventHistory.push(event);
    
    // 限制事件历史大小
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
  }

  /**
   * 获取参数的最小值
   */
  private getMinValue(symbol: string): number {
    const minValues: Record<string, number> = {
      'm': 0.1,      // 质量最小0.1kg
      'h': 0.1,      // 高度最小0.1m
      'v': 0,        // 速度最小0
      'g': 1,        // 重力加速度最小1m/s²
      'θ': 0,        // 角度最小0°
      'μ': 0,        // 摩擦系数最小0
      't': 0,        // 时间最小0
      'F': 0,        // 力最小0
      'E': 0         // 能量最小0
    };
    return minValues[symbol] || 0;
  }

  /**
   * 获取参数的最大值
   */
  private getMaxValue(symbol: string): number {
    const maxValues: Record<string, number> = {
      'm': 1000,     // 质量最大1000kg
      'h': 1000,     // 高度最大1000m
      'v': 100,      // 速度最大100m/s
      'g': 20,       // 重力加速度最大20m/s²
      'θ': 90,       // 角度最大90°
      'μ': 1,        // 摩擦系数最大1
      't': 100,      // 时间最大100s
      'F': 10000,    // 力最大10000N
      'E': 100000    // 能量最大100000J
    };
    return maxValues[symbol] || 100;
  }

  /**
   * 获取参数的步长
   */
  private getStep(symbol: string): number {
    const steps: Record<string, number> = {
      'm': 0.1,      // 质量步长0.1kg
      'h': 0.1,      // 高度步长0.1m
      'v': 0.1,      // 速度步长0.1m/s
      'g': 0.1,      // 重力加速度步长0.1m/s²
      'θ': 1,        // 角度步长1°
      'μ': 0.01,     // 摩擦系数步长0.01
      't': 0.1,      // 时间步长0.1s
      'F': 1,        // 力步长1N
      'E': 1         // 能量步长1J
    };
    return steps[symbol] || 0.1;
  }

  /**
   * 提取单位
   */
  private extractUnit(param: any): string {
    return param.unit || '';
  }

  /**
   * 根据符号获取分类
   */
  private getCategoryFromSymbol(symbol: string): 'physics' | 'simulation' | 'rendering' {
    const physicsSymbols = ['m', 'h', 'v', 'g', 'θ', 'μ', 'F', 'E', 'P', 'T'];
    const simulationSymbols = ['dt', 'tol', 'max_iter'];
    
    if (physicsSymbols.includes(symbol)) return 'physics';
    if (simulationSymbols.includes(symbol)) return 'simulation';
    return 'rendering';
  }

  /**
   * 判断是否为实时参数
   */
  private isRealTimeParameter(symbol: string): boolean {
    const realTimeSymbols = ['θ', 'μ', 'g', 'cam_dist', 'anim_speed'];
    return realTimeSymbols.includes(symbol);
  }

  /**
   * 获取当前场景状态
   */
  getSceneState(): SceneState {
    return { ...this.sceneState };
  }

  /**
   * 获取控制参数列表
   */
  getControlParameters(): ControlParameter[] {
    return Array.from(this.sceneState.parameters.values());
  }

  /**
   * 获取按分类的控制参数
   */
  getParametersByCategory(category: 'physics' | 'simulation' | 'rendering'): ControlParameter[] {
    return Array.from(this.sceneState.parameters.values())
      .filter(param => param.category === category);
  }

  /**
   * 重置到默认值
   */
  resetToDefaults(): void {
    console.log('🔄 重置到默认值...');

    this.sceneState.timeControl.currentTime = 0;
    this.sceneState.timeControl.isPlaying = false;
    this.sceneState.cameraControl = {
      position: { x: 5, y: 5, z: 10 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1.0,
      fov: 75,
      enableAutoRotate: false,
      rotationSpeed: 0.01
    };

    this.recordEvent({
      type: 'parameter_change',
      timestamp: Date.now(),
      data: { action: 'reset_all' },
      source: 'user'
    });

    this.triggerUpdate('reset', {});
  }

  /**
   * 导出当前配置
   */
  exportConfiguration(): any {
    return {
      parameters: Object.fromEntries(
        Array.from(this.sceneState.parameters.entries()).map(([key, param]) => [
          key,
          {
            symbol: param.symbol,
            value: param.currentValue,
            unit: param.unit
          }
        ])
      ),
      timeControl: this.sceneState.timeControl,
      cameraControl: this.sceneState.cameraControl,
      renderingMode: this.sceneState.renderingMode,
      qualityLevel: this.sceneState.qualityLevel
    };
  }

  /**
   * 导入配置
   */
  importConfiguration(config: any): void {
    console.log('📥 导入交互配置...');

    try {
      // 更新参数值
      if (config.parameters) {
        for (const [key, paramConfig] of Object.entries(config.parameters as any)) {
          if (this.sceneState.parameters.has(key)) {
            this.updateParameter(key, (paramConfig as any).value);
          }
        }
      }

      // 更新时间控制
      if (config.timeControl) {
        this.sceneState.timeControl = { ...this.sceneState.timeControl, ...config.timeControl };
      }

      // 更新相机控制
      if (config.cameraControl) {
        this.sceneState.cameraControl = { ...this.sceneState.cameraControl, ...config.cameraControl };
      }

      // 更新渲染设置
      if (config.renderingMode) {
        this.sceneState.renderingMode = config.renderingMode;
      }
      if (config.qualityLevel) {
        this.sceneState.qualityLevel = config.qualityLevel;
      }

      this.triggerUpdate('config_import', config);
      console.log('✅ 配置导入完成');

    } catch (error) {
      console.error('❌ 配置导入失败:', error);
      throw new Error(`配置导入失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取交互统计
   */
  getInteractionStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    averageResponseTime: number;
    mostUsedParameters: string[];
    sessionDuration: number;
  } {
    const eventsByType: Record<string, number> = {};
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const event of this.eventHistory) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      if (event.data?.responseTime) {
        totalResponseTime += event.data.responseTime;
        responseCount++;
      }
    }

    const parameterUsage = new Map<string, number>();
    for (const event of this.eventHistory) {
      if (event.type === 'parameter_change' && event.data?.parameterId) {
        const count = parameterUsage.get(event.data.parameterId) || 0;
        parameterUsage.set(event.data.parameterId, count + 1);
      }
    }

    const mostUsedParameters = Array.from(parameterUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([param]) => param);

    const sessionStart = this.eventHistory.length > 0 ? this.eventHistory[0].timestamp : Date.now();
    const sessionDuration = Date.now() - sessionStart;

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      mostUsedParameters,
      sessionDuration
    };
  }
}

// 导出默认配置
export const defaultInteractiveConfig: InteractiveConfig = {
  enableRealTimeControl: true,
  enableParameterSliders: true,
  enableTimeControl: true,
  enableCameraControl: true,
  enablePhysicsToggle: true,
  maxFrameRate: 60,
  responseDelay: 16
};
