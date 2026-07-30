# @zzalai/leafer-point-annotation

[English](README_EN.md) | 中文

> 基于 **Vue 3 + LeaferJS** 的图像点标注与笔刷涂抹工具，支持导出 COCO/YOLO/JSON 格式，专为 AI 模型训练数据集标注设计。

- 📍 点标注（可拖拽、可编辑、自动重排、hover/selected 状态）
- 🖌️ 多图层笔刷涂抹与擦除（颜色、透明度、大小、连续性可调，橡皮擦独立尺寸）
- 🪢 套索工具（自由绘制闭合区域进行填充/擦除，轨迹黑白双线高对比度）
- 🔀 一键根据点标注的轨迹生成笔刷多边形区域
- 🖼️ 本地图片上传（点击 + 拖拽）或远程图片
- 🎨 完整的点/笔刷样式自定义
- ⬅️ 撤销 / 重做（Command 模式）
- 📤 多格式导出：JSON / COCO / YOLO / Mask (dataURL / Blob / File)
- 📱 支持自定义工具栏（隐藏内置工具栏，调用 ref API 自行构建）
- 🔒 `enableBrush: false` 可完全禁用笔刷，仅保留点标注
- ⌨️ 丰富的键盘快捷键（`v` `p` `b` `e` `Ctrl+Z` `Ctrl+Y` `Delete` 等，需 `options.enableHotkeys: true`）
- 🔍 **`beforeCreatePoint` 前置判定回调**（创建点标注前介入，支持同步/异步，适用于数量限制、区域限制、用户二次确认等场景）
- 📦 **TypeScript 类型集中导出**（`import type { OptionsSource, PointAnnotationItem, ImageSource, PointStyle, BrushStyle, ... } from '@zzalai/leafer-point-annotation'`）

---

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [Props 配置](#props-配置)
  - [imageSource](#imagesource)
  - [options](#options)
  - [beforeCreatePoint（创建点前回调）](#beforecreatepoint创建点前回调)
  - [currentLayer（v-model:currentLayer）](#currentlayerv-modelcurrentlayer)
- [Events 事件](#events-事件)
- [TypeScript 类型导入](#typescript-类型导入)
- [Ref API（父组件调用）](#ref-api父组件调用)
  - [点标注](#点标注)
  - [图片 & 画布](#图片-画布)
  - [工具切换](#工具切换)
  - [删除 & 清空](#删除-清空)
  - [笔刷图层](#笔刷图层)
  - [笔刷样式](#笔刷样式)
  - [点轨迹生成笔刷区域](#点轨迹生成笔刷区域)
  - [缩放](#缩放)
  - [撤销 / 重做](#撤销-重做)
  - [导入 / 导出](#导入-导出)
- [使用示例](#使用示例)
  - [最小示例](#最小示例)
  - [完整自定义（隐藏内置工具栏）](#完整自定义隐藏内置工具栏)
  - [多图层笔刷](#多图层笔刷)
  - [后端上传 Mask（Blob/File）](#后端上传-mask-blobfile)
  - [只启用点标注（禁用笔刷）](#只启用点标注禁用笔刷)
  - [套索工具（自由绘制闭合区域）](#套索工具自由绘制闭合区域)
  - [点标注前回调（beforeCreatePoint）](#点标注前回调beforecreatepoint)
- [快捷键](#快捷键)
- [开发与构建](#开发与构建)
- [许可证](#许可证)

---

## 安装

### npm

```bash
npm install @zzalai/leafer-point-annotation
```

### yarn

```bash
yarn add @zzalai/leafer-point-annotation
```

### pnpm

```bash
pnpm add @zzalai/leafer-point-annotation
```

> ⚠️ 注意：`vue@^3.3.0` 为 peer dependency（不会被自动安装，需宿主项目已存在）。

---

## 快速开始

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    v-model:image-source="imageSource"
    :options="options"
    @point-change="handlePointChange"
    @load-success="handleLoadSuccess"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'

// 👇 必须手动导入样式
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

// 方式一：远程图片
const imageSource = computed(() => ({
  url: 'https://example.com/sample.jpg'
}))

// 方式二：不传 imageSource（初始为 null），用户本地上传后自动绑定
// const imageSource = ref<ImageSource | null>(null)

const options = {
  enableBrush: true,
  pointStyle: {
    circleFill: '#ff4d4f',
    circleStroke: '#ffffff'
  },
  brushStyle: {
    color: '#1890ff',
    opacity: 0.55,
    size: 100,
    eraserSize: 150  // 橡皮擦大小（可选，未设置时与笔刷大小一致）
  }
}

function handlePointChange(points: any[]) {
  console.log('点标注变化：', points)
}

function handleLoadSuccess(info: any) {
  console.log('图片加载成功：', info)
}
</script>
```

---

## Props 配置

### imageSource

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | 图片地址（远程 URL、dataURL 或 blob URL） |
| `id` | `string` | 可选，业务标识 |
| `width` | `number` | 图片宽度（加载成功后填充） |
| `height` | `number` | 图片高度（加载成功后填充） |
| `isLocal` | `boolean` | 是否为本地图片（本地选择时为 true） |
| `file` | `File` | 当前图片文件对象（经过旋转/翻转后为变换后的新文件，可直接用于后端 multipart 上传） |
| `metaFile` | `File` | 原始未变换的图片文件（始终指向最初上传的原图，不受旋转/翻转影响） |

> **单一数据源**：图片加载完全依赖 `props.imageSource`。不传 `imageSource` 时，组件显示大面积上传区域，支持**点击选择文件**和**拖拽文件**两种本地加载方式。
> 
> **v-model 支持**：组件支持 `v-model:imageSource` 双向绑定，内部选择图片后自动更新父组件数据。

### options

完整的 `OptionsSource`：

```ts
interface OptionsSource {
  // ============ 功能开关 ============
  enableBrush?: boolean                     // 是否启用笔刷（默认 true）；
                                            // false 时笔刷按钮/面板不渲染，
                                            // brushTool/eraserTool/mask 导出等方法失效
  enableHotkeys?: boolean                   // 是否启用键盘快捷键（默认 false）；
                                            // true 时才绑定 v/p/b/e/Ctrl+Z 等快捷键
  brushCursorEnabled?: boolean             // 是否显示笔刷/橡皮擦的自定义跟随光标（默认 true）；
                                            // 切换到 brush/eraser 工具时光标显示为笔刷形状（颜色、大小、透明度实时同步）
  lassoFixedSizeOnZoom?: boolean           // 套索轨迹是否保持固定大小（不随画布缩放而变粗，默认 true）；
                                            // 黑色主线 + 白色描边，高对比度适应各种背景
  loadingGradientColors?: [string, string]  // 加载中渐变动画的两个颜色（默认：淡紫 '#e8e0ff' -> 淡蓝 '#d8e8ff'）
  loadingTextColor?: string                // 加载中文字颜色（默认：'#4a5568'，蓝灰色，明显且不违和）

  // ============ UI 开关 ============
  showToolbar?: boolean                     // 是否显示内置工具栏（默认 true）
  showZoomController?: boolean              // 是否显示内置缩放控制器（默认 true）
  canvasBackground?: string                 // 画布背景色（默认 '#f6f6f6'）

  // ============ 缩放 ============
  zoomMin?: number                          // 最小缩放比例（默认 0.2）
  zoomMax?: number                          // 最大缩放比例（默认 4）

  // ============ 点标注 ============
  pointStyle?: Partial<PointStyle>          // 点标注样式（覆盖默认）
  maxPoints?: number                        // 最大点数（可选）

  // ============ 笔刷 ============
  brushStyle?: Partial<BrushStyle>          // 笔刷样式（覆盖默认）
  brushLayers?: BrushLayerConfig[]          // 笔刷图层配置（不传则单图层 "default"）
  maxBrushLayers?: number                   // 最大图层数（可选）

  // ============ 历史 ============
  maxUndoSteps?: number                     // 最大撤销步数（默认 100）

  // ============ Mask 导出 ============
  maskExportFormat?: 'png' | 'jpeg' | 'jpg' // Mask 默认导出格式（默认 png）
  maskExportForeground?: 'black' | 'white'  // Mask 默认前景色（默认 black）
}
```

#### PointStyle（点标注样式）

```ts
interface PointStyle {
  circleRadius: number
  circleFill: string
  circleStroke: string
  circleStrokeWidth: number

  // hover
  hoverCircleFill: string
  hoverCircleStroke: string

  // selected
  selectedCircleFill: string
  selectedCircleStroke: string
  selectedCircleScale: number

  // 文字
  circleTextFontSize: number
  circleTextFontFamily: string
  circleTextFill: string

  // label
  labelBackgroundColor: string
  labelTextColor: string
  labelFontSize: number
  labelPadding: number | number[]

  // 固定大小
  fixedSizeOnZoom?: boolean                 // 开启则点不随画布缩放变大
  fixedSizeScale?: number                   // 固定大小系数
}
```

默认值参考 [`src/types/index.ts`](src/types/index.ts)。

#### BrushStyle（笔刷样式）

```ts
interface BrushStyle {
  color: string                             // 笔刷颜色（十六进制）
  opacity: number                           // 透明度 0~1（通过 Group.opacity 控制）
  size: number                              // 笔刷大小（像素）
  eraserSize?: number                       // 橡皮擦大小（像素），未设置时使用 size
  minSize: number                           // 滑块最小
  maxSize: number                           // 滑块最大
  continuity: number                        // 两点间最大距离阈值（超过则断开）
}
```

> **橡皮擦独立尺寸**：`eraserSize` 用于独立配置橡皮擦尺寸，与笔刷尺寸分离。未设置时默认与 `size` 相同。笔刷配置面板中分别提供「笔刷大小」和「橡皮擦大小」两个滑块。
>
> **橡皮擦光标样式**：采用白色 2px 外圈 + 黑色 1px 内圈的双环设计（类似 Photoshop），无论浅色还是深色背景都清晰可见，无需额外配置。

#### BrushLayerConfig（多图层配置）

```ts
interface BrushLayerConfig {
  label: string                             // 图层显示名
  value: string                             // 图层唯一标识
  color?: string                            // 该图层默认颜色
  opacity?: number                          // 该图层默认透明度
  size?: number                             // 该图层默认笔刷大小
}
```

不传 `brushLayers` 时默认为单图层 `{label:'默认图层', value:'default'}`。

### beforeCreatePoint（创建点前回调）

在**每次点标注被创建前**调用，父组件可通过返回值**允许/阻止**该点被创建，支持同步返回与异步返回（例如弹确认框等待用户选择）。

```ts
type BeforeCreatePoint = (
  x: number,                   // 点击位置的像素 x（图片坐标系）
  y: number,                   // 点击位置的像素 y（图片坐标系）
  normalizedX: number,         // 归一化 x（0 ~ 1）
  normalizedY: number,         // 归一化 y（0 ~ 1）
  existingPointCount: number   // 当前已有多少个点（即 this.pointAnnotations.length）
) => boolean | Promise<boolean>
```

**返回值规则**：
- `true` → 允许创建
- `false` → 阻止创建
- `Promise<true> / Promise<false>` → 异步等待后决定是否创建（如弹 `window.confirm`）

**生效路径**：用户画布点击 / 父组件通过 ref 调用 `createPointAnnotation()` 两种路径都会经过相同的前置判定。

**典型用法**：

```ts
// 1) 限制最多 20 个点
function beforeCreatePoint(x: number, y: number, nx: number, ny: number, count: number) {
  return count < 20
}

// 2) 只允许在图片右半部分（x > 宽度的 50%）
function beforeCreatePoint(x: number, y: number, nx: number, ny: number) {
  return nx > 0.5
}

// 3) 异步：弹确认框（实际业务可替换为 UI 组件的确认弹窗）
async function beforeCreatePoint(x: number, y: number) {
  return window.confirm(`在坐标 (${Math.round(x)}, ${Math.round(y)}) 创建点？`)
}

// 4) 组合使用：数量限制 + 区域限制
async function beforeCreatePoint(x: number, y: number, nx: number, ny: number, count: number) {
  if (count >= 5) { console.warn('最多 5 个点'); return false }
  if (nx < 0.5) { console.warn('只允许在右半部分标注'); return false }
  return window.confirm('确认创建？')
}
```

```vue
<PointAnnotation
  :image-source="imageSource"
  :before-create-point="beforeCreatePoint"
/>
```

### currentLayer（v-model:currentLayer）

受控图层切换。例如：

```vue
<PointAnnotation
  :options="{ brushLayers: [
    { label: '前景', value: 'foreground' },
    { label: '遮挡', value: 'occlusion' }
  ]}"
  v-model:current-layer="activeLayer"
/>
```

---

## Events 事件

| 事件 | 参数 | 触发时机 |
|------|------|---------|
| `point-change` | `(points: PointAnnotation[])` | 点新增 / 删除 / 修改 / 重排 |
| `load-start` | - | 开始加载图片 |
| `load-success` | `{ url, width, height, isLocal, file?, metaFile? }` | 图片加载成功（`file` 为当前文件，`metaFile` 为原始文件；旋转/翻转后 `file` 为变换后的新文件，`metaFile` 保持原始不变） |
| `load-error` | `{ error }` | 图片加载失败 |
| `undo-state-change` | `{ canUndo }` | 撤销栈状态变化 |
| `redo-state-change` | `{ canRedo }` | 重做栈状态变化 |
| `update:currentLayer` | `layerValue` | 当前笔刷图层变化（配合 v-model） |
| `layer-change` | `layerValue` | 同 update:currentLayer |
| `update:imageSource` | `ImageSource` | 组件内部选择图片后触发（配合 v-model:imageSource） |
| `point-hover` | `(pointData, isHovering: boolean)` | 点 hover 状态变化：鼠标移入/移出某点时触发 |
| `point-select` | `(pointData, isSelected: boolean)` | 点选中状态变化：点击选中/取消选中某点时触发 |

---

## TypeScript 类型导入

所有对外类型与默认常量都从包根导出，可直接从 `@zzalai/leafer-point-annotation` 导入：

```ts
import PointAnnotation from '@zzalai/leafer-point-annotation'

// 👇 类型（import type，仅作类型提示用，不参与打包）
import type {
  PointAnnotationItem,   // 点标注数据结构（注意：命名为 PointAnnotationItem，
                         // 避免与 Vue 组件 PointAnnotation 命名冲突）
  OptionsSource,         // :options 的类型
  ImageSource,           // :image-source 的类型
  PointStyle,            // 点标注样式配置
  BrushStyle,            // 笔刷样式配置
  BrushLayerConfig,      // 多图层配置项
  BrushStrokeData,       // 笔刷笔画数据
  ToolType,              // 'select' | 'point' | 'brush' | 'eraser' | 'lasso'
  ExportFormat,          // 导出格式
  ExportOptions,         // 导出选项
  ImportOptions,         // 导入选项
  Statistics,            // 统计信息
  ExportData,            // 完整导出数据结构
} from '@zzalai/leafer-point-annotation'

// 👇 默认常量（value import，运行时可用）
import {
  DEFAULT_POINT_STYLE,   // 默认点标注样式
  DEFAULT_BRUSH_STYLE,   // 默认笔刷样式
} from '@zzalai/leafer-point-annotation'

// 必须手动导入样式
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'
```

**组件实例类型**：
```ts
const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)
```

**父组件 Props 类型示例**：
```ts
import type { OptionsSource, ImageSource } from '@zzalai/leafer-point-annotation'

const imageSource = ref<ImageSource>({ url: 'https://example.com/image.jpg' })

const options = ref<Partial<OptionsSource>>({
  enableBrush: true,
  enableHotkeys: false,
  pointStyle: { circleFill: '#ff4d4f' },
  brushLayers: [
    { label: '前景', value: 'foreground', color: '#1890ff', opacity: 0.55 },
    { label: '遮挡', value: 'occlusion', color: '#faad14', opacity: 0.55 },
  ],
})
```

---

## Ref API（父组件调用）

通过 `ref` 访问组件实例后可调用以下方法。

```ts
const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

// 示例：
annotationRef.value?.pointTool()                 // 切到点标注工具
annotationRef.value?.createBrushFromPoints()     // 按点轨迹生成笔刷区域
annotationRef.value?.getMaskBlob()                // 导出当前图层 Blob（上传后端）
```

### 点标注

| 方法 | 说明 |
|------|------|
| `getPointAnnotations(): PointAnnotation[]` | 获取当前所有点 |
| `createPointAnnotation(x: number, y: number, label?: string): Promise<string \| null>` | 程序化新增一个点（返回新点 id 或 null；若配置了 `beforeCreatePoint` 并返回 false 则返回 null） |
| `removePointAnnotation(id: string): boolean` | 程序化删除一个点 |
| `updatePointAnnotationLabel(id: string, label: string): boolean` | 修改某个点的 label |
| `setPointHoverState(pointId: string, isHover: boolean): boolean` | 编程式设置某个点的 hover 样式（仅修改视觉，不触发事件，不会形成双向循环） |
| `setPointSelectState(pointId: string, isSelected: boolean): boolean` | 编程式设置某个点的选中状态（通过 `app.editor.select` 更新 editor 内部选中集，与点元素样式和 `previousSelectedStates` 保持一致；`isExternalSelectSync` 标志防止双向循环触发 `point-select` 事件） |
| `findPointBySequenceNumber(seq: number): { id: string; data: any } \| null` | 按圆圈内显示的数字序号查找点，返回该点的 id 和完整数据（父组件跨实例联动时，按视觉序号匹配更可靠） |

### 图片 & 画布

| 方法 | 说明 |
|------|------|
| `getImageInfo()` | `{ url, width, height, isLocal, file?, metaFile? }`（`file` 为当前文件，`metaFile` 为原始未变换的文件） |
| `resetCanvas()` | 重置画布到无图片初始化状态（清除所有标注、笔刷、撤销栈） |
| `rotateImage()` | 顺时针旋转图片 90°（会清空所有标注和笔刷数据） |
| `flipImage(direction?)` | 翻转图片：`'h'` 水平翻转（默认），`'v'` 垂直翻转（会清空所有标注和笔刷数据） |

> **图片旋转/翻转说明**：旋转和翻转采用简化方案——执行时先清空所有已有标注和笔刷数据，再对图片像素进行 Canvas 2D 变换并重新加载。因此建议**先调整图片方向，再开始标注**。变换后 `file` 为变换后的新 `File` 对象，`metaFile` 始终指向原始文件。

> **图片加载说明**：图片加载完全通过 `props.imageSource` 控制，不再对外暴露 `loadImage()` 和 `openFileDialog()` 方法。组件内部选择图片后通过 `v-model:imageSource` 自动同步到父组件。

### 工具切换

| 方法 | 说明 |
|------|------|
| `getCurrentTool(): 'select' \| 'point' \| 'brush' \| 'eraser' \| 'lasso'` | - |
| `setTool(tool)` | 切换到指定工具（`enableBrush=false` 时 brush/eraser/lasso 被拦截） |
| `selectTool()` | 选择工具 |
| `pointTool()` | 点标注工具 |
| `brushTool(openPanel?: boolean)` | 笔刷工具 |
| `eraserTool()` | 橡皮擦工具 |
| `lassoTool()` | 套索工具 |

### 删除 & 清空

| 方法 | 说明 |
|------|------|
| `deleteSelected()` | 删除当前选中的点（带 `confirm`） |
| `clearAllAnnotations()` | 清除所有标注点（不动笔刷） |
| `clearAllAnnotationsAndBrush()` | 清空所有点 + 笔刷（带 `confirm`） |
| `clearBrush()` | 清空当前图层的笔刷 |
| `clearAllBrushLayers()` | 清空所有图层的笔刷 |

### 笔刷图层

| 方法 | 说明 |
|------|------|
| `getCurrentLayer(): string` | 当前激活图层 value |
| `setActiveLayer(value: string): boolean` | 切换到指定图层 |
| `getAllLayers(): BrushLayerConfig[]` | 所有图层配置 |

### 笔刷样式

| 方法 | 说明 |
|------|------|
| `getBrushStyle(): BrushStyle` | 返回当前样式的拷贝 |
| `updateBrushStyle(partial: Partial<BrushStyle>): void` | 动态更新（如颜色/透明度/大小） |

### 点轨迹生成笔刷区域

| 方法 | 说明 |
|------|------|
| `createBrushFromPoints(): boolean` | 按 `sequenceNumber` 顺序将点的像素坐标连成闭合多边形，使用当前笔刷样式填充；点数量 < 3 时不操作 |

### 缩放

| 方法 | 说明 |
|------|------|
| `zoomIn()` | 放大 |
| `zoomOut()` | 缩小 |
| `resetZoom()` | 重置到 100% |

### 撤销 / 重做

| 方法 | 说明 |
|------|------|
| `undo()` | 撤销上一步 |
| `redo()` | 重做上一步 |

### 导入 / 导出

| 方法 | 说明 |
|------|------|
| `exportCanvasJSON(): string` | 全量导出（点 + 笔刷快照 + 图片信息） |
| `importCanvasJSON(data: string \| object): boolean` | 从导出的 JSON 恢复 |
| `exportMaskImage(format?, fg?)`: `Promise<string \| null>` | 当前图层 mask（dataURL） |
| `exportMaskImageByLayer(layerValue, format?, fg?)`: `Promise<string \| null>` | 指定图层 mask |
| `exportAllMaskImages(format?, fg?)`: `Promise<Record<string, string>>` | 所有图层 mask |
| `getMaskBlob(layerValue?, format?, fg?)`: `Promise<Blob \| null>` | 当前/指定图层 Blob（后端上传） |
| `getMaskFile(layerValue?, filename?, format?, fg?)`: `Promise<File \| null>` | 当前/指定图层 File |
| `getAllMaskBlobs(format?, fg?)`: `Promise<Record<string, Blob>>` | 所有图层 Blob 集合 |
| `exportCOCO(): string` | 导出 COCO JSON（点标注 = keypoints） |
| `exportYOLO(): string` | 导出 YOLO 标注 |

> 参数说明：`format` = `'png' \| 'jpeg' \| 'jpg'`；`fg` = `'black' \| 'white'`（mask 前景色）。
> 注：所有 Mask/Blob/File 相关方法需在浏览器环境调用，且在 `enableBrush=false` 时返回 null/{}。

---

## 使用示例

### 最小示例

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    v-model:image-source="imageSource"
    :options="{ enableBrush: false }"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)
</script>
```

### 完整自定义（隐藏内置工具栏）

```vue
<template>
  <div class="my-toolbar">
    <button @click="() => annotationRef.value?.pointTool()">点标注</button>
    <button @click="() => annotationRef.value?.brushTool()">笔刷</button>
    <button @click="() => annotationRef.value?.eraserTool()">橡皮</button>
    <button @click="() => annotationRef.value?.deleteSelected()">删除</button>
    <button @click="() => annotationRef.value?.clearAllAnnotationsAndBrush()">全部清空</button>
    <button @click="() => annotationRef.value?.undo()">撤销</button>
    <button @click="() => annotationRef.value?.redo()">重做</button>
    <button @click="() => annotationRef.value?.createBrushFromPoints()">点→多边形</button>
    <button @click="uploadMask">上传 Mask</button>
  </div>

  <PointAnnotation
    ref="annotationRef"
    :image-source="{ url: 'https://example.com/image.jpg' }"
    :options="{ showToolbar: false, showZoomController: false }"
    @point-change="handlePoints"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

function handlePoints(points: any[]) {
  console.log('points:', points)
}

async function uploadMask() {
  const blob = await annotationRef.value?.getMaskBlob()
  if (!blob) return
  const fd = new FormData()
  fd.append('file', blob, 'mask.png')
  await fetch('/api/upload', { method: 'POST', body: fd })
}
</script>
```

### 多图层笔刷

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    :image-source="{ url: 'https://example.com/image.jpg' }"
    :options="{
      brushLayers: [
        { label: '前景', value: 'foreground', color: '#1890ff', opacity: 0.55 },
        { label: '遮挡', value: 'occlusion',  color: '#faad14', opacity: 0.55 },
        { label: '背景', value: 'background', color: '#52c41a', opacity: 0.55 }
      ]
    }"
    v-model:current-layer="activeLayer"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)
const activeLayer = ref('foreground')
</script>
```

### 后端上传 Mask（Blob/File）

```vue
<template>
  <PointAnnotation ref="annotationRef" :image-source="{ url: '...' }" />
  <button @click="uploadAllMasks">上传所有图层 Mask</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

async function uploadAllMasks() {
  const blobs = await annotationRef.value?.getAllMaskBlobs('png', 'black')
  if (!blobs) return
  for (const [layerValue, blob] of Object.entries(blobs)) {
    const fd = new FormData()
    fd.append('file', blob, `${layerValue}.png`)
    await fetch('/api/mask-upload', { method: 'POST', body: fd })
  }
}
</script>
```

### 只启用点标注（禁用笔刷）

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    :image-source="{ url: '...' }"
    :options="{ enableBrush: false }"
    @point-change="handlePoints"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)
function handlePoints(points: any[]) {
  console.log('标注：', points)
}
</script>
```

### 套索工具（自由绘制闭合区域）

套索工具用于自由绘制闭合区域并自动填充/擦除，与笔刷共享颜色、透明度和图层设置，支持撤销/重做。

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    :image-source="{ url: '...' }"
    :options="{
      enableBrush: true,
      lassoFixedSizeOnZoom: true,  // 套索轨迹保持固定屏幕大小（默认 true）
      brushStyle: {
        color: '#1890ff',
        opacity: 0.55,
        size: 100,
      }
    }"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PointAnnotation from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

// 程序化切换到套索工具
function useLasso() {
  annotationRef.value?.lassoTool()
}
</script>
```

> **套索轨迹样式**：采用黑色 1px 主线 + 白色 3px 描边的高对比度设计，无论浅色还是深色背景都清晰可见。
>
> **`lassoFixedSizeOnZoom`**：控制套索轨迹是否随画布缩放而变粗。默认 `true`（固定屏幕像素大小，类似标注点的 `fixedSizeOnZoom`），设为 `false` 则线宽随画布缩放变化。

### 图片旋转与翻转

通过 ref API 对图片进行顺时针 90° 旋转、水平翻转或垂直翻转。变换会清空所有已有标注和笔刷数据，建议在标注前调整好图片方向。

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    :image-source="imageSource"
    @load-success="handleLoadSuccess"
  />
  <div class="my-toolbar">
    <button @click="() => annotationRef.value?.rotateImage()">↻ 顺时针 90°</button>
    <button @click="() => annotationRef.value?.flipImage('h')">⇆ 水平翻转</button>
    <button @click="() => annotationRef.value?.flipImage('v')">⇅ 垂直翻转</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PointAnnotation from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

function handleLoadSuccess(info: any) {
  console.log('当前文件：', info.file)       // 变换后的新 File
  console.log('原始文件：', info.metaFile)   // 始终指向原始上传的文件
}
</script>
```

> **`file` vs `metaFile`**：
> - `file`：当前图片文件。每次旋转/翻转后会替换为变换后的新 `File` 对象
> - `metaFile`：原始未变换的图片文件。第一次变换时自动记录，后续变换保持不变
> - 无需旋转/翻转时，`metaFile` 不存在，`file` 即为原始文件

### 点标注前回调（beforeCreatePoint）

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    :image-source="{ url: '...' }"
    :before-create-point="beforeCreatePoint"
    @point-change="handlePoints"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PointAnnotation from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

// 示例：限制最多 5 个点 + 只允许在图片右半部分创建 + 创建前二次确认
async function beforeCreatePoint(
  x: number, y: number,
  nx: number, ny: number,
  count: number
) {
  if (count >= 5) {
    console.warn('最多 5 个点标注')
    return false
  }
  if (nx < 0.5) {
    console.warn('只允许在右半部分标注')
    return false
  }
  return window.confirm(`在 (${Math.round(x)}, ${Math.round(y)}) 创建第 ${count + 1} 个点？`)
}

function handlePoints(points: any[]) {
  console.log('点列表：', points)
}
</script>
```

### 多实例双向联动（A ↔ B 点 hover/选中同步）

当页面上有两个或多个 PointAnnotation 实例时，可通过 `point-hover` / `point-select` 事件 + `setPointHoverState` / `setPointSelectState` API 实现跨实例的点状态联动。推荐按 **sequenceNumber**（圆圈内显示的数字序号）匹配，因为它始终连续，不受删除/undo/redo 影响：

```vue
<template>
  <div style="display: flex; gap: 20px">
    <div style="flex: 1">
      <h3>实例 A</h3>
      <PointAnnotation
        ref="refA"
        :image-source="{ url: imageUrlA }"
        @point-hover="(p, h) => onPointHover('A', p, h)"
        @point-select="(p, s) => onPointSelect('A', p, s)"
      />
    </div>
    <div style="flex: 1">
      <h3>实例 B</h3>
      <PointAnnotation
        ref="refB"
        :image-source="{ url: imageUrlB }"
        @point-hover="(p, h) => onPointHover('B', p, h)"
        @point-select="(p, s) => onPointSelect('B', p, s)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PointAnnotation from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const refA = ref<InstanceType<typeof PointAnnotation> | null>(null)
const refB = ref<InstanceType<typeof PointAnnotation> | null>(null)
const imageUrlA = '/demo-a.jpg'
const imageUrlB = '/demo-b.jpg'

// 按 sequenceNumber（圆圈显示的数字序号）在目标实例中找到对应点
function syncBySeq(targetRef: any, sourcePoint: any, apply: (pointId: string) => void) {
  const target = targetRef.value?.findPointBySequenceNumber(sourcePoint.sequenceNumber);
  if (target) apply(target.id);
}

// hover 双向同步
function onPointHover(source: 'A' | 'B', pointData: any, isHover: boolean) {
  const targetRef = source === 'A' ? refB : refA;
  syncBySeq(targetRef, pointData, (targetId) => {
    targetRef.value?.setPointHoverState(targetId, isHover);
  });
}

// 选中状态双向同步
function onPointSelect(source: 'A' | 'B', pointData: any, isSelected: boolean) {
  const targetRef = source === 'A' ? refB : refA;
  syncBySeq(targetRef, pointData, (targetId) => {
    targetRef.value?.setPointSelectState(targetId, isSelected);
  });
}
</script>
```

> **匹配规则说明**：
> - 默认按 `sequenceNumber`（圆圈内显示的数字 1、2、3…）匹配，不受删除/undo/redo 影响
> - 如需按 `id` 或其他字段匹配，只需替换 `syncBySeq` 中的查找逻辑
> - `setPointHoverState` 是纯样式修改；`setPointSelectState` 通过 `app.editor.select` 同步 editor 内部选中集，二者均通过 `isExternalSelectSync` 标志避免双向循环

### 删除联动最佳实践（推荐方案）

不建议基于 `point-change` 事件做删除匹配（`sequenceNumber` 在删除后会重排，容易删错），推荐以下方案：

```vue
<template>
  <div>
    <!-- 双实例均隐藏工具栏 + 禁用组件内部快捷键 -->
    <PointAnnotation
      ref="refA"
      :image-source="{ url: imageUrlA }"
      :options="{ showToolbar: false, enableHotkeys: false }"
      @point-hover="(p, h) => onPointHover('A', p, h)"
      @point-select="(p, s) => onPointSelect('A', p, s)"
    />
    <PointAnnotation
      ref="refB"
      :image-source="{ url: imageUrlB }"
      :options="{ showToolbar: false, enableHotkeys: false }"
      @point-hover="(p, h) => onPointHover('B', p, h)"
      @point-select="(p, s) => onPointSelect('B', p, s)"
    />
    <!-- 父组件统一删除按钮 -->
    <button @click="deleteSelectedBoth">🗑 删除选中</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import PointAnnotation from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const refA = ref<InstanceType<typeof PointAnnotation> | null>(null)
const refB = ref<InstanceType<typeof PointAnnotation> | null>(null)

// hover 双向同步
function onPointHover(source: 'A' | 'B', pointData: any, isHover: boolean) {
  const targetRef = source === 'A' ? refB : refA
  const target = targetRef.value?.findPointBySequenceNumber(pointData.sequenceNumber)
  if (target) targetRef.value?.setPointHoverState(target.id, isHover)
}

// 选中状态双向同步
function onPointSelect(source: 'A' | 'B', pointData: any, isSelected: boolean) {
  const targetRef = source === 'A' ? refB : refA
  const target = targetRef.value?.findPointBySequenceNumber(pointData.sequenceNumber)
  if (target) targetRef.value?.setPointSelectState(target.id, isSelected)
}

// 统一删除：两端选中状态已经联动同步，分别调用 deleteSelected() 即可
const deleteSelectedBoth = () => {
  refA.value?.deleteSelected()
  refB.value?.deleteSelected()
}

// 双实例模式下：父组件监听 Delete 键，统一触发删除
const onAppKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
  if (e.code === 'Delete' || e.key === 'Delete') {
    e.preventDefault()
    deleteSelectedBoth()
  }
}

onMounted(() => { window.addEventListener('keydown', onAppKeyDown) })
onUnmounted(() => { window.removeEventListener('keydown', onAppKeyDown) })
</script>
```

> **为什么推荐此方案**：
> - hover/selected 状态通过 `point-hover` / `point-select` 事件双向同步，保证两端选中的点始终一致
> - 删除操作由父组件统一执行，直接调用两个实例的 `deleteSelected()`，不依赖 `sequenceNumber` 或 `id` 匹配
> - 不受删除后重排的影响，更可靠、更简单
> - `showToolbar: false` 隐藏内置工具栏，`enableHotkeys: false` 禁用组件内部快捷键，避免 Delete 键触发两次删除

---

## 快捷键

> 生效条件：**`options.enableHotkeys: true`** + (**画布获得焦点** 或 **鼠标 hover 在画布上**)
>
> `enableHotkeys` 默认 `false`，需显式传 `true` 才会绑定快捷键。

| 按键 | 功能 | 限制 |
|------|------|------|
| `v` | 选择工具 | 需 `enableHotkeys=true` |
| `p` | 点标注工具 | 需 `enableHotkeys=true` |
| `b` | 笔刷工具 | 需 `enableHotkeys=true` + `enableBrush=true` |
| `e` | 橡皮擦工具 | 需 `enableHotkeys=true` + `enableBrush=true` |
| `l` | 套索工具 | 需 `enableHotkeys=true` + `enableBrush=true` |
| `Ctrl + Z` | 撤销 | 需 `enableHotkeys=true` |
| `Ctrl + Y` | 重做 | 需 `enableHotkeys=true` |
| `Delete` | 删除选中的点 | 需 `enableHotkeys=true` |
| `Ctrl + +` | 放大 | 需 `enableHotkeys=true` |
| `Ctrl + -` | 缩小 | 需 `enableHotkeys=true` |
| `Ctrl + 0` | 重置缩放 | 需 `enableHotkeys=true` |
| `Alt` | 显示/隐藏快捷键提示浮层 | 需 `enableHotkeys=true` |

---

## 开发与构建

```bash
# 安装依赖
pnpm install

# 本地开发（App.vue 为演示入口）
pnpm dev

# 构建库产物（dist/）
pnpm build

# 构建演示站点（docs/）
pnpm docs:build

# 同时构建库 + 演示站
pnpm build:all

# 类型检查
pnpm tsc --noEmit
```

### 项目结构

```
src/
├── components/
│   ├── PointAnnotation.vue        # 核心主组件（所有能力整合）
│   ├── BrushSizeSlider.vue        # 笔刷大小滑块
│   └── BrushStylePanel.vue        # 笔刷样式面板
├── elements/
│   └── PointAnnotationElement.ts  # 自定义点元素（Group + Ellipse + Text）
├── utils/
│   ├── CanvasBrush.ts             # 笔刷底层（canvas + 绘制快照）
│   ├── LassoOverlay.ts            # 套索工具（自由绘制闭合区域，黑白双线高对比度）
│   ├── ImageTransformer.ts        # 图片变换工具（旋转 90°、水平/垂直翻转，Canvas 2D 实现）
│   ├── BrushCommands.ts           # 笔刷撤销命令
│   ├── PointCommands.ts           # 点撤销命令
│   ├── BrushStroke.ts             # 笔画数据
│   ├── COCOExporter.ts            # COCO 导出
│   └── YOLOExporter.ts            # YOLO 导出
├── types/
│   └── index.ts                   # 所有对外类型与默认值
├── App.vue                        # dev 演示页
├── index.ts                       # 对外导出
└── main.ts                        # dev 入口
```

### 发布流程

1. `pnpm install` → `pnpm build:all`
2. 确认 `dist/` 与 `docs/` 最新
3. 更新 `package.json` 的 `version`
4. `npm publish`
5. `git push` 到 GitHub（触发 Pages 重新部署）

---

## 许可证

MIT © zzalai
