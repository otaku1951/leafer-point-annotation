# @zzalai/leafer-point-annotation - Project Context

> 新开 AI 会话时阅读此文件，可快速了解项目全貌与核心能力

---

## 1. 项目概览

- **项目名称**: `@zzalai/leafer-point-annotation`
- **类型**: Vue 3 + TypeScript 组件库（发布到 npm）
- **核心用途**: 图像点标注 + 多图层笔刷涂抹，专为 AI 模型训练数据集标注设计
- **底层渲染**: LeaferJS（Canvas 渲染引擎）
- **构建工具**: Vite + vite-plugin-dts（生成 .d.ts 类型声明）
- **样式导入**: 使用者必须手动 `import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'`
- **演示站点**: GitHub Pages，由 `docs/` 目录提供（通过 `vite.docs.config.ts` 构建）
- **版本管理**: npm（`package.json` 的 `version` 字段）

---

## 2. 核心功能（功能清单）

### 2.1 点标注功能
- 画布上点击添加标注点（point 工具下）
- 点拖拽移动（select 工具下）
- 删除点：Delete 键或 `deleteSelected()` 方法
- **序号自动重排**：删除点后剩余点按顺序重新编号（1, 2, 3...）
- 点支持 hover / selected 两态（颜色与缩放变化）
- `fixedSizeOnZoom`：点不随画布缩放变大
- 点样式完全可配（circleFill、circleStroke、hover*、selected*、label 样式等）
- `maxPoints` 可配置最大点数限制
- ✨ **`beforeCreatePoint` 创建前回调**：`props.beforeCreatePoint(x, y, nx, ny, existingPointCount)`，父组件可返回 `boolean | Promise<boolean>` 控制是否允许创建，支持同步判定和异步二次确认

### 2.2 多图层笔刷功能
- 每个图层一个 HTML canvas + 独立 CanvasBrush 实例
- 通过 `options.brushLayers` 配置图层数组（不传则默认单图层 `{label:'默认图层', value:'default'}`）
- 笔刷可调：颜色、透明度（Group.opacity）、大小、连续性阈值
- 橡皮擦工具：擦除当前图层内容；**橡皮擦尺寸独立配置**（`eraserSize`，未设置时与 `size` 相同）
- 套索工具：自由绘制闭合区域，填充/擦除，与笔刷共享颜色和 undo/redo
- 图片旋转与翻转：顺时针 90° 旋转、水平翻转、垂直翻转（简化方案，清空现有数据后变换像素重新加载）
- `clearBrush()` / `clearAllBrushLayers()` 清空笔刷
- 图层切换：`setActiveLayer(value)` 或 `v-model:current-layer`
- **撤销/重做**：基于 ImageData 快照（BrushSnapshotCommand）

### 2.3 `enableBrush` 功能开关（v1.1 新增）
- `options.enableBrush = false` 时完全禁用笔刷相关功能
- 影响范围：工具栏笔刷/橡皮/套索按钮、笔刷配置面板、`brushTool()`、`eraserTool()`、`lassoTool()`、`updateBrushStyle()`、`clearBrush()`、`clearAllBrushLayers()`、`createBrushFromPoints()`、`exportMaskImage*()`、`getMaskBlob()`、`getMaskFile()`、`getAllMaskBlobs()`、快捷键 `b` / `e` / `l`
- 启用/禁用切换时会重建或清理笔刷图层
- 删除确认文案根据是否启用笔刷动态变化

### 2.4 点轨迹生成笔刷区域（v1.1 新增）
- `createBrushFromPoints()` 方法
- 按 `sequenceNumber` 顺序将点的像素坐标连成闭合多边形
- 使用当前笔刷的 color + opacity 填充
- 点数量 < 3 时不执行
- 支持撤销/重做

### 2.5 导出功能
- **JSON**: `exportCanvasJSON()` / `importCanvasJSON()` - 全量导入导出
- **COCO**: `exportCOCO()` - 点作为 keypoints
- **YOLO**: `exportYOLO()` - YOLO 格式标注
- **Mask (dataURL)**: `exportMaskImage()` / `exportMaskImageByLayer()` / `exportAllMaskImages()`
- **Mask (Blob)**: `getMaskBlob()` - 直接用于后端上传 `FormData.append()`
- **Mask (File)**: `getMaskFile()` - 带 filename + mime
- **Mask (多图层 Blob)**: `getAllMaskBlobs()` - 返回 `Record<layerValue, Blob>`

### 2.6 工具栏与快捷键
- 内置工具栏包含：select、point、brush、eraser、lasso、delete、clear、undo、redo
- `showToolbar: false` / `showZoomController: false` 隐藏内置 UI，父组件自定义
- ✨ **`enableHotkeys`（默认 false）**：`options.enableHotkeys = true` 时才启用快捷键，默认全部禁用
- 快捷键生效条件：`enableHotkeys = true` 且画布 focus 或 hover 画布
- 快捷键列表：`v` (select)、`p` (point)、`b` (brush, 需 enableBrush)、`e` (eraser, 需 enableBrush)、`l` (lasso, 需 enableBrush)、`Ctrl+Z` (undo)、`Ctrl+Y` (redo)、`Delete` (删除选中)、`Ctrl++/-` (缩放)、`Ctrl+0` (重置)、`Alt` (快捷键提示)

### 2.7 图片加载
- **单一数据源**：图片加载完全依赖 `props.imageSource`
- 不传 imageSource 时显示大面积上传区域（点击选择 + 拖拽文件）
- ✨ **`v-model:imageSource` 双向绑定**：组件内部选择图片后通过 `emit('update:imageSource', ...)` 自动同步到父组件，无需手动监听事件
- ✨ **Blob URL 优化**：本地图片上传使用 `URL.createObjectURL(file)` 替代 `readAsDataURL`，加载成功后自动 `revokeObjectURL`，避免大图片内存膨胀
- ✨ **`resetCanvas()`**：重置画布到无图片初始化状态（清除所有标注、笔刷、撤销栈）
- ✨ **`loadSuccess` 事件 payload**：`{ url, width, height, isLocal, file? }`；本地选图时有原始 `File` 对象，可直接用于后端 multipart/form-data 上传

### 2.8 笔刷动态光标（v1.1 新增）
- `options.brushCursorEnabled`（默认 true）控制是否显示笔刷/橡皮擦的自定义跟随光标
- 切换到 brush/eraser 工具时，光标显示为笔刷形状
- 光标颜色、大小、透明度与当前笔刷样式实时同步
- brush 模式下 fill = 笔刷颜色，eraser 模式下 fill = transparent / stroke = 白色（双层描边，黑+白确保在任意背景可见）
- lasso 工具使用浏览器默认光标（不使用自定义笔刷光标）
- 切换到 brush/eraser 时自动隐藏默认鼠标指针，退出时恢复

### 2.9 套索工具（v1.2 新增）
- 自由绘制闭合区域，与笔刷共享颜色、透明度、图层设置
- 与笔刷使用同一套撤销/重做机制（ImageData 快照）
- 高对比度轨迹：黑色 1px 主线 + 白色 3px 描边，确保在任意背景下可见
- `options.lassoFixedSizeOnZoom`（默认 true）：套索轨迹保持固定屏幕大小，不随画布缩放变粗
- 快捷键 `l` 切换（需 enableBrush + enableHotkeys）

---

## 3. Props 配置速查

### 3.1 核心 Props

| Prop | 类型 | 说明 |
|------|------|------|
| `imageSource` | `ImageSource` | 图片来源；支持 `v-model:imageSource` 双向绑定；不传则显示本地上传区域 |
| `options` | `OptionsSource` | 所有可配置项（详见下方） |
| `currentLayer` | `string` | v-model 受控图层切换 |
| `beforeCreatePoint` | `(x, y, nx, ny, count) => boolean \| Promise<boolean>` | ✨ 点创建前回调，父组件可控制是否允许创建；返回 false 时提前终止创建流程 |

**ImageSource 完整字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | 图片地址（远程 URL、dataURL 或 blob URL） |
| `id` | `string` | 可选，业务标识 |
| `width` | `number` | 图片宽度（加载成功后填充） |
| `height` | `number` | 图片高度（加载成功后填充） |
| `isLocal` | `boolean` | 是否为本地图片 |
| `file` | `File` | 当前图片文件（旋转/翻转后为变换后的新文件） |
| `metaFile` | `File` | 原始未变换的图片文件（不受旋转/翻转影响） |

### 3.2 OptionsSource 关键字段

```ts
interface OptionsSource {
  // 功能开关
  enableBrush?: boolean                     // ✨ 是否启用笔刷（默认 true），false 时所有笔刷功能失效
  enableHotkeys?: boolean                   // ✨ 是否启用键盘快捷键（默认 false），默认全部禁用
  brushCursorEnabled?: boolean             // ✨ 是否显示笔刷/橡皮擦的自定义跟随光标（默认 true）
  lassoFixedSizeOnZoom?: boolean           // ✨ 套索轨迹是否保持固定屏幕大小（默认 true），不随画布缩放变粗
  loadingGradientColors?: [string, string]  // 加载中渐变动画的两个颜色（默认：淡紫 -> 淡蓝）
  loadingTextColor?: string                // 加载中文字颜色（默认：'#4a5568'）

  // UI 开关
  showToolbar?: boolean                     // 是否显示内置工具栏（默认 true）
  showZoomController?: boolean              // 是否显示内置缩放控制器（默认 true）
  canvasBackground?: string                 // 画布背景色（默认 '#f6f6f6'）

  // 缩放
  zoomMin?: number                          // 最小缩放（默认 0.2）
  zoomMax?: number                          // 最大缩放（默认 4）

  // 点标注样式（覆盖默认）
  pointStyle?: Partial<PointStyle>          // circleFill, circleStroke, hover*, selected*, label*, fixedSizeOnZoom 等

  // 笔刷样式（覆盖默认）
  brushStyle?: Partial<BrushStyle>          // color, opacity, size, eraserSize?, minSize, maxSize, continuity

  // 多图层配置（不传则单图层 'default'）
  brushLayers?: BrushLayerConfig[]          // [{label, value, color?, opacity?, size?}]

  // 限制
  maxPoints?: number                        // 最大点数
  maxUndoSteps?: number                     // 最大撤销步数（默认 100）

  // Mask 导出默认
  maskExportFormat?: 'png' | 'jpeg' | 'jpg'
  maskExportForeground?: 'black' | 'white'
}
```

### 3.3 重要类型定义

```ts
interface PointStyle {
  circleRadius, circleFill, circleStroke, circleStrokeWidth
  hoverCircleFill, hoverCircleStroke
  selectedCircleFill, selectedCircleStroke, selectedCircleScale
  circleTextFontSize, circleTextFontFamily, circleTextFill
  labelBackgroundColor, labelTextColor, labelFontSize, labelPadding
  fixedSizeOnZoom, fixedSizeScale
}

interface BrushStyle {
  color, opacity, size, eraserSize?, minSize, maxSize, continuity
}

interface BrushLayerConfig {
  label, value, color?, opacity?, size?
}
```

### 3.4 ✨ TypeScript 类型集中导出

所有对外类型与默认常量都从包根 `index.ts` 导出，使用者可直接从 `@zzalai/leafer-point-annotation` 导入，无需自行从子路径引入：

```ts
import PointAnnotation from '@zzalai/leafer-point-annotation'

// 类型（import type，仅作类型提示，不打包）
import type {
  PointAnnotationItem,      // 点标注数据结构（注意命名为 PointAnnotationItem，避免与组件名冲突）
  OptionsSource,            // options prop 类型
  ImageSource,              // imageSource prop 类型
  PointStyle,               // 点样式
  BrushStyle,               // 笔刷样式
  BrushLayerConfig,         // 图层配置
  BrushStrokeData,          // 笔画数据
  ToolType,                 // 'select' | 'point' | 'brush' | 'eraser' | 'lasso'
  ExportFormat,             // 导出格式
  ExportOptions,            // 导出选项
  ImportOptions,            // 导入选项
  ExportData,               // 完整导出数据
} from '@zzalai/leafer-point-annotation'

// 运行时常量（value import）
import {
  DEFAULT_POINT_STYLE,
  DEFAULT_BRUSH_STYLE,
} from '@zzalai/leafer-point-annotation'
```

> 组件实例类型：`ref<InstanceType<typeof PointAnnotation> | null>(null)`

---

## 4. Events 事件速查

| 事件名 | 参数 | 触发时机 |
|--------|------|---------|
| `point-change` | `(points: PointAnnotation[])` | 点新增/删除/修改/重排 |
| `load-start` | - | 开始加载图片 |
| `load-success` | `{ url, width, height, isLocal, file?, metaFile? }` | 图片加载成功（`file` 为当前文件，`metaFile` 为原始文件；旋转/翻转后 `file` 为变换后的新文件，`metaFile` 保持原始不变） |
| `load-error` | `{ error }` | 图片加载失败 |
| `undo-state-change` | `{ canUndo }` | 撤销栈状态变化 |
| `redo-state-change` | `{ canRedo }` | 重做栈状态变化 |
| `update:currentLayer` | `layerValue` | 当前笔刷图层变化（配合 v-model） |
| `layer-change` | `layerValue` | 同 update:currentLayer |
| `update:imageSource` | `ImageSource` | 组件内部选择图片后触发（配合 v-model:imageSource） |
| `point-hover` | `(pointData, isHovering: boolean)` | 点 hover 状态变化（鼠标移入/移出） |
| `point-select` | `(pointData, isSelected: boolean)` | 点选中状态变化（点击选中/取消选中） |

---

## 5. Ref API 方法速查（父组件调用）

### 5.1 点标注
- `getPointAnnotations()` - 获取所有点
- `createPointAnnotation(x, y, label?)` - ✨ 程序化加点（返回 `Promise<string | null>`；若配置 `beforeCreatePoint` 并返回 false，则返回 null 且不创建）
- `removePointAnnotation(id)` - 程序化删点
- `updatePointAnnotationLabel(id, label)` - 修改点的 label 文案
- `setPointHoverState(pointId, isHover)` - 编程式设置某点的 hover 样式（仅修改视觉，不触发事件，不会形成双向循环）
- `setPointSelectState(pointId, isSelected)` - 编程式设置某点的选中状态（通过 `app.editor.select` 更新 editor 内部选中集，与点元素样式和 `previousSelectedStates` 保持一致；`isExternalSelectSync` 标志防止双向循环触发 `point-select` 事件）
- `findPointBySequenceNumber(seq)` - 按圆圈内显示的数字序号查找点，返回 `{ id, data }` 或 null（跨实例联动时，按视觉序号匹配更可靠）

### 5.2 图片 & 画布
- `getImageInfo()` - ✨ `{ url, width, height, isLocal, file?, metaFile? }`（`file` 为当前文件，`metaFile` 为原始未变换的文件）
- `resetCanvas()` - ✨ 重置画布到无图片初始化状态（清除所有标注、笔刷、撤销栈）
- `rotateImage()` - ✨ 顺时针旋转图片 90°（清空所有标注和笔刷数据）
- `rotateImageLeft()` - ✨ 逆时针旋转图片 90°（清空所有标注和笔刷数据）
- `flipImage(direction?)` - ✨ 翻转图片：`'h'` 水平翻转（默认），`'v'` 垂直翻转（清空所有标注和笔刷数据）

> **图片旋转/翻转说明**：采用简化方案——执行时先清空所有已有标注和笔刷数据，再对图片像素进行 Canvas 2D 变换并重新加载。变换后 `file` 为变换后的新 `File`，`metaFile` 始终指向原始文件。

> **图片加载说明**：图片加载完全通过 `props.imageSource` 控制，不再对外暴露 `loadImage()` 和 `openFileDialog()` 方法。组件内部选择图片后通过 `v-model:imageSource` 自动同步到父组件。

### 5.3 工具切换
- `getCurrentTool()` - `'select' | 'point' | 'brush' | 'eraser' | 'lasso'`
- `setTool(tool)` - 切换工具（enableBrush=false 时 brush/eraser/lasso 被拦截）
- `selectTool()` / `pointTool()` / `brushTool(openPanel?)` / `eraserTool()` / `lassoTool()`

### 5.4 删除 & 清空
- `deleteSelected()` - 删除选中点（带确认）
- `clearAllAnnotations()` - 清除所有标注点（不动笔刷）
- `clearAllAnnotationsAndBrush()` - 清空所有点+笔刷（带确认）
- `clearBrush()` - 清空当前图层笔刷
- `clearAllBrushLayers()` - 清空所有图层笔刷

### 5.5 笔刷图层
- `getCurrentLayer()` - 当前激活图层 value
- `setActiveLayer(value)` - 切换到指定图层
- `getAllLayers()` - 返回 `BrushLayerConfig[]`

### 5.6 笔刷样式
- `getBrushStyle()` - 返回当前样式拷贝（含 eraserSize）
- `updateBrushStyle({ color?, opacity?, size?, eraserSize?, continuity? })` - 动态修改

### 5.7 点轨迹生成笔刷区域
- `createBrushFromPoints()` - 按点顺序连成多边形填充

### 5.8 缩放
- `zoomIn()` / `zoomOut()` / `resetZoom()`

### 5.9 撤销 / 重做
- `undo()` / `redo()`

### 5.10 导入 / 导出
- `exportCanvasJSON()` / `importCanvasJSON(data)` - 全量
- `exportMaskImage(format?, fg?)` - 当前图层 mask (dataURL)
- `exportMaskImageByLayer(layerValue, format?, fg?)` - 指定图层
- `exportAllMaskImages(format?, fg?)` - 所有图层（Record）
- `getMaskBlob(layerValue?, format?, fg?)` - Blob（后端上传用）
- `getMaskFile(layerValue?, filename?, format?, fg?)` - File 对象
- `getAllMaskBlobs(format?, fg?)` - 所有图层 Blob 集合
- `exportCOCO()` - COCO JSON
- `exportYOLO()` - YOLO 格式

> 参数说明：`format` = `'png' | 'jpeg' | 'jpg'`，`fg` = `'black' | 'white'`
> 注意：Mask 相关方法需浏览器环境，`enableBrush=false` 时返回 null/{ }

---

## 6. 项目结构

```
leafer-point-annotation/
├── src/
│   ├── components/
│   │   ├── PointAnnotation.vue        # ✨ 核心主组件（~1900 行，整合所有能力）
│   │   ├── BrushSizeSlider.vue        # 笔刷大小浮动滑块
│   │   └── BrushStylePanel.vue        # 笔刷样式配置面板
│   ├── elements/
│   │   └── PointAnnotationElement.ts  # 自定义点元素（Group + Ellipse + Text），内置状态切换、自动重排
│   ├── utils/
│   │   ├── CanvasBrush.ts             # ✨ 笔刷底层（canvas/ctx、绘制、fillPolygon、ImageData 快照）
│   │   ├── LassoOverlay.ts            # ✨ 套索工具（自由绘制闭合区域、黑白双线轨迹、缩放补偿）
│   │   ├── ImageTransformer.ts        # ✨ 图片变换工具（Canvas 2D 实现旋转 90°、水平/垂直翻转）
│   │   ├── BrushCommands.ts           # BrushSnapshotCommand（笔刷 undo/redo 命令）
│   │   ├── PointCommands.ts           # AddPointCommand / RemovePointCommand（点 undo/redo 命令）
│   │   ├── BrushStroke.ts             # 笔画数据结构
│   │   ├── COCOExporter.ts            # COCO 格式导出
│   │   └── YOLOExporter.ts            # YOLO 格式导出
│   ├── types/
│   │   └── index.ts                   # ✨ 所有对外类型 + DEFAULT 常量
│   ├── App.vue                        # 开发演示页面（含所有功能的测试按钮）
│   ├── index.ts                       # 对外导出入口
│   └── main.ts                        # dev 入口
├── project-docs/
│   ├── ARCHITECTURE.md                # 架构文档（模块划分、实现要点、文件索引）
│   ├── REQUIREMENTS.md                # 需求文档（功能清单、非功能需求、约束边界）
│   ├── IMPLEMENTATION_PLAN.md         # 实现方案记录
│   ├── TODO.md                        # 待办与已完成
│   └── leafer-development-guide/      # LeaferJS 开发指南
├── skills/
│   └── project-context.md             # ✨ 本文件（新开 AI 会话时快速阅读）
├── docs/                              # GitHub Pages 演示站点（构建产物）
│   ├── index.html
│   └── assets/
├── dist/                              # npm 发布产物
│   ├── leafer-point-annotation.es.js  # ESM
│   ├── leafer-point-annotation.umd.js # UMD
│   ├── leafer-point-annotation.css    # 样式（使用者必须手动 import）
│   └── index.d.ts                     # TypeScript 类型声明
├── vite.config.ts                     # 库构建配置
├── vite.docs.config.ts                # 演示站点构建配置
├── package.json                       # 包信息与脚本
├── README.md                          # 中文文档
└── README_EN.md                       # 英文文档
```

---

## 7. 构建与发布流程

### 7.1 npm scripts

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 本地开发（App.vue 为演示入口） |
| `pnpm build` | 构建库产物到 `dist/`（.es.js, .umd.js, .css, .d.ts） |
| `pnpm docs:build` | 构建演示站点到 `docs/` |
| `pnpm build:all` | ✨ 同时构建库 + 演示站点（发布前必执行） |
| `pnpm preview` | 预览构建产物 |
| `pnpm tsc --noEmit` | 类型检查 |

### ✨ npm 发布优化说明
- `package.json` 的 `files` 字段为 `["dist"]`，**仅发布 dist 目录**，不包含 src、project-docs 等源码/开发文档，减小包体积
- 类型声明文件：`dist/index.d.ts`
- 包入口：ESM: `dist/leafer-point-annotation.es.js`，UMD: `dist/leafer-point-annotation.umd.js`
- CSS: `dist/leafer-point-annotation.css`（需使用者手动 `import`）

### 7.2 发布前检查清单
- ✅ `pnpm build:all` 无错误
- ✅ `dist/` 含完整产物（.es.js, .umd.js, .css, .d.ts）
- ✅ `docs/` 含最新演示站点
- ✅ 类型检查通过
- ✅ README.md / README_EN.md 已同步更新
- ✅ `project-docs/` 中文档已同步

### 7.3 发布命令
```bash
# 1. 构建
pnpm install
pnpm run build:all

# 2. 更新 package.json 的 version 字段

# 3. 发布到 npm
npm publish

# 4. 推送到 GitHub（触发 Pages 自动刷新）
git add .
git commit -m "chore: release vX.Y.Z"
git push
```

---

## 8. 关键实现要点（开发时需注意）

### 8.1 点元素（PointAnnotationElement.ts）
- 继承 LeaferJS 的 `Group`，内部含 `Ellipse`（圆点）+ `Text`（序号）
- hover/selected 状态切换由 LeaferJS 原生事件驱动
- `sequenceNumber` 字段用于显示序号，删除点后由父组件调用 `renumberSequenceNumbers()` 重排
- label 文本：不允许为空字符串
- undo/redo 时 Text.text 变化需判断是否为"自动重排变值"，避免误存

### 8.2 笔刷（CanvasBrush.ts）
- 每个图层一个实例，含独立 HTML canvas
- 绘制方式：`stroke(x, y, color)` + `eraserStroke(x, y, size)` + `fillPolygon(points, color)`
- 撤销基于操作前后的 ImageData 快照
- 透明度通过 Group.opacity 控制，避免叠加问题

### 8.3 套索工具（LassoOverlay.ts）
- 自由绘制闭合路径，松开鼠标后调用 `CanvasBrush.fillPolygon()` 填充
- 高对比度轨迹：双层 Path 叠加（下层白色 3px 描边 + 上层黑色 1px 主线），确保在任意背景色下都清晰可见
- 缩放补偿：`lassoFixedSizeOnZoom=true`（默认）时，通过 `strokeWidth / scale` 保持轨迹屏幕尺寸不变
- 与笔刷共享颜色、透明度、图层、undo/redo 机制
- 光标：使用浏览器默认光标，不使用笔刷自定义光标

### 8.4 `enableBrush` 的影响范围
- 入口：`effectiveEnableBrush = computed(() => props.options?.enableBrush !== false)`
- UI 层：笔刷按钮、橡皮按钮、BrushStylePanel 加 `v-if="effectiveEnableBrush"`
- 方法层：所有笔刷相关方法开头加守卫
- 数据层：`initBrushLayers` 跳过 canvas 创建
- 快捷键层：`b` / `e` 按键 handler 加守卫
- 导出层：Mask/Blob/File 相关方法返回 null/{ }
- 确认文案：deleteSelected 的提示根据是否启用笔刷动态变化

### 8.5 Props 命名约定
- **组件对外 props 用 kebab-case**（Vue 模板中）：`:image-source`、`:options`、`v-model:current-layer`
- **事件名也用 kebab-case**：`@point-change`、`@load-success`、`@layer-change`
- **内部 TypeScript 用 camelCase**：`imageSource`、`currentLayer`、`pointStyle`
- `PointStyle` / `BrushStyle` 的字段名是 camelCase（circleFill, circleStroke 等）

### 8.6 图片变换（ImageTransformer.ts）
- **方案**：简化方案，执行变换前先清空所有标注和笔刷数据
- **流程**：保存当前数据 → Canvas 2D 像素变换 → 生成新 Blob URL → 通过 `update:imageSource` 触发 `loadImage` 重新加载
- **支持操作**：`rotate90`（顺时针 90°）、`rotate270`（逆时针 90°）、`flipH`（水平翻转）、`flipV`（垂直翻转）
- **Ref API**：`rotateImage()` / `rotateImageLeft()` / `flipImage('h'|'v')`
- **`file` vs `metaFile`**：变换后 `file` 为新 File 对象，`metaFile` 始终保持原始文件引用
- **Blob URL 生命周期**：`loadImage` 开头统一回收旧 blob URL，LOADED 回调不再提前回收

---

## 9. 常见开发问题速查

### Q1. 本地图片上传后 props.imageSource.url 变更无效？
- 组件内部 `hasLocalImage` / `localImageUrl` 标记本地上传后优先本地；若 props.url 变更在上传之后，会监听并清空本地标记重新加载。

### Q2. 使用者报告样式没生效？
- 检查是否手动导入 CSS：`import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'`（CSS 不会自动注入）。

### Q3. 我只需要点标注功能，不需要笔刷？
- `options={{ enableBrush: false }}`，所有笔刷 UI 与方法都会被屏蔽。

### Q4. 我要给后端上传 Mask，用 dataURL 还是 Blob？
- 后端推荐 Blob/File：`getMaskBlob()` 或 `getMaskFile()` 直接用于 `formData.append('file', blob)`。

### Q5. 父组件要自定义工具栏？
- `options={{ showToolbar: false, showZoomController: false }}`，然后通过 `ref` 调用暴露的任意方法。

### Q6. 多图层如何切换？
- 通过 `options.brushLayers` 配置多个图层；父组件可通过 `v-model:currentLayer="'foreground'"` 或 `setActiveLayer('foreground')` 控制。

### Q7. 笔刷撤销的性能？
- 对超大图片，单张 ImageData 快照约 4×W×H 字节，`maxUndoSteps` 不宜过大（默认 100）。

### ✨ Q8. 我想在点标注创建前做业务判定？
- 使用 `:before-create-point="yourCallback"` prop
- 回调签名：`(x: number, y: number, normalizedX: number, normalizedY: number, existingPointCount: number) => boolean | Promise<boolean>`
- 返回 false 或 Promise<false> 时提前终止创建（不写入数据、不进 undo 栈、不 emit）
- 典型用途：数量限制（`count >= 5`）、区域限制（`nx < 0.5` 只允许右半部分）、异步确认（`window.confirm`）
- 该回调仅在 `createPointAnnotation()` 内部执行一次，避免重复弹窗问题

### ✨ Q9. 快捷键没反应？
- 检查 `options.enableHotkeys` 是否为 `true`（默认 false，全部禁用）
- 检查是否启用 `enableBrush`（笔刷快捷键 `b`、`e`、`l` 需 enableBrush）
- 快捷键生效条件：画布 focus 或 hover 画布

### Q10. 套索工具和笔刷工具有什么区别？
- 目标一致：都是在当前笔刷图层绘制/擦除区域
- 使用方式不同：笔刷是连续涂抹，套索是先画闭合路径再填充
- 共享配置：颜色、透明度、图层、undo/redo 完全共用
- 套索轨迹：黑白双线高对比度，默认固定屏幕大小（`lassoFixedSizeOnZoom=true`）

### Q11. 图片旋转/翻转后标注数据会保留吗？
- 不会。旋转/翻转采用简化方案，会清空所有已有点标注和笔刷数据
- 建议在开始标注前先调整好图片方向
- 变换后 `file` 为新 File 对象，`metaFile` 保持原始文件引用

---

## 10. 文档索引

| 文档 | 位置 | 用途 |
|------|------|------|
| 中文 README | `README.md` | 使用者中文文档（安装、快速开始、API、示例） |
| 英文 README | `README_EN.md` | 使用者英文文档 |
| 架构文档 | `project-docs/ARCHITECTURE.md` | 模块划分、实现要点、依赖清单、文件索引 |
| 需求文档 | `project-docs/REQUIREMENTS.md` | 功能需求清单、非功能需求、约束边界、版本与发布流程 |
| 实现方案 | `project-docs/IMPLEMENTATION_PLAN.md` | 开发方案记录 |
| 待办清单 | `project-docs/TODO.md` | 待完成与已完成任务 |
| LeaferJS 指南 | `project-docs/leafer-development-guide/` | LeaferJS 开发实践指南 |
| 项目上下文（本文件） | `skills/project-context.md` | 新开 AI 会话时快速阅读 |

---

## 11. 关键依赖

| 依赖 | 版本范围 | 用途 |
|------|----------|------|
| `vue` | ^3.3.0 (peerDependency) | 宿主框架，不打包进产物 |
| `leafer-ui` | ^2.0.8 | Canvas 渲染引擎（App/Image/Group/Ellipse/Text） |
| `@leafer-in/editor` | ^2.0.8 | 编辑器（选择/框选） |
| `@leafer-in/viewport` | ^2.0.8 | 视口（缩放/平移） |
| `@leafer-in/resize` | ^2.0.8 | 元素 resize 手柄 |
| `@leafer-in/state` | ^2.1.0 | hover/selected 状态 |
| `@leafer-in/text-editor` | ^2.1.0 | label 文本编辑 |
| `@leafer-in/view` | ^2.0.8 | view 盒子 |
| `@leafer-in/box` | ^2.1.6 | box 布局 |
| `@zzalai/leafer-undo-redo` | 1.0.3 | 撤销/重做 CommandManager |
| `tinykeys` | ^3.0.0 | 键盘热键系统 |
| `vue-pick-colors` | ^1.8.0 | 颜色选择器组件 |

---

## 12. 版本信息速查

- **当前版本**: 见 `package.json` 的 `version` 字段
- **npm 包名**: `@zzalai/leafer-point-annotation`
- **发布渠道**: npm public registry
- **作者**: zzalai
- **License**: MIT
