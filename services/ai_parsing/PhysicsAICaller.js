"use strict";
// services/ai_parsing/PhysicsAICaller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsAICaller = exports.DEFAULT_AI_CONFIG = void 0;
// 默认配置
exports.DEFAULT_AI_CONFIG = {
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
class PhysicsAICaller {
    constructor(config = {}) {
        this.config = {
            ...exports.DEFAULT_AI_CONFIG,
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
    async callAI(prompt) {
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
        }
        catch (error) {
            if (this.config.enableLogging) {
                console.error('❌ AI调用失败:', error.message);
            }
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * 使用题目直接调用AI，返回PhysicsContract格式的原始响应
     * @param question 物理题目
     * @returns AI原始响应（PhysicsContract格式的JSON字符串）
     */
    async parseQuestion(question) {
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

constraints: 弹簧约束数组，格式：
{id: "spring1", type: "spring", a: {body: "wall", point: null}, b: {body: null, point: null}, length: 0, stiffness: 0.9, damping: 0}

event_rules: 事件规则数组，格式：
{when: {on: "collisionStart", a: "ball1", b: "ball2"}, do: [{action: "merge_bodies", ids: ["ball1", "ball2"], newId: "combo"}], once: true}

end_conditions: 终止条件，格式：
{maxTime: 12.0, stopWhen: [{type: "speedBelow", id: "combo", v: 0.02, hold: 0.2}]}

几何计算示例（斜坡碰撞题）：
斜坡长度=5cm，角度=30° → 高度=0.025m，水平投影=0.0433m
小球在斜坡顶端：位置=[0.0433, 0.025]
大球距离斜坡5cm：位置=[0.1083, 0.02]

【题目文本】
${question}

只输出PhysicsContract JSON，不要其他内容。`;
        return await this.callAI(prompt);
    }
    /**
   * 使用自定义提示词调用AI（保持不变）
   */
    async callWithCustomPrompt(prompt) {
        return await this.callAI(prompt);
    }
    /**
     * 深冻结（只读保护），避免后续代码误改解析对象
     */
    deepFreeze(obj) {
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
    parseAIResponse(response) {
        if (!response || typeof response !== 'string')
            return null;
        const extractedJson = this.extractJsonSafely(response);
        if (!extractedJson) {
            if (this.config.enableLogging)
                console.warn('AI 响应解析失败，无法提取 JSON');
            return null;
        }
        // 仅尝试解析用于校验；失败也不修改 rawJson
        try {
            const parsed = JSON.parse(extractedJson);
            const frozen = this.deepFreeze(parsed);
            if (this.config.enableLogging)
                console.log('✅ JSON 解析成功（只读预览），原文未改动');
            return { rawJson: extractedJson, parsed: frozen };
        }
        catch (e) {
            if (this.config.enableLogging) {
                console.warn('⚠️ JSON 解析失败（保留原文原样返回给 Contract）：', e.message);
            }
            return { rawJson: extractedJson }; // 解析失败也照样把原始 JSON 交给 Contract
        }
    }
    /**
   * 安全地提取 JSON 原文切片：只定位，不清洗，不改动字符
   */
    extractJsonSafely(response) {
        // 策略1：优先匹配 markdown 代码块中的 JSON（保留原始内部文本，包含原有换行与空格）
        const md = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (md && md[1])
            return md[1];
        // 策略2：全局从第一个 '{' 到最后一个 '}' 的切片（不 trim），若能 JSON.parse 成功即可
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const candidate = response.substring(firstBrace, lastBrace + 1);
            try {
                JSON.parse(candidate);
                return candidate;
            }
            catch { /* 继续 */ }
        }
        // 策略3：全局从第一个 '[' 到最后一个 ']' 的切片（不 trim）
        const firstBracket = response.indexOf('[');
        const lastBracket = response.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            const candidate = response.substring(firstBracket, lastBracket + 1);
            try {
                JSON.parse(candidate);
                return candidate;
            }
            catch { /* 继续 */ }
        }
        // 策略4：逐行扫描，使用括号计数法提取一个平衡 JSON 对象（保留每行原文，不做 trim）
        const lines = response.split('\n');
        let jsonLines = [];
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
                    try {
                        JSON.parse(candidate);
                        return candidate;
                    }
                    catch {
                        inJson = false;
                        jsonLines = [];
                    }
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
                    try {
                        JSON.parse(candidate);
                        return candidate;
                    }
                    catch {
                        // 重置状态，继续尝试后续可能的 JSON 块
                        inJson = false;
                        jsonLines = [];
                        braceCount = 0;
                    }
                }
            }
        }
        return null;
    }
    /**
     * 直接获取“原始 JSON 字符串”用于 Contract 层（零改动）
     */
    getRawJsonForContract(response) {
        const obj = this.parseAIResponse(response);
        return obj?.rawJson ?? null;
    }
    /**
     * 解析物理题目并返回：原始 JSON（用于 Contract）+ 只读预览对象（可选）
     */
    async parseQuestionAsJSON(question) {
        const aiResult = await this.parseQuestion(question);
        if (!aiResult.success)
            throw new Error(`AI调用失败: ${aiResult.error}`);
        const parsed = this.parseAIResponse(aiResult.data || '');
        if (!parsed)
            throw new Error('AI响应解析失败：无法提取有效的JSON');
        // ✅ Contract 层请使用 parsed.rawJson；parsed.parsed 仅用于你本地预览与校验
        return parsed;
    }
}
exports.PhysicsAICaller = PhysicsAICaller;
