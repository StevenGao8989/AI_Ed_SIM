"use strict";
/**
 * 结果验证器 - 验证仿真结果的质量和完整性
 *
 * 功能：
 * 1. 数据完整性检查
 * 2. 数据质量评估
 * 3. 异常检测
 * 4. 自动修复建议
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultValidator = void 0;
// 结果验证器类
class ResultValidator {
    constructor(config = {}) {
        this.config = {
            enableDataIntegrityCheck: true,
            enableQualityAssessment: true,
            enableAnomalyDetection: true,
            enablePerformanceCheck: true,
            tolerance: {
                missingData: 0.05, // 5%
                outlierRatio: 0.1, // 10%
                continuityThreshold: 0.01
            },
            ...config
        };
    }
    /**
     * 执行自检
     */
    async performSelfCheck(simulationResult, ir, config = {}) {
        const mergedConfig = { ...this.config, ...config };
        const result = {
            success: false,
            overallScore: 0,
            dataIntegrity: {
                totalDataPoints: 0,
                missingData: 0,
                corruptedData: 0,
                missingRatio: 0,
                corruptedRatio: 0,
                passed: false
            },
            qualityAssessment: {
                overallQuality: 0,
                continuityScore: 0,
                consistencyScore: 0,
                outlierRatio: 0,
                noiseLevel: 0,
                recommendations: []
            },
            anomalies: [],
            performanceMetrics: {
                processingTime: 0,
                memoryUsage: 0,
                dataSize: 0
            },
            recommendations: [],
            errors: [],
            warnings: []
        };
        try {
            console.log('🔍 Starting result validation...');
            // 1. 数据完整性检查
            if (mergedConfig.enableDataIntegrityCheck) {
                result.dataIntegrity = await this.checkDataIntegrity(simulationResult);
            }
            // 2. 质量评估
            if (mergedConfig.enableQualityAssessment) {
                result.qualityAssessment = await this.assessQuality(simulationResult);
            }
            // 3. 异常检测
            if (mergedConfig.enableAnomalyDetection) {
                result.anomalies = await this.detectAnomalies(simulationResult);
            }
            // 4. 性能检查
            if (mergedConfig.enablePerformanceCheck) {
                result.performanceMetrics = await this.checkPerformance(simulationResult);
            }
            // 5. 计算总体分数
            result.overallScore = this.calculateOverallScore(result);
            // 6. 生成建议
            result.recommendations = this.generateRecommendations(result);
            // 7. 确定是否成功
            result.success = result.overallScore >= 0.8 && result.errors.length === 0;
            console.log(`✅ Result validation completed. Score: ${result.overallScore.toFixed(2)}`);
        }
        catch (error) {
            result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.success = false;
        }
        return result;
    }
    /**
     * 检查数据完整性
     */
    async checkDataIntegrity(simulationResult) {
        const timeSeries = simulationResult.timeSeries;
        const totalDataPoints = timeSeries.length;
        let missingData = 0;
        let corruptedData = 0;
        // 检查每个时间点的数据
        for (const data of timeSeries) {
            // 检查对象数据
            for (const [objectId, obj] of Object.entries(data.objects)) {
                // 检查缺失数据
                if (obj.position === undefined || obj.velocity === undefined || obj.mass === undefined) {
                    missingData++;
                }
                // 检查损坏数据
                if (isNaN(obj.position.x) || isNaN(obj.position.y) || isNaN(obj.position.z) ||
                    isNaN(obj.velocity.x) || isNaN(obj.velocity.y) || isNaN(obj.velocity.z) ||
                    isNaN(obj.mass)) {
                    corruptedData++;
                }
            }
        }
        const missingRatio = totalDataPoints > 0 ? missingData / totalDataPoints : 0;
        const corruptedRatio = totalDataPoints > 0 ? corruptedData / totalDataPoints : 0;
        const passed = missingRatio <= this.config.tolerance.missingData &&
            corruptedRatio <= this.config.tolerance.missingData;
        return {
            totalDataPoints,
            missingData,
            corruptedData,
            missingRatio,
            corruptedRatio,
            passed
        };
    }
    /**
     * 评估数据质量
     */
    async assessQuality(simulationResult) {
        const timeSeries = simulationResult.timeSeries;
        // 连续性评分
        const continuityScore = this.calculateContinuityScore(timeSeries);
        // 一致性评分
        const consistencyScore = this.calculateConsistencyScore(timeSeries);
        // 异常值比例
        const outlierRatio = this.calculateOutlierRatio(timeSeries);
        // 噪声水平
        const noiseLevel = this.calculateNoiseLevel(timeSeries);
        // 总体质量
        const overallQuality = (continuityScore + consistencyScore + (1 - outlierRatio) + (1 - noiseLevel)) / 4;
        // 生成建议
        const recommendations = [];
        if (continuityScore < 0.8) {
            recommendations.push('Consider reducing time step size for better continuity');
        }
        if (consistencyScore < 0.8) {
            recommendations.push('Check for numerical instabilities');
        }
        if (outlierRatio > this.config.tolerance.outlierRatio) {
            recommendations.push('Review outlier detection and filtering');
        }
        if (noiseLevel > 0.1) {
            recommendations.push('Consider noise reduction techniques');
        }
        return {
            overallQuality,
            continuityScore,
            consistencyScore,
            outlierRatio,
            noiseLevel,
            recommendations
        };
    }
    /**
     * 计算连续性评分
     */
    calculateContinuityScore(timeSeries) {
        if (timeSeries.length < 2)
            return 1.0;
        let continuityViolations = 0;
        let totalChecks = 0;
        for (let i = 1; i < timeSeries.length; i++) {
            const prev = timeSeries[i - 1];
            const curr = timeSeries[i];
            for (const [objectId, currObj] of Object.entries(curr.objects)) {
                const prevObj = prev.objects[objectId];
                if (prevObj) {
                    totalChecks++;
                    // 检查位置连续性
                    const displacement = Math.sqrt(Math.pow(currObj.position.x - prevObj.position.x, 2) +
                        Math.pow(currObj.position.y - prevObj.position.y, 2) +
                        Math.pow(currObj.position.z - prevObj.position.z, 2));
                    const timeDiff = curr.time - prev.time;
                    const maxExpectedDisplacement = Math.sqrt(Math.pow(prevObj.velocity.x, 2) +
                        Math.pow(prevObj.velocity.y, 2) +
                        Math.pow(prevObj.velocity.z, 2)) * timeDiff * 2; // 允许2倍的最大可能位移
                    if (displacement > maxExpectedDisplacement) {
                        continuityViolations++;
                    }
                }
            }
        }
        return totalChecks > 0 ? 1 - (continuityViolations / totalChecks) : 1.0;
    }
    /**
     * 计算一致性评分
     */
    calculateConsistencyScore(timeSeries) {
        if (timeSeries.length < 3)
            return 1.0;
        let consistencyViolations = 0;
        let totalChecks = 0;
        for (let i = 1; i < timeSeries.length - 1; i++) {
            const prev = timeSeries[i - 1];
            const curr = timeSeries[i];
            const next = timeSeries[i + 1];
            for (const [objectId, currObj] of Object.entries(curr.objects)) {
                const prevObj = prev.objects[objectId];
                const nextObj = next.objects[objectId];
                if (prevObj && nextObj) {
                    totalChecks++;
                    // 检查加速度一致性
                    const prevVel = prevObj.velocity;
                    const currVel = currObj.velocity;
                    const nextVel = nextObj.velocity;
                    const accel1 = {
                        x: (currVel.x - prevVel.x) / (curr.time - prev.time),
                        y: (currVel.y - prevVel.y) / (curr.time - prev.time),
                        z: (currVel.z - prevVel.z) / (curr.time - prev.time)
                    };
                    const accel2 = {
                        x: (nextVel.x - currVel.x) / (next.time - curr.time),
                        y: (nextVel.y - currVel.y) / (next.time - curr.time),
                        z: (nextVel.z - currVel.z) / (next.time - curr.time)
                    };
                    const accelDiff = Math.sqrt(Math.pow(accel1.x - accel2.x, 2) +
                        Math.pow(accel1.y - accel2.y, 2) +
                        Math.pow(accel1.z - accel2.z, 2));
                    if (accelDiff > this.config.tolerance.continuityThreshold) {
                        consistencyViolations++;
                    }
                }
            }
        }
        return totalChecks > 0 ? 1 - (consistencyViolations / totalChecks) : 1.0;
    }
    /**
     * 计算异常值比例
     */
    calculateOutlierRatio(timeSeries) {
        if (timeSeries.length < 3)
            return 0;
        let outliers = 0;
        let totalValues = 0;
        // 对每个对象的速度进行异常值检测
        for (const [objectId] of Object.entries(timeSeries[0].objects)) {
            const speeds = [];
            for (const data of timeSeries) {
                const obj = data.objects[objectId];
                if (obj) {
                    const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                        Math.pow(obj.velocity.y, 2) +
                        Math.pow(obj.velocity.z, 2));
                    speeds.push(speed);
                    totalValues++;
                }
            }
            if (speeds.length > 2) {
                // 使用简单的异常值检测（基于标准差）
                const mean = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
                const variance = speeds.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / speeds.length;
                const stdDev = Math.sqrt(variance);
                for (const speed of speeds) {
                    if (Math.abs(speed - mean) > 3 * stdDev) {
                        outliers++;
                    }
                }
            }
        }
        return totalValues > 0 ? outliers / totalValues : 0;
    }
    /**
     * 计算噪声水平
     */
    calculateNoiseLevel(timeSeries) {
        if (timeSeries.length < 2)
            return 0;
        let totalNoise = 0;
        let totalChecks = 0;
        for (let i = 1; i < timeSeries.length; i++) {
            const prev = timeSeries[i - 1];
            const curr = timeSeries[i];
            for (const [objectId, currObj] of Object.entries(curr.objects)) {
                const prevObj = prev.objects[objectId];
                if (prevObj) {
                    totalChecks++;
                    // 计算速度变化的高频成分（噪声）
                    const velChange = Math.sqrt(Math.pow(currObj.velocity.x - prevObj.velocity.x, 2) +
                        Math.pow(currObj.velocity.y - prevObj.velocity.y, 2) +
                        Math.pow(currObj.velocity.z - prevObj.velocity.z, 2));
                    totalNoise += velChange;
                }
            }
        }
        return totalChecks > 0 ? totalNoise / totalChecks : 0;
    }
    /**
     * 检测异常
     */
    async detectAnomalies(simulationResult) {
        const anomalies = [];
        const timeSeries = simulationResult.timeSeries;
        // 检测时间序列异常
        for (let i = 1; i < timeSeries.length; i++) {
            const prev = timeSeries[i - 1];
            const curr = timeSeries[i];
            // 检查时间步长异常
            const timeDiff = curr.time - prev.time;
            if (timeDiff <= 0) {
                anomalies.push(`Invalid time step at index ${i}: ${timeDiff}`);
            }
            // 检查对象数量变化
            const prevObjectCount = Object.keys(prev.objects).length;
            const currObjectCount = Object.keys(curr.objects).length;
            if (prevObjectCount !== currObjectCount) {
                anomalies.push(`Object count changed from ${prevObjectCount} to ${currObjectCount} at time ${curr.time}`);
            }
        }
        // 检测物理异常
        for (const data of timeSeries) {
            for (const [objectId, obj] of Object.entries(data.objects)) {
                // 检查异常大的速度
                const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                    Math.pow(obj.velocity.y, 2) +
                    Math.pow(obj.velocity.z, 2));
                if (speed > 1000) {
                    anomalies.push(`Object ${objectId} has extremely high speed: ${speed} at time ${data.time}`);
                }
                // 检查异常大的加速度
                const acceleration = Math.sqrt(Math.pow(obj.acceleration.x, 2) +
                    Math.pow(obj.acceleration.y, 2) +
                    Math.pow(obj.acceleration.z, 2));
                if (acceleration > 100) {
                    anomalies.push(`Object ${objectId} has extremely high acceleration: ${acceleration} at time ${data.time}`);
                }
            }
        }
        return anomalies;
    }
    /**
     * 检查性能指标
     */
    async checkPerformance(simulationResult) {
        const processingTime = simulationResult.statistics.computationTime;
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        const dataSize = JSON.stringify(simulationResult).length / 1024; // KB
        return {
            processingTime,
            memoryUsage,
            dataSize
        };
    }
    /**
     * 计算总体分数
     */
    calculateOverallScore(result) {
        let score = 1.0;
        // 数据完整性
        if (result.dataIntegrity.passed) {
            score *= 0.3;
        }
        else {
            score *= 0.1;
        }
        // 质量评估
        score *= result.qualityAssessment.overallQuality * 0.4;
        // 异常检测
        if (result.anomalies.length === 0) {
            score *= 0.3;
        }
        else {
            score *= Math.max(0.1, 0.3 - result.anomalies.length * 0.05);
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * 生成建议
     */
    generateRecommendations(result) {
        const recommendations = [];
        // 数据完整性建议
        if (!result.dataIntegrity.passed) {
            recommendations.push('Improve data collection and validation');
            recommendations.push('Check for missing or corrupted data points');
        }
        // 质量建议
        recommendations.push(...result.qualityAssessment.recommendations);
        // 异常建议
        if (result.anomalies.length > 0) {
            recommendations.push('Review and fix detected anomalies');
            recommendations.push('Consider improving numerical stability');
        }
        // 性能建议
        if (result.performanceMetrics.processingTime > 10000) {
            recommendations.push('Consider optimizing simulation performance');
        }
        if (result.performanceMetrics.memoryUsage > 1000) {
            recommendations.push('Consider reducing memory usage');
        }
        return recommendations;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.ResultValidator = ResultValidator;
