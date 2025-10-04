// services/ai_parsing/PhysicsAICaller.ts

// AI 配置接口
export interface AIConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableLogging?: boolean;
}

// AI 调用结果接口
export interface AICallResult {
  success: boolean;
  data?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 默认配置
export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'deepseek-v3',
  temperature: 0.1,
  maxTokens: 20000,
  timeout: 30000,
  enableLogging: process.env.NODE_ENV === 'development'
};

/**
 * PhysicsContract AI调用器 - 将物理题目解析为PhysicsContract格式的JSON
 * 用于直接驱动后续的仿真/渲染视频生成流水线
 */
export class PhysicsAICaller {
  private config: AIConfig;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      ...DEFAULT_AI_CONFIG,
      ...config
    };
    
    // 验证配置
    if (!this.config.apiKey && this.config.enableLogging) {
      console.warn('PhysicsAICaller 配置警告: API Key 未设置');
    }
  }

  /**
   * 直接调用AI API，返回原始结果
   * @param prompt 提示词
   * @returns AI原始响应
   */
  async callAI(prompt: string): Promise<AICallResult> {
    try {
      if (this.config.enableLogging) {
        console.log('🤖 正在调用AI...');
        console.log(`📝 提示词长度: ${prompt.length} 字符`);
      }

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (this.config.enableLogging) {
        console.log('✅ AI调用成功');
        console.log(`📊 Token使用: ${data.usage?.total_tokens || '未知'}`);
      }
      
      return {
        success: true,
        data: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      };
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ AI调用失败:', (error as Error).message);
      }
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 使用题目直接调用AI，返回PhysicsContract格式的原始响应
   * @param question 物理题目
   * @returns AI原始响应（PhysicsContract格式的JSON字符串）
   */
  async parseQuestion(question: string): Promise<AICallResult> {
    const prompt = `物理题目解析为PhysicsContract

任务：你将收到一段中文或英文的初/高中牛顿力学题目。将物理题目转换为PhysicsContract JSON，仅包含6个顶层键：world, engine, bodies, constraints, event_rules, end_conditions。该 JSON 将直接被我们的 Matter.js 适配器消费以进行物理仿真与渲染。

输出要求：
- 只输出一个JSON对象，使用json代码块格式
- 禁止任何解释文字、注释或额外信息
- 单位：SI制（m, kg, s, N, rad），角度用弧度
- 坐标系：xy_y_down（x向右，y向下）

关键规则：
- 所有几何参数必须通过数学计算，禁止猜测
- 斜坡高度 = 长度 × sin(角度)，水平投影 = 长度 × cos(角度)
- 物体位置基于几何关系精确计算
- 验证物体间距离是否符合题目要求

字段规范：
world: {coord: "xy_y_down", units: {length: "m", time: "s", mass: "kg", angle: "rad"}, gravity: [0, 9.8], bounds: {min: [-2, -2], max: [10, 6]}}
engine: {dt: 0.0166667, substeps: 2, positionIterations: 6, velocityIterations: 4}

bodies: 刚体数组，每个元素包含：
- 静态体：{id: "ramp", shape: "box", isStatic: true, position: [x,y], angle: rad, size: {w,h}, friction: 0}
- 动态体：{id: "ball1", shape: "circle", isStatic: false, position: [x,y], r: radius, mass: kg, friction: 0}
- 摩擦系数：题目给出μ值，球体通常friction=0
- 碰撞筛选：{category: 1, mask: 65535, group: 0}

禁止输出任何解释、注释、额外文本、空行说明、Markdown 标题。

单位必须为 SI（m, kg, s, N, rad）；所有角度一律用弧度（rad）。

坐标系固定为 xy_y_down（x 向右为正，y 向下为正）。

若题目缺少必要参数，使用下文"缺省值规则"，但不可省略必需字段。

斜面/地面/粗糙段/墙体等必须用 bodies 中的静态刚体表达；摩擦系数设在刚体本身（不是表面 contact）。

**完全非弹性碰撞（粘连）**必须通过 event_rules 的 merge_bodies 行为实现；仅 restitution=0 不代表粘连。

如题目包含"碰撞后连接弹簧/绳索"，请在 event_rules 中用 attach_constraint 动态接入。

end_conditions 必须能保证仿真结束（如 maxTime 或 speedBelow）。

一、输出 JSON 的顶层结构（六键且仅六键）
{
  "world": {...},
  "engine": {...},
  "bodies": [...],
  "constraints": [...],
  "event_rules": [...],
  "end_conditions": {...}
}

禁止出现除上述六键以外的任何顶层键（例如：render、materials、sensors、samples、answers、meta、assumptions 等）。

二、字段规范（逐项硬指标）
1) world —— 仿真世界参数（必填）
"world": {
  "coord": "xy_y_down",
  "units": { "length": "m", "time": "s", "mass": "kg", "angle": "rad" },
  "gravity": [0, 9.8],
  "bounds": { "min": [-10, -10], "max": [50, 30] }
}

coord：固定写 "xy_y_down"。
units：固定四项，单位如上。
gravity：二维向量，通常 [0, 9.8] 表示竖直向下。
bounds：仿真边界，避免物体飞出世界。

2) engine —— 数值积分参数（必填）
"engine": {
  "dt": 0.0166667,
  "substeps": 2,
  "positionIterations": 6,
  "velocityIterations": 4
}

dt：步长（秒），默认 1/60。
substeps：每步子迭代次数（>1 提稳）。
positionIterations / velocityIterations：碰撞求解迭代次数。

3) bodies —— 所有刚体（必填，数组≥1）

每个元素（刚体）必须按下列规范生成：

{
  "id": "unique_string",
  "shape": "box|circle|polygon",
  "isStatic": false,
  "position": [x_m, y_m],
  "angle": 0.0,
  "size": { "w": 0.2, "h": 0.2 },
  "r": 0.1,
  "vertices": [[x,y]],
  "mass": 1.0,
  "density": null,
  "friction": 0.2,
  "frictionStatic": 0.5,
  "restitution": 0.0,
  "collisionFilter": { "category": 1, "mask": 65535, "group": 0 }
}

约束/说明：

形状：斜面/地面/粗糙段/墙体 → isStatic:true 的 box 或 polygon；运动物体（滑块/小球/木块等）→ isStatic:false。

几何：
box 需给 size.w、size.h；
circle 需给 r；
polygon 需给 vertices（世界坐标，按顺时针或逆时针）。

质量：若题目给质量，用 mass；如既给 mass 又给 density，以 mass 为准，density 置 null。

摩擦：friction≈动摩擦 μₖ，frictionStatic≈静摩擦 μₛ。若题目仅给一个 μ，则两者都设为该值。

弹性：restitution=0 表示完全非弹性接触，但不等于"粘住"。

碰撞筛选：无特别需要用默认 {category:1, mask:65535, group:0}。

初始穿透保护：动态体相对支撑面抬高 ~0.001 m。

角度：一律用 rad（例：30°→0.5235987756）。

4) constraints —— 约束/弹簧（可为空数组）
{
  "id": "spring1",
  "type": "spring",
  "a": { "body": "A_id_or_null", "point": null },
  "b": { "body": "B_id_or_null", "point": null },
  "length": 0.0,
  "stiffness": 0.9,
  "damping": 0.0
}

约束/说明：

仅支持类型 "spring"（可作为距离约束/弹簧近似）。

a.body / b.body 可为 null 表示暂不连接（便于"碰撞后再接入"）。

题面若给物理弹簧常数 k (N/m)，这里使用 stiffness ∈ (0,1] 近似（若未给映射，默认 0.6–0.95；常用 0.8–0.9 稳定）。

若题意要求"碰撞后再压缩弹簧"，初始可把一端接墙、另一端 null，在 event_rules 中再 attach_constraint 到目标刚体。

5) event_rules —— 事件规则（可为空数组）

事件用于完全非弹性"粘连"、动态接入/替换约束、修改属性等。
允许的触发/动作格式如下：

{
  "when": { "on": "collisionStart|collisionActive|time|position", "a": "bodyIdA", "b": "bodyIdB" },
  "do": [
    { "action": "merge_bodies", "ids": ["id1","id2"], "newId": "combo" },
    { "action": "attach_constraint", "constraint": { "id": "spring1", "a": { "body": "combo", "point": null }, "b": { "body": "wall", "point": null } } },
    { "action": "set_property", "id": "combo", "prop": "restitution", "value": 0.0 }
  ],
  "once": true
}

约束/说明：

粘连：必须使用 merge_bodies；newId 为合体 ID（建议用 "combo"）。

动态接入弹簧：用 attach_constraint，把既存 id 的约束绑定到指定 body（wall↔combo 等）。

属性修改：用 set_property（如将新体 restitution 设 0）。

when.on 常用 "collisionStart"；a/b 为参与碰撞的 body ID。

once:true 代表只触发一次，防止重复合并。

6) end_conditions —— 终止条件（必填）
"end_conditions": {
  "maxTime": 12.0,
  "stopWhen": [
    { "type": "speedBelow", "id": "combo", "v": 0.02, "hold": 0.2 }
  ]
}

约束/说明：

至少提供 maxTime 或一个 stopWhen 条件，推荐两者并存。

常用 speedBelow：当某刚体（如粘连后 combo）速度低于阈值并持续 hold 秒时结束。

三、参数推导规则（必须严格遵循）

重力：gravity = [0, 9.8]。

斜面无摩擦时，接触面的 friction = 0、frictionStatic = 0。

**关键：所有几何参数必须通过数学计算得出，禁止猜测**

## 通用几何计算规则

### 1. 坐标系建立
- 建立清晰的参考坐标系
- 通常以地面为y=0基准线
- 斜坡底端通常设为原点[0,0]

### 2. 斜坡几何计算通用公式
- 斜坡长度 = 题目给出的长度
- 斜坡角度 = 题目给出的角度（转换为弧度）
- 斜坡高度 = 长度 × sin(角度)
- 斜坡水平投影 = 长度 × cos(角度)
- 斜坡厚度 = 合理值（0.02-0.05m，用于碰撞检测）

斜坡中心位置计算：
- 斜坡底端 = [0, 地面厚度]
- 斜坡顶端 = [水平投影, 高度 + 地面厚度]
- 斜坡中心 = [水平投影/2, (高度 + 地面厚度)/2]

### 3. 物体位置计算通用方法
A. 斜坡上的物体：
   - 在斜坡顶端：位置 = 斜坡顶端坐标 + 物体半径偏移
   - 在斜坡中间：位置 = 斜坡中心坐标 + 物体半径偏移
   - 在斜坡底端：位置 = 斜坡底端坐标 + 物体半径偏移

B. 距离斜坡指定距离的物体：
   - 距离斜坡右端5cm：位置 = [斜坡右端x + 5cm + 物体半径, 地面高度 + 物体半径]
   - 距离斜坡左端5cm：位置 = [斜坡左端x - 5cm - 物体半径, 地面高度 + 物体半径]
   - 距离斜坡前后：类似计算y坐标

C. 物体半径偏移计算：
   - 圆形物体在斜坡上的偏移 = [物体半径 × sin(角度), 物体半径 × cos(角度)]
   - 圆形物体在地面上的偏移 = [物体半径, 物体半径]

### 4. 距离验证通用方法
- 两物体间距离 = sqrt((x2-x1)² + (y2-y1)²)
- 物体到斜坡距离 = 计算物体中心到斜坡边缘的最短距离
- 必须验证计算出的距离与题目要求一致

### 5. 尺寸设置通用原则
- 小球半径：0.005-0.02m（质量小用较小半径）
- 大球半径：0.01-0.03m（质量大用较大半径）
- 地面厚度：0.01-0.02m
- 斜坡厚度：0.02-0.05m
- 避免物体尺寸过大导致仿真不稳定

### 6. 质量设置原则
- 严格按照题目给出的质量值
- 不与尺寸直接关联
- 质量大的物体可以设置较大的半径以保证稳定性

### 7. 通用计算示例

#### 斜坡碰撞问题计算示例
题目：斜坡长5cm，角度30°，小球在顶端，另一球距离斜坡5cm

计算过程：
1. 斜坡长度 = 0.05m
2. 斜坡角度 = 30° = 0.5236 rad
3. 斜坡高度 = 0.05 × sin(30°) = 0.025m
4. 斜坡水平投影 = 0.05 × cos(30°) = 0.0433m
5. 斜坡厚度 = 0.03m（合理值）
6. 地面厚度 = 0.01m

坐标系建立：
- 地面y = 0.01m（地面厚度的一半）
- 斜坡底端 = [0, 0.01]
- 斜坡顶端 = [0.0433, 0.025 + 0.01] = [0.0433, 0.035]

物体位置计算：
- 小球半径 = 0.01m，质量 = 0.5kg
- 大球半径 = 0.015m，质量 = 1kg
- 小球位置 = [0.0433, 0.035 - 0.01] = [0.0433, 0.025]
- 大球位置 = [0 + 0.05 + 0.015, 0.01 + 0.015] = [0.065, 0.025]

距离验证：
- 两球距离 = sqrt((0.065-0.0433)² + (0.025-0.025)²) = 0.0217m ≈ 2.17cm
- 大球到斜坡距离 = 0.05m = 5cm ✓

#### 其他题型通用计算方法
- 弹簧问题：弹簧长度 = 题目给出，连接点位置 = 几何计算
- 斜面滑动：物体在斜面上的位置 = 根据题目描述计算
- 碰撞问题：确保两物体间距离 = 题目要求的距离

弹簧：若仅给出"有弹簧"未给 k，设 stiffness=0.9、damping=0、length=0；如需"碰撞后生效"，在事件里 attach_constraint。

恢复系数默认 0.0，除非题面明确给出弹性碰撞。

粘连一律通过 merge_bodies 实现（不是仅靠 restitution=0）。

四、常见题型到建模指引（生成时直接套用）

斜面 → 粗糙段 → 非弹性碰撞 → 弹簧

bodies：ramp（静态、倾角 rad、无摩擦）、rough（静态、μ=题面）、wall（静态）、slider（m）、block（M）。

constraints：预置 spring1 一端接 wall，另一端先留空或接 null。

event_rules：collisionStart slider×block → merge_bodies→ 新 ID combo → attach_constraint spring1 连接到 combo。

end_conditions：maxTime + speedBelow(combo)。

纯弹性/部分弹性碰撞：设置两体 restitution 为题面给定值；若不粘连，不使用 merge_bodies。

水平面匀摩擦滑动：水平静态面 friction=μ；物体设置初速或受力。

斜面静摩擦阈值：给 frictionStatic=μs；若会滑动，动态过程体现为克服静摩擦后运动。

五、最终输出格式（再次强调）

只允许输出一个 JSON 对象，放在 json fenced code block 中。

绝对禁止任何解释性文字、注释或额外键。

结构、字段名、大小写必须与本规范一致。

**重要：输出格式必须是纯JSON，只包含PhysicsContract的六个顶层键**

【题目文本】

${question}

**重要：只输出PhysicsContract的六个顶层键，不要任何其他内容**

## 输出要求
- 只输出一个JSON对象
- 必须包含且仅包含这6个顶层键：world, engine, bodies, constraints, event_rules, end_conditions
- 禁止输出任何其他键（如timestamp, rawJson, parsed, duration等）
- 禁止输出任何解释文字、注释或额外信息

## 解析步骤（必须按顺序执行）

### 第1步：参数提取
- 提取题目中的所有数值参数（长度、角度、质量、距离等）
- 识别物体的相对位置关系
- 确定摩擦系数、弹性系数等物理参数

### 第2步：几何计算
- 根据斜坡长度和角度计算斜坡高度和水平投影
- 建立坐标系，确定斜坡的关键点坐标
- 计算物体在斜坡上的精确位置

### 第3步：位置验证
- 验证物体间距离是否符合题目要求
- 检查物体是否会发生初始穿透
- 确保斜坡与地面正确连接

### 第4步：尺寸合理性检查
- 确保物体尺寸在合理范围内
- 避免物体过大导致仿真不稳定
- 根据质量设置合适的物体大小

### 第5步：碰撞可行性验证
- 确保碰撞能够发生
- 验证初始位置不会导致物体直接重叠
- 检查仿真边界是否足够大

### 第6步：最终验证
- 重新计算所有关键距离
- 验证几何关系的数学正确性
- 确保所有参数都有明确的计算依据

**禁止猜测任何参数，所有数值必须有计算依据**

（可选参考）极简模板骨架（生成时替换为具体值）

注意：这段只是帮助你把握形状；实际输出不能包含注释或省略号。

\`\`\`json
{
  "world": {
    "coord": "xy_y_down",
    "units": { "length": "m", "time": "s", "mass": "kg", "angle": "rad" },
    "gravity": [0, 9.8],
    "bounds": { "min": [-2, -2], "max": [10, 6] }
  },
  "engine": {
    "dt": 0.0166667,
    "substeps": 2,
    "positionIterations": 6,
    "velocityIterations": 4
  },
  "bodies": [
    { "id":"ramp","shape":"box","isStatic":true,"position":[...],"angle":...,"size":{"w":...,"h":...},"friction":0,"frictionStatic":0,"restitution":0,"collisionFilter":{"category":1,"mask":65535,"group":0} },
    { "id":"rough","shape":"box","isStatic":true,"position":[...],"angle":0,"size":{"w":...,"h":...},"friction":0.25,"frictionStatic":0.25,"restitution":0,"collisionFilter":{"category":1,"mask":65535,"group":0} },
    { "id":"wall","shape":"box","isStatic":true,"position":[...],"angle":0,"size":{"w":...,"h":...},"friction":0.2,"frictionStatic":0.2,"restitution":0,"collisionFilter":{"category":1,"mask":65535,"group":0} },
    { "id":"slider","shape":"box","isStatic":false,"position":[...],"angle":0,"size":{"w":0.2,"h":0.2},"mass":1.0,"friction":0,"frictionStatic":0,"restitution":0,"collisionFilter":{"category":1,"mask":65535,"group":0} },
    { "id":"block","shape":"box","isStatic":false,"position":[...],"angle":0,"size":{"w":0.4,"h":0.25},"mass":2.0,"friction":0.1,"frictionStatic":0.1,"restitution":0,"collisionFilter":{"category":1,"mask":65535,"group":0} }
  ],
  "constraints": [
    { "id":"spring1","type":"spring","a":{"body":"wall","point":null},"b":{"body":null,"point":null},"length":0.0,"stiffness":0.9,"damping":0.0 }
  ],
  "event_rules": [
    { "when":{"on":"collisionStart","a":"slider","b":"block"},
      "do":[
        { "action":"merge_bodies","ids":["slider","block"],"newId":"combo" },
        { "action":"attach_constraint","constraint":{"id":"spring1","a":{"body":"combo","point":null},"b":{"body":"wall","point":null}} },
        { "action":"set_property","id":"combo","prop":"restitution","value":0.0 }
      ],
      "once": true
    }
  ],
  "end_conditions": {
    "maxTime": 12.0,
    "stopWhen": [ { "type":"speedBelow", "id":"combo", "v":0.02, "hold":0.2 } ]
  }
}
\`\`\``;

    return await this.callAI(prompt);
  }

  /**
 * 使用自定义提示词调用AI（保持不变）
 */
async callWithCustomPrompt(prompt: string): Promise<AICallResult> {
  return await this.callAI(prompt);
}

/**
 * 深冻结（只读保护），避免后续代码误改解析对象
 */
private deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    // @ts-ignore
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      // @ts-ignore
      const val = obj[prop];
      if (val && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
        this.deepFreeze(val);
      }
    });
  }
  return obj;
}

/**
 * 解析AI响应为结构化对象，但不修改任何数值/公式/空白等。
 * 返回原始 JSON 字符串 + 只读的预览解析对象（仅作校验/展示，禁止回写）。
 */
parseAIResponse(response: string): { rawJson: string; parsed?: any } | null {
  if (!response || typeof response !== 'string') return null;

  const extractedJson = this.extractJsonSafely(response);
  if (!extractedJson) {
    if (this.config.enableLogging) console.warn('AI 响应解析失败，无法提取 JSON');
    return null;
  }

  // 仅尝试解析用于校验；失败也不修改 rawJson
  try {
    const parsed = JSON.parse(extractedJson);
    const frozen = this.deepFreeze(parsed);
    if (this.config.enableLogging) console.log('✅ JSON 解析成功（只读预览），原文未改动');
    return { rawJson: extractedJson, parsed: frozen };
  } catch (e) {
    if (this.config.enableLogging) {
      console.warn('⚠️ JSON 解析失败（保留原文原样返回给 Contract）：', (e as Error).message);
    }
    return { rawJson: extractedJson }; // 解析失败也照样把原始 JSON 交给 Contract
    }
  }

  /**
 * 安全地提取 JSON 原文切片：只定位，不清洗，不改动字符
 */
private extractJsonSafely(response: string): string | null {
  // 策略1：优先匹配 markdown 代码块中的 JSON（保留原始内部文本，包含原有换行与空格）
  const md = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (md && md[1]) return md[1];

  // 策略2：全局从第一个 '{' 到最后一个 '}' 的切片（不 trim），若能 JSON.parse 成功即可
  const firstBrace = response.indexOf('{');
  const lastBrace = response.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = response.substring(firstBrace, lastBrace + 1);
    try { JSON.parse(candidate); return candidate; } catch { /* 继续 */ }
  }

  // 策略3：全局从第一个 '[' 到最后一个 ']' 的切片（不 trim）
  const firstBracket = response.indexOf('[');
  const lastBracket = response.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = response.substring(firstBracket, lastBracket + 1);
    try { JSON.parse(candidate); return candidate; } catch { /* 继续 */ }
  }

  // 策略4：逐行扫描，使用括号计数法提取一个平衡 JSON 对象（保留每行原文，不做 trim）
  const lines = response.split('\n');
  let jsonLines: string[] = [];
  let braceCount = 0;
  let inJson = false;

  for (const line of lines) {
    const startsObj = line.trimStart().startsWith('{');
    const startsArr = line.trimStart().startsWith('[');

    if (!inJson && (startsObj || startsArr)) {
      inJson = true;
      jsonLines = [line]; // 原样收集
      // 统计当前行大括号差值
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      // 也考虑数组括号
      braceCount += (line.match(/\[/g) || []).length;
      braceCount -= (line.match(/\]/g) || []).length;
      if (braceCount === 0) {
        const candidate = jsonLines.join('\n');
        try { JSON.parse(candidate); return candidate; } catch { inJson = false; jsonLines = []; }
      }
      continue;
    }

    if (inJson) {
      jsonLines.push(line); // 原样收集
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      braceCount += (line.match(/\[/g) || []).length;
      braceCount -= (line.match(/\]/g) || []).length;

      if (braceCount === 0) {
        const candidate = jsonLines.join('\n');
        try { JSON.parse(candidate); return candidate; } catch {
          // 重置状态，继续尝试后续可能的 JSON 块
          inJson = false; jsonLines = []; braceCount = 0;
        }
      }
    }
  }

  return null;
}

/**
 * 直接获取“原始 JSON 字符串”用于 Contract 层（零改动）
 */
getRawJsonForContract(response: string): string | null {
  const obj = this.parseAIResponse(response);
  return obj?.rawJson ?? null;
}

/**
 * 解析物理题目并返回：原始 JSON（用于 Contract）+ 只读预览对象（可选）
 */
async parseQuestionAsJSON(question: string): Promise<{ rawJson: string; parsed?: any }> {
  const aiResult = await this.parseQuestion(question);
  if (!aiResult.success) throw new Error(`AI调用失败: ${aiResult.error}`);

  const parsed = this.parseAIResponse(aiResult.data || '');
  if (!parsed) throw new Error('AI响应解析失败：无法提取有效的JSON');

  // ✅ Contract 层请使用 parsed.rawJson；parsed.parsed 仅用于你本地预览与校验
  return parsed;
}

}