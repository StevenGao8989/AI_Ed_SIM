"use strict";
/**
 * 物理仿真中间表示 (Intermediate Representation)
 *
 * IR 是 DSL 和仿真引擎之间的桥梁，包含：
 * 1. 预计算的数据结构
 * 2. 优化的物理参数
 * 3. 仿真引擎友好的格式
 * 4. 多模块联立系统的表示
 * 5. 完整的物理约束和守恒定律
 * 6. 跨领域的物理量纲系统
 * 7. 智能的模块依赖关系
 * 8. 精确的数值计算配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHYSICS_CONSTANTS = exports.DimensionCalculator = void 0;
// ===== 物理量纲计算工具 =====
class DimensionCalculator {
    /**
     * 解析量纲字符串为 IRDimension
     */
    static parseDimension(dimensionStr) {
        const dim = { ...this.BASE_DIMENSIONS };
        // 解析如 "L^2T^-1" 这样的量纲字符串
        const matches = dimensionStr.match(/([A-Za-zΘ])(\^-?\d+)?/g);
        if (matches) {
            matches.forEach(match => {
                const [base, exp] = match.split('^');
                const exponent = exp ? parseInt(exp) : 1;
                switch (base) {
                    case 'L':
                        dim.L = exponent;
                        break;
                    case 'M':
                        dim.M = exponent;
                        break;
                    case 'T':
                        dim.T = exponent;
                        break;
                    case 'I':
                        dim.I = exponent;
                        break;
                    case 'Θ':
                        dim.Θ = exponent;
                        break;
                    case 'N':
                        dim.N = exponent;
                        break;
                    case 'J':
                        dim.J = exponent;
                        break;
                }
            });
        }
        return dim;
    }
    /**
     * 将 IRDimension 转换为字符串
     */
    static dimensionToString(dim) {
        const parts = [];
        Object.entries(dim).forEach(([key, value]) => {
            if (value !== 0) {
                if (value === 1) {
                    parts.push(key);
                }
                else {
                    parts.push(`${key}^${value}`);
                }
            }
        });
        return parts.length > 0 ? parts.join('') : '1';
    }
    /**
     * 验证量纲一致性
     */
    static validateDimensionConsistency(dim1, dim2) {
        return Object.keys(this.BASE_DIMENSIONS).every(key => dim1[key] === dim2[key]);
    }
    /**
     * 计算量纲乘积
     */
    static multiplyDimensions(dim1, dim2) {
        const result = { ...this.BASE_DIMENSIONS };
        Object.keys(this.BASE_DIMENSIONS).forEach(key => {
            result[key] =
                dim1[key] + dim2[key];
        });
        return result;
    }
    /**
     * 计算量纲除法
     */
    static divideDimensions(dim1, dim2) {
        const result = { ...this.BASE_DIMENSIONS };
        Object.keys(this.BASE_DIMENSIONS).forEach(key => {
            result[key] =
                dim1[key] - dim2[key];
        });
        return result;
    }
}
exports.DimensionCalculator = DimensionCalculator;
DimensionCalculator.BASE_DIMENSIONS = {
    L: 0, M: 0, T: 0, I: 0, Θ: 0, N: 0, J: 0
};
// ===== 物理常数库 =====
exports.PHYSICS_CONSTANTS = {
    // 基本常数
    c: { value: 299792458, unit: 'm/s', dimension: 'LT^-1', name: '光速' },
    h: { value: 6.62607015e-34, unit: 'J⋅s', dimension: 'ML^2T^-1', name: '普朗克常数' },
    k_B: { value: 1.380649e-23, unit: 'J/K', dimension: 'ML^2T^-2Θ^-1', name: '玻尔兹曼常数' },
    e: { value: 1.602176634e-19, unit: 'C', dimension: 'IT', name: '基本电荷' },
    m_e: { value: 9.1093837015e-31, unit: 'kg', dimension: 'M', name: '电子质量' },
    m_p: { value: 1.67262192369e-27, unit: 'kg', dimension: 'M', name: '质子质量' },
    // 引力常数
    G: { value: 6.67430e-11, unit: 'm^3/(kg⋅s^2)', dimension: 'L^3M^-1T^-2', name: '万有引力常数' },
    // 电磁常数
    ε_0: { value: 8.8541878128e-12, unit: 'F/m', dimension: 'I^2T^4M^-1L^-3', name: '真空介电常数' },
    μ_0: { value: 1.25663706212e-6, unit: 'H/m', dimension: 'MLI^-2T^-2', name: '真空磁导率' },
    // 其他常数
    g: { value: 9.80665, unit: 'm/s^2', dimension: 'LT^-2', name: '标准重力加速度' },
    R: { value: 8.314462618, unit: 'J/(mol⋅K)', dimension: 'ML^2T^-2Θ^-1N^-1', name: '气体常数' },
    N_A: { value: 6.02214076e23, unit: 'mol^-1', dimension: 'N^-1', name: '阿伏伽德罗常数' }
};
