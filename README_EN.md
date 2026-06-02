# @zzalai/leafer-point-annotation

English | [中文](README.md)

A point annotation and brush painting tool based on Vue3 + LeaferJS, supporting COCO/YOLO/JSON export, designed for AI model training dataset annotation.

## Features

- 📍 **Point Annotation** - Add editable points on images
- 🖌️ **Brush Painting** - Freehand painting with eraser support
- 🎨 **Custom Styles** - Configurable brush color, size, and opacity
- 🔄 **Undo/Redo** - Complete history management
- 📤 **Multi-format Export** - JSON/COCO/YOLO/Mask Image
- 🔍 **Canvas Zoom** - Zoom, pan, reset support
- ⌨️ **Hotkeys** - V/P/B/E/Ctrl+Z/Ctrl+Y and more
- 📱 **Responsive Design** - Vue3 component architecture
- 🖼️ **Local Upload** - Support local image upload and drag-and-drop

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

## Quick Start

### Using Remote Image

```vue
<template>
  <div class="demo-container">
    <PointAnnotation
      ref="annotationRef"
      :imageSource="imageSource"
      :options="options"
      @pointChange="handlePointChange"
      @loadSuccess="handleLoadSuccess"
    />
    <div class="controls">
      <button @click="exportJSON">Export JSON</button>
      <button @click="exportMask">Export Mask</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)
const imageSource = computed(() => ({
  id: 'demo-image',
  url: 'https://example.com/image.jpg'
}))

const options = ref({
  pointStyle: {
    circleFill: '#ff4d4f',
    circleStroke: '#ffffff',
    labelBackgroundColor: '#ffffff'
  },
  brushStyle: {
    color: '#ff4d4f',
    opacity: 0.55,
    size: 100
  },
  maskExportFormat: 'png',
  maskExportForeground: 'black'
})

const handlePointChange = (points) => {
  console.log('Points changed:', points)
}

const handleLoadSuccess = () => {
  console.log('Image loaded successfully')
}

const exportJSON = () => {
  const json = annotationRef.value?.exportCanvasJSON()
  if (json) {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'annotation.json'
    a.click()
  }
}

const exportMask = async () => {
  const mask = await annotationRef.value?.exportMaskImage('png', 'black')
  if (mask) {
    const a = document.createElement('a')
    a.href = mask
    a.download = 'mask.png'
    a.click()
  }
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 600px;
}

.controls {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
</style>
```

### Using Local Image Upload

When not providing the `imageSource` prop, the local upload interface will be displayed, supporting click to select or drag and drop.

```vue
<template>
  <div class="demo-container">
    <PointAnnotation
      ref="annotationRef"
      :options="options"
      @pointChange="handlePointChange"
      @loadSuccess="handleLoadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'
import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'

const annotationRef = ref<InstanceType<typeof PointAnnotation> | null>(null)

const options = ref({
  pointStyle: {
    circleFill: '#ff4d4f',
    circleStroke: '#ffffff',
    labelBackgroundColor: '#ffffff'
  },
  brushStyle: {
    color: '#ff4d4f',
    opacity: 0.55,
    size: 100
  }
})

const handlePointChange = (points) => {
  console.log('Points changed:', points)
}

const handleLoadSuccess = () => {
  console.log('Image loaded successfully')
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 600px;
}
</style>
```

## API Documentation

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| imageSource | `{ id?: string; url: string }` | `null` | Image source configuration (optional, shows upload UI when not provided) |
| options | `Object` | `{}` | Configuration options |

#### Options Configuration

```typescript
interface Options {
  pointStyle?: Partial<PointStyle>
  brushStyle?: Partial<BrushStyle>
  maskExportFormat?: 'png' | 'jpg' | 'jpeg'
  maskExportForeground?: 'black' | 'white'
  maxUndoSteps?: number
}
```

#### PointStyle Configuration

```typescript
interface PointStyle {
  circleRadius: number
  circleFill: string
  circleStroke: string
  circleStrokeWidth: number
  hoverCircleFill: string
  hoverCircleStroke: string
  selectedCircleFill: string
  selectedCircleStroke: string
  selectedCircleScale: number
  labelBackgroundColor: string
  labelTextColor: string
  labelFontSize: number
  labelPadding: number[]
  fixedSizeOnZoom: boolean
  fixedSizeScale: number
}
```

#### BrushStyle Configuration

```typescript
interface BrushStyle {
  color: string
  opacity: number
  size: number
  minSize: number
  maxSize: number
  continuity: number
}
```

### Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| pointChange | `PointAnnotation[]` | Triggered when point annotations change |
| loadStart | - | Triggered when image starts loading |
| loadSuccess | - | Triggered when image loads successfully |
| loadError | `error` | Triggered when image loading fails |
| undoStateChange | - | Triggered when undo state changes |
| redoStateChange | - | Triggered when redo state changes |

### Methods

The component exposes the following methods:

| Method Name | Parameters | Return Value | Description |
|-------------|------------|--------------|-------------|
| getPointAnnotations | - | `PointAnnotation[]` | Get all point annotation data |
| getImageInfo | - | `Object` | Get image information |
| exportCanvasJSON | - | `string` | Export complete JSON data |
| exportMaskImage | `format?`, `fgColor?` | `Promise<string|null>` | Export mask image |
| exportCOCO | - | `string` | Export COCO format JSON |
| exportYOLO | - | `{ annotations: string; classNames: string }` | Export YOLO format |
| importCanvasJSON | `jsonString`, `options?` | `Promise<boolean>` | Import JSON data |
| loadImage | `url?` | `Promise<void>` | Load image |
| clearBrush | - | `void` | Clear brush content |
| zoomIn | - | `void` | Zoom in canvas |
| zoomOut | - | `void` | Zoom out canvas |
| resetZoom | - | `void` | Reset zoom |
| undo | - | `void` | Undo operation |
| redo | - | `void` | Redo operation |
| getCurrentTool | - | `'select'\|'point'\|'brush'\|'eraser'` | Get current tool |
| setTool | `tool` | `void` | Set current tool |
| createPointAnnotation | `x`, `y` | `string\|null` | Create point annotation |
| removePointAnnotation | `id` | `boolean` | Remove specific point annotation |

## Hotkeys

| Hotkey | Function |
|--------|----------|
| V | Select tool |
| P | Point annotation tool |
| B | Brush tool |
| E | Eraser tool |
| Ctrl + Z | Undo |
| Ctrl + Y | Redo |
| Delete | Delete selected / Clear all |
| Ctrl + + | Zoom in |
| Ctrl + - | Zoom out |
| Ctrl + 0 | Reset zoom |
| Alt | Show/Hide hotkey hints |

## Export Formats

### JSON Full

Includes complete annotation data and brush mask.

```json
{
  "version": "1.0",
  "imageUrl": "https://example.com/image.jpg",
  "imageWidth": 1280,
  "imageHeight": 720,
  "pointAnnotations": [
    {
      "id": "point_xxx",
      "pixel": { "x": 100, "y": 200 },
      "normalized": { "x": 0.078, "y": 0.278 },
      "label": "#1",
      "createdAt": 1716960000000,
      "updatedAt": 1716960000000
    }
  ],
  "brushMask": "data:image/png;base64,...",
  "exportTime": 1716960000000
}
```

### COCO

For keypoint detection tasks.

### YOLO

For YOLO series model training.

### Mask Image

PNG/JPG format binary image, foreground in black/white, background transparent/white.

## Project Documentation

- [Requirements](./project-docs/REQUIREMENTS.md) - Detailed functional requirements
- [Architecture](./project-docs/ARCHITECTURE.md) - System architecture design
- [Implementation Plan](./project-docs/IMPLEMENTATION_PLAN.md) - Development task planning
- [Development Guide](./project-docs/leafer-development-guide/LEAFER_DEVELOPMENT_GUIDE.md) - LeaferJS development practical guide

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- Vue 3.3.0+
- LeaferUI 2.0.8+
- Tinykeys 3.0.0+
- @zzalai/leafer-undo-redo 1.0.3+

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

## Related Projects

- [@zzalai/leafer-multi-roi](https://github.com/otaku1951/leafer-multi-roi) - Multi-region ROI annotation tool
- [@zzalai/leafer-undo-redo](https://github.com/otaku1951/leafer-undo-redo) - LeaferJS undo/redo plugin
