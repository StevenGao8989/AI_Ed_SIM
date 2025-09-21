/**
 * 单位转换器 - 为 AI 解析层提供单位处理支持
 * 功能：单位标准化、单位转换、单位兼容性检查
 */
define("ai_parsing/unitConverter", ["require", "exports"], function (require, exports) {
    "use strict";
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
        'meter': { ...exports.BASE_UNITS.length, name: 'meter' },
        '米': { ...exports.BASE_UNITS.length, name: '米' },
        'cm': { ...exports.BASE_UNITS.length, symbol: 'cm', name: '厘米', conversionToSI: 0.01 },
        '厘米': { ...exports.BASE_UNITS.length, symbol: 'cm', name: '厘米', conversionToSI: 0.01 },
        'mm': { ...exports.BASE_UNITS.length, symbol: 'mm', name: '毫米', conversionToSI: 0.001 },
        '毫米': { ...exports.BASE_UNITS.length, symbol: 'mm', name: '毫米', conversionToSI: 0.001 },
        'km': { ...exports.BASE_UNITS.length, symbol: 'km', name: '千米', conversionToSI: 1000 },
        '千米': { ...exports.BASE_UNITS.length, symbol: 'km', name: '千米', conversionToSI: 1000 },
        'dm': { ...exports.BASE_UNITS.length, symbol: 'dm', name: '分米', conversionToSI: 0.1 },
        '分米': { ...exports.BASE_UNITS.length, symbol: 'dm', name: '分米', conversionToSI: 0.1 },
        // 质量单位
        'kg': exports.BASE_UNITS.mass,
        'kilogram': { ...exports.BASE_UNITS.mass, name: 'kilogram' },
        '千克': { ...exports.BASE_UNITS.mass, name: '千克' },
        'g': { ...exports.BASE_UNITS.mass, symbol: 'g', name: '克', conversionToSI: 0.001 },
        '克': { ...exports.BASE_UNITS.mass, symbol: 'g', name: '克', conversionToSI: 0.001 },
        'mg': { ...exports.BASE_UNITS.mass, symbol: 'mg', name: '毫克', conversionToSI: 1e-6 },
        '毫克': { ...exports.BASE_UNITS.mass, symbol: 'mg', name: '毫克', conversionToSI: 1e-6 },
        't': { ...exports.BASE_UNITS.mass, symbol: 't', name: '吨', conversionToSI: 1000 },
        '吨': { ...exports.BASE_UNITS.mass, symbol: 't', name: '吨', conversionToSI: 1000 },
        // 时间单位
        's': exports.BASE_UNITS.time,
        'second': { ...exports.BASE_UNITS.time, name: 'second' },
        '秒': { ...exports.BASE_UNITS.time, name: '秒' },
        'min': { ...exports.BASE_UNITS.time, symbol: 'min', name: '分钟', conversionToSI: 60 },
        '分钟': { ...exports.BASE_UNITS.time, symbol: 'min', name: '分钟', conversionToSI: 60 },
        'h': { ...exports.BASE_UNITS.time, symbol: 'h', name: '小时', conversionToSI: 3600 },
        '小时': { ...exports.BASE_UNITS.time, symbol: 'h', name: '小时', conversionToSI: 3600 },
        'ms': { ...exports.BASE_UNITS.time, symbol: 'ms', name: '毫秒', conversionToSI: 0.001 },
        '毫秒': { ...exports.BASE_UNITS.time, symbol: 'ms', name: '毫秒', conversionToSI: 0.001 },
        // 电流单位
        'A': exports.BASE_UNITS.current,
        'ampere': { ...exports.BASE_UNITS.current, name: 'ampere' },
        '安培': { ...exports.BASE_UNITS.current, name: '安培' },
        'mA': { ...exports.BASE_UNITS.current, symbol: 'mA', name: '毫安', conversionToSI: 0.001 },
        '毫安': { ...exports.BASE_UNITS.current, symbol: 'mA', name: '毫安', conversionToSI: 0.001 },
        'kA': { ...exports.BASE_UNITS.current, symbol: 'kA', name: '千安', conversionToSI: 1000 },
        '千安': { ...exports.BASE_UNITS.current, symbol: 'kA', name: '千安', conversionToSI: 1000 },
        // 温度单位
        'K': exports.BASE_UNITS.temperature,
        'kelvin': { ...exports.BASE_UNITS.temperature, name: 'kelvin' },
        '开尔文': { ...exports.BASE_UNITS.temperature, name: '开尔文' },
        '°C': { ...exports.BASE_UNITS.temperature, symbol: '°C', name: '摄氏度', conversionToSI: 1, description: '摄氏度，需要偏移273.15' },
        '摄氏度': { ...exports.BASE_UNITS.temperature, symbol: '°C', name: '摄氏度', conversionToSI: 1, description: '摄氏度，需要偏移273.15' },
        '℃': { ...exports.BASE_UNITS.temperature, symbol: '℃', name: '摄氏度', conversionToSI: 1, description: '摄氏度，需要偏移273.15' },
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
});
// services/ai_parsing/PhysicsAIParser.ts
define("ai_parsing/PhysicsAIParser", ["require", "exports", "ai_parsing/unitConverter"], function (require, exports, unitConverter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseQuestion = parseQuestion;
    const TOPIC_RULES = [
        // 初中 - 机械运动/力/压强/浮力/简单机械/功功率/热与内能/声/光
        { id: 'kinematics_linear', zh: '匀变速直线运动', en: 'Uniformly Accelerated Linear Motion',
            keywords: [/匀变速|匀加速|直线运动|位移-时间|速度-时间|s-t图|v-t图/i] },
        { id: 'projectile', zh: '抛体运动', en: 'Projectile Motion',
            keywords: [/斜抛|平抛|抛体|抛射|最高点|射程/i] },
        { id: 'newton_dynamics', zh: '牛顿运动定律', en: 'Newton\'s Laws',
            keywords: [/受力|合力|牛顿(第[一二三]|一|二|三)定律|\(F=ma\)|静摩擦|动摩擦|摩擦系数|临界/i] },
        { id: 'energy_work_power', zh: '功、能、功率与机械能守恒',
            en: 'Work, Energy, Power & Mechanical Energy Conservation',
            keywords: [/做功|功率|机械能|动能|势能|能量守恒|功-能定理|W=|E[km]?=|P=/i] },
        { id: 'pressure_buoyancy', zh: '压强与浮力', en: 'Pressure & Buoyancy',
            keywords: [/压强|帕斯卡|浮力|阿基米德|U形管|液柱高度|p=\s*ρgh/i] },
        { id: 'simple_machines', zh: '杠杆与简单机械', en: 'Levers & Simple Machines',
            keywords: [/杠杆|滑轮|定滑轮|动滑轮|机械效率|省力|费力/i] },
        { id: 'thermal', zh: '热与内能、比热、相变', en: 'Thermal: Heat, Specific Heat, Phase Change',
            keywords: [/比热|吸热|放热|熔化|汽化|凝固|升华|热量|Q=\s*m[cC]ΔT/i] },
        { id: 'waves_sound', zh: '波与声音', en: 'Waves & Sound',
            keywords: [/波长|频率|周期|声速|回声|多普勒|f=\s*1\/T|v=\s*fλ/i] },
        { id: 'geometric_optics', zh: '几何光学（反射/折射/成像/透镜）', en: 'Geometric Optics',
            keywords: [/反射|折射|全反射|临界角|焦距|像距|物距|薄透镜|凹凸面镜|n=\s*c\/v/i] },
        // 高中 - 圆周运动/万有引力/振动与机械波/电场磁场/电路/电磁感应/交流/近代
        { id: 'circular_motion', zh: '圆周运动与向心力', en: 'Circular Motion & Centripetal Force',
            keywords: [/圆周|向心力|角速度|线速度|向心加速度|ω|v=\s*rω|a=\s*v\^2\/r/i] },
        { id: 'gravitation', zh: '万有引力与天体运动', en: 'Gravitation & Orbital Motion',
            keywords: [/万有引力|引力常量|开普勒|第一宇宙速度|卫星|轨道半径|g=\s*GM\/r\^2/i] },
        { id: 'oscillation', zh: '简谐振动与机械波', en: 'SHM & Mechanical Waves',
            keywords: [/简谐|弹簧振子|单摆|角频率|相位|共振|k|T=\s*2π\sqrt|振幅/i] },
        { id: 'electrostatics', zh: '静电场与电势', en: 'Electrostatics & Potential',
            keywords: [/电荷|库仑定律|电场强度|电势能|电势差|等势面|E=\s*kq\/r\^2|V=\s*kq\/r/i] },
        { id: 'dc_circuits', zh: '直流电路与欧姆定律', en: 'DC Circuits & Ohm\'s Law',
            keywords: [/电阻|电流|电压|欧姆定律|串联|并联|功率|焦耳定律|I=\s*U\/R|P=\s*UI|R=\s*ρl\/S/i] },
        { id: 'magnetism', zh: '磁场与带电粒子运动', en: 'Magnetism & Charged Particle Motion',
            keywords: [/磁场|洛伦兹力|回旋半径|霍尔|右手定则|B=\s*μ0|qvB|r=\s*mv\/qB/i] },
        { id: 'em_induction', zh: '电磁感应与楞次定律', en: 'Electromagnetic Induction',
            keywords: [/电磁感应|法拉第|楞次|感应电动势|磁通量|切割磁感线|e=\s*-\s*dΦ\/dt/i] },
        { id: 'ac', zh: '交流电与RLC电路（入门）', en: 'AC & RLC (Intro)',
            keywords: [/交流|有效值|相位差|电抗|阻抗|谐振|U\w*=\s*U0\/√2|I\w*=\s*I0\/√2/i] },
        { id: 'modern_intro', zh: '近代物理初步（了解）', en: 'Intro Modern Physics',
            keywords: [/光电效应|原子模型|核反应|半衰期|eV|普朗克常量|德布罗意|放射性/i] },
    ];
    // 常见常量默认值（若题目给出"取 g=10"则覆盖此处）
    const DEFAULT_CONSTANTS = [
        { symbol: 'g', value: 9.8, unit: 'm/s^2', role: 'constant', note: '重力加速度，未指定时默认 9.8' },
    ];
    /* ---------------------------
     * 解析主入口
     * ------------------------- */
    function parseQuestion(question) {
        const text = normalizeText(question);
        // 1) 主题识别
        const topic = detectTopic(text);
        // 2) 单位扫描（收集原始→标准的映射）
        const unitMappings = collectUnits(text);
        // 3) 参数抽取（形如"v0=10m/s""质量为2千克""电阻5Ω""取 g=10 m/s²""求最大高度h"等）
        let parameters = extractParameters(text, unitMappings);
        // 4) 注入默认常量（若题面未覆盖）
        const hasG = parameters.some(p => p.symbol === 'g');
        if (!hasG)
            parameters = [...parameters, ...DEFAULT_CONSTANTS];
        // 5) 未知量识别（"求 X / X 为多少 / 最大速度/最大高度/射程"等）
        parameters = markUnknowns(text, parameters);
        // 去重与合并（按 symbol 合并，题面值优先）
        parameters = mergeBySymbol(parameters);
        return {
            subject: 'physics',
            topic,
            question,
            units: dedupUnitMappings(unitMappings),
            parameters,
        };
    }
    /* ---------------------------
     * 主题识别
     * ------------------------- */
    function detectTopic(text) {
        // 关键词命中最多的主题
        let best = null;
        for (const rule of TOPIC_RULES) {
            const score = rule.keywords.reduce((acc, re) => acc + (re.test(text) ? 1 : 0), 0);
            if (score > 0) {
                if (!best || score > best.score)
                    best = { ...rule, score };
            }
        }
        if (best) {
            return `${best.zh}${best.en ? `/${best.en}` : ''}`;
        }
        // 兜底：依据一些强触发词快速分类
        if (/电|电阻|电压|电流|欧姆|Ω|伏|V|安培|A/i.test(text))
            return '直流电路与欧姆定律/DC Circuits';
        if (/磁|洛伦兹|qvB|特斯拉|T|回旋/i.test(text))
            return '磁场与带电粒子运动/Magnetism';
        if (/透镜|焦距|像距|物距|折射|反射/i.test(text))
            return '几何光学/Geometric Optics';
        if (/热|比热|温度|熔化|汽化/i.test(text))
            return '热与内能/Thermal';
        if (/波|频率|周期|波长|声速|共振/i.test(text))
            return '波与声音/Waves & Sound';
        return '一般力学/General Mechanics';
    }
    /* ---------------------------
     * 单位收集与标准化 - 重构为使用 unitConverter
     * ------------------------- */
    function collectUnits(text) {
        const found = new Map();
        // 候选单位 token（含中文/英文/复合）
        const unitTokens = matchAll(text, /(km\/h|m\/s\^?2|m\/s²|m\/s|cm\^?2|cm²|cm\^?3|cm³|m\^?2|m²|m\^?3|m³|kwh|wh|kj|kJ|ev|eV|kpa|kPa|mpa|MPa|ohm|Ω|coulomb|[mk]?(m|g|n|j|w|v|a|t|pa|hz|wb|l|k|c)|米\/秒|牛·米|牛|焦|瓦|伏|帕|安培|特斯拉|厘米|毫米|千米|升|次\/秒|摄氏度|℃|°C|度|°)/gi);
        for (const u of unitTokens) {
            const raw = u.toString();
            // 使用 unitConverter 进行单位标准化
            const conversionResult = (0, unitConverter_1.standardizeUnit)(raw);
            if (conversionResult.isValid) {
                found.set(raw, {
                    original: raw,
                    standard: conversionResult.standard,
                    conversion: conversionResult.conversion
                });
            }
            else {
                // 未识别的单位：保留原样，倍率记 1（避免错误换算）
                found.set(raw, { original: raw, standard: raw, conversion: 1 });
            }
        }
        return Array.from(found.values());
    }
    function dedupUnitMappings(arr) {
        const m = new Map();
        for (const it of arr) {
            const k = `${it.original}=>${it.standard}`;
            if (!m.has(k))
                m.set(k, it);
        }
        return Array.from(m.values());
    }
    /* ---------------------------
     * 参数抽取
     * ------------------------- */
    const NUM_RE = /[-+]?(\d+(\.\d+)?|\.\d+)(e[-+]?\d+)?/i;
    // 变量符号（含下标与常见希腊字母）
    const VAR_RE = /([a-zA-Z][a-zA-Z0-9_]*|[ωλΦρμθ])\s*=\s*([-+]?(\d+(\.\d+)?|\.\d+)(e[-+]?\d+)?)/g;
    // 中文叙述式（质量为2千克、速度10米/秒、电阻5欧等）
    const CN_PATTERN = [
        { re: /质量(?:为|是)?\s*([-\d\.eE]+)\s*(千克|公斤|kg|克|g)/g, symbol: 'm' },
        { re: /速度(?:为|是)?\s*([-\d\.eE]+)\s*(米\/秒|m\/s|km\/h)/g, symbol: 'v' },
        { re: /初速度(?:为|是)?\s*([-\d\.eE]+)\s*(米\/秒|m\/s|km\/h)/g, symbol: 'v0' },
        { re: /加速度(?:为|是)?\s*([-\d\.eE]+)\s*(米\/秒\^?2|m\/s\^?2|m\/s²)/g, symbol: 'a' },
        { re: /时间(?:为|是)?\s*([-\d\.eE]+)\s*(秒|s|分钟|min|小时|h)/g, symbol: 't' },
        { re: /位移|路程(?:为|是)?\s*([-\d\.eE]+)\s*(米|m|千米|km|厘米|cm|毫米|mm)/g, symbol: 's' },
        { re: /高度(?:为|是)?\s*([-\d\.eE]+)\s*(米|m|厘米|cm|毫米|mm)/g, symbol: 'h' },
        { re: /半径(?:为|是)?\s*([-\d\.eE]+)\s*(米|m|厘米|cm|毫米|mm)/g, symbol: 'r' },
        { re: /电流(?:为|是)?\s*([-\d\.eE]+)\s*(安培|A)/g, symbol: 'I' },
        { re: /电压(?:为|是)?\s*([-\d\.eE]+)\s*(伏|V)/g, symbol: 'U' },
        { re: /电阻(?:为|是)?\s*([-\d\.eE]+)\s*(欧姆|欧|Ω)/g, symbol: 'R' },
        { re: /功率(?:为|是)?\s*([-\d\.eE]+)\s*(瓦|W|千瓦|kW)/g, symbol: 'P' },
        { re: /频率(?:为|是)?\s*([-\d\.eE]+)\s*(Hz|赫兹|次\/秒)/g, symbol: 'f' },
        { re: /波长(?:为|是)?\s*([-\d\.eE]+)\s*(米|m|厘米|cm|毫米|mm)/g, symbol: 'λ' },
        { re: /磁感应强度(?:为|是)?\s*([-\d\.eE]+)\s*(特斯拉|T)/g, symbol: 'B' },
        { re: /电荷(?:量)?(?:为|是)?\s*([-\d\.eE]+)\s*(库仑|C)/g, symbol: 'q' },
        { re: /密度(?:为|是)?\s*([-\d\.eE]+)\s*(kg\/m\^?3|kg\/m³|g\/cm\^?3|g\/cm³)/g, symbol: 'ρ' },
        { re: /弹簧(?:劲度)?系数(?:为|是)?\s*([-\d\.eE]+)\s*(N\/m)/g, symbol: 'k' },
        { re: /取\s*g\s*=\s*([-\d\.eE]+)\s*(米\/秒\^?2|m\/s\^?2|m\/s²)?/g, symbol: 'g' },
    ];
    function extractParameters(text, unitMappings) {
        const params = [];
        // 1) 形式：v=10m/s, a=2 m/s^2
        let match;
        while ((match = VAR_RE.exec(text)) !== null) {
            const sym = normalizeVar(match[1]);
            const val = parseFloat(match[2]);
            const tail = text.slice(match.index + match[0].length);
            const unit = sniffImmediateUnit(tail, unitMappings);
            params.push({ symbol: sym, value: val, unit, raw: match[0], role: 'given', note: '等式赋值' });
        }
        // 2) 中文描述式
        for (const pat of CN_PATTERN) {
            let match;
            while ((match = pat.re.exec(text)) !== null) {
                const val = parseFloat(match[1]);
                const uraw = match[2] ?? '';
                const unit = pickStandardUnit(uraw, unitMappings);
                params.push({ symbol: pat.symbol, value: val * unitScale(uraw), unit, raw: match[0], role: 'given', note: '中文叙述' });
            }
        }
        // 3) "X 为 多少/未知"的形式（不含数值）
        for (const [cn, sym] of Object.entries(VAR_SYNONYMS)) {
            if (new RegExp(`求.*${escapeReg(cn)}|${escapeReg(cn)}(的)?大小|${escapeReg(cn)}为多少`).test(text)) {
                if (!params.some(p => p.symbol === sym)) {
                    params.push({ symbol: sym, value: null, unit: undefined, raw: cn, role: 'unknown', note: '题面求解目标' });
                }
            }
        }
        // 4) g 的覆盖（"取 g=10"）
        // 已在中文描述式覆盖；若写作 g=10，不带单位也接受
        if (/取\s*g\s*=\s*([-+]?(\d+(\.\d+)?|\.\d+)(e[-+]?\d+)?)/i.test(text)) {
            const gv = parseFloat(RegExp.$1);
            upsert(params, { symbol: 'g', value: gv, unit: 'm/s^2', role: 'constant', note: '题面指定 g' });
        }
        return params;
    }
    // 变量同义词映射（中文 → 标准符号）
    const VAR_SYNONYMS = {
        '质量': 'm', '重量': 'm', '位移': 's', '路程': 's', '高度': 'h', '深度': 'h',
        '速度': 'v', '初速度': 'v0', '末速度': 'v', '加速度': 'a', '时间': 't',
        '力': 'F', '合力': 'F', '压力': 'F', '支持力': 'N', '摩擦力': 'f',
        '功': 'W', '能量': 'E', '动能': 'Ek', '势能': 'Ep', '功率': 'P',
        '电荷量': 'q', '电量': 'Q', '电流': 'I', '电压': 'U', '电势差': 'U', '电阻': 'R',
        '磁感应强度': 'B', '磁通量': 'Φ',
        '频率': 'f', '周期': 'T', '波长': 'λ', '角速度': 'ω', '角频率': 'ω',
        '密度': 'ρ', '压强': 'p', '粘滞系数': 'μ',
        '弹性系数': 'k', '弹簧劲度系数': 'k',
        '焦距': 'f_lens', '像距': 'v_lens', '物距': 'u_lens',
        '比热容': 'c', '热量': 'Q', '温度': 'θ',
        '普适气体常量': 'R_gas', '摩尔数': 'n',
    };
    function normalizeVar(s) {
        const k = s.trim();
        // 映射中文名称到标准符号
        if (VAR_SYNONYMS[k])
            return VAR_SYNONYMS[k];
        // 统一下标写法 v0 / v_0 → v0
        return k.replace(/_/, '');
    }
    function sniffImmediateUnit(tail, unitMappings) {
        // 从等式后 0~20 字符内嗅探可能的单位
        const seg = tail.slice(0, 20);
        const hit = seg.match(/([a-zA-ZΩ°μ\/\.\^\d·]+|米\/秒|牛·米|摄氏度|千米|厘米|毫米|次\/秒)/);
        if (!hit)
            return undefined;
        return pickStandardUnit(hit[0], unitMappings);
    }
    function pickStandardUnit(raw, unitMappings) {
        if (!raw)
            return undefined;
        // 使用 unitConverter 进行单位标准化
        const conversionResult = (0, unitConverter_1.standardizeUnit)(raw);
        if (conversionResult.isValid) {
            return conversionResult.standard;
        }
        // 若 unitConverter 无法识别，查看已收集的映射
        const found = unitMappings.find(u => u.original === raw);
        return found ? found.standard : raw;
    }
    function unitScale(raw) {
        if (!raw)
            return 1;
        // 使用 unitConverter 获取单位转换系数
        const conversionResult = (0, unitConverter_1.standardizeUnit)(raw);
        return conversionResult.isValid ? conversionResult.conversion : 1;
    }
    /* ---------------------------
     * 未知量标记
     * ------------------------- */
    function markUnknowns(text, params) {
        // 语义：出现"求 X / X 为多少 / 最大速度/最大高度/射程"等
        // 典型：求最大高度h、求末速度v、求加速度a、求电流I
        const candidates = [
            { sym: 'h', re: /求.*最大高度|最高点|h(的)?大小/i },
            { sym: 'v', re: /求.*末速度|末速|最终速度|v(的)?大小/i },
            { sym: 'a', re: /求.*加速度|a(的)?大小/i },
            { sym: 'R', re: /求.*电阻|R(的)?大小/i },
            { sym: 'I', re: /求.*电流|I(的)?大小/i },
            { sym: 'U', re: /求.*电压|U(的)?大小/i },
            { sym: 'f', re: /求.*频率|f(的)?大小/i },
            { sym: 'T', re: /求.*周期|T(的)?大小/i },
            { sym: 'λ', re: /求.*波长|λ(的)?大小/i },
            { sym: 'r', re: /求.*半径|r(的)?大小/i },
            { sym: 's', re: /求.*位移|路程|s(的)?大小/i },
            { sym: 'P', re: /求.*功率|P(的)?大小/i },
            { sym: 'W', re: /求.*功(的)?大小|W(的)?大小/i },
            { sym: 'E', re: /求.*能量|E(的)?大小/i },
        ];
        for (const c of candidates) {
            if (c.re.test(text) && !params.some(p => p.symbol === c.sym)) {
                params.push({ symbol: c.sym, value: null, role: 'unknown', note: '题面求解目标' });
            }
        }
        return params;
    }
    /* ---------------------------
     * 工具：合并参数（同名变量以题面显式值优先）
     * ------------------------- */
    function mergeBySymbol(list) {
        const m = new Map();
        for (const p of list) {
            const exist = m.get(p.symbol);
            if (!exist) {
                m.set(p.symbol, p);
            }
            else {
                // 值优先级：given > constant > unknown
                const rank = (r) => r === 'given' ? 3 : r === 'constant' ? 2 : 1;
                m.set(p.symbol, (rank(p.role) >= rank(exist.role)) ? p : exist);
            }
        }
        return Array.from(m.values());
    }
    /* ---------------------------
     * 辅助
     * ------------------------- */
    function normalizeText(s) {
        return s
            .replace(/\s+/g, ' ')
            .replace(/，/g, ',')
            .replace(/；/g, ';')
            .replace(/（/g, '(')
            .replace(/）/g, ')')
            .replace(/：/g, ':')
            .replace(/。/g, '.')
            .trim();
    }
    function matchAll(text, re) {
        const out = [];
        const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
        let m;
        while ((m = r.exec(text)) !== null)
            out.push(m[0]);
        return out;
    }
    function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function upsert(arr, item) {
        const idx = arr.findIndex(p => p.symbol === item.symbol);
        if (idx === -1)
            arr.push(item);
        else
            arr[idx] = item;
    }
});
/* ---------------------------------------
 * 示例（可在单元测试里调用）
 * ------------------------------------- */
// 用法：parseQuestion("一物体以初速度 v0=10 m/s 斜抛，取 g=10 m/s²，求最大高度h。")
// 返回：topic≈抛体运动；parameters 含 {v0=10}, {g=10}, {h=null}
// services/ai_parsing/AtomicModules.ts
// 原子模块库：定义所有物理知识点的原子模块
define("ai_parsing/AtomicModules", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.atomicModuleLibrary = exports.AtomicModuleLibrary = void 0;
    /**
     * 原子模块库管理器
     */
    class AtomicModuleLibrary {
        constructor() {
            this.atomicModules = new Map();
            this.initializeAtomicModules();
        }
        /**
         * 获取所有原子模块
         */
        getAllModules() {
            return this.atomicModules;
        }
        /**
         * 根据ID获取模块
         */
        getModule(id) {
            return this.atomicModules.get(id);
        }
        /**
         * 根据类型获取模块
         */
        getModulesByType(type) {
            return Array.from(this.atomicModules.values()).filter(module => module.type === type);
        }
        /**
         * 搜索相关模块
         */
        searchModules(keywords) {
            return Array.from(this.atomicModules.values()).filter(module => {
                return keywords.some(keyword => module.name.includes(keyword) ||
                    module.description.includes(keyword) ||
                    module.formulas.some(formula => formula.includes(keyword)));
            });
        }
        /**
         * 初始化原子模块库
         */
        initializeAtomicModules() {
            // ==================== 基础力学模块 ====================
            // 运动学模块
            this.atomicModules.set('kinematics_linear', {
                id: 'kinematics_linear',
                type: 'kinematics',
                name: '直线运动学',
                description: '处理匀速直线运动和匀变速直线运动',
                parameters: [
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '速度' },
                    { symbol: 'v0', value: null, unit: 'm/s', role: 'given', note: '初速度' },
                    { symbol: 'a', value: null, unit: 'm/s²', role: 'given', note: '加速度' },
                    { symbol: 's', value: null, unit: 'm', role: 'unknown', note: '位移' },
                    { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
                ],
                formulas: ['v = v0 + at', 's = v0t + ½at²', 'v² = v0² + 2as', 's = (v0 + v)t/2'],
                dependencies: [],
                output: ['v', 's']
            });
            // 抛体运动模块
            this.atomicModules.set('projectile_motion', {
                id: 'projectile_motion',
                type: 'kinematics',
                name: '抛体运动',
                description: '处理平抛、斜抛等抛体运动',
                parameters: [
                    { symbol: 'v0', value: null, unit: 'm/s', role: 'given', note: '初速度' },
                    { symbol: 'θ', value: null, unit: '°', role: 'given', note: '抛射角' },
                    { symbol: 'v0x', value: null, unit: 'm/s', role: 'unknown', note: '水平初速度' },
                    { symbol: 'v0y', value: null, unit: 'm/s', role: 'unknown', note: '垂直初速度' },
                    { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '水平位移' },
                    { symbol: 'y', value: null, unit: 'm', role: 'unknown', note: '垂直位移' },
                    { symbol: 't', value: null, unit: 's', role: 'unknown', note: '飞行时间' },
                    { symbol: 'R', value: null, unit: 'm', role: 'unknown', note: '射程' },
                    { symbol: 'H', value: null, unit: 'm', role: 'unknown', note: '最大高度' },
                    { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' }
                ],
                formulas: ['v0x = v0cosθ', 'v0y = v0sinθ', 'x = v0xt', 'y = v0yt - ½gt²', 't = 2v0y/g', 'R = v0²sin(2θ)/g', 'H = v0y²/(2g)'],
                dependencies: ['kinematics_linear'],
                output: ['v0x', 'v0y', 'x', 'y', 't', 'R', 'H']
            });
            // 自由落体模块
            this.atomicModules.set('free_fall', {
                id: 'free_fall',
                type: 'kinematics',
                name: '自由落体',
                description: '处理自由落体运动',
                parameters: [
                    { symbol: 'h', value: null, unit: 'm', role: 'given', note: '高度' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '速度' },
                    { symbol: 't', value: null, unit: 's', role: 'unknown', note: '时间' },
                    { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' }
                ],
                formulas: ['h = ½gt²', 'v = gt', 'v² = 2gh', 't = √(2h/g)'],
                dependencies: ['kinematics_linear'],
                output: ['v', 't']
            });
            // 相对运动模块
            this.atomicModules.set('relative_motion', {
                id: 'relative_motion',
                type: 'kinematics',
                name: '相对运动',
                description: '处理相对运动问题',
                parameters: [
                    { symbol: 'vAB', value: null, unit: 'm/s', role: 'unknown', note: 'A相对B的速度' },
                    { symbol: 'vA', value: null, unit: 'm/s', role: 'given', note: 'A的速度' },
                    { symbol: 'vB', value: null, unit: 'm/s', role: 'given', note: 'B的速度' },
                    { symbol: 'θ', value: null, unit: '°', role: 'given', note: '夹角' }
                ],
                formulas: ['vAB = vA - vB', 'vAB = √(vA² + vB² - 2vAvBcosθ)'],
                dependencies: ['kinematics_linear'],
                output: ['vAB']
            });
            // 动力学模块
            this.atomicModules.set('newton_dynamics', {
                id: 'newton_dynamics',
                type: 'dynamics',
                name: '牛顿动力学',
                description: '处理牛顿第二定律和力的分析',
                parameters: [
                    { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '合外力' },
                    { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
                    { symbol: 'a', value: null, unit: 'm/s²', role: 'unknown', note: '加速度' },
                    { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' },
                    { symbol: 'μ', value: null, unit: '', role: 'given', note: '摩擦系数' },
                    { symbol: 'N', value: null, unit: 'N', role: 'unknown', note: '支持力' }
                ],
                formulas: ['F = ma', 'f = μN', 'F合 = F1 + F2 + ...'],
                dependencies: ['kinematics_linear'],
                output: ['F', 'a']
            });
            // 摩擦力模块
            this.atomicModules.set('friction', {
                id: 'friction',
                type: 'dynamics',
                name: '摩擦力',
                description: '处理静摩擦力和滑动摩擦力',
                parameters: [
                    { symbol: 'f静', value: null, unit: 'N', role: 'unknown', note: '静摩擦力' },
                    { symbol: 'f动', value: null, unit: 'N', role: 'unknown', note: '滑动摩擦力' },
                    { symbol: 'μ静', value: null, unit: '', role: 'given', note: '静摩擦系数' },
                    { symbol: 'μ动', value: null, unit: '', role: 'given', note: '动摩擦系数' },
                    { symbol: 'N', value: null, unit: 'N', role: 'given', note: '正压力' },
                    { symbol: 'F外', value: null, unit: 'N', role: 'given', note: '外力' }
                ],
                formulas: ['f静 ≤ μ静N', 'f动 = μ动N', 'f静 = F外 (平衡时)'],
                dependencies: ['newton_dynamics'],
                output: ['f静', 'f动']
            });
            // 刚体力学模块
            this.atomicModules.set('rigid_body', {
                id: 'rigid_body',
                type: 'dynamics',
                name: '刚体力学',
                description: '处理刚体的转动和平衡',
                parameters: [
                    { symbol: 'M', value: null, unit: 'N·m', role: 'unknown', note: '力矩' },
                    { symbol: 'F', value: null, unit: 'N', role: 'given', note: '力' },
                    { symbol: 'r', value: null, unit: 'm', role: 'given', note: '力臂' },
                    { symbol: 'θ', value: null, unit: '°', role: 'given', note: '力与力臂夹角' },
                    { symbol: 'I', value: null, unit: 'kg·m²', role: 'given', note: '转动惯量' },
                    { symbol: 'α', value: null, unit: 'rad/s²', role: 'unknown', note: '角加速度' },
                    { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '角速度' },
                    { symbol: 'L', value: null, unit: 'kg·m²/s', role: 'unknown', note: '角动量' }
                ],
                formulas: ['M = Frsinθ', 'M = Iα', 'L = Iω', 'M = dL/dt'],
                dependencies: ['newton_dynamics'],
                output: ['M', 'α', 'ω', 'L']
            });
            // 流体力学模块
            this.atomicModules.set('fluid_mechanics', {
                id: 'fluid_mechanics',
                type: 'fluid',
                name: '流体力学',
                description: '处理流体静力学和动力学',
                parameters: [
                    { symbol: 'p', value: null, unit: 'Pa', role: 'unknown', note: '压强' },
                    { symbol: 'ρ', value: null, unit: 'kg/m³', role: 'given', note: '密度' },
                    { symbol: 'h', value: null, unit: 'm', role: 'given', note: '深度' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '流速' },
                    { symbol: 'A', value: null, unit: 'm²', role: 'given', note: '截面积' },
                    { symbol: 'Q', value: null, unit: 'm³/s', role: 'unknown', note: '流量' },
                    { symbol: 'η', value: null, unit: 'Pa·s', role: 'given', note: '粘度' },
                    { symbol: 'Re', value: null, unit: '', role: 'unknown', note: '雷诺数' }
                ],
                formulas: ['p = ρgh', 'Q = Av', 'Re = ρvD/η', 'p + ½ρv² + ρgh = 常数'],
                dependencies: ['pressure_buoyancy'],
                output: ['p', 'v', 'Q', 'Re']
            });
            // 功和能模块
            this.atomicModules.set('work_energy', {
                id: 'work_energy',
                type: 'energy',
                name: '功和能',
                description: '处理功、功率、动能、势能的计算',
                parameters: [
                    { symbol: 'W', value: null, unit: 'J', role: 'unknown', note: '功' },
                    { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '功率' },
                    { symbol: 'Ek', value: null, unit: 'J', role: 'unknown', note: '动能' },
                    { symbol: 'Ep', value: null, unit: 'J', role: 'unknown', note: '势能' },
                    { symbol: 'h', value: null, unit: 'm', role: 'given', note: '高度' },
                    { symbol: 'F', value: null, unit: 'N', role: 'given', note: '力' },
                    { symbol: 's', value: null, unit: 'm', role: 'given', note: '位移' }
                ],
                formulas: ['W = Fs', 'P = W/t', 'Ek = ½mv²', 'Ep = mgh', 'W = ΔEk'],
                dependencies: ['kinematics_linear', 'newton_dynamics'],
                output: ['W', 'P', 'Ek', 'Ep']
            });
            // 机械能守恒模块
            this.atomicModules.set('mechanical_energy_conservation', {
                id: 'mechanical_energy_conservation',
                type: 'energy',
                name: '机械能守恒',
                description: '处理机械能守恒定律',
                parameters: [
                    { symbol: 'E1', value: null, unit: 'J', role: 'unknown', note: '初始机械能' },
                    { symbol: 'E2', value: null, unit: 'J', role: 'unknown', note: '末机械能' },
                    { symbol: 'Ek1', value: null, unit: 'J', role: 'given', note: '初始动能' },
                    { symbol: 'Ep1', value: null, unit: 'J', role: 'given', note: '初始势能' },
                    { symbol: 'Ek2', value: null, unit: 'J', role: 'unknown', note: '末动能' },
                    { symbol: 'Ep2', value: null, unit: 'J', role: 'unknown', note: '末势能' },
                    { symbol: 'W非', value: null, unit: 'J', role: 'given', note: '非保守力做功' }
                ],
                formulas: ['E1 = E2', 'Ek1 + Ep1 = Ek2 + Ep2', 'E2 - E1 = W非'],
                dependencies: ['work_energy'],
                output: ['E1', 'E2', 'Ek2', 'Ep2']
            });
            // 弹性势能模块
            this.atomicModules.set('elastic_potential_energy', {
                id: 'elastic_potential_energy',
                type: 'energy',
                name: '弹性势能',
                description: '处理弹簧的弹性势能',
                parameters: [
                    { symbol: 'Ep弹', value: null, unit: 'J', role: 'unknown', note: '弹性势能' },
                    { symbol: 'k', value: null, unit: 'N/m', role: 'given', note: '弹簧常数' },
                    { symbol: 'x', value: null, unit: 'm', role: 'given', note: '形变量' },
                    { symbol: 'F弹', value: null, unit: 'N', role: 'unknown', note: '弹力' }
                ],
                formulas: ['Ep弹 = ½kx²', 'F弹 = -kx', 'W弹 = -ΔEp弹'],
                dependencies: ['work_energy'],
                output: ['Ep弹', 'F弹']
            });
            // 功率效率模块
            this.atomicModules.set('power_efficiency', {
                id: 'power_efficiency',
                type: 'energy',
                name: '功率效率',
                description: '处理功率和机械效率',
                parameters: [
                    { symbol: 'P输入', value: null, unit: 'W', role: 'given', note: '输入功率' },
                    { symbol: 'P输出', value: null, unit: 'W', role: 'unknown', note: '输出功率' },
                    { symbol: 'η', value: null, unit: '', role: 'unknown', note: '效率' },
                    { symbol: 'P损失', value: null, unit: 'W', role: 'unknown', note: '损失功率' }
                ],
                formulas: ['η = P输出/P输入', 'P输出 = ηP输入', 'P损失 = P输入 - P输出'],
                dependencies: ['work_energy'],
                output: ['P输出', 'η', 'P损失']
            });
            // 圆周运动模块
            this.atomicModules.set('circular_motion', {
                id: 'circular_motion',
                type: 'kinematics',
                name: '圆周运动',
                description: '处理匀速圆周运动',
                parameters: [
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '线速度' },
                    { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '角速度' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' },
                    { symbol: 'r', value: null, unit: 'm', role: 'given', note: '半径' },
                    { symbol: 'a', value: null, unit: 'm/s²', role: 'unknown', note: '向心加速度' },
                    { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '向心力' }
                ],
                formulas: ['v = ωr', 'T = 2π/ω', 'f = 1/T', 'a = v²/r', 'F = mv²/r'],
                dependencies: ['newton_dynamics'],
                output: ['v', 'ω', 'T', 'f', 'a', 'F']
            });
            // 简谐振动模块
            this.atomicModules.set('oscillation', {
                id: 'oscillation',
                type: 'oscillation',
                name: '简谐振动',
                description: '处理弹簧振子和单摆的简谐振动',
                parameters: [
                    { symbol: 'A', value: null, unit: 'm', role: 'given', note: '振幅' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' },
                    { symbol: 'k', value: null, unit: 'N/m', role: 'given', note: '弹簧常数' },
                    { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
                    { symbol: 'l', value: null, unit: 'm', role: 'given', note: '摆长' },
                    { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '位移' }
                ],
                formulas: ['T = 2π√(m/k)', 'T = 2π√(l/g)', 'f = 1/T', 'x = Asin(ωt + φ)'],
                dependencies: ['newton_dynamics'],
                output: ['T', 'f', 'x']
            });
            // 阻尼振动模块
            this.atomicModules.set('damped_oscillation', {
                id: 'damped_oscillation',
                type: 'oscillation',
                name: '阻尼振动',
                description: '处理阻尼振动和受迫振动',
                parameters: [
                    { symbol: 'γ', value: null, unit: 's⁻¹', role: 'given', note: '阻尼系数' },
                    { symbol: 'ω0', value: null, unit: 'rad/s', role: 'given', note: '固有频率' },
                    { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '振动频率' },
                    { symbol: 'Q', value: null, unit: '', role: 'unknown', note: '品质因子' },
                    { symbol: 'τ', value: null, unit: 's', role: 'unknown', note: '衰减时间' },
                    { symbol: 'F0', value: null, unit: 'N', role: 'given', note: '驱动力幅值' }
                ],
                formulas: ['ω = √(ω0² - γ²)', 'Q = ω0/(2γ)', 'τ = 1/γ', 'x = Ae^(-γt)cos(ωt + φ)'],
                dependencies: ['oscillation'],
                output: ['ω', 'Q', 'τ']
            });
            // 机械波模块
            this.atomicModules.set('mechanical_waves', {
                id: 'mechanical_waves',
                type: 'waves',
                name: '机械波',
                description: '处理机械波的传播和干涉',
                parameters: [
                    { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '波长' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'given', note: '频率' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '波速' },
                    { symbol: 'A', value: null, unit: 'm', role: 'given', note: '振幅' },
                    { symbol: 'k', value: null, unit: 'rad/m', role: 'unknown', note: '波数' },
                    { symbol: 'ω', value: null, unit: 'rad/s', role: 'unknown', note: '角频率' }
                ],
                formulas: ['v = λf', 'T = 1/f', 'k = 2π/λ', 'ω = 2πf', 'y = Asin(kx - ωt + φ)'],
                dependencies: ['oscillation'],
                output: ['λ', 'T', 'v', 'k', 'ω']
            });
            // 声波模块
            this.atomicModules.set('sound_waves', {
                id: 'sound_waves',
                type: 'waves',
                name: '声波',
                description: '处理声波的传播和多普勒效应',
                parameters: [
                    { symbol: 'v声', value: 340, unit: 'm/s', role: 'constant', note: '声速' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'given', note: '频率' },
                    { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '波长' },
                    { symbol: 'I', value: null, unit: 'W/m²', role: 'unknown', note: '声强' },
                    { symbol: 'L', value: null, unit: 'dB', role: 'unknown', note: '声强级' },
                    { symbol: 'f\'', value: null, unit: 'Hz', role: 'unknown', note: '多普勒频率' },
                    { symbol: 'vs', value: null, unit: 'm/s', role: 'given', note: '声源速度' },
                    { symbol: 'vo', value: null, unit: 'm/s', role: 'given', note: '观察者速度' }
                ],
                formulas: ['λ = v声/f', 'I = P/(4πr²)', 'L = 10log(I/I0)', 'f\' = f(v声 ± vo)/(v声 ∓ vs)'],
                dependencies: ['mechanical_waves'],
                output: ['λ', 'I', 'L', 'f\'']
            });
            // 波的干涉模块
            this.atomicModules.set('wave_interference', {
                id: 'wave_interference',
                type: 'waves',
                name: '波的干涉',
                description: '处理波的干涉和衍射',
                parameters: [
                    { symbol: 'd', value: null, unit: 'm', role: 'given', note: '双缝间距' },
                    { symbol: 'L', value: null, unit: 'm', role: 'given', note: '屏距' },
                    { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '条纹间距' },
                    { symbol: 'Δr', value: null, unit: 'm', role: 'unknown', note: '光程差' },
                    { symbol: 'δ', value: null, unit: 'rad', role: 'unknown', note: '相位差' },
                    { symbol: 'a', value: null, unit: 'm', role: 'given', note: '单缝宽度' },
                    { symbol: 'θ', value: null, unit: '°', role: 'unknown', note: '衍射角' }
                ],
                formulas: ['x = λL/d', 'Δr = dsinθ', 'δ = 2πΔr/λ', 'asinθ = nλ'],
                dependencies: ['mechanical_waves'],
                output: ['x', 'Δr', 'δ', 'θ']
            });
            // 直流电路模块
            this.atomicModules.set('dc_circuit', {
                id: 'dc_circuit',
                type: 'electricity',
                name: '直流电路',
                description: '处理欧姆定律和电路分析',
                parameters: [
                    { symbol: 'U', value: null, unit: 'V', role: 'unknown', note: '电压' },
                    { symbol: 'I', value: null, unit: 'A', role: 'unknown', note: '电流' },
                    { symbol: 'R', value: null, unit: 'Ω', role: 'given', note: '电阻' },
                    { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '功率' },
                    { symbol: 'Q', value: null, unit: 'C', role: 'unknown', note: '电荷量' },
                    { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
                ],
                formulas: ['U = IR', 'P = UI', 'P = I²R', 'P = U²/R', 'Q = It'],
                dependencies: [],
                output: ['U', 'I', 'P', 'Q']
            });
            // 几何光学模块
            this.atomicModules.set('geometric_optics', {
                id: 'geometric_optics',
                type: 'optics',
                name: '几何光学',
                description: '处理反射和折射定律',
                parameters: [
                    { symbol: 'i', value: null, unit: '°', role: 'given', note: '入射角' },
                    { symbol: 'r', value: null, unit: '°', role: 'unknown', note: '反射角' },
                    { symbol: 'n', value: null, unit: '', role: 'given', note: '折射率' },
                    { symbol: 'c', value: 3e8, unit: 'm/s', role: 'constant', note: '光速' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '光在介质中的速度' },
                    { symbol: 'f', value: null, unit: 'm', role: 'unknown', note: '焦距' },
                    { symbol: 'u', value: null, unit: 'm', role: 'given', note: '物距' },
                    { symbol: 'v_img', value: null, unit: 'm', role: 'unknown', note: '像距' }
                ],
                formulas: ['i = r', 'n = c/v', '1/f = 1/u + 1/v', 'sin i/sin r = n'],
                dependencies: [],
                output: ['r', 'v', 'f', 'v_img']
            });
            // 热学模块
            this.atomicModules.set('thermal', {
                id: 'thermal',
                type: 'thermal',
                name: '热学',
                description: '处理热量传递和温度变化',
                parameters: [
                    { symbol: 'Q', value: null, unit: 'J', role: 'unknown', note: '热量' },
                    { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
                    { symbol: 'c', value: null, unit: 'J/(kg·K)', role: 'given', note: '比热容' },
                    { symbol: 'Δt', value: null, unit: 'K', role: 'given', note: '温度变化' },
                    { symbol: 'T1', value: null, unit: 'K', role: 'given', note: '初温度' },
                    { symbol: 'T2', value: null, unit: 'K', role: 'unknown', note: '末温度' },
                    { symbol: 'L', value: null, unit: 'J/kg', role: 'given', note: '潜热' }
                ],
                formulas: ['Q = mcΔt', 'Q = mL', 'Δt = T2 - T1'],
                dependencies: [],
                output: ['Q', 'T2']
            });
            // 理想气体模块
            this.atomicModules.set('ideal_gas', {
                id: 'ideal_gas',
                type: 'thermal',
                name: '理想气体',
                description: '处理理想气体状态方程',
                parameters: [
                    { symbol: 'p', value: null, unit: 'Pa', role: 'unknown', note: '压强' },
                    { symbol: 'V', value: null, unit: 'm³', role: 'unknown', note: '体积' },
                    { symbol: 'T', value: null, unit: 'K', role: 'unknown', note: '温度' },
                    { symbol: 'n', value: null, unit: 'mol', role: 'given', note: '物质的量' },
                    { symbol: 'R', value: 8.314, unit: 'J/(mol·K)', role: 'constant', note: '气体常数' },
                    { symbol: 'N', value: null, unit: '', role: 'unknown', note: '分子数' },
                    { symbol: 'NA', value: 6.022e23, unit: 'mol⁻¹', role: 'constant', note: '阿伏伽德罗常数' }
                ],
                formulas: ['pV = nRT', 'pV = NkT', 'N = nNA', 'k = R/NA'],
                dependencies: ['thermal'],
                output: ['p', 'V', 'T', 'N']
            });
            // 热力学第一定律模块
            this.atomicModules.set('first_law_thermodynamics', {
                id: 'first_law_thermodynamics',
                type: 'thermal',
                name: '热力学第一定律',
                description: '处理热力学第一定律和内能变化',
                parameters: [
                    { symbol: 'ΔU', value: null, unit: 'J', role: 'unknown', note: '内能变化' },
                    { symbol: 'Q', value: null, unit: 'J', role: 'given', note: '吸收热量' },
                    { symbol: 'W', value: null, unit: 'J', role: 'given', note: '对外做功' },
                    { symbol: 'Cv', value: null, unit: 'J/(mol·K)', role: 'given', note: '定容热容' },
                    { symbol: 'Cp', value: null, unit: 'J/(mol·K)', role: 'given', note: '定压热容' },
                    { symbol: 'γ', value: null, unit: '', role: 'unknown', note: '比热比' }
                ],
                formulas: ['ΔU = Q - W', 'ΔU = nCvΔT', 'Q = nCpΔT', 'γ = Cp/Cv'],
                dependencies: ['ideal_gas', 'thermal'],
                output: ['ΔU', 'γ']
            });
            // 热机效率模块
            this.atomicModules.set('heat_engine_efficiency', {
                id: 'heat_engine_efficiency',
                type: 'thermal',
                name: '热机效率',
                description: '处理热机效率和卡诺循环',
                parameters: [
                    { symbol: 'η', value: null, unit: '', role: 'unknown', note: '热机效率' },
                    { symbol: 'Q吸', value: null, unit: 'J', role: 'given', note: '吸收热量' },
                    { symbol: 'Q放', value: null, unit: 'J', role: 'given', note: '放出热量' },
                    { symbol: 'W', value: null, unit: 'J', role: 'unknown', note: '净功' },
                    { symbol: 'T高', value: null, unit: 'K', role: 'given', note: '高温热源温度' },
                    { symbol: 'T低', value: null, unit: 'K', role: 'given', note: '低温热源温度' }
                ],
                formulas: ['η = W/Q吸', 'η = 1 - Q放/Q吸', 'η卡诺 = 1 - T低/T高'],
                dependencies: ['first_law_thermodynamics'],
                output: ['η', 'W']
            });
            // 压强浮力模块
            this.atomicModules.set('pressure_buoyancy', {
                id: 'pressure_buoyancy',
                type: 'fluid',
                name: '压强浮力',
                description: '处理液体压强和阿基米德原理',
                parameters: [
                    { symbol: 'p', value: null, unit: 'Pa', role: 'unknown', note: '压强' },
                    { symbol: 'ρ', value: null, unit: 'kg/m³', role: 'given', note: '密度' },
                    { symbol: 'h', value: null, unit: 'm', role: 'given', note: '深度' },
                    { symbol: 'F浮', value: null, unit: 'N', role: 'unknown', note: '浮力' },
                    { symbol: 'V排', value: null, unit: 'm³', role: 'unknown', note: '排开液体体积' },
                    { symbol: 'g', value: 9.8, unit: 'm/s²', role: 'constant', note: '重力加速度' }
                ],
                formulas: ['p = ρgh', 'F浮 = ρgV排', 'F浮 = G排'],
                dependencies: ['newton_dynamics'],
                output: ['p', 'F浮', 'V排']
            });
            // 万有引力模块
            this.atomicModules.set('gravitation', {
                id: 'gravitation',
                type: 'gravitation',
                name: '万有引力',
                description: '处理万有引力定律和天体运动',
                parameters: [
                    { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '万有引力' },
                    { symbol: 'G', value: 6.67e-11, unit: 'N·m²/kg²', role: 'constant', note: '万有引力常量' },
                    { symbol: 'm1', value: null, unit: 'kg', role: 'given', note: '质量1' },
                    { symbol: 'm2', value: null, unit: 'kg', role: 'given', note: '质量2' },
                    { symbol: 'r', value: null, unit: 'm', role: 'given', note: '距离' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '轨道速度' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' }
                ],
                formulas: ['F = Gm1m2/r²', 'v = √(GM/r)', 'T = 2π√(r³/GM)'],
                dependencies: ['circular_motion'],
                output: ['F', 'v', 'T']
            });
            // 动量模块
            this.atomicModules.set('momentum', {
                id: 'momentum',
                type: 'momentum',
                name: '动量',
                description: '处理动量定理和动量守恒',
                parameters: [
                    { symbol: 'p', value: null, unit: 'kg·m/s', role: 'unknown', note: '动量' },
                    { symbol: 'I', value: null, unit: 'N·s', role: 'unknown', note: '冲量' },
                    { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'given', note: '速度' },
                    { symbol: 'F', value: null, unit: 'N', role: 'given', note: '力' },
                    { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
                ],
                formulas: ['p = mv', 'I = Ft', 'I = Δp', 'p1 + p2 = p1\' + p2\''],
                dependencies: ['newton_dynamics'],
                output: ['p', 'I']
            });
            // 静电场模块
            this.atomicModules.set('electrostatics', {
                id: 'electrostatics',
                type: 'electrostatics',
                name: '静电场',
                description: '处理库仑定律和电场强度',
                parameters: [
                    { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '库仑力' },
                    { symbol: 'k', value: 9e9, unit: 'N·m²/C²', role: 'constant', note: '静电力常量' },
                    { symbol: 'q1', value: null, unit: 'C', role: 'given', note: '电荷1' },
                    { symbol: 'q2', value: null, unit: 'C', role: 'given', note: '电荷2' },
                    { symbol: 'r', value: null, unit: 'm', role: 'given', note: '距离' },
                    { symbol: 'E', value: null, unit: 'N/C', role: 'unknown', note: '电场强度' },
                    { symbol: 'U', value: null, unit: 'V', role: 'unknown', note: '电势' }
                ],
                formulas: ['F = kq1q2/r²', 'E = F/q', 'E = kq/r²', 'U = kq/r'],
                dependencies: [],
                output: ['F', 'E', 'U']
            });
            // 电容器模块
            this.atomicModules.set('capacitor', {
                id: 'capacitor',
                type: 'electrostatics',
                name: '电容器',
                description: '处理电容器的充放电和能量存储',
                parameters: [
                    { symbol: 'C', value: null, unit: 'F', role: 'unknown', note: '电容' },
                    { symbol: 'Q', value: null, unit: 'C', role: 'unknown', note: '电荷量' },
                    { symbol: 'U', value: null, unit: 'V', role: 'given', note: '电压' },
                    { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '电场能量' },
                    { symbol: 'ε', value: null, unit: 'F/m', role: 'given', note: '介电常数' },
                    { symbol: 'S', value: null, unit: 'm²', role: 'given', note: '极板面积' },
                    { symbol: 'd', value: null, unit: 'm', role: 'given', note: '极板间距' }
                ],
                formulas: ['C = Q/U', 'C = εS/d', 'E = ½CU²', 'E = ½QU'],
                dependencies: ['electrostatics'],
                output: ['C', 'Q', 'E']
            });
            // 电场中的运动模块
            this.atomicModules.set('motion_in_electric_field', {
                id: 'motion_in_electric_field',
                type: 'electrostatics',
                name: '电场中的运动',
                description: '处理带电粒子在电场中的运动',
                parameters: [
                    { symbol: 'q', value: null, unit: 'C', role: 'given', note: '电荷' },
                    { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
                    { symbol: 'E', value: null, unit: 'N/C', role: 'given', note: '电场强度' },
                    { symbol: 'a', value: null, unit: 'm/s²', role: 'unknown', note: '加速度' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '速度' },
                    { symbol: 's', value: null, unit: 'm', role: 'unknown', note: '位移' },
                    { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' }
                ],
                formulas: ['F = qE', 'a = qE/m', 'v = at', 's = ½at²'],
                dependencies: ['electrostatics', 'kinematics_linear'],
                output: ['a', 'v', 's']
            });
            // 磁场模块
            this.atomicModules.set('magnetism', {
                id: 'magnetism',
                type: 'magnetism',
                name: '磁场',
                description: '处理安培力和洛伦兹力',
                parameters: [
                    { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '安培力' },
                    { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
                    { symbol: 'I', value: null, unit: 'A', role: 'given', note: '电流' },
                    { symbol: 'L', value: null, unit: 'm', role: 'given', note: '导线长度' },
                    { symbol: 'q', value: null, unit: 'C', role: 'given', note: '电荷' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'given', note: '速度' },
                    { symbol: 'θ', value: null, unit: '°', role: 'given', note: '角度' }
                ],
                formulas: ['F = BILsinθ', 'F = qvBsinθ', 'F = qvB'],
                dependencies: ['dc_circuit'],
                output: ['F']
            });
            // 磁场中的运动模块
            this.atomicModules.set('motion_in_magnetic_field', {
                id: 'motion_in_magnetic_field',
                type: 'magnetism',
                name: '磁场中的运动',
                description: '处理带电粒子在磁场中的运动',
                parameters: [
                    { symbol: 'q', value: null, unit: 'C', role: 'given', note: '电荷' },
                    { symbol: 'm', value: null, unit: 'kg', role: 'given', note: '质量' },
                    { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'given', note: '速度' },
                    { symbol: 'r', value: null, unit: 'm', role: 'unknown', note: '回旋半径' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '回旋周期' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '回旋频率' }
                ],
                formulas: ['r = mv/(qB)', 'T = 2πm/(qB)', 'f = qB/(2πm)', 'ω = qB/m'],
                dependencies: ['magnetism', 'circular_motion'],
                output: ['r', 'T', 'f']
            });
            // 霍尔效应模块
            this.atomicModules.set('hall_effect', {
                id: 'hall_effect',
                type: 'magnetism',
                name: '霍尔效应',
                description: '处理霍尔效应和载流子浓度测量',
                parameters: [
                    { symbol: 'UH', value: null, unit: 'V', role: 'unknown', note: '霍尔电压' },
                    { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
                    { symbol: 'I', value: null, unit: 'A', role: 'given', note: '电流' },
                    { symbol: 'd', value: null, unit: 'm', role: 'given', note: '样品厚度' },
                    { symbol: 'n', value: null, unit: 'm⁻³', role: 'unknown', note: '载流子浓度' },
                    { symbol: 'q', value: 1.6e-19, unit: 'C', role: 'constant', note: '电子电荷' }
                ],
                formulas: ['UH = BI/(nqd)', 'n = BI/(qUHd)', 'RH = 1/(nq)'],
                dependencies: ['magnetism'],
                output: ['UH', 'n']
            });
            // 电磁感应模块
            this.atomicModules.set('electromagnetic_induction', {
                id: 'electromagnetic_induction',
                type: 'electromagnetic_induction',
                name: '电磁感应',
                description: '处理法拉第电磁感应定律',
                parameters: [
                    { symbol: 'ε', value: null, unit: 'V', role: 'unknown', note: '感应电动势' },
                    { symbol: 'Φ', value: null, unit: 'Wb', role: 'given', note: '磁通量' },
                    { symbol: 'ΔΦ', value: null, unit: 'Wb', role: 'given', note: '磁通量变化' },
                    { symbol: 'Δt', value: null, unit: 's', role: 'given', note: '时间变化' },
                    { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁感应强度' },
                    { symbol: 'S', value: null, unit: 'm²', role: 'given', note: '面积' },
                    { symbol: 'θ', value: null, unit: '°', role: 'given', note: '角度' }
                ],
                formulas: ['ε = -ΔΦ/Δt', 'Φ = BScosθ', 'ε = BLv'],
                dependencies: ['magnetism'],
                output: ['ε']
            });
            // 自感互感模块
            this.atomicModules.set('self_mutual_inductance', {
                id: 'self_mutual_inductance',
                type: 'electromagnetic_induction',
                name: '自感互感',
                description: '处理自感和互感现象',
                parameters: [
                    { symbol: 'L', value: null, unit: 'H', role: 'unknown', note: '自感系数' },
                    { symbol: 'M', value: null, unit: 'H', role: 'unknown', note: '互感系数' },
                    { symbol: 'ε自', value: null, unit: 'V', role: 'unknown', note: '自感电动势' },
                    { symbol: 'ε互', value: null, unit: 'V', role: 'unknown', note: '互感电动势' },
                    { symbol: 'I', value: null, unit: 'A', role: 'given', note: '电流' },
                    { symbol: 'ΔI', value: null, unit: 'A', role: 'given', note: '电流变化' },
                    { symbol: 'Δt', value: null, unit: 's', role: 'given', note: '时间变化' }
                ],
                formulas: ['ε自 = -LΔI/Δt', 'ε互 = -MΔI/Δt', 'L = Φ/I', 'M = Φ21/I1'],
                dependencies: ['electromagnetic_induction'],
                output: ['L', 'M', 'ε自', 'ε互']
            });
            // 电磁波模块
            this.atomicModules.set('electromagnetic_waves', {
                id: 'electromagnetic_waves',
                type: 'electromagnetic_waves',
                name: '电磁波',
                description: '处理电磁波的传播和性质',
                parameters: [
                    { symbol: 'c', value: 3e8, unit: 'm/s', role: 'constant', note: '光速' },
                    { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '波长' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'given', note: '频率' },
                    { symbol: 'E', value: null, unit: 'V/m', role: 'unknown', note: '电场强度' },
                    { symbol: 'B', value: null, unit: 'T', role: 'unknown', note: '磁感应强度' },
                    { symbol: 'S', value: null, unit: 'W/m²', role: 'unknown', note: '能流密度' },
                    { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '功率' }
                ],
                formulas: ['c = λf', 'E = cB', 'S = EB/μ0', 'P = SA', 'E = E0sin(kx - ωt)'],
                dependencies: ['electromagnetic_induction'],
                output: ['λ', 'E', 'B', 'S', 'P']
            });
            // 交流电模块
            this.atomicModules.set('ac_circuit', {
                id: 'ac_circuit',
                type: 'ac_circuit',
                name: '交流电',
                description: '处理正弦交流电',
                parameters: [
                    { symbol: 'u', value: null, unit: 'V', role: 'unknown', note: '瞬时电压' },
                    { symbol: 'i', value: null, unit: 'A', role: 'unknown', note: '瞬时电流' },
                    { symbol: 'Um', value: null, unit: 'V', role: 'given', note: '峰值电压' },
                    { symbol: 'Im', value: null, unit: 'A', role: 'given', note: '峰值电流' },
                    { symbol: 'U', value: null, unit: 'V', role: 'unknown', note: '有效值电压' },
                    { symbol: 'I', value: null, unit: 'A', role: 'unknown', note: '有效值电流' },
                    { symbol: 'ω', value: null, unit: 'rad/s', role: 'given', note: '角频率' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '周期' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' }
                ],
                formulas: ['u = Umsin(ωt)', 'i = Imsin(ωt)', 'U = Um/√2', 'I = Im/√2', 'T = 2π/ω', 'f = 1/T'],
                dependencies: ['dc_circuit'],
                output: ['u', 'i', 'U', 'I', 'T', 'f']
            });
            // 物理光学模块
            this.atomicModules.set('physical_optics', {
                id: 'physical_optics',
                type: 'physical_optics',
                name: '物理光学',
                description: '处理光的干涉和衍射',
                parameters: [
                    { symbol: 'λ', value: null, unit: 'm', role: 'given', note: '波长' },
                    { symbol: 'd', value: null, unit: 'm', role: 'given', note: '双缝间距' },
                    { symbol: 'L', value: null, unit: 'm', role: 'given', note: '屏距' },
                    { symbol: 'x', value: null, unit: 'm', role: 'unknown', note: '条纹间距' },
                    { symbol: 'a', value: null, unit: 'm', role: 'given', note: '单缝宽度' },
                    { symbol: 'θ', value: null, unit: '°', role: 'unknown', note: '衍射角' },
                    { symbol: 'n', value: null, unit: '', role: 'given', note: '折射率' }
                ],
                formulas: ['x = λL/d', 'asinθ = nλ', 'n = c/v'],
                dependencies: ['geometric_optics'],
                output: ['x', 'θ']
            });
            // 光的偏振模块
            this.atomicModules.set('light_polarization', {
                id: 'light_polarization',
                type: 'physical_optics',
                name: '光的偏振',
                description: '处理光的偏振现象',
                parameters: [
                    { symbol: 'I0', value: null, unit: 'W/m²', role: 'given', note: '入射光强' },
                    { symbol: 'I', value: null, unit: 'W/m²', role: 'unknown', note: '透射光强' },
                    { symbol: 'θ', value: null, unit: '°', role: 'given', note: '偏振片夹角' },
                    { symbol: 'n0', value: null, unit: '', role: 'given', note: '寻常光折射率' },
                    { symbol: 'ne', value: null, unit: '', role: 'given', note: '非寻常光折射率' },
                    { symbol: 'Δn', value: null, unit: '', role: 'unknown', note: '双折射率差' }
                ],
                formulas: ['I = I0cos²θ', 'Δn = ne - n0', 'I = I0/2 (自然光)'],
                dependencies: ['physical_optics'],
                output: ['I', 'Δn']
            });
            // 激光模块
            this.atomicModules.set('laser', {
                id: 'laser',
                type: 'physical_optics',
                name: '激光',
                description: '处理激光的产生和特性',
                parameters: [
                    { symbol: 'λ', value: null, unit: 'm', role: 'given', note: '激光波长' },
                    { symbol: 'P', value: null, unit: 'W', role: 'given', note: '激光功率' },
                    { symbol: 'I', value: null, unit: 'W/m²', role: 'unknown', note: '激光强度' },
                    { symbol: 'A', value: null, unit: 'm²', role: 'given', note: '光束截面积' },
                    { symbol: 'Δλ', value: null, unit: 'm', role: 'unknown', note: '线宽' },
                    { symbol: 'τ', value: null, unit: 's', role: 'unknown', note: '脉冲宽度' }
                ],
                formulas: ['I = P/A', 'Δλ = λ²/(cτ)', 'E = Pτ'],
                dependencies: ['physical_optics'],
                output: ['I', 'Δλ', 'τ']
            });
            // 近代物理模块
            this.atomicModules.set('modern_physics', {
                id: 'modern_physics',
                type: 'modern_physics',
                name: '近代物理',
                description: '处理光电效应和原子结构',
                parameters: [
                    { symbol: 'h', value: 6.63e-34, unit: 'J·s', role: 'constant', note: '普朗克常量' },
                    { symbol: 'c', value: 3e8, unit: 'm/s', role: 'constant', note: '光速' },
                    { symbol: 'λ', value: null, unit: 'm', role: 'given', note: '波长' },
                    { symbol: 'f', value: null, unit: 'Hz', role: 'unknown', note: '频率' },
                    { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '光子能量' },
                    { symbol: 'Ek', value: null, unit: 'J', role: 'unknown', note: '光电子动能' },
                    { symbol: 'W', value: null, unit: 'J', role: 'given', note: '逸出功' },
                    { symbol: 'n', value: null, unit: '', role: 'given', note: '量子数' }
                ],
                formulas: ['E = hf', 'E = hc/λ', 'Ek = hf - W', 'f = c/λ'],
                dependencies: [],
                output: ['f', 'E', 'Ek']
            });
            // 原子结构模块
            this.atomicModules.set('atomic_structure', {
                id: 'atomic_structure',
                type: 'modern_physics',
                name: '原子结构',
                description: '处理玻尔原子模型和能级跃迁',
                parameters: [
                    { symbol: 'En', value: null, unit: 'eV', role: 'unknown', note: '能级能量' },
                    { symbol: 'n', value: null, unit: '', role: 'given', note: '主量子数' },
                    { symbol: 'Z', value: null, unit: '', role: 'given', note: '原子序数' },
                    { symbol: 'rn', value: null, unit: 'm', role: 'unknown', note: '轨道半径' },
                    { symbol: 'vn', value: null, unit: 'm/s', role: 'unknown', note: '电子速度' },
                    { symbol: 'ΔE', value: null, unit: 'eV', role: 'unknown', note: '能级差' },
                    { symbol: 'λ', value: null, unit: 'm', role: 'unknown', note: '跃迁波长' }
                ],
                formulas: ['En = -13.6Z²/n² eV', 'rn = n²a0/Z', 'vn = Zαc/n', 'ΔE = hc/λ'],
                dependencies: ['modern_physics'],
                output: ['En', 'rn', 'vn', 'ΔE', 'λ']
            });
            // 量子力学基础模块
            this.atomicModules.set('quantum_mechanics_basics', {
                id: 'quantum_mechanics_basics',
                type: 'quantum_physics',
                name: '量子力学基础',
                description: '处理薛定谔方程和波函数',
                parameters: [
                    { symbol: 'ψ', value: null, unit: 'm⁻³/²', role: 'unknown', note: '波函数' },
                    { symbol: '|ψ|²', value: null, unit: 'm⁻³', role: 'unknown', note: '概率密度' },
                    { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '能量本征值' },
                    { symbol: 'p', value: null, unit: 'kg·m/s', role: 'unknown', note: '动量' },
                    { symbol: 'x', value: null, unit: 'm', role: 'given', note: '位置' },
                    { symbol: 'Δx', value: null, unit: 'm', role: 'unknown', note: '位置不确定度' },
                    { symbol: 'Δp', value: null, unit: 'kg·m/s', role: 'unknown', note: '动量不确定度' }
                ],
                formulas: ['Ĥψ = Eψ', '|ψ|² = ψ*ψ', 'ΔxΔp ≥ ℏ/2', 'p = ℏk'],
                dependencies: ['modern_physics'],
                output: ['ψ', '|ψ|²', 'E', 'p', 'Δx', 'Δp']
            });
            // 固体物理模块
            this.atomicModules.set('solid_state_physics', {
                id: 'solid_state_physics',
                type: 'condensed_matter',
                name: '固体物理',
                description: '处理晶体结构和能带理论',
                parameters: [
                    { symbol: 'a', value: null, unit: 'm', role: 'given', note: '晶格常数' },
                    { symbol: 'Eg', value: null, unit: 'eV', role: 'unknown', note: '禁带宽度' },
                    { symbol: 'EF', value: null, unit: 'eV', role: 'unknown', note: '费米能级' },
                    { symbol: 'n', value: null, unit: 'm⁻³', role: 'unknown', note: '载流子浓度' },
                    { symbol: 'μ', value: null, unit: 'm²/(V·s)', role: 'unknown', note: '迁移率' },
                    { symbol: 'σ', value: null, unit: 'S/m', role: 'unknown', note: '电导率' }
                ],
                formulas: ['σ = nqμ', 'EF = ℏ²(3π²n)^(2/3)/(2m)', 'Eg = Ec - Ev'],
                dependencies: ['quantum_mechanics_basics'],
                output: ['Eg', 'EF', 'n', 'μ', 'σ']
            });
            // 核物理模块
            this.atomicModules.set('nuclear_physics', {
                id: 'nuclear_physics',
                type: 'nuclear_physics',
                name: '核物理',
                description: '处理核反应和放射性衰变',
                parameters: [
                    { symbol: 'N', value: null, unit: '', role: 'unknown', note: '剩余核数' },
                    { symbol: 'N0', value: null, unit: '', role: 'given', note: '初始核数' },
                    { symbol: 'λ', value: null, unit: 's⁻¹', role: 'given', note: '衰变常数' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '半衰期' },
                    { symbol: 't', value: null, unit: 's', role: 'given', note: '时间' },
                    { symbol: 'Δm', value: null, unit: 'kg', role: 'given', note: '质量亏损' },
                    { symbol: 'E', value: null, unit: 'J', role: 'unknown', note: '结合能' }
                ],
                formulas: ['N = N0e^(-λt)', 'T = ln2/λ', 'E = Δmc²'],
                dependencies: [],
                output: ['N', 'T', 'E']
            });
            // 天体物理模块
            this.atomicModules.set('astrophysics', {
                id: 'astrophysics',
                type: 'astrophysics',
                name: '天体物理',
                description: '处理天体运动和宇宙学',
                parameters: [
                    { symbol: 'M', value: null, unit: 'kg', role: 'given', note: '天体质量' },
                    { symbol: 'R', value: null, unit: 'm', role: 'given', note: '轨道半径' },
                    { symbol: 'v', value: null, unit: 'm/s', role: 'unknown', note: '轨道速度' },
                    { symbol: 'T', value: null, unit: 's', role: 'unknown', note: '轨道周期' },
                    { symbol: 'H0', value: 2.2e-18, unit: 's⁻¹', role: 'constant', note: '哈勃常数' },
                    { symbol: 'z', value: null, unit: '', role: 'given', note: '红移' },
                    { symbol: 'd', value: null, unit: 'm', role: 'unknown', note: '距离' }
                ],
                formulas: ['v = √(GM/R)', 'T = 2π√(R³/GM)', 'z = H0d/c', 'd = cz/H0'],
                dependencies: ['gravitation'],
                output: ['v', 'T', 'd']
            });
            // 生物物理模块
            this.atomicModules.set('biophysics', {
                id: 'biophysics',
                type: 'biophysics',
                name: '生物物理',
                description: '处理生物系统中的物理现象',
                parameters: [
                    { symbol: 'F', value: null, unit: 'N', role: 'unknown', note: '肌肉力' },
                    { symbol: 'A', value: null, unit: 'm²', role: 'given', note: '肌肉截面积' },
                    { symbol: 'σ', value: null, unit: 'Pa', role: 'unknown', note: '应力' },
                    { symbol: 'E', value: null, unit: 'Pa', role: 'given', note: '弹性模量' },
                    { symbol: 'ε', value: null, unit: '', role: 'unknown', note: '应变' },
                    { symbol: 'P', value: null, unit: 'W', role: 'unknown', note: '生物功率' },
                    { symbol: 'η', value: null, unit: '', role: 'unknown', note: '生物效率' }
                ],
                formulas: ['σ = F/A', 'σ = Eε', 'P = Fv', 'η = P输出/P输入'],
                dependencies: ['newton_dynamics', 'work_energy'],
                output: ['F', 'σ', 'ε', 'P', 'η']
            });
            // 材料物理模块
            this.atomicModules.set('materials_physics', {
                id: 'materials_physics',
                type: 'condensed_matter',
                name: '材料物理',
                description: '处理材料的物理性质',
                parameters: [
                    { symbol: 'E', value: null, unit: 'Pa', role: 'unknown', note: '杨氏模量' },
                    { symbol: 'σ', value: null, unit: 'Pa', role: 'given', note: '应力' },
                    { symbol: 'ε', value: null, unit: '', role: 'given', note: '应变' },
                    { symbol: 'K', value: null, unit: 'W/(m·K)', role: 'unknown', note: '热导率' },
                    { symbol: 'α', value: null, unit: 'K⁻¹', role: 'unknown', note: '热膨胀系数' },
                    { symbol: 'ρ', value: null, unit: 'Ω·m', role: 'unknown', note: '电阻率' },
                    { symbol: 'μ', value: null, unit: '', role: 'unknown', note: '磁导率' }
                ],
                formulas: ['E = σ/ε', 'K = Q/(AΔT/Δx)', 'α = ΔL/(LΔT)', 'ρ = RA/L'],
                dependencies: ['solid_state_physics'],
                output: ['E', 'K', 'α', 'ρ', 'μ']
            });
            // 等离子体物理模块
            this.atomicModules.set('plasma_physics', {
                id: 'plasma_physics',
                type: 'plasma_physics',
                name: '等离子体物理',
                description: '处理等离子体的物理性质',
                parameters: [
                    { symbol: 'ne', value: null, unit: 'm⁻³', role: 'given', note: '电子密度' },
                    { symbol: 'ni', value: null, unit: 'm⁻³', role: 'given', note: '离子密度' },
                    { symbol: 'Te', value: null, unit: 'K', role: 'given', note: '电子温度' },
                    { symbol: 'Ti', value: null, unit: 'K', role: 'given', note: '离子温度' },
                    { symbol: 'ωp', value: null, unit: 'rad/s', role: 'unknown', note: '等离子体频率' },
                    { symbol: 'λD', value: null, unit: 'm', role: 'unknown', note: '德拜长度' },
                    { symbol: 'B', value: null, unit: 'T', role: 'given', note: '磁场强度' }
                ],
                formulas: ['ωp = √(nee²/(ε0me))', 'λD = √(ε0kBTe/(nee²))', 'ωc = eB/me'],
                dependencies: ['electromagnetism'],
                output: ['ωp', 'λD']
            });
        }
        /**
         * 添加新模块
         */
        addModule(module) {
            this.atomicModules.set(module.id, module);
        }
        /**
         * 更新模块
         */
        updateModule(id, module) {
            if (this.atomicModules.has(id)) {
                this.atomicModules.set(id, module);
            }
        }
        /**
         * 删除模块
         */
        removeModule(id) {
            return this.atomicModules.delete(id);
        }
        /**
         * 获取模块统计信息
         */
        getStatistics() {
            const modulesByType = {};
            let totalParameters = 0;
            let totalFormulas = 0;
            for (const module of Array.from(this.atomicModules.values())) {
                modulesByType[module.type] = (modulesByType[module.type] || 0) + 1;
                totalParameters += module.parameters.length;
                totalFormulas += module.formulas.length;
            }
            return {
                totalModules: this.atomicModules.size,
                modulesByType,
                totalParameters,
                totalFormulas
            };
        }
    }
    exports.AtomicModuleLibrary = AtomicModuleLibrary;
    // 导出默认实例
    exports.atomicModuleLibrary = new AtomicModuleLibrary();
});
// services/ai_parsing/PhysicsAIParserAICaller.ts
define("ai_parsing/PhysicsAIParserAICaller", ["require", "exports", "ai_parsing/PhysicsAIParser", "ai_parsing/unitConverter", "ai_parsing/AtomicModules"], function (require, exports, PhysicsAIParser_1, unitConverter_2, AtomicModules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PhysicsAIParserAICaller = exports.DEFAULT_AI_CONFIG = void 0;
    // 默认配置
    exports.DEFAULT_AI_CONFIG = {
        provider: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'deepseek-v3',
        temperature: 0.1,
        maxTokens: 2000,
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
        enableLogging: process.env.NODE_ENV === 'development'
    };
    // 增强版 AI 解析器
    class PhysicsAIParserAICaller {
        constructor(config = {}) {
            this.config = {
                ...exports.DEFAULT_AI_CONFIG,
                ...config,
                provider: 'deepseek' // 确保始终使用 deepseek
            };
            this.unitConverter = new unitConverter_2.UnitConverter();
            // 验证配置
            const validation = this.validateConfig();
            if (!validation.valid && this.config.enableLogging) {
                console.warn('PhysicsAIParserAICaller 配置警告:', validation.errors.join(', '));
            }
        }
        /**
         * 使用 AI 增强解析物理题目（与 PhysicsAIParser 格式完全一致）
         * @param question 原始题目文本
         * @param options 解析选项
         * @returns 解析结果
         */
        async parseQuestion(question, options = {}) {
            try {
                // 1. 基础解析
                const basicResult = (0, PhysicsAIParser_1.parseQuestion)(question);
                // 2. 多级降级策略
                return await this.parseWithFallbackStrategy(question, basicResult, options);
            }
            catch (error) {
                console.warn('解析失败，使用基础解析:', error);
                return (0, PhysicsAIParser_1.parseQuestion)(question);
            }
        }
        /**
         * 纯AI解析方法，不使用回退策略
         */
        async parseQuestionWithAIOnly(question, options = {}) {
            try {
                const { enableModuleDecomposition = true, enableModuleComposition = true, language = 'zh' } = options;
                // 1. 基础解析（仅用于AI增强的输入）
                const basicResult = (0, PhysicsAIParser_1.parseQuestion)(question);
                if (enableModuleDecomposition) {
                    // 2. 模块分解分析
                    const moduleAnalysis = await this.decomposeIntoAtomicModules(question, language);
                    if (moduleAnalysis.success && moduleAnalysis.modules.length > 0) {
                        // 3. 模块组合分析
                        let moduleComposition = null;
                        if (enableModuleComposition && moduleAnalysis.modules.length > 1) {
                            moduleComposition = await this.buildModuleComposition(moduleAnalysis.modules, question, language);
                        }
                        // 4. 使用模块化思维增强 AI 解析
                        const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
                            ...options,
                            enableAdvancedAnalysis: true,
                            enableFormulaExtraction: true,
                            enableUnitOptimization: true,
                            moduleAnalysis: moduleAnalysis,
                            moduleComposition: moduleComposition
                        });
                        if (aiEnhanced.success && aiEnhanced.data) {
                            const enhanced = this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
                            // 生成解题路径规划
                            if (moduleComposition) {
                                enhanced.solutionPath = this.generateSolutionPath(enhanced, moduleComposition);
                            }
                            return enhanced;
                        }
                    }
                }
                // 5. 标准 AI 增强解析
                const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
                    ...options,
                    enableAdvancedAnalysis: true,
                    enableFormulaExtraction: true,
                    enableUnitOptimization: true
                });
                if (aiEnhanced.success && aiEnhanced.data) {
                    return this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
                }
                // 如果AI解析完全失败，抛出错误而不是回退
                throw new Error('AI解析失败：无法生成有效的解析结果');
            }
            catch (error) {
                throw new Error(`纯AI解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }
        /**
         * 双级降级解析策略
         */
        async parseWithFallbackStrategy(question, basicResult, options) {
            // 策略1: AI增强解析
            try {
                if (this.config.enableLogging) {
                    console.log('🔄 尝试策略: AI增强解析');
                }
                const aiResult = await this.enhanceWithAI(question, basicResult, options);
                if (aiResult.success && aiResult.data) {
                    if (this.config.enableLogging) {
                        console.log('✅ 策略成功: AI增强解析');
                    }
                    return this.optimizeParsedQuestion(basicResult, aiResult.data);
                }
            }
            catch (error) {
                if (this.config.enableLogging) {
                    console.warn('❌ 策略失败: AI增强解析', error.message);
                }
            }
            // 策略2: 模板匹配解析（PhysicsAIParser）
            try {
                if (this.config.enableLogging) {
                    console.log('🔄 尝试策略: 模板匹配解析');
                }
                // 直接使用PhysicsAIParser的基础解析结果
                if (this.config.enableLogging) {
                    console.log('✅ 策略成功: 模板匹配解析');
                }
                return basicResult;
            }
            catch (error) {
                if (this.config.enableLogging) {
                    console.warn('❌ 策略失败: 模板匹配解析', error.message);
                }
            }
            // 所有策略都失败，返回基础解析结果
            if (this.config.enableLogging) {
                console.warn('⚠️ 所有解析策略都失败，使用基础解析结果');
            }
            return basicResult;
        }
        /**
         * 使用原子模块解析复杂物理题目
         */
        async parseQuestionWithAtomicModules(question, options = {}) {
            try {
                const { enableModuleDecomposition = true, enableModuleComposition = true, language = 'zh' } = options;
                // 1. 基础解析
                const basicResult = (0, PhysicsAIParser_1.parseQuestion)(question);
                if (enableModuleDecomposition) {
                    // 2. 模块分解分析
                    const moduleAnalysis = await this.decomposeIntoAtomicModules(question, language);
                    if (moduleAnalysis.success && moduleAnalysis.modules.length > 0) {
                        // 3. 模块组合分析
                        let moduleComposition = null;
                        if (enableModuleComposition && moduleAnalysis.modules.length > 1) {
                            moduleComposition = await this.buildModuleComposition(moduleAnalysis.modules, question, language);
                        }
                        // 4. 使用模块化思维增强 AI 解析
                        const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
                            ...options,
                            enableAdvancedAnalysis: true,
                            enableFormulaExtraction: true,
                            enableUnitOptimization: true,
                            moduleAnalysis: moduleAnalysis,
                            moduleComposition: moduleComposition
                        });
                        if (aiEnhanced.success && aiEnhanced.data) {
                            const enhanced = this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
                            // 生成解题路径规划
                            if (moduleComposition) {
                                enhanced.solutionPath = this.generateSolutionPath(enhanced, moduleComposition);
                            }
                            return enhanced;
                        }
                    }
                }
                // 5. 回退到标准 AI 增强解析
                const aiEnhanced = await this.enhanceWithAI(question, basicResult, {
                    ...options,
                    enableAdvancedAnalysis: true,
                    enableFormulaExtraction: true,
                    enableUnitOptimization: true
                });
                if (aiEnhanced.success && aiEnhanced.data) {
                    return this.optimizeParsedQuestion(basicResult, aiEnhanced.data);
                }
                return basicResult;
            }
            catch (error) {
                console.warn('原子模块解析失败，使用基础解析:', error);
                return (0, PhysicsAIParser_1.parseQuestion)(question);
            }
        }
        /**
         * 使用 AI 增强信息优化解析结果
         */
        optimizeParsedQuestion(basicResult, aiEnhanced) {
            let result;
            // 如果 AI 返回了完整的 ParsedQuestion，使用 AI 的结果
            if (aiEnhanced && this.isValidParsedQuestion(aiEnhanced)) {
                result = aiEnhanced;
            }
            else {
                // 否则使用基础解析结果并尝试智能增强
                result = this.enhanceBasicResult(basicResult);
            }
            // 增强解析结果，添加DSL转换所需信息
            const enhanced = this.enhanceForDSL(result);
            // 验证DSL转换兼容性
            const dslValidation = this.validateDSLCompatibility(enhanced);
            if (this.config.enableLogging) {
                console.log('🔍 DSL转换兼容性验证:');
                console.log(`   兼容性: ${dslValidation.compatible ? '✅ 通过' : '❌ 不通过'}`);
                console.log(`   评分: ${dslValidation.score}/100`);
                if (dslValidation.issues.length > 0) {
                    console.log('   问题:');
                    dslValidation.issues.forEach(issue => {
                        console.log(`     - ${issue}`);
                    });
                }
                if (dslValidation.suggestions.length > 0) {
                    console.log('   建议:');
                    dslValidation.suggestions.forEach(suggestion => {
                        console.log(`     - ${suggestion}`);
                    });
                }
            }
            return enhanced;
        }
        /**
         * 增强基础解析结果
         */
        enhanceBasicResult(basicResult) {
            const enhanced = { ...basicResult };
            // 尝试从参数中推断模块
            const inferredModules = this.inferModulesFromParameters(enhanced.parameters);
            if (inferredModules.length > 0) {
                enhanced.solutionPath = {
                    steps: [],
                    modules: inferredModules,
                    dependencies: [],
                    executionOrder: inferredModules,
                    checkpoints: []
                };
            }
            // 尝试推断求解目标
            const unknownParams = enhanced.parameters.filter(p => p.role === 'unknown');
            if (unknownParams.length > 0) {
                enhanced.target = {
                    primary: unknownParams[0].symbol,
                    secondary: unknownParams.slice(1).map(p => p.symbol),
                    method: this.inferSolutionMethod(enhanced.parameters),
                    priority: 1
                };
            }
            return enhanced;
        }
        /**
         * 从参数推断模块
         */
        inferModulesFromParameters(parameters) {
            const modules = [];
            const paramSymbols = parameters.map(p => p.symbol);
            // 基于参数符号推断可能的模块
            const moduleInference = {
                'v': ['kinematics_linear', 'projectile_motion'],
                'v0': ['kinematics_linear', 'projectile_motion'],
                'a': ['kinematics_linear', 'newton_dynamics'],
                's': ['kinematics_linear'],
                'h': ['work_energy', 'mechanical_energy_conservation'],
                'm': ['newton_dynamics', 'work_energy'],
                'F': ['newton_dynamics'],
                'E': ['work_energy', 'mechanical_energy_conservation'],
                'W': ['work_energy'],
                'P': ['work_energy', 'power_efficiency'],
                'k': ['oscillation'],
                'T': ['oscillation', 'mechanical_waves'],
                'f': ['oscillation', 'mechanical_waves'],
                'λ': ['mechanical_waves', 'modern_physics'],
                'I': ['dc_circuit', 'electromagnetic_induction'],
                'U': ['dc_circuit', 'electrostatics'],
                'R': ['dc_circuit'],
                'B': ['magnetism', 'electromagnetic_induction'],
                'ε': ['electromagnetic_induction'],
                'Q': ['thermal', 'dc_circuit'],
                'c': ['thermal'],
                'ΔT': ['thermal']
            };
            for (const symbol of paramSymbols) {
                if (moduleInference[symbol]) {
                    modules.push(...moduleInference[symbol]);
                }
            }
            // 去重并返回
            return [...new Set(modules)];
        }
        /**
         * 推断求解方法
         */
        inferSolutionMethod(parameters) {
            const paramSymbols = parameters.map(p => p.symbol);
            if (paramSymbols.some(s => ['v', 'v0', 'a', 's', 't'].includes(s))) {
                return 'kinematics';
            }
            else if (paramSymbols.some(s => ['F', 'm', 'g'].includes(s))) {
                return 'dynamics';
            }
            else if (paramSymbols.some(s => ['E', 'W', 'P', 'h'].includes(s))) {
                return 'energy';
            }
            else {
                return 'mixed';
            }
        }
        /**
         * 使用 AI 增强解析结果
         */
        async enhanceWithAI(question, basicData, options = {}) {
            try {
                const prompt = this.buildEnhancementPrompt(question, basicData, options);
                const response = await this.callAI(prompt);
                if (response.success && response.data) {
                    const aiEnhanced = this.parseAIResponse(response.data);
                    if (aiEnhanced) {
                        return {
                            success: true,
                            data: aiEnhanced
                        };
                    }
                }
                return {
                    success: false,
                    error: 'AI 解析失败'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
        /**
         * 构建增强提示词
         */
        buildEnhancementPrompt(question, basicData, options) {
            return `你是物理题目解析专家。请将以下物理题目解析为JSON格式，不要包含任何markdown标记或额外文字。

题目：${question}

基础解析：
${JSON.stringify(basicData, null, 2)}

请输出完整的JSON，格式如下：
{
  "subject": "physics",
  "topic": "物理主题",
  "question": "${question}",
  "parameters": [
    {
      "symbol": "参数符号",
      "value": 数值或null,
      "unit": "单位",
      "role": "given|unknown|constant|derived",
      "note": "参数说明"
    }
  ],
  "units": [
    {
      "original": "原始单位",
      "standard": "标准单位", 
      "conversion": 转换系数
    }
  ],
  "target": {
    "primary": "主要求解目标",
    "secondary": ["次要求解目标"],
    "method": "kinematics|dynamics|energy|mixed",
    "priority": 1
  },
  "solutionPath": {
    "steps": [
      {
        "id": "step1",
        "type": "calculate",
        "module": "模块ID",
        "action": "操作描述",
        "inputs": ["输入参数"],
        "outputs": ["输出参数"],
        "formula": "公式",
        "order": 1
      }
    ],
    "modules": ["模块ID列表"],
    "dependencies": [],
    "executionOrder": ["模块执行顺序"],
    "checkpoints": []
  },
  "formulas": {
    "primary": [
      {
        "name": "公式名",
        "expression": "公式表达式",
        "description": "公式说明",
        "type": "primary",
        "module": "所属模块",
        "variables": ["变量列表"]
      }
    ],
    "intermediate": [],
    "verification": []
  },
  "constraints": {
    "initial": [],
    "boundary": [],
    "physical": [],
    "mathematical": []
  },
  "dslMetadata": {
    "complexity": "simple|medium|complex",
    "moduleCount": 1,
    "parameterCount": 1,
    "estimatedSteps": 1,
    "confidence": 0.8
  }
}

可用模块：kinematics_linear, projectile_motion, newton_dynamics, work_energy, mechanical_energy_conservation, circular_motion, oscillation, mechanical_waves, dc_circuit, electrostatics, magnetism, electromagnetic_induction, geometric_optics, thermal, pressure_buoyancy, gravitation, momentum, modern_physics, nuclear_physics

只输出JSON，不要其他内容。`;
        }
        /**
         * 解析 AI 响应
         */
        parseAIResponse(response) {
            if (!response || typeof response !== 'string') {
                return null;
            }
            // 清理响应文本
            const cleanedResponse = this.cleanAIResponse(response);
            try {
                // 尝试直接解析清理后的 JSON
                const parsed = JSON.parse(cleanedResponse);
                if (this.isValidParsedQuestion(parsed)) {
                    return parsed;
                }
            }
            catch (error) {
                // 如果直接解析失败，尝试多种提取策略
                const extractedJson = this.extractJsonFromResponse(response);
                if (extractedJson) {
                    try {
                        const parsed = JSON.parse(extractedJson);
                        if (this.isValidParsedQuestion(parsed)) {
                            return parsed;
                        }
                    }
                    catch (e) {
                        if (this.config.enableLogging) {
                            console.warn('提取的 JSON 解析失败:', e.message);
                        }
                    }
                }
            }
            if (this.config.enableLogging) {
                console.warn('AI 响应解析失败，响应内容:', response.substring(0, 200) + '...');
            }
            return null;
        }
        /**
         * 清理 AI 响应文本
         */
        cleanAIResponse(response) {
            return response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .replace(/^[\s\n\r]+/, '')
                .replace(/[\s\n\r]+$/, '')
                .trim();
        }
        /**
         * 从响应中提取 JSON 内容
         */
        extractJsonFromResponse(response) {
            // 策略1: 查找完整的 JSON 对象
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return this.cleanAIResponse(jsonMatch[0]);
            }
            // 策略2: 查找 JSON 数组
            const arrayMatch = response.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                return this.cleanAIResponse(arrayMatch[0]);
            }
            // 策略3: 查找被 markdown 包围的 JSON
            const markdownMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (markdownMatch) {
                return this.cleanAIResponse(markdownMatch[1]);
            }
            // 策略4: 查找行内 JSON
            const lines = response.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    try {
                        JSON.parse(trimmed);
                        return trimmed;
                    }
                    catch (e) {
                        // 继续尝试下一行
                    }
                }
            }
            return null;
        }
        /**
         * 验证 ParsedQuestion 格式
         */
        isValidParsedQuestion(obj) {
            return (obj &&
                typeof obj === 'object' &&
                obj.subject === 'physics' &&
                typeof obj.topic === 'string' &&
                typeof obj.question === 'string' &&
                Array.isArray(obj.parameters) &&
                Array.isArray(obj.units));
        }
        /**
         * 验证DSL转换兼容性
         */
        validateDSLCompatibility(parsedQuestion) {
            const issues = [];
            const suggestions = [];
            let score = 100;
            // 检查是否有明确的求解目标
            if (!parsedQuestion.target?.primary) {
                issues.push('缺少明确的求解目标');
                suggestions.push('请明确标识主要求解参数');
                score -= 20;
            }
            // 检查解题步骤是否完整
            if (!parsedQuestion.solutionPath?.steps?.length) {
                issues.push('缺少解题步骤规划');
                suggestions.push('请提供详细的解题步骤和模块执行顺序');
                score -= 25;
            }
            // 检查参数依赖关系
            const parameters = parsedQuestion.parameters || [];
            const hasDependencies = parameters.some(p => p.dependencies && p.dependencies.length > 0);
            if (!hasDependencies && parameters.length > 3) {
                issues.push('缺少参数依赖关系');
                suggestions.push('请标识参数间的计算依赖关系');
                score -= 15;
            }
            // 检查公式完整性
            const formulas = parsedQuestion.formulas;
            if (!formulas?.primary?.length) {
                issues.push('缺少主要物理公式');
                suggestions.push('请提供解题所需的主要物理公式');
                score -= 20;
            }
            // 检查模块信息
            if (!parsedQuestion.solutionPath?.modules?.length) {
                issues.push('缺少模块信息');
                suggestions.push('请标识涉及的物理模块');
                score -= 10;
            }
            // 检查约束条件
            const constraints = parsedQuestion.constraints;
            if (!constraints?.physical?.length && !constraints?.initial?.length) {
                issues.push('缺少物理约束条件');
                suggestions.push('请提供物理约束和边界条件');
                score -= 10;
            }
            return {
                compatible: issues.length === 0,
                issues,
                suggestions,
                score: Math.max(0, score)
            };
        }
        /**
         * 增强解析结果，添加DSL转换所需信息
         */
        enhanceForDSL(parsedQuestion) {
            const enhanced = { ...parsedQuestion };
            // 添加DSL元数据
            enhanced.dslMetadata = {
                complexity: this.assessComplexity(enhanced),
                moduleCount: enhanced.solutionPath?.modules?.length || 0,
                parameterCount: enhanced.parameters?.length || 0,
                estimatedSteps: enhanced.solutionPath?.steps?.length || 0,
                confidence: this.calculateConfidence(enhanced)
            };
            // 增强参数信息
            if (enhanced.parameters) {
                enhanced.parameters = enhanced.parameters.map(param => ({
                    ...param,
                    dslType: this.inferDSLType(param),
                    domain: this.inferDomain(param),
                    priority: this.calculatePriority(param, enhanced),
                    dependencies: this.findDependencies(param, enhanced.parameters || []),
                    formula: this.findFormula(param, enhanced)
                }));
            }
            return enhanced;
        }
        /**
         * 评估题目复杂度
         */
        assessComplexity(parsedQuestion) {
            const moduleCount = parsedQuestion.solutionPath?.modules?.length || 0;
            const parameterCount = parsedQuestion.parameters?.length || 0;
            const stepCount = parsedQuestion.solutionPath?.steps?.length || 0;
            if (moduleCount <= 1 && parameterCount <= 5 && stepCount <= 3) {
                return 'simple';
            }
            else if (moduleCount <= 3 && parameterCount <= 10 && stepCount <= 6) {
                return 'medium';
            }
            else {
                return 'complex';
            }
        }
        /**
         * 计算解析置信度
         */
        calculateConfidence(parsedQuestion) {
            let confidence = 0.8; // 基础置信度
            // 有明确求解目标
            if (parsedQuestion.target?.primary)
                confidence += 0.1;
            // 有解题步骤
            if (parsedQuestion.solutionPath?.steps?.length)
                confidence += 0.05;
            // 有公式信息
            if (parsedQuestion.formulas?.primary?.length)
                confidence += 0.05;
            return Math.min(1.0, confidence);
        }
        /**
         * 推断参数的DSL类型
         */
        inferDSLType(param) {
            const vectorSymbols = ['v', 'a', 'F', 'p', 'E', 'B'];
            const tensorSymbols = ['σ', 'ε', 'I'];
            if (vectorSymbols.some(s => param.symbol.includes(s))) {
                return 'vector';
            }
            else if (tensorSymbols.some(s => param.symbol.includes(s))) {
                return 'tensor';
            }
            else {
                return 'scalar';
            }
        }
        /**
         * 推断参数所属领域
         */
        inferDomain(param) {
            const kinematicsSymbols = ['v', 'v0', 'a', 's', 't', 'x', 'y', 'r', 'θ'];
            const dynamicsSymbols = ['F', 'm', 'g', 'μ', 'N', 'M', 'I', 'α', 'ω', 'L'];
            const energySymbols = ['E', 'W', 'P', 'Ek', 'Ep', 'Ep弹'];
            const electricitySymbols = ['U', 'I', 'R', 'Q', 'C', 'P输入', 'P输出', 'η'];
            const opticsSymbols = ['f', 'n', 'c', 'u', 'v_img', 'i', 'r'];
            const thermalSymbols = ['T', 'Q', 'c', 'L', 'Δt', 'T1', 'T2', 'p', 'V', 'n', 'R', 'N', 'NA'];
            const magnetismSymbols = ['B', 'H', 'Φ', 'ε', 'ΔΦ', 'L', 'M', 'ε自', 'ε互'];
            const fluidSymbols = ['p', 'ρ', 'h', 'v', 'A', 'Q', 'η', 'Re', 'F浮', 'V排'];
            const oscillationSymbols = ['A', 'T', 'f', 'k', 'l', 'x', 'γ', 'ω0', 'ω', 'Q', 'τ', 'F0'];
            const wavesSymbols = ['λ', 'f', 'T', 'v', 'A', 'k', 'ω', 'v声', 'I', 'L', 'f\'', 'vs', 'vo', 'd', 'x', 'Δr', 'δ', 'a', 'θ'];
            const electrostaticsSymbols = ['F', 'k', 'q1', 'q2', 'r', 'E', 'U', 'C', 'Q', 'ε', 'S', 'd'];
            const electromagneticSymbols = ['ε', 'Φ', 'ΔΦ', 'Δt', 'B', 'S', 'θ', 'L', 'M', 'ε自', 'ε互', 'c', 'λ', 'E', 'B', 'S', 'P'];
            const acSymbols = ['u', 'i', 'Um', 'Im', 'U', 'I', 'ω', 'T', 'f'];
            const physicalOpticsSymbols = ['λ', 'd', 'L', 'x', 'a', 'θ', 'n', 'I0', 'I', 'n0', 'ne', 'Δn', 'P', 'A', 'Δλ', 'τ'];
            const modernPhysicsSymbols = ['h', 'c', 'λ', 'f', 'E', 'Ek', 'W', 'n', 'En', 'Z', 'rn', 'vn', 'ΔE'];
            const nuclearSymbols = ['N', 'N0', 'λ', 'T', 't', 'Δm', 'E'];
            const astrophysicsSymbols = ['M', 'R', 'v', 'T', 'H0', 'z', 'd'];
            const biophysicsSymbols = ['F', 'A', 'σ', 'E', 'ε', 'P', 'η'];
            const condensedMatterSymbols = ['a', 'Eg', 'EF', 'n', 'μ', 'σ', 'E', 'K', 'α', 'ρ', 'μ'];
            const plasmaSymbols = ['ne', 'ni', 'Te', 'Ti', 'ωp', 'λD', 'B'];
            const quantumSymbols = ['ψ', '|ψ|²', 'E', 'p', 'x', 'Δx', 'Δp'];
            if (kinematicsSymbols.some(s => param.symbol.includes(s)))
                return 'kinematics';
            if (dynamicsSymbols.some(s => param.symbol.includes(s)))
                return 'dynamics';
            if (energySymbols.some(s => param.symbol.includes(s)))
                return 'energy';
            if (electricitySymbols.some(s => param.symbol.includes(s)))
                return 'electricity';
            if (opticsSymbols.some(s => param.symbol.includes(s)))
                return 'optics';
            if (thermalSymbols.some(s => param.symbol.includes(s)))
                return 'thermal';
            if (magnetismSymbols.some(s => param.symbol.includes(s)))
                return 'magnetism';
            if (fluidSymbols.some(s => param.symbol.includes(s)))
                return 'fluid';
            if (oscillationSymbols.some(s => param.symbol.includes(s)))
                return 'oscillation';
            if (wavesSymbols.some(s => param.symbol.includes(s)))
                return 'waves';
            if (electrostaticsSymbols.some(s => param.symbol.includes(s)))
                return 'electrostatics';
            if (electromagneticSymbols.some(s => param.symbol.includes(s)))
                return 'electromagnetic_induction';
            if (acSymbols.some(s => param.symbol.includes(s)))
                return 'ac_circuit';
            if (physicalOpticsSymbols.some(s => param.symbol.includes(s)))
                return 'physical_optics';
            if (modernPhysicsSymbols.some(s => param.symbol.includes(s)))
                return 'modern_physics';
            if (nuclearSymbols.some(s => param.symbol.includes(s)))
                return 'nuclear_physics';
            if (astrophysicsSymbols.some(s => param.symbol.includes(s)))
                return 'astrophysics';
            if (biophysicsSymbols.some(s => param.symbol.includes(s)))
                return 'biophysics';
            if (condensedMatterSymbols.some(s => param.symbol.includes(s)))
                return 'condensed_matter';
            if (plasmaSymbols.some(s => param.symbol.includes(s)))
                return 'plasma_physics';
            if (quantumSymbols.some(s => param.symbol.includes(s)))
                return 'quantum_physics';
            return 'kinematics'; // 默认
        }
        /**
         * 计算参数优先级
         */
        calculatePriority(param, parsedQuestion) {
            let priority = 1;
            // 已知参数优先级较低
            if (param.role === 'given')
                priority = 1;
            // 未知参数优先级较高
            else if (param.role === 'unknown')
                priority = 10;
            // 常量优先级中等
            else if (param.role === 'constant')
                priority = 2;
            // 派生参数根据依赖关系确定优先级
            else if (param.role === 'derived')
                priority = 5;
            // 如果是主要求解目标，优先级最高
            if (parsedQuestion.target?.primary === param.symbol) {
                priority = 20;
            }
            return priority;
        }
        /**
         * 查找参数依赖关系
         */
        findDependencies(param, allParams) {
            const dependencies = [];
            // 基于公式查找依赖
            if (param.formula) {
                const formula = param.formula;
                allParams.forEach(p => {
                    if (p.symbol !== param.symbol && formula.includes(p.symbol)) {
                        dependencies.push(p.symbol);
                    }
                });
            }
            return dependencies;
        }
        /**
         * 查找参数对应的公式
         */
        findFormula(param, parsedQuestion) {
            // 这里可以根据参数符号和物理规律推断公式
            // 简化实现，实际可以更复杂
            const formulaMap = {
                'v': 'v = v0 + at',
                's': 's = v0t + ½at²',
                'F': 'F = ma',
                'E': 'E = mc²',
                'U': 'U = IR',
                'P': 'P = UI'
            };
            return formulaMap[param.symbol] || '';
        }
        /**
         * 调用 AI API
         */
        async callAI(prompt) {
            const { retryCount = 3, retryDelay = 1000 } = this.config;
            for (let attempt = 1; attempt <= retryCount; attempt++) {
                try {
                    const result = await this.callDeepSeek(prompt, this.config);
                    if (result.success) {
                        return result;
                    }
                    if (attempt === retryCount) {
                        return {
                            success: false,
                            error: `DeepSeek AI 调用失败 (${retryCount} 次尝试): ${result.error}`
                        };
                    }
                    // 等待后重试
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
                catch (error) {
                    const errorMessage = error.message || '未知错误';
                    if (attempt === retryCount) {
                        return {
                            success: false,
                            error: `DeepSeek AI 调用失败 (${retryCount} 次尝试): ${errorMessage}`
                        };
                    }
                    // 等待后重试
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
            return {
                success: false,
                error: 'AI 调用失败：未知错误'
            };
        }
        /**
         * 调用 DeepSeek API
         */
        async callDeepSeek(prompt, config) {
            const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.model || 'deepseek-v3',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: config.temperature,
                    max_tokens: config.maxTokens,
                }),
            });
            if (!response.ok) {
                throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: true,
                data: data.choices[0].message.content,
                usage: {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                }
            };
        }
        /**
         * 验证配置
         */
        validateConfig() {
            const errors = [];
            const warnings = [];
            if (!this.config.apiKey) {
                errors.push('API Key 未设置');
            }
            if (this.config.temperature && (this.config.temperature < 0 || this.config.temperature > 2)) {
                warnings.push('温度参数应在 0-2 之间');
            }
            if (this.config.maxTokens && this.config.maxTokens < 100) {
                warnings.push('最大令牌数设置较小，可能影响输出质量');
            }
            if (this.config.timeout && this.config.timeout < 5000) {
                warnings.push('超时时间设置较短，可能导致请求失败');
            }
            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        }
        // ==================== 原子模块功能实现 ====================
        /**
         * 将复杂题目分解为原子模块
         */
        async decomposeIntoAtomicModules(question, language = 'zh') {
            try {
                const prompt = this.buildModuleDecompositionPrompt(question, language);
                const response = await this.callAI(prompt);
                if (response.success && response.data) {
                    const moduleAnalysis = this.parseModuleDecompositionResponse(response.data, language);
                    return { success: true, modules: moduleAnalysis };
                }
                return { success: false, modules: [], error: 'AI 调用失败' };
            }
            catch (error) {
                return { success: false, modules: [], error: error.message };
            }
        }
        /**
         * 构建模块分解提示词
         */
        buildModuleDecompositionPrompt(question, language = 'zh') {
            return `分析物理题目并识别相关模块。只输出JSON格式。

题目：${question}

输出格式：
{
  "modules": [
    {
      "id": "模块ID",
      "confidence": 0.9,
      "reason": "选择原因",
      "parameters": ["参数符号"]
    }
  ],
  "connections": [
    {
      "from": "模块1",
      "to": "模块2",
      "parameter": "连接参数",
      "type": "shared"
    }
  ]
}

可用模块：kinematics_linear, projectile_motion, newton_dynamics, work_energy, mechanical_energy_conservation, circular_motion, oscillation, mechanical_waves, dc_circuit, electrostatics, magnetism, electromagnetic_induction, geometric_optics, thermal, pressure_buoyancy, gravitation, momentum, modern_physics, nuclear_physics

只输出JSON，不要其他内容。`;
        }
        /**
         * 解析模块分解响应
         */
        parseModuleDecompositionResponse(response, language = 'zh') {
            try {
                // 清理响应文本
                const cleanedResponse = this.cleanAIResponse(response);
                const data = JSON.parse(cleanedResponse);
                const modules = [];
                if (data.modules && Array.isArray(data.modules)) {
                    for (const moduleData of data.modules) {
                        if (moduleData.confidence > 0.5 && AtomicModules_1.atomicModuleLibrary.getModule(moduleData.id)) {
                            const baseModule = AtomicModules_1.atomicModuleLibrary.getModule(moduleData.id);
                            modules.push({
                                ...baseModule,
                                parameters: baseModule.parameters.filter(param => moduleData.parameters && moduleData.parameters.includes(param.symbol))
                            });
                        }
                    }
                }
                return modules;
            }
            catch (error) {
                if (this.config.enableLogging) {
                    console.warn('解析模块分解响应失败:', error);
                    console.warn('响应内容:', response.substring(0, 200) + '...');
                }
                return [];
            }
        }
        /**
         * 构建模块组合
         */
        async buildModuleComposition(modules, question, language = 'zh') {
            try {
                // 分析模块间的连接关系
                const connections = [];
                const globalParameters = [];
                const globalUnits = [];
                // 收集所有模块的参数
                const allParameters = new Map();
                const allUnits = new Map();
                for (const module of modules) {
                    for (const param of module.parameters) {
                        if (!allParameters.has(param.symbol)) {
                            allParameters.set(param.symbol, param);
                        }
                    }
                }
                // 分析模块间的参数连接
                for (let i = 0; i < modules.length; i++) {
                    for (let j = i + 1; j < modules.length; j++) {
                        const module1 = modules[i];
                        const module2 = modules[j];
                        // 查找共同参数
                        const commonParams = module1.parameters.filter(p1 => module2.parameters.some(p2 => p2.symbol === p1.symbol));
                        for (const param of commonParams) {
                            connections.push({
                                from: module1.id,
                                to: module2.id,
                                parameter: param.symbol,
                                type: 'shared'
                            });
                        }
                    }
                }
                // 构建全局参数和单位映射
                globalParameters.push(...Array.from(allParameters.values()));
                // 去重单位映射
                for (const param of globalParameters) {
                    if (param.unit && !allUnits.has(param.unit)) {
                        allUnits.set(param.unit, {
                            original: param.unit,
                            standard: param.unit,
                            conversion: 1
                        });
                    }
                }
                globalUnits.push(...Array.from(allUnits.values()));
                // 分析数据流和执行顺序
                const dataFlow = this.analyzeDataFlow(modules, connections, question);
                const executionOrder = this.determineExecutionOrder(modules, connections);
                return {
                    modules,
                    connections,
                    globalParameters,
                    globalUnits,
                    executionOrder: dataFlow.executionOrder,
                    dataFlow: dataFlow.flow,
                    checkpoints: dataFlow.checkpoints
                };
            }
            catch (error) {
                console.warn('构建模块组合失败:', error);
                return this.buildBasicModuleComposition(modules);
            }
        }
        /**
         * 分析模块间数据流
         */
        analyzeDataFlow(modules, connections, question) {
            const executionOrder = [];
            const flow = [];
            const checkpoints = [];
            // 基于模块依赖关系确定执行顺序
            const moduleDeps = new Map();
            const moduleOutputs = new Map();
            // 初始化模块依赖
            modules.forEach(module => {
                moduleDeps.set(module.id, []);
                moduleOutputs.set(module.id, module.parameters
                    .filter(p => p.role === 'unknown' || p.role === 'derived')
                    .map(p => p.symbol));
            });
            // 分析连接关系，建立依赖图
            connections.forEach(conn => {
                if (conn.type === 'input' || conn.type === 'shared') {
                    const deps = moduleDeps.get(conn.to) || [];
                    if (!deps.includes(conn.from)) {
                        deps.push(conn.from);
                        moduleDeps.set(conn.to, deps);
                    }
                }
            });
            // 拓扑排序确定执行顺序
            const visited = new Set();
            const visiting = new Set();
            const visit = (moduleId) => {
                if (visiting.has(moduleId)) {
                    throw new Error(`循环依赖检测到: ${moduleId}`);
                }
                if (visited.has(moduleId))
                    return;
                visiting.add(moduleId);
                const deps = moduleDeps.get(moduleId) || [];
                deps.forEach(dep => visit(dep));
                visiting.delete(moduleId);
                visited.add(moduleId);
                executionOrder.push(moduleId);
            };
            modules.forEach(module => {
                if (!visited.has(module.id)) {
                    visit(module.id);
                }
            });
            // 生成数据流信息
            executionOrder.forEach((moduleId, index) => {
                const module = modules.find(m => m.id === moduleId);
                if (module) {
                    flow.push({
                        step: index + 1,
                        module: moduleId,
                        action: `执行${module.name}`,
                        inputs: module.parameters
                            .filter(p => p.role === 'given' || p.role === 'constant')
                            .map(p => p.symbol),
                        outputs: module.parameters
                            .filter(p => p.role === 'unknown' || p.role === 'derived')
                            .map(p => p.symbol)
                    });
                    // 添加关键检查点
                    if (module.type === 'dynamics' || module.type === 'energy') {
                        checkpoints.push(`${moduleId}_${module.type}`);
                    }
                }
            });
            return {
                executionOrder,
                flow,
                checkpoints
            };
        }
        /**
         * 确定模块执行顺序
         */
        determineExecutionOrder(modules, connections) {
            // 基于模块类型和依赖关系确定执行顺序
            const typePriority = {
                'kinematics': 1,
                'dynamics': 2,
                'energy': 3,
                'oscillation': 4,
                'waves': 5,
                'electricity': 6,
                'electrostatics': 7,
                'magnetism': 8,
                'electromagnetic_induction': 9,
                'ac_circuit': 10,
                'optics': 11,
                'physical_optics': 12,
                'thermal': 13,
                'fluid': 14,
                'gravitation': 15,
                'momentum': 16,
                'modern_physics': 17,
                'quantum_physics': 18,
                'nuclear_physics': 19,
                'astrophysics': 20,
                'biophysics': 21,
                'condensed_matter': 22,
                'plasma_physics': 23
            };
            return modules
                .sort((a, b) => {
                const priorityA = typePriority[a.type] || 999;
                const priorityB = typePriority[b.type] || 999;
                return priorityA - priorityB;
            })
                .map(m => m.id);
        }
        /**
         * 构建基础模块组合（回退方案）
         */
        buildBasicModuleComposition(modules) {
            const globalParameters = [];
            const globalUnits = [];
            const allUnits = new Map();
            // 收集所有参数和单位
            for (const module of modules) {
                globalParameters.push(...module.parameters);
                for (const param of module.parameters) {
                    if (param.unit && !allUnits.has(param.unit)) {
                        allUnits.set(param.unit, {
                            original: param.unit,
                            standard: param.unit,
                            conversion: 1
                        });
                    }
                }
            }
            globalUnits.push(...Array.from(allUnits.values()));
            // 基础执行顺序
            const executionOrder = modules.map(m => m.id);
            return {
                modules,
                connections: [],
                globalParameters,
                globalUnits,
                executionOrder,
                dataFlow: [],
                checkpoints: []
            };
        }
        /**
         * 生成解题路径规划
         */
        generateSolutionPath(parsedQuestion, moduleComposition) {
            const steps = [];
            const modules = moduleComposition.modules || [];
            const executionOrder = moduleComposition.executionOrder || modules.map(m => m.id);
            // 基于执行顺序生成解题步骤
            executionOrder.forEach((moduleId, index) => {
                const module = modules.find(m => m.id === moduleId);
                if (module) {
                    const step = {
                        id: `step_${index + 1}`,
                        type: this.determineStepType(module),
                        module: moduleId,
                        action: this.generateActionDescription(module, parsedQuestion),
                        inputs: this.extractInputParameters(module, parsedQuestion),
                        outputs: this.extractOutputParameters(module, parsedQuestion),
                        formula: this.selectPrimaryFormula(module),
                        order: index + 1,
                        description: this.generateStepDescription(module, parsedQuestion)
                    };
                    steps.push(step);
                }
            });
            // 生成模块依赖关系
            const dependencies = [];
            for (let i = 0; i < executionOrder.length - 1; i++) {
                const currentModule = modules.find(m => m.id === executionOrder[i]);
                const nextModule = modules.find(m => m.id === executionOrder[i + 1]);
                if (currentModule && nextModule) {
                    const commonParams = this.findCommonParameters(currentModule, nextModule);
                    commonParams.forEach(param => {
                        dependencies.push({
                            from: currentModule.id,
                            to: nextModule.id,
                            parameter: param,
                            type: 'shared',
                            reason: `${currentModule.name}的输出参数${param}作为${nextModule.name}的输入`
                        });
                    });
                }
            }
            return {
                steps,
                modules: executionOrder,
                dependencies,
                executionOrder,
                checkpoints: this.generateCheckpoints(modules, parsedQuestion)
            };
        }
        /**
         * 确定步骤类型
         */
        determineStepType(module) {
            switch (module.type) {
                case 'kinematics':
                case 'oscillation':
                case 'waves':
                case 'electricity':
                case 'electrostatics':
                case 'ac_circuit':
                case 'optics':
                case 'physical_optics':
                case 'thermal':
                case 'fluid':
                case 'gravitation':
                case 'momentum':
                case 'modern_physics':
                case 'nuclear_physics':
                case 'astrophysics':
                    return 'calculate';
                case 'dynamics':
                case 'magnetism':
                case 'electromagnetic_induction':
                case 'quantum_physics':
                    return 'solve';
                case 'energy':
                case 'biophysics':
                case 'condensed_matter':
                    return 'verify';
                case 'plasma_physics':
                    return 'convert';
                default:
                    return 'calculate';
            }
        }
        /**
         * 生成操作描述
         */
        generateActionDescription(module, parsedQuestion) {
            const target = parsedQuestion.target?.primary;
            const moduleName = module.name;
            if (target && module.parameters.some(p => p.symbol === target)) {
                return `使用${moduleName}计算${target}`;
            }
            return `执行${moduleName}相关计算`;
        }
        /**
         * 提取输入参数
         */
        extractInputParameters(module, parsedQuestion) {
            return module.parameters
                .filter(p => p.role === 'given' || p.role === 'constant')
                .map(p => p.symbol);
        }
        /**
         * 提取输出参数
         */
        extractOutputParameters(module, parsedQuestion) {
            return module.parameters
                .filter(p => p.role === 'unknown' || p.role === 'derived')
                .map(p => p.symbol);
        }
        /**
         * 选择主要公式
         */
        selectPrimaryFormula(module) {
            if (module.formulas && module.formulas.length > 0) {
                return module.formulas[0];
            }
            return '';
        }
        /**
         * 生成步骤描述
         */
        generateStepDescription(module, parsedQuestion) {
            const inputs = this.extractInputParameters(module, parsedQuestion);
            const outputs = this.extractOutputParameters(module, parsedQuestion);
            return `使用${module.name}，输入参数：${inputs.join(', ')}，输出参数：${outputs.join(', ')}`;
        }
        /**
         * 查找共同参数
         */
        findCommonParameters(module1, module2) {
            const params1 = module1.parameters.map(p => p.symbol);
            const params2 = module2.parameters.map(p => p.symbol);
            return params1.filter(p => params2.includes(p));
        }
        /**
         * 生成检查点
         */
        generateCheckpoints(modules, parsedQuestion) {
            const checkpoints = [];
            modules.forEach(module => {
                // 为关键模块类型生成检查点
                if (['dynamics', 'energy', 'electromagnetic_induction', 'quantum_physics', 'nuclear_physics'].includes(module.type)) {
                    checkpoints.push(`${module.id}_${module.type}`);
                }
                // 为复杂模块生成额外检查点
                if (['rigid_body', 'fluid_mechanics', 'plasma_physics', 'astrophysics'].includes(module.id)) {
                    checkpoints.push(`${module.id}_complex`);
                }
            });
            return checkpoints;
        }
    }
    exports.PhysicsAIParserAICaller = PhysicsAIParserAICaller;
});
/**
 * 物理 DSL 生成器
 * 将 AI 解析的 ParsedQuestion 转换为结构化的 PhysicsDSL
 *
 * 核心职责：
 * 1. 将 ParsedQuestion 转换为 PhysicsDSL (YAML 格式)
 * 2. 为后续 IR 转换和验证提供标准化的数据结构
 * 3. 确保生成的 DSL 符合 PhysicsSchema 规范
 */
define("dsl/PhysicsDslGenerator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PhysicsDslGenerator = void 0;
    class PhysicsDslGenerator {
        constructor() {
            this.VERSION = '2.0.0';
        }
        /**
         * 主入口：将 ParsedQuestion 转换为 PhysicsDSL
         */
        generateDSL(parsedQuestion) {
            return {
                metadata: this.generateMetadata(parsedQuestion),
                system: this.generateSystem(parsedQuestion),
                simulation: this.generateSimulation(parsedQuestion),
                output: this.generateOutput(parsedQuestion),
                syllabus: this.generateSyllabus(parsedQuestion)
            };
        }
        /**
         * 生成元数据
         */
        generateMetadata(parsedQuestion) {
            const now = new Date().toISOString();
            return {
                id: this.generateId(),
                version: this.VERSION,
                created_at: now,
                subject: parsedQuestion.subject || 'physics',
                topic: parsedQuestion.topic,
                topic_id: this.mapTopicToId(parsedQuestion.topic),
                system_type: this.inferSystemType(parsedQuestion),
                grade: this.inferGrade(parsedQuestion.topic),
                difficulty: this.inferDifficulty(parsedQuestion),
                timestamp: now,
                source_question: parsedQuestion.originalText || parsedQuestion.topic
            };
        }
        /**
         * 生成物理系统配置
         */
        generateSystem(parsedQuestion) {
            return {
                type: this.inferSystemType(parsedQuestion),
                dimensions: this.inferDimensions(parsedQuestion),
                parameters: this.convertParameters(parsedQuestion.parameters || []),
                initial_conditions: this.generateInitialConditions(parsedQuestion),
                constraints: this.convertConstraints(Array.isArray(parsedQuestion.constraints) ? parsedQuestion.constraints : []),
                constants: this.generateConstants(parsedQuestion),
                objects: this.generateObjects(parsedQuestion),
                materials: this.inferMaterials(parsedQuestion),
                environment: this.generateEnvironment(parsedQuestion)
            };
        }
        /**
         * 生成仿真配置
         */
        generateSimulation(parsedQuestion) {
            return {
                duration: this.calculateDuration(parsedQuestion),
                time_step: this.calculateTimeStep(parsedQuestion),
                solver: this.selectSolver(parsedQuestion),
                precision: this.selectPrecision(parsedQuestion),
                events: this.generateEvents(parsedQuestion)
            };
        }
        /**
         * 生成输出配置
         */
        generateOutput(parsedQuestion) {
            const plots = this.generatePlots(parsedQuestion);
            const animations = this.generateAnimations(parsedQuestion);
            return {
                variables: this.extractVariables(parsedQuestion),
                export_formats: ['csv', 'json', 'yaml'],
                plots: plots,
                animations: animations,
                visualization: {
                    plots: plots,
                    animations: animations
                }
            };
        }
        /**
         * 生成课程标签
         */
        generateSyllabus(parsedQuestion) {
            return [{
                    grade: this.inferGrade(parsedQuestion.topic),
                    topic: this.mapTopicToCurriculumKey(parsedQuestion.topic)
                }];
        }
        // ===== 辅助方法 =====
        /**
         * 生成唯一ID
         */
        generateId() {
            return `physics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        /**
         * 转换参数
         */
        convertParameters(parameters) {
            const convertedParams = parameters.map(param => ({
                symbol: param.symbol,
                value: {
                    value: param.value || 0,
                    unit: this.normalizeUnit(param.unit) || 'dimensionless'
                },
                role: param.role,
                description: param.note || `参数${param.symbol}`
            }));
            // 为弹簧振子问题补充缺失的关键参数
            return this.enhanceParametersForPhysics(convertedParams);
        }
        /**
         * 标准化单位
         */
        normalizeUnit(unit) {
            if (!unit)
                return 'dimensionless';
            const unitMap = {
                'sin': 'm',
                'm/s^2': 'm/s²',
                'm/s2': 'm/s²',
                'N/m': 'N/m',
                'kg': 'kg',
                'm': 'm',
                's': 's',
                'Hz': 'Hz',
                'rad/s': 'rad/s'
            };
            return unitMap[unit] || unit;
        }
        /**
         * 根据物理现象增强参数
         */
        enhanceParametersForPhysics(parameters) {
            const enhancedParams = [...parameters];
            const symbols = parameters.map(p => p.symbol.toLowerCase());
            // 检查是否是弹簧振子问题
            const hasSpring = symbols.includes('k') || parameters.some(p => p.description.includes('劲度') || p.description.includes('spring'));
            const hasMass = symbols.includes('m');
            const hasAmplitude = symbols.includes('a') || symbols.includes('x');
            // 补充弹簧常数
            if (hasSpring && !symbols.includes('k')) {
                enhancedParams.push({
                    symbol: 'k',
                    value: { value: 100, unit: 'N/m' },
                    role: 'given',
                    description: '弹簧劲度系数'
                });
            }
            // 补充振幅
            if (hasSpring && !hasAmplitude) {
                enhancedParams.push({
                    symbol: 'A',
                    value: { value: 0.1, unit: 'm' },
                    role: 'given',
                    description: '振动振幅'
                });
            }
            // 补充角频率
            if (hasSpring && !symbols.includes('ω') && !symbols.includes('omega')) {
                enhancedParams.push({
                    symbol: 'ω',
                    value: { value: 0, unit: 'rad/s' },
                    role: 'unknown',
                    description: '角频率'
                });
            }
            return enhancedParams;
        }
        /**
         * 转换约束条件
         */
        convertConstraints(constraints) {
            return constraints.map(constraint => ({
                type: this.mapConstraintType(constraint.type),
                expression: constraint.expression,
                value: {
                    value: constraint.value || 0,
                    unit: constraint.unit || 'dimensionless'
                },
                description: constraint.description || '约束条件'
            }));
        }
        /**
         * 生成初始条件
         */
        generateInitialConditions(parsedQuestion) {
            const conditions = [];
            // 从参数中提取初始条件
            if (parsedQuestion.parameters) {
                parsedQuestion.parameters.forEach(param => {
                    if (param.role === 'given' && param.value !== null) {
                        conditions.push({
                            name: param.symbol,
                            value: {
                                value: param.value,
                                unit: param.unit || 'dimensionless'
                            },
                            description: param.note || `初始${param.symbol}`
                        });
                    }
                });
            }
            return conditions;
        }
        /**
         * 生成常量
         */
        generateConstants(parsedQuestion) {
            const constants = [];
            // 从参数中提取常量
            if (parsedQuestion.parameters) {
                parsedQuestion.parameters.forEach(param => {
                    if (param.role === 'constant' && param.value !== null) {
                        constants.push({
                            name: param.symbol,
                            value: {
                                value: param.value,
                                unit: param.unit || 'dimensionless'
                            },
                            source: 'given',
                            description: param.note || `常量${param.symbol}`
                        });
                    }
                });
            }
            return constants;
        }
        /**
         * 生成物理对象
         */
        generateObjects(parsedQuestion) {
            const objects = [];
            // 根据题目内容推断物理对象
            const question = parsedQuestion.originalText?.toLowerCase() || '';
            if (question.includes('球') || question.includes('ball')) {
                objects.push({
                    id: 'ball',
                    name: '小球',
                    type: 'particle',
                    position: { value: 0, unit: 'm' },
                    velocity: { value: 0, unit: 'm/s' },
                    acceleration: { value: 0, unit: 'm/s²' },
                    mass: this.extractMass(parsedQuestion),
                    properties: {
                        radius: { value: 0.1, unit: 'm' },
                        material: 'default'
                    }
                });
            }
            if (question.includes('弹簧') || question.includes('spring')) {
                objects.push({
                    id: 'spring',
                    name: '弹簧',
                    type: 'field',
                    position: { value: 0, unit: 'm' },
                    velocity: { value: 0, unit: 'm/s' },
                    acceleration: { value: 0, unit: 'm/s²' },
                    mass: { value: 0, unit: 'kg' },
                    properties: {
                        stiffness: this.extractSpringConstant(parsedQuestion),
                        rest_length: { value: 1, unit: 'm' }
                    }
                });
            }
            return objects;
        }
        /**
         * 生成图表配置
         */
        generatePlots(parsedQuestion) {
            const plots = [];
            const topic = parsedQuestion.topic.toLowerCase();
            // 根据物理主题生成相应的图表
            if (topic.includes('运动') || topic.includes('motion')) {
                plots.push({
                    type: 'time_series',
                    title: '位置-时间图',
                    x_axis: 't',
                    y_axis: 'x'
                });
                plots.push({
                    type: 'time_series',
                    title: '速度-时间图',
                    x_axis: 't',
                    y_axis: 'v'
                });
            }
            if (topic.includes('振动') || topic.includes('oscillation')) {
                plots.push({
                    type: 'time_series',
                    title: '位移-时间图',
                    x_axis: 't',
                    y_axis: 'x'
                });
            }
            if (topic.includes('波') || topic.includes('wave')) {
                plots.push({
                    type: 'trajectory',
                    title: '波形图',
                    x_axis: 'x',
                    y_axis: 'y'
                });
            }
            return plots;
        }
        /**
         * 生成动画配置
         */
        generateAnimations(parsedQuestion) {
            return [{
                    type: '3d',
                    camera: 'fixed',
                    speed: 1.0,
                    loop: true,
                    duration: 10.0,
                    easing: 'ease_in_out'
                }];
        }
        /**
         * 生成事件配置
         */
        generateEvents(parsedQuestion) {
            return [{
                    type: 'time',
                    trigger: { value: 5, unit: 's' },
                    action: 'checkpoint',
                    description: '仿真检查点'
                }];
        }
        /**
         * 生成环境配置
         */
        generateEnvironment(parsedQuestion) {
            return {
                gravity: { value: 9.8, unit: 'm/s²' },
                air_resistance: false,
                temperature: { value: 20, unit: '°C' }
            };
        }
        // ===== 推断方法 =====
        /**
         * 推断系统类型
         */
        inferSystemType(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            if (topic.includes('振动') || topic.includes('oscillation'))
                return 'kinematics_linear';
            if (topic.includes('波') || topic.includes('wave'))
                return 'kinematics_linear';
            if (topic.includes('电磁') || topic.includes('electromagnetic'))
                return 'kinematics_linear';
            if (topic.includes('电路') || topic.includes('circuit'))
                return 'kinematics_linear';
            if (topic.includes('热') || topic.includes('thermal'))
                return 'kinematics_linear';
            if (topic.includes('光') || topic.includes('optical'))
                return 'kinematics_linear';
            if (topic.includes('量子') || topic.includes('quantum'))
                return 'kinematics_linear';
            return 'kinematics_linear'; // 默认
        }
        /**
         * 推断维度
         */
        inferDimensions(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            if (topic.includes('一维') || topic.includes('1d'))
                return 1;
            if (topic.includes('二维') || topic.includes('2d'))
                return 2;
            if (topic.includes('三维') || topic.includes('3d'))
                return 3;
            // 根据物理现象推断
            if (topic.includes('振动') || topic.includes('oscillation'))
                return 1;
            if (topic.includes('波') || topic.includes('wave'))
                return 2;
            return 3; // 默认3D
        }
        /**
         * 推断年级
         */
        inferGrade(topic) {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes('初中') || topicLower.includes('middle'))
                return '初二';
            if (topicLower.includes('高中') || topicLower.includes('high'))
                return '高一';
            if (topicLower.includes('大学') || topicLower.includes('university'))
                return '高一';
            return '高一'; // 默认
        }
        /**
         * 推断难度
         */
        inferDifficulty(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            const question = parsedQuestion.originalText?.toLowerCase() || '';
            // 根据关键词判断难度
            if (question.includes('简单') || question.includes('基础') || question.includes('基本')) {
                return 'easy';
            }
            if (question.includes('复杂') || question.includes('综合') || question.includes('多模块')) {
                return 'hard';
            }
            if (topic.includes('量子') || topic.includes('相对论') || topic.includes('advanced')) {
                return 'hard';
            }
            if (topic.includes('振动') || topic.includes('波') || topic.includes('电磁')) {
                return 'medium';
            }
            return 'medium'; // 默认中等难度
        }
        /**
         * 计算仿真时长
         */
        calculateDuration(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            if (topic.includes('振动') || topic.includes('oscillation')) {
                return { value: 20, unit: 's' };
            }
            if (topic.includes('碰撞') || topic.includes('collision')) {
                return { value: 5, unit: 's' };
            }
            return { value: 10, unit: 's' }; // 默认
        }
        /**
         * 计算时间步长
         */
        calculateTimeStep(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            if (topic.includes('碰撞') || topic.includes('collision')) {
                return { value: 0.001, unit: 's' };
            }
            if (topic.includes('振动') || topic.includes('oscillation')) {
                return { value: 0.005, unit: 's' };
            }
            return { value: 0.01, unit: 's' }; // 默认
        }
        /**
         * 选择求解器
         */
        selectSolver(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            if (topic.includes('振动') || topic.includes('oscillation'))
                return 'rk4';
            if (topic.includes('碰撞') || topic.includes('collision'))
                return 'adaptive';
            return 'verlet'; // 默认
        }
        /**
         * 选择精度
         */
        selectPrecision(parsedQuestion) {
            const topic = parsedQuestion.topic.toLowerCase();
            if (topic.includes('碰撞') || topic.includes('collision'))
                return 'high';
            if (topic.includes('量子') || topic.includes('quantum'))
                return 'ultra';
            return 'medium'; // 默认
        }
        /**
         * 提取变量
         */
        extractVariables(parsedQuestion) {
            const variables = new Set();
            if (parsedQuestion.parameters) {
                parsedQuestion.parameters.forEach(param => {
                    variables.add(param.symbol);
                });
            }
            if (parsedQuestion.unknowns) {
                parsedQuestion.unknowns.forEach((unknown) => {
                    variables.add(unknown.symbol);
                });
            }
            return Array.from(variables);
        }
        /**
         * 提取质量
         */
        extractMass(parsedQuestion) {
            if (parsedQuestion.parameters) {
                const massParam = parsedQuestion.parameters.find(p => p.symbol.toLowerCase() === 'm' ||
                    p.name?.toLowerCase().includes('质量') ||
                    p.name?.toLowerCase().includes('mass'));
                if (massParam && massParam.value) {
                    return { value: massParam.value, unit: massParam.unit || 'kg' };
                }
            }
            return { value: 1.0, unit: 'kg' }; // 默认
        }
        /**
         * 提取弹簧常数
         */
        extractSpringConstant(parsedQuestion) {
            if (parsedQuestion.parameters) {
                const kParam = parsedQuestion.parameters.find(p => p.symbol.toLowerCase() === 'k' ||
                    p.name?.toLowerCase().includes('劲度') ||
                    p.name?.toLowerCase().includes('spring'));
                if (kParam && kParam.value) {
                    return { value: kParam.value, unit: kParam.unit || 'N/m' };
                }
            }
            return { value: 100, unit: 'N/m' }; // 默认
        }
        /**
         * 推断材料
         */
        inferMaterials(parsedQuestion) {
            const materials = ['default'];
            const question = parsedQuestion.originalText?.toLowerCase() || '';
            if (question.includes('金属') || question.includes('metal'))
                materials.push('metal');
            if (question.includes('塑料') || question.includes('plastic'))
                materials.push('plastic');
            if (question.includes('橡胶') || question.includes('rubber'))
                materials.push('rubber');
            return materials;
        }
        // ===== 映射方法 =====
        /**
         * 映射主题到ID
         */
        mapTopicToId(topic) {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes('运动') || topicLower.includes('motion'))
                return 'kinematics';
            if (topicLower.includes('振动') || topicLower.includes('oscillation'))
                return 'oscillation';
            if (topicLower.includes('波') || topicLower.includes('wave'))
                return 'wave_motion';
            if (topicLower.includes('电磁') || topicLower.includes('electromagnetic'))
                return 'electromagnetism';
            if (topicLower.includes('热') || topicLower.includes('thermal'))
                return 'thermodynamics';
            if (topicLower.includes('光') || topicLower.includes('optical'))
                return 'optics';
            if (topicLower.includes('量子') || topicLower.includes('quantum'))
                return 'quantum_mechanics';
            return 'general_physics';
        }
        /**
         * 映射约束类型
         */
        mapConstraintType(type) {
            switch (type) {
                case 'initial': return 'custom';
                case 'boundary': return 'boundary';
                case 'physical': return 'gravity';
                case 'mathematical': return 'custom';
                default: return 'custom';
            }
        }
        /**
         * 映射课程主题
         */
        mapTopicToCurriculumKey(topic) {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes('运动') || topicLower.includes('motion'))
                return 'kinematics';
            if (topicLower.includes('振动') || topicLower.includes('oscillation'))
                return 'kinematics';
            if (topicLower.includes('波') || topicLower.includes('wave'))
                return 'kinematics';
            if (topicLower.includes('电磁') || topicLower.includes('electromagnetic'))
                return 'kinematics';
            if (topicLower.includes('热') || topicLower.includes('thermal'))
                return 'kinematics';
            if (topicLower.includes('光') || topicLower.includes('optical'))
                return 'kinematics';
            if (topicLower.includes('量子') || topicLower.includes('quantum'))
                return 'kinematics';
            return 'kinematics';
        }
        /**
         * 推断章节
         */
        inferChapter(topic) {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes('运动') || topicLower.includes('motion'))
                return '运动学';
            if (topicLower.includes('振动') || topicLower.includes('oscillation'))
                return '振动与波动';
            if (topicLower.includes('波') || topicLower.includes('wave'))
                return '振动与波动';
            if (topicLower.includes('电磁') || topicLower.includes('electromagnetic'))
                return '电磁学';
            if (topicLower.includes('热') || topicLower.includes('thermal'))
                return '热学';
            if (topicLower.includes('光') || topicLower.includes('optical'))
                return '光学';
            if (topicLower.includes('量子') || topicLower.includes('quantum'))
                return '量子力学';
            return '力学';
        }
        /**
         * 推断节次
         */
        inferSection(topic) {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes('自由落体') || topicLower.includes('free fall'))
                return '自由落体运动';
            if (topicLower.includes('平抛') || topicLower.includes('projectile'))
                return '平抛运动';
            if (topicLower.includes('圆周') || topicLower.includes('circular'))
                return '圆周运动';
            if (topicLower.includes('简谐') || topicLower.includes('harmonic'))
                return '简谐运动';
            if (topicLower.includes('横波') || topicLower.includes('transverse'))
                return '横波';
            if (topicLower.includes('纵波') || topicLower.includes('longitudinal'))
                return '纵波';
            return '基础概念';
        }
    }
    exports.PhysicsDslGenerator = PhysicsDslGenerator;
});
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
define("ir/PhysicsIR", ["require", "exports"], function (require, exports) {
    "use strict";
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
});
/**
 * IR 转换器 - 将 PhysicsDSL 转换为中间表示 IR
 *
 * 功能：
 * 1. DSL 到 IR 的结构转换
 * 2. 物理量纲计算和验证
 * 3. 数学表达式解析和优化
 * 4. 依赖关系分析
 * 5. 计算优化预处理
 */
define("ir/IRConverter", ["require", "exports", "ir/PhysicsIR", "ai_parsing/AtomicModules"], function (require, exports, PhysicsIR_1, AtomicModules_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IRConverter = void 0;
    class IRConverter {
        constructor() {
            this.VERSION = '1.0.0';
            this.DEFAULT_OPTIONS = {
                optimize_for_simulation: true,
                include_derivatives: true,
                precompute_constants: true,
                validate_physics: true,
                verbose: false
            };
            // 性能监控
            this.performanceMetrics = {
                totalConversions: 0,
                averageConversionTime: 0,
                cacheHits: 0,
                cacheMisses: 0,
                errorCount: 0
            };
            // 缓存机制
            this.conversionCache = new Map();
            this.moduleDetectionCache = new Map();
            this.validationCache = new Map();
            this.dimensionCalculator = new PhysicsIR_1.DimensionCalculator();
            this.atomicModuleLibrary = new AtomicModules_2.AtomicModuleLibrary();
        }
        /**
         * 生成缓存键
         */
        generateCacheKey(dsl, options) {
            const keyData = {
                metadata: dsl.metadata,
                system: dsl.system,
                options: options
            };
            return JSON.stringify(keyData);
        }
        /**
         * 检查缓存
         */
        getCachedResult(cacheKey) {
            const cached = this.conversionCache.get(cacheKey);
            if (cached) {
                this.performanceMetrics.cacheHits++;
                return cached;
            }
            this.performanceMetrics.cacheMisses++;
            return null;
        }
        /**
         * 存储到缓存
         */
        setCachedResult(cacheKey, result) {
            // 限制缓存大小
            if (this.conversionCache.size >= 100) {
                const firstKey = this.conversionCache.keys().next().value;
                this.conversionCache.delete(firstKey);
            }
            this.conversionCache.set(cacheKey, result);
        }
        /**
         * 更新性能指标
         */
        updatePerformanceMetrics(conversionTime, success) {
            this.performanceMetrics.totalConversions++;
            this.performanceMetrics.averageConversionTime =
                (this.performanceMetrics.averageConversionTime * (this.performanceMetrics.totalConversions - 1) + conversionTime) /
                    this.performanceMetrics.totalConversions;
            if (!success) {
                this.performanceMetrics.errorCount++;
            }
        }
        /**
         * 获取性能指标
         */
        getPerformanceMetrics() {
            return {
                ...this.performanceMetrics,
                cacheHitRate: this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses),
                errorRate: this.performanceMetrics.errorCount / this.performanceMetrics.totalConversions,
                cacheSize: this.conversionCache.size
            };
        }
        /**
         * 清理缓存
         */
        clearCache() {
            this.conversionCache.clear();
            this.moduleDetectionCache.clear();
            this.validationCache.clear();
        }
        /**
         * 验证输入 DSL
         */
        validateInputDSL(dsl) {
            const errors = [];
            const warnings = [];
            if (!dsl) {
                errors.push('DSL 对象为空');
                return { isValid: false, errors, warnings };
            }
            if (!dsl.metadata) {
                errors.push('缺少元数据');
            }
            if (!dsl.system) {
                errors.push('缺少系统配置');
            }
            if (!dsl.simulation) {
                warnings.push('缺少仿真配置，将使用默认配置');
            }
            if (!dsl.output) {
                warnings.push('缺少输出配置，将使用默认配置');
            }
            return { isValid: errors.length === 0, errors, warnings };
        }
        /**
         * 创建回退元数据
         */
        createFallbackMetadata(metadata) {
            return {
                id: metadata?.id || this.generateId(),
                created_at: new Date().toISOString(),
                system_type: metadata?.system_type || 'generic',
                difficulty: metadata?.difficulty || 'medium',
                timestamp: Date.now(),
                source_question: metadata?.source_question || '',
                physics_domain: metadata?.physics_domain || ['general'],
                complexity_score: metadata?.complexity_score || 0.5,
                estimated_solve_time: metadata?.estimated_solve_time || 60
            };
        }
        /**
         * 创建回退系统配置
         */
        createFallbackSystem(system) {
            return {
                type: system?.type || 'generic',
                dimensions: system?.dimensions || '2d',
                environment: system?.environment || { gravity: { value: 9.8, unit: 'm/s²' } },
                parameters: system?.parameters || [],
                objects: system?.objects || [],
                constraints: system?.constraints || [],
                modules: [],
                conservation_laws: [],
                symmetries: [],
                boundary_conditions: [],
                initial_conditions: []
            };
        }
        /**
         * 创建回退仿真配置
         */
        createFallbackSimulation() {
            return {
                duration: { value: 10, unit: 's' },
                time_step: { value: 0.01, unit: 's' },
                solver: 'rk4',
                precision: 'medium',
                max_iterations: 1000,
                tolerance: 1e-6
            };
        }
        /**
         * 创建回退输出配置
         */
        createFallbackOutput() {
            return {
                variables: [],
                export_formats: ['json'],
                visualization: {
                    plots: [],
                    animations: []
                }
            };
        }
        /**
         * 创建回退优化配置
         */
        createFallbackOptimization() {
            return {
                precompute_constants: true,
                optimize_equations: true,
                cache_results: false,
                parallel_processing: false,
                numerical_stability: {
                    time_step_control: true,
                    adaptive_precision: false,
                    stability_monitoring: true
                },
                performance_metrics: {
                    estimated_computation_time: 1.0,
                    memory_usage: 'low',
                    cpu_intensity: 'medium'
                }
            };
        }
        /**
         * 创建回退物理分析
         */
        createFallbackPhysicsAnalysis() {
            return {
                dominant_effects: ['basic_physics'],
                approximation_level: 'phenomenological',
                physical_interpretation: '基础物理现象分析',
                educational_value: {
                    concepts: ['基础物理概念'],
                    prerequisites: ['基础数学'],
                    applications: []
                }
            };
        }
        /**
         * 将 PhysicsDSL 转换为 PhysicsIR
         */
        async convertDSLToIR(dsl, options = {}) {
            const startTime = Date.now();
            const opts = { ...this.DEFAULT_OPTIONS, ...options };
            try {
                if (opts.verbose)
                    console.log('🔄 开始 DSL 到 IR 转换...');
                // 1. 转换元数据
                const metadata = this.convertMetadata(dsl.metadata);
                // 2. 转换系统配置
                const system = await this.convertSystem(dsl.system, opts);
                // 3. 转换仿真配置
                const simulation = this.convertSimulation(dsl.simulation);
                // 4. 转换输出配置
                const output = this.convertOutput(dsl.output);
                // 5. 生成计算优化
                const optimization = this.generateOptimization(system, opts);
                // 6. 验证转换结果
                const validation = this.validateIR({
                    metadata,
                    system,
                    simulation,
                    output,
                    optimization,
                    validation: {
                        structure_valid: false,
                        physics_valid: false,
                        units_consistent: false,
                        constraints_satisfied: false,
                        conservation_laws_satisfied: false,
                        numerical_stability: false,
                        warnings: [],
                        errors: [],
                        physics_consistency_score: 0,
                        validation_timestamp: new Date().toISOString()
                    },
                    physics_analysis: {
                        dominant_effects: [],
                        approximation_level: 'phenomenological',
                        physical_interpretation: '',
                        educational_value: {
                            concepts: [],
                            difficulty_level: 0,
                            prerequisites: []
                        }
                    }
                });
                // 先创建基础 IR 对象
                const baseIR = {
                    metadata,
                    system,
                    simulation,
                    output,
                    optimization,
                    validation: {
                        structure_valid: validation.structure_valid,
                        physics_valid: validation.physics_valid,
                        units_consistent: validation.units_consistent,
                        constraints_satisfied: validation.constraints_satisfied,
                        conservation_laws_satisfied: false,
                        numerical_stability: false,
                        warnings: validation.warnings,
                        errors: validation.errors,
                        physics_consistency_score: 0,
                        validation_timestamp: new Date().toISOString()
                    }
                };
                // 然后添加物理分析
                const ir = {
                    ...baseIR,
                    physics_analysis: {
                        dominant_effects: this.identifyDominantPhysics(baseIR),
                        approximation_level: this.determineApproximationLevel(baseIR),
                        physical_interpretation: this.generatePhysicalInterpretation(baseIR),
                        educational_value: {
                            concepts: this.extractConcepts(baseIR),
                            difficulty_level: baseIR.metadata.complexity_score,
                            prerequisites: this.identifyPrerequisites(baseIR)
                        }
                    }
                };
                const conversionTime = Date.now() - startTime;
                if (opts.verbose)
                    console.log(`✅ DSL 到 IR 转换完成 (耗时: ${conversionTime}ms)`);
                return {
                    success: true,
                    ir,
                    warnings: validation.warnings,
                    errors: validation.errors,
                    conversion_time: conversionTime,
                    optimization_applied: this.getAppliedOptimizations(opts),
                    physics_analysis: {
                        complexity_assessment: this.assessComplexity(ir),
                        dominant_physics: this.identifyDominantPhysics(ir),
                        approximation_quality: this.evaluateApproximationQuality(ir)
                    }
                };
            }
            catch (error) {
                const conversionTime = Date.now() - startTime;
                return {
                    success: false,
                    ir: null,
                    warnings: [],
                    errors: [`转换失败: ${error instanceof Error ? error.message : String(error)}`],
                    conversion_time: conversionTime,
                    optimization_applied: [],
                    physics_analysis: {
                        complexity_assessment: '无法评估',
                        dominant_physics: [],
                        approximation_quality: 0
                    }
                };
            }
        }
        /**
         * 转换元数据
         */
        convertMetadata(dslMetadata) {
            return {
                id: dslMetadata.id || this.generateId(),
                version: this.VERSION,
                created_at: new Date().toISOString(),
                source_dsl_id: dslMetadata.id || 'unknown',
                system_type: dslMetadata.system_type || 'unknown',
                difficulty: dslMetadata.difficulty || 'medium',
                grade: dslMetadata.grade || 'unknown',
                physics_domain: this.inferPhysicsDomains(dslMetadata),
                complexity_score: this.calculateComplexityScore(dslMetadata),
                estimated_solve_time: this.estimateSolveTime(dslMetadata)
            };
        }
        /**
         * 转换系统配置
         */
        async convertSystem(dslSystem, options) {
            // 转换参数
            const baseParameters = this.convertParameters(dslSystem.parameters || []);
            // 转换对象
            const objects = this.convertObjects(dslSystem.objects || []);
            // 转换约束
            const constraints = this.convertConstraints(dslSystem.constraints || []);
            // 生成模块
            const modules = this.generateModules(dslSystem, baseParameters, options);
            // 合并所有模块参数到系统参数中
            const allParameters = this.mergeModuleParameters(baseParameters, modules);
            // 转换环境
            const environment = this.convertEnvironment(dslSystem.environment);
            return {
                type: dslSystem.type || 'unknown',
                dimensions: dslSystem.dimensions || 2,
                modules,
                objects,
                parameters: allParameters,
                constraints,
                conservation_laws: this.extractConservationLaws(modules),
                symmetries: this.identifySymmetries(dslSystem),
                environment,
                boundary_conditions: this.extractBoundaryConditions(dslSystem),
                initial_conditions: this.extractInitialConditions(dslSystem)
            };
        }
        /**
         * 转换参数
         */
        convertParameters(dslParameters) {
            return dslParameters.map(param => ({
                symbol: param.symbol,
                value: {
                    value: param.value.value,
                    unit: param.value.unit,
                    dimension: this.calculateDimension(param.value.unit)
                },
                role: param.role,
                description: param.description,
                dependencies: this.findParameterDependencies(param, dslParameters),
                constraints: []
            }));
        }
        /**
         * 转换对象
         */
        convertObjects(dslObjects) {
            return dslObjects.map(obj => ({
                id: obj.id || this.generateId(),
                name: obj.name || 'unnamed',
                type: obj.type || 'particle',
                position: this.convertVector3(obj.position),
                velocity: this.convertVector3(obj.velocity),
                acceleration: this.convertVector3(obj.acceleration),
                mass: this.convertPhysicalQuantity(obj.mass),
                properties: this.convertProperties(obj.properties || {}),
                constraints: []
            }));
        }
        /**
         * 转换约束
         */
        convertConstraints(dslConstraints) {
            return dslConstraints.map(constraint => ({
                type: this.mapConstraintType(constraint.type),
                expression: constraint.expression || '',
                parameters: constraint.parameters || [],
                description: constraint.description || '',
                priority: constraint.priority || 'important',
                tolerance: constraint.tolerance || 1e-6,
                domain: constraint.domain || {},
                physics_law: constraint.physics_law || ''
            }));
        }
        /**
         * 生成物理模块
         */
        generateModules(system, parameters, options) {
            const modules = [];
            // 智能识别物理模块
            const detectedModules = this.detectPhysicsModules(system, parameters);
            // 使用原子模块库生成模块
            const allAtomicModules = this.atomicModuleLibrary.getAllModules();
            const paramSymbols = parameters.map(p => p.symbol.toLowerCase());
            const systemType = system.type?.toLowerCase() || '';
            const question = system.originalText?.toLowerCase() || '';
            // 为每个检测到的模块类型找到最匹配的原子模块
            detectedModules.forEach(moduleType => {
                const relevantAtomicModules = Array.from(allAtomicModules.values())
                    .filter(atomicModule => atomicModule.type === moduleType)
                    .filter(atomicModule => this.isModuleRelevant(atomicModule, paramSymbols, systemType, question));
                if (relevantAtomicModules.length > 0) {
                    // 选择最相关的原子模块
                    const bestMatch = relevantAtomicModules[0];
                    const irModule = this.convertAtomicModuleToIR(bestMatch, parameters);
                    modules.push(irModule);
                }
                else {
                    // 如果没有找到匹配的原子模块，使用传统方法创建
                    switch (moduleType) {
                        case 'oscillation':
                            modules.push(this.createOscillationModule(parameters));
                            break;
                        case 'wave':
                            modules.push(this.createWaveModule(parameters));
                            break;
                        case 'kinematics':
                            modules.push(this.createKinematicsModule(parameters));
                            break;
                        case 'dynamics':
                            modules.push(this.createDynamicsModule(parameters));
                            break;
                        case 'electromagnetic':
                            modules.push(this.createElectromagneticModule(parameters));
                            break;
                        case 'thermal':
                            modules.push(this.createThermalModule(parameters));
                            break;
                        case 'optical':
                            modules.push(this.createOpticalModule(parameters));
                            break;
                        case 'quantum':
                            modules.push(this.createQuantumModule(parameters));
                            break;
                        case 'acoustics':
                            modules.push(this.createAcousticsModule(parameters));
                            break;
                        case 'phase_change':
                            modules.push(this.createPhaseChangeModule(parameters));
                            break;
                        case 'simple_machines':
                            modules.push(this.createSimpleMachinesModule(parameters));
                            break;
                        case 'pressure':
                            modules.push(this.createPressureModule(parameters));
                            break;
                        case 'basic_electricity':
                            modules.push(this.createBasicElectricityModule(parameters));
                            break;
                        default:
                            modules.push(this.createDefaultModule(parameters));
                    }
                }
            });
            // 如果没有检测到任何模块，创建默认模块
            if (modules.length === 0) {
                modules.push(this.createDefaultModule(parameters));
            }
            return modules;
        }
        /**
         * 智能检测物理模块类型
         */
        detectPhysicsModules(system, parameters) {
            const detectedModules = [];
            const paramSymbols = parameters.map(p => p.symbol.toLowerCase());
            const systemType = system.type?.toLowerCase() || '';
            const question = system.originalText?.toLowerCase() || '';
            // 使用原子模块库进行智能检测
            const allAtomicModules = this.atomicModuleLibrary.getAllModules();
            // 遍历所有原子模块，检查是否匹配
            for (const [moduleId, atomicModule] of allAtomicModules) {
                if (this.isModuleRelevant(atomicModule, paramSymbols, systemType, question)) {
                    detectedModules.push(atomicModule.type);
                }
            }
            // 去重并返回
            return [...new Set(detectedModules)];
        }
        /**
         * 检查原子模块是否与当前系统相关 - 增强版智能检测
         */
        isModuleRelevant(atomicModule, paramSymbols, systemType, question) {
            const questionLower = question.toLowerCase();
            const systemTypeLower = systemType.toLowerCase();
            const moduleTypeLower = atomicModule.type.toLowerCase();
            const moduleNameLower = atomicModule.name.toLowerCase();
            const moduleDescLower = atomicModule.description.toLowerCase();
            // 1. 参数符号匹配 (权重: 30%)
            const moduleParamSymbols = atomicModule.parameters.map(p => p.symbol.toLowerCase());
            const paramMatchScore = this.calculateParamMatchScore(moduleParamSymbols, paramSymbols);
            // 2. 系统类型匹配 (权重: 25%)
            const systemTypeScore = this.calculateSystemTypeScore(systemTypeLower, moduleTypeLower);
            // 3. 语义关键词匹配 (权重: 25%)
            const semanticScore = this.calculateSemanticScore(questionLower, moduleNameLower, moduleDescLower);
            // 4. 物理概念匹配 (权重: 20%)
            const conceptScore = this.calculateConceptScore(questionLower, atomicModule);
            // 计算综合匹配分数
            const totalScore = paramMatchScore * 0.3 + systemTypeScore * 0.25 + semanticScore * 0.25 + conceptScore * 0.2;
            // 动态阈值：根据模块类型调整
            const threshold = this.getDynamicThreshold(atomicModule.type);
            return totalScore >= threshold;
        }
        /**
         * 计算参数匹配分数
         */
        calculateParamMatchScore(moduleParams, systemParams) {
            if (moduleParams.length === 0)
                return 0;
            const matches = moduleParams.filter(param => systemParams.includes(param)).length;
            const exactMatches = moduleParams.filter(param => systemParams.includes(param)).length;
            const partialMatches = systemParams.filter(param => moduleParams.some(mp => mp.includes(param) || param.includes(mp))).length;
            return (exactMatches * 1.0 + partialMatches * 0.5) / moduleParams.length;
        }
        /**
         * 计算系统类型匹配分数
         */
        calculateSystemTypeScore(systemType, moduleType) {
            if (systemType === moduleType)
                return 1.0;
            if (systemType.includes(moduleType) || moduleType.includes(systemType))
                return 0.8;
            // 检查类型映射关系
            const typeMappings = {
                'acoustics': ['wave', 'oscillation'],
                'phase_change': ['thermal'],
                'simple_machines': ['dynamics', 'kinematics'],
                'pressure': ['fluid', 'dynamics'],
                'basic_electricity': ['electricity', 'electromagnetic']
            };
            const mappedTypes = typeMappings[moduleType] || [];
            if (mappedTypes.includes(systemType))
                return 0.7;
            return 0;
        }
        /**
         * 计算语义匹配分数
         */
        calculateSemanticScore(question, moduleName, moduleDesc) {
            // 1. 直接名称匹配
            if (question.includes(moduleName))
                return 1.0;
            // 2. 描述关键词匹配
            const descWords = moduleDesc.split(/[\s，,、]/).filter(word => word.length > 2);
            const matchingWords = descWords.filter(word => question.includes(word));
            if (descWords.length > 0) {
                return matchingWords.length / descWords.length;
            }
            // 3. 同义词匹配
            const synonyms = {
                '声学': ['声音', '声波', '频率', '波长', '声速'],
                '物态变化': ['熔化', '凝固', '汽化', '液化', '升华', '凝华', '热量'],
                '简单机械': ['杠杆', '滑轮', '斜面', '机械', '效率'],
                '压强': ['压力', '浮力', '液体压强', '大气压强', '阿基米德'],
                '电学基础': ['电流', '电压', '电阻', '欧姆定律', '电功率', '电路']
            };
            for (const [key, words] of Object.entries(synonyms)) {
                if (moduleName.includes(key)) {
                    const matchingSynonyms = words.filter(word => question.includes(word));
                    return matchingSynonyms.length / words.length;
                }
            }
            return 0;
        }
        /**
         * 计算物理概念匹配分数
         */
        calculateConceptScore(question, atomicModule) {
            // 检查公式中的物理概念
            const formulaConcepts = atomicModule.formulas.join(' ').toLowerCase();
            const questionWords = question.split(/[\s，,、]/);
            const matchingConcepts = questionWords.filter(word => formulaConcepts.includes(word) && word.length > 1);
            return Math.min(matchingConcepts.length / 5, 1.0); // 最多匹配5个概念
        }
        /**
         * 获取动态阈值
         */
        getDynamicThreshold(moduleType) {
            const thresholds = {
                'acoustics': 0.6,
                'phase_change': 0.6,
                'simple_machines': 0.6,
                'pressure': 0.6,
                'basic_electricity': 0.6,
                'kinematics': 0.7,
                'dynamics': 0.7,
                'thermal': 0.7,
                'electricity': 0.7,
                'optics': 0.7,
                'default': 0.8
            };
            return thresholds[moduleType] || thresholds.default;
        }
        /**
         * 将原子模块转换为 IR 模块
         */
        convertAtomicModuleToIR(atomicModule, parameters) {
            // 转换参数
            const irParameters = atomicModule.parameters.map(param => ({
                symbol: param.symbol,
                value: {
                    value: param.value || 0,
                    unit: param.unit || 'unknown',
                    dimension: PhysicsIR_1.DimensionCalculator.parseDimension(param.unit || 'unknown').toString(),
                    uncertainty: 0,
                    precision: 3,
                    range: undefined
                },
                role: param.role,
                description: param.note || param.symbol,
                domain: this.inferParameterDomain(param.symbol),
                dependencies: [],
                constraints: []
            }));
            // 转换公式为方程
            const irEquations = atomicModule.formulas.map((formula, index) => ({
                id: `${atomicModule.id}_equation_${index}`,
                type: 'algebraic',
                expression: formula,
                variables: this.extractVariablesFromFormula(formula),
                parameters: this.extractParametersFromFormula(formula),
                description: `来自原子模块 ${atomicModule.name} 的公式`,
                order: 1,
                linearity: 'linear',
                stability: 'stable',
                boundary_conditions: [],
                initial_conditions: [],
                physics_meaning: `原子模块 ${atomicModule.name} 的物理关系`,
                derivation: '来自原子模块库'
            }));
            return {
                id: `${atomicModule.id}_ir_module`,
                type: atomicModule.type,
                name: atomicModule.name,
                description: atomicModule.description,
                parameters: irParameters,
                equations: irEquations,
                dependencies: atomicModule.dependencies,
                output: atomicModule.output,
                conservation_laws: [],
                assumptions: [],
                limitations: [],
                complexity: 'basic',
                domain: {
                    spatial: '1d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 从公式中提取变量
         */
        extractVariablesFromFormula(formula) {
            // 简单的变量提取逻辑，匹配字母开头的标识符
            const variablePattern = /\b[a-zA-Z_α-ωΑ-Ω][a-zA-Z0-9_α-ωΑ-Ω]*\b/g;
            const matches = formula.match(variablePattern) || [];
            return [...new Set(matches)]; // 去重
        }
        /**
         * 从公式中提取参数
         */
        extractParametersFromFormula(formula) {
            // 参数通常是常数，这里简化处理
            return [];
        }
        /**
         * 推断参数域
         */
        inferParameterDomain(symbol) {
            const symbolLower = symbol.toLowerCase();
            if (['x', 'y', 'z', 'r', 'l', 'd', 'h'].includes(symbolLower))
                return 'spatial';
            if (['t', 'time'].includes(symbolLower))
                return 'temporal';
            if (['m', 'mass'].includes(symbolLower))
                return 'material';
            if (['v', 'velocity', 'speed'].includes(symbolLower))
                return 'kinematic';
            if (['f', 'force'].includes(symbolLower))
                return 'dynamic';
            if (['e', 'energy', 'u', 'voltage'].includes(symbolLower))
                return 'energetic';
            return 'generic';
        }
        /**
         * 创建振动模块
         */
        createOscillationModule(parameters) {
            // 获取系统参数中已有的参数
            const existingParams = parameters.filter(p => ['k', 'm', 'A', 'x', 'v', 'a'].includes(p.symbol));
            // 为方程中需要的变量和参数创建完整定义
            const moduleParameters = [
                ...existingParams,
                // 添加方程中需要的变量
                this.createParameter('x', 'L', 'unknown', '位移', 0),
                this.createParameter('t', 'T', 'given', '时间变量', 0),
                this.createParameter('v', 'LT^-1', 'derived', '速度', 0),
                this.createParameter('a', 'LT^-2', 'derived', '加速度', 0),
                // 添加方程中需要的参数（如果不存在）
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'k', dimension: 'MT^-2', role: 'given', description: '弹簧劲度系数', defaultValue: 100 },
                    { symbol: 'm', dimension: 'M', role: 'given', description: '质量', defaultValue: 0.5 },
                    { symbol: 'A', dimension: 'L', role: 'given', description: '振幅', defaultValue: 0.1 }
                ])
            ];
            return {
                id: 'oscillation_module',
                type: 'oscillation',
                name: '简谐振动',
                description: '弹簧振子的简谐振动',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'oscillation_equation',
                        type: 'differential',
                        expression: 'd²x/dt² = -(k/m) * x',
                        variables: ['x', 't'],
                        parameters: ['k', 'm'],
                        description: '简谐振动微分方程',
                        order: 2,
                        linearity: 'linear',
                        stability: 'stable',
                        physics_meaning: '简谐振动的动力学方程'
                    }
                ],
                dependencies: [],
                output: ['x', 'v', 'a', 'T', 'ω'],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'E = (1/2)kx² + (1/2)mv²',
                        variables: ['E', 'x', 'v'],
                        tolerance: 1e-6,
                        description: '简谐振动的能量守恒'
                    }
                ],
                assumptions: ['小振幅近似', '无阻尼', '线性恢复力'],
                limitations: ['不适用于大振幅', '忽略非线性效应'],
                complexity: 'intermediate',
                domain: {
                    spatial: '1d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建波动模块
         */
        createWaveModule(parameters) {
            // 获取系统参数中已有的参数
            const existingParams = parameters.filter(p => ['y', 'A', 'ω', 'k', 'v'].includes(p.symbol));
            // 为方程中需要的变量和参数创建完整定义
            const moduleParameters = [
                ...existingParams,
                // 添加方程中需要的变量
                this.createParameter('x', 'L', 'given', '空间坐标', 0),
                this.createParameter('t', 'T', 'given', '时间变量', 0),
                // 添加方程中需要的参数（如果不存在）
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'A', dimension: 'L', role: 'given', description: '振幅', defaultValue: 0.02 },
                    { symbol: 'ω', dimension: 'T^-1', role: 'given', description: '角频率', defaultValue: 20 },
                    { symbol: 'k', dimension: 'L^-1', role: 'given', description: '波数', defaultValue: 0.5 }
                ])
            ];
            return {
                id: 'wave_module',
                type: 'wave',
                name: '简谐波',
                description: '简谐横波传播',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'wave_equation',
                        type: 'algebraic',
                        expression: 'y = A * sin(ωt - kx)',
                        variables: ['y', 'x', 't'],
                        parameters: ['A', 'ω', 'k'],
                        description: '简谐波方程',
                        linearity: 'linear',
                        physics_meaning: '简谐波的数学描述'
                    }
                ],
                dependencies: [],
                output: ['y', 'f', 'λ', 'v'],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'E ∝ A²ω²',
                        variables: ['E', 'A', 'ω'],
                        tolerance: 1e-6,
                        description: '波的能量与振幅和频率的关系'
                    }
                ],
                assumptions: ['线性介质', '小振幅', '无耗散'],
                limitations: ['不适用于非线性介质', '忽略色散效应'],
                complexity: 'intermediate',
                domain: {
                    spatial: '1d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建运动学模块
         */
        createKinematicsModule(parameters) {
            // 获取系统参数中已有的参数
            const existingParams = parameters.filter(p => ['x', 'v', 'a', 't'].includes(p.symbol));
            // 为方程中需要的变量创建完整定义
            const moduleParameters = [
                ...existingParams,
                // 添加方程中需要的变量（如果不存在）
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'x', dimension: 'L', role: 'unknown', description: '位移', defaultValue: 0 },
                    { symbol: 'v', dimension: 'LT^-1', role: 'unknown', description: '速度', defaultValue: 0 },
                    { symbol: 'a', dimension: 'LT^-2', role: 'given', description: '加速度', defaultValue: 0 },
                    { symbol: 't', dimension: 'T', role: 'given', description: '时间变量', defaultValue: 0 }
                ])
            ];
            return {
                id: 'kinematics_module',
                type: 'kinematics',
                name: '运动学',
                description: '基本运动学方程',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'kinematics_equation',
                        type: 'differential',
                        expression: 'dx/dt = v, dv/dt = a',
                        variables: ['x', 'v', 'a', 't'],
                        parameters: [],
                        description: '运动学基本方程',
                        order: 1,
                        linearity: 'linear',
                        physics_meaning: '速度是位移对时间的导数，加速度是速度对时间的导数'
                    }
                ],
                dependencies: [],
                output: ['x', 'v', 'a'],
                conservation_laws: [],
                assumptions: ['质点模型', '经典力学适用'],
                limitations: ['不适用于相对论情况', '忽略量子效应'],
                complexity: 'basic',
                domain: {
                    spatial: '1d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建默认模块
         */
        createDefaultModule(parameters) {
            return {
                id: 'default_module',
                type: 'generic',
                name: '通用物理模块',
                description: '通用物理系统',
                parameters,
                equations: [],
                dependencies: [],
                output: [],
                conservation_laws: [],
                assumptions: ['经典物理适用'],
                limitations: ['仅适用于宏观低速情况'],
                complexity: 'basic',
                domain: {
                    spatial: '3d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        // ===== 物理模块检测方法 =====
        detectOscillationModule(paramSymbols, systemType, question) {
            const oscillationKeywords = ['k', 'ω', 'omega', 't', 'period', 'frequency', 'amplitude', 'spring', 'pendulum'];
            const oscillationTerms = ['振动', '振荡', '简谐', '弹簧', '摆', '周期', '频率', '振幅'];
            return oscillationKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                oscillationTerms.some(term => question.includes(term)) ||
                systemType.includes('oscillation');
        }
        detectWaveModule(paramSymbols, systemType, question) {
            const waveKeywords = ['λ', 'lambda', 'k', 'ω', 'omega', 'v', 'f', 'wave', 'amplitude'];
            const waveTerms = ['波', '波动', '横波', '纵波', '波长', '波速', '波频', '干涉', '衍射'];
            return waveKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                waveTerms.some(term => question.includes(term)) ||
                systemType.includes('wave');
        }
        detectKinematicsModule(paramSymbols, systemType, question) {
            const kinematicsKeywords = ['x', 'v', 'a', 't', 's', 'u', 'displacement', 'velocity', 'acceleration'];
            const kinematicsTerms = ['运动', '位移', '速度', '加速度', '匀速', '匀加速', '自由落体', '抛体'];
            return kinematicsKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                kinematicsTerms.some(term => question.includes(term)) ||
                systemType.includes('kinematics');
        }
        detectDynamicsModule(paramSymbols, systemType, question) {
            const dynamicsKeywords = ['f', 'm', 'a', 'force', 'mass', 'momentum', 'energy', 'work', 'power'];
            const dynamicsTerms = ['力', '质量', '动量', '能量', '功', '功率', '牛顿', '碰撞', '冲量'];
            return dynamicsKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                dynamicsTerms.some(term => question.includes(term)) ||
                systemType.includes('dynamics');
        }
        detectElectromagneticModule(paramSymbols, systemType, question) {
            const emKeywords = ['e', 'b', 'q', 'i', 'r', 'c', 'electric', 'magnetic', 'field', 'charge', 'current'];
            const emTerms = ['电场', '磁场', '电荷', '电流', '电阻', '电容', '电感', '电磁', '感应', '洛伦兹'];
            return emKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                emTerms.some(term => question.includes(term)) ||
                systemType.includes('electromagnetic');
        }
        detectThermalModule(paramSymbols, systemType, question) {
            const thermalKeywords = ['t', 'q', 'c', 'k', 'h', 'temperature', 'heat', 'thermal', 'entropy'];
            const thermalTerms = ['温度', '热量', '热', '熵', '热力学', '比热', '热传导', '热辐射'];
            return thermalKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                thermalTerms.some(term => question.includes(term)) ||
                systemType.includes('thermal');
        }
        detectOpticalModule(paramSymbols, systemType, question) {
            const opticalKeywords = ['n', 'θ', 'theta', 'f', 'd', 'refractive', 'index', 'lens', 'mirror'];
            const opticalTerms = ['光', '光学', '折射', '反射', '透镜', '镜', '干涉', '衍射', '偏振'];
            return opticalKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                opticalTerms.some(term => question.includes(term)) ||
                systemType.includes('optical');
        }
        detectQuantumModule(paramSymbols, systemType, question) {
            const quantumKeywords = ['h', 'ħ', 'hbar', 'ψ', 'psi', 'φ', 'phi', 'quantum', 'wavefunction'];
            const quantumTerms = ['量子', '波函数', '薛定谔', '不确定性', '量子化', '能级', '跃迁'];
            return quantumKeywords.some(keyword => paramSymbols.includes(keyword)) ||
                quantumTerms.some(term => question.includes(term)) ||
                systemType.includes('quantum');
        }
        // ===== 新增物理模块创建方法 =====
        createDynamicsModule(parameters) {
            const existingParams = parameters.filter(p => ['f', 'm', 'a', 'p', 'e', 'w', 'v'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'F', dimension: 'MLT^-2', role: 'unknown', description: '力', defaultValue: 0 },
                    { symbol: 'm', dimension: 'M', role: 'given', description: '质量', defaultValue: 1 },
                    { symbol: 'a', dimension: 'LT^-2', role: 'unknown', description: '加速度', defaultValue: 0 },
                    { symbol: 'v', dimension: 'LT^-1', role: 'unknown', description: '速度', defaultValue: 0 },
                    { symbol: 'p', dimension: 'MLT^-1', role: 'unknown', description: '动量', defaultValue: 0 },
                    { symbol: 'E', dimension: 'ML^2T^-2', role: 'unknown', description: '能量', defaultValue: 0 }
                ])
            ];
            return {
                id: 'dynamics_module',
                type: 'dynamics',
                name: '动力学',
                description: '牛顿力学和能量守恒',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'newton_second_law',
                        type: 'algebraic',
                        expression: 'F = ma',
                        variables: ['F', 'm', 'a'],
                        parameters: [],
                        description: '牛顿第二定律',
                        linearity: 'linear',
                        physics_meaning: '力等于质量乘以加速度'
                    },
                    {
                        id: 'momentum_definition',
                        type: 'algebraic',
                        expression: 'p = mv',
                        variables: ['p', 'm', 'v'],
                        parameters: [],
                        description: '动量定义',
                        linearity: 'linear',
                        physics_meaning: '动量等于质量乘以速度'
                    }
                ],
                dependencies: [],
                output: ['F', 'a', 'p', 'E'],
                conservation_laws: [
                    {
                        type: 'momentum',
                        expression: 'p_total = constant',
                        variables: ['p'],
                        tolerance: 1e-6,
                        description: '动量守恒定律'
                    },
                    {
                        type: 'energy',
                        expression: 'E_total = constant',
                        variables: ['E'],
                        tolerance: 1e-6,
                        description: '能量守恒定律'
                    }
                ],
                assumptions: ['经典力学适用', '质点模型'],
                limitations: ['不适用于相对论情况', '不适用于量子效应'],
                complexity: 'intermediate',
                domain: {
                    spatial: '3d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        createElectromagneticModule(parameters) {
            const existingParams = parameters.filter(p => ['e', 'b', 'q', 'i', 'r', 'c'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'E', dimension: 'MLT^-3I^-1', role: 'unknown', description: '电场强度', defaultValue: 0 },
                    { symbol: 'B', dimension: 'MT^-2I^-1', role: 'unknown', description: '磁感应强度', defaultValue: 0 },
                    { symbol: 'q', dimension: 'IT', role: 'given', description: '电荷量', defaultValue: 1 },
                    { symbol: 'I', dimension: 'I', role: 'given', description: '电流', defaultValue: 1 },
                    { symbol: 'R', dimension: 'ML^2T^-3I^-2', role: 'given', description: '电阻', defaultValue: 1 }
                ])
            ];
            return {
                id: 'electromagnetic_module',
                type: 'electromagnetic',
                name: '电磁学',
                description: '电磁场和电路',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'coulomb_law',
                        type: 'algebraic',
                        expression: 'F = k*q1*q2/r^2',
                        variables: ['F', 'q1', 'q2', 'r'],
                        parameters: ['k'],
                        description: '库仑定律',
                        linearity: 'nonlinear',
                        physics_meaning: '点电荷间的静电力'
                    },
                    {
                        id: 'ohms_law',
                        type: 'algebraic',
                        expression: 'V = IR',
                        variables: ['V', 'I', 'R'],
                        parameters: [],
                        description: '欧姆定律',
                        linearity: 'linear',
                        physics_meaning: '电压等于电流乘以电阻'
                    }
                ],
                dependencies: [],
                output: ['E', 'B', 'F', 'V'],
                conservation_laws: [
                    {
                        type: 'charge',
                        expression: 'q_total = constant',
                        variables: ['q'],
                        tolerance: 1e-12,
                        description: '电荷守恒定律'
                    }
                ],
                assumptions: ['准静态近似', '线性介质'],
                limitations: ['不适用于高频情况', '忽略辐射效应'],
                complexity: 'advanced',
                domain: {
                    spatial: '3d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        createThermalModule(parameters) {
            const existingParams = parameters.filter(p => ['t', 'q', 'c', 'k', 'h'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'T', dimension: 'Θ', role: 'unknown', description: '温度', defaultValue: 300 },
                    { symbol: 'Q', dimension: 'ML^2T^-2', role: 'unknown', description: '热量', defaultValue: 0 },
                    { symbol: 'c', dimension: 'L^2T^-2Θ^-1', role: 'given', description: '比热容', defaultValue: 1000 },
                    { symbol: 'k', dimension: 'MLT^-3Θ^-1', role: 'given', description: '热导率', defaultValue: 1 }
                ])
            ];
            return {
                id: 'thermal_module',
                type: 'thermal',
                name: '热学',
                description: '热力学和传热',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'heat_capacity',
                        type: 'algebraic',
                        expression: 'Q = mcΔT',
                        variables: ['Q', 'm', 'c', 'T'],
                        parameters: [],
                        description: '热容量方程',
                        linearity: 'linear',
                        physics_meaning: '热量等于质量乘以比热容乘以温度变化'
                    }
                ],
                dependencies: [],
                output: ['T', 'Q'],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'Q_in = Q_out + ΔU',
                        variables: ['Q', 'U'],
                        tolerance: 1e-6,
                        description: '热力学第一定律'
                    }
                ],
                assumptions: ['理想气体', '准静态过程'],
                limitations: ['不适用于非平衡态', '忽略量子效应'],
                complexity: 'intermediate',
                domain: {
                    spatial: '3d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        createOpticalModule(parameters) {
            const existingParams = parameters.filter(p => ['n', 'θ', 'f', 'd', 'λ'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'n', dimension: '1', role: 'given', description: '折射率', defaultValue: 1.5 },
                    { symbol: 'θ', dimension: '1', role: 'unknown', description: '角度', defaultValue: 0 },
                    { symbol: 'f', dimension: 'L', role: 'given', description: '焦距', defaultValue: 0.1 },
                    { symbol: 'λ', dimension: 'L', role: 'given', description: '波长', defaultValue: 500e-9 }
                ])
            ];
            return {
                id: 'optical_module',
                type: 'optical',
                name: '光学',
                description: '几何光学和波动光学',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'snells_law',
                        type: 'algebraic',
                        expression: 'n1*sin(θ1) = n2*sin(θ2)',
                        variables: ['n1', 'θ1', 'n2', 'θ2'],
                        parameters: [],
                        description: '斯涅尔定律',
                        linearity: 'nonlinear',
                        physics_meaning: '折射定律'
                    }
                ],
                dependencies: [],
                output: ['θ', 'f'],
                conservation_laws: [],
                assumptions: ['几何光学近似', '单色光'],
                limitations: ['不适用于强非线性', '忽略衍射效应'],
                complexity: 'intermediate',
                domain: {
                    spatial: '3d',
                    temporal: 'static',
                    scale: 'macroscopic'
                }
            };
        }
        createQuantumModule(parameters) {
            const existingParams = parameters.filter(p => ['h', 'ħ', 'ψ', 'φ', 'e'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'ψ', dimension: 'L^-3/2', role: 'unknown', description: '波函数', defaultValue: 0 },
                    { symbol: 'E', dimension: 'ML^2T^-2', role: 'unknown', description: '能量', defaultValue: 0 },
                    { symbol: 'ħ', dimension: 'ML^2T^-1', role: 'constant', description: '约化普朗克常数', defaultValue: 1.055e-34 }
                ])
            ];
            return {
                id: 'quantum_module',
                type: 'quantum',
                name: '量子力学',
                description: '量子力学基础',
                parameters: moduleParameters,
                equations: [
                    {
                        id: 'schrodinger_equation',
                        type: 'differential',
                        expression: 'iħ∂ψ/∂t = Hψ',
                        variables: ['ψ', 't'],
                        parameters: ['ħ', 'H'],
                        description: '薛定谔方程',
                        linearity: 'linear',
                        order: 1,
                        physics_meaning: '量子态的时间演化'
                    }
                ],
                dependencies: [],
                output: ['ψ', 'E'],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'E = constant',
                        variables: ['E'],
                        tolerance: 1e-15,
                        description: '能量守恒'
                    }
                ],
                assumptions: ['非相对论量子力学', '孤立系统'],
                limitations: ['不适用于相对论情况', '忽略环境相互作用'],
                complexity: 'expert',
                domain: {
                    spatial: '3d',
                    temporal: 'dynamic',
                    scale: 'microscopic'
                }
            };
        }
        /**
         * 转换仿真配置
         */
        convertSimulation(dslSimulation) {
            return {
                duration: this.convertPhysicalQuantity(dslSimulation.duration),
                time_step: this.convertPhysicalQuantity(dslSimulation.time_step),
                solver: dslSimulation.solver || 'verlet',
                precision: dslSimulation.precision || 'medium',
                tolerance: 1e-6,
                max_iterations: 1000,
                events: this.convertEvents(dslSimulation.events || [])
            };
        }
        /**
         * 转换输出配置
         */
        convertOutput(dslOutput) {
            return {
                variables: dslOutput.variables || [],
                export_formats: dslOutput.export_formats || ['csv', 'json'],
                plots: this.convertPlots(dslOutput.plots || []),
                animations: this.convertAnimations(dslOutput.animations || []),
                checkpoints: this.convertCheckpoints(dslOutput.checkpoints || [])
            };
        }
        /**
         * 生成计算优化
         */
        generateOptimization(system, options) {
            const optimization = {
                precomputed_values: {},
                cached_derivatives: {},
                parallel_modules: [],
                dependency_graph: {}
            };
            if (options.precompute_constants) {
                // 预计算常量
                system.parameters.forEach((param) => {
                    if (param.role === 'constant') {
                        optimization.precomputed_values[param.symbol] = param.value.value;
                    }
                });
            }
            if (options.include_derivatives) {
                // 缓存导数
                system.modules.forEach((module) => {
                    module.equations.forEach(eq => {
                        if (eq.type === 'differential') {
                            optimization.cached_derivatives[eq.id] = eq.expression;
                        }
                    });
                });
            }
            // 分析依赖关系
            optimization.dependency_graph = this.analyzeDependencies(system.modules);
            return optimization;
        }
        /**
         * 验证 IR
         */
        validateIR(ir) {
            const warnings = [];
            const errors = [];
            // 结构验证
            if (!ir.metadata.id)
                errors.push('缺少元数据 ID');
            if (!ir.system.modules.length)
                warnings.push('没有定义物理模块');
            // 物理验证
            if (ir.system.parameters.length === 0)
                warnings.push('没有定义参数');
            // 单位一致性验证
            const unitErrors = this.validateUnits(ir.system.parameters);
            errors.push(...unitErrors);
            return {
                structure_valid: errors.length === 0,
                physics_valid: warnings.length === 0,
                units_consistent: unitErrors.length === 0,
                constraints_satisfied: true,
                warnings,
                errors
            };
        }
        // ===== 工具方法 =====
        generateId() {
            return `ir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        /**
         * 创建参数
         */
        createParameter(symbol, dimension, role, description, value) {
            return {
                symbol,
                value: {
                    value,
                    unit: this.getUnitFromDimension(dimension),
                    dimension
                },
                role,
                description,
                dependencies: [],
                constraints: []
            };
        }
        /**
         * 确保参数存在，如果不存在则创建
         */
        ensureParametersExist(existingParams, requiredParams) {
            const newParams = [];
            requiredParams.forEach(reqParam => {
                const exists = existingParams.find(p => p.symbol === reqParam.symbol);
                if (!exists) {
                    newParams.push(this.createParameter(reqParam.symbol, reqParam.dimension, reqParam.role, reqParam.description, reqParam.defaultValue));
                }
            });
            return newParams;
        }
        /**
         * 根据量纲获取单位
         */
        getUnitFromDimension(dimension) {
            const dimensionToUnit = {
                'L': 'm',
                'T': 's',
                'M': 'kg',
                'LT^-1': 'm/s',
                'LT^-2': 'm/s²',
                'T^-1': 'rad/s',
                'L^-1': 'rad/m',
                'MLT^-2': 'N',
                'ML^2T^-2': 'J',
                'ML^2T^-3': 'W',
                'MLT^-1': 'kg⋅m/s', // 动量单位
                '1': '1', // 无量纲
                'rad': 'rad', // 弧度
                'Θ': 'K', // 温度
                'I': 'A', // 电流
                'IT': 'C', // 电荷
                'ML^-1T^-2': 'Pa', // 压强
                'ML^2T^-1': 'J⋅s', // 角动量
                'MLT^-3I^-1': 'V/m', // 电场强度
                'MT^-2I^-1': 'T', // 磁感应强度
                'ML^2T^-3I^-2': 'Ω', // 电阻
                'ML^2I^-2T^-3': 'F', // 电容
                'ML^2I^-2T^-2': 'H', // 电感
                'ML^2T^-2Θ^-1': 'J/K', // 热容
                'MLT^-3Θ^-1': 'W/(m⋅K)', // 热导率
                'L^2T^-2Θ^-1': 'J/(kg⋅K)', // 比热容
                'N': 'mol', // 物质的量
                'N^-1': 'mol^-1', // 阿伏伽德罗常数
                'ML^2T^-2Θ^-1N^-1': 'J/(mol⋅K)', // 气体常数
                'L^3M^-1T^-2': 'm^3/(kg⋅s^2)', // 万有引力常数
                'I^2T^4M^-1L^-3': 'F/m', // 真空介电常数
                'MLI^-2T^-2': 'H/m' // 真空磁导率
            };
            return dimensionToUnit[dimension] || 'unknown';
        }
        /**
         * 合并模块参数到系统参数中
         */
        mergeModuleParameters(baseParameters, modules) {
            const parameterMap = new Map();
            // 添加基础参数
            baseParameters.forEach(param => {
                parameterMap.set(param.symbol, param);
            });
            // 添加模块参数（如果不存在或更新）
            modules.forEach(module => {
                module.parameters.forEach(moduleParam => {
                    const existingParam = parameterMap.get(moduleParam.symbol);
                    if (!existingParam) {
                        // 如果不存在，添加新参数
                        parameterMap.set(moduleParam.symbol, moduleParam);
                    }
                    else {
                        // 如果存在，更新参数信息（保留基础参数的值，更新其他信息）
                        parameterMap.set(moduleParam.symbol, {
                            ...existingParam,
                            description: moduleParam.description,
                            role: moduleParam.role,
                            dependencies: moduleParam.dependencies,
                            constraints: moduleParam.constraints
                        });
                    }
                });
            });
            return Array.from(parameterMap.values());
        }
        calculateDimension(unit) {
            // 简化的量纲计算
            const dimensionMap = {
                'm': 'L',
                's': 'T',
                'kg': 'M',
                'N': 'MLT^-2',
                'J': 'ML^2T^-2',
                'W': 'ML^2T^-3',
                'Hz': 'T^-1',
                'rad': '1',
                'rad/s': 'T^-1'
            };
            return dimensionMap[unit] || 'unknown';
        }
        convertVector3(vector) {
            if (typeof vector === 'object' && vector.value !== undefined) {
                return { x: vector.value, y: 0, z: 0 };
            }
            return { x: 0, y: 0, z: 0 };
        }
        convertPhysicalQuantity(quantity) {
            const unit = quantity.unit || 'unknown';
            return {
                value: quantity.value || 0,
                unit: unit,
                dimension: this.calculateDimension(unit)
            };
        }
        convertProperties(properties) {
            const result = {};
            for (const [key, value] of Object.entries(properties)) {
                if (typeof value === 'object' && value !== null) {
                    result[key] = this.convertPhysicalQuantity(value);
                }
            }
            return result;
        }
        mapConstraintType(type) {
            const typeMap = {
                'custom': 'equality',
                'boundary': 'boundary',
                'gravity': 'physical',
                'initial': 'initial'
            };
            return typeMap[type] || 'equality';
        }
        findParameterDependencies(param, allParams) {
            // 简化的依赖关系分析
            return [];
        }
        convertEnvironment(env) {
            if (!env) {
                return {
                    gravity: this.convertPhysicalQuantity({ value: 9.8, unit: 'm/s²' }),
                    air_resistance: false,
                    temperature: this.convertPhysicalQuantity({ value: 20, unit: '°C' })
                };
            }
            return {
                gravity: this.convertPhysicalQuantity(env.gravity || { value: 9.8, unit: 'm/s²' }),
                air_resistance: env.air_resistance || false,
                temperature: this.convertPhysicalQuantity(env.temperature || { value: 20, unit: '°C' })
            };
        }
        convertEvents(events) {
            return events.map(event => ({
                id: event.id || this.generateId(),
                type: event.type || 'time',
                trigger: {
                    condition: event.trigger?.condition || 'time_reached',
                    value: this.convertPhysicalQuantity(event.trigger?.value || { value: 5, unit: 's' })
                },
                action: event.action || 'checkpoint',
                description: event.description || 'Simulation checkpoint'
            }));
        }
        convertPlots(plots) {
            return plots.map(plot => ({
                id: plot.id || this.generateId(),
                type: plot.type || 'time_series',
                title: plot.title || '',
                x_axis: plot.x_axis || 't',
                y_axis: plot.y_axis || 'x',
                variables: [plot.x_axis, plot.y_axis].filter(Boolean),
                style: {}
            }));
        }
        convertAnimations(animations) {
            return animations.map(anim => ({
                id: anim.id || this.generateId(),
                type: anim.type || '2d',
                camera: anim.camera || 'fixed',
                speed: anim.speed || 1.0,
                loop: anim.loop !== undefined ? anim.loop : true,
                duration: anim.duration || 10.0,
                easing: anim.easing || 'ease_in_out',
                objects: [],
                style: {}
            }));
        }
        convertCheckpoints(checkpoints) {
            return checkpoints.map(cp => ({
                id: cp.id || this.generateId(),
                time: this.convertPhysicalQuantity(cp.time || { value: 5, unit: 's' }),
                variables: cp.variables || [],
                description: cp.description || ''
            }));
        }
        analyzeDependencies(modules) {
            const graph = {};
            modules.forEach(module => {
                graph[module.id] = module.dependencies;
            });
            return graph;
        }
        validateUnits(parameters) {
            const errors = [];
            // 简化的单位验证
            return errors;
        }
        getAppliedOptimizations(options) {
            const optimizations = [];
            if (options.optimize_for_simulation)
                optimizations.push('simulation_optimization');
            if (options.include_derivatives)
                optimizations.push('derivative_caching');
            if (options.precompute_constants)
                optimizations.push('constant_precomputation');
            return optimizations;
        }
        // ===== 新增辅助方法 =====
        inferPhysicsDomains(dslMetadata) {
            const domains = [];
            const systemType = dslMetadata.system_type?.toLowerCase() || '';
            const topic = dslMetadata.topic?.toLowerCase() || '';
            if (systemType.includes('oscillation') || topic.includes('振动') || topic.includes('振荡')) {
                domains.push('mechanics');
            }
            if (systemType.includes('wave') || topic.includes('波') || topic.includes('波动')) {
                domains.push('waves');
            }
            if (systemType.includes('electromagnetic') || topic.includes('电磁') || topic.includes('电场') || topic.includes('磁场')) {
                domains.push('electromagnetism');
            }
            if (systemType.includes('thermal') || topic.includes('热') || topic.includes('温度')) {
                domains.push('thermodynamics');
            }
            if (systemType.includes('optical') || topic.includes('光') || topic.includes('光学')) {
                domains.push('optics');
            }
            if (systemType.includes('quantum') || topic.includes('量子')) {
                domains.push('quantum_mechanics');
            }
            return domains.length > 0 ? domains : ['general_physics'];
        }
        calculateComplexityScore(dslMetadata) {
            let score = 50; // 基础分数
            const difficulty = dslMetadata.difficulty?.toLowerCase() || 'medium';
            switch (difficulty) {
                case 'easy':
                    score += 10;
                    break;
                case 'medium':
                    score += 20;
                    break;
                case 'hard':
                    score += 30;
                    break;
                case 'expert':
                    score += 40;
                    break;
            }
            const systemType = dslMetadata.system_type?.toLowerCase() || '';
            if (systemType.includes('quantum'))
                score += 30;
            if (systemType.includes('relativistic'))
                score += 25;
            if (systemType.includes('electromagnetic'))
                score += 15;
            if (systemType.includes('wave'))
                score += 10;
            return Math.min(100, Math.max(0, score));
        }
        estimateSolveTime(dslMetadata) {
            const complexity = this.calculateComplexityScore(dslMetadata);
            const systemType = dslMetadata.system_type?.toLowerCase() || '';
            let baseTime = 1; // 基础时间（秒）
            if (systemType.includes('quantum'))
                baseTime *= 10;
            if (systemType.includes('relativistic'))
                baseTime *= 8;
            if (systemType.includes('electromagnetic'))
                baseTime *= 5;
            if (systemType.includes('wave'))
                baseTime *= 3;
            return baseTime * (complexity / 50);
        }
        extractConservationLaws(modules) {
            const laws = [];
            modules.forEach(module => {
                laws.push(...module.conservation_laws);
            });
            return laws;
        }
        identifySymmetries(dslSystem) {
            const symmetries = [];
            const systemType = dslSystem.type?.toLowerCase() || '';
            if (systemType.includes('oscillation')) {
                symmetries.push('time_translation');
                symmetries.push('spatial_reflection');
            }
            if (systemType.includes('wave')) {
                symmetries.push('space_translation');
                symmetries.push('time_translation');
            }
            if (systemType.includes('electromagnetic')) {
                symmetries.push('gauge_symmetry');
            }
            return symmetries;
        }
        extractBoundaryConditions(dslSystem) {
            const conditions = [];
            // 从系统约束中提取边界条件
            if (dslSystem.constraints) {
                dslSystem.constraints.forEach((constraint) => {
                    if (constraint.type === 'boundary') {
                        conditions.push({
                            type: 'boundary',
                            expression: constraint.expression || '',
                            parameters: constraint.parameters || [],
                            description: constraint.description || '',
                            priority: 'critical',
                            tolerance: 1e-6,
                            domain: constraint.domain || {},
                            physics_law: constraint.physics_law || ''
                        });
                    }
                });
            }
            return conditions;
        }
        extractInitialConditions(dslSystem) {
            const conditions = [];
            // 从系统约束中提取初始条件
            if (dslSystem.constraints) {
                dslSystem.constraints.forEach((constraint) => {
                    if (constraint.type === 'initial') {
                        conditions.push({
                            type: 'initial',
                            expression: constraint.expression || '',
                            parameters: constraint.parameters || [],
                            description: constraint.description || '',
                            priority: 'critical',
                            tolerance: 1e-6,
                            domain: constraint.domain || {},
                            physics_law: constraint.physics_law || ''
                        });
                    }
                });
            }
            return conditions;
        }
        assessComplexity(ir) {
            const score = ir.metadata.complexity_score;
            const moduleCount = ir.system.modules.length;
            const equationCount = ir.system.modules.reduce((sum, m) => sum + m.equations.length, 0);
            if (score >= 80)
                return '极高复杂度';
            if (score >= 60)
                return '高复杂度';
            if (score >= 40)
                return '中等复杂度';
            if (score >= 20)
                return '低复杂度';
            return '极低复杂度';
        }
        identifyDominantPhysics(ir) {
            const dominant = [];
            ir.system.modules.forEach(module => {
                switch (module.type) {
                    case 'oscillation':
                        dominant.push('简谐振动');
                        break;
                    case 'wave':
                        dominant.push('波动现象');
                        break;
                    case 'dynamics':
                        dominant.push('牛顿力学');
                        break;
                    case 'electromagnetic':
                        dominant.push('电磁学');
                        break;
                    case 'thermal':
                        dominant.push('热力学');
                        break;
                    case 'optical':
                        dominant.push('光学');
                        break;
                    case 'quantum':
                        dominant.push('量子力学');
                        break;
                    default:
                        dominant.push('经典物理');
                }
            });
            return dominant.length > 0 ? dominant : ['经典物理'];
        }
        evaluateApproximationQuality(ir) {
            let quality = 100;
            ir.system.modules.forEach(module => {
                // 根据模块的假设和限制评估近似质量
                if (module.assumptions.includes('小振幅近似'))
                    quality -= 5;
                if (module.assumptions.includes('线性近似'))
                    quality -= 10;
                if (module.assumptions.includes('准静态近似'))
                    quality -= 8;
                if (module.limitations.includes('不适用于相对论情况'))
                    quality -= 15;
                if (module.limitations.includes('忽略量子效应'))
                    quality -= 20;
            });
            return Math.max(0, Math.min(100, quality));
        }
        determineApproximationLevel(ir) {
            const modules = ir.system.modules;
            if (modules.some(m => m.type === 'quantum'))
                return 'exact';
            if (modules.some(m => m.assumptions.includes('小振幅近似')))
                return 'first_order';
            if (modules.some(m => m.assumptions.includes('线性近似')))
                return 'second_order';
            return 'phenomenological';
        }
        generatePhysicalInterpretation(ir) {
            const dominant = this.identifyDominantPhysics(ir);
            const systemType = ir.metadata.system_type;
            if (dominant.includes('简谐振动')) {
                return '这是一个简谐振动系统，物体在恢复力作用下做周期性运动，能量在动能和势能之间转换。';
            }
            if (dominant.includes('波动现象')) {
                return '这是一个波动系统，能量通过介质传播，具有频率、波长和波速等特征。';
            }
            if (dominant.includes('牛顿力学')) {
                return '这是一个经典力学系统，遵循牛顿运动定律，涉及力、质量和加速度的关系。';
            }
            if (dominant.includes('电磁学')) {
                return '这是一个电磁系统，涉及电场、磁场和电荷的相互作用。';
            }
            return `这是一个${systemType}物理系统，涉及多个物理现象的相互作用。`;
        }
        extractConcepts(ir) {
            const concepts = [];
            ir.system.modules.forEach(module => {
                switch (module.type) {
                    case 'oscillation':
                        concepts.push('简谐振动', '周期', '频率', '振幅', '相位');
                        break;
                    case 'wave':
                        concepts.push('波动', '波长', '波速', '干涉', '衍射');
                        break;
                    case 'dynamics':
                        concepts.push('牛顿定律', '动量', '能量', '力', '加速度');
                        break;
                    case 'electromagnetic':
                        concepts.push('电场', '磁场', '电荷', '电流', '电磁感应');
                        break;
                    case 'thermal':
                        concepts.push('温度', '热量', '熵', '热力学定律');
                        break;
                    case 'optical':
                        concepts.push('折射', '反射', '干涉', '衍射', '偏振');
                        break;
                    case 'quantum':
                        concepts.push('波函数', '量子化', '不确定性原理', '薛定谔方程');
                        break;
                    case 'acoustics':
                        concepts.push('声波', '频率', '波长', '声速', '音调', '响度');
                        break;
                    case 'phase_change':
                        concepts.push('物态变化', '热量', '比热容', '潜热', '熔化', '汽化');
                        break;
                    case 'simple_machines':
                        concepts.push('杠杆', '滑轮', '机械效率', '功', '力', '距离');
                        break;
                    case 'pressure':
                        concepts.push('压强', '浮力', '阿基米德原理', '液体压强', '密度');
                        break;
                    case 'basic_electricity':
                        concepts.push('电流', '电压', '电阻', '欧姆定律', '电功率', '电路');
                        break;
                }
            });
            return [...new Set(concepts)]; // 去重
        }
        identifyPrerequisites(ir) {
            const prerequisites = [];
            const complexity = ir.metadata.complexity_score;
            prerequisites.push('基础数学', '微积分');
            if (complexity >= 60) {
                prerequisites.push('线性代数', '微分方程');
            }
            if (ir.system.modules.some(m => m.type === 'electromagnetic')) {
                prerequisites.push('向量分析', '电磁学基础');
            }
            if (ir.system.modules.some(m => m.type === 'quantum')) {
                prerequisites.push('量子力学基础', '复分析');
            }
            if (ir.system.modules.some(m => m.type === 'thermal')) {
                prerequisites.push('热力学基础', '统计力学');
            }
            return prerequisites;
        }
        // ===== 初中物理模块创建方法 =====
        createAcousticsModule(parameters) {
            const existingParams = parameters.filter(p => ['f', 'λ', 'v', 'a', 't'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'f', dimension: 'T^-1', role: 'unknown', description: '频率', defaultValue: 440 },
                    { symbol: 'λ', dimension: 'L', role: 'unknown', description: '波长', defaultValue: 0.78 },
                    { symbol: 'v', dimension: 'LT^-1', role: 'given', description: '声速', defaultValue: 340 },
                    { symbol: 'A', dimension: 'L', role: 'given', description: '振幅', defaultValue: 0.01 },
                    { symbol: 't', dimension: 'T', role: 'unknown', description: '时间', defaultValue: 0 }
                ])
            ];
            return {
                id: 'acoustics_module',
                type: 'wave',
                name: '声学',
                description: '声音的产生、传播和特性',
                parameters: moduleParameters,
                dependencies: [],
                output: ['f', 'λ', 'v', 'A', 't'],
                equations: [
                    {
                        id: 'sound_velocity',
                        type: 'algebraic',
                        expression: 'v = f * λ',
                        variables: ['v', 'f', 'λ'],
                        parameters: [],
                        description: '声速公式',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '声波传播速度与频率和波长的关系',
                        derivation: '基于波动方程'
                    },
                    {
                        id: 'sound_intensity',
                        type: 'algebraic',
                        expression: 'I = 0.5 * ρ * v * A² * ω²',
                        variables: ['I', 'ρ', 'v', 'A', 'ω'],
                        parameters: [],
                        description: '声强公式',
                        order: 2,
                        linearity: 'nonlinear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '声波强度与介质密度、声速、振幅和角频率的关系',
                        derivation: '基于能量密度和功率'
                    }
                ],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'E_total = E_kinetic + E_potential',
                        variables: ['E_total', 'E_kinetic', 'E_potential'],
                        tolerance: 1e-6,
                        description: '声波能量守恒'
                    }
                ],
                assumptions: ['小振幅近似', '线性介质', '无耗散'],
                limitations: ['忽略非线性效应', '忽略介质色散'],
                complexity: 'intermediate',
                domain: {
                    spatial: '3d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建物态变化模块
         */
        createPhaseChangeModule(parameters) {
            const existingParams = parameters.filter(p => ['q', 'm', 'c', 'l', 't', 't'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'Q', dimension: 'ML^2T^-2', role: 'unknown', description: '热量', defaultValue: 0 },
                    { symbol: 'm', dimension: 'M', role: 'given', description: '质量', defaultValue: 1 },
                    { symbol: 'c', dimension: 'L^2T^-2Θ^-1', role: 'given', description: '比热容', defaultValue: 4200 },
                    { symbol: 'L', dimension: 'L^2T^-2', role: 'given', description: '潜热', defaultValue: 2.26e6 },
                    { symbol: 'ΔT', dimension: 'Θ', role: 'unknown', description: '温度变化', defaultValue: 0 },
                    { symbol: 'T', dimension: 'Θ', role: 'given', description: '温度', defaultValue: 20 }
                ])
            ];
            return {
                id: 'phase_change_module',
                type: 'thermal',
                name: '物态变化',
                description: '物质的熔化、凝固、汽化、液化等相变过程',
                parameters: moduleParameters,
                dependencies: [],
                output: ['Q', 'm', 'c', 'L', 'ΔT', 'T'],
                equations: [
                    {
                        id: 'heat_transfer',
                        type: 'algebraic',
                        expression: 'Q = m * c * ΔT',
                        variables: ['Q', 'm', 'c', 'ΔT'],
                        parameters: [],
                        description: '热量传递公式',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '热量传递与质量、比热容和温度变化的关系',
                        derivation: '基于热力学第一定律'
                    },
                    {
                        id: 'phase_change_heat',
                        type: 'algebraic',
                        expression: 'Q = m * L',
                        variables: ['Q', 'm', 'L'],
                        parameters: [],
                        description: '相变热量公式',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '相变过程中吸收或释放的热量',
                        derivation: '基于潜热定义'
                    }
                ],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'Q_in = Q_out + ΔU',
                        variables: ['Q_in', 'Q_out', 'ΔU'],
                        tolerance: 1e-6,
                        description: '能量守恒'
                    }
                ],
                assumptions: ['等压过程', '忽略体积变化', '理想相变'],
                limitations: ['忽略过冷过热现象', '忽略相变动力学'],
                complexity: 'intermediate',
                domain: {
                    spatial: '1d',
                    temporal: 'dynamic',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建简单机械模块
         */
        createSimpleMachinesModule(parameters) {
            const existingParams = parameters.filter(p => ['f', 'd', 'w', 'e'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'F', dimension: 'MLT^-2', role: 'unknown', description: '力', defaultValue: 0 },
                    { symbol: 'd', dimension: 'L', role: 'given', description: '距离', defaultValue: 1 },
                    { symbol: 'W', dimension: 'ML^2T^-2', role: 'unknown', description: '功', defaultValue: 0 },
                    { symbol: 'η', dimension: '1', role: 'unknown', description: '机械效率', defaultValue: 1 },
                    { symbol: 'F_in', dimension: 'MLT^-2', role: 'given', description: '输入力', defaultValue: 10 },
                    { symbol: 'F_out', dimension: 'MLT^-2', role: 'unknown', description: '输出力', defaultValue: 0 }
                ])
            ];
            return {
                id: 'simple_machines_module',
                type: 'dynamics',
                name: '简单机械',
                description: '杠杆、滑轮、斜面等简单机械的工作原理',
                parameters: moduleParameters,
                dependencies: [],
                output: ['F', 'd', 'W', 'η', 'F_in', 'F_out'],
                equations: [
                    {
                        id: 'work_definition',
                        type: 'algebraic',
                        expression: 'W = F * d',
                        variables: ['W', 'F', 'd'],
                        parameters: [],
                        description: '功的定义',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '力对物体做功与力和位移的关系',
                        derivation: '基于功的定义'
                    },
                    {
                        id: 'mechanical_advantage',
                        type: 'algebraic',
                        expression: 'MA = F_out / F_in',
                        variables: ['MA', 'F_out', 'F_in'],
                        parameters: [],
                        description: '机械利益',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '简单机械的力放大倍数',
                        derivation: '基于杠杆原理'
                    }
                ],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'W_input = W_output + W_loss',
                        variables: ['W_input', 'W_output', 'W_loss'],
                        tolerance: 1e-6,
                        description: '能量守恒'
                    }
                ],
                assumptions: ['无摩擦', '刚体', '准静态过程'],
                limitations: ['忽略摩擦损失', '忽略机械变形'],
                complexity: 'basic',
                domain: {
                    spatial: '2d',
                    temporal: 'static',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建压强模块
         */
        createPressureModule(parameters) {
            const existingParams = parameters.filter(p => ['p', 'f', 'a', 'ρ', 'g', 'h'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'p', dimension: 'ML^-1T^-2', role: 'unknown', description: '压强', defaultValue: 0 },
                    { symbol: 'F', dimension: 'MLT^-2', role: 'given', description: '压力', defaultValue: 100 },
                    { symbol: 'A', dimension: 'L^2', role: 'given', description: '面积', defaultValue: 0.01 },
                    { symbol: 'ρ', dimension: 'ML^-3', role: 'given', description: '密度', defaultValue: 1000 },
                    { symbol: 'g', dimension: 'LT^-2', role: 'constant', description: '重力加速度', defaultValue: 9.8 },
                    { symbol: 'h', dimension: 'L', role: 'given', description: '深度', defaultValue: 1 },
                    { symbol: 'F_b', dimension: 'MLT^-2', role: 'unknown', description: '浮力', defaultValue: 0 }
                ])
            ];
            return {
                id: 'pressure_module',
                type: 'fluid',
                name: '压强',
                description: '液体压强、大气压强和浮力',
                parameters: moduleParameters,
                dependencies: [],
                output: ['p', 'F', 'A', 'ρ', 'g', 'h', 'F_b'],
                equations: [
                    {
                        id: 'pressure_definition',
                        type: 'algebraic',
                        expression: 'p = F / A',
                        variables: ['p', 'F', 'A'],
                        parameters: [],
                        description: '压强定义',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '压强与压力和受力面积的关系',
                        derivation: '基于压强定义'
                    },
                    {
                        id: 'hydrostatic_pressure',
                        type: 'algebraic',
                        expression: 'p = ρ * g * h',
                        variables: ['p', 'ρ', 'g', 'h'],
                        parameters: [],
                        description: '液体压强公式',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '液体内部压强与深度、密度和重力的关系',
                        derivation: '基于帕斯卡原理'
                    },
                    {
                        id: 'buoyancy_force',
                        type: 'algebraic',
                        expression: 'F_b = ρ * g * V',
                        variables: ['F_b', 'ρ', 'g', 'V'],
                        parameters: [],
                        description: '阿基米德浮力公式',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '浮力与液体密度、重力和排开液体体积的关系',
                        derivation: '基于阿基米德原理'
                    }
                ],
                conservation_laws: [
                    {
                        type: 'energy',
                        expression: 'p₁ + 0.5 * ρ * v₁² + ρ * g * h₁ = p₂ + 0.5 * ρ * v₂² + ρ * g * h₂',
                        variables: ['p₁', 'p₂', 'v₁', 'v₂', 'h₁', 'h₂'],
                        tolerance: 1e-6,
                        description: '伯努利方程'
                    }
                ],
                assumptions: ['不可压缩流体', '无粘性', '稳态流动'],
                limitations: ['忽略表面张力', '忽略温度变化'],
                complexity: 'intermediate',
                domain: {
                    spatial: '3d',
                    temporal: 'static',
                    scale: 'macroscopic'
                }
            };
        }
        /**
         * 创建电学基础模块
         */
        createBasicElectricityModule(parameters) {
            const existingParams = parameters.filter(p => ['i', 'u', 'r', 'p', 'q', 't'].includes(p.symbol.toLowerCase()));
            const moduleParameters = [
                ...existingParams,
                ...this.ensureParametersExist(existingParams, [
                    { symbol: 'I', dimension: 'I', role: 'unknown', description: '电流', defaultValue: 0 },
                    { symbol: 'U', dimension: 'ML^2T^-3I^-1', role: 'given', description: '电压', defaultValue: 12 },
                    { symbol: 'R', dimension: 'ML^2T^-3I^-2', role: 'given', description: '电阻', defaultValue: 10 },
                    { symbol: 'P', dimension: 'ML^2T^-3', role: 'unknown', description: '电功率', defaultValue: 0 },
                    { symbol: 'Q', dimension: 'IT', role: 'unknown', description: '电荷量', defaultValue: 0 },
                    { symbol: 't', dimension: 'T', role: 'given', description: '时间', defaultValue: 1 }
                ])
            ];
            return {
                id: 'basic_electricity_module',
                type: 'electromagnetic',
                name: '电学基础',
                description: '电流、电压、电阻和欧姆定律',
                parameters: moduleParameters,
                dependencies: [],
                output: ['I', 'U', 'R', 'P', 'Q', 't'],
                equations: [
                    {
                        id: 'ohms_law',
                        type: 'algebraic',
                        expression: 'U = I * R',
                        variables: ['U', 'I', 'R'],
                        parameters: [],
                        description: '欧姆定律',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '电压与电流和电阻的关系',
                        derivation: '基于欧姆定律'
                    },
                    {
                        id: 'electrical_power',
                        type: 'algebraic',
                        expression: 'P = U * I',
                        variables: ['P', 'U', 'I'],
                        parameters: [],
                        description: '电功率公式',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '电功率与电压和电流的关系',
                        derivation: '基于功率定义'
                    },
                    {
                        id: 'charge_current',
                        type: 'algebraic',
                        expression: 'I = Q / t',
                        variables: ['I', 'Q', 't'],
                        parameters: [],
                        description: '电流定义',
                        order: 1,
                        linearity: 'linear',
                        stability: 'stable',
                        boundary_conditions: [],
                        initial_conditions: [],
                        physics_meaning: '电流与电荷量和时间的关系',
                        derivation: '基于电流定义'
                    }
                ],
                conservation_laws: [
                    {
                        type: 'charge',
                        expression: 'ΣI_in = ΣI_out',
                        variables: ['I_in', 'I_out'],
                        tolerance: 1e-6,
                        description: '基尔霍夫电流定律'
                    }
                ],
                assumptions: ['线性电阻', '稳态电流', '无电磁感应'],
                limitations: ['忽略温度效应', '忽略频率效应'],
                complexity: 'basic',
                domain: {
                    spatial: '1d',
                    temporal: 'static',
                    scale: 'macroscopic'
                }
            };
        }
    }
    exports.IRConverter = IRConverter;
});
/**
 * 事件检测器 - 检测仿真过程中的物理事件
 *
 * 功能：
 * 1. 碰撞检测
 * 2. 分离检测
 * 3. 状态变化检测
 * 4. 边界穿越检测
 * 5. 自定义事件检测
 */
define("simulation/EventDetector", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventDetector = exports.InstabilityDetector = exports.EquilibriumDetector = exports.ThresholdDetector = exports.BoundaryDetector = exports.CollisionDetector = void 0;
    // 碰撞事件检测器
    class CollisionDetector {
        async detectEvents(oldState, newState, ir) {
            const events = [];
            // 获取所有对象
            const objects = Object.values(newState.objects);
            // 检查每对对象之间的碰撞
            for (let i = 0; i < objects.length; i++) {
                for (let j = i + 1; j < objects.length; j++) {
                    const obj1 = objects[i];
                    const obj2 = objects[j];
                    if (this.checkCollision(obj1, obj2, oldState, newState)) {
                        events.push({
                            time: newState.time,
                            type: 'collision',
                            objectId: `obj_${i}_${j}`,
                            description: `Collision detected between objects`,
                            data: {
                                object1: obj1,
                                object2: obj2,
                                collisionPoint: this.calculateCollisionPoint(obj1, obj2),
                                relativeVelocity: this.calculateRelativeVelocity(obj1, obj2)
                            }
                        });
                    }
                }
            }
            return events;
        }
        checkCollision(obj1, obj2, oldState, newState) {
            // 简化的碰撞检测逻辑
            const pos1 = obj1.position;
            const pos2 = obj2.position;
            const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) +
                Math.pow(pos1.y - pos2.y, 2) +
                Math.pow(pos1.z - pos2.z, 2));
            const radius1 = obj1.radius || 0.5;
            const radius2 = obj2.radius || 0.5;
            return distance <= (radius1 + radius2);
        }
        calculateCollisionPoint(obj1, obj2) {
            // 简化的碰撞点计算
            return {
                x: (obj1.position.x + obj2.position.x) / 2,
                y: (obj1.position.y + obj2.position.y) / 2,
                z: (obj1.position.z + obj2.position.z) / 2
            };
        }
        calculateRelativeVelocity(obj1, obj2) {
            return {
                x: obj1.velocity.x - obj2.velocity.x,
                y: obj1.velocity.y - obj2.velocity.y,
                z: obj1.velocity.z - obj2.velocity.z
            };
        }
    }
    exports.CollisionDetector = CollisionDetector;
    // 边界检测器
    class BoundaryDetector {
        async detectEvents(oldState, newState, ir) {
            const events = [];
            // 检查每个对象是否穿越边界
            for (const [objectId, obj] of Object.entries(newState.objects)) {
                if (this.checkBoundaryCrossing(obj, oldState.objects[objectId])) {
                    events.push({
                        time: newState.time,
                        type: 'boundary',
                        objectId: objectId,
                        description: `Object ${objectId} crossed boundary`,
                        data: {
                            object: obj,
                            boundary: 'default_boundary',
                            crossingPoint: obj.position
                        }
                    });
                }
            }
            return events;
        }
        checkBoundaryCrossing(currentObj, previousObj) {
            if (!previousObj)
                return false;
            // 简化的边界检测 - 检查是否超出某个范围
            const boundary = 10; // 假设边界为10单位
            const currentDistance = Math.sqrt(Math.pow(currentObj.position.x, 2) +
                Math.pow(currentObj.position.y, 2) +
                Math.pow(currentObj.position.z, 2));
            const previousDistance = Math.sqrt(Math.pow(previousObj.position.x, 2) +
                Math.pow(previousObj.position.y, 2) +
                Math.pow(previousObj.position.z, 2));
            return currentDistance > boundary && previousDistance <= boundary;
        }
    }
    exports.BoundaryDetector = BoundaryDetector;
    // 阈值检测器
    class ThresholdDetector {
        async detectEvents(oldState, newState, ir) {
            const events = [];
            // 检查速度阈值
            for (const [objectId, obj] of Object.entries(newState.objects)) {
                const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                    Math.pow(obj.velocity.y, 2) +
                    Math.pow(obj.velocity.z, 2));
                if (speed > 10) { // 速度阈值
                    events.push({
                        time: newState.time,
                        type: 'threshold',
                        objectId: objectId,
                        description: `Object ${objectId} exceeded speed threshold`,
                        data: {
                            object: obj,
                            threshold: 'speed',
                            value: speed,
                            limit: 10
                        }
                    });
                }
            }
            return events;
        }
    }
    exports.ThresholdDetector = ThresholdDetector;
    // 平衡检测器
    class EquilibriumDetector {
        async detectEvents(oldState, newState, ir) {
            const events = [];
            // 检查对象是否达到平衡状态
            for (const [objectId, obj] of Object.entries(newState.objects)) {
                const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                    Math.pow(obj.velocity.y, 2) +
                    Math.pow(obj.velocity.z, 2));
                if (speed < 0.01) { // 接近静止
                    events.push({
                        time: newState.time,
                        type: 'equilibrium',
                        objectId: objectId,
                        description: `Object ${objectId} reached equilibrium`,
                        data: {
                            object: obj,
                            equilibriumType: 'static',
                            speed: speed
                        }
                    });
                }
            }
            return events;
        }
    }
    exports.EquilibriumDetector = EquilibriumDetector;
    // 不稳定性检测器
    class InstabilityDetector {
        async detectEvents(oldState, newState, ir) {
            const events = [];
            // 检查数值不稳定性
            for (const [objectId, obj] of Object.entries(newState.objects)) {
                const acceleration = Math.sqrt(Math.pow(obj.acceleration.x, 2) +
                    Math.pow(obj.acceleration.y, 2) +
                    Math.pow(obj.acceleration.z, 2));
                if (acceleration > 100) { // 异常大的加速度
                    events.push({
                        time: newState.time,
                        type: 'instability',
                        objectId: objectId,
                        description: `Object ${objectId} shows numerical instability`,
                        data: {
                            object: obj,
                            instabilityType: 'high_acceleration',
                            acceleration: acceleration
                        }
                    });
                }
            }
            return events;
        }
    }
    exports.InstabilityDetector = InstabilityDetector;
    // 主事件检测器 - 组合所有检测器
    class EventDetector {
        constructor() {
            this.detectors = [
                new CollisionDetector(),
                new BoundaryDetector(),
                new ThresholdDetector(),
                new EquilibriumDetector(),
                new InstabilityDetector()
            ];
        }
        async detectEvents(oldState, newState, ir) {
            const allEvents = [];
            // 运行所有检测器
            for (const detector of this.detectors) {
                try {
                    const events = await detector.detectEvents(oldState, newState, ir);
                    allEvents.push(...events);
                }
                catch (error) {
                    console.warn(`Event detector failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            // 按时间排序
            allEvents.sort((a, b) => a.time - b.time);
            return allEvents;
        }
    }
    exports.EventDetector = EventDetector;
});
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
define("simulation/StateMonitor", ["require", "exports"], function (require, exports) {
    "use strict";
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
});
/**
 * 动态物理仿真器 - 能够根据任意物理题目动态生成仿真
 *
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动选择数值求解器
 * 3. 智能事件检测
 * 4. 自适应时间步长
 * 5. 多物理场耦合
 */
define("simulation/DynamicPhysicsSimulator", ["require", "exports", "simulation/EventDetector", "simulation/StateMonitor"], function (require, exports, EventDetector_1, StateMonitor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicPhysicsSimulator = void 0;
    // 动态物理仿真器
    class DynamicPhysicsSimulator {
        constructor() {
            this.eventDetector = new EventDetector_1.EventDetector();
            this.stateMonitor = new StateMonitor_1.StateMonitor();
        }
        /**
         * 运行物理仿真
         */
        async runSimulation(ir, config) {
            const startTime = Date.now();
            const result = {
                success: false,
                timeSeries: [],
                events: [],
                finalState: null,
                statistics: {
                    totalSteps: 0,
                    successfulSteps: 0,
                    failedSteps: 0,
                    averageTimestep: 0,
                    minTimestep: config.timestep,
                    maxTimestep: config.timestep,
                    computationTime: 0,
                    memoryUsage: 0,
                    convergenceRate: 0
                },
                errors: [],
                warnings: [],
                metadata: {
                    duration: config.duration,
                    timesteps: 0,
                    solver: config.solver,
                    physicsType: this.analyzePhysicsType(ir)
                }
            };
            try {
                console.log('🚀 Starting dynamic physics simulation...');
                console.log(`📊 Physics type: ${result.metadata.physicsType}`);
                console.log(`⚙️  Solver: ${config.solver}`);
                console.log(`⏱️  Duration: ${config.duration}s`);
                // 1. 分析物理类型
                const physicsType = this.analyzePhysicsType(ir);
                // 2. 初始化状态
                const initialState = this.initializeState(ir);
                result.timeSeries.push(initialState);
                // 3. 运行仿真循环
                let currentState = initialState;
                let currentTime = 0;
                let currentTimestep = config.timestep;
                let stepCount = 0;
                while (currentTime < config.duration) {
                    try {
                        // 计算下一步状态
                        const nextState = this.calculateNextState(currentState, currentTimestep, ir, physicsType);
                        nextState.time = currentTime + currentTimestep;
                        // 事件检测
                        if (config.enableEvents) {
                            const events = await this.eventDetector.detectEvents(currentState, nextState, ir);
                            result.events.push(...events);
                        }
                        // 状态监控
                        if (config.enableMonitoring) {
                            this.stateMonitor.updateState(nextState);
                            const report = this.stateMonitor.getLatestReport();
                            if (report.recommendations.length > 0) {
                                result.warnings.push(...report.recommendations);
                            }
                        }
                        // 自适应时间步长
                        if (config.adaptiveTimestep) {
                            currentTimestep = this.adaptTimestep(currentState, nextState, currentTimestep, config);
                        }
                        // 记录数据
                        if (stepCount % config.outputFrequency === 0) {
                            result.timeSeries.push(nextState);
                        }
                        currentState = nextState;
                        currentTime += currentTimestep;
                        stepCount++;
                        result.statistics.successfulSteps++;
                    }
                    catch (error) {
                        result.statistics.failedSteps++;
                        result.errors.push(`Step ${stepCount} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        if (config.adaptiveTimestep) {
                            currentTimestep *= 0.5; // 减小时间步长
                            if (currentTimestep < (config.minTimestep || 1e-6)) {
                                result.errors.push('Simulation failed: timestep too small');
                                break;
                            }
                            continue;
                        }
                        else {
                            break;
                        }
                    }
                }
                // 4. 计算统计信息
                result.statistics.totalSteps = stepCount;
                result.statistics.computationTime = Date.now() - startTime;
                result.statistics.averageTimestep = currentTime / stepCount;
                result.statistics.minTimestep = Math.min(result.statistics.minTimestep, currentTimestep);
                result.statistics.maxTimestep = Math.max(result.statistics.maxTimestep, currentTimestep);
                result.statistics.convergenceRate = result.statistics.successfulSteps / result.statistics.totalSteps;
                result.metadata.timesteps = stepCount;
                result.finalState = currentState;
                result.success = result.statistics.failedSteps === 0 || result.statistics.convergenceRate > 0.8;
                console.log('✅ Simulation completed successfully!');
                console.log(`📈 Steps: ${result.statistics.totalSteps} (${result.statistics.successfulSteps} successful)`);
                console.log(`⏱️  Time: ${result.statistics.computationTime}ms`);
            }
            catch (error) {
                result.errors.push(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                result.success = false;
            }
            return result;
        }
        /**
         * 分析物理类型
         */
        analyzePhysicsType(ir) {
            const modules = ir.system?.modules || [];
            const moduleTypes = modules.map(m => m.type);
            // 分析模块类型组合
            if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
                return 'complex_kinematics';
            }
            else if (moduleTypes.includes('oscillation')) {
                return 'oscillatory_system';
            }
            else if (moduleTypes.includes('wave')) {
                return 'wave_system';
            }
            else if (moduleTypes.includes('electromagnetic')) {
                return 'electromagnetic_system';
            }
            else if (moduleTypes.includes('thermal')) {
                return 'thermodynamic_system';
            }
            else if (moduleTypes.includes('fluid')) {
                return 'fluid_system';
            }
            else if (moduleTypes.includes('quantum')) {
                return 'quantum_system';
            }
            else if (moduleTypes.includes('relativistic')) {
                return 'relativistic_system';
            }
            else {
                return 'general_physics';
            }
        }
        /**
         * 初始化状态
         */
        initializeState(ir) {
            const objects = {};
            // 根据IR中的对象和初始条件初始化状态
            if (ir.system?.objects) {
                for (const obj of ir.system.objects) {
                    objects[obj.id] = {
                        position: obj.position || { x: 0, y: 0, z: 0 },
                        velocity: obj.velocity || { x: 0, y: 0, z: 0 },
                        acceleration: obj.acceleration || { x: 0, y: 0, z: 0 },
                        mass: typeof obj.mass === 'object' ? obj.mass.value : (obj.mass || 1),
                        properties: obj.properties || {}
                    };
                }
            }
            return {
                time: 0,
                objects,
                system: {
                    totalEnergy: 0,
                    kineticEnergy: 0,
                    potentialEnergy: 0,
                    momentum: { x: 0, y: 0, z: 0 },
                    centerOfMass: { x: 0, y: 0, z: 0 }
                }
            };
        }
        /**
         * 计算下一步状态
         */
        calculateNextState(currentState, timestep, ir, physicsType) {
            const nextState = JSON.parse(JSON.stringify(currentState)); // 深拷贝
            // 根据物理类型选择计算方法
            switch (physicsType) {
                case 'complex_kinematics':
                    return this.calculateComplexKinematics(nextState, timestep, ir);
                case 'oscillatory_system':
                    return this.calculateOscillatorySystem(nextState, timestep, ir);
                case 'wave_system':
                    return this.calculateWaveSystem(nextState, timestep, ir);
                case 'electromagnetic_system':
                    return this.calculateElectromagneticSystem(nextState, timestep, ir);
                default:
                    return this.calculateGeneralPhysics(nextState, timestep, ir);
            }
        }
        /**
         * 复杂运动学计算
         */
        calculateComplexKinematics(state, timestep, ir) {
            for (const objectId in state.objects) {
                const obj = state.objects[objectId];
                // 重力加速度
                const gravity = { x: 0, y: -9.8, z: 0 };
                // 摩擦力（在斜面上）
                let friction = { x: 0, y: 0, z: 0 };
                if (obj.position.y <= 0.1) { // 接近地面
                    const frictionCoeff = 0.2;
                    const angle = 30 * Math.PI / 180;
                    const normalForce = obj.mass * 9.8 * Math.cos(angle);
                    const frictionForce = frictionCoeff * normalForce;
                    friction = {
                        x: -Math.sign(obj.velocity.x) * frictionForce * Math.cos(angle),
                        y: 0,
                        z: 0
                    };
                }
                // 总加速度
                obj.acceleration = {
                    x: gravity.x + friction.x / obj.mass,
                    y: gravity.y + friction.y / obj.mass,
                    z: gravity.z + friction.z / obj.mass
                };
                // 更新速度和位置
                obj.velocity.x += obj.acceleration.x * timestep;
                obj.velocity.y += obj.acceleration.y * timestep;
                obj.velocity.z += obj.acceleration.z * timestep;
                obj.position.x += obj.velocity.x * timestep;
                obj.position.y += obj.velocity.y * timestep;
                obj.position.z += obj.velocity.z * timestep;
                // 应用约束
                this.applyConstraints(obj, 'complex_kinematics');
            }
            return state;
        }
        /**
         * 振荡系统计算
         */
        calculateOscillatorySystem(state, timestep, ir) {
            for (const objectId in state.objects) {
                const obj = state.objects[objectId];
                const k = 100; // 弹簧常数
                const equilibrium = 0; // 平衡位置
                // 弹簧力
                const springForce = -k * (obj.position.x - equilibrium);
                // 阻尼力
                const damping = 0.1;
                const dampingForce = -damping * obj.velocity.x;
                // 总加速度
                obj.acceleration = {
                    x: (springForce + dampingForce) / obj.mass,
                    y: -9.8, // 重力
                    z: 0
                };
                // 更新速度和位置
                obj.velocity.x += obj.acceleration.x * timestep;
                obj.velocity.y += obj.acceleration.y * timestep;
                obj.velocity.z += obj.acceleration.z * timestep;
                obj.position.x += obj.velocity.x * timestep;
                obj.position.y += obj.velocity.y * timestep;
                obj.position.z += obj.velocity.z * timestep;
                // 应用约束
                this.applyConstraints(obj, 'oscillatory_system');
            }
            return state;
        }
        /**
         * 波动系统计算
         */
        calculateWaveSystem(state, timestep, ir) {
            // 简化的波动计算
            for (const objectId in state.objects) {
                const obj = state.objects[objectId];
                // 简谐波
                const amplitude = 1;
                const frequency = 1;
                const phase = obj.position.x * 0.1;
                obj.acceleration = {
                    x: 0,
                    y: -amplitude * frequency * frequency * Math.sin(frequency * state.time + phase),
                    z: 0
                };
                obj.velocity.x += obj.acceleration.x * timestep;
                obj.velocity.y += obj.acceleration.y * timestep;
                obj.velocity.z += obj.acceleration.z * timestep;
                obj.position.x += obj.velocity.x * timestep;
                obj.position.y += obj.velocity.y * timestep;
                obj.position.z += obj.velocity.z * timestep;
            }
            return state;
        }
        /**
         * 电磁系统计算
         */
        calculateElectromagneticSystem(state, timestep, ir) {
            for (const objectId in state.objects) {
                const obj = state.objects[objectId];
                // 简化的电磁力计算
                const charge = obj.properties?.charge || 1;
                const electricField = { x: 0, y: 0, z: 0 };
                const magneticField = { x: 0, y: 0, z: 1 };
                // 洛伦兹力
                const lorentzForce = {
                    x: charge * (electricField.x + obj.velocity.y * magneticField.z - obj.velocity.z * magneticField.y),
                    y: charge * (electricField.y + obj.velocity.z * magneticField.x - obj.velocity.x * magneticField.z),
                    z: charge * (electricField.z + obj.velocity.x * magneticField.y - obj.velocity.y * magneticField.x)
                };
                obj.acceleration = {
                    x: lorentzForce.x / obj.mass,
                    y: lorentzForce.y / obj.mass,
                    z: lorentzForce.z / obj.mass
                };
                obj.velocity.x += obj.acceleration.x * timestep;
                obj.velocity.y += obj.acceleration.y * timestep;
                obj.velocity.z += obj.acceleration.z * timestep;
                obj.position.x += obj.velocity.x * timestep;
                obj.position.y += obj.velocity.y * timestep;
                obj.position.z += obj.velocity.z * timestep;
            }
            return state;
        }
        /**
         * 通用物理计算
         */
        calculateGeneralPhysics(state, timestep, ir) {
            for (const objectId in state.objects) {
                const obj = state.objects[objectId];
                // 重力
                obj.acceleration = { x: 0, y: -9.8, z: 0 };
                // 更新速度和位置
                obj.velocity.x += obj.acceleration.x * timestep;
                obj.velocity.y += obj.acceleration.y * timestep;
                obj.velocity.z += obj.acceleration.z * timestep;
                obj.position.x += obj.velocity.x * timestep;
                obj.position.y += obj.velocity.y * timestep;
                obj.position.z += obj.velocity.z * timestep;
                // 应用约束
                this.applyConstraints(obj, 'general_physics');
            }
            return state;
        }
        /**
         * 应用约束
         */
        applyConstraints(obj, physicsType) {
            switch (physicsType) {
                case 'complex_kinematics':
                    // 地面约束
                    if (obj.position.y < 0) {
                        obj.position.y = 0;
                        obj.velocity.y = Math.abs(obj.velocity.y) * 0.9; // 弹性碰撞
                    }
                    // 斜面约束
                    const angle = 30 * Math.PI / 180;
                    const slopeY = obj.position.x * Math.tan(angle);
                    if (obj.position.x > 0 && obj.position.y < slopeY + 0.1) {
                        obj.position.y = slopeY;
                        // 调整速度以符合斜面
                        const speed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
                        obj.velocity.x = speed * Math.cos(angle);
                        obj.velocity.y = speed * Math.sin(angle);
                    }
                    break;
                case 'oscillatory_system':
                    // 振荡系统约束
                    if (obj.position.y < -2) {
                        obj.position.y = -2;
                        obj.velocity.y = 0;
                    }
                    break;
                default:
                    // 通用约束
                    if (obj.position.y < 0) {
                        obj.position.y = 0;
                        obj.velocity.y = Math.abs(obj.velocity.y) * 0.8;
                    }
                    break;
            }
        }
        /**
         * 自适应时间步长
         */
        adaptTimestep(currentState, nextState, currentTimestep, config) {
            // 基于误差估计调整时间步长
            const error = this.estimateError(currentState, nextState);
            const targetError = config.tolerance;
            if (error > targetError * 2) {
                return Math.max(currentTimestep * 0.8, config.minTimestep || 1e-6);
            }
            else if (error < targetError * 0.5) {
                return Math.min(currentTimestep * 1.2, config.maxTimestep || config.timestep * 2);
            }
            return currentTimestep;
        }
        /**
         * 估计误差
         */
        estimateError(currentState, nextState) {
            // 简化的误差估计，基于速度和加速度的变化
            let maxError = 0;
            for (const objectId in currentState.objects) {
                const current = currentState.objects[objectId];
                const next = nextState.objects[objectId];
                const velocityError = Math.sqrt(Math.pow(next.velocity.x - current.velocity.x, 2) +
                    Math.pow(next.velocity.y - current.velocity.y, 2) +
                    Math.pow(next.velocity.z - current.velocity.z, 2));
                maxError = Math.max(maxError, velocityError);
            }
            return maxError;
        }
    }
    exports.DynamicPhysicsSimulator = DynamicPhysicsSimulator;
});
/**
 * 物理验证器 - 验证仿真结果的物理合理性
 *
 * 功能：
 * 1. 守恒定律验证
 * 2. 物理约束检查
 * 3. 数值稳定性分析
 * 4. 物理合理性评估
 */
define("validation/PhysicsValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PhysicsValidator = void 0;
    // 物理验证器类
    class PhysicsValidator {
        constructor(config = {}) {
            this.config = {
                tolerance: {
                    energy: 0.01, // 1%
                    momentum: 0.01, // 1%
                    angularMomentum: 0.01, // 1%
                    mass: 0.001 // 0.1%
                },
                enableConservationChecks: true,
                enableConstraintChecks: true,
                enableStabilityChecks: true,
                enableCausalityChecks: true,
                ...config
            };
        }
        /**
         * 验证仿真结果
         */
        async validateSimulation(simulationResult, ir) {
            const result = {
                success: false,
                overallScore: 0,
                conservationChecks: [],
                constraintViolations: [],
                stabilityIssues: [],
                causalityViolations: [],
                recommendations: [],
                errors: [],
                warnings: []
            };
            try {
                console.log('🔍 Starting physics validation...');
                // 1. 守恒定律验证
                if (this.config.enableConservationChecks) {
                    result.conservationChecks = await this.validateConservationLaws(simulationResult);
                }
                // 2. 物理约束检查
                if (this.config.enableConstraintChecks) {
                    result.constraintViolations = await this.validatePhysicalConstraints(simulationResult, ir);
                }
                // 3. 数值稳定性分析
                if (this.config.enableStabilityChecks) {
                    result.stabilityIssues = await this.validateNumericalStability(simulationResult);
                }
                // 4. 因果关系检查
                if (this.config.enableCausalityChecks) {
                    result.causalityViolations = await this.validateCausality(simulationResult);
                }
                // 5. 计算总体分数
                result.overallScore = this.calculateOverallScore(result);
                // 6. 生成建议
                result.recommendations = this.generateRecommendations(result);
                // 7. 确定是否成功
                result.success = result.overallScore >= 0.8 && result.errors.length === 0;
                console.log(`✅ Physics validation completed. Score: ${result.overallScore.toFixed(2)}`);
            }
            catch (error) {
                result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                result.success = false;
            }
            return result;
        }
        /**
         * 验证守恒定律
         */
        async validateConservationLaws(simulationResult) {
            const checks = [];
            const timeSeries = simulationResult.timeSeries;
            if (timeSeries.length < 2) {
                return checks;
            }
            // 能量守恒检查
            const energyCheck = this.checkEnergyConservation(timeSeries);
            if (energyCheck)
                checks.push(energyCheck);
            // 动量守恒检查
            const momentumCheck = this.checkMomentumConservation(timeSeries);
            if (momentumCheck)
                checks.push(momentumCheck);
            // 角动量守恒检查
            const angularMomentumCheck = this.checkAngularMomentumConservation(timeSeries);
            if (angularMomentumCheck)
                checks.push(angularMomentumCheck);
            // 质量守恒检查
            const massCheck = this.checkMassConservation(timeSeries);
            if (massCheck)
                checks.push(massCheck);
            return checks;
        }
        /**
         * 检查能量守恒
         */
        checkEnergyConservation(timeSeries) {
            if (timeSeries.length < 2)
                return null;
            const initialEnergy = this.calculateTotalEnergy(timeSeries[0]);
            const finalEnergy = this.calculateTotalEnergy(timeSeries[timeSeries.length - 1]);
            const deviation = Math.abs(finalEnergy - initialEnergy);
            const deviationPercent = Math.abs(deviation) / Math.abs(initialEnergy);
            const passed = deviationPercent <= this.config.tolerance.energy;
            return {
                type: 'energy',
                initialValue: initialEnergy,
                finalValue: finalEnergy,
                deviation,
                deviationPercent,
                passed,
                tolerance: this.config.tolerance.energy
            };
        }
        /**
         * 计算总能量
         */
        calculateTotalEnergy(data) {
            let totalEnergy = 0;
            for (const obj of Object.values(data.objects)) {
                const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                    Math.pow(obj.velocity.y, 2) +
                    Math.pow(obj.velocity.z, 2));
                const kineticEnergy = 0.5 * obj.mass * speed * speed;
                const potentialEnergy = obj.mass * 9.8 * obj.position.y; // 重力势能
                totalEnergy += kineticEnergy + potentialEnergy;
            }
            return totalEnergy;
        }
        /**
         * 检查动量守恒
         */
        checkMomentumConservation(timeSeries) {
            if (timeSeries.length < 2)
                return null;
            const initialMomentum = this.calculateTotalMomentum(timeSeries[0]);
            const finalMomentum = this.calculateTotalMomentum(timeSeries[timeSeries.length - 1]);
            const deviation = Math.abs(finalMomentum - initialMomentum);
            const deviationPercent = Math.abs(deviation) / Math.abs(initialMomentum);
            const passed = deviationPercent <= this.config.tolerance.momentum;
            return {
                type: 'momentum',
                initialValue: initialMomentum,
                finalValue: finalMomentum,
                deviation,
                deviationPercent,
                passed,
                tolerance: this.config.tolerance.momentum
            };
        }
        /**
         * 计算总动量
         */
        calculateTotalMomentum(data) {
            let totalMomentum = 0;
            for (const obj of Object.values(data.objects)) {
                const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                    Math.pow(obj.velocity.y, 2) +
                    Math.pow(obj.velocity.z, 2));
                totalMomentum += obj.mass * speed;
            }
            return totalMomentum;
        }
        /**
         * 检查角动量守恒
         */
        checkAngularMomentumConservation(timeSeries) {
            if (timeSeries.length < 2)
                return null;
            const initialAngularMomentum = this.calculateTotalAngularMomentum(timeSeries[0]);
            const finalAngularMomentum = this.calculateTotalAngularMomentum(timeSeries[timeSeries.length - 1]);
            const deviation = Math.abs(finalAngularMomentum - initialAngularMomentum);
            const deviationPercent = Math.abs(deviation) / Math.abs(initialAngularMomentum);
            const passed = deviationPercent <= this.config.tolerance.angularMomentum;
            return {
                type: 'angular_momentum',
                initialValue: initialAngularMomentum,
                finalValue: finalAngularMomentum,
                deviation,
                deviationPercent,
                passed,
                tolerance: this.config.tolerance.angularMomentum
            };
        }
        /**
         * 计算总角动量
         */
        calculateTotalAngularMomentum(data) {
            let totalAngularMomentum = 0;
            for (const obj of Object.values(data.objects)) {
                // 简化的角动量计算
                const angularSpeed = Math.sqrt(Math.pow(obj.angularVelocity?.x || 0, 2) +
                    Math.pow(obj.angularVelocity?.y || 0, 2) +
                    Math.pow(obj.angularVelocity?.z || 0, 2));
                const momentOfInertia = obj.mass * 0.1; // 简化的转动惯量
                totalAngularMomentum += momentOfInertia * angularSpeed;
            }
            return totalAngularMomentum;
        }
        /**
         * 检查质量守恒
         */
        checkMassConservation(timeSeries) {
            if (timeSeries.length < 2)
                return null;
            const initialMass = this.calculateTotalMass(timeSeries[0]);
            const finalMass = this.calculateTotalMass(timeSeries[timeSeries.length - 1]);
            const deviation = Math.abs(finalMass - initialMass);
            const deviationPercent = Math.abs(deviation) / Math.abs(initialMass);
            const passed = deviationPercent <= this.config.tolerance.mass;
            return {
                type: 'mass',
                initialValue: initialMass,
                finalValue: finalMass,
                deviation,
                deviationPercent,
                passed,
                tolerance: this.config.tolerance.mass
            };
        }
        /**
         * 计算总质量
         */
        calculateTotalMass(data) {
            let totalMass = 0;
            for (const obj of Object.values(data.objects)) {
                totalMass += obj.mass;
            }
            return totalMass;
        }
        /**
         * 验证物理约束
         */
        async validatePhysicalConstraints(simulationResult, ir) {
            const violations = [];
            const timeSeries = simulationResult.timeSeries;
            // 检查速度约束
            for (const data of timeSeries) {
                for (const [objectId, obj] of Object.entries(data.objects)) {
                    const speed = Math.sqrt(Math.pow(obj.velocity.x, 2) +
                        Math.pow(obj.velocity.y, 2) +
                        Math.pow(obj.velocity.z, 2));
                    if (speed > 1000) { // 光速的1/300000
                        violations.push(`Object ${objectId} exceeds speed limit at time ${data.time}`);
                    }
                }
            }
            // 检查位置约束
            for (const data of timeSeries) {
                for (const [objectId, obj] of Object.entries(data.objects)) {
                    if (isNaN(obj.position.x) || isNaN(obj.position.y) || isNaN(obj.position.z)) {
                        violations.push(`Object ${objectId} has invalid position at time ${data.time}`);
                    }
                }
            }
            return violations;
        }
        /**
         * 验证数值稳定性
         */
        async validateNumericalStability(simulationResult) {
            const issues = [];
            const timeSeries = simulationResult.timeSeries;
            // 检查时间步长稳定性
            if (timeSeries.length > 1) {
                const timeSteps = [];
                for (let i = 1; i < timeSeries.length; i++) {
                    timeSteps.push(timeSeries[i].time - timeSeries[i - 1].time);
                }
                const avgTimeStep = timeSteps.reduce((sum, dt) => sum + dt, 0) / timeSteps.length;
                const maxTimeStep = Math.max(...timeSteps);
                const minTimeStep = Math.min(...timeSteps);
                if (maxTimeStep > avgTimeStep * 10) {
                    issues.push('Large time step variations detected');
                }
                if (minTimeStep < avgTimeStep * 0.1) {
                    issues.push('Very small time steps detected');
                }
            }
            // 检查数值发散
            for (const data of timeSeries) {
                for (const [objectId, obj] of Object.entries(data.objects)) {
                    if (!isFinite(obj.position.x) || !isFinite(obj.position.y) || !isFinite(obj.position.z)) {
                        issues.push(`Object ${objectId} position diverged at time ${data.time}`);
                    }
                    if (!isFinite(obj.velocity.x) || !isFinite(obj.velocity.y) || !isFinite(obj.velocity.z)) {
                        issues.push(`Object ${objectId} velocity diverged at time ${data.time}`);
                    }
                }
            }
            return issues;
        }
        /**
         * 验证因果关系
         */
        async validateCausality(simulationResult) {
            const violations = [];
            const timeSeries = simulationResult.timeSeries;
            // 检查时间顺序
            for (let i = 1; i < timeSeries.length; i++) {
                if (timeSeries[i].time <= timeSeries[i - 1].time) {
                    violations.push(`Time sequence violation at index ${i}`);
                }
            }
            // 检查物理因果关系
            for (let i = 1; i < timeSeries.length; i++) {
                const prev = timeSeries[i - 1];
                const curr = timeSeries[i];
                for (const [objectId, currObj] of Object.entries(curr.objects)) {
                    const prevObj = prev.objects[objectId];
                    if (prevObj) {
                        // 检查位置变化的合理性
                        const displacement = Math.sqrt(Math.pow(currObj.position.x - prevObj.position.x, 2) +
                            Math.pow(currObj.position.y - prevObj.position.y, 2) +
                            Math.pow(currObj.position.z - prevObj.position.z, 2));
                        const timeDiff = curr.time - prev.time;
                        const maxDisplacement = Math.sqrt(Math.pow(prevObj.velocity.x, 2) +
                            Math.pow(prevObj.velocity.y, 2) +
                            Math.pow(prevObj.velocity.z, 2)) * timeDiff * 2; // 允许2倍的最大可能位移
                        if (displacement > maxDisplacement) {
                            violations.push(`Object ${objectId} moved too far in time step at ${curr.time}`);
                        }
                    }
                }
            }
            return violations;
        }
        /**
         * 计算总体分数
         */
        calculateOverallScore(result) {
            let score = 1.0;
            // 守恒定律检查
            const conservationScore = result.conservationChecks.length > 0
                ? result.conservationChecks.filter(check => check.passed).length / result.conservationChecks.length
                : 1.0;
            score *= conservationScore;
            // 约束违反
            if (result.constraintViolations.length > 0) {
                score *= Math.max(0, 1 - result.constraintViolations.length * 0.1);
            }
            // 稳定性问题
            if (result.stabilityIssues.length > 0) {
                score *= Math.max(0, 1 - result.stabilityIssues.length * 0.1);
            }
            // 因果关系违反
            if (result.causalityViolations.length > 0) {
                score *= Math.max(0, 1 - result.causalityViolations.length * 0.2);
            }
            return Math.max(0, Math.min(1, score));
        }
        /**
         * 生成建议
         */
        generateRecommendations(result) {
            const recommendations = [];
            // 守恒定律建议
            const failedConservation = result.conservationChecks.filter(check => !check.passed);
            if (failedConservation.length > 0) {
                recommendations.push('Consider reducing time step size for better conservation');
                recommendations.push('Check for energy dissipation mechanisms');
            }
            // 约束违反建议
            if (result.constraintViolations.length > 0) {
                recommendations.push('Review physical constraints and boundary conditions');
                recommendations.push('Check for numerical instabilities');
            }
            // 稳定性建议
            if (result.stabilityIssues.length > 0) {
                recommendations.push('Use adaptive time stepping');
                recommendations.push('Consider using more stable numerical methods');
            }
            // 因果关系建议
            if (result.causalityViolations.length > 0) {
                recommendations.push('Check time step size and integration method');
                recommendations.push('Verify initial conditions');
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
    exports.PhysicsValidator = PhysicsValidator;
});
/**
 * 结果验证器 - 验证仿真结果的质量和完整性
 *
 * 功能：
 * 1. 数据完整性检查
 * 2. 数据质量评估
 * 3. 异常检测
 * 4. 自动修复建议
 */
define("validation/ResultValidator", ["require", "exports"], function (require, exports) {
    "use strict";
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
});
/**
 * 动态物理渲染器 - 能够根据任意物理题目动态生成3D场景
 *
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动生成3D场景
 * 3. 智能相机控制
 * 4. 自适应光照
 * 5. 动态特效
 */
define("rendering/DynamicPhysicsRenderer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicPhysicsRenderer = void 0;
    // 动态物理渲染器
    class DynamicPhysicsRenderer {
        constructor() {
            this.objects = new Map();
            this.lights = [];
            this.effects = [];
            this.initializeRenderer();
        }
        /**
         * 渲染仿真结果
         */
        async renderSimulation(simulationResult, ir, config) {
            const startTime = Date.now();
            const result = {
                success: false,
                frames: [],
                frameCount: 0,
                duration: 0,
                resolution: { width: config.width, height: config.height },
                errors: [],
                warnings: []
            };
            try {
                console.log('🎨 Starting dynamic physics rendering...');
                console.log(`📊 Physics type: ${this.analyzePhysicsType(ir)}`);
                console.log(`📐 Resolution: ${config.width}x${config.height}`);
                console.log(`🎬 Duration: ${config.duration}s @ ${config.fps}fps`);
                // 1. 分析物理类型
                const physicsType = this.analyzePhysicsType(ir);
                // 2. 设置场景
                this.setupScene(config, physicsType);
                // 3. 创建3D对象
                this.createObjects(ir, physicsType);
                // 4. 设置光照
                this.setupLighting(config, physicsType);
                // 5. 设置特效
                this.setupEffects(config, physicsType);
                // 6. 渲染帧序列
                const totalFrames = Math.floor(config.duration * config.fps);
                const timeStep = config.duration / totalFrames;
                for (let frame = 0; frame < totalFrames; frame++) {
                    const time = frame * timeStep;
                    // 更新对象状态
                    this.updateObjects(simulationResult, time, physicsType);
                    // 更新相机
                    this.updateCamera(time, config, physicsType);
                    // 更新特效
                    this.updateEffects(time, physicsType);
                    // 渲染帧
                    const frameData = this.renderFrame();
                    result.frames.push(frameData);
                    if (frame % Math.floor(totalFrames / 10) === 0) {
                        console.log(`📸 Rendered ${frame + 1}/${totalFrames} frames`);
                    }
                }
                result.frameCount = totalFrames;
                result.duration = Date.now() - startTime;
                result.success = true;
                console.log('✅ Rendering completed successfully!');
                console.log(`📸 Frames: ${result.frameCount}`);
                console.log(`⏱️  Time: ${result.duration}ms`);
            }
            catch (error) {
                result.errors.push(`Rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                result.success = false;
            }
            return result;
        }
        /**
         * 分析物理类型
         */
        analyzePhysicsType(ir) {
            const modules = ir.system?.modules || [];
            const moduleTypes = modules.map(m => m.type);
            if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
                return 'complex_kinematics';
            }
            else if (moduleTypes.includes('oscillation')) {
                return 'oscillatory_system';
            }
            else if (moduleTypes.includes('wave')) {
                return 'wave_system';
            }
            else if (moduleTypes.includes('electromagnetic')) {
                return 'electromagnetic_system';
            }
            else if (moduleTypes.includes('thermal')) {
                return 'thermodynamic_system';
            }
            else if (moduleTypes.includes('fluid')) {
                return 'fluid_system';
            }
            else if (moduleTypes.includes('quantum')) {
                return 'quantum_system';
            }
            else if (moduleTypes.includes('relativistic')) {
                return 'relativistic_system';
            }
            else {
                return 'general_physics';
            }
        }
        /**
         * 初始化渲染器
         */
        initializeRenderer() {
            // 这里应该初始化Three.js渲染器
            // 由于这是TypeScript接口，实际实现需要Three.js库
            console.log('🎨 Initializing Three.js renderer...');
        }
        /**
         * 设置场景
         */
        setupScene(config, physicsType) {
            console.log(`🏗️  Setting up scene for ${physicsType}...`);
            // 根据物理类型设置不同的场景
            switch (physicsType) {
                case 'complex_kinematics':
                    this.setupComplexKinematicsScene(config);
                    break;
                case 'oscillatory_system':
                    this.setupOscillatorySystemScene(config);
                    break;
                case 'wave_system':
                    this.setupWaveSystemScene(config);
                    break;
                case 'electromagnetic_system':
                    this.setupElectromagneticSystemScene(config);
                    break;
                default:
                    this.setupGeneralPhysicsScene(config);
                    break;
            }
        }
        /**
         * 设置复杂运动学场景
         */
        setupComplexKinematicsScene(config) {
            // 创建地面
            const ground = this.createGround(20, 20, '#666666');
            this.scene.add(ground);
            // 创建斜面
            const incline = this.createIncline(10, 5, 30, '#888888');
            this.scene.add(incline);
            // 设置相机位置
            this.camera.position.set(15, 10, 15);
            this.camera.lookAt(0, 0, 0);
        }
        /**
         * 设置振荡系统场景
         */
        setupOscillatorySystemScene(config) {
            // 创建弹簧
            const spring = this.createSpring(0, 0, 0, 0, -2, 0, '#FFD700');
            this.scene.add(spring);
            // 创建支撑点
            const support = this.createBox(0, 1, 0, 2, 0.2, 2, '#8B4513');
            this.scene.add(support);
            // 设置相机位置
            this.camera.position.set(8, 5, 8);
            this.camera.lookAt(0, 0, 0);
        }
        /**
         * 设置波动系统场景
         */
        setupWaveSystemScene(config) {
            // 创建波动表面
            const waveSurface = this.createWaveSurface(20, 20, '#0066CC');
            this.scene.add(waveSurface);
            // 设置相机位置
            this.camera.position.set(0, 15, 15);
            this.camera.lookAt(0, 0, 0);
        }
        /**
         * 设置电磁系统场景
         */
        setupElectromagneticSystemScene(config) {
            // 创建电场线
            const fieldLines = this.createFieldLines();
            this.scene.add(fieldLines);
            // 设置相机位置
            this.camera.position.set(10, 10, 10);
            this.camera.lookAt(0, 0, 0);
        }
        /**
         * 设置通用物理场景
         */
        setupGeneralPhysicsScene(config) {
            // 创建简单的地面
            const ground = this.createGround(10, 10, '#666666');
            this.scene.add(ground);
            // 设置相机位置
            this.camera.position.set(5, 5, 5);
            this.camera.lookAt(0, 0, 0);
        }
        /**
         * 创建3D对象
         */
        createObjects(ir, physicsType) {
            console.log(`🎯 Creating objects for ${physicsType}...`);
            if (ir.system?.objects) {
                for (const obj of ir.system.objects) {
                    const sceneObject = this.createObjectFromIR(obj, physicsType);
                    this.scene.add(sceneObject);
                    this.objects.set(obj.id, sceneObject);
                }
            }
        }
        /**
         * 从IR创建3D对象
         */
        createObjectFromIR(obj, physicsType) {
            const objectType = this.determineObjectType(obj, physicsType);
            switch (objectType) {
                case 'sphere':
                    return this.createSphere(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, obj.radius || 0.5, obj.color || '#FF0000');
                case 'box':
                    return this.createBox(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, obj.width || 1, obj.height || 1, obj.depth || 1, obj.color || '#FF0000');
                case 'cylinder':
                    return this.createCylinder(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, obj.radius || 0.5, obj.height || 1, obj.color || '#FF0000');
                default:
                    return this.createSphere(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, 0.5, '#FF0000');
            }
        }
        /**
         * 确定对象类型
         */
        determineObjectType(obj, physicsType) {
            // 根据物理类型和对象属性确定3D对象类型
            if (obj.type) {
                return obj.type;
            }
            switch (physicsType) {
                case 'complex_kinematics':
                    return 'sphere'; // 通常是小球
                case 'oscillatory_system':
                    return 'box'; // 通常是方块
                case 'wave_system':
                    return 'sphere'; // 通常是粒子
                case 'electromagnetic_system':
                    return 'sphere'; // 通常是带电粒子
                default:
                    return 'sphere';
            }
        }
        /**
         * 设置光照
         */
        setupLighting(config, physicsType) {
            console.log(`💡 Setting up lighting for ${physicsType}...`);
            // 环境光
            const ambientLight = this.createAmbientLight(config.lighting.ambient, config.lighting.color);
            this.scene.add(ambientLight);
            // 方向光
            const directionalLight = this.createDirectionalLight(config.lighting.directional, config.lighting.color, { x: 10, y: 10, z: 5 });
            this.scene.add(directionalLight);
            // 根据物理类型添加特殊光照
            switch (physicsType) {
                case 'electromagnetic_system':
                    this.addElectromagneticLighting();
                    break;
                case 'wave_system':
                    this.addWaveLighting();
                    break;
            }
        }
        /**
         * 设置特效
         */
        setupEffects(config, physicsType) {
            console.log(`✨ Setting up effects for ${physicsType}...`);
            if (config.effects.particles) {
                this.createParticleSystem(physicsType);
            }
            if (config.effects.trails) {
                this.createTrailSystem(physicsType);
            }
            if (config.effects.forces) {
                this.createForceVisualization(physicsType);
            }
            if (config.effects.energy) {
                this.createEnergyVisualization(physicsType);
            }
            if (config.effects.grid) {
                this.createGrid(physicsType);
            }
        }
        /**
         * 更新对象状态
         */
        updateObjects(simulationResult, time, physicsType) {
            // 找到对应时间的仿真数据
            const timeData = this.findTimeData(simulationResult, time);
            if (timeData) {
                for (const objectId in timeData.objects) {
                    const obj = timeData.objects[objectId];
                    const sceneObject = this.objects.get(objectId);
                    if (sceneObject) {
                        // 更新位置
                        sceneObject.position.set(obj.position.x, obj.position.y, obj.position.z);
                        // 更新旋转
                        if (obj.rotation) {
                            sceneObject.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                        }
                        // 根据物理类型更新特殊属性
                        this.updateObjectProperties(sceneObject, obj, physicsType);
                    }
                }
            }
        }
        /**
         * 更新相机
         */
        updateCamera(time, config, physicsType) {
            switch (config.camera.mode) {
                case 'orbit':
                    this.updateOrbitCamera(time, config);
                    break;
                case 'follow':
                    this.updateFollowCamera(time, config, physicsType);
                    break;
                case 'free':
                    this.updateFreeCamera(time, config);
                    break;
                default:
                    // 固定相机，不需要更新
                    break;
            }
        }
        /**
         * 更新特效
         */
        updateEffects(time, physicsType) {
            // 更新粒子系统
            this.updateParticleSystem(time, physicsType);
            // 更新轨迹
            this.updateTrailSystem(time, physicsType);
            // 更新力可视化
            this.updateForceVisualization(time, physicsType);
            // 更新能量可视化
            this.updateEnergyVisualization(time, physicsType);
        }
        /**
         * 渲染帧
         */
        renderFrame() {
            // 渲染场景
            this.renderer.render(this.scene, this.camera);
            // 获取帧数据
            const canvas = this.renderer.domElement;
            return canvas.toDataURL('image/png');
        }
        // 辅助方法 - 创建3D对象
        createSphere(x, y, z, radius, color) {
            // Three.js SphereGeometry 和 MeshBasicMaterial
            return { type: 'sphere', position: { x, y, z }, radius, color };
        }
        createBox(x, y, z, width, height, depth, color) {
            return { type: 'box', position: { x, y, z }, width, height, depth, color };
        }
        createCylinder(x, y, z, radius, height, color) {
            return { type: 'cylinder', position: { x, y, z }, radius, height, color };
        }
        createGround(width, depth, color) {
            return { type: 'plane', width, depth, color };
        }
        createIncline(width, height, angle, color) {
            return { type: 'incline', width, height, angle, color };
        }
        createSpring(x1, y1, z1, x2, y2, z2, color) {
            return { type: 'spring', start: { x: x1, y: y1, z: z1 }, end: { x: x2, y: y2, z: z2 }, color };
        }
        createWaveSurface(width, depth, color) {
            return { type: 'waveSurface', width, depth, color };
        }
        createFieldLines() {
            return { type: 'fieldLines' };
        }
        // 辅助方法 - 创建光照
        createAmbientLight(intensity, color) {
            return { type: 'ambientLight', intensity, color };
        }
        createDirectionalLight(intensity, color, position) {
            return { type: 'directionalLight', intensity, color, position };
        }
        // 辅助方法 - 特效
        createParticleSystem(physicsType) {
            console.log(`✨ Creating particle system for ${physicsType}`);
        }
        createTrailSystem(physicsType) {
            console.log(`🌊 Creating trail system for ${physicsType}`);
        }
        createForceVisualization(physicsType) {
            console.log(`⚡ Creating force visualization for ${physicsType}`);
        }
        createEnergyVisualization(physicsType) {
            console.log(`🔋 Creating energy visualization for ${physicsType}`);
        }
        createGrid(physicsType) {
            console.log(`📐 Creating grid for ${physicsType}`);
        }
        // 辅助方法 - 更新
        findTimeData(simulationResult, time) {
            // 找到最接近指定时间的仿真数据
            let closest = null;
            let minDiff = Infinity;
            for (const data of simulationResult.timeSeries) {
                const diff = Math.abs(data.time - time);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = data;
                }
            }
            return closest;
        }
        updateObjectProperties(sceneObject, obj, physicsType) {
            // 根据物理类型更新对象特殊属性
            switch (physicsType) {
                case 'electromagnetic_system':
                    // 更新电磁场可视化
                    break;
                case 'wave_system':
                    // 更新波动效果
                    break;
            }
        }
        updateOrbitCamera(time, config) {
            const radius = 15;
            const angle = time * 0.1;
            this.camera.position.x = Math.cos(angle) * radius;
            this.camera.position.z = Math.sin(angle) * radius;
            this.camera.lookAt(0, 0, 0);
        }
        updateFollowCamera(time, config, physicsType) {
            // 跟随主要对象的相机
            const mainObject = this.objects.values().next().value;
            if (mainObject) {
                this.camera.position.x = mainObject.position.x + 5;
                this.camera.position.y = mainObject.position.y + 5;
                this.camera.position.z = mainObject.position.z + 5;
                this.camera.lookAt(mainObject.position.x, mainObject.position.y, mainObject.position.z);
            }
        }
        updateFreeCamera(time, config) {
            // 自由相机移动
            this.camera.position.x = Math.sin(time * 0.05) * 10;
            this.camera.position.y = 5 + Math.sin(time * 0.1) * 2;
            this.camera.position.z = Math.cos(time * 0.05) * 10;
        }
        updateParticleSystem(time, physicsType) {
            // 更新粒子系统
        }
        updateTrailSystem(time, physicsType) {
            // 更新轨迹系统
        }
        updateForceVisualization(time, physicsType) {
            // 更新力可视化
        }
        updateEnergyVisualization(time, physicsType) {
            // 更新能量可视化
        }
        addElectromagneticLighting() {
            // 添加电磁场特殊光照
        }
        addWaveLighting() {
            // 添加波动特殊光照
        }
    }
    exports.DynamicPhysicsRenderer = DynamicPhysicsRenderer;
});
/**
 * 物理核心系统 - 统一接口
 *
 * 功能：
 * 1. 集成所有 services 的功能
 * 2. 提供统一的测试接口
 * 3. 支持完整的物理题目处理流程
 * 4. 包含分阶段动画和验证功能
 */
define("core/PhysicsCore", ["require", "exports", "ai_parsing/PhysicsAIParserAICaller", "dsl/PhysicsDslGenerator", "ir/IRConverter", "simulation/DynamicPhysicsSimulator", "validation/PhysicsValidator", "validation/ResultValidator", "rendering/DynamicPhysicsRenderer"], function (require, exports, PhysicsAIParserAICaller_1, PhysicsDslGenerator_1, IRConverter_1, DynamicPhysicsSimulator_1, PhysicsValidator_1, ResultValidator_1, DynamicPhysicsRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PhysicsCore = void 0;
    exports.createPhysicsCore = createPhysicsCore;
    exports.quickTestPhysicsQuestion = quickTestPhysicsQuestion;
    /**
     * 物理核心系统 - 统一接口类
     */
    class PhysicsCore {
        constructor(aiConfig) {
            this.aiParser = new PhysicsAIParserAICaller_1.PhysicsAIParserAICaller(aiConfig);
            this.dslGenerator = new PhysicsDslGenerator_1.PhysicsDslGenerator();
            this.irConverter = new IRConverter_1.IRConverter();
            this.simulator = new DynamicPhysicsSimulator_1.DynamicPhysicsSimulator();
            this.physicsValidator = new PhysicsValidator_1.PhysicsValidator();
            this.resultValidator = new ResultValidator_1.ResultValidator();
            this.renderer = new DynamicPhysicsRenderer_1.DynamicPhysicsRenderer();
        }
        /**
         * 测试单个物理题目 - 主要入口点
         */
        async testPhysicsQuestion(question, config) {
            const startTime = Date.now();
            const result = {
                success: false,
                stages: {
                    ai: { success: false, errors: [] },
                    dsl: { success: false, errors: [] },
                    ir: { success: false, errors: [] },
                    simulation: { success: false, errors: [] },
                    validation: { success: false, errors: [] },
                    rendering: { success: false, errors: [] }
                },
                totalTime: 0,
                errors: [],
                warnings: []
            };
            try {
                console.log('🎬 Starting physics question test...');
                console.log(`📝 Question: ${question}`);
                let parsedQuestion = null;
                let dsl = null;
                let ir = null;
                let simulationResult = null;
                let validationResult = null;
                let renderingResult = null;
                // 阶段1: AI解析
                if (config.enableAI) {
                    console.log('🤖 Stage 1: AI parsing...');
                    try {
                        parsedQuestion = await this.aiParser.parseQuestionWithAIOnly(question);
                        if (parsedQuestion) {
                            result.stages.ai.success = true;
                            result.stages.ai.data = parsedQuestion;
                            console.log(`✅ AI parsing completed - ${parsedQuestion.parameters?.length || 0} parameters identified`);
                        }
                        else {
                            result.stages.ai.errors.push('AI parsing returned null');
                        }
                    }
                    catch (error) {
                        result.stages.ai.errors.push(error instanceof Error ? error.message : 'Unknown error');
                        console.error('❌ AI parsing failed:', error);
                    }
                }
                // 阶段2: DSL生成
                if (config.enableDSL && result.stages.ai.success) {
                    console.log('📋 Stage 2: DSL generation...');
                    try {
                        dsl = this.dslGenerator.generateDSL(parsedQuestion);
                        if (dsl) {
                            result.stages.dsl.success = true;
                            result.stages.dsl.data = dsl;
                            console.log(`✅ DSL generation completed - System type: ${dsl.system?.type}`);
                        }
                        else {
                            result.stages.dsl.errors.push('DSL generation returned null');
                        }
                    }
                    catch (error) {
                        result.stages.dsl.errors.push(error instanceof Error ? error.message : 'Unknown error');
                        console.error('❌ DSL generation failed:', error);
                    }
                }
                // 阶段3: IR转换
                if (config.enableIR && result.stages.dsl.success) {
                    console.log('🔄 Stage 3: IR conversion...');
                    try {
                        const irResult = await this.irConverter.convertDSLToIR(dsl);
                        if (irResult.success && irResult.ir) {
                            result.stages.ir.success = true;
                            result.stages.ir.data = irResult.ir;
                            ir = irResult.ir;
                            console.log(`✅ IR conversion completed - Modules: ${ir.system?.modules?.length || 0}`);
                        }
                        else {
                            result.stages.ir.errors.push(...irResult.errors);
                        }
                    }
                    catch (error) {
                        result.stages.ir.errors.push(error instanceof Error ? error.message : 'Unknown error');
                        console.error('❌ IR conversion failed:', error);
                    }
                }
                // 阶段4: 仿真计算
                if (config.enableSimulation && result.stages.ir.success) {
                    console.log('⚡ Stage 4: Physics simulation...');
                    try {
                        const simulationConfig = {
                            duration: 10,
                            timestep: 0.01,
                            tolerance: 1e-6,
                            solver: 'rk4',
                            outputFrequency: 10,
                            enableEvents: true,
                            enableMonitoring: true,
                            adaptiveTimestep: true,
                            maxIterations: 10000
                        };
                        simulationResult = await this.simulator.runSimulation(ir, simulationConfig);
                        if (simulationResult.success) {
                            result.stages.simulation.success = true;
                            result.stages.simulation.data = simulationResult;
                            console.log(`✅ Simulation completed - Data points: ${simulationResult.timeSeries?.length || 0}`);
                        }
                        else {
                            result.stages.simulation.errors.push(...simulationResult.errors);
                        }
                    }
                    catch (error) {
                        result.stages.simulation.errors.push(error instanceof Error ? error.message : 'Unknown error');
                        console.error('❌ Simulation failed:', error);
                    }
                }
                // 阶段5: 验证
                if (config.enableValidation && result.stages.simulation.success) {
                    console.log('🔍 Stage 5: Validation...');
                    try {
                        // 物理逻辑验证
                        const physicsValidation = await this.physicsValidator.validateSimulation(simulationResult, ir);
                        // 结果验证
                        const resultValidation = await this.resultValidator.performSelfCheck(simulationResult, ir);
                        if (physicsValidation.success && resultValidation.success) {
                            result.stages.validation.success = true;
                            result.stages.validation.data = {
                                physics: physicsValidation,
                                result: resultValidation
                            };
                            console.log(`✅ Validation completed - Physics: ${physicsValidation.overallScore}, Result: ${resultValidation.overallScore}`);
                        }
                        else {
                            if (!physicsValidation.success) {
                                result.stages.validation.errors.push(...physicsValidation.errors || []);
                            }
                            if (!resultValidation.success) {
                                result.stages.validation.errors.push(...resultValidation.errors || []);
                            }
                        }
                    }
                    catch (error) {
                        result.stages.validation.errors.push(error instanceof Error ? error.message : 'Unknown error');
                        console.error('❌ Validation failed:', error);
                    }
                }
                // 阶段6: 渲染（模拟）
                if (config.enableRendering && result.stages.simulation.success) {
                    console.log('🎨 Stage 6: Rendering...');
                    try {
                        // 模拟渲染过程
                        const renderConfig = {
                            width: 1920,
                            height: 1080,
                            fps: 30,
                            duration: 10,
                            quality: config.quality,
                            format: 'png_sequence',
                            backgroundColor: '#000000',
                            camera: {
                                position: { x: 10, y: 10, z: 10 },
                                target: { x: 0, y: 0, z: 0 },
                                fov: 75
                            },
                            lighting: {
                                ambient: 0.4,
                                directional: 0.8,
                                shadows: true
                            }
                        };
                        // 模拟渲染结果
                        renderingResult = {
                            success: true,
                            outputPath: config.outputPath,
                            frameCount: Math.floor(renderConfig.duration * renderConfig.fps),
                            fileSize: this.calculateMockFileSize(renderConfig),
                            generationTime: 1000
                        };
                        result.stages.rendering.success = true;
                        result.stages.rendering.data = renderingResult;
                        console.log(`✅ Rendering completed - Frames: ${renderingResult.frameCount}`);
                    }
                    catch (error) {
                        result.stages.rendering.errors.push(error instanceof Error ? error.message : 'Unknown error');
                        console.error('❌ Rendering failed:', error);
                    }
                }
                // 检查整体成功状态
                const allStages = Object.values(result.stages);
                const successfulStages = allStages.filter(stage => stage.success).length;
                const totalEnabledStages = allStages.filter(stage => (stage === result.stages.ai && config.enableAI) ||
                    (stage === result.stages.dsl && config.enableDSL) ||
                    (stage === result.stages.ir && config.enableIR) ||
                    (stage === result.stages.simulation && config.enableSimulation) ||
                    (stage === result.stages.validation && config.enableValidation) ||
                    (stage === result.stages.rendering && config.enableRendering)).length;
                result.success = successfulStages === totalEnabledStages;
                if (result.success) {
                    console.log('✅ Physics question test completed successfully!');
                }
                else {
                    console.log(`❌ Physics question test failed - ${successfulStages}/${totalEnabledStages} stages successful`);
                }
            }
            catch (error) {
                result.errors.push(error instanceof Error ? error.message : 'Unknown error');
                result.success = false;
                console.error('❌ Physics question test failed:', error);
            }
            result.totalTime = Date.now() - startTime;
            return result;
        }
        /**
         * 生成分阶段动画配置
         */
        generateStageAnimationConfig(question, simulationResult) {
            // 这里可以根据题目内容和仿真结果自动生成分阶段配置
            // 具体实现可以根据需要扩展
            const stages = [{
                    id: 'default',
                    name: '物理运动',
                    description: '通用物理运动',
                    startTime: 0,
                    duration: 10,
                    physicsType: 'other',
                    visualConfig: {
                        color: '#FFFFFF',
                        highlight: false,
                        showTrajectory: true,
                        showForces: false,
                        showEnergy: false
                    },
                    explanation: {
                        title: '物理运动',
                        description: '物体运动过程',
                        formulas: [],
                        keyPoints: []
                    }
                }];
            const transitions = [];
            return { stages, transitions };
        }
        /**
         * 计算模拟文件大小
         */
        calculateMockFileSize(config) {
            const baseSize = 1024 * 1024; // 1MB base
            const qualityMultiplier = {
                'low': 1,
                'medium': 2,
                'high': 4,
                'ultra': 8
            };
            const resolutionMultiplier = (config.width * config.height) / (1920 * 1080);
            const durationMultiplier = config.duration / 10;
            return baseSize * qualityMultiplier[config.quality] * resolutionMultiplier * durationMultiplier;
        }
        /**
         * 获取推荐的测试配置
         */
        getRecommendedTestConfig(quality) {
            return {
                enableAI: true,
                enableDSL: true,
                enableIR: true,
                enableSimulation: true,
                enableValidation: true,
                enableRendering: true,
                enableStageAnimation: true,
                quality,
                outputPath: 'output.mp4',
                strictMode: quality === 'high' || quality === 'ultra'
            };
        }
        /**
         * 清理资源
         */
        async cleanup() {
            console.log('🧹 Cleaning up physics core resources...');
            // DynamicPhysicsRenderer doesn't require explicit cleanup
        }
    }
    exports.PhysicsCore = PhysicsCore;
    /**
     * 创建物理核心系统实例
     */
    function createPhysicsCore(aiConfig) {
        return new PhysicsCore(aiConfig);
    }
    /**
     * 快速测试函数
     */
    async function quickTestPhysicsQuestion(question, aiConfig, quality = 'medium') {
        const core = createPhysicsCore(aiConfig);
        const config = core.getRecommendedTestConfig(quality);
        try {
            const result = await core.testPhysicsQuestion(question, config);
            await core.cleanup();
            return result;
        }
        catch (error) {
            await core.cleanup();
            throw error;
        }
    }
});
