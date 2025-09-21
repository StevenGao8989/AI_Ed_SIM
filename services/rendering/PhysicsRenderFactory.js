"use strict";
// services/rendering/PhysicsRenderFactory.ts
// 物理渲染工厂：确保渲染器与物理仿真的完美匹配
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsRenderFactory = void 0;
exports.createPhysicsRenderer = createPhysicsRenderer;
const Physics2DRenderer_1 = require("./Physics2DRenderer");
const CoordinateSystem_1 = require("./CoordinateSystem");
/**
 * 物理渲染工厂
 */
class PhysicsRenderFactory {
    /**
     * 分析物理问题并生成最优渲染配置
     */
    static analyzePhysicsProblem(physicsParams, calculationResults) {
        const { m, h, g, theta, mu } = physicsParams;
        const { v1, sMax, fallTime, inclineTime, totalTime } = calculationResults;
        return {
            problemType: 'complex_mechanics',
            phases: ['自由落体', '弹性碰撞', '斜面滑动', '静止'],
            maxDistance: sMax,
            maxHeight: h,
            maxSpeed: v1,
            inclineAngle: theta,
            frictionCoeff: mu,
            timeRange: [0, totalTime]
        };
    }
    /**
     * 生成最优渲染配置
     */
    static generateOptimalRenderConfig(analysis, screenWidth = 1280, screenHeight = 720) {
        const warnings = [];
        const optimizations = [];
        // 1. 计算最优缩放比例
        const requiredWidth = analysis.maxDistance * 1.5; // 留50%余量
        const requiredHeight = analysis.maxHeight * 2; // 留100%余量
        const scaleX = (screenWidth * 0.8) / requiredWidth; // 使用80%屏幕宽度
        const scaleY = (screenHeight * 0.6) / requiredHeight; // 使用60%屏幕高度
        const optimalScale = Math.min(scaleX, scaleY, 100); // 最大100像素/米
        if (optimalScale < 20) {
            warnings.push(`缩放比例过小(${optimalScale.toFixed(1)}px/m)，可能影响视觉效果`);
            optimizations.push('建议增加屏幕分辨率或减少物理范围');
        }
        // 2. 计算最优偏移量
        const offsetX = screenWidth / 2;
        const offsetY = screenHeight - 100;
        // 3. 坐标系统配置
        const coordinateConfig = {
            scale: optimalScale,
            offsetX: offsetX,
            offsetY: offsetY,
            coordinateOrientation: 'xy_y_up'
        };
        // 4. 渲染配置
        const renderConfig = {
            width: screenWidth,
            height: screenHeight,
            fps: 30,
            duration: analysis.timeRange[1],
            backgroundColor: '#F0F8FF',
            showVectors: true,
            showAnnotations: true,
            showTrajectory: false,
            ballRadius: 0.1, // 物理半径（米）
            vectorScale: 0.5 // 矢量显示比例
        };
        // 5. 环境配置
        const environment = Physics2DRenderer_1.Physics2DRenderer.createStandardEnvironment(analysis.inclineAngle || 30, analysis.maxDistance, analysis.frictionCoeff || 0.2);
        // 6. 几何验证
        const coordSystem = new CoordinateSystem_1.UnifiedCoordinateSystem(coordinateConfig);
        const incline = environment.inclines[0];
        const geometryCheck = coordSystem.validateGeometry(incline, analysis.maxDistance, {
            width: screenWidth,
            height: screenHeight
        });
        if (!geometryCheck.valid) {
            warnings.push(...geometryCheck.issues);
            optimizations.push(...geometryCheck.recommendations);
        }
        return {
            coordinateConfig,
            renderConfig,
            environment,
            warnings,
            optimizations
        };
    }
    /**
     * 创建优化的2D渲染器
     */
    static createOptimizedRenderer(physicsParams, calculationResults, screenConfig = { width: 1280, height: 720 }) {
        // 1. 分析物理问题
        const analysis = this.analyzePhysicsProblem(physicsParams, calculationResults);
        // 2. 生成最优配置
        const recommendation = this.generateOptimalRenderConfig(analysis, screenConfig.width, screenConfig.height);
        // 3. 创建渲染器
        const renderer = new Physics2DRenderer_1.Physics2DRenderer(recommendation.coordinateConfig);
        console.log('🏭 物理渲染器配置完成:');
        console.log(`   📏 缩放比例: ${recommendation.coordinateConfig.scale}px/m`);
        console.log(`   📐 斜面长度: ${recommendation.environment.inclines[0].length.toFixed(2)}m`);
        console.log(`   🎯 覆盖距离: ${analysis.maxDistance.toFixed(2)}m`);
        if (recommendation.warnings.length > 0) {
            console.log('   ⚠️ 警告:', recommendation.warnings.join('; '));
        }
        if (recommendation.optimizations.length > 0) {
            console.log('   💡 优化建议:', recommendation.optimizations.join('; '));
        }
        return {
            renderer,
            config: recommendation.renderConfig,
            environment: recommendation.environment,
            analysis,
            warnings: recommendation.warnings
        };
    }
}
exports.PhysicsRenderFactory = PhysicsRenderFactory;
/**
 * 快速创建函数（用于测试和快速原型）
 */
function createPhysicsRenderer(physicsParams, calculationResults, screenConfig) {
    return PhysicsRenderFactory.createOptimizedRenderer(physicsParams, calculationResults, screenConfig);
}
