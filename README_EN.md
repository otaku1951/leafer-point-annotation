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

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Props Configuration](#props-configuration)
  - [imageSource](#imagesource)
  - [options](#options)
  - [currentLayer (v-model:currentLayer)](#currentlayer-v-modelcurrentlayer)
- [Events](#events)
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
| `createPointAnnotation(x: number, y: number, label?: string): boolean` | Programmatically add a point |
| `removePointAnnotation(id: string): boolean` | Programmatically delete a point |
| `updatePointAnnotationLabel(id: string, label: string): boolean` | Modify a point's label text |

### Image & Canvas

| Method | Description |
|--------|-------------|
| `getImageInfo()` | `{ url, width, height }` |
| `loadImage(url: string)` | Dynamically load a new image |

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
