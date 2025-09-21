# PhysicsAIParserAICaller 测试工具

这个目录包含了用于测试 `PhysicsAIParserAICaller` 功能的测试工具。

## 文件说明

- `test_physics_ai_parser_caller.js` - 主要测试文件
- `README.md` - 使用说明文档

## 功能特性

### 测试功能
- ✅ 基础AI解析测试
- ✅ 原子模块解析测试  
- ✅ 多题目批量测试
- ✅ 单题目调试测试
- ✅ 性能测试和统计
- ✅ 结果验证和错误报告

### 测试题目类型
- 运动学题目（直线运动）
- 动力学题目（牛顿定律）
- 功和能题目
- 圆周运动题目
- 电学题目
- 复合题目（多模块组合）

## 使用方法

### 1. 环境准备

#### 方法一：使用 .env.local 文件（推荐）

在 `services/testing/TestAIParser/` 目录下创建 `.env.local` 文件：

```bash
# 进入测试目录
cd services/testing/TestAIParser

# 创建 .env.local 文件
cat > .env.local << EOF
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-actual-api-key-here

# 可选配置（使用默认值可省略）
DEEPSEEK_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEEPSEEK_MODEL=deepseek-v3
DEEPSEEK_TEMPERATURE=0.1
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TIMEOUT=30000
EOF
```

#### 方法二：设置系统环境变量

```bash
export DEEPSEEK_API_KEY=your_api_key_here
```

或者：

```bash
export DEEPSEEK_KEY=your_api_key_here
```

### 2. 运行完整测试

```bash
# 进入测试目录
cd services/testing/TestAIParser

# 运行所有测试
node test_physics_ai_parser_caller.js
```

### 3. 运行单题目测试

```bash
# 使用默认题目
node test_physics_ai_parser_caller.js single

# 使用自定义题目
node test_physics_ai_parser_caller.js single "质量为2kg的物体从10m高处自由落下，求落地时的动能和速度。"
```

### 4. 在代码中使用

```javascript
const { runTests, runSingleQuestionTest } = require('./test_physics_ai_parser_caller.js');

// 运行完整测试
const results = await runTests();

// 运行单题目测试
await runSingleQuestionTest("你的物理题目");
```

## 测试配置

测试配置在 `TEST_CONFIG` 对象中：

```javascript
const TEST_CONFIG = {
  provider: 'deepseek',
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'deepseek-v3',
  temperature: 0.1,
  maxTokens: 2000,
  timeout: 30000,
  retryCount: 2,
  retryDelay: 1000,
  enableLogging: true
};
```

## 测试题目

测试包含以下类型的物理题目：

### 简单题目
- 直线运动学
- 直流电路

### 中等题目  
- 动力学
- 功和能
- 圆周运动

### 复杂题目
- 多模块组合题目（运动学+动力学+功和能）

## 输出说明

### 测试过程输出
```
🚀 开始测试 PhysicsAIParserAICaller
============================================================

🧪 测试 kinematics_1 (easy): 一辆汽车以20m/s的速度匀速行驶，经过5秒后速度变为30m/s...
✅ 测试通过 - 基础解析: 1250ms, 模块解析: 2100ms
```

### 详细结果输出
```
📊 详细测试结果:
================================================================================

🔍 测试 kinematics_1:
   题目: 一辆汽车以20m/s的速度匀速行驶，经过5秒后速度变为30m/s，求汽车的加速度和行驶的距离。
   难度: easy
   状态: ✅ 通过
   基础解析参数数量: 5
   基础解析时间: 1250ms
   模块解析参数数量: 7
   模块解析时间: 2100ms
```

### 统计信息输出
```
📈 测试统计:
==================================================
总测试数: 6
通过数: 5
失败数: 1
成功率: 83.3%
```

## 验证标准

测试会验证以下内容：

1. **基础解析验证**
   - 返回结果格式正确
   - 主题为 'physics'
   - 包含参数数组和单位数组

2. **模块解析验证**
   - 包含预期的物理参数
   - 参数数量合理（≥3个）
   - 模块组合正确

3. **性能验证**
   - 解析时间合理
   - 无异常错误

## 错误处理

测试包含完善的错误处理：

- API Key 验证
- 网络请求重试
- 解析结果验证
- 异常捕获和报告

## 注意事项

1. **API 限制**: 测试间有1秒延迟避免API限制
2. **网络依赖**: 需要稳定的网络连接
3. **API Key**: 必须设置有效的 DeepSeek API Key
4. **超时设置**: 默认30秒超时，可根据需要调整

## 故障排除

### 常见问题

1. **API Key 未设置**
   ```
   ❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量
   ```
   解决：设置环境变量 `export DEEPSEEK_API_KEY=your_key`

2. **网络超时**
   ```
   ❌ 测试异常 - DeepSeek API 错误: 408 Request Timeout
   ```
   解决：检查网络连接，或增加超时时间

3. **解析失败**
   ```
   ❌ 测试失败 - 缺少预期的物理参数
   ```
   解决：检查题目格式，或调整验证标准

### 调试建议

1. 使用单题目测试模式调试特定题目
2. 启用详细日志查看解析过程
3. 检查API Key权限和配额
4. 验证网络连接和防火墙设置
