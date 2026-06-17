# @zzalai/leafer-point-annotation

[English](README_EN.md) | 中文

> 基于 **Vue 3 + LeaferJS** 的图像点标注与笔刷涂抹工具，支持导出 COCO/YOLO/JSON 格式，专为 AI 模型训练数据集标注设计。

- 📍 点标注（可拖拽、可编辑、自动重排、hover/selected 状态）
- 🖌️ 多图层笔刷涂抹与擦除（颜色、透明度、大小、连续性可调）
- 🔀 一键根据点标注的轨迹生成笔刷多边形区域
- 🖼️ 本地图片上传（点击 + 拖拽）或远程图片
- 🎨 完整的点/笔刷样式自定义
- ⬅️ 撤销 / 重做（Command 模式）
- 📤 多格式导出：JSON / COCO / YOLO / Mask (dataURL / Blob / File)
- 📱 支持自定义工具栏（隐藏内置工具栏，调用 ref API 自行构建）
- 🔒 `enableBrush: false` 可完全禁用笔刷，仅保留点标注
- ⌨️ 丰富的键盘快捷键（`v` `p` `b` `e` `Ctrl+Z` `Ctrl+Y` `Delete` 等，需 `options.enableHotkeys: true`）

---

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [Props 配置](#props-配置)
  - [imageSource](#imagesource)
  - [options](#options)
  - [currentLayer（v-model:currentLayer）](#currentlayerv-modelcurrentlayer)
- [Events 事件](#events-事件)
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
    :image-source="imageSource"
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

// 方式二：不传 imageSource，用户本地上传
// const imageSource = null

const options = {
  enableBrush: true,
  pointStyle: {
    circleFill: '#ff4d4f',
    circleStroke: '#ffffff'
  },
  brushStyle: {
    color: '#1890ff',
    opacity: 0.55,
    size: 100
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
| `url` | `string` | 图片地址（远程 URL 或 dataURL） |
| `id` | `string` | 可选，业务标识 |

> 不传 `imageSource` 时，组件显示大面积上传区域，支持**点击选择文件**和**拖拽文件**两种本地加载方式。

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
  minSize: number                           // 滑块最小
  maxSize: number                           // 滑块最大
  continuity: number                        // 两点间最大距离阈值（超过则断开）
}
```

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
| `load-success` | `{ url, width, height }` | 图片加载成功 |
| `load-error` | `{ error }` | 图片加载失败 |
| `undo-state-change` | `{ canUndo }` | 撤销栈状态变化 |
| `redo-state-change` | `{ canRedo }` | 重做栈状态变化 |
| `update:currentLayer` | `layerValue` | 当前笔刷图层变化（配合 v-model） |
| `layer-change` | `layerValue` | 同 update:currentLayer |

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
| `createPointAnnotation(x: number, y: number, label?: string): boolean` | 程序化新增一个点 |
| `removePointAnnotation(id: string): boolean` | 程序化删除一个点 |
| `updatePointAnnotationLabel(id: string, label: string): boolean` | 修改某个点的 label |

### 图片 & 画布

| 方法 | 说明 |
|------|------|
| `getImageInfo()` | `{ url, width, height }` |
| `loadImage(url?: string)` | 动态加载一张新图片（不传参数时从 `imageSource` 读取）。切换图片时会**自动清空**之前的点标注、笔刷涂抹、并重置 undo/redo 栈 |
| `openFileDialog()` | 弹出浏览器本地文件选择框，选图后内部自动调用 `loadImage(dataURL)`（父组件无需自行处理 FileReader） |

### 工具切换

| 方法 | 说明 |
|------|------|
| `getCurrentTool(): 'select' \| 'point' \| 'brush' \| 'eraser'` | - |
| `setTool(tool)` | 切换到指定工具（`enableBrush=false` 时 brush/eraser 被拦截） |
| `selectTool()` | 选择工具 |
| `pointTool()` | 点标注工具 |
| `brushTool(openPanel?: boolean)` | 笔刷工具 |
| `eraserTool()` | 橡皮擦工具 |

### 删除 & 清空

| 方法 | 说明 |
|------|------|
| `deleteSelected()` | 删除当前选中的点（带 `confirm`） |
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
    :image-source="{ url: 'https://example.com/image.jpg' }"
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
