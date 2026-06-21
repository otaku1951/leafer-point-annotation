# @zzalai/leafer-point-annotation

English | [中文](README.md)

> A point annotation and brush painting tool based on **Vue 3 + LeaferJS**, supporting COCO/YOLO/JSON/Mask export, designed for AI model training dataset annotation.

- 📍 **Point Annotation** - Draggable, editable points with auto-renumbering and hover/selected states
- 🖌️ **Multi-layer Brush Painting** - Painting and erasing with adjustable color, opacity, size, and continuity
- 🔀 **Brush Polygon from Points** - One-click generation of brush polygon area from point annotation trajectory
- 🖼️ **Local Image Upload** - Click to select or drag-and-drop local images, or use remote image URLs
- 🎨 **Complete Style Customization** - Full point and brush style configuration
- ⬅️ **Undo / Redo** - Complete command-based history management
- 📤 **Multi-format Export** - JSON / COCO / YOLO / Mask (dataURL / Blob / File)
- 📱 **Custom Toolbar Support** - Hide built-in toolbar and build custom UI via ref API
- 🔒 **Brush Disabling** - Use `enableBrush: false` to disable all brush functionality for point-only annotation
- ⌨️ **Rich Keyboard Shortcuts** - `v`, `p`, `b`, `e`, `Ctrl+Z`, `Ctrl+Y`, `Delete`, and more (requires `options.enableHotkeys: true`)
- 🔍 **`beforeCreatePoint` Pre-create Callback** - Intervene before a point annotation is created, supporting sync and async returns for count limits, area restrictions, or user confirmation
- 📦 **Centralized TypeScript Type Exports** - `import type { OptionsSource, PointAnnotationItem, ImageSource, PointStyle, BrushStyle, ... } from '@zzalai/leafer-point-annotation'`

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Props Configuration](#props-configuration)
  - [imageSource](#imagesource)
  - [options](#options)
  - [beforeCreatePoint (Pre-create Callback)](#beforecreatepoint-pre-create-callback)
  - [currentLayer (v-model:currentLayer)](#currentlayer-v-modelcurrentlayer)
- [Events](#events)
- [TypeScript Type Imports](#typescript-type-imports)
- [Ref API (Parent Component Calls)](#ref-api-parent-component-calls)
  - [Point Annotation](#point-annotation)
  - [Image & Canvas](#image--canvas)
  - [Tool Switching](#tool-switching)
  - [Delete & Clear](#delete--clear)
  - [Brush Layers](#brush-layers)
  - [Brush Style](#brush-style)
  - [Point Trajectory to Brush Area](#point-trajectory-to-brush-area)
  - [Zoom](#zoom)
  - [Undo / Redo](#undo--redo)
  - [Import / Export](#import--export)
- [Usage Examples](#usage-examples)
  - [Minimal Example](#minimal-example)
  - [Full Customization (Hide Built-in Toolbar)](#full-customization-hide-built-in-toolbar)
  - [Multi-layer Brush](#multi-layer-brush)
  - [Backend Upload Mask (Blob/File)](#backend-upload-mask-blobfile)
  - [Point-Only Annotation (Disable Brush)](#point-only-annotation-disable-brush)
  - [Pre-create Callback (beforeCreatePoint)](#pre-create-callback-beforecreatepoint)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Development & Build](#development--build)
- [License](#license)

---

## Installation

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

> ⚠️ **Note**: `vue@^3.3.0` is a peer dependency (not automatically installed, must exist in the host project).

> ⚠️ **Important**: You must manually import the CSS:
> ```ts
> import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'
> ```

---

## Quick Start

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

// 👇 Must manually import styles
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

// Method 1: Remote image
const imageSource = computed(() => ({
  url: 'https://example.com/sample.jpg'
}))

// Method 2: Don't pass imageSource - user can upload locally
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
  console.log('Points changed:', points)
}

function handleLoadSuccess(info: any) {
  console.log('Image loaded successfully:', info)
}
</script>
```

---

## Props Configuration

### imageSource

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | Image URL (remote URL or dataURL) |
| `id` | `string` | Optional, business identifier |

> When `imageSource` is not provided, the component displays a large upload area supporting **click to select** and **drag-and-drop** file loading.

### options

Complete `OptionsSource` interface:

```ts
interface OptionsSource {
  // ============ Feature Toggles ============
  enableBrush?: boolean                     // Whether to enable brush (default: true);
                                            // When false, brush buttons/panel are not rendered,
                                            // and brushTool/eraserTool/mask export methods are disabled
  enableHotkeys?: boolean                   // Whether to enable keyboard shortcuts (default: false);
                                            // Shortcuts v/p/b/e/Ctrl+Z are only bound when true

  // ============ UI Toggles ============
  showToolbar?: boolean                     // Whether to show built-in toolbar (default: true)
  showZoomController?: boolean              // Whether to show built-in zoom controller (default: true)
  canvasBackground?: string                 // Canvas background color (default: '#f6f6f6')

  // ============ Zoom ============
  zoomMin?: number                          // Minimum zoom ratio (default: 0.2)
  zoomMax?: number                          // Maximum zoom ratio (default: 4)

  // ============ Point Annotation ============
  pointStyle?: Partial<PointStyle>          // Point annotation style (overrides defaults)
  maxPoints?: number                        // Maximum number of points (optional)

  // ============ Brush ============
  brushStyle?: Partial<BrushStyle>          // Brush style (overrides defaults)
  brushLayers?: BrushLayerConfig[]          // Brush layer configuration (defaults to single layer if not provided)
  maxBrushLayers?: number                   // Maximum number of layers (optional)

  // ============ History ============
  maxUndoSteps?: number                     // Maximum undo steps (default: 100)

  // ============ Mask Export ============
  maskExportFormat?: 'png' | 'jpeg' | 'jpg' // Default mask export format (default: png)
  maskExportForeground?: 'black' | 'white'  // Default mask foreground color (default: black)
}
```

#### PointStyle (Point Annotation Style)

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

  // text
  circleTextFontSize: number
  circleTextFontFamily: string
  circleTextFill: string

  // label
  labelBackgroundColor: string
  labelTextColor: string
  labelFontSize: number
  labelPadding: number | number[]

  // fixed size
  fixedSizeOnZoom?: boolean                 // When enabled, points don't grow with canvas zoom
  fixedSizeScale?: number                   // Fixed size scale factor
}
```

Refer to [`src/types/index.ts`](src/types/index.ts) for default values.

#### BrushStyle (Brush Style)

```ts
interface BrushStyle {
  color: string                             // Brush color (hex)
  opacity: number                           // Opacity 0~1 (controlled via Group.opacity)
  size: number                              // Brush size (pixels)
  minSize: number                           // Slider minimum
  maxSize: number                           // Slider maximum
  continuity: number                        // Maximum distance threshold for continuous strokes
}
```

#### BrushLayerConfig (Multi-layer Configuration)

```ts
interface BrushLayerConfig {
  label: string                             // Layer display name
  value: string                             // Layer unique identifier
  color?: string                            // Default color for this layer
  opacity?: number                          // Default opacity for this layer
  size?: number                             // Default brush size for this layer
}
```

When `brushLayers` is not provided, defaults to a single layer `{label:'Default Layer', value:'default'}`.

### beforeCreatePoint (Pre-create Callback)

Called **before each point annotation is created**. The parent component can allow/block creation via the return value, supporting both synchronous and asynchronous returns (e.g., waiting for user confirmation in a dialog).

```ts
type BeforeCreatePoint = (
  x: number,                   // pixel x (image coordinates)
  y: number,                   // pixel y (image coordinates)
  normalizedX: number,         // normalized x (0 ~ 1)
  normalizedY: number,         // normalized y (0 ~ 1)
  existingPointCount: number   // number of existing points before creation
) => boolean | Promise<boolean>
```

**Return value rules**:
- `true` → allow creation
- `false` → block creation
- `Promise<true> / Promise<false>` → wait for async result (e.g., `window.confirm`)

**Effective path**: Both user canvas clicks and programmatic calls via `ref.createPointAnnotation()` go through the same pre-create check.

**Typical usage**:

```ts
// 1) Limit to max 20 points
function beforeCreatePoint(x: number, y: number, nx: number, ny: number, count: number) {
  return count < 20
}

// 2) Only allow on the right half of the image
function beforeCreatePoint(x: number, y: number, nx: number, ny: number) {
  return nx > 0.5
}

// 3) Async: show confirm dialog
async function beforeCreatePoint(x: number, y: number) {
  return window.confirm(`Create point at (${Math.round(x)}, ${Math.round(y)})?`)
}

// 4) Combined: count limit + area restriction + confirmation
async function beforeCreatePoint(x: number, y: number, nx: number, ny: number, count: number) {
  if (count >= 5) { console.warn('Max 5 points'); return false }
  if (nx < 0.5) { console.warn('Right half only'); return false }
  return window.confirm('Create point?')
}
```

```vue
<PointAnnotation
  :image-source="imageSource"
  :before-create-point="beforeCreatePoint"
/>
```

### currentLayer (v-model:currentLayer)

Controlled layer switching. For example:

```vue
<PointAnnotation
  :options="{ brushLayers: [
    { label: 'Foreground', value: 'foreground' },
    { label: 'Occlusion', value: 'occlusion' }
  ]}"
  v-model:current-layer="activeLayer"
/>
```

---

## Events

| Event | Parameters | Triggered When |
|-------|-----------|----------------|
| `point-change` | `(points: PointAnnotation[])` | Point added / deleted / modified / renumbered |
| `load-start` | - | Image starts loading |
| `load-success` | `{ url, width, height }` | Image loads successfully |
| `load-error` | `{ error }` | Image loading fails |
| `undo-state-change` | `{ canUndo }` | Undo stack state changes |
| `redo-state-change` | `{ canRedo }` | Redo stack state changes |
| `update:currentLayer` | `layerValue` | Current brush layer changes (use with v-model) |
| `layer-change` | `layerValue` | Same as update:currentLayer |
| `point-hover` | `(pointData, isHovering: boolean)` | Point hover state change: triggered when mouse enters/leaves a point |
| `point-select` | `(pointData, isSelected: boolean)` | Point selection state change: triggered when a point is clicked to select/deselect |

---

## TypeScript Type Imports

All public types and default constants are exported from the package root. Import directly from `@zzalai/leafer-point-annotation`:

```ts
import PointAnnotation from '@zzalai/leafer-point-annotation'

// 👇 Types (import type — type hints only, not bundled)
import type {
  PointAnnotationItem,   // Point annotation data structure (named PointAnnotationItem
                         // to avoid naming conflict with the Vue component)
  OptionsSource,         // Type of :options prop
  ImageSource,           // Type of :image-source prop
  PointStyle,            // Point annotation style config
  BrushStyle,            // Brush style config
  BrushLayerConfig,      // Multi-layer config item
  BrushStrokeData,       // Brush stroke data
  ToolType,              // 'select' | 'point' | 'brush' | 'eraser'
  ExportFormat,          // Export format
  ExportOptions,         // Export options
  ImportOptions,         // Import options
  Statistics,            // Statistics info
  ExportData,            // Full export data structure
} from '@zzalai/leafer-point-annotation'

// 👇 Default constants (value imports, available at runtime)
import {
  DEFAULT_POINT_STYLE,   // Default point annotation style
  DEFAULT_BRUSH_STYLE,   // Default brush style
} from '@zzalai/leafer-point-annotation'

// Must manually import styles
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'
```

**Component instance type**:
```ts
const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)
```

**Parent component Props type example**:
```ts
import type { OptionsSource, ImageSource } from '@zzalai/leafer-point-annotation'

const imageSource = ref<ImageSource>({ url: 'https://example.com/image.jpg' })

const options = ref<Partial<OptionsSource>>({
  enableBrush: true,
  enableHotkeys: false,
  pointStyle: { circleFill: '#ff4d4f' },
  brushLayers: [
    { label: 'Foreground', value: 'foreground', color: '#1890ff', opacity: 0.55 },
    { label: 'Occlusion',  value: 'occlusion',  color: '#faad14', opacity: 0.55 },
  ],
})
```

---

## Ref API (Parent Component Calls)

After accessing the component instance via `ref`, you can call the following methods.

```ts
const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

// Example:
annotationRef.value?.pointTool()                    // Switch to point annotation tool
annotationRef.value?.createBrushFromPoints()        // Generate brush area from point trajectory
annotationRef.value?.getMaskBlob()                  // Export current layer as Blob (for backend upload)
```

### Point Annotation

| Method | Description |
|--------|-------------|
| `getPointAnnotations(): PointAnnotation[]` | Get all current points |
| `createPointAnnotation(x: number, y: number, label?: string): Promise<string \| null>` | Programmatically add a point (returns the new point id or null; returns null when `beforeCreatePoint` returns false) |
| `removePointAnnotation(id: string): boolean` | Programmatically delete a point |
| `updatePointAnnotationLabel(id: string, label: string): boolean` | Modify a point's label text |
| `setPointHoverState(pointId: string, isHover: boolean): boolean` | Programmatically set hover style for a specific point (visual only; no event triggered; no loop) |
| `setPointSelectState(pointId: string, isSelected: boolean): boolean` | Programmatically set the selection state for a specific point (updates editor's internal selection set via `app.editor.select`, keeps it consistent with point element style and `previousSelectedStates`; the `isExternalSelectSync` flag prevents bidirectional loop triggering of `point-select` events) |
| `findPointBySequenceNumber(seq: number): { id: string; data: any } \| null` | Find a point by the number shown inside its circle (returns the point's id and full data; more reliable than id-based matching for cross-instance sync) |

### Image & Canvas

| Method | Description |
|--------|-------------|
| `getImageInfo()` | `{ url, width, height }` |
| `loadImage(url?: string)` | Dynamically load a new image (reads from `imageSource` prop if no argument provided). Switching images **automatically clears** previous point annotations, brush strokes, and resets the undo/redo stack |
| `openFileDialog()` | Opens the browser's local file picker. After selection, the component internally calls `loadImage(dataURL)` (parent component does NOT need to handle FileReader) |

### Tool Switching

| Method | Description |
|--------|-------------|
| `getCurrentTool(): 'select' \| 'point' \| 'brush' \| 'eraser'` | - |
| `setTool(tool)` | Switch to specified tool (brush/eraser blocked when `enableBrush=false`) |
| `selectTool()` | Select tool |
| `pointTool()` | Point annotation tool |
| `brushTool(openPanel?: boolean)` | Brush tool |
| `eraserTool()` | Eraser tool |

### Delete & Clear

| Method | Description |
|--------|-------------|
| `deleteSelected()` | Delete currently selected point (with confirm dialog) |
| `clearAllAnnotations()` | Clear all annotation points (leaves brush untouched) |
| `clearAllAnnotationsAndBrush()` | Clear all points + brush (with confirm dialog) |
| `clearBrush()` | Clear current layer's brush |
| `clearAllBrushLayers()` | Clear all layers' brush |

### Brush Layers

| Method | Description |
|--------|-------------|
| `getCurrentLayer(): string` | Current active layer value |
| `setActiveLayer(value: string): boolean` | Switch to specified layer |
| `getAllLayers(): BrushLayerConfig[]` | All layer configurations |

### Brush Style

| Method | Description |
|--------|-------------|
| `getBrushStyle(): BrushStyle` | Returns copy of current style |
| `updateBrushStyle(partial: Partial<BrushStyle>): void` | Dynamically update (e.g., color/opacity/size) |

### Point Trajectory to Brush Area

| Method | Description |
|--------|-------------|
| `createBrushFromPoints(): boolean` | Connects pixel coordinates of points in `sequenceNumber` order to form closed polygon, fills with current brush style; no action when point count < 3 |

### Zoom

| Method | Description |
|--------|-------------|
| `zoomIn()` | Zoom in |
| `zoomOut()` | Zoom out |
| `resetZoom()` | Reset to 100% |

### Undo / Redo

| Method | Description |
|--------|-------------|
| `undo()` | Undo last action |
| `redo()` | Redo last action |

### Import / Export

| Method | Description |
|--------|-------------|
| `exportCanvasJSON(): string` | Full export (points + brush snapshot + image info) |
| `importCanvasJSON(data: string \| object): boolean` | Restore canvas from exported JSON |
| `exportMaskImage(format?, fg?)`: `Promise<string \| null>` | Current layer mask (dataURL) |
| `exportMaskImageByLayer(layerValue, format?, fg?)`: `Promise<string \| null>` | Specified layer mask |
| `exportAllMaskImages(format?, fg?)`: `Promise<Record<string, string>>` | All layer masks |
| `getMaskBlob(layerValue?, format?, fg?)`: `Promise<Blob \| null>` | Current/specified layer Blob (for backend upload) |
| `getMaskFile(layerValue?, filename?, format?, fg?)`: `Promise<File \| null>` | Current/specified layer File |
| `getAllMaskBlobs(format?, fg?)`: `Promise<Record<string, Blob>>` | All layer Blob collection |
| `exportCOCO(): string` | Export COCO JSON (points = keypoints) |
| `exportYOLO(): string` | Export YOLO annotations |

> Parameter notes: `format` = `'png' \| 'jpeg' \| 'jpg'`; `fg` = `'black' \| 'white'` (mask foreground color).
> Note: All Mask/Blob/File related methods require browser environment, and return null/{} when `enableBrush=false`.

---

## Usage Examples

### Minimal Example

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

### Full Customization (Hide Built-in Toolbar)

```vue
<template>
  <div class="my-toolbar">
    <button @click="() => annotationRef.value?.pointTool()">Point</button>
    <button @click="() => annotationRef.value?.brushTool()">Brush</button>
    <button @click="() => annotationRef.value?.eraserTool()">Eraser</button>
    <button @click="() => annotationRef.value?.deleteSelected()">Delete</button>
    <button @click="() => annotationRef.value?.clearAllAnnotationsAndBrush()">Clear All</button>
    <button @click="() => annotationRef.value?.undo()">Undo</button>
    <button @click="() => annotationRef.value?.redo()">Redo</button>
    <button @click="() => annotationRef.value?.createBrushFromPoints()">Points→Polygon</button>
    <button @click="uploadMask">Upload Mask</button>
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

### Multi-layer Brush

```vue
<template>
  <PointAnnotation
    ref="annotationRef"
    :image-source="{ url: 'https://example.com/image.jpg' }"
    :options="{
      brushLayers: [
        { label: 'Foreground', value: 'foreground', color: '#1890ff', opacity: 0.55 },
        { label: 'Occlusion',  value: 'occlusion',  color: '#faad14', opacity: 0.55 },
        { label: 'Background', value: 'background', color: '#52c41a', opacity: 0.55 }
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

### Backend Upload Mask (Blob/File)

```vue
<template>
  <PointAnnotation ref="annotationRef" :image-source="{ url: '...' }" />
  <button @click="uploadAllMasks">Upload All Layer Masks</button>
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

### Point-Only Annotation (Disable Brush)

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
  console.log('Points:', points)
}
</script>
```

### Pre-create Callback (beforeCreatePoint)

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

// Example: max 5 points + allow only on right half + confirmation before creation
async function beforeCreatePoint(
  x: number, y: number,
  nx: number, ny: number,
  count: number
) {
  if (count >= 5) {
    console.warn('Max 5 points')
    return false
  }
  if (nx < 0.5) {
    console.warn('Only right half is allowed')
    return false
  }
  return window.confirm(`Create point ${count + 1} at (${Math.round(x)}, ${Math.round(y)})?`)
}

function handlePoints(points: any[]) {
  console.log('Point list:', points)
}
</script>
```

### Multi-Instance Bidirectional Linkage (A ↔ B Point Hover/Select Sync)

When a page has two or more PointAnnotation instances, you can sync point hover/selection states across instances via the `point-hover` / `point-select` events + `setPointHoverState` / `setPointSelectState` APIs. We recommend matching by **sequenceNumber** (the number shown inside each point's circle) because it stays continuous regardless of deletions/undo/redo:

```vue
<template>
  <div style="display: flex; gap: 20px">
    <div style="flex: 1">
      <h3>Instance A</h3>
      <PointAnnotation
        ref="refA"
        :image-source="{ url: imageUrlA }"
        @point-hover="(p, h) => onPointHover('A', p, h)"
        @point-select="(p, s) => onPointSelect('A', p, s)"
      />
    </div>
    <div style="flex: 1">
      <h3>Instance B</h3>
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

function syncBySeq(targetRef: any, sourcePoint: any, apply: (pointId: string) => void) {
  const target = targetRef.value?.findPointBySequenceNumber(sourcePoint.sequenceNumber);
  if (target) apply(target.id);
}

function onPointHover(source: 'A' | 'B', pointData: any, isHover: boolean) {
  const targetRef = source === 'A' ? refB : refA;
  syncBySeq(targetRef, pointData, (targetId) => {
    targetRef.value?.setPointHoverState(targetId, isHover);
  });
}

function onPointSelect(source: 'A' | 'B', pointData: any, isSelected: boolean) {
  const targetRef = source === 'A' ? refB : refA;
  syncBySeq(targetRef, pointData, (targetId) => {
    targetRef.value?.setPointSelectState(targetId, isSelected);
  });
}
</script>
```

> **Matching rules**:
> - Default matching uses `sequenceNumber` (the visible number 1, 2, 3... inside each point's circle), unaffected by deletions/undo/redo
> - To match by `id` or other fields, replace the lookup logic in `syncBySeq`
> - `setPointHoverState` is visual-only; `setPointSelectState` syncs the editor's internal selection set via `app.editor.select`; both use the `isExternalSelectSync` flag to avoid bidirectional loops

### Deletion Linkage Best Practice (Recommended)

It's not recommended to implement deletion linkage via `point-change` events (`sequenceNumber` gets renumbered after deletion, which can lead to incorrect deletions). Instead, use the following approach:

```vue
<template>
  <div>
    <!-- Hide toolbars for both instances and disable component hotkeys -->
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
    <!-- Parent component unified delete button -->
    <button @click="deleteSelectedBoth">🗑 Delete Selected</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import PointAnnotation from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const refA = ref<InstanceType<typeof PointAnnotation> | null>(null)
const refB = ref<InstanceType<typeof PointAnnotation> | null>(null)

// Bidirectional hover sync
function onPointHover(source: 'A' | 'B', pointData: any, isHover: boolean) {
  const targetRef = source === 'A' ? refB : refA
  const target = targetRef.value?.findPointBySequenceNumber(pointData.sequenceNumber)
  if (target) targetRef.value?.setPointHoverState(target.id, isHover)
}

// Bidirectional selection sync
function onPointSelect(source: 'A' | 'B', pointData: any, isSelected: boolean) {
  const targetRef = source === 'A' ? refB : refA
  const target = targetRef.value?.findPointBySequenceNumber(pointData.sequenceNumber)
  if (target) targetRef.value?.setPointSelectState(target.id, isSelected)
}

// Unified deletion: since hover/selected states are already synced,
// just call deleteSelected() on both instances
const deleteSelectedBoth = () => {
  refA.value?.deleteSelected()
  refB.value?.deleteSelected()
}

// In multi-instance mode: parent listens for Delete key to trigger unified deletion
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

> **Why this approach is recommended**:
> - Hover/selected states are bidirectionally synced via `point-hover` / `point-select` events, ensuring the same points are selected on both sides
> - Deletion is handled by the parent component, directly calling `deleteSelected()` on both instances — no reliance on `sequenceNumber` or `id` matching
> - Unaffected by post-deletion renumbering, making it more reliable and simpler
> - `showToolbar: false` hides built-in toolbars, `enableHotkeys: false` disables component internal shortcuts, preventing the Delete key from triggering deletion twice

---

## Keyboard Shortcuts

> Effective when: **`options.enableHotkeys: true`** + (**Canvas has focus** OR **mouse hovers over canvas**)
>
> `enableHotkeys` defaults to `false`. You must explicitly pass `true` to bind keyboard shortcuts.

| Key | Function | Restriction |
|-----|----------|-------------|
| `v` | Select tool | Requires `enableHotkeys=true` |
| `p` | Point annotation tool | Requires `enableHotkeys=true` |
| `b` | Brush tool | Requires `enableHotkeys=true` + `enableBrush=true` |
| `e` | Eraser tool | Requires `enableHotkeys=true` + `enableBrush=true` |
| `Ctrl + Z` | Undo | Requires `enableHotkeys=true` |
| `Ctrl + Y` | Redo | Requires `enableHotkeys=true` |
| `Delete` | Delete selected point | Requires `enableHotkeys=true` |
| `Ctrl + +` | Zoom in | Requires `enableHotkeys=true` |
| `Ctrl + -` | Zoom out | Requires `enableHotkeys=true` |
| `Ctrl + 0` | Reset zoom | Requires `enableHotkeys=true` |
| `Alt` | Show/Hide shortcut hint overlay | Requires `enableHotkeys=true` |

---

## Development & Build

```bash
# Install dependencies
pnpm install

# Local development (App.vue as demo entry)
pnpm dev

# Build library output (dist/)
pnpm build

# Build demo site (docs/)
pnpm docs:build

# Build library + demo site simultaneously
pnpm build:all

# Type check
pnpm tsc --noEmit
```

### Project Structure

```
src/
├── components/
│   ├── PointAnnotation.vue        # Core main component (integrates all capabilities)
│   ├── BrushSizeSlider.vue        # Brush size slider
│   └── BrushStylePanel.vue        # Brush style configuration panel
├── elements/
│   └── PointAnnotationElement.ts  # Custom point element (Group + Ellipse + Text)
├── utils/
│   ├── CanvasBrush.ts             # Brush core (canvas + drawing snapshot)
│   ├── BrushCommands.ts           # Brush undo commands
│   ├── PointCommands.ts           # Point undo commands
│   ├── BrushStroke.ts             # Brush stroke data
│   ├── COCOExporter.ts            # COCO export
│   └── YOLOExporter.ts            # YOLO export
├── types/
│   └── index.ts                   # All public types and default values
├── App.vue                        # Dev demo page
├── index.ts                       # Public export
└── main.ts                        # Dev entry
```

### Release Process

1. `pnpm install` → `pnpm build:all`
2. Confirm `dist/` and `docs/` are up to date
3. Update `version` in `package.json`
4. `npm publish`
5. `git push` to GitHub (triggers Pages redeployment)

---

## License

MIT © zzalai
