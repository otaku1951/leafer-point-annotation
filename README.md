# @zzalai/leafer-point-annotation

[English](README_EN.md) | 中文

基于 Vue3 + LeaferJS 的点标注与笔刷涂抹工具，支持导出 COCO/YOLO/JSON 格式，专为 AI 模型训练数据集标注设计。

## 功能特点

- 📍 **点标注** - 在图片上添加可编辑的标注点
- 🖌️ **笔刷涂抹** - 自由涂抹，支持擦除
- 🎨 **自定义样式** - 笔刷颜色、大小、透明度可配置
- 🔄 **撤销/重做** - 完整的历史记录管理
- 📤 **多格式导出** - JSON/COCO/YOLO/二值图
- 🔍 **画布缩放** - 支持缩放、平移、重置
- ⌨️ **热键支持** - V/P/B/E/Ctrl+Z/Ctrl+Y 等
- 📱 **响应式设计** - Vue3 组件化架构
- 🖼️ **本地上传** - 支持本地图片上传和拖拽上传

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

## 快速开始

### 基础使用

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
      <button @click="exportJSON">导出 JSON</button>
      <button @click="exportMask">导出 Mask</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PointAnnotation } from '@zzalai/leafer-point-annotation'

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
  console.log('标注点变化:', points)
}

const handleLoadSuccess = () => {
  console.log('图片加载成功')
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

## API 文档

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| imageSource | `{ id?: string; url: string }` | `null` | 图片源配置（可选，不提供时显示本地上传入口） |
| options | `Object` | `{}` | 配置选项 |

#### Options 配置

```typescript
interface Options {
  pointStyle?: Partial<PointStyle>
  brushStyle?: Partial<BrushStyle>
  maskExportFormat?: 'png' | 'jpg' | 'jpeg'
  maskExportForeground?: 'black' | 'white'
  maxUndoSteps?: number
}
```

#### PointStyle 配置

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

#### BrushStyle 配置

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

| 事件名 | 参数 | 说明 |
|--------|------|------|
| pointChange | `PointAnnotation[]` | 点标注数据变化时触发 |
| loadStart | - | 图片开始加载时触发 |
| loadSuccess | - | 图片加载成功时触发 |
| loadError | `error` | 图片加载失败时触发 |
| undoStateChange | - | 撤销状态变化时触发 |
| redoStateChange | - | 重做状态变化时触发 |

### Methods

组件暴露以下方法：

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| getPointAnnotations | - | `PointAnnotation[]` | 获取所有点标注数据 |
| getImageInfo | - | `Object` | 获取图片信息 |
| exportCanvasJSON | - | `string` | 导出完整 JSON 数据 |
| exportMaskImage | `format?`, `fgColor?` | `Promise<string|null>` | 导出二值图 |
| exportCOCO | - | `string` | 导出 COCO 格式 JSON |
| exportYOLO | - | `{ annotations: string; classNames: string }` | 导出 YOLO 格式 |
| importCanvasJSON | `jsonString`, `options?` | `Promise<boolean>` | 导入 JSON 数据 |
| loadImage | `url?` | `Promise<void>` | 加载图片 |
| clearBrush | - | `void` | 清除笔刷内容 |
| zoomIn | - | `void` | 放大画布 |
| zoomOut | - | `void` | 缩小画布 |
| resetZoom | - | `void` | 重置缩放 |
| undo | - | `void` | 撤销操作 |
| redo | - | `void` | 重做操作 |
| getCurrentTool | - | `'select'\|'point'\|'brush'\|'eraser'` | 获取当前工具 |
| setTool | `tool` | `void` | 设置当前工具 |
| createPointAnnotation | `x`, `y` | `string\|null` | 创建标注点 |
| removePointAnnotation | `id` | `boolean` | 删除指定标注点 |

## 热键说明

| 热键 | 功能 |
|------|------|
| V | 选择工具 |
| P | 点标注工具 |
| B | 笔刷工具 |
| E | 擦除工具 |
| Ctrl + Z | 撤销 |
| Ctrl + Y | 重做 |
| Delete | 删除选中/清除所有 |
| Ctrl + + | 放大 |
| Ctrl + - | 缩小 |
| Ctrl + 0 | 重置缩放 |
| Alt | 显示/隐藏热键提示 |

## 导出格式

### JSON Full

包含完整的标注数据和笔刷 mask。

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

适用于关键点检测任务。

### YOLO

适用于 YOLO 系列模型训练。

### Mask Image

PNG/JPG 格式的二值图，前景为黑色/白色，背景透明/白色。

## 项目文档

- [需求文档](./project-docs/REQUIREMENTS.md) - 详细的功能需求说明
- [架构文档](./project-docs/ARCHITECTURE.md) - 系统架构设计
- [实现计划](./project-docs/IMPLEMENTATION_PLAN.md) - 开发任务规划
- [开发指南](./project-docs/leafer-development-guide/LEAFER_DEVELOPMENT_GUIDE.md) - LeaferJS 开发实战指南

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 依赖

- Vue 3.3.0+
- LeaferUI 2.0.8+
- Tinykeys 3.0.0+
- @zzalai/leafer-undo-redo 1.0.3+

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关项目

- [@zzalai/leafer-multi-roi](https://github.com/otaku1951/leafer-multi-roi) - 多区域 ROI 标注工具
- [@zzalai/leafer-undo-redo](https://github.com/otaku1951/leafer-undo-redo) - LeaferJS 撤销/重做插件
