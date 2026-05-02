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
│  │  BrushSize   │  │BrushStyle    │  │ PointAnnotation  │ │
│  │ Slider.vue   │  │  Panel.vue   │  │ (主画布组件)     │ │
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
│ PointAnnotation │ │CanvasBrush.ts   │ │   types/index   │
│ Element.ts      │ │PointCommands.ts │ │   .ts           │
│                 │ │BrushCommands.ts │ │                 │
│                 │ │COCOExporter.ts  │ │                 │
│                 │ │YOLOExporter.ts  │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. 模块划分

### 2.1 UI 层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| BrushSizeSlider | src/components/BrushSizeSlider.vue | 笔刷大小调节浮动组件 |
| BrushStylePanel | src/components/BrushStylePanel.vue | 笔刷样式配置面板（颜色、透明度、大小等） |
| Canvas | 集成在 PointAnnotation.vue 中 | LeaferJS 画布渲染、事件监听 |
| App.vue (测试入口) | src/App.vue | 提供完整的测试界面和示例 |

### 2.2 业务逻辑层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| 工具切换 | PointAnnotation.vue | 管理 currentTool 状态、Editor 动态配置 |
| 事件处理 | PointAnnotation.vue | 处理鼠标/键盘事件、触发相应操作 |
| 命令管理 | PointAnnotation.vue | 集成 CommandManager、管理撤销/重做 |
| 数据管理 | PointAnnotation.vue | 管理点标注和笔刷数据的增删改查 |
| 导出导入 | PointAnnotation.vue | 处理数据导出和导入逻辑 |
| 标签编辑 | PointAnnotation.vue | 管理标签编辑状态，根据工具控制可编辑性 |

### 2.3 元素封装层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| PointAnnotationElement | src/elements/PointAnnotationElement.ts | 封装点标注元素（Group + Ellipse + Text），支持 hover/selected 状态 |

### 2.4 工具类层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| CanvasBrush | src/utils/CanvasBrush.ts | 使用 LeaferJS Canvas 实现笔刷绘制，支持 draw/erase/clear/hasContent |
| PointCommands | src/utils/PointCommands.ts | 点标注的 Add/Remove 命令实现 |
| BrushCommands | src/utils/BrushCommands.ts | 笔刷的快照命令实现（BrushSnapshotCommand） |
| COCOExporter | src/utils/COCOExporter.ts | COCO 格式数据导出 |
| YOLOExporter | src/utils/YOLOExporter.ts | YOLO 格式数据导出 |

### 2.5 类型定义层

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| Types | src/types/index.ts | 定义所有 TypeScript 类型接口（PointAnnotation、BrushStyle、ExportOptions 等） |

---

## 3. 核心组件设计

### 3.1 PointAnnotation.vue（主组件）

**核心职责**：
- 初始化 LeaferJS 应用和图片加载
- 管理工具状态和切换逻辑
- 处理用户交互事件
- 管理撤销/重做队列
- 提供对外 API
- 处理数据导出/导入

**状态管理**：
```typescript
// 工具状态
const currentTool = ref<ToolType>('select');

// 数据状态
const pointAnnotations = ref<PointAnnotation[]>([]);
const pointCounter = ref(1);

// 画布状态
const loadStatus = ref('idle');
const imageWidth = ref<number | null>(null);
const imageHeight = ref<number | null>(null);

// UI 状态
const showBrushPanel = ref(false);
const brushButtonRect = ref({ x: 0, y: 0, width: 0, height: 0 });

// 笔刷样式
const localBrushStyle = ref<BrushStyle>({ ...DEFAULT_BRUSH_STYLE });
```

**事件处理**：
| 事件 | 处理方法 | 触发操作 |
|------|----------|----------|
| pointerdown | handlePointerDown | 创建点标注/开始笔刷绘制 |
| pointermove | handlePointerMove | 笔刷绘制/鼠标追踪 |
| pointerup | handlePointerUp | 完成笔刷绘制 |
| keydown | handleKeyDown | 热键处理（tinykeys） |

**对外 API**：
```typescript
defineExpose({
  getPointAnnotations,
  getImageInfo,
  exportCanvasJSON,
  exportMaskImage,
  exportCOCO,
  exportYOLO,
  importCanvasJSON,
  loadImage,
  clearBrush,
  zoomIn,
  zoomOut,
  resetZoom,
  undo,
  redo,
  getCurrentTool,
  setTool,
  createPointAnnotation,
  removePointAnnotation,
});
```

### 3.2 PointAnnotationElement（点标注元素）

**结构设计**：
```
Group (容器) - id: 点数据的 id, _element_tag: 'point-annotation'
├── Ellipse (圆点) - 负责视觉样式、hover/selected 效果
└── Text (标签) - 负责显示标签文本、支持编辑，带 boxStyle 背景
```

**核心方法**：
| 方法 | 功能 |
|------|------|
| constructor | 初始化元素、绑定事件、配置 hoverStyle |
| handlePointAnnotationSelected | 更新选中状态样式（fill/stroke/scale） |
| handleLabelChange | 处理标签编辑变更（非空校验） |
| updatePosition | 更新位置坐标 |
| updateLabel | 更新标签文本 |
| getLabel / getLastValidLabel | 获取标签值 |

### 3.3 CanvasBrush（笔刷绘制）

**核心职责**：
- 使用 LeaferJS Canvas 实现笔刷绘制
- 外层 Group 控制整体透明度（避免多次叠加）
- 支持绘制和擦除模式
- 连续性阈值处理（两个点之间距离过远时自动连线）
- 图片数据导出/恢复
- hasContent() 检测是否有内容

**核心方法**：
| 方法 | 功能 |
|------|------|
| constructor | 初始化 Canvas 和外层 Group |
| draw | 绘制笔刷（使用多个圆填充路径） |
| erase | 擦除操作（destination-out） |
| clear | 清除所有内容 |
| getImageData | 导出为 PNG dataURL |
| restoreImageData | 从 dataURL 恢复画布 |
| hasContent | 检测是否有非透明像素 |
| setPointerEvents | 控制 Canvas 是否拦截事件 |

### 3.4 笔刷命令设计

**BrushSnapshotCommand**：
- 笔刷操作使用快照方式实现撤销/重做
- 保存操作前后的完整图片状态
- undo/redo 时恢复对应状态

### 3.5 导出导入实现

**导出格式**：
1. **JSON Full**：完整数据（点标注 + 笔刷 mask）
2. **JSON Points**：仅点标注数据
3. **COCO**：COCO 数据集格式
4. **YOLO**：YOLO 数据集格式
5. **Mask**：二值图（PNG/JPEG 可选）

**二值图特性**：
- 前景色可配置（黑/白）
- PNG 支持透明背景
- JPG 自动处理背景色（前景黑则背景白，反之亦然）
- 使用 getImageData() 扫描像素，重新绘制为纯二值图

---

## 4. 数据流转

### 4.1 点标注数据流转

```
用户点击 → handlePointerDown → createPointAnnotation → 
  PointAnnotationElement → AddPointCommand → CommandManager → 
  pointAnnotations (响应式数组) → 导出数据
```

### 4.2 笔刷数据流转

```
用户绘制 → handlePointerMove → CanvasBrush.draw → 
  (操作结束) → BrushSnapshotCommand → CommandManager → 
  (内部保存 mask 图片)
```

### 4.3 导出/导入数据流转

```
导出：用户触发 → exportData(format) → Exporter 格式化 → 返回数据字符串/Blob
导入：用户触发 → importCanvasJSON(json) → 解析数据 → 重建元素 → fitImageToCanvas
```

---

## 5. 命令模式实现

### 5.1 命令类型

| 命令类 | 功能 | 撤销逻辑 |
|--------|------|----------|
| AddPointCommand | 添加点标注 | 移除点标注、从数组删除 |
| RemovePointCommand | 删除点标注 | 重新添加点标注、插入原位置 |
| BrushSnapshotCommand | 笔刷快照 | 恢复操作前的图片状态 |

### 5.2 命令管理器集成

```typescript
// 初始化命令管理器（历史限制 100）
const commandManager = new CommandManager(100);

// 执行命令
commandManager.executeCommand(new AddPointCommand(pointLayer, element, pointAnnotations.value, data));

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

### 6.2 标签编辑控制

| 工具 | 标签可编辑 | 说明 |
|------|-----------|------|
| select | true | 可以编辑标签 |
| point | true | 可以编辑标签 |
| brush | false | 禁用编辑，避免冲突 |
| eraser | false | 禁用编辑，避免冲突 |

### 6.3 实现逻辑

```typescript
const switchToSelect = () => {
  currentTool.value = 'select';
  showBrushPanel.value = false;
  if (!app) return;
  app.editor.config.moveable = false;
  app.editor.config.resizeable = false;
  app.editor.config.multipleSelect = true;
  canvasBrush?.setPointerEvents(false);
  updateLabelEditable(true);
};
```

---

## 7. 对外 API 设计

### 7.1 方法列表

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| getPointAnnotations | 无 | PointAnnotation[] | 获取所有点标注数据 |
| createPointAnnotation | (x, y) | string \| null | 创建标注点，返回 id |
| removePointAnnotation | (id) | boolean | 删除指定 id 的点标注 |
| clearBrush | 无 | void | 清除所有笔刷内容 |
| exportCanvasJSON | 无 | string | 导出完整 JSON 数据 |
| exportMaskImage | (format, fgColor) | string \| null | 导出二值图 dataURL |
| exportCOCO | 无 | COCOExport | 导出 COCO 格式数据 |
| exportYOLO | 无 | YOLOExport | 导出 YOLO 格式数据 |
| importCanvasJSON | (json) | void | 导入 JSON 数据 |
| loadImage | (url) | Promise | 加载图片 |
| undo | 无 | void | 撤销操作 |
| redo | 无 | void | 重做操作 |
| setTool | (tool) | void | 设置当前工具 |
| getCurrentTool | 无 | ToolType | 获取当前工具 |
| zoomIn | 无 | void | 放大画布 |
| zoomOut | 无 | void | 缩小画布 |
| resetZoom | 无 | void | 重置缩放 |

### 7.2 Props 配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| imageSource | { id, url } | - | 图片源配置 |
| pointStyle | Partial\<PointStyle\> | DEFAULT_POINT_STYLE | 点标注样式 |
| brushStyle | Partial\<BrushStyle\> | DEFAULT_BRUSH_STYLE | 笔刷样式 |
| options | { maskExportFormat, maskExportForeground } | - | 导出配置 |

### 7.3 Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| pointChange | PointAnnotation[] | 点标注数据变化 |
| loadStart | - | 图片开始加载 |
| loadSuccess | - | 图片加载成功 |
| loadError | - | 图片加载失败 |

---

## 8. 性能优化策略

### 8.1 Canvas 渲染优化

| 策略 | 说明 |
|------|------|
| **Group 透明度控制** | 透明度设置在 Group 上，避免 Canvas 上多次叠加 |
| **批量更新** | 使用 `set()` 批量更新属性，减少重绘次数 |
| **图层分离** | 图片层、点标注层、笔刷层分离，独立控制 |
| **路径填充** | 笔刷使用多个圆填充，避免复杂路径计算 |

### 8.2 事件处理优化

| 策略 | 说明 |
|------|------|
| **事件委托** | LeaferJS 自动处理事件冒泡 |
| **条件监听** | 笔刷 Canvas 只在需要时拦截事件（pointerEvents） |
| **updateLabelEditable** | 只在工具切换时更新标签可编辑性 |

### 8.3 内存管理

| 策略 | 说明 |
|------|------|
| **及时清理** | 移除元素时调用 destroy() |
| **历史限制** | 设置合理的撤销历史记录限制（默认 100） |
| **Canvas 重用** | CanvasBrush 复用同一 Canvas 对象 |

### 8.4 导出优化

| 策略 | 说明 |
|------|------|
| **异步处理** | 图片导出使用 async/await，避免阻塞 |
| **DataURL 缓存** | 笔刷快照保存 dataURL，避免重复序列化 |

---

**文档版本**：2.0  
**创建日期**：2026-04-28  
**最后更新**：2026-05-02
