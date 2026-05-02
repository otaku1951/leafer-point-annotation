# LeaferJS 开发指南 - 点标注与笔刷工具项目实战

## 目录

1. [LeaferJS 核心概念](#leaferjs-核心概念)
2. [项目架构设计](#项目架构设计)
3. [关键技术实现](#关键技术实现)
4. [性能优化技巧](#性能优化技巧)
5. [常见问题解决方案](#常见问题解决方案)

---

## LeaferJS 核心概念

### 1.1 LeaferUI 基础

LeaferUI 是一个高性能的 2D 图形渲染引擎，基于 Canvas 实现。项目使用 LeaferUI 2.0.8+ 版本。

#### 核心类

```typescript
import { App, Group, Ellipse, Text, Image, Canvas, PointerEvent, ZoomEvent } from 'leafer-ui'
```

| 类名 | 说明 |
|------|------|
| App | 应用实例，管理整个画布 |
| Group | 组容器，用于组织多个元素 |
| Ellipse | 椭圆/圆形元素 |
| Text | 文本元素 |
| Image | 图片元素 |
| Canvas | Canvas 元素，用于自定义绘制 |
| PointerEvent | 指针事件 |
| ZoomEvent | 缩放事件 |

#### 常用方法

```typescript
// 创建应用
const app = new App({
  view: container,  // DOM 容器
  width: 800,
  height: 600,
  fill: '#f5f5f5'
})

// 添加元素
const group = new Group()
app.tree.add(group)

// 元素操作
element.set({ x: 100, y: 100 })
element.destroy()

// 视口操作
app.tree.zoom(2)  // 缩放
app.tree.x = 100  // 平移
app.tree.y = 100
```

### 1.2 插件系统

项目使用多个 Leafer 插件：

```typescript
import '@leafer-in/editor'       // 编辑器插件
import '@leafer-in/resize'       // 缩放插件
import '@leafer-in/viewport'     // 视口插件
import '@leafer-in/view'         // 视图插件
import '@leafer-in/text-editor'  // 文本编辑插件
```

#### Editor 插件使用

```typescript
// 启用/禁用编辑器
app.editor.config.moveable = true
app.editor.config.resizeable = false
app.editor.config.multipleSelect = true

// 获取选中元素
const selected = app.editor.list

// 选中元素
app.editor.select(element)

// 取消选中
app.editor.cancel()
```

### 1.3 事件系统

LeaferUI 提供完整的事件系统：

```typescript
// 指针事件
app.on(PointerEvent.DOWN, handleDown)
app.on(PointerEvent.MOVE, handleMove)
app.on(PointerEvent.UP, handleUp)
app.on(PointerEvent.TAP, handleTap)

// 缩放事件
app.on(ZoomEvent.ZOOM, handleZoom)

// 编辑器事件
import { EditorEvent } from '@leafer-in/editor'
app.editor.on(EditorEvent.SELECT, handleSelect)
```

#### 坐标转换

```typescript
// 获取相对于内容层的坐标
const point = contentLayer.getBoxPoint({ x: event.x, y: event.y })
```

---

## 项目架构设计

### 2.1 组件架构

```
PointAnnotation (主组件)
├── Canvas 容器与状态管理
├── 工具栏 UI
├── 笔刷配置面板
├── 缩放控制器
└── 核心业务逻辑
    ├── 工具切换
    ├── 事件处理
    ├── 命令管理
    ├── 数据导出
    └── 图片加载
```

### 2.2 图层设计

```
app.tree (根层)
├── contentLayer (内容层)
│   ├── imageBox (图片)
│   └── brushGroup (笔刷组)
│       └── canvasBrush (Canvas 元素)
└── pointLayer (点标注层)
    ├── point1 (点标注元素)
    ├── point2
    └── ...
```

#### 关键设计：使用 Group 控制透明度

```typescript
// CanvasBrush 类设计
class CanvasBrush {
  private group: Group
  private canvas: Canvas
  private ctx: CanvasRenderingContext2D

  constructor(width: number, height: number) {
    this.group = new Group()
    this.canvas = new Canvas({ width, height })
    this.group.add(this.canvas)
    
    // 在 Group 上设置透明度，避免 Canvas 上多次叠加
    this.group.opacity = 0.55
  }
}
```

### 2.3 元素封装

自定义元素需要继承 Group 并实现特定功能：

```typescript
import { Group, Ellipse, Text } from 'leafer-ui'

export class PointAnnotationElement extends Group {
  public circle: Ellipse
  public label: Text
  public _element_tag = 'point-annotation'
  public data: PointAnnotation

  constructor(data: PointAnnotation, style: PointStyle) {
    super()
    
    this.data = data
    this.id = data.id
    this.x = data.pixel.x
    this.y = data.pixel.y
    
    this.initCircle(style)
    this.initLabel(data.label, style)
  }
}
```

---

## 关键技术实现

### 3.1 笔刷绘制实现

#### 核心原理

使用 LeaferJS 的 Canvas 元素，通过原生 Canvas 2D API 绘制：

```typescript
class CanvasBrush {
  private canvas: Canvas
  private ctx: CanvasRenderingContext2D
  private lastPoint: { x: number; y: number } | null = null

  constructor(width: number, height: number) {
    this.canvas = new Canvas({ width, height })
    this.ctx = this.canvas.context as CanvasRenderingContext2D
  }

  // 绘制点
  drawPoint(x: number, y: number, size: number, color: string) {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    this.ctx.fill()
  }

  // 连线（保证连续性）
  drawLine(x1: number, y1: number, x2: number, y2: number, size: number, color: string) {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = size
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
  }

  // 绘制方法
  draw(x: number, y: number, size: number, color: string, continuity: number) {
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x
      const dy = y - this.lastPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > continuity) {
        // 距离超过阈值，连线
        this.drawLine(this.lastPoint.x, this.lastPoint.y, x, y, size, color)
      }
    }
    
    this.drawPoint(x, y, size, color)
    this.lastPoint = { x, y }
    
    // 触发重绘
    this.canvas.paint()
  }

  // 擦除方法
  erase(x: number, y: number, size: number, continuity: number) {
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x
      const dy = y - this.lastPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > continuity) {
        this.ctx.globalCompositeOperation = 'destination-out'
        this.drawLine(this.lastPoint.x, this.lastPoint.y, x, y, size, '#000000')
        this.ctx.globalCompositeOperation = 'source-over'
      }
    }
    
    this.ctx.globalCompositeOperation = 'destination-out'
    this.drawPoint(x, y, size, '#000000')
    this.ctx.globalCompositeOperation = 'source-over'
    this.lastPoint = { x, y }
    this.canvas.paint()
  }

  // 检测是否有内容
  hasContent(): boolean {
    if (this.canvas.width === 0 || this.canvas.height === 0) return false
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true
    }
    return false
  }

  // 获取图片数据
  getImageData(): string {
    return this.canvas.toDataURL('image/png')
  }

  // 恢复图片数据
  restoreImageData(imageData: string): Promise<void> {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0)
        this.canvas.paint()
        resolve()
      }
      img.src = imageData
    })
  }

  // 清除
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.canvas.paint()
    this.lastPoint = null
  }

  // 控制事件拦截
  setPointerEvents(value: boolean) {
    this.canvas.pointerEvents = value ? 'all' : 'none'
  }
}
```

### 3.2 撤销/重做系统

使用 `@zzalai/leafer-undo-redo` 插件，实现命令模式：

#### 命令接口

```typescript
interface ICommand {
  execute(): void
  undo(): void
  redo(): void
}
```

#### 点标注添加命令

```typescript
export class AddPointCommand implements ICommand {
  private container: Group
  private element: PointAnnotationElement
  private dataArray: PointAnnotation[]
  private pointData: PointAnnotation

  constructor(
    container: Group,
    element: PointAnnotationElement,
    dataArray: PointAnnotation[],
    pointData: PointAnnotation
  ) {
    this.container = container
    this.element = element
    this.dataArray = dataArray
    this.pointData = pointData
  }

  execute(): void {
    this.container.add(this.element)
    this.dataArray.push(this.pointData)
  }

  undo(): void {
    this.container.remove(this.element)
    const index = this.dataArray.findIndex(p => p.id === this.pointData.id)
    if (index > -1) {
      this.dataArray.splice(index, 1)
    }
  }

  redo(): void {
    this.execute()
  }
}
```

#### 点标注删除命令

```typescript
export class RemovePointCommand implements ICommand {
  private container: Group
  private element: PointAnnotationElement
  private dataArray: PointAnnotation[]
  private data: PointAnnotation
  private index: number

  constructor(container: Group, element: PointAnnotationElement, dataArray: PointAnnotation[]) {
    this.container = container
    this.element = element
    this.dataArray = dataArray
    this.data = element.data
    this.index = dataArray.findIndex(p => p.id === element.id)
  }

  execute(): void {
    this.container.remove(this.element)
    if (this.index > -1) {
      this.dataArray.splice(this.index, 1)
    }
  }

  undo(): void {
    this.container.add(this.element)
    if (this.index > -1) {
      this.dataArray.splice(this.index, 0, this.data)
    } else {
      this.dataArray.push(this.data)
    }
  }

  redo(): void {
    this.execute()
  }
}
```

#### 笔刷快照命令

```typescript
export class BrushSnapshotCommand implements ICommand {
  private brush: CanvasBrush
  private beforeImage: string
  private afterImage: string | null = null
  private isClear: boolean

  constructor(brush: CanvasBrush, beforeImage: string, isClear: boolean = false) {
    this.brush = brush
    this.beforeImage = beforeImage
    this.isClear = isClear
  }

  execute(): void {
    if (this.isClear) {
      // 用于清除操作，execute 保存当前状态，undo 恢复
      this.afterImage = this.brush.getImageData()
      this.brush.clear()
    } else {
      // 普通操作，execute 已在绘制时完成
      this.afterImage = this.brush.getImageData()
    }
  }

  undo(): void {
    this.brush.restoreImageData(this.beforeImage)
  }

  redo(): void {
    if (this.afterImage) {
      this.brush.restoreImageData(this.afterImage)
    }
  }
}
```

#### 命令管理器使用

```typescript
import { CommandManager } from '@zzalai/leafer-undo-redo'

// 初始化
const commandManager = new CommandManager(100)

// 执行命令
commandManager.executeCommand(new AddPointCommand(container, element, dataArray, data))

// 撤销
if (commandManager.canUndo()) {
  commandManager.undo()
}

// 重做
if (commandManager.canRedo()) {
  commandManager.redo()
}
```

### 3.3 导出功能实现

#### JSON 导出

```typescript
exportCanvasJSON(): string {
  const exportData = {
    version: '1.0',
    imageUrl: props.imageSource.url || '',
    imageWidth: imageWidth.value,
    imageHeight: imageHeight.value,
    pointAnnotations: [...pointAnnotations.value],
    brushMask: canvasBrush?.getImageData() || null,
    exportTime: Date.now()
  }
  return JSON.stringify(exportData, null, 2)
}
```

#### COCO 格式导出

```typescript
export function exportCOCOFormat(
  annotations: PointAnnotation[],
  imageUrl: string,
  imageWidth: number,
  imageHeight: number
): COCOExport {
  const cocoData: COCOExport = {
    info: {
      description: 'Point Annotation Export',
      version: '1.0',
      year: new Date().getFullYear(),
      date_created: new Date().toISOString().split('T')[0]
    },
    licenses: [],
    images: [
      {
        id: 1,
        file_name: imageUrl.split('/').pop() || 'image.jpg',
        width: imageWidth,
        height: imageHeight
      }
    ],
    annotations: annotations.map((anno, index) => {
      const radius = 12
      return {
        id: index + 1,
        image_id: 1,
        category_id: 1,
        keypoints: [anno.pixel.x, anno.pixel.y, 2],
        num_keypoints: 1,
        bbox: [anno.pixel.x - radius, anno.pixel.y - radius, radius * 2, radius * 2],
        area: Math.PI * radius * radius,
        iscrowd: 0
      }
    }),
    categories: [
      {
        id: 1,
        name: 'point',
        keypoints: ['point'],
        skeleton: []
      }
    ]
  }
  return cocoData
}
```

#### YOLO 格式导出

```typescript
export function exportYOLOFormat(
  annotations: PointAnnotation[],
  imageWidth: number,
  imageHeight: number
): YOLOExport {
  const lines = annotations.map((anno) => {
    const x = anno.normalized.x
    const y = anno.normalized.y
    const w = 24 / imageWidth
    const h = 24 / imageHeight
    return `0 ${x} ${y} ${w} ${h}`
  })
  return {
    annotations: lines.join('\n'),
    classNames: 'point'
  }
}
```

#### 二值图导出

```typescript
async function exportMaskImage(
  format: 'png' | 'jpg' | 'jpeg' = 'png',
  fgColor: 'black' | 'white' = 'black'
): Promise<string | null> {
  const maskData = canvasBrush?.getImageData()
  if (!maskData) return null

  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = imageWidth.value || 0
      canvas.height = imageHeight.value || 0
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.drawImage(img, 0, 0)

      const isWhite = fgColor === 'white'
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = isWhite ? 255 : 0
          data[i + 1] = isWhite ? 255 : 0
          data[i + 2] = isWhite ? 255 : 0
          data[i + 3] = 255
        } else if (format !== 'png') {
          data[i] = isWhite ? 0 : 255
          data[i + 1] = isWhite ? 0 : 255
          data[i + 2] = isWhite ? 0 : 255
          data[i + 3] = 255
        }
      }
      ctx.putImageData(imageData, 0, 0)

      if (format === 'png') {
        resolve(canvas.toDataURL('image/png'))
      } else {
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
    }

    img.onerror = () => {
      resolve(null)
    }

    img.src = maskData
  })
}
```

### 3.4 热键系统

使用 `tinykeys` 实现热键：

```typescript
import { tinykeys } from 'tinykeys'

const unsubscribe = tinykeys(window, {
  V: (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    selectTool()
  },
  P: (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    pointTool()
  },
  B: (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    brushTool()
  },
  E: (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    eraserTool()
  },
  '$mod+KeyZ': (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    e.stopPropagation()
    undo()
  },
  '$mod+KeyY': (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    e.stopPropagation()
    redo()
  },
  Delete: (e) => {
    if (!isCanvasFocused && !isMouseOverCanvas) return
    e.preventDefault()
    e.stopPropagation()
    deleteSelected()
  }
})

onUnmounted(() => {
  unsubscribe()
})
```

---

## 性能优化技巧

### 4.1 渲染优化

1. **使用 Group 组织元素**
   - 减少重绘区域
   - 批量处理子元素

2. **合理使用 zIndex**
   - 减少不必要的层级处理
   - 固定层顺序

3. **使用 set() 批量更新**
   ```typescript
   element.set({ x: 100, y: 100, width: 200 })
   ```

### 4.2 事件处理优化

1. **条件监听**
   - 仅在需要时监听事件
   - CanvasBrush 使用 pointerEvents 控制

2. **避免高频操作**
   - 笔刷绘制使用 requestAnimationFrame 优化
   - 避免在事件处理中执行复杂计算

### 4.3 内存管理

1. **及时销毁元素**
   ```typescript
   element.destroy()
   ```

2. **限制历史记录**
   ```typescript
   const commandManager = new CommandManager(100)
   ```

3. **重用 Canvas**
   - 避免频繁创建新 Canvas 元素

---

## 常见问题解决方案

### 5.1 笔刷叠加透明度问题

**问题**：笔刷涂抹同一位置多次，透明度叠加导致颜色变深。

**解决方案**：使用 Group 控制整体透明度，而不是在 Canvas 上设置透明度。

```typescript
const group = new Group()
const canvas = new Canvas()
group.add(canvas)
group.opacity = 0.55  // 在 Group 上设置透明度
```

### 5.2 标签编辑权限控制

**问题**：任何工具都能编辑标签，容易误操作。

**解决方案**：根据当前工具动态控制标签可编辑性。

```typescript
function updateLabelEditable(editable: boolean) {
  if (pointLayer && pointLayer.children) {
    pointLayer.children.forEach((element: any) => {
      if (element._element_tag === 'point-annotation' && element.label) {
        element.label.editable = editable
      }
    })
  }
}
```

### 5.3 Editor 状态冲突

**问题**：笔刷模式下 Editor 仍在工作，导致冲突。

**解决方案**：动态配置 Editor 状态。

```typescript
function brushTool() {
  currentTool.value = 'brush'
  app.editor.config.moveable = false
  app.editor.config.resizeable = false
  app.editor.config.multipleSelect = false
  canvasBrush.setPointerEvents(true)
  updateLabelEditable(false)
}
```

### 5.4 坐标转换问题

**问题**：不同层的坐标需要正确转换。

**解决方案**：使用 `getBoxPoint()` 方法。

```typescript
const point = contentLayer.getBoxPoint({ x: event.x, y: event.y })
```

### 5.5 导出时图片加载问题

**问题**：异步图片加载导致导出不完整。

**解决方案**：使用 Promise 等待图片加载完成。

```typescript
restoreImageData(imageData: string): Promise<void> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0)
      this.canvas.paint()
      resolve()
    }
    img.src = imageData
  })
}
```

### 5.6 点标注大小不随缩放变化

**问题**：缩放画布时，点标注也跟着缩放，影响视觉效果。

**解决方案**：监听缩放事件，动态调整点标注大小。

```typescript
const changePointScaleRelativeCanvas = (pointLayer: Group) => {
  if (!pointStyle.fixedSizeOnZoom) return
  
  if (pointLayer && pointLayer.children) {
    const scale = 1 / (app?.tree.scaleX || 1)
    const finalScale = scale * (pointStyle.fixedSizeScale || 1)
    pointLayer.children.forEach((element) => {
      element.scale = finalScale
    })
  }
}

app.on(ZoomEvent.ZOOM, () => {
  updateZoomLevel()
  changePointScaleRelativeCanvas(pointLayer)
})
```

---

**文档版本**：1.0
**最后更新**：2024-05-01
