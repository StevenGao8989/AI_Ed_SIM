"use strict";
/**
 * 单位转换器 - 为 AI 解析层提供单位处理支持
 * 功能：单位标准化、单位转换、单位兼容性检查
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitConverter = exports.COMPOUND_UNITS = exports.UNIT_MAPPINGS = exports.BASE_UNITS = void 0;
exports.standardizeUnit = standardizeUnit;
exports.areUnitsCompatible = areUnitsCompatible;
exports.convertValue = convertValue;
/**
 * 基础单位定义表
 */
exports.BASE_UNITS = {
    length: {
        symbol: 'm',
        name: '米',
        baseUnit: 'length',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制长度单位'
    },
    mass: {
        symbol: 'kg',
        name: '千克',
        baseUnit: 'mass',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制质量单位'
    },
    time: {
        symbol: 's',
        name: '秒',
        baseUnit: 'time',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制时间单位'
    },
    current: {
        symbol: 'A',
        name: '安培',
        baseUnit: 'current',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制电流单位'
    },
    temperature: {
        symbol: 'K',
        name: '开尔文',
        baseUnit: 'temperature',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制温度单位'
    },
    amount: {
        symbol: 'mol',
        name: '摩尔',
        baseUnit: 'amount',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制物质的量单位'
    },
    luminosity: {
        symbol: 'cd',
        name: '坎德拉',
        baseUnit: 'luminosity',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制发光强度单位'
    },
    angle: {
        symbol: 'rad',
        name: '弧度',
        baseUnit: 'angle',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制角度单位'
    },
    velocity: {
        symbol: 'm/s',
        name: '米每秒',
        baseUnit: 'velocity',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制速度单位'
    },
    acceleration: {
        symbol: 'm/s²',
        name: '米每二次方秒',
        baseUnit: 'acceleration',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制加速度单位'
    },
    force: {
        symbol: 'N',
        name: '牛顿',
        baseUnit: 'force',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制力单位'
    },
    energy: {
        symbol: 'J',
        name: '焦耳',
        baseUnit: 'energy',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制能量单位'
    },
    power: {
        symbol: 'W',
        name: '瓦特',
        baseUnit: 'power',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制功率单位'
    },
    pressure: {
        symbol: 'Pa',
        name: '帕斯卡',
        baseUnit: 'pressure',
        system: 'SI',
        conversionToSI: 1,
        description: '国际单位制压强单位'
    }
};
/**
 * 常用单位映射表
 */
exports.UNIT_MAPPINGS = {
    // 长度单位
    'm': exports.BASE_UNITS.length,
    'meter': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { name: 'meter' }),
    '米': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { name: '米' }),
    'cm': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'cm', name: '厘米', conversionToSI: 0.01 }),
    '厘米': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'cm', name: '厘米', conversionToSI: 0.01 }),
    'mm': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'mm', name: '毫米', conversionToSI: 0.001 }),
    '毫米': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'mm', name: '毫米', conversionToSI: 0.001 }),
    'km': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'km', name: '千米', conversionToSI: 1000 }),
    '千米': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'km', name: '千米', conversionToSI: 1000 }),
    'dm': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'dm', name: '分米', conversionToSI: 0.1 }),
    '分米': Object.assign(Object.assign({}, exports.BASE_UNITS.length), { symbol: 'dm', name: '分米', conversionToSI: 0.1 }),
    // 质量单位
    'kg': exports.BASE_UNITS.mass,
    'kilogram': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { name: 'kilogram' }),
    '千克': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { name: '千克' }),
    'g': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { symbol: 'g', name: '克', conversionToSI: 0.001 }),
    '克': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { symbol: 'g', name: '克', conversionToSI: 0.001 }),
    'mg': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { symbol: 'mg', name: '毫克', conversionToSI: 1e-6 }),
    '毫克': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { symbol: 'mg', name: '毫克', conversionToSI: 1e-6 }),
    't': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { symbol: 't', name: '吨', conversionToSI: 1000 }),
    '吨': Object.assign(Object.assign({}, exports.BASE_UNITS.mass), { symbol: 't', name: '吨', conversionToSI: 1000 }),
    // 时间单位
    's': exports.BASE_UNITS.time,
    'second': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { name: 'second' }),
    '秒': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { name: '秒' }),
    'min': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { symbol: 'min', name: '分钟', conversionToSI: 60 }),
    '分钟': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { symbol: 'min', name: '分钟', conversionToSI: 60 }),
    'h': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { symbol: 'h', name: '小时', conversionToSI: 3600 }),
    '小时': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { symbol: 'h', name: '小时', conversionToSI: 3600 }),
    'ms': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { symbol: 'ms', name: '毫秒', conversionToSI: 0.001 }),
    '毫秒': Object.assign(Object.assign({}, exports.BASE_UNITS.time), { symbol: 'ms', name: '毫秒', conversionToSI: 0.001 }),
    // 电流单位
    'A': exports.BASE_UNITS.current,
    'ampere': Object.assign(Object.assign({}, exports.BASE_UNITS.current), { name: 'ampere' }),
    '安培': Object.assign(Object.assign({}, exports.BASE_UNITS.current), { name: '安培' }),
    'mA': Object.assign(Object.assign({}, exports.BASE_UNITS.current), { symbol: 'mA', name: '毫安', conversionToSI: 0.001 }),
    '毫安': Object.assign(Object.assign({}, exports.BASE_UNITS.current), { symbol: 'mA', name: '毫安', conversionToSI: 0.001 }),
    'kA': Object.assign(Object.assign({}, exports.BASE_UNITS.current), { symbol: 'kA', name: '千安', conversionToSI: 1000 }),
    '千安': Object.assign(Object.assign({}, exports.BASE_UNITS.current), { symbol: 'kA', name: '千安', conversionToSI: 1000 }),
    // 温度单位
    'K': exports.BASE_UNITS.temperature,
    'kelvin': Object.assign(Object.assign({}, exports.BASE_UNITS.temperature), { name: 'kelvin' }),
    '开尔文': Object.assign(Object.assign({}, exports.BASE_UNITS.temperature), { name: '开尔文' }),
    '°C': Object.assign(Object.assign({}, exports.BASE_UNITS.temperature), { symbol: '°C', name: '摄氏度', conversionToSI: 1, description: '摄氏度，需要偏移273.15' }),
    '摄氏度': Object.assign(Object.assign({}, exports.BASE_UNITS.temperature), { symbol: '°C', name: '摄氏度', conversionToSI: 1, description: '摄氏度，需要偏移273.15' }),
    '℃': Object.assign(Object.assign({}, exports.BASE_UNITS.temperature), { symbol: '℃', name: '摄氏度', conversionToSI: 1, description: '摄氏度，需要偏移273.15' }),
    // 角度单位
    'rad': exports.BASE_UNITS.angle,
    '°': { symbol: '°', name: '度', baseUnit: 'angle', system: 'Custom', conversionToSI: Math.PI / 180, description: '度，转换为弧度' },
    '度': { symbol: '°', name: '度', baseUnit: 'angle', system: 'Custom', conversionToSI: Math.PI / 180, description: '度，转换为弧度' }
};
/**
 * 复合单位定义
 */
exports.COMPOUND_UNITS = {
    // 速度单位
    'm/s': {
        numerator: [exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s']],
        symbol: 'm/s',
        name: '米每秒',
        baseUnit: 'velocity',
        conversionToSI: 1
    },
    'km/h': {
        numerator: [exports.UNIT_MAPPINGS['km']],
        denominator: [exports.UNIT_MAPPINGS['h']],
        symbol: 'km/h',
        name: '千米每小时',
        baseUnit: 'velocity',
        conversionToSI: 1000 / 3600
    },
    // 加速度单位
    'm/s²': {
        numerator: [exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'm/s²',
        name: '米每二次方秒',
        baseUnit: 'acceleration',
        conversionToSI: 1
    },
    'm/s^2': {
        numerator: [exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'm/s^2',
        name: '米每二次方秒',
        baseUnit: 'acceleration',
        conversionToSI: 1
    },
    // 力的单位
    'N': {
        numerator: [exports.UNIT_MAPPINGS['kg'], exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'N',
        name: '牛顿',
        baseUnit: 'force',
        conversionToSI: 1
    },
    '牛': {
        numerator: [exports.UNIT_MAPPINGS['kg'], exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'N',
        name: '牛顿',
        baseUnit: 'force',
        conversionToSI: 1
    },
    // 能量单位
    'J': {
        numerator: [exports.UNIT_MAPPINGS['kg'], exports.UNIT_MAPPINGS['m'], exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'J',
        name: '焦耳',
        baseUnit: 'energy',
        conversionToSI: 1
    },
    '焦': {
        numerator: [exports.UNIT_MAPPINGS['kg'], exports.UNIT_MAPPINGS['m'], exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'J',
        name: '焦耳',
        baseUnit: 'energy',
        conversionToSI: 1
    },
    // 功率单位
    'W': {
        numerator: [exports.UNIT_MAPPINGS['kg'], exports.UNIT_MAPPINGS['m'], exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'W',
        name: '瓦特',
        baseUnit: 'power',
        conversionToSI: 1
    },
    '瓦': {
        numerator: [exports.UNIT_MAPPINGS['kg'], exports.UNIT_MAPPINGS['m'], exports.UNIT_MAPPINGS['m']],
        denominator: [exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'W',
        name: '瓦特',
        baseUnit: 'power',
        conversionToSI: 1
    },
    // 压强单位
    'Pa': {
        numerator: [exports.UNIT_MAPPINGS['kg']],
        denominator: [exports.UNIT_MAPPINGS['m'], exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'Pa',
        name: '帕斯卡',
        baseUnit: 'pressure',
        conversionToSI: 1
    },
    '帕': {
        numerator: [exports.UNIT_MAPPINGS['kg']],
        denominator: [exports.UNIT_MAPPINGS['m'], exports.UNIT_MAPPINGS['s'], exports.UNIT_MAPPINGS['s']],
        symbol: 'Pa',
        name: '帕斯卡',
        baseUnit: 'pressure',
        conversionToSI: 1
    }
};
/**
 * 单位转换器类
 */
class UnitConverter {
    /**
     * 标准化单位
     * @param unit 输入单位
     * @returns 标准化结果
     */
    static standardizeUnit(unit) {
        if (!unit) {
            return {
                original: '',
                standard: '',
                conversion: 1,
                isValid: false,
                error: '单位为空'
            };
        }
        // 清理单位字符串
        const cleanUnit = unit.trim().replace(/\s+/g, '');
        // 检查基础单位
        if (exports.UNIT_MAPPINGS[cleanUnit]) {
            const unitInfo = exports.UNIT_MAPPINGS[cleanUnit];
            return {
                original: unit,
                standard: unitInfo.symbol,
                conversion: unitInfo.conversionToSI,
                isValid: true
            };
        }
        // 检查复合单位
        if (exports.COMPOUND_UNITS[cleanUnit]) {
            const compoundUnit = exports.COMPOUND_UNITS[cleanUnit];
            return {
                original: unit,
                standard: compoundUnit.symbol,
                conversion: compoundUnit.conversionToSI,
                isValid: true
            };
        }
        // 尝试解析复合单位
        const parsed = this.parseCompoundUnit(cleanUnit);
        if (parsed.isValid) {
            return parsed;
        }
        // 未知单位，返回原样
        return {
            original: unit,
            standard: unit,
            conversion: 1,
            isValid: false,
            error: '未知单位'
        };
    }
    /**
     * 解析复合单位
     * @param unit 复合单位字符串
     * @returns 解析结果
     */
    static parseCompoundUnit(unit) {
        // 处理常见的复合单位模式
        const patterns = [
            // m/s, km/h 等速度单位
            /^([a-zA-Z]+)\/([a-zA-Z]+)$/,
            // m/s², m/s^2 等加速度单位
            /^([a-zA-Z]+)\/([a-zA-Z]+)(\^?[²³]|\^[23])$/,
            // kg·m/s² 等力的单位
            /^([a-zA-Z]+)·([a-zA-Z]+)\/([a-zA-Z]+)(\^?[²³]|\^[23])?$/
        ];
        for (const pattern of patterns) {
            const match = unit.match(pattern);
            if (match) {
                // 简化处理：返回原单位，转换系数为1
                return {
                    original: unit,
                    standard: unit,
                    conversion: 1,
                    isValid: true
                };
            }
        }
        return {
            original: unit,
            standard: unit,
            conversion: 1,
            isValid: false,
            error: '无法解析的复合单位'
        };
    }
    /**
     * 检查单位兼容性
     * @param unit1 单位1
     * @param unit2 单位2
     * @returns 是否兼容
     */
    static areUnitsCompatible(unit1, unit2) {
        const std1 = this.standardizeUnit(unit1);
        const std2 = this.standardizeUnit(unit2);
        if (!std1.isValid || !std2.isValid) {
            return false;
        }
        // 检查基础单位类型是否相同
        const base1 = this.getBaseUnitType(std1.standard);
        const base2 = this.getBaseUnitType(std2.standard);
        return base1 === base2;
    }
    /**
     * 获取单位的基础类型
     * @param unit 单位
     * @returns 基础类型
     */
    static getBaseUnitType(unit) {
        // 简化实现：通过单位符号推断基础类型
        if (unit.includes('m') && !unit.includes('s'))
            return 'length';
        if (unit.includes('kg') || unit.includes('g'))
            return 'mass';
        if (unit.includes('s') && !unit.includes('m'))
            return 'time';
        if (unit.includes('A'))
            return 'current';
        if (unit.includes('K') || unit.includes('°C') || unit.includes('℃'))
            return 'temperature';
        if (unit.includes('mol'))
            return 'amount';
        if (unit.includes('cd'))
            return 'luminosity';
        if (unit.includes('rad'))
            return 'angle';
        if (unit.includes('m/s'))
            return 'velocity';
        if (unit.includes('m/s²'))
            return 'acceleration';
        if (unit.includes('N'))
            return 'force';
        if (unit.includes('J'))
            return 'energy';
        if (unit.includes('W'))
            return 'power';
        if (unit.includes('Pa'))
            return 'pressure';
        return null;
    }
    /**
     * 转换数值
     * @param value 数值
     * @param fromUnit 原单位
     * @param toUnit 目标单位
     * @returns 转换后的数值
     */
    static convertValue(value, fromUnit, toUnit) {
        const fromStd = this.standardizeUnit(fromUnit);
        const toStd = this.standardizeUnit(toUnit);
        if (!fromStd.isValid || !toStd.isValid) {
            return null;
        }
        if (!this.areUnitsCompatible(fromUnit, toUnit)) {
            return null;
        }
        // 先转换为SI单位，再转换为目标单位
        const siValue = value * fromStd.conversion;
        const result = siValue / toStd.conversion;
        return result;
    }
    /**
     * 获取所有支持的单位
     * @returns 单位列表
     */
    static getSupportedUnits() {
        return Object.values(exports.UNIT_MAPPINGS);
    }
    /**
     * 获取指定类型的单位
     * @param baseUnit 基础单位类型
     * @returns 单位列表
     */
    static getUnitsByType(baseUnit) {
        return Object.values(exports.UNIT_MAPPINGS).filter(unit => unit.baseUnit === baseUnit);
    }
}
exports.UnitConverter = UnitConverter;
/**
 * 便捷函数：标准化单位
 */
function standardizeUnit(unit) {
    return UnitConverter.standardizeUnit(unit);
}
/**
 * 便捷函数：检查单位兼容性
 */
function areUnitsCompatible(unit1, unit2) {
    return UnitConverter.areUnitsCompatible(unit1, unit2);
}
/**
 * 便捷函数：转换数值
 */
function convertValue(value, fromUnit, toUnit) {
    return UnitConverter.convertValue(value, fromUnit, toUnit);
}
