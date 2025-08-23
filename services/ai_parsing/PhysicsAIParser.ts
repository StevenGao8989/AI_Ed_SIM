// services/ai_parsing/parse.ts

export interface ParsedQuestion {
  subject: 'physics' | 'chemistry' | 'math' | 'biology';
  topic: string;            // 具体主题，如"抛体运动/Projectile Motion"
  question: string;         // 原始问题
  units: UnitMapping[];     // 文中出现的单位及其到标准单位的换算
  parameters: Parameter[];  // 提取到的参数（给定/未知/常量）
}

export interface UnitMapping {
  original: string;         // 原始单位（保留原样）
  standard: string;         // 标准单位（SI优先；无法安全换算时保留原制式）
  conversion: number;       // original * conversion = standard 的数值倍率
}

/** 若你的项目已定义 Parameter，请删除此处定义以避免重复 */
export interface Parameter {
  symbol: string; // 变量名（v, v0, a, t, s, m, F, I, U, R, P, f, λ, ...）
  value: number | null;
  unit?: string | null;
  raw?: string;   // 原始片段
  role?: 'given' | 'unknown' | 'constant' | 'derived';
  note?: string;  // 备注（如“题面给定”、“由‘取g=10’覆盖”等）
}

/* ---------------------------------------
 * 学段覆盖：初一~高三 主题词典（关键词 → 主题）
 * ------------------------------------- */

type TopicRule = { id: string; zh: string; en?: string; keywords: RegExp[] };

const TOPIC_RULES: TopicRule[] = [
  // 初中 - 机械运动/力/压强/浮力/简单机械/功功率/热与内能/声/光
  { id: 'kinematics_linear', zh: '匀变速直线运动', en: 'Uniformly Accelerated Linear Motion',
    keywords: [/匀变速|匀加速|直线运动|位移-时间|速度-时间|s-t图|v-t图/i] },
  { id: 'projectile', zh: '抛体运动', en: 'Projectile Motion',
    keywords: [/斜抛|平抛|抛体|抛射|最高点|射程/i] },
  { id: 'newton_dynamics', zh: '牛顿运动定律', en: 'Newton’s Laws',
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
  { id: 'dc_circuits', zh: '直流电路与欧姆定律', en: 'DC Circuits & Ohm’s Law',
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

/* ---------------------------
 * 单位：标准化映射与解析
 * ------------------------- */

// 显式映射（复合或常见单位 → 标准 与 倍率）
const UNIT_ALIASES: Record<string, { standard: string; k: number }> = {
  // 长度
  'm': { standard: 'm', k: 1 },
  'meter': { standard: 'm', k: 1 },
  '米': { standard: 'm', k: 1 },
  'cm': { standard: 'm', k: 0.01 },
  '厘米': { standard: 'm', k: 0.01 },
  'mm': { standard: 'm', k: 0.001 },
  '毫米': { standard: 'm', k: 0.001 },
  'km': { standard: 'm', k: 1000 },
  '千米': { standard: 'm', k: 1000 },
  // 面积/体积
  'cm2': { standard: 'm^2', k: 1e-4 }, 'cm^2': { standard: 'm^2', k: 1e-4 }, 'cm²': { standard: 'm^2', k: 1e-4 },
  'm2': { standard: 'm^2', k: 1 }, 'm^2': { standard: 'm^2', k: 1 }, 'm²': { standard: 'm^2', k: 1 },
  'cm3': { standard: 'm^3', k: 1e-6 }, 'cm^3': { standard: 'm^3', k: 1e-6 }, 'cm³': { standard: 'm^3', k: 1e-6 },
  'm3': { standard: 'm^3', k: 1 }, 'm^3': { standard: 'm^3', k: 1 }, 'm³': { standard: 'm^3', k: 1 },
  'l': { standard: 'm^3', k: 1e-3 }, 'L': { standard: 'm^3', k: 1e-3 }, '升': { standard: 'm^3', k: 1e-3 },
  // 时间
  's': { standard: 's', k: 1 }, 'sec': { standard: 's', k: 1 }, '秒': { standard: 's', k: 1 },
  'min': { standard: 's', k: 60 }, '分钟': { standard: 's', k: 60 },
  'h': { standard: 's', k: 3600 }, 'hr': { standard: 's', k: 3600 }, '小时': { standard: 's', k: 3600 },
  // 质量
  'kg': { standard: 'kg', k: 1 }, '千克': { standard: 'kg', k: 1 }, '公斤': { standard: 'kg', k: 1 },
  'g': { standard: 'kg', k: 1e-3 }, '克': { standard: 'kg', k: 1e-3 },
  'mg': { standard: 'kg', k: 1e-6 }, '毫克': { standard: 'kg', k: 1e-6 },
  't': { standard: 'kg', k: 1000 }, '吨': { standard: 'kg', k: 1000 },
  // 力
  'n': { standard: 'N', k: 1 }, 'N': { standard: 'N', k: 1 }, '牛': { standard: 'N', k: 1 }, '牛顿': { standard: 'N', k: 1 },
  'kN': { standard: 'N', k: 1e3 }, 'mN': { standard: 'N', k: 1e-3 },
  // 能量/功
  'j': { standard: 'J', k: 1 }, 'J': { standard: 'J', k: 1 }, '焦': { standard: 'J', k: 1 }, '焦耳': { standard: 'J', k: 1 },
  'kj': { standard: 'J', k: 1e3 }, 'kJ': { standard: 'J', k: 1e3 },
  'wh': { standard: 'J', k: 3600 }, 'kwh': { standard: 'J', k: 3.6e6 }, 'kWh': { standard: 'J', k: 3.6e6 },
  'ev': { standard: 'J', k: 1.602176634e-19 }, 'eV': { standard: 'J', k: 1.602176634e-19 },
  // 功率
  'w': { standard: 'W', k: 1 }, 'W': { standard: 'W', k: 1 }, '瓦': { standard: 'W', k: 1 },
  'kw': { standard: 'W', k: 1e3 }, 'kW': { standard: 'W', k: 1e3 },
  // 压强/压强
  'pa': { standard: 'Pa', k: 1 }, 'Pa': { standard: 'Pa', k: 1 }, '帕': { standard: 'Pa', k: 1 },
  'kpa': { standard: 'Pa', k: 1e3 }, 'kPa': { standard: 'Pa', k: 1e3 }, 'mpa': { standard: 'Pa', k: 1e6 }, 'MPa': { standard: 'Pa', k: 1e6 },
  // 电学
  'a': { standard: 'A', k: 1 }, 'A': { standard: 'A', k: 1 }, '安培': { standard: 'A', k: 1 },
  'v': { standard: 'V', k: 1 }, 'V': { standard: 'V', k: 1 }, '伏': { standard: 'V', k: 1 },
  'coulomb': { standard: 'C', k: 1 }, 'c': { standard: 'C', k: 1 }, 'C': { standard: 'C', k: 1 }, '库仑': { standard: 'C', k: 1 },
  'ohm': { standard: 'Ω', k: 1 }, 'Ω': { standard: 'Ω', k: 1 }, '欧': { standard: 'Ω', k: 1 }, '欧姆': { standard: 'Ω', k: 1 },
  // 频率/周期
  'hz': { standard: 'Hz', k: 1 }, 'Hz': { standard: 'Hz', k: 1 }, '次/秒': { standard: 'Hz', k: 1 },
  // 磁学
  'T': { standard: 'T', k: 1 }, '特斯拉': { standard: 'T', k: 1 },
  'wb': { standard: 'Wb', k: 1 }, 'Wb': { standard: 'Wb', k: 1 }, '韦伯': { standard: 'Wb', k: 1 },
  // 角度/温度（°C 不能单靠倍率安全转换为 K，这里保留 °C）
  '°': { standard: '°', k: 1 }, 'deg': { standard: '°', k: 1 },
  '℃': { standard: '°C', k: 1 }, '°C': { standard: '°C', k: 1 },
  'K': { standard: 'K', k: 1 },
  // 复合速度/加速度等（常见写法）
  'm/s': { standard: 'm/s', k: 1 }, '米/秒': { standard: 'm/s', k: 1 },
  'km/h': { standard: 'm/s', k: 1000 / 3600 },
  'm/s2': { standard: 'm/s^2', k: 1 }, 'm/s^2': { standard: 'm/s^2', k: 1 }, 'm/s²': { standard: 'm/s^2', k: 1 },
  'n·m': { standard: 'N·m', k: 1 }, 'N·m': { standard: 'N·m', k: 1 }, '牛·米': { standard: 'N·m', k: 1 },
};

// 变量中文别名 → 标准符号
const VAR_SYNONYMS: Record<string, string> = {
  '质量': 'm', '重物质量': 'm',
  '速度': 'v', '初速度': 'v0', '末速度': 'v',
  '加速度': 'a', '向心加速度': 'a',
  '时间': 't', '时长': 't',
  '位移': 's', '路程': 's', '高度': 'h', '半径': 'r',
  '力': 'F', '拉力': 'F', '支持力': 'N' /*注意: 符号冲突时仍统一F*/,
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

// 常见常量默认值（若题目给出“取 g=10”则覆盖此处）
const DEFAULT_CONSTANTS: Parameter[] = [
  { symbol: 'g', value: 9.8, unit: 'm/s^2', role: 'constant', note: '重力加速度，未指定时默认 9.8' },
];

/* ---------------------------
 * 解析主入口
 * ------------------------- */

export function parseQuestion(question: string): ParsedQuestion {
  const text = normalizeText(question);

  // 1) 主题识别
  const topic = detectTopic(text);

  // 2) 单位扫描（收集原始→标准的映射）
  const unitMappings = collectUnits(text);

  // 3) 参数抽取（形如“v0=10m/s”“质量为2千克”“电阻5Ω”“取 g=10 m/s²”“求最大高度h”等）
  let parameters = extractParameters(text, unitMappings);

  // 4) 注入默认常量（若题面未覆盖）
  const hasG = parameters.some(p => p.symbol === 'g');
  if (!hasG) parameters = [...parameters, ...DEFAULT_CONSTANTS];

  // 5) 未知量识别（“求…X…” 或 “X为多少？”）
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
function detectTopic(text: string): string {
  // 关键词命中最多的主题
  let best: { id: string; zh: string; en?: string; score: number } | null = null;
  for (const rule of TOPIC_RULES) {
    const score = rule.keywords.reduce((acc, re) => acc + (re.test(text) ? 1 : 0), 0);
    if (score > 0) {
      if (!best || score > best.score) best = { ...rule, score };
    }
  }
  if (best) {
    return `${best.zh}${best.en ? `/${best.en}` : ''}`;
  }
  // 兜底：依据一些强触发词快速分类
  if (/电|电阻|电压|电流|欧姆|Ω|伏|V|安培|A/i.test(text)) return '直流电路与欧姆定律/DC Circuits';
  if (/磁|洛伦兹|qvB|特斯拉|T|回旋/i.test(text)) return '磁场与带电粒子运动/Magnetism';
  if (/透镜|焦距|像距|物距|折射|反射/i.test(text)) return '几何光学/Geometric Optics';
  if (/热|比热|温度|熔化|汽化/i.test(text)) return '热与内能/Thermal';
  if (/波|频率|周期|波长|声速|共振/i.test(text)) return '波与声音/Waves & Sound';
  return '一般力学/General Mechanics';
}

/* ---------------------------
 * 单位收集与标准化
 * ------------------------- */
function collectUnits(text: string): UnitMapping[] {
  const found = new Map<string, UnitMapping>();

  // 候选单位 token（含中文/英文/复合）
  const unitTokens = matchAll(
    text,
    /(km\/h|m\/s\^?2|m\/s²|m\/s|cm\^?2|cm²|cm\^?3|cm³|m\^?2|m²|m\^?3|m³|kwh|wh|kj|kJ|ev|eV|kpa|kPa|mpa|MPa|ohm|Ω|coulomb|[mk]?(m|g|n|j|w|v|a|t|pa|hz|wb|l|k|c)|米\/秒|牛·米|牛|焦|瓦|伏|帕|安培|特斯拉|厘米|毫米|千米|升|次\/秒|摄氏度|℃|°C|度|°)/gi
  );

  for (const u of unitTokens) {
    const raw = u.toString();
    const key = normalizeUnitKey(raw);
    const mapped = UNIT_ALIASES[key];
    if (mapped) {
      found.set(raw, { original: raw, standard: mapped.standard, conversion: mapped.k });
    } else {
      // 未收录的单位：保留原样，倍率记 1（避免错误换算）
      found.set(raw, { original: raw, standard: raw, conversion: 1 });
    }
  }
  // 特例：km/h 独立处理（正则已覆盖，这里确保大小写）
  if (/km\/h/i.test(text)) {
    found.set('km/h', { original: 'km/h', standard: 'm/s', conversion: 1000 / 3600 });
  }
  return Array.from(found.values());
}

function normalizeUnitKey(u: string): string {
  return u.replace(/\s+/g, '').replace(/（|）/g, '').replace(/[度]/g, '°').toLowerCase();
}

function dedupUnitMappings(arr: UnitMapping[]): UnitMapping[] {
  const m = new Map<string, UnitMapping>();
  for (const it of arr) {
    const k = `${it.original}=>${it.standard}`;
    if (!m.has(k)) m.set(k, it);
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
const CN_PATTERN: Array<{ re: RegExp; symbol: string }> = [
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

function extractParameters(text: string, unitMappings: UnitMapping[]): Parameter[] {
  const params: Parameter[] = [];

  // 1) 形式：v=10m/s, a=2 m/s^2
  for (const m of text.matchAll(VAR_RE)) {
    const sym = normalizeVar(m[1]);
    const val = parseFloat(m[2]);
    const tail = text.slice(m.index! + m[0].length);
    const unit = sniffImmediateUnit(tail, unitMappings);
    params.push({ symbol: sym, value: val, unit, raw: m[0], role: 'given', note: '等式赋值' });
  }

  // 2) 中文描述式
  for (const pat of CN_PATTERN) {
    for (const m of text.matchAll(pat.re)) {
      const val = parseFloat(m[1]);
      const uraw = m[2] ?? '';
      const unit = pickStandardUnit(uraw, unitMappings);
      params.push({ symbol: pat.symbol, value: val * unitScale(uraw), unit, raw: m[0], role: 'given', note: '中文叙述' });
    }
  }

  // 3) “X 为 多少/未知”的形式（不含数值）
  for (const [cn, sym] of Object.entries(VAR_SYNONYMS)) {
    if (new RegExp(`求.*${escapeReg(cn)}|${escapeReg(cn)}(的)?大小|${escapeReg(cn)}为多少`).test(text)) {
      if (!params.some(p => p.symbol === sym)) {
        params.push({ symbol: sym, value: null, unit: undefined, raw: cn, role: 'unknown', note: '题面求解目标' });
      }
    }
  }

  // 4) g 的覆盖（“取 g=10”）
  // 已在中文描述式覆盖；若写作 g=10，不带单位也接受
  if (/取\s*g\s*=\s*([-+]?(\d+(\.\d+)?|\.\d+)(e[-+]?\d+)?)/i.test(text)) {
    const gv = parseFloat(RegExp.$1);
    upsert(params, { symbol: 'g', value: gv, unit: 'm/s^2', role: 'constant', note: '题面指定 g' });
  }

  return params;
}

function normalizeVar(s: string): string {
  const k = s.trim();
  // 映射中文名称到标准符号
  if (VAR_SYNONYMS[k]) return VAR_SYNONYMS[k];
  // 统一下标写法 v0 / v_0 → v0
  return k.replace(/_/, '');
}

function sniffImmediateUnit(tail: string, unitMappings: UnitMapping[]): string | undefined {
  // 从等式后 0~20 字符内嗅探可能的单位
  const seg = tail.slice(0, 20);
  const hit = seg.match(/([a-zA-ZΩ°μ\/\.\^\d·]+|米\/秒|牛·米|摄氏度|千米|厘米|毫米|次\/秒)/);
  if (!hit) return undefined;
  return pickStandardUnit(hit[0], unitMappings);
}

function pickStandardUnit(raw: string, unitMappings: UnitMapping[]): string | undefined {
  if (!raw) return undefined;
  const key = normalizeUnitKey(raw);
  const alias = UNIT_ALIASES[key];
  if (alias) return alias.standard;
  // 若不在别名表里，看看已收集映射
  const found = unitMappings.find(u => normalizeUnitKey(u.original) === key);
  return found ? found.standard : raw;
}

function unitScale(raw: string): number {
  if (!raw) return 1;
  const alias = UNIT_ALIASES[normalizeUnitKey(raw)];
  return alias ? alias.k : 1;
}

/* ---------------------------
 * 未知量标记
 * ------------------------- */
function markUnknowns(text: string, params: Parameter[]): Parameter[] {
  // 语义：出现“求 X / X 为多少 / 最大速度/最大高度/射程”等
  // 典型：求最大高度h、求末速度v、求加速度a、求电流I
  const candidates: Array<{ sym: string; re: RegExp }> = [
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
function mergeBySymbol(list: Parameter[]): Parameter[] {
  const m = new Map<string, Parameter>();
  for (const p of list) {
    const exist = m.get(p.symbol);
    if (!exist) {
      m.set(p.symbol, p);
    } else {
      // 值优先级：given > constant > unknown
      const rank = (r?: string) => r === 'given' ? 3 : r === 'constant' ? 2 : 1;
      m.set(p.symbol, (rank(p.role) >= rank(exist.role)) ? p : exist);
    }
  }
  return Array.from(m.values());
}

/* ---------------------------
 * 辅助
 * ------------------------- */
function normalizeText(s: string): string {
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

function matchAll(text: string, re: RegExp): string[] {
  const out: string[] = [];
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) out.push(m[0]);
  return out;
}

function escapeReg(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function upsert(arr: Parameter[], item: Parameter) {
  const idx = arr.findIndex(p => p.symbol === item.symbol);
  if (idx === -1) arr.push(item);
  else arr[idx] = item;
}

/* ---------------------------------------
 * 示例（可在单元测试里调用）
 * ------------------------------------- */

// 用法：parseQuestion("一物体以初速度 v0=10 m/s 斜抛，取 g=10 m/s²，求最大高度h。")
// 返回：topic≈抛体运动；parameters 含 {v0=10}, {g=10}, {h=null}
