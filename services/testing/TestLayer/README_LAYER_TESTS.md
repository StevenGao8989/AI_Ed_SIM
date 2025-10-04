# 架构分层测试文档

## 概述

本目录包含了完整的架构分层测试系统，用于验证每个架构层是否正常工作，确保整个流水线万无一失。

## 测试架构

### 8个测试层

1. **Layer 1: AI解析层** (`test_layer1_ai.js`)
   - 测试AI解析功能是否正常工作
   - 验证参数提取、单位转换、主题识别

2. **Layer 2: Contract适配层** (`test_layer2_contract.js`)
   - 测试AI解析结果到PhysicsContract的转换
   - 验证物体、表面、阶段、约束的定义

3. **Layer 3: 验证层** (`test_layer3_validation.js`)
   - 测试Pre-Sim Gate和Post-Sim Gate验证功能
   - 验证Contract结构的完整性和有效性

4. **Layer 4: 仿真层** (`test_layer4_simulation.js`)
   - 测试物理仿真引擎是否正常工作
   - 验证不同物理场景的仿真结果

5. **Layer 5: 质量评估层** (`test_layer5_quality.js`)
   - 测试Post-Sim Gate质量评估功能
   - 验证VCS评分、有效性测试、守恒测试

6. **Layer 6: 渲染层** (`test_layer6_rendering.js`)
   - 测试帧渲染功能是否正常工作
   - 验证Canvas渲染、坐标转换、帧生成

7. **Layer 7: 导出层** (`test_layer7_export.js`)
   - 测试视频导出功能是否正常工作
   - 验证FFmpeg编码、文件生成、格式转换

8. **Layer 8: 端到端集成层** (`test_layer8_integration.js`)
   - 测试整个架构流水线的集成功能
   - 验证8个步骤的完整流程

## 使用方法

### 运行所有层测试

```bash
cd services/testing
node run_layer_tests.js --all
```

### 运行单个层测试

```bash
# 运行AI解析层测试
node run_layer_tests.js --layer layer1

# 运行Contract适配层测试
node run_layer_tests.js --layer layer2

# 运行验证层测试
node run_layer_tests.js --layer layer3

# 运行仿真层测试
node run_layer_tests.js --layer layer4

# 运行质量评估层测试
node run_layer_tests.js --layer layer5

# 运行渲染层测试
node run_layer_tests.js --layer layer6

# 运行导出层测试
node run_layer_tests.js --layer layer7

# 运行端到端集成测试
node run_layer_tests.js --layer layer8
```

### 直接运行单个测试文件

```bash
# 直接运行AI解析层测试
node test_layer1_ai.js

# 直接运行Contract适配层测试
node test_layer2_contract.js

# 直接运行验证层测试
node test_layer3_validation.js

# 直接运行仿真层测试
node test_layer4_simulation.js

# 直接运行质量评估层测试
node test_layer5_quality.js

# 直接运行渲染层测试
node test_layer6_rendering.js

# 直接运行导出层测试
node test_layer7_export.js

# 直接运行端到端集成测试
node test_layer8_integration.js
```

## 测试输出

每个测试层都会在对应的输出目录中生成：

- `layer1_output/` - AI解析层测试结果
- `layer2_output/` - Contract适配层测试结果
- `layer3_output/` - 验证层测试结果
- `layer4_output/` - 仿真层测试结果
- `layer5_output/` - 质量评估层测试结果
- `layer6_output/` - 渲染层测试结果
- `layer7_output/` - 导出层测试结果
- `layer8_output/` - 端到端集成测试结果

每个输出目录包含：
- 详细的测试结果JSON文件
- 测试报告JSON文件
- 生成的测试数据（如帧文件、视频文件等）

## 测试报告

### 单个层测试报告

每个层测试完成后会显示：
- 测试统计（总数、成功数、失败数、成功率）
- 失败的测试详情
- 详细报告文件路径

### 总体测试报告

运行所有层测试后会生成：
- 各层测试结果汇总
- 总体成功率统计
- 失败层的错误信息
- 总体测试报告文件 (`overall_test_report.json`)

## 测试用例

### Layer 1: AI解析层测试用例
- 简单斜面问题
- 复杂多阶段问题
- 弹簧问题
- 圆周运动问题
- 抛体运动问题

### Layer 2: Contract适配层测试用例
- 简单斜面问题 → Contract适配
- 多阶段碰撞问题 → Contract适配
- 弹簧压缩问题 → Contract适配

### Layer 3: 验证层测试用例
- 有效Contract验证
- 缺少物体定义验证
- 缺少表面定义验证
- 缺少阶段定义验证
- 缺少世界配置验证
- 缺少验收测试验证
- 无效的物体配置验证
- 无效的表面配置验证

### Layer 4: 仿真层测试用例
- 简单斜面滑行仿真
- 自由落体仿真
- 水平运动仿真
- 弹簧振动仿真
- 多物体系统仿真

### Layer 5: 质量评估层测试用例
- 高质量仿真评估
- 中等质量仿真评估
- 低质量仿真评估
- 能量漂移仿真评估
- 边界违反仿真评估
- 空仿真结果评估

### Layer 6: 渲染层测试用例
- 简单斜面渲染
- 多物体渲染
- 弹簧系统渲染
- 复杂表面渲染
- 空场景渲染

### Layer 7: 导出层测试用例
- 标准帧序列导出
- 高帧率导出
- 低质量导出
- 空目录导出
- 损坏帧导出

### Layer 8: 端到端集成测试用例
- 简单斜面问题完整流程
- 复杂多阶段问题完整流程
- 弹簧振动问题完整流程
- 无效问题处理流程

## 故障排除

### 常见问题

1. **AI解析失败**
   - 检查环境变量 `NEXT_PUBLIC_DEEPSEEK_API_KEY` 是否设置
   - 检查网络连接是否正常

2. **仿真失败**
   - 检查Contract结构是否完整
   - 检查物理参数是否合理

3. **渲染失败**
   - 检查Canvas库是否正确安装
   - 检查坐标转换是否正确

4. **导出失败**
   - 检查FFmpeg是否正确安装
   - 检查帧文件是否存在

### 调试建议

1. **单独运行失败的层**
   ```bash
   node run_layer_tests.js --layer layerX
   ```

2. **查看详细错误信息**
   - 检查对应层的输出目录中的错误报告

3. **检查依赖**
   - 确保所有必要的包都已安装
   - 确保环境变量正确设置

## 扩展测试

### 添加新的测试用例

1. 在对应的测试文件中添加新的测试用例
2. 确保测试用例覆盖不同的场景
3. 更新测试报告生成逻辑

### 添加新的测试层

1. 创建新的测试文件 `test_layerX_new.js`
2. 实现测试类，包含 `runTests()` 方法
3. 在 `run_layer_tests.js` 中注册新的测试器
4. 更新文档

## 性能考虑

- 每个层测试都设计为快速执行
- 渲染和导出测试使用小规模的测试数据
- 集成测试限制帧数以减少执行时间
- 所有测试都包含超时保护

## 维护

- 定期运行所有层测试确保架构完整性
- 在修改架构组件后运行对应的层测试
- 在发布前运行完整的端到端集成测试
- 保持测试用例与架构变更同步
