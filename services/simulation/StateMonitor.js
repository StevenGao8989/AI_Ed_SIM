"use strict";
/**
 * 状态监控器 - 监控仿真过程中的系统状态
 *
 * 功能：
 * 1. 状态变化监控
 * 2. 性能指标收集
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
        const timestamp = Date.now();
        const stepStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        // 计算性能指标
        const performanceMetrics = this.calculatePerformanceMetrics(state, stepStartTime);
        // 检测异常
        let anomaly = null;
        if (this.config.enableAnomalyDetection) {
            anomaly = this.detectAnomalies(state);
            if (anomaly && anomaly.isAnomaly) {
                this.anomalyHistory.push(anomaly);
            }
        }
        // 记录历史
        if (this.config.enableHistory) {
            const historyEntry = {
                timestamp,
                state: this.cloneState(state),
                events: [...state.events],
                performance: performanceMetrics
            };
            this.history.push(historyEntry);
            this.performanceHistory.push(performanceMetrics);
            // 限制历史大小
            if (this.history.length > this.config.maxHistorySize) {
                this.history.shift();
                this.performanceHistory.shift();
            }
        }
        this.currentState = state;
        // 生成报告
        if (timestamp - this.lastReportTime >= this.config.reportInterval) {
            this.generateReport();
            this.lastReportTime = timestamp;
        }
    }
    /**
     * 计算性能指标
     */
    calculatePerformanceMetrics(state, stepStartTime) {
        const stepTime = performance.now() - stepStartTime;
        const memoryUsage = this.getMemoryUsage();
        const cpuUsage = this.getCPUUsage();
        const eventCount = state.events.length;
        const convergenceRate = state.convergence.convergenceRate;
        const stabilityScore = this.calculateStabilityScore(state);
        return {
            stepTime,
            memoryUsage,
            cpuUsage,
            eventCount,
            convergenceRate,
            stabilityScore
        };
    }
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        return 0;
    }
    /**
     * 获取CPU使用情况
     */
    getCPUUsage() {
        // 简化的CPU使用率估算
        if (this.performanceHistory.length > 0) {
            const recentSteps = this.performanceHistory.slice(-10);
            const averageStepTime = recentSteps.reduce((sum, p) => sum + p.stepTime, 0) / recentSteps.length;
            return Math.min(averageStepTime / 16.67, 1.0); // 假设60FPS为100%CPU
        }
        return 0;
    }
    /**
     * 计算稳定性分数
     */
    calculateStabilityScore(state) {
        if (this.performanceHistory.length < 3)
            return 1.0;
        const recentSteps = this.performanceHistory.slice(-5);
        const stepTimes = recentSteps.map(p => p.stepTime);
        // 计算步长时间的标准差
        const mean = stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length;
        const variance = stepTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / stepTimes.length;
        const stdDev = Math.sqrt(variance);
        // 稳定性分数：标准差越小越稳定
        return Math.max(0, 1 - stdDev / mean);
    }
    /**
     * 检测异常
     */
    detectAnomalies(state) {
        const anomalies = [];
        // 检测发散
        const divergenceAnomaly = this.detectDivergence(state);
        if (divergenceAnomaly)
            anomalies.push(divergenceAnomaly);
        // 检测振荡
        const oscillationAnomaly = this.detectOscillation(state);
        if (oscillationAnomaly)
            anomalies.push(oscillationAnomaly);
        // 检测不稳定性
        const instabilityAnomaly = this.detectInstability(state);
        if (instabilityAnomaly)
            anomalies.push(instabilityAnomaly);
        // 检测能量泄漏
        const energyLeakAnomaly = this.detectEnergyLeak(state);
        if (energyLeakAnomaly)
            anomalies.push(energyLeakAnomaly);
        // 返回最严重的异常
        if (anomalies.length > 0) {
            return anomalies.reduce((max, current) => this.getSeverityLevel(current.severity) > this.getSeverityLevel(max.severity) ? current : max);
        }
        return null;
    }
    /**
     * 检测发散
     */
    detectDivergence(state) {
        if (this.history.length < 10)
            return null;
        const recentStates = this.history.slice(-10);
        const variables = Array.from(state.variables.keys());
        for (const variable of variables) {
            const values = recentStates.map(h => h.state.variables.get(variable) || 0);
            const trend = this.calculateTrend(values);
            // 检测指数增长
            if (Math.abs(trend) > this.config.anomalyThreshold) {
                return {
                    isAnomaly: true,
                    anomalyType: 'divergence',
                    severity: Math.abs(trend) > 0.5 ? 'critical' : 'high',
                    description: `Variable ${variable} is diverging with trend ${trend.toFixed(4)}`,
                    parameters: new Map([
                        ['variable', variable],
                        ['trend', trend.toString()],
                        ['values', JSON.stringify(values.slice(-5))]
                    ]),
                    confidence: Math.min(Math.abs(trend), 1.0)
                };
            }
        }
        return null;
    }
    /**
     * 检测振荡
     */
    detectOscillation(state) {
        if (this.history.length < 20)
            return null;
        const recentStates = this.history.slice(-20);
        const variables = Array.from(state.variables.keys());
        for (const variable of variables) {
            const values = recentStates.map(h => h.state.variables.get(variable) || 0);
            const oscillationScore = this.calculateOscillationScore(values);
            if (oscillationScore > this.config.anomalyThreshold) {
                return {
                    isAnomaly: true,
                    anomalyType: 'oscillation',
                    severity: oscillationScore > 0.7 ? 'high' : 'medium',
                    description: `Variable ${variable} is oscillating with score ${oscillationScore.toFixed(4)}`,
                    parameters: new Map([
                        ['variable', variable],
                        ['oscillation_score', oscillationScore.toString()],
                        ['amplitude', this.calculateAmplitude(values).toString()]
                    ]),
                    confidence: oscillationScore
                };
            }
        }
        return null;
    }
    /**
     * 检测不稳定性
     */
    detectInstability(state) {
        if (this.performanceHistory.length < 5)
            return null;
        const recentPerformance = this.performanceHistory.slice(-5);
        const stabilityScores = recentPerformance.map(p => p.stabilityScore);
        const averageStability = stabilityScores.reduce((sum, score) => sum + score, 0) / stabilityScores.length;
        if (averageStability < 0.5) {
            return {
                isAnomaly: true,
                anomalyType: 'instability',
                severity: averageStability < 0.2 ? 'critical' : 'high',
                description: `System is unstable with average stability score ${averageStability.toFixed(4)}`,
                parameters: new Map([
                    ['average_stability', averageStability.toString()],
                    ['stability_scores', JSON.stringify(stabilityScores)],
                    ['step_times', JSON.stringify(recentPerformance.map(p => p.stepTime))]
                ]),
                confidence: 1 - averageStability
            };
        }
        return null;
    }
    /**
     * 检测能量泄漏
     */
    detectEnergyLeak(state) {
        if (this.history.length < 10)
            return null;
        const recentStates = this.history.slice(-10);
        const energies = recentStates.map(h => this.calculateTotalEnergy(h.state));
        // 检测能量持续下降
        const energyTrend = this.calculateTrend(energies);
        if (energyTrend < -this.config.anomalyThreshold) {
            return {
                isAnomaly: true,
                anomalyType: 'energy_leak',
                severity: Math.abs(energyTrend) > 0.1 ? 'high' : 'medium',
                description: `Energy is leaking with trend ${energyTrend.toFixed(4)}`,
                parameters: new Map([
                    ['energy_trend', energyTrend],
                    ['initial_energy', energies[0]],
                    ['final_energy', energies[energies.length - 1]],
                    ['energy_loss', energies[0] - energies[energies.length - 1]]
                ]),
                confidence: Math.min(Math.abs(energyTrend), 1.0)
            };
        }
        return null;
    }
    /**
     * 计算趋势
     */
    calculateTrend(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }
    /**
     * 计算振荡分数
     */
    calculateOscillationScore(values) {
        if (values.length < 4)
            return 0;
        let signChanges = 0;
        for (let i = 1; i < values.length - 1; i++) {
            const prev = values[i - 1];
            const curr = values[i];
            const next = values[i + 1];
            if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
                signChanges++;
            }
        }
        return signChanges / (values.length - 2);
    }
    /**
     * 计算振幅
     */
    calculateAmplitude(values) {
        if (values.length === 0)
            return 0;
        const max = Math.max(...values);
        const min = Math.min(...values);
        return (max - min) / 2;
    }
    /**
     * 计算总能量
     */
    calculateTotalEnergy(state) {
        let totalEnergy = 0;
        // 简化的能量计算
        const objects = ['object1', 'object2'];
        for (const objName of objects) {
            const m = state.variables.get(`${objName}_m`) || 1;
            const vx = state.variables.get(`${objName}_vx`) || 0;
            const vy = state.variables.get(`${objName}_vy`) || 0;
            const vz = state.variables.get(`${objName}_vz`) || 0;
            const h = state.variables.get(`${objName}_h`) || 0;
            const g = state.variables.get('g') || 9.8;
            const kinetic = 0.5 * m * (vx * vx + vy * vy + vz * vz);
            const potential = m * g * h;
            totalEnergy += kinetic + potential;
        }
        return totalEnergy;
    }
    /**
     * 获取严重程度级别
     */
    getSeverityLevel(severity) {
        const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        return levels[severity] || 0;
    }
    /**
     * 生成报告
     */
    generateReport() {
        const timestamp = Date.now();
        const totalSteps = this.history.length;
        const averageStepTime = this.performanceHistory.length > 0
            ? this.performanceHistory.reduce((sum, p) => sum + p.stepTime, 0) / this.performanceHistory.length
            : 0;
        const totalEvents = this.history.reduce((sum, h) => sum + h.events.length, 0);
        const anomalyCount = this.anomalyHistory.length;
        const stabilityTrend = this.calculateStabilityTrend();
        const energyConservation = this.calculateEnergyConservation();
        const momentumConservation = this.calculateMomentumConservation();
        const recommendations = this.generateRecommendations();
        return {
            timestamp,
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
     * 计算稳定性趋势
     */
    calculateStabilityTrend() {
        if (this.performanceHistory.length < 10)
            return 'stable';
        const recentScores = this.performanceHistory.slice(-10).map(p => p.stabilityScore);
        const trend = this.calculateTrend(recentScores);
        if (trend > 0.01)
            return 'improving';
        if (trend < -0.01)
            return 'degrading';
        return 'stable';
    }
    /**
     * 计算能量守恒
     */
    calculateEnergyConservation() {
        if (this.history.length < 2)
            return 1;
        const initialEnergy = this.calculateTotalEnergy(this.history[0].state);
        const finalEnergy = this.calculateTotalEnergy(this.history[this.history.length - 1].state);
        if (initialEnergy === 0)
            return 1;
        return 1 - Math.abs(finalEnergy - initialEnergy) / Math.abs(initialEnergy);
    }
    /**
     * 计算动量守恒
     */
    calculateMomentumConservation() {
        if (this.history.length < 2)
            return 1;
        const initialMomentum = this.calculateTotalMomentum(this.history[0].state);
        const finalMomentum = this.calculateTotalMomentum(this.history[this.history.length - 1].state);
        if (initialMomentum === 0)
            return 1;
        return 1 - Math.abs(finalMomentum - initialMomentum) / Math.abs(initialMomentum);
    }
    /**
     * 计算总动量
     */
    calculateTotalMomentum(state) {
        let totalMomentum = 0;
        const objects = ['object1', 'object2'];
        for (const objName of objects) {
            const m = state.variables.get(`${objName}_m`) || 1;
            const vx = state.variables.get(`${objName}_vx`) || 0;
            const vy = state.variables.get(`${objName}_vy`) || 0;
            const vz = state.variables.get(`${objName}_vz`) || 0;
            const momentum = m * Math.sqrt(vx * vx + vy * vy + vz * vz);
            totalMomentum += momentum;
        }
        return totalMomentum;
    }
    /**
     * 生成建议
     */
    generateRecommendations() {
        const recommendations = [];
        if (this.anomalyHistory.length > 0) {
            const recentAnomalies = this.anomalyHistory.slice(-5);
            const criticalAnomalies = recentAnomalies.filter(a => a.severity === 'critical');
            if (criticalAnomalies.length > 0) {
                recommendations.push('Critical anomalies detected - consider reducing time step or changing solver');
            }
        }
        if (this.performanceHistory.length > 0) {
            const averageStepTime = this.performanceHistory.reduce((sum, p) => sum + p.stepTime, 0) / this.performanceHistory.length;
            if (averageStepTime > 100) { // 100ms
                recommendations.push('Simulation is running slowly - consider optimization');
            }
        }
        const stabilityTrend = this.calculateStabilityTrend();
        if (stabilityTrend === 'degrading') {
            recommendations.push('System stability is degrading - check for numerical issues');
        }
        return recommendations;
    }
    /**
     * 克隆状态
     */
    cloneState(state) {
        return {
            time: state.time,
            variables: new Map(state.variables),
            derivatives: new Map(state.derivatives),
            events: [...state.events],
            convergence: { ...state.convergence }
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
     * 清理历史记录
     */
    clearHistory() {
        this.history = [];
        this.performanceHistory = [];
        this.anomalyHistory = [];
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.StateMonitor = StateMonitor;
