# 点标注与笔刷涂抹工具 - 功能架构文档

## 1. 架构概述

### 1.1 架构设计原则

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个组件/模块只负责一个功能 |
| **分层架构** | 清晰的层次划分：UI层、业务层、数据层 |
| **可扩展性** | 预留扩展接口，支持后续功能迭代 |
| **响应式设计** | 使用 Vue3 Composition API |
| **性能优先** | 优化 Canvas 渲染和事件处理 |

### 1.2 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        UI 层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Toolbar.vue  │  │ BrushSize    │  │ PointAnnotation  │ │
│  │ (工具栏)     │  │ Slider.vue   │  │ (主画布组件)     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │          │
└─────────┼─────────────────┼────────────────────┼──────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PointAnnotation.vue (主组件)              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │  │
│  │  │ 工具切换逻辑 │  │ 事件处理逻辑 │  │ 命令管理  │  │  │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   元素封装层    │ │   工具类层      │ │   类型定义层    │
│ PointAnnotation │ │  BrushStroke    │ │   types/index   │
│ Element.ts      │ │  .ts            │ │   .ts           │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. 模块划分

### 2.1 UI 层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| Toolbar | 集成在 PointAnnotation.vue 中 | 工具栏按钮、工具切换、热键提示 |
| BrushSizeSlider | src/components/BrushSizeSlider.vue | 笔刷大小调节浮动组件 |
| Canvas | 集成在 PointAnnotation.vue 中 | LeaferJS 画布渲染、事件监听 |

### 2.2 业务逻辑层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| 工具切换 | PointAnnotation.vue | 管理 currentTool 状态、Editor 动态配置 |
| 事件处理 | PointAnnotation.vue | 处理鼠标/键盘事件、触发相应操作 |
| 命令管理 | PointAnnotation.vue | 集成 CommandManager、管理撤销/重做 |
| 数据管理 | PointAnnotation.vue | 管理点标注和笔刷数据的增删改查 |
| 导出导入 | PointAnnotation.vue | 处理数据导出和导入逻辑 |

### 2.3 元素封装层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| PointAnnotationElement | src/elements/PointAnnotationElement.ts | 封装点标注元素（Group + Ellipse + Text） |

### 2.4 工具类层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| BrushStroke | src/utils/BrushStroke.ts | 封装笔刷绘制逻辑 |
| UUID | 内置或第三方库 | 生成唯一 ID |

### 2.5 类型定义层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| Types | src/types/index.ts | 定义所有 TypeScript 类型接口 |

---

## 3. 核心组件设计

### 3.1 PointAnnotation.vue（主组件）

**核心职责**：
- 初始化 LeaferJS 应用
- 管理工具状态和切换逻辑
- 处理用户交互事件
- 管理撤销/重做队列
- 提供对外 API

**状态管理**：
```typescript
// 工具状态
const currentTool = ref<ToolType>('select');

// 数据状态
const pointAnnotations = ref<PointAnnotation[]>([]);
const brushStrokes = ref<BrushStrokeData[]>([]);

// 画布状态
const zoomLevel = ref(100);
const isCanvasFocused = ref(false);

// UI 状态
const showBrushSizeSlider = ref(false);
```

**事件处理**：
| 事件 | 处理方法 | 触发操作 |
|------|----------|----------|
| pointerdown | handlePointerDown | 创建点标注/开始笔刷绘制 |
| pointermove | handlePointerMove | 笔刷绘制/鼠标追踪 |
| pointerup | handlePointerUp | 完成笔刷绘制 |
| keydown | handleKeyDown | 热键处理 |

### 3.2 PointAnnotationElement（点标注元素）

**结构设计**：
```
Group (容器)
├── Ellipse (圆点) - 负责视觉样式、hover/selected 效果
└── Text (标签) - 负责显示标签文本、支持编辑
```

**核心方法**：
| 方法 | 功能 |
|------|------|
| constructor | 初始化元素、绑定事件 |
| updateHover | 更新 hover 状态样式 |
| updateSelected | 更新 selected 状态样式 |
| updatePosition | 更新位置坐标 |
| updateLabel | 更新标签文本 |

### 3.3 BrushStroke（笔刷绘制）

**核心职责**：
- 管理笔刷路径数据
- 实时更新 Canvas 渲染
- 支持绘制和擦除模式

**核心方法**：
| 方法 | 功能 |
|------|------|
| constructor | 初始化路径、设置样式 |
| addPoint | 添加路径点、更新路径 |
| finish | 完成绘制、返回路径数据 |
| remove | 移除路径 |

### 3.4 BrushSizeSlider（笔刷大小调节）

**交互设计**：
- 浮动显示在笔刷按钮上方
- 包含范围滑块和实时预览
- 点击空白处或按 ESC 键关闭

---

## 4. 数据流转

### 4.1 点标注数据流转

```
用户点击 → handlePointerDown → createPointAnnotation → 
  PointAnnotationElement → addPointCommand → CommandManager → 
  pointAnnotations (响应式数组) → 导出数据
```

### 4.2 笔刷数据流转

```
用户绘制 → handlePointerMove → BrushStroke.addPoint → 
  BrushStrokeCommand → CommandManager → 
  brushStrokes (响应式数组) → 导出二值图
```

### 4.3 导出/导入数据流转

```
导出：用户触发 → exportData(format) → 格式化数据 → 返回数据字符串/Blob
导入：用户触发 → importData(data) → 解析数据 → 重建元素 → 更新状态
```

---

## 5. 命令模式实现

### 5.1 命令类型

| 命令类 | 功能 | 撤销逻辑 |
|--------|------|----------|
| AddPointCommand | 添加点标注 | 移除点标注 |
| RemovePointCommand | 删除点标注 | 重新添加点标注 |
| MovePointCommand | 移动点标注 | 恢复原位置 |
| BrushStrokeCommand | 笔刷绘制 | 移除绘制路径 |
| EraseCommand | 擦除操作 | 恢复擦除前状态 |
| ClearBrushCommand | 清除所有涂抹 | 恢复所有路径 |

### 5.2 命令管理器集成

```typescript
// 初始化命令管理器
const commandManager = new CommandManager(100);

// 执行命令
commandManager.executeCommand(new AddPointCommand(app, pointElement));

// 撤销/重做
commandManager.undo();
commandManager.redo();
```

---

## 6. Editor 动态控制

### 6.1 控制策略

| 工具 | Editor 状态 | 说明 |
|------|-------------|------|
| select | 启用 | 允许选择和拖拽 |
| point | 启用 | 允许选择和拖拽点标注 |
| brush | 禁用 | 避免干扰笔刷绘制 |
| eraser | 禁用 | 避免干扰擦除操作 |

### 6.2 实现逻辑

```typescript
const setTool = (tool: ToolType) => {
  currentTool.value = tool;
  
  if (tool === 'point' || tool === 'select') {
    app.editor = true;
    app.editor.select = true;
    app.editor.drag = true;
  } else {
    app.editor = false;
  }
};
```

---

## 7. 对外 API 设计

### 7.1 方法列表

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| getPointAnnotations | 无 | PointAnnotation[] | 获取所有点标注数据 |
| addPointAnnotation | (data: PointAnnotation) | void | 添加点标注 |
| updatePointAnnotation | (id: string, data: Partial\<PointAnnotation\>) | boolean | 更新点标注 |
| deletePointAnnotation | (id: string) | boolean | 删除点标注 |
| clearPointAnnotations | 无 | void | 清除所有点标注 |
| getBrushData | 无 | BrushStrokeData[] | 获取笔刷数据 |
| clearBrush | 无 | void | 清除笔刷涂抹 |
| exportBrushMask | 无 | Blob | 导出二值图 |
| undo | 无 | void | 撤销操作 |
| redo | 无 | void | 重做操作 |
| canUndo | 无 | boolean | 是否可撤销 |
| canRedo | 无 | boolean | 是否可重做 |
| setTool | (tool: ToolType) | void | 设置当前工具 |
| getCurrentTool | 无 | ToolType | 获取当前工具 |
| zoomIn | 无 | void | 放大画布 |
| zoomOut | 无 | void | 缩小画布 |
| resetZoom | 无 | void | 重置缩放 |
| getZoomLevel | 无 | number | 获取缩放级别 |
| exportCanvasJSON | (format: ExportFormat) | string | 导出画布数据 |
| importCanvasJSON | (data: string, options?) | boolean | 导入画布数据 |
| getStatistics | 无 | Statistics | 获取统计信息 |

### 7.2 统计信息结构

```typescript
interface Statistics {
  pointCount: number;            // 点标注数量
  brushStrokeCount: number;      // 笔刷笔画数量
  brushAreaPercent: number;      // 涂抹面积百分比
  hasChanges: boolean;           // 是否有未保存修改
}
```

---

## 8. 性能优化策略

### 8.1 Canvas 渲染优化

| 策略 | 说明 |
|------|------|
| 批量更新 | 使用 `set()` 批量更新属性，减少重绘次数 |
| 图层分离 | 点标注和笔刷使用不同图层，避免相互影响 |
| 路径缓存 | 缓存笔刷路径数据，避免重复计算 |

### 8.2 事件处理优化

| 策略 | 说明 |
|------|------|
| 事件委托 | 使用事件委托减少监听器数量 |
| 节流处理 | 对频繁触发的事件进行节流 |
| 条件监听 | 只在需要时监听特定事件 |

### 8.3 内存管理

| 策略 | 说明 |
|------|------|
| 及时清理 | 移除不再使用的元素和事件监听器 |
| 历史限制 | 设置合理的撤销历史记录限制（默认 100） |

---

**文档版本**：1.0  
**创建日期**：2026-04-28  
**最后更新**：2026-04-28