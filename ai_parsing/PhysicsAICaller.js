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
        this.config = Object.assign(Object.assign({}, exports.DEFAULT_AI_CONFIG), config);
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
        var _a;
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
                console.log(`📊 Token使用: ${((_a = data.usage) === null || _a === void 0 ? void 0 : _a.total_tokens) || '未知'}`);
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
        const prompt = `你是“初中-高中物理题 → 解析文档(ParseDoc) → Contract 层 → 确定性仿真/渲染视频”的结构化解析专家。
请把下面【题目】解析为“仅 JSON”（无Markdown、无多余文字），用于驱动 Contract 层装配 PhysicsContract 并生成与题意一致、物理逻辑自洽的视频。

【题目】
${question}

【你的输出目标】
生成 **ParseDoc v2**（叙事 + 物理语义 + 可计算计划 + 预解数值），使 Contract 层“零猜测”地完成实体、阶段、交互、事件与镜头配置。你需要：
1) 完整描述题意的“分镜叙事 + 阶段语义”；
2) 抽取题面量与单位，统一到 SI，并标注维度与溯源；
3) 给出要输出的物理量列表（asks）；
4) 产出"可计算计划"（compute_plan）：给方法、公式、依赖项，并**给出数值预解**（若可计算），但必须标注为 status:"derived_hint"，最终以确定性计算为准；
5) 声明关键事件与触发（碰撞粘连、最大压缩、开关通断等）；
6) 给出渲染提示（取景、标注、慢动作、字幕节点）；
7) 自检并消除物理矛盾（单位/量纲、阶段覆盖、事件引用一致性）。

【数值计算政策（重要）】
- 允许在解析阶段给出**数值预解**（preview），必须在 compute_plan[*].preview 中提供，并标注：
  - status:"derived_hint"（仅供展示与对照，最终以确定性计算/仿真结果覆盖）
  - provenance:{formula, assumptions[], confidence}
- 你必须确保预解符合题意与物理适用条件：
  - **可直接一步代入/纯代数/常见高中闭式解** → 允许给出数值预解（如光滑斜面 v0=√(2gh)，薄透镜公式，串并联等效电阻等）。
  - **多阶段含耗散/含极值或根查找** → 也可以给出数值预解，但必须明确公式与假设，并保持 status:"derived_hint"，**不得锁死** Contract 层求解。
- 如题面缺参或语义不确定：给出 formula 与 depends_on，设置 policy:"formula_only"，并在 lints.blockers 标出缺口。

【输出 JSON 结构（必须严格遵守键名与层级；可按需精简空数组）】
{
  "meta": {
    "schema_version": "parse-doc/2.0.0",
    "language": "zh-CN|en|mixed",
    "topics": ["energy","friction","momentum","spring","circuit","optics","waves","thermal","gravity","circular_motion"],
    "render_mode_hint": "simulation|illustration",
    "strict_mode": true
  },

  "narrative": {
    "beats": [
      { "id":"B1", "title":"", "text":"", "stage_ref":"S1", "visual_cues":["受力分解","速度矢量","能量流字幕"] }
    ]
  },

  "actors": [
    { "id":"A_slider", "label":"小滑块", "class":"slider|block|ball|spring|board|ground|source|resistor|lens|mirror|pulley|rope|cart|node|medium", "movable":true,
      "attributes": { "mass": { "symbol":"m" }, "stiffness": { "symbol":"k" }, "restitution": { "symbol":"e" }, "friction": { "symbol":"μ" }, "notes": "" } }
  ],

  "quantities": [
    { "symbol":"m", "name":"小滑块质量", "value":1, "unit":"kg",
      "si":{"value":1,"unit":"kg"}, "role":"given|constant|unknown|derived_hint", "dimension":"M",
      "source":{"raw":"原文片段","span":[0,0],"rule":"pattern","confidence":0.99} }
  ],

  "stages": [
    { "id":"S1", "label":"", "intent":"自然语言说明该阶段的物理意图",
      "interactions":[
        { "type":"contact|collision|spring|rope|field|circuit|optical",
          "between":["A","B"], "model":"kinetic_coulomb|static_no_friction|impulse_inelastic|spring_hooke|rope_inextensible|electrical_connection|optical_interface",
          "params":["μ","e","k","n1","n2"], "notes":"" }
      ],
      "entry": { "state":"进入条件/初始状态描述" },
      "exit":  { "state":"退出条件/终止事件描述" }
    }
  ],

  "constraints": {
    "hard": [
      { "expr":"S1 no friction", "tol":0 },
      { "expr":"S2 length == d", "tol":1e-6 }
    ],
    "soft": [
      { "expr":"ignore air drag", "weight":0.8, "note":"常规近似" }
    ],
    "stage_logic": [
      { "expr":"S1 -> S2 -> S3", "note":"阶段顺序唯一" }
    ]
  },

  "asks": [
    { "id":"v0|I|f'|x_max", "meaning":"要输出的物理量含义", "kind":"scalar|vector|extremum|event_value",
      "stage_refs":["S1"], "report_style":"value_with_unit|value_only|value_and_formula" }
  ],

  "compute_plan": [
    { "id":"v0", "stage":"S1", "method":"energy_conservation|momentum_inelastic|work_energy_with_friction|thin_lens|circuit_reduction|kinematics",
      "formula":"v0 = sqrt(2*g*h)",
      "depends_on":["g","h"],
      "solve_for":"可选，如 x",
      "policy":"allow_value|formula_only|defer_to_solver",
      "preview": { "value": 4.95, "unit":"m/s", "status":"derived_hint" },
      "provenance": { "assumptions":["smooth surface"], "confidence":0.99 }
    }
  ],

  "events": [
    { "id":"E_merge", "stage_ref":"S3",
      "trigger": { "collision_between":["A1","A2"], "threshold":1e-3 },
      "effects": [ { "type":"merge", "what":["A1","A2"], "new_id":"A_assembly" } ],
      "captions": ["碰撞并粘连，速度变 v2"] }
  ],

  "render_hints": {
    "camera": { "fit":"both", "margin":0.5, "show_grid":true, "background":"#ffffff" },
    "overlays": { "vectors":["v","F"], "labels":true, "tracks":["COM"] },
    "captions": [
      { "at_stage":"S1", "text":"能量守恒：v0 = √(2gh)" }
    ],
    "slow_mo": [
      { "around_event":"E_merge", "window":0.2 }
    ]
  },

  "lints": {
    "warnings": ["可空：单位别名已规范化","可空：合体与地面摩擦将由 Contract 层继承 μ"],
    "blockers": ["若缺少必须参数请列出"],
    "ok": true
  }
}

【返回前自检（必须通过）】
- 单位/量纲一致：value 与 unit 匹配，复合单位合法（m/s^2, N·m, kg·m/s^2, Ω, F, H, W, Pa, J 等）。
- 阶段覆盖：题面出现的情节（粗糙、碰撞、弹簧、光学成像、电路连接等）在 stages.interactions 中必须体现。
- 事件引用一致：events 中引用的 id 必须在 actors/stages中存在；若发生 merge，后续引用使用 new_id。
- 计算计划完整：compute_plan[*].depends_on 出现在 quantities 或明确标为 unknown。
- 仅输出合法 JSON（UTF-8），无注释、无 NaN/Inf、无多余文本。
`;
        return await this.callAI(prompt);
    }
    /**
     * 使用自定义提示词调用AI
     * @param prompt 自定义提示词
     * @returns AI原始响应
     */
    async callWithCustomPrompt(prompt) {
        return await this.callAI(prompt);
    }
    /**
     * 解析AI响应为结构化JSON对象
     * @param response AI原始响应
     * @returns 解析后的JSON对象
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
            return parsed;
        }
        catch (error) {
            // 如果直接解析失败，尝试多种提取策略
            const extractedJson = this.extractJsonFromResponse(response);
            if (extractedJson) {
                try {
                    const parsed = JSON.parse(extractedJson);
                    return parsed;
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
     * 解析物理题目并返回PhysicsContract格式的JSON对象
     * @param question 物理题目
     * @returns PhysicsContract格式的JSON对象，可直接用于仿真/渲染
     */
    async parseQuestionAsJSON(question) {
        const aiResult = await this.parseQuestion(question);
        if (!aiResult.success) {
            throw new Error(`AI调用失败: ${aiResult.error}`);
        }
        const parsedJSON = this.parseAIResponse(aiResult.data || '');
        if (!parsedJSON) {
            throw new Error('AI响应解析失败：无法提取有效的JSON');
        }
        return parsedJSON;
    }
}
exports.PhysicsAICaller = PhysicsAICaller;
