# 点标注与笔刷涂抹工具 - 功能架构文档

> **版本**: v1.1.x  |  **用途**: 新开 AI 会话时快速理解项目结构与代码组织

---

## 1. 架构概述

### 1.1 架构设计原则

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个组件/模块只负责一个功能 |
| **分层架构** | 清晰的层次划分：UI层、业务层、数据层 |
| **可扩展性** | 预留扩展接口，支持后续功能迭代 |
| **响应式设计** | Vue3 Composition API + `<script setup>` |
| **性能优先** | Canvas 原生绘制 + LeaferJS 渲染管线，避免频繁 DOM 操作 |
| **类型安全** | 全量 TypeScript，核心接口（PointStyle、BrushStyle、OptionsSource）严格定义 |

### 1.2 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        UI 层 (Vue 组件)                      │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ BrushSize    │  │ BrushStyle     │  │ PointAnnotation │ │
│  │ Slider.vue   │  │ Panel.vue      │  │ (主画布组件)    │ │
│  └──────┬───────┘  └───────┬────────┘  └────────┬────────┘ │
│         │                  │                    │          │
└─────────┼──────────────────┼────────────────────┼──────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    业务逻辑层 (PointAnnotation.vue)         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐  │
│  │ 工具切换   │ │ 事件处理   │ │ 命令管理   │ │ 数据管理│  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   元素封装层    │ │   工具类层       │ │   类型定义层     │
│ PointAnnotation │ │ CanvasBrush.ts   │ │  types/index.ts  │
│ Element.ts      │ │ LassoOverlay.ts  │ │                  │
│                 │ │ ImageTransformer  │ │                  │
│                 │ │ BrushCommands.ts │ │                  │
│                 │ │ PointCommands.ts │ │                  │
│                 │ │ BrushStroke.ts   │ │                  │
│                 │ │ COCOExporter.ts  │ │                  │
│                 │ │ YOLOExporter.ts  │ │                  │
└─────────────────┘ └─────────────────┘ └──────────────────┘
```

---

## 2. 模块划分（按文件）

### 2.1 根目录入口

| 文件 | 职责 |
|------|------|
| `src/index.ts` | 对外导出 PointAnnotation 组件（named + default export） |
| `src/main.ts` | dev 模式下的入口，挂载 App.vue 到 `#app` |
| `src/App.vue` | **开发调试演示页**，集成了所有功能的测试按钮（点标注、笔刷、图层、导出、Mask、enableBrush 等） |

### 2.2 UI 层 - 组件

| 组件 | 文件 | 职责 |
|------|------|------|
| PointAnnotation | `src/components/PointAnnotation.vue` | **核心主组件**，近 1900 行，整合所有标注与笔刷能力 |
| BrushSizeSlider | `src/components/BrushSizeSlider.vue` | 笔刷大小浮动滑块（由 BrushStylePanel 调用） |
| BrushStylePanel | `src/components/BrushStylePanel.vue` | 笔刷样式配置面板（颜色、透明度、笔刷大小、橡皮擦大小 slider、连续性） |

### 2.3 元素封装层 - LeaferJS 自定义元素

| 文件 | 职责 |
|------|------|
| `src/elements/PointAnnotationElement.ts` | 自定义点标注元素（继承 `Group`，含 `Ellipse` + `Text`），内置 hover/press/selected 状态切换、`sequenceNumber` 自动重排、`updateLabel()` 方法 |

### 2.4 工具类层 - utils

| 文件 | 职责 |
|------|------|
| `src/utils/CanvasBrush.ts` | 笔刷底层：每个图层一个实例，含 canvas/ctx、stroke/clear/fillPolygon/getImageData/hasContent/getGroup 等 |
| `src/utils/LassoOverlay.ts` | 套索工具：自由绘制闭合区域，黑白双线高对比度轨迹，支持固定屏幕大小 |
| `src/utils/ImageTransformer.ts` | 图片变换工具：基于 Canvas 2D 实现顺时针 90° 旋转、水平/垂直翻转，返回变换后的 Blob 和 Blob URL |
| `src/utils/BrushCommands.ts` | 笔刷相关命令（撤销/重做用）：`BrushSnapshotCommand` 基于 ImageData 快照 |
| `src/utils/PointCommands.ts` | 点标注相关命令：`AddPointCommand`、`RemovePointCommand` |
| `src/utils/BrushStroke.ts` | 笔刷笔画数据结构与辅助函数（已由 CanvasBrush 接管核心绘制，主要供数据导出用） |
| `src/utils/COCOExporter.ts` | 导出 COCO JSON 格式（点标注为 keypoints） |
| `src/utils/YOLOExporter.ts` | 导出 YOLO 标注格式 |

### 2.5 类型定义层

| 文件 | 职责 |
|------|------|
| `src/types/index.ts` | **所有对外接口集中地**：`PointAnnotation`、`PointStyle`、`BrushLayerConfig`、`BrushStyle`（含独立橡皮擦尺寸 `eraserSize`）、`BrushStrokeData`、`ToolType`（'select' \| 'point' \| 'brush' \| 'eraser' \| 'lasso'）、`ExportFormat`、`ExportOptions`、`Statistics`、`ExportData`，以及 `DEFAULT_POINT_STYLE` / `DEFAULT_BRUSH_STYLE` |

---

## 3. PointAnnotation 主组件内部结构（重点）

> 位置：`src/components/PointAnnotation.vue` （~1900 行，script setup + 模板 + style 三段式）

### 3.1 Props 与 Events

```ts
// Props（defineProps 写法）
{
  imageSource?: ImageSource                     // 图片来源；支持 v-model:imageSource 双向绑定；不传则显示上传区域（支持点击+拖拽）
  options?: OptionsSource                       // 所有可配置项（见下方）
  currentLayer?: string                         // 受控模式：父组件驱动当前图层
  beforeCreatePoint?: (x, y, nx, ny, existingPointCount) => boolean | Promise<boolean>
  // 点标注创建前回调，父组件可在此判定是否允许创建，支持同步/异步返回
  // 返回 true 允许创建，false 阻止创建
  // 该回调在 handleCanvasTap 和 createPointAnnotation 两个路径都会被触发
}

// Events（defineEmits）
pointChange | loadStart | loadSuccess({ url, width, height, isLocal, file? }) | loadError
//                                              ↑ 本地选图时有 isLocal=true 和原始 File 对象
undoStateChange | redoStateChange
update:currentLayer | layerChange
update:imageSource                              // 组件内部选择图片后触发（配合 v-model:imageSource）
```

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

**beforeCreatePoint 触发流程（必知）**：

```
handleCanvasTap(e)
  └─> createPointAnnotation(pixelX, pixelY)      // 唯一创建入口
        ├─> 读取 imageWidth/imageHeight（若未加载，返回 null）
        ├─> ✨ 若 props.beforeCreatePoint 存在
        │      ├─> 计算 normalizedX = pixelX / imageWidth
        │      ├─> 计算 normalizedY = pixelY / imageHeight
        │      └─> 调用 beforeCreatePoint(x, y, nx, ny, pointAnnotations.value.length)
        │           └─> 同步：立即判断返回值
        │           └─> 异步（Promise）：await 后判断
        │                └─> 返回 false → return null（提前终止，不 emit）
        ├─> 创建 PointAnnotationElement（Leafer 自定义元素）
        ├─> 推入 pointLayer / pointAnnotations.value
        ├─> 推入 AddPointCommand（undo/redo 栈）
        ├─> emit('pointChange', pointAnnotations.value)
        └─> 返回新点 id
```

> **关键设计**：`beforeCreatePoint` 仅在 `createPointAnnotation` 一个函数内执行，避免了「点击触发一次、程序化调用再触发一次」导致的重复判定问题。

### 3.2 OptionsSource - 完整配置项

```ts
interface OptionsSource {
  // 点标注样式
  pointStyle?: Partial<PointStyle>

  // 笔刷样式（含独立橡皮擦尺寸 eraserSize）
  brushStyle?: Partial<BrushStyle>

  // 多图层笔刷（不传则单图层）
  brushLayers?: BrushLayerConfig[]
  maxBrushLayers?: number

  // 限制
  maxPoints?: number
  maxUndoSteps?: number         // 默认 100（硬编码在 init 中）

  // Mask 导出默认
  maskExportFormat?: 'png' | 'jpeg' | 'jpg'
  maskExportForeground?: 'black' | 'white'

  // UI 开关
  showToolbar?: boolean         // 默认 true
  showZoomController?: boolean  // 默认 true
  canvasBackground?: string     // 画布背景色（默认 #f6f6f6）
  zoomMin?: number              // 最小缩放比例
  zoomMax?: number              // 最大缩放比例

  // 功能开关（核心新增）
  enableBrush?: boolean         // 默认 true；设为 false 时：
                                //   - 笔刷/橡皮擦按钮与配置面板隐藏
                                //   - brushTool/eraserTool 方法不生效
                                //   - 快捷键 b/e 不生效
                                //   - initBrushLayers 跳过 canvas 创建
                                //   - mask 导出相关方法返回 null/{}
                                //   - 删除确认文案不包含"笔刷"
  enableHotkeys?: boolean       // 默认 false；设为 true 时才绑定 tinykeys 快捷键
                                //   (v/p/b/e/Ctrl+Z/Ctrl+Y/Delete/Ctrl+±/Ctrl+0/Alt)
  brushCursorEnabled?: boolean // 默认 true；设为 false 时禁用笔刷/橡皮擦的自定义跟随光标
  lassoFixedSizeOnZoom?: boolean // 默认 true；套索轨迹是否保持固定屏幕大小（不随画布缩放变粗）
  loadingGradientColors?: [string, string]  // 加载中渐变动画两个颜色（默认：淡紫 -> 淡蓝）
  loadingTextColor?: string    // 加载中文字颜色（默认：#4a5568）
}
```

### 3.3 LeaferJS 画布结构

```
App (leafer-ui)
└── contentLayer (Group, name: "contentLayer")
    ├── imageBox (Image)            // 背景图（由 loadImage 加载）
    ├── pointLayer (Group)          // 所有 PointAnnotationElement 挂在此处
    └── [canvas-brush-group-*]      // 每个笔刷图层一个 group（含 html canvas）
```

### 3.4 关键 computed 状态（文档必知）

| 变量 | 含义 |
|------|------|
| `hasImage` | `loadStatus === 'success'`；控制工具栏/画布是否可见 |
| `showToolbar` | `hasImage && options?.showToolbar !== false` |
| `showZoomController` | `hasImage && options?.showZoomController !== false` |
| `effectiveEnableBrush` | `options?.enableBrush !== false` |
| `pointStyle` | `DEFAULT_POINT_STYLE + options.pointStyle` |
| `brushStyle` | `DEFAULT_BRUSH_STYLE + options.brushStyle` |
| `localBrushStyle` | 本地响应式拷贝（滑块改的值存在这） |
| `effectiveBrushLayers` | 实际使用的图层配置；无配置时返回 `[{label:'默认图层', value:'default'}]` |
| `effectiveCurrentLayer` | 当前激活图层 value |
| `activeCanvasBrush` | 当前图层的 `CanvasBrush` 实例（供笔刷绘制、fillPolygon、clear 用） |

### 3.5 关键数据结构

| 变量 | 类型 | 含义 |
|------|------|------|
| `pointAnnotations` | `ref<PointAnnotation[]>` | 所有点标注数据（响应式） |
| `pointCounter` | `ref<number>` | 下一个 order 数字 |
| `canvasBrushesByLayer` | `Record<string, CanvasBrush>` | key = layer.value；value = CanvasBrush 实例 |
| `commandManager` | `CommandManager`（来自 @zzalai/leafer-undo-redo） | 撤销/redo 命令栈 |

### 3.6 defineExpose - 父组件可调用 API（完整列表）

> **重要**: 如果想自定义工具栏（隐藏组件自带工具栏），调用这些方法即可。

| 方法 | 说明 |
|------|------|
| **点标注数据** | |
| `getPointAnnotations()` | 返回当前所有标注点 |
| `createPointAnnotation(x, y, label?)` | 程序化添加一个点 |
| `removePointAnnotation(id)` | 程序化删除一个点 |
| `updatePointAnnotationLabel(id, label)` | 修改某个点的 label 文案 |
| **图片 & 画布** | |
| `getImageInfo()` | 返回 `{ url, width, height, isLocal, file?, metaFile? }`（`file` 为当前文件，`metaFile` 为原始未变换的文件） |
| `resetCanvas()` | 重置画布到无图片初始化状态（清除所有标注、笔刷、撤销栈） |
| `rotateImage()` | 顺时针旋转图片 90°（清空所有标注和笔刷数据） |
| `rotateImageLeft()` | 逆时针旋转图片 90°（清空所有标注和笔刷数据） |
| `flipImage(direction?)` | 翻转图片：`'h'` 水平翻转（默认），`'v'` 垂直翻转（清空所有标注和笔刷数据） |
| **工具切换** | |
| `getCurrentTool()` | 返回 `'select'/'point'/'brush'/'eraser'/'lasso'` |
| `setTool(tool)` | 切到指定工具（受 enableBrush 限制） |
| `selectTool()` / `pointTool()` | |
| `brushTool(openPanel?)` / `eraserTool()` / `lassoTool()` | |
| **删除 / 清空** | |
| `deleteSelected()` | 删除当前选中的标注点 |
| `clearAllAnnotationsAndBrush()` | 清空所有点 + 笔刷（带确认） |
| `clearBrush()` / `clearAllBrushLayers()` | 清空当前/所有图层的笔刷 |
| **笔刷图层** | |
| `getCurrentLayer()` / `setActiveLayer(value)` | |
| `getAllLayers()` | 返回 `BrushLayerConfig[]` |
| **笔刷样式** | |
| `getBrushStyle()` | 返回当前 localBrushStyle 的拷贝 |
| `updateBrushStyle(partial)` | 动态更新笔刷颜色/透明度/大小/连续性 |
| **点轨迹生成笔刷** | |
| `createBrushFromPoints()` | 按点标注顺序连成闭合多边形，fillPolygon 填充到当前笔刷层 |
| **缩放** | |
| `zoomIn()` / `zoomOut()` / `resetZoom()` | |
| **撤销 / 重做** | |
| `undo()` / `redo()` | |
| **导出** | |
| `exportCanvasJSON()` / `importCanvasJSON(data)` | 全量导入导出 |
| `exportMaskImage(format?, fg?)` | 当前图层 mask（Data URL） |
| `exportMaskImageByLayer(layerValue, format?, fg?)` | 指定图层 mask |
| `exportAllMaskImages(format?, fg?)` | 所有图层 mask（Record<layerValue, dataURL>） |
| `getMaskBlob(layerValue?, format?, fg?)` | 当前/指定图层 Blob（后端上传用） |
| `getMaskFile(layerValue?, filename?, format?, fg?)` | 当前/指定图层 File |
| `getAllMaskBlobs(format?, fg?)` | 所有图层 Blob 集合 |
| `exportCOCO()` / `exportYOLO()` | 导出数据集格式 |

### 3.7 快捷键（tinykeys）

| 按键 | 功能 | 限制 |
|------|------|------|
| `v` | 选择工具 | 画布 focus 或 hover 才生效 |
| `p` | 点标注工具 | 同上 |
| `b` | 笔刷工具 | 需 `effectiveEnableBrush=true` |
| `e` | 橡皮擦工具 | 需 `effectiveEnableBrush=true` |
| `Ctrl+Z` | 撤销 | |
| `Ctrl+Y` | 重做 | |
| `Delete` | 删除选中 | |
| `Ctrl++` / `Ctrl+-` / `Ctrl+0` | 缩放 +/− / 重置 | |
| `Alt` | 显示快捷键提示浮层 | |

---

## 4. 核心功能实现要点

### 4.1 点标注 (PointAnnotationElement)

- **继承自 `Group`**，内部包含一个 `Ellipse`（圆点）和一个 `Text`（文字）
- **hover / press / selected 三态**：通过监听 LeaferJS 原生事件（`pointer.over`、`pointer.out`、`pointer.down`、`pointer.up`）控制填充色与缩放
- **sequenceNumber 自动重排**：删除点后调用 `renumberSequenceNumbers()`，保证显示序号 1,2,3... 连续；同时在 Text.text 变化时判断是否为"自动序号变值"以避免把重排当作用户手动修改保存
- **label 编辑**：`updateLabel(label)` 修改文字；label 文本不允许为空字符串
- **命令化**：点新增/删除都通过 `AddPointCommand`/`RemovePointCommand` 进撤销栈

### 4.2 多图层笔刷 (CanvasBrush)

- **每个图层一个 HTML canvas + CanvasBrush 实例**，挂在独立 Group 下（通过 Group.opacity 控制整体透明度，避免叠加问题）
- `brushLayers?: BrushLayerConfig[]` 不传时 → 单图层，value 为 `"default"`
- `canvasBrushesByLayer[layerValue] = CanvasBrush` 便于快速定位当前图层画笔
- **绘制方式**：`stroke(x, y, color)` + `eraserStroke(x, y, size)` + `fillPolygon(points, color)`
- **快照式撤销**：`BrushSnapshotCommand` 在操作前后保存 `getImageData()`，redo/undo 时 `putImageData()`

### 4.3 enableBrush 功能开关

- 入口：`effectiveEnableBrush = computed(() => props.options?.enableBrush !== false)`
- **UI 层**：工具栏笔刷按钮 / eraser 按钮 / BrushStylePanel 全部加 `v-if`
- **方法层**：brushTool/eraserTool/updateBrushStyle/clearBrush/clearAllBrushLayers/createBrushFromPoints 开头加守卫
- **数据层**：`initBrushLayers` 跳过 canvas 创建；`setTool('brush'/'eraser')` 被拦截
- **导出层**：exportMaskImage / exportMaskImageByLayer / exportAllMaskImages / getMaskBlob / getMaskFile / getAllMaskBlobs 返回 null 或 {}
- **快捷键层**：`b`/`e` 按键 handler 开头加守卫
- **确认文案**：deleteSelected 的确认提示不出现"笔刷"字样

### 4.4 点轨迹生成笔刷区域 (createBrushFromPoints)

- 将所有点按 `sequenceNumber` 升序排序，取 pixel 坐标连成闭合多边形
- 调用 `activeCanvasBrush.fillPolygon(points, color)` 填充到当前激活图层
- 操作前后快照保存 → 支持撤销/重做

### 4.5 Mask 导出（含 Blob/File）

- **原理**：遍历对应 canvas，将有内容像素 → 前景色（黑/白），无内容 → 透明或背景色
- **输出形式**：
  - `data URL` (Base64 PNG/JPEG)
  - `Blob`（后端上传 `multipart/form-data` 直接用）
  - `File`（带 filename + mime，直接 formData.append）
- **单图层 / 多图层都支持**：`getAllMaskBlobs()` 返回 Record<layerValue, Blob>

### 4.6 点标注 COCO / YOLO 导出

- COCO：把点标注写成 `annotations[].keypoints`（x,y,v 三值，v=2 表示可见）
- YOLO：生成 yolo 格式标签文件（归一化坐标）
- 详见 `src/utils/COCOExporter.ts`、`src/utils/YOLOExporter.ts`

---

## 5. 构建与发布

### 5.1 package.json 关键脚本

```json
{
  "name": "@zzalai/leafer-point-annotation",
  "version": "1.1.2",
  "main": "./dist/leafer-point-annotation.umd.js",
  "module": "./dist/leafer-point-annotation.es.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "vite",
    "build": "vite build",                         // 构建 dist（es/umd/css/dts）
    "docs:build": "vite build --config vite.docs.config.ts",  // 构建演示站点到 docs/
    "build:all": "npm run build && npm run docs:build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

### 5.2 dist 目录结构

```
dist/
├── leafer-point-annotation.es.js   (ESM)
├── leafer-point-annotation.umd.js  (UMD)
├── leafer-point-annotation.css     (样式，必须手动导入)
└── index.d.ts                      (TypeScript 类型)
```

> 使用者在项目中必须 `import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'`。

### 5.3 docs 目录（GitHub Pages 演示站）

```
docs/
├── index.html
└── assets/
    ├── index-*.js
    └── index-*.css
```

GitHub Pages 配置：分支 `main` / 目录 `/docs`。

### 5.4 发布流程

```bash
pnpm install
pnpm run build:all     # ← 同时生成 dist 和 docs
# 确认 dist 有 .es.js / .umd.js / .css / index.d.ts
# 确认 docs 有最新的演示站点
npm publish            # 发布到 npm（需先登录 npm）
```

---

## 6. 依赖清单（核心）

| 包 | 版本要求 | 用途 |
|----|----------|------|
| `vue` | ^3.3.0 (peerDependency) | 宿主框架 |
| `leafer-ui` | ^2.0.8 | Canvas 渲染引擎（App/Image/Group/Ellipse/Text） |
| `@leafer-in/editor` | ^2.0.8 | 编辑器（选择、框选、点状态管理） |
| `@leafer-in/viewport` | ^2.0.8 | 缩放/平移视口 |
| `@leafer-in/resize` | ^2.0.8 | 元素 resize 手柄 |
| `@leafer-in/state` | ^2.1.0 | hover/selected 状态 |
| `@leafer-in/text-editor` | ^2.1.0 | label 文本编辑 |
| `@leafer-in/view` | ^2.0.8 | view 盒子 |
| `@leafer-in/box` | ^2.1.6 | box 布局 |
| `@zzalai/leafer-undo-redo` | 1.0.3 | 撤销/重做 CommandManager |
| `tinykeys` | ^3.0.0 | 键盘热键 |
| `vue-pick-colors` | ^1.8.0 | 颜色选择器组件 |

---

## 7. 常见开发问题速查

### Q1. 本地图片上传后 props.imageSource.url 变更无效？
- 组件内部 `hasLocalImage`/`localImageUrl` 标记本地上传后优先本地；若 props.url 变更是在本地上传之后，会监听 `watch(props.imageSource?.url)` 并在检测到新 url 时清空本地标记重新加载。

### Q2. 点标注删除后序号不连续？
- `removePointAnnotation` / `Delete` 操作后调用 `renumberSequenceNumbers()`，按数组顺序重写每个元素的 `sequenceNumber` 及显示文本。undo/redo 时 Text.text 变化通过「与当前 sequenceNumber 的比较」判定是否为自动重排，避免误存为用户自定义修改。

### Q3. 我只需要点标注功能，不需要笔刷，如何配置？
- `options={{ enableBrush: false }}`，所有笔刷 UI 与方法都会被屏蔽。

### Q4. 我要给后端上传 Mask，用 dataURL 还是 Blob？
- 后端推荐 Blob/File：`getMaskBlob()` 或 `getMaskFile()` 直接用于 `formData.append('file', blob)`。

### Q5. 父组件要自定义工具栏怎么搞？
- `options={{ showToolbar: false, showZoomController: false }}`，然后父组件通过 `ref` 调用 expose 中的任意方法（selectTool/pointTool/brushTool/deleteSelected/clearAll/export*/...）。

### Q6. 多图层如何切换？
- 通过 `options.brushLayers: [{label, value, color?, opacity?, size?}]` 配置多个图层；父组件可通过 `v-model:currentLayer="'layerA'"` 或 `setActiveLayer('layerA')` 控制当前图层。

### Q7. 我需要在点标注创建前做业务校验（如数量限制、区域限制、二次确认），怎么办？
- 使用 `:before-create-point="yourCallback"` prop。
- 回调签名：`(x: number, y: number, normalizedX: number, normalizedY: number, existingPointCount: number) => boolean | Promise<boolean>`。
- 返回 `false` 或 `Promise<false>` 时会**提前终止点的创建**，不写入数据、不进 undo 栈、不 emit pointChange。
- **典型用法**：
  - `count >= 20 → false`（数量限制）
  - `normalizedX < 0.5 → false`（只允许在右半部分标注）
  - `window.confirm('确认创建?')`（异步二次确认）
- **注意**：该回调仅在 `createPointAnnotation()` 内部执行一次，`handleCanvasTap` 不再重复调用，避免了「两次判定、两次弹窗」的问题。

---

## 8. 文件索引（快速定位）

```
src/
├── components/
│   ├── PointAnnotation.vue       ← 核心（1900 行）
│   ├── BrushSizeSlider.vue       ← 大小 slider
│   └── BrushStylePanel.vue       ← 样式配置面板
├── elements/
│   └── PointAnnotationElement.ts ← 点标注自定义元素
├── utils/
│   ├── CanvasBrush.ts            ← 笔刷底层（canvas/ctx、fillPolygon、快照）
│   ├── BrushCommands.ts          ← BrushSnapshotCommand
│   ├── PointCommands.ts          ← AddPointCommand/RemovePointCommand
│   ├── BrushStroke.ts            ← 笔画数据结构
│   ├── COCOExporter.ts           ← COCO 导出
│   └── YOLOExporter.ts           ← YOLO 导出
├── types/
│   └── index.ts                  ← 所有对外类型 + DEFAULT 常量
├── App.vue                       ← 开发演示页面（含所有功能的测试按钮）
├── index.ts                      ← 对外导出入口
└── main.ts                       ← dev 入口

project-docs/                     ← 本文档所在目录（AI 会话上下文来源）
├── ARCHITECTURE.md               ← 本文（架构与模块）
├── REQUIREMENTS.md               ← 需求清单
├── IMPLEMENTATION_PLAN.md        ← 实现方案记录
├── TODO.md                       ← 待办与已完成
└── leafer-development-guide/
    ├── LEAFER_DEVELOPMENT_GUIDE.md
    ├── LEAFER_UNDO_REDO_GUIDE.md
    └── TINYKEYS_GUIDE.md
```
