#!/usr/bin/env node
/**
 * 直接调用AI输出原始结果测试
 * 完全输出AI的结果，不做任何解析
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

class RawAIOutputTester {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = 'deepseek-v3';
    this.temperature = 0.1;
    this.maxTokens = 20000;
    this.timeout = 60000;
  }

  /**
   * 直接调用AI API
   */
  async callAI(prompt) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.temperature,
          max_tokens: this.maxTokens,
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 测试AI原始输出
   */
  async testRawOutput(question) {
    console.log('🔍 AI原始输出测试');
    console.log('='.repeat(50));
    console.log(`📝 题目: ${question}`);
    console.log('='.repeat(50));

    const prompt = `你是物理题目解析专家。请将以下物理题目解析为JSON格式，不要包含任何markdown标记或额外文字。

题目：${question}

🔍 重要解析要求：
1. 仔细识别题目中所有要求求解的未知量，包括：
   - 明确提到的未知量（如"求...的速度"、"求...的位移"）
   - 隐含的中间计算量（如碰撞后的速度、弹簧压缩量等）
   - 每个未知量都要有唯一的符号标识

2. 避免参数符号冲突：
   - 不同物体使用不同符号（如m1, m2而不是都用m）
   - 不同阶段的速度使用不同符号（如v0, v1, v2）
   - 确保每个参数符号在题目中有明确含义

3. 识别物理过程，包括但不限于：
   - 能量守恒过程（如重力势能转动能）
   - 动量守恒过程（如碰撞）
   - 摩擦力做功过程
   - 弹性势能过程

4. 参数符号匹配：
   - 确保所有参数符号在题目中有明确含义
   - 避免符号冲突，使用唯一标识符
   - 参数符号要与题目中的定义一致

5. 数值计算要求：
   - 对于每个unknown参数，必须计算出具体数值
   - 数值要精确到小数点后4-6位
   - 单位要与参数定义一致
   - 在target.values中提供所有计算出的数值
   - 在target.units中提供对应的单位
   - 重要：请仔细检查每一步的计算过程，确保数值准确性
   - 使用高精度计算，避免四舍五入导致的误差累积
   - 必须详细展示计算过程，包括：
     * 使用的公式
     * 代入的具体数值
     * 每一步的计算过程
     * 最终结果（如：0.25）
   - 在solutionPath的steps中必须包含substitution、calculation、result字段
   - 严格按照物理公式进行精确计算，不要使用近似值或估算

请根据题目内容自主选择相应的物理模块和公式，包括但不限于：
- 运动学模块（kinematics）
- 动力学模块（dynamics）
- 能量模块（energy）
- 电路模块（circuit）
- 光学模块（optics）
- 热学模块（thermal）
- 电磁学模块（electromagnetism）
- 振动波动模块（oscillation_waves）
- 现代物理模块（modern_physics）

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
      "note": "参数说明",
      "dslType": "scalar|vector|tensor",
      "domain": "物理域",
      "dependencies": ["依赖的参数符号"],
      "formula": "计算该参数的公式"
    }
  ],
  "constraints": [
    {
      "type": "initial|boundary|physical|mathematical",
      "description": "约束条件描述",
      "parameters": ["涉及的参数"],
      "expression": "约束表达式"
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
    "unknowns": ["需要求解的未知参数列表"],
    "values": {
      "参数符号": 计算出的精确数值
    },
    "units": {
      "参数符号": "单位"
    }
  },
  "solutionPath": {
    "steps": [
      {
        "id": "step1",
        "type": "calculate",
        "module": "你选择的模块名",
        "action": "操作描述",
        "inputs": ["输入参数"],
        "outputs": ["输出参数"],
        "formula": "你推导的公式",
        "substitution": "代入具体数值的公式",
        "calculation": "详细计算过程",
        "result": "计算结果",
        "unit": "单位",
        "order": 1,
        "description": "步骤说明"
      }
    ],
    "modules": ["你选择的模块列表"],
    "dependencies": [
      {
        "from": "模块A",
        "to": "模块B", 
        "parameter": "共享参数",
        "type": "input|output|shared|derived",
        "reason": "依赖原因说明"
      }
    ],
    "executionOrder": ["模块执行顺序"],
    "checkpoints": []
  },
  "formulas": {
    "primary": [
      {
        "name": "你生成的公式名",
        "expression": "你推导的公式表达式",
        "description": "公式说明",
        "type": "primary",
        "module": "你选择的模块",
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
    "moduleCount": 1,
    "parameterCount": 1,
    "estimatedSteps": 1,
    "confidence": 0.8
  }
}

只输出JSON，不要其他内容。`;

    try {
      console.log('⏳ 正在调用AI...');
      const startTime = Date.now();
      
      const result = await this.callAI(prompt);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (result.success) {
        console.log('✅ AI调用成功');
        console.log(`⏱️  调用时间: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
        console.log(`📊 Token使用: ${result.usage?.totalTokens || '未知'}`);
        console.log('\n📝 AI原始响应:');
        console.log('='.repeat(50));
        console.log(result.data);
        console.log('='.repeat(50));
        
        // 保存到文件
        await this.saveToFile(question, result.data, duration, result.usage);
        
      } else {
        console.error('❌ AI调用失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
    }
  }

  /**
   * 保存结果到文件
   */
  async saveToFile(question, aiResponse, duration, usage) {
    const fs = require('fs');
    const outputDir = path.join(__dirname, 'raw_ai_output');
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `raw_ai_output_${timestamp}.txt`;
    const filepath = path.join(outputDir, filename);
    
    const content = `AI原始输出测试
测试时间: ${new Date().toISOString()}
调用耗时: ${duration}ms (${(duration/1000).toFixed(2)}s)
Token使用: ${usage?.totalTokens || '未知'}

题目: ${question}

AI原始响应:
${aiResponse}
`;
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`\n💾 结果已保存到: ${filepath}`);
  }

  /**
   * 运行测试
   */
  async runTest() {
    // 默认测试题目
    const defaultQuestion = '质量为1kg的小物块以5m/s的初速度滑上一块原来静止在水平面上的木板，木板的质量为4kg。经过时间2s以后，物块从木板的另一端以1m/s相对地的速度滑出，在这一过程中木板的位移为0.5m，求木板与水平面间的动摩擦因数。';
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    const question = args.length > 0 ? args.join(' ') : defaultQuestion;
    
    await this.testRawOutput(question);
  }
}

// 主函数
async function main() {
  const tester = new RawAIOutputTester();
  await tester.runTest();
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RawAIOutputTester };
