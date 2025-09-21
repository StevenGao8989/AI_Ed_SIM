// services/rendering/RenderingManager.ts
// 渲染管理器：确保所有渲染器遵循统一标准，防止几何不一致问题

import { UnifiedCoordinateSystem, PhysicsPoint } from './CoordinateSystem';
import { RenderingStrategyFactory, BaseRenderingStrategy } from './RenderingStrategy';
import { PhysicsRenderFactory } from './PhysicsRenderFactory';

/**
 * 渲染质量标准
 */
export interface RenderQualityStandards {
  geometryConsistency: {
    maxCoordinateDeviation: number;    // 最大坐标偏差（像素）
    inclineContactTolerance: number;   // 斜面接触容差（像素）
    scalingUniformity: number;         // 缩放一致性要求
  };
  physicsAccuracy: {
    trajectorySmoothing: boolean;      // 轨迹平滑
    eventSynchronization: boolean;     // 事件同步
    phaseTransition: boolean;          // 阶段过渡
  };
  visualQuality: {
    minFrameRate: number;              // 最小帧率
    vectorAlignment: boolean;          // 矢量对齐
    annotationClarity: boolean;        // 注释清晰度
  };
}

/**
 * 渲染验证结果
 */
export interface RenderValidationResult {
  geometryValid: boolean;
  physicsValid: boolean;
  visualValid: boolean;
  overallScore: number;
  issues: string[];
  recommendations: string[];
}

/**
 * 渲染管理器
 */
export class RenderingManager {
  private qualityStandards: RenderQualityStandards;
  private coordinateSystem: UnifiedCoordinateSystem;

  constructor() {
    this.qualityStandards = {
      geometryConsistency: {
        maxCoordinateDeviation: 2.0,
        inclineContactTolerance: 1.0,
        scalingUniformity: 0.95
      },
      physicsAccuracy: {
        trajectorySmoothing: true,
        eventSynchronization: true,
        phaseTransition: true
      },
      visualQuality: {
        minFrameRate: 24,
        vectorAlignment: true,
        annotationClarity: true
      }
    };
    
    this.coordinateSystem = new UnifiedCoordinateSystem();
  }

  /**
   * 创建符合标准的渲染器
   */
  createStandardRenderer(
    renderType: '2d_canvas' | '3d_webgl',
    physicsParams: any,
    calculationResults: any,
    screenConfig: { width: number; height: number }
  ): {
    renderer: BaseRenderingStrategy;
    config: any;
    environment: any;
    validation: RenderValidationResult;
  } {
    console.log('🏭 创建标准化物理渲染器...');
    
    // 1. 使用工厂创建优化的渲染器
    const renderSetup = PhysicsRenderFactory.createOptimizedRenderer(
      physicsParams,
      calculationResults,
      screenConfig
    );

    // 2. 创建渲染策略
    const strategy = RenderingStrategyFactory.createStrategy(
      renderType,
      physicsParams,
      calculationResults,
      screenConfig
    );

    // 3. 验证几何一致性
    const validation = this.validateRenderSetup(
      strategy,
      renderSetup.environment,
      renderSetup.analysis,
      screenConfig
    );

    console.log(`📊 渲染器验证: ${validation.overallScore.toFixed(2)}/1.0`);
    if (validation.issues.length > 0) {
      console.warn('⚠️ 发现问题:', validation.issues.join('; '));
    }
    if (validation.recommendations.length > 0) {
      console.log('💡 优化建议:', validation.recommendations.join('; '));
    }

    return {
      renderer: strategy,
      config: renderSetup.config,
      environment: renderSetup.environment,
      validation: validation
    };
  }

  /**
   * 验证渲染设置
   */
  private validateRenderSetup(
    strategy: BaseRenderingStrategy,
    environment: any,
    analysis: any,
    screenConfig: any
  ): RenderValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let geometryValid = true;
    let physicsValid = true;
    let visualValid = true;

    // 1. 几何一致性验证
    const geometryCheck = strategy.validateGeometry(analysis.maxDistance, screenConfig);
    if (!geometryCheck.valid) {
      geometryValid = false;
      issues.push(...geometryCheck.issues);
    }

    // 2. 物理准确性验证
    if (environment.inclines && environment.inclines.length > 0) {
      const incline = environment.inclines[0];
      
      // 检查斜面长度是否足够
      if (incline.length < analysis.maxDistance) {
        physicsValid = false;
        issues.push(`斜面长度${incline.length.toFixed(2)}m不足以覆盖运动距离${analysis.maxDistance.toFixed(2)}m`);
        recommendations.push('增加斜面长度或调整缩放比例');
      }
      
      // 检查角度合理性
      if (incline.angle <= 0 || incline.angle >= 90) {
        physicsValid = false;
        issues.push(`斜面角度${incline.angle}°不合理`);
      }
    }

    // 3. 视觉质量验证
    const coordConfig = strategy.getCoordinateConfig();
    if (coordConfig.scale < 20) {
      visualValid = false;
      issues.push(`缩放比例${coordConfig.scale}px/m过小，影响视觉效果`);
      recommendations.push('增加缩放比例或减小物理范围');
    }

    // 计算总分
    const scores = [
      geometryValid ? 1 : 0,
      physicsValid ? 1 : 0,
      visualValid ? 1 : 0
    ];
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      geometryValid,
      physicsValid,
      visualValid,
      overallScore,
      issues,
      recommendations
    };
  }

  /**
   * 强制几何一致性检查
   */
  enforceGeometryConsistency(
    objectPosition: PhysicsPoint,
    inclineDistance: number,
    inclineAngle: number,
    objectRadius: number
  ): PhysicsPoint {
    // 如果物体应该在斜面上，强制计算正确的贴合位置
    if (inclineDistance >= 0) {
      return this.coordinateSystem.calculateInclinePoint(
        inclineDistance,
        {
          angle: inclineAngle,
          length: inclineDistance * 2,
          startPoint: { x: 0, y: 0 }
        },
        objectRadius
      );
    }
    
    return objectPosition;
  }

  /**
   * 获取质量标准
   */
  getQualityStandards(): RenderQualityStandards {
    return { ...this.qualityStandards };
  }

  /**
   * 更新质量标准
   */
  updateQualityStandards(newStandards: Partial<RenderQualityStandards>): void {
    this.qualityStandards = { ...this.qualityStandards, ...newStandards };
  }
}

/**
 * 全局渲染管理器实例
 */
export const globalRenderingManager = new RenderingManager();
