"use strict";
/**
 * 状态监控器 - 监控仿真状态和性能
 *
 * 功能：
 * 1. 状态历史记录
 * 2. 性能指标监控
 * 3. 异常状态检测
 * 4. 历史状态记录
 * 5. 状态分析报告
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMonitor = void 0;
// 状态监控器类
class StateMonitor {
    constructor(config = {}) {
        this.config = {
            enableHistory: true,
            maxHistorySize: 1000,
            enablePerformanceMonitoring: true,
            enableAnomalyDetection: true,
            anomalyThreshold: 0.1,
            reportInterval: 1000, // 1秒
            ...config
        };
        this.history = [];
        this.currentState = null;
        this.performanceHistory = [];
        this.anomalyHistory = [];
        this.startTime = Date.now();
        this.lastReportTime = this.startTime;
    }
    /**
     * 更新状态
     */
    updateState(state) {
        const currentTime = Date.now();
        const stepStartTime = this.lastReportTime;
        // 计算性能指标
        const performance = this.calculatePerformanceMetrics(state, stepStartTime);
        // 检测异常
        let anomalies = [];
        if (this.config.enableAnomalyDetection) {
            const anomaly = this.detectAnomalies(state);
            if (anomaly) {
                anomalies = [anomaly];
                this.anomalyHistory.push(anomaly);
            }
        }
        // 记录历史
        if (this.config.enableHistory) {
            this.history.push({
                timestamp: currentTime,
                state: this.cloneState(state),
                performance,
                anomalies
            });
            // 限制历史记录大小
            if (this.history.length > this.config.maxHistorySize) {
                this.history.shift();
            }
        }
        // 记录性能历史
        if (this.config.enablePerformanceMonitoring) {
            this.performanceHistory.push(performance);
            if (this.performanceHistory.length > this.config.maxHistorySize) {
                this.performanceHistory.shift();
            }
        }
        this.currentState = state;
        this.lastReportTime = currentTime;
        // 定期生成报告
        if (currentTime - this.startTime >= this.config.reportInterval) {
            this.generateReport();
        }
    }
    /**
     * 计算性能指标
     */
    calculatePerformanceMetrics(state, stepStartTime) {
        const currentTime = Date.now();
        const stepTime = currentTime - stepStartTime;
        // 简化的性能指标计算
        return {
            stepTime,
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            cpuUsage: 0, // 简化实现
            eventCount: 0, // 简化实现
            convergenceRate: this.calculateStabilityScore(state)
        };
    }
    /**
     * 计算稳定性分数
     */
    calculateStabilityScore(state) {
        // 简化的稳定性计算
        let totalVelocity = 0;
        let objectCount = 0;
        for (const obj of Object.values(state.objects)) {
            const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                Math.pow(obj.velocity.y, 2) +
                Math.pow(obj.velocity.z, 2));
            totalVelocity += speed;
            objectCount++;
        }
        return objectCount > 0 ? totalVelocity / objectCount : 0;
    }
    /**
     * 检测异常
     */
    detectAnomalies(state) {
        // 检测发散
        const divergence = this.detectDivergence(state);
        if (divergence)
            return divergence;
        // 检测振荡
        const oscillation = this.detectOscillation(state);
        if (oscillation)
            return oscillation;
        // 检测不稳定性
        const instability = this.detectInstability(state);
        if (instability)
            return instability;
        // 检测能量泄漏
        const energyLeak = this.detectEnergyLeak(state);
        if (energyLeak)
            return energyLeak;
        return null;
    }
    /**
     * 检测发散
     */
    detectDivergence(state) {
        // 简化的发散检测
        for (const obj of Object.values(state.objects)) {
            const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                Math.pow(obj.velocity.y, 2) +
                Math.pow(obj.velocity.z, 2));
            if (speed > 1000) { // 异常高的速度
                return {
                    type: 'divergence',
                    severity: 'critical',
                    description: 'Object velocity diverging',
                    timestamp: Date.now(),
                    data: { speed, object: obj }
                };
            }
        }
        return null;
    }
    /**
     * 检测振荡
     */
    detectOscillation(state) {
        // 简化的振荡检测
        if (this.history.length < 10)
            return null;
        const recentStates = this.history.slice(-10);
        let oscillationCount = 0;
        for (let i = 1; i < recentStates.length - 1; i++) {
            const prev = recentStates[i - 1];
            const curr = recentStates[i];
            const next = recentStates[i + 1];
            // 检查速度方向的振荡
            for (const [objectId, obj] of Object.entries(curr.state.objects)) {
                const prevObj = prev.state.objects[objectId];
                const nextObj = next.state.objects[objectId];
                if (prevObj && nextObj) {
                    const prevVel = prevObj.velocity.x;
                    const currVel = obj.velocity.x;
                    const nextVel = nextObj.velocity.x;
                    if ((prevVel > currVel && nextVel > currVel) ||
                        (prevVel < currVel && nextVel < currVel)) {
                        oscillationCount++;
                    }
                }
            }
        }
        if (oscillationCount > 5) {
            return {
                type: 'oscillation',
                severity: 'medium',
                description: 'Oscillatory behavior detected',
                timestamp: Date.now(),
                data: { oscillationCount }
            };
        }
        return null;
    }
    /**
     * 检测不稳定性
     */
    detectInstability(state) {
        // 简化的不稳定性检测
        for (const obj of Object.values(state.objects)) {
            const acceleration = Math.sqrt(Math.pow(obj.acceleration.x, 2) +
                Math.pow(obj.acceleration.y, 2) +
                Math.pow(obj.acceleration.z, 2));
            if (acceleration > 100) { // 异常大的加速度
                return {
                    type: 'instability',
                    severity: 'high',
                    description: 'High acceleration detected',
                    timestamp: Date.now(),
                    data: { acceleration, object: obj }
                };
            }
        }
        return null;
    }
    /**
     * 检测能量泄漏
     */
    detectEnergyLeak(state) {
        // 简化的能量泄漏检测
        const currentEnergy = this.calculateTotalEnergy(state);
        if (this.history.length > 0) {
            const previousEnergy = this.calculateTotalEnergy(this.history[this.history.length - 1].state);
            const energyLoss = Math.abs(currentEnergy - previousEnergy) / Math.abs(previousEnergy);
            if (energyLoss > this.config.anomalyThreshold) {
                return {
                    type: 'energy_leak',
                    severity: 'medium',
                    description: 'Significant energy loss detected',
                    timestamp: Date.now(),
                    data: { energyLoss, currentEnergy, previousEnergy }
                };
            }
        }
        return null;
    }
    /**
     * 计算总能量
     */
    calculateTotalEnergy(state) {
        let totalEnergy = 0;
        for (const obj of Object.values(state.objects)) {
            const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                Math.pow(obj.velocity.y, 2) +
                Math.pow(obj.velocity.z, 2));
            const kineticEnergy = 0.5 * obj.mass * speed * speed;
            const potentialEnergy = obj.mass * 9.8 * obj.position.y; // 假设重力势能
            totalEnergy += kineticEnergy + potentialEnergy;
        }
        return totalEnergy;
    }
    /**
     * 计算总动量
     */
    calculateTotalMomentum(state) {
        let totalMomentum = 0;
        for (const obj of Object.values(state.objects)) {
            const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                Math.pow(obj.velocity.y, 2) +
                Math.pow(obj.velocity.z, 2));
            totalMomentum += obj.mass * speed;
        }
        return totalMomentum;
    }
    /**
     * 克隆状态
     */
    cloneState(state) {
        return {
            time: state.time,
            objects: JSON.parse(JSON.stringify(state.objects)),
            system: state.system ? JSON.parse(JSON.stringify(state.system)) : undefined,
            energy: state.energy ? JSON.parse(JSON.stringify(state.energy)) : undefined,
            forces: state.forces ? JSON.parse(JSON.stringify(state.forces)) : undefined
        };
    }
    /**
     * 获取当前状态
     */
    getCurrentState() {
        return this.currentState;
    }
    /**
     * 获取历史记录
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * 获取性能历史
     */
    getPerformanceHistory() {
        return [...this.performanceHistory];
    }
    /**
     * 获取异常历史
     */
    getAnomalyHistory() {
        return [...this.anomalyHistory];
    }
    /**
     * 获取最新报告
     */
    getLatestReport() {
        return this.generateReport();
    }
    /**
     * 生成分析报告
     */
    generateReport() {
        const currentTime = Date.now();
        const totalSteps = this.history.length;
        const averageStepTime = this.performanceHistory.length > 0
            ? this.performanceHistory.reduce((sum, p) => sum + p.stepTime, 0) / this.performanceHistory.length
            : 0;
        const totalEvents = 0; // 简化实现
        const anomalyCount = this.anomalyHistory.length;
        // 计算稳定性趋势
        let stabilityTrend = 'stable';
        if (this.performanceHistory.length >= 10) {
            const recent = this.performanceHistory.slice(-10);
            const older = this.performanceHistory.slice(-20, -10);
            const recentAvg = recent.reduce((sum, p) => sum + p.convergenceRate, 0) / recent.length;
            const olderAvg = older.reduce((sum, p) => sum + p.convergenceRate, 0) / older.length;
            if (recentAvg < olderAvg * 0.9) {
                stabilityTrend = 'improving';
            }
            else if (recentAvg > olderAvg * 1.1) {
                stabilityTrend = 'degrading';
            }
        }
        // 计算守恒量
        const energyConservation = this.currentState ? this.calculateTotalEnergy(this.currentState) : 0;
        const momentumConservation = this.currentState ? this.calculateTotalMomentum(this.currentState) : 0;
        // 生成建议
        const recommendations = [];
        if (anomalyCount > 0) {
            recommendations.push('Consider reducing time step size');
        }
        if (stabilityTrend === 'degrading') {
            recommendations.push('Simulation may be becoming unstable');
        }
        if (averageStepTime > 100) {
            recommendations.push('Consider optimizing simulation performance');
        }
        return {
            timestamp: currentTime,
            totalSteps,
            averageStepTime,
            totalEvents,
            anomalyCount,
            stabilityTrend,
            energyConservation,
            momentumConservation,
            recommendations
        };
    }
    /**
     * 重置监控器
     */
    reset() {
        this.history = [];
        this.performanceHistory = [];
        this.anomalyHistory = [];
        this.currentState = null;
        this.startTime = Date.now();
        this.lastReportTime = this.startTime;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.StateMonitor = StateMonitor;
