"use strict";
// services/rendering/CoordinateSystem.ts
// 统一坐标系统：确保所有渲染器使用一致的坐标转换
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultCoordinateSystem = exports.UnifiedCoordinateSystem = void 0;
/**
 * 统一坐标系统类
 */
class UnifiedCoordinateSystem {
    constructor(config = {}) {
        this.config = {
            scale: 80, // 默认80像素/米
            offsetX: 640, // 默认屏幕中心
            offsetY: 620, // 默认地面位置
            coordinateOrientation: 'xy_y_up', // 默认Y轴向上
            ...config
        };
    }
    /**
     * 物理坐标转屏幕坐标（核心转换函数）
     */
    worldToScreen(physicsPoint) {
        const screenX = this.config.offsetX + physicsPoint.x * this.config.scale;
        // Y轴转换：物理坐标Y向上为正，屏幕坐标Y向下为正
        const screenY = this.config.coordinateOrientation === 'xy_y_up'
            ? this.config.offsetY - physicsPoint.y * this.config.scale
            : this.config.offsetY + physicsPoint.y * this.config.scale;
        return { x: screenX, y: screenY };
    }
    /**
     * 屏幕坐标转物理坐标
     */
    screenToWorld(screenPoint) {
        const physicsX = (screenPoint.x - this.config.offsetX) / this.config.scale;
        const physicsY = this.config.coordinateOrientation === 'xy_y_up'
            ? (this.config.offsetY - screenPoint.y) / this.config.scale
            : (screenPoint.y - this.config.offsetY) / this.config.scale;
        return { x: physicsX, y: physicsY };
    }
    /**
     * 计算斜面上的点（确保小球贴合斜面）
     */
    calculateInclinePoint(distanceAlongIncline, incline, objectRadius = 0) {
        const angleRad = incline.angle * Math.PI / 180;
        // 沿斜面的位置
        const baseX = incline.startPoint.x + distanceAlongIncline * Math.cos(angleRad);
        const baseY = incline.startPoint.y + distanceAlongIncline * Math.sin(angleRad);
        // 如果有物体半径，需要考虑法向偏移（确保物体表面贴着斜面）
        if (objectRadius > 0) {
            const normalX = -Math.sin(angleRad); // 斜面法向量X分量
            const normalY = Math.cos(angleRad); // 斜面法向量Y分量
            return {
                x: baseX + normalX * objectRadius,
                y: baseY + normalY * objectRadius
            };
        }
        return { x: baseX, y: baseY };
    }
    /**
     * 计算斜面的屏幕端点
     */
    calculateInclineScreenPoints(incline) {
        const angleRad = incline.angle * Math.PI / 180;
        const startPhysics = incline.startPoint;
        const endPhysics = {
            x: incline.startPoint.x + incline.length * Math.cos(angleRad),
            y: incline.startPoint.y + incline.length * Math.sin(angleRad)
        };
        return {
            start: this.worldToScreen(startPhysics),
            end: this.worldToScreen(endPhysics)
        };
    }
    /**
     * 自动计算合适的斜面长度
     */
    calculateOptimalInclineLength(maxDistanceAlongIncline, screenWidth, margin = 50) {
        // 确保斜面长度能覆盖整个运动过程，并留有余量
        const requiredLength = maxDistanceAlongIncline * 1.2; // 增加20%余量
        // 检查屏幕空间限制
        const maxScreenLength = (screenWidth - this.config.offsetX - margin) / this.config.scale;
        return Math.min(requiredLength, maxScreenLength);
    }
    /**
     * 验证几何一致性
     */
    validateGeometry(incline, maxDistance, screenConfig) {
        const issues = [];
        const recommendations = [];
        // 1. 检查斜面长度是否足够
        if (incline.length < maxDistance) {
            issues.push(`斜面长度${incline.length.toFixed(2)}m不足以覆盖最大距离${maxDistance.toFixed(2)}m`);
            recommendations.push(`建议斜面长度至少为${(maxDistance * 1.2).toFixed(2)}m`);
        }
        // 2. 检查屏幕边界
        const endPoints = this.calculateInclineScreenPoints(incline);
        if (endPoints.end.x > screenConfig.width || endPoints.end.y < 0) {
            issues.push('斜面超出屏幕边界');
            recommendations.push('减小scale比例或调整斜面起始位置');
        }
        // 3. 检查角度合理性
        if (incline.angle <= 0 || incline.angle >= 90) {
            issues.push(`斜面角度${incline.angle}°不在合理范围内`);
            recommendations.push('斜面角度应在0°-90°之间');
        }
        return {
            valid: issues.length === 0,
            issues,
            recommendations
        };
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
exports.UnifiedCoordinateSystem = UnifiedCoordinateSystem;
/**
 * 默认坐标系统实例
 */
exports.defaultCoordinateSystem = new UnifiedCoordinateSystem();
