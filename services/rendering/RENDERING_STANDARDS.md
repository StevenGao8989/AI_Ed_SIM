# 物理渲染标准 - 几何一致性保证

## 🎯 核心原则

**单一坐标转换源**: 所有渲染器必须使用 `UnifiedCoordinateSystem` 进行坐标转换
**几何一致性保证**: 斜面绘制与小球轨迹必须使用相同的几何计算
**物理准确性**: 渲染结果必须与物理仿真结果完全匹配

## 🔧 强制使用规范

### 1. **坐标转换 - 必须使用统一函数**

```typescript
// ✅ 正确做法：使用统一坐标系统
import { UnifiedCoordinateSystem } from './CoordinateSystem';

const coordSystem = new UnifiedCoordinateSystem();
const screenPos = coordSystem.worldToScreen(physicsPoint);

// ❌ 错误做法：自定义坐标转换
const screenX = offsetX + physicsX * scale;  // 不允许
const screenY = offsetY - physicsY * scale;  // 不允许
```

### 2. **斜面渲染 - 必须使用标准方法**

```typescript
// ✅ 正确做法：使用标准斜面计算
const incline: InclineDefinition = {
  angle: inclineAngle,
  length: coordSystem.calculateOptimalInclineLength(maxDistance, screenWidth),
  startPoint: { x: 0, y: 0 }
};
const screenPoints = coordSystem.calculateInclineScreenPoints(incline);

// ❌ 错误做法：硬编码斜面长度
const inclineLength = 400;  // 不允许硬编码
```

### 3. **小球贴合 - 必须考虑半径偏移**

```typescript
// ✅ 正确做法：使用精确贴合计算
const ballPosition = coordSystem.calculateInclinePoint(
  distanceAlongIncline,
  incline,
  objectRadius  // 必须提供半径
);

// ❌ 错误做法：忽略半径偏移
const ballX = distance * Math.cos(angle);  // 不考虑半径
const ballY = distance * Math.sin(angle);  // 小球会穿透斜面
```

## 📋 开发检查清单

### 渲染器开发必须遵循：

- [ ] 继承 `BaseRenderingStrategy` 基类
- [ ] 使用 `worldToScreen()` 进行所有坐标转换
- [ ] 使用 `calculateInclinePosition()` 计算斜面位置
- [ ] 调用 `validateGeometry()` 验证几何一致性
- [ ] 使用 `PhysicsRenderFactory` 生成最优配置
- [ ] 实现 `@ensureGeometryConsistency` 装饰器（可选）

### 测试文件开发必须遵循：

- [ ] 使用 `RenderingManager.createStandardRenderer()` 创建渲染器
- [ ] 检查 `validation.overallScore` 确保质量
- [ ] 处理 `validation.issues` 中的警告
- [ ] 应用 `validation.recommendations` 中的建议

## 🚫 禁止的做法

### 1. **硬编码数值**
```typescript
// ❌ 禁止
const scale = 80;           // 硬编码缩放
const offsetX = 640;        // 硬编码偏移
const inclineLength = 400;  // 硬编码长度
```

### 2. **重复坐标转换逻辑**
```typescript
// ❌ 禁止：每个渲染器都自己实现坐标转换
function myWorldToScreen(x, y) {
  return { x: offsetX + x * scale, y: offsetY - y * scale };
}
```

### 3. **忽略物体半径**
```typescript
// ❌ 禁止：不考虑物体半径的贴合
const ballX = distance * Math.cos(angle);  // 小球会穿透斜面
```

## ✅ 标准使用示例

### 创建标准渲染器
```typescript
import { globalRenderingManager } from './RenderingManager';

const { renderer, config, environment, validation } = 
  globalRenderingManager.createStandardRenderer(
    '2d_canvas',
    physicsParams,
    calculationResults,
    { width: 1280, height: 720 }
  );

// 检查验证结果
if (!validation.geometryValid) {
  console.warn('几何一致性问题:', validation.issues);
}
```

### 渲染单帧
```typescript
await renderer.renderFrame(
  objectStates,
  environment,
  config,
  outputPath
);
```

### 验证几何一致性
```typescript
const validation = renderer.validateGeometry(maxDistance, screenConfig);
if (!validation.valid) {
  throw new Error(`几何一致性验证失败: ${validation.issues.join('; ')}`);
}
```

## 🔍 问题排查指南

### 小球不在斜面上？
1. 检查是否使用了 `calculateInclinePosition()`
2. 验证 `objectRadius` 参数是否正确
3. 确认 `inclineDistance` 数据正确

### 斜面长度不够？
1. 使用 `calculateOptimalInclineLength()` 自动计算
2. 检查 `maxDistance` 参数是否准确
3. 验证屏幕空间是否足够

### 坐标不一致？
1. 确保只使用 `worldToScreen()` 转换坐标
2. 检查 `CoordinateConfig` 是否正确设置
3. 验证所有组件使用相同的坐标系统实例

## 🎯 质量保证

使用此标准化系统后，可以保证：

- ✅ **几何一致性**: 斜面与小球轨迹完美匹配
- ✅ **物理准确性**: 渲染结果与仿真结果一致
- ✅ **视觉质量**: 专业的物理动画效果
- ✅ **可维护性**: 统一的代码标准和接口
- ✅ **可扩展性**: 轻松支持新的物理场景

---

**📅 更新日期**: 2025年1月  
**📝 文档版本**: v2.1.0  
**🎯 目标**: 一次性解决几何不一致问题
