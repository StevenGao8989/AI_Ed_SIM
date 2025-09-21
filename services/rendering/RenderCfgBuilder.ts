// services/rendering/RenderCfgBuilder.ts
// 渲染配置构建器：从Contract和Trace自动生成最优渲染配置

import type { PhysicsContract, SimTrace } from '../simulation/Simulator';

/**
 * UI选项
 */
export interface UIOptions {
  fps: number;
  size: [number, number]; // [width, height]
  style?: '2d' | '3d' | 'minimal';
  showVectors?: boolean;
  showTrajectory?: boolean;
  showEnergy?: boolean;
  showAnnotations?: boolean;
  backgroundColor?: string;
  theme?: 'light' | 'dark' | 'physics';
}

/**
 * 相机配置
 */
export interface CameraConfig {
  type: 'fixed' | 'follow' | 'orbit' | 'adaptive';
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  };
}

/**
 * 渲染配置
 */
export interface RenderConfig {
  // 基础配置
  width: number;
  height: number;
  fps: number;
  duration: number;
  
  // 坐标系统
  coordinate: {
    scale: number;           // 像素/米
    offsetX: number;         // 屏幕偏移X
    offsetY: number;         // 屏幕偏移Y
    orientation: 'xy_y_up' | 'xy_y_down';
  };
  
  // 相机配置
  camera: CameraConfig;
  
  // 视觉样式
  style: {
    backgroundColor: string;
    gridEnabled: boolean;
    axesEnabled: boolean;
    shadowsEnabled: boolean;
  };
  
  // 物体渲染
  objects: {
    [bodyId: string]: {
      color: string;
      opacity: number;
      wireframe: boolean;
      showVelocity: boolean;
      showForces: boolean;
    };
  };
  
  // 环境渲染
  environment: {
    surfaces: {
      [surfaceId: string]: {
        color: string;
        opacity: number;
        texture?: string;
        showNormals: boolean;
      };
    };
    lighting: {
      ambient: number;
      directional: {
        intensity: number;
        direction: [number, number, number];
        color: string;
      };
    };
  };
  
  // 叠加层
  overlays: {
    showTime: boolean;
    showEnergy: boolean;
    showParameters: boolean;
    showEvents: boolean;
    annotations: Array<{
      text: string;
      position: [number, number];
      style: any;
    }>;
  };
}

/**
 * 渲染配置构建器
 */
export class RenderCfgBuilder {
  
  /**
   * 从Contract和Trace构建渲染配置
   */
  static from(
    contract: PhysicsContract,
    trace: SimTrace,
    uiOpts: UIOptions
  ): RenderConfig {
    console.log('🏗️ 构建渲染配置...');
    
    // 1. 分析轨迹边界
    const bounds = this.analyzeBounds(trace);
    console.log('📊 轨迹边界:', bounds);
    
    // 2. 计算最优坐标系统
    const coordinate = this.calculateOptimalCoordinate(bounds, uiOpts.size);
    console.log('📐 坐标系统:', coordinate);
    
    // 3. 配置相机
    const camera = this.configureCameraAdaptive(bounds, coordinate, uiOpts);
    console.log('📷 相机配置:', camera.type, camera.position);
    
    // 4. 配置视觉样式
    const style = this.configureVisualStyle(contract, uiOpts);
    
    // 5. 配置物体渲染
    const objects = this.configureObjectRendering(contract, trace);
    
    // 6. 配置环境渲染
    const environment = this.configureEnvironmentRendering(contract);
    
    // 7. 配置叠加层
    const overlays = this.configureOverlays(contract, trace, uiOpts);
    
    const config: RenderConfig = {
      width: uiOpts.size[0],
      height: uiOpts.size[1],
      fps: uiOpts.fps,
      duration: trace.samples[trace.samples.length - 1]?.t || 0,
      coordinate,
      camera,
      style,
      objects,
      environment,
      overlays
    };
    
    console.log('✅ 渲染配置构建完成');
    return config;
  }

  /**
   * 分析轨迹边界（AABB）
   */
  private static analyzeBounds(trace: SimTrace): {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minT: number; maxT: number;
  } {
    // 处理空轨迹的情况
    if (!trace.samples || trace.samples.length === 0) {
      return {
        minX: -5, maxX: 5,
        minY: -5, maxY: 5,
        minT: 0, maxT: 1
      };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minT = Infinity, maxT = -Infinity;
    
    for (const sample of trace.samples) {
      minT = Math.min(minT, sample.t);
      maxT = Math.max(maxT, sample.t);
      
      for (const [bodyId, state] of Object.entries(sample.bodies)) {
        minX = Math.min(minX, state.x);
        maxX = Math.max(maxX, state.x);
        minY = Math.min(minY, state.y);
        maxY = Math.max(maxY, state.y);
      }
    }
    
    // 处理无有效数据的情况
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return {
        minX: -5, maxX: 5,
        minY: -5, maxY: 5,
        minT: minT !== Infinity ? minT : 0,
        maxT: maxT !== -Infinity ? maxT : 1
      };
    }
    
    // 添加边距
    const marginX = Math.max((maxX - minX) * 0.1, 0.5); // 最小0.5米边距
    const marginY = Math.max((maxY - minY) * 0.1, 0.5); // 最小0.5米边距
    
    return {
      minX: minX - marginX,
      maxX: maxX + marginX,
      minY: minY - marginY,
      maxY: maxY + marginY,
      minT: minT,
      maxT: maxT
    };
  }

  /**
   * 计算最优坐标系统
   */
  private static calculateOptimalCoordinate(
    bounds: {
      minX: number; maxX: number;
      minY: number; maxY: number;
      minT: number; maxT: number;
    },
    size: [number, number]
  ): RenderConfig['coordinate'] {
    const [width, height] = size;
    
    // 计算物理尺寸
    const physicsWidth = Math.max(bounds.maxX - bounds.minX, 0.1); // 最小0.1米
    const physicsHeight = Math.max(bounds.maxY - bounds.minY, 0.1); // 最小0.1米
    
    // 计算缩放比例（保持纵横比）
    const scaleX = (width * 0.8) / physicsWidth;   // 使用80%屏幕宽度
    const scaleY = (height * 0.6) / physicsHeight; // 使用60%屏幕高度
    const scale = Math.min(scaleX, scaleY, 200);   // 最大200像素/米
    
    // 计算偏移量（居中显示）
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    const offsetX = width / 2 - centerX * scale;
    const offsetY = height - 100; // 地面在底部100px处
    
    return {
      scale: scale,
      offsetX: offsetX,
      offsetY: offsetY,
      orientation: 'xy_y_up'
    };
  }

  /**
   * 配置自适应相机
   */
  private static configureCameraAdaptive(
    bounds: {
      minX: number; maxX: number;
      minY: number; maxY: number;
      minT: number; maxT: number;
    },
    coordinate: RenderConfig['coordinate'],
    uiOpts: UIOptions
  ): CameraConfig {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const centerZ = 0;
    
    // 计算相机距离
    const physicsSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const cameraDistance = physicsSize * 2;
    
    return {
      type: 'adaptive',
      position: [centerX, centerY, cameraDistance],
      target: [centerX, centerY, centerZ],
      fov: 45,
      near: 0.1,
      far: cameraDistance * 10,
      bounds: {
        minX: bounds.minX, maxX: bounds.maxX,
        minY: bounds.minY, maxY: bounds.maxY,
        minZ: -physicsSize, maxZ: physicsSize
      }
    };
  }

  /**
   * 配置视觉样式
   */
  private static configureVisualStyle(
    contract: PhysicsContract,
    uiOpts: UIOptions
  ): RenderConfig['style'] {
    const themes = {
      light: { backgroundColor: '#F0F8FF', grid: true, axes: true, shadows: false },
      dark: { backgroundColor: '#1a1a1a', grid: true, axes: true, shadows: true },
      physics: { backgroundColor: '#F5F5F5', grid: false, axes: false, shadows: true }
    };
    
    const theme = themes[uiOpts.theme || 'physics'];
    
    return {
      backgroundColor: uiOpts.backgroundColor || theme.backgroundColor,
      gridEnabled: theme.grid,
      axesEnabled: theme.axes,
      shadowsEnabled: theme.shadows
    };
  }

  /**
   * 配置物体渲染
   */
  private static configureObjectRendering(
    contract: PhysicsContract,
    trace: SimTrace
  ): RenderConfig['objects'] {
    const objects: RenderConfig['objects'] = {};
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    contract.bodies.forEach((body, index) => {
      objects[body.id] = {
        color: colors[index % colors.length],
        opacity: 1.0,
        wireframe: false,
        showVelocity: true,
        showForces: true
      };
    });
    
    return objects;
  }

  /**
   * 配置环境渲染
   */
  private static configureEnvironmentRendering(
    contract: PhysicsContract
  ): RenderConfig['environment'] {
    const surfaces: RenderConfig['environment']['surfaces'] = {};
    
    contract.surfaces.forEach(surface => {
      surfaces[surface.id] = {
        color: surface.id === 'ground' ? '#8B4513' : '#696969',
        opacity: 1.0,
        showNormals: false
      };
    });
    
    return {
      surfaces: surfaces,
      lighting: {
        ambient: 0.4,
        directional: {
          intensity: 0.8,
          direction: [1, 1, 1],
          color: '#ffffff'
        }
      }
    };
  }

  /**
   * 配置叠加层
   */
  private static configureOverlays(
    contract: PhysicsContract,
    trace: SimTrace,
    uiOpts: UIOptions
  ): RenderConfig['overlays'] {
    const annotations: Array<{
      text: string;
      position: [number, number];
      style: any;
    }> = [];
    
    // 物理参数注释
    if (uiOpts.showAnnotations !== false) {
      contract.bodies.forEach(body => {
        annotations.push({
          text: `质量: ${body.mass}kg`,
          position: [20, 40] as [number, number],
          style: { font: '16px Arial', color: '#000' }
        });
      });
      
      if (contract.world.gravity) {
        const g = Math.abs(contract.world.gravity[1]);
        annotations.push({
          text: `重力: ${g}m/s²`,
          position: [20, 65] as [number, number],
          style: { font: '16px Arial', color: '#000' }
        });
      }
    }
    
    return {
      showTime: true,
      showEnergy: uiOpts.showEnergy !== false,
      showParameters: true,
      showEvents: true,
      annotations: annotations
    };
  }

  /**
   * 验证渲染配置
   */
  static validateConfig(config: RenderConfig): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // 检查基础参数
    if (config.width <= 0 || config.height <= 0) {
      issues.push('屏幕尺寸必须为正数');
    }
    
    if (config.fps <= 0 || config.fps > 120) {
      issues.push('帧率应在1-120之间');
    }
    
    if (config.coordinate.scale <= 0) {
      issues.push('坐标缩放比例必须为正数');
    }
    
    // 检查相机配置
    if (config.camera.near >= config.camera.far) {
      issues.push('相机近平面必须小于远平面');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * 优化配置性能
   */
  static optimizeForPerformance(config: RenderConfig): RenderConfig {
    const optimized = { ...config };
    
    // 根据分辨率调整质量
    const pixelCount = config.width * config.height;
    
    if (pixelCount > 1920 * 1080) {
      // 4K及以上：启用高质量特效
      optimized.style.shadowsEnabled = true;
      optimized.environment.lighting.ambient = 0.3;
    } else if (pixelCount > 1280 * 720) {
      // 1080p：平衡质量和性能
      optimized.style.shadowsEnabled = true;
      optimized.environment.lighting.ambient = 0.4;
    } else {
      // 720p及以下：优化性能
      optimized.style.shadowsEnabled = false;
      optimized.environment.lighting.ambient = 0.5;
    }
    
    return optimized;
  }
}

/**
 * 默认配置构建器
 */
export const renderCfgBuilder = RenderCfgBuilder;
