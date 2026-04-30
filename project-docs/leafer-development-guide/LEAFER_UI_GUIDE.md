# leafer-ui 核心功能详解

## 1. 库的概述

**leafer-ui** 是一个高性能的 Canvas 渲染库，专为创建交互式图形应用而设计。它提供了丰富的图形元素、事件系统和状态管理功能，支持复杂的 Canvas 操作和编辑功能。

## 2. 核心功能

### 2.1 高性能渲染
- **GPU 加速**：利用 WebGL 进行硬件加速渲染
- **优化的绘制流程**：减少不必要的重绘
- **批量渲染**：合并绘制操作提高性能

### 2.2 丰富的图形元素
- **基础图形**：`Rect`、`Ellipse`、`Path` 等
- **容器元素**：`Group`、`Layer`、`Artboard` 等
- **媒体元素**：`Image`、`Text` 等
- **自定义元素**：支持创建自定义图形元素

### 2.3 事件系统
- **指针事件**：`pointerdown`、`pointermove`、`pointerup` 等
- **拖拽事件**：`dragstart`、`drag`、`dragend` 等
- **缩放事件**：`zoom`、`zoomstart`、`zoomend` 等
- **自定义事件**：支持创建和触发自定义事件

### 2.4 状态管理
- **响应式状态**：通过 `@leafer-in/state` 提供
- **状态同步**：自动同步元素状态和 UI
- **批量更新**：优化状态更新性能

### 2.5 文本编辑
- **可编辑文本**：通过 `@leafer-in/text-editor` 提供
- **富文本支持**：支持不同样式的文本
- **文本布局**：灵活的文本布局选项

## 3. 核心 API

### 3.1 App 类

```typescript
import { App } from 'leafer-ui';

const app = new App({
  view: document.getElementById('canvas'),
  width: 800,
  height: 600,
  backgroundColor: '#f5f5f5'
});

// 添加元素
app.add(element);

// 移除元素
app.remove(element);

// 清空
app.clear();

// 销毁
app.destroy();
```

### 3.2 基础图形元素

#### Rect
```typescript
import { Rect } from 'leafer-ui';

const rect = new Rect({
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  fill: '#ff0000',
  stroke: '#000000',
  strokeWidth: 2,
  radius: 10, // 圆角
  draggable: true // 可拖拽
});

app.add(rect);
```

#### Image
```typescript
import { Image } from 'leafer-ui';

const image = new Image({
  x: 50,
  y: 50,
  width: 300,
  height: 200,
  url: 'https://example.com/image.jpg'
});

app.add(image);
```

#### Text (重点)
```typescript
import { Text } from 'leafer-ui';

const text = new Text({
  x: 100,
  y: 100,
  text: 'Hello LeaferJS',
  fontSize: 24,
  fontWeight: 'bold',
  fill: '#333333',
  boxStyle: {
    width: 200,
    height: 100,
    padding: 10,
    textAlign: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.5,
    wordBreak: 'break-all'
  },
  editable: true // 启用编辑
});

app.add(text);
```

### 3.3 容器元素

#### Group
```typescript
import { Group, Rect, Ellipse } from 'leafer-ui';

const group = new Group({
  x: 100,
  y: 100
});

const rect = new Rect({ x: 0, y: 0, width: 100, height: 100, fill: 'red' });
const ellipse = new Ellipse({ x: 150, y: 50, rx: 50, ry: 30, fill: 'blue' });

group.add(rect);
group.add(circle);
app.add(group);

// 移动整个组
group.set({ x: 200, y: 150 });
```

### 3.4 事件处理

```typescript
// 监听指针事件
app.on('pointerdown', (e: any) => {
  console.log('Pointer down at:', e.x, e.y);
});

// 监听拖拽事件
rect.on('dragend', (e: any) => {
  console.log('Dragged to:', e.target.x, e.target.y);
});

// 监听缩放事件
app.on('zoom', (e: any) => {
  console.log('Zoom level:', e.zoom);
});

// 移除事件监听器
const listener = (e: any) => { /* 处理逻辑 */ };
app.on('pointermove', listener);
app.off('pointermove', listener);
```

## 4. 扩展模块

### 4.1 @leafer-in/editor

**功能**：提供元素编辑功能

**使用**：
```typescript
import '@leafer-in/editor';

// 启用编辑功能
const rect = new Rect({
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  editable: true // 启用编辑
});
```

### 4.2 @leafer-in/resize

**功能**：提供元素调整大小功能

**使用**：
```typescript
import '@leafer-in/resize';

// 启用调整大小
const rect = new Rect({
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  resizable: true // 启用调整大小
});
```

### 4.3 @leafer-in/viewport

**功能**：提供视口控制功能

**使用**：
```typescript
import '@leafer-in/viewport';

// 配置视口
const app = new App({
  view: document.getElementById('canvas'),
  width: 800,
  height: 600,
  viewport: {
    zoom: 1,
    minZoom: 0.1,
    maxZoom: 5
  }
});

// 控制视口
app.viewport.zoom = 1.5; // 放大
app.viewport.moveTo(100, 100); // 移动视口
```

### 4.4 @leafer-in/state

**功能**：提供响应式状态管理

**使用**：
```typescript
import { useWatch } from '@leafer-in/state';

// 监听元素属性变化
useWatch(rect, ['x', 'y'], (newValues, oldValues) => {
  console.log('Position changed:', newValues, oldValues);
});

// 批量更新
rect.set({
  x: 200,
  y: 150,
  width: 250
}); // 只会触发一次 watch 回调
```

### 4.5 @leafer-in/text-editor

**功能**：提供文本编辑功能

**使用**：
```typescript
import '@leafer-in/text-editor';

const text = new Text({
  x: 100,
  y: 100,
  text: 'Click to edit',
  editable: true // 启用编辑
});

// 监听文本变化
text.on('text:change', (e: any) => {
  console.log('Text changed:', e.text);
});
```

## 5. 文本元素详解 (重点)

### 5.1 boxStyle 配置

**boxStyle** 是 Text 元素的核心配置，用于控制文本的布局和样式：

```typescript
const text = new Text({
  text: 'Hello World',
  boxStyle: {
    // 尺寸设置
    width: 200,           // 文本框宽度
    height: 100,          // 文本框高度
    minWidth: 50,         // 最小宽度
    minHeight: 30,        // 最小高度
    maxWidth: 300,        // 最大宽度
    maxHeight: 200,       // 最大高度
    
    // 内边距
    padding: 10,          // 统一内边距
    paddingTop: 5,        // 上内边距
    paddingRight: 10,     // 右内边距
    paddingBottom: 5,     // 下内边距
    paddingLeft: 10,      // 左内边距
    
    // 文本对齐
    textAlign: 'left',    // 水平对齐：left, center, right, justify
    verticalAlign: 'top', // 垂直对齐：top, middle, bottom
    
    // 行高和间距
    lineHeight: 1.5,      // 行高倍数
    letterSpacing: 1,     // 字间距
    wordSpacing: 2,       // 词间距
    
    // 换行和溢出
    wordBreak: 'normal',  // 换行方式：normal, break-all, keep-all
    whiteSpace: 'normal', // 空白处理：normal, nowrap, pre, pre-wrap, pre-line
    overflow: 'visible',  // 溢出处理：visible, hidden, scroll
    
    // 文本方向
    direction: 'ltr',     // 文本方向：ltr, rtl
    writingMode: 'horizontal-tb' // 书写模式
  }
});
```

### 5.2 文本样式

```typescript
const text = new Text({
  text: 'Styled Text',
  // 字体设置
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  fontWeight: 'normal', // normal, bold, 100-900
  fontStyle: 'normal',  // normal, italic, oblique
  fontVariant: 'normal', // normal, small-caps
  
  // 文本颜色
  fill: '#333333',
  
  // 文本装饰
  textDecoration: 'none', // none, underline, overline, line-through
  textDecorationColor: '#ff0000',
  textDecorationStyle: 'solid', // solid, double, dotted, dashed, wavy
  
  // 文本阴影
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
});
```

### 5.3 富文本支持

```typescript
const text = new Text({
  text: [
    { text: 'Bold ', fontWeight: 'bold' },
    { text: 'and ', fill: '#666' },
    { text: 'Italic', fontStyle: 'italic', fill: '#ff6600' }
  ]
});
```

## 6. 高级功能

### 6.1 图层管理

```typescript
import { Layer } from 'leafer-ui';

// 创建图层
const layer1 = new Layer({ name: 'Layer 1' });
const layer2 = new Layer({ name: 'Layer 2' });

// 添加到应用
app.add(layer1);
app.add(layer2);

// 在图层中添加元素
const rect1 = new Rect({ x: 100, y: 100, width: 100, height: 100, fill: 'red' });
const rect2 = new Rect({ x: 150, y: 150, width: 100, height: 100, fill: 'blue' });

layer1.add(rect1);
layer2.add(rect2);

// 控制图层顺序
layer2.moveUp(); // 上移一层
layer1.moveToTop(); // 移到顶层

// 控制图层可见性
layer1.visible = false; // 隐藏图层
```

### 6.2 变换操作

```typescript
// 平移
rect.set({ x: 200, y: 150 });

// 旋转
rect.set({ rotation: 45 }); // 45度

// 缩放
rect.set({ scale: 1.5 }); // 放大1.5倍

// 倾斜
rect.set({ skewX: 10, skewY: 5 }); // X轴倾斜10度，Y轴倾斜5度

// 中心点
rect.set({ originX: 0.5, originY: 0.5 }); // 中心点在中心
```

### 6.3 路径操作

```typescript
import { Path } from 'leafer-ui';

// 创建路径
const path = new Path({
  d: 'M100,100 L200,100 L200,200 L100,200 Z',
  fill: '#ff0000',
  stroke: '#000000',
  strokeWidth: 2
});

app.add(path);
```

### 6.4 滤镜效果

```typescript
// 添加模糊效果
rect.set({ filter: 'blur(5px)' });

// 添加阴影效果
rect.set({ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))' });

// 组合滤镜
rect.set({ filter: 'blur(2px) drop-shadow(2px 2px 4px rgba(0,0,0,0.5))' });
```

## 7. 性能优化

### 7.1 渲染优化
- **使用 Group**：将相关元素组织到 Group 中
- **批量更新**：使用 `set()` 方法批量更新属性
- **避免频繁重绘**：减少不必要的属性修改
- **使用缓存**：对于静态内容使用缓存

### 7.2 内存管理
- **及时销毁**：不再使用的元素及时从应用中移除
- **避免内存泄漏**：清理事件监听器
- **合理使用图层**：根据需要创建和管理图层

### 7.3 事件处理优化
- **事件委托**：使用事件委托减少事件监听器
- **条件监听**：只在必要时监听事件
- **事件节流**：对频繁触发的事件进行节流处理

## 8. 集成示例

### 8.1 完整的标注应用

```typescript
import { App, Rect, Image, Group, Text } from 'leafer-ui';
import '@leafer-in/editor';
import '@leafer-in/resize';
import '@leafer-in/viewport';
import '@leafer-in/text-editor';

// 创建应用
const app = new App({
  view: document.getElementById('canvas'),
  width: 1000,
  height: 600,
  backgroundColor: '#f0f0f0'
});

// 加载背景图片
const background = new Image({
  url: 'https://example.com/image.jpg',
  width: 800,
  height: 500,
  x: 100,
  y: 50
});
app.add(background);

// 创建标注组
const annotations = new Group();
app.add(annotations);

// 添加标注点
const addAnnotation = (x: number, y: number, text: string) => {
  const group = new Group({ x, y });
  
  // 标注点
  const point = new Rect({
    x: -5,
    y: -5,
    width: 10,
    height: 10,
    fill: '#ff0000',
    stroke: '#ffffff',
    strokeWidth: 2,
    draggable: true
  });
  
  // 标注文本
  const label = new Text({
    x: 15,
    y: -15,
    text,
    fontSize: 14,
    fill: '#333333',
    boxStyle: {
      width: 120,
      padding: 5,
      backgroundColor: '#ffffff',
      border: '1px solid #cccccc',
      borderRadius: 4
    },
    editable: true
  });
  
  group.add(point);
  group.add(label);
  annotations.add(group);
  
  return group;
};

// 点击添加标注
app.on('pointerdown', (e: any) => {
  if (e.target === app) {
    addAnnotation(e.x, e.y, 'New Annotation');
  }
});

// 视口控制
app.viewport.zoom = 1;
app.viewport.minZoom = 0.1;
app.viewport.maxZoom = 3;
```

## 9. 常见问题

### 9.1 性能问题
**问题**：Canvas 渲染性能差
**解决方案**：
- 使用 Group 组织元素
- 批量更新属性
- 减少不必要的重绘
- 使用适当的图层管理

### 9.2 事件处理问题
**问题**：事件不触发或触发多次
**解决方案**：
- 检查事件监听器是否正确添加
- 避免事件冒泡冲突
- 及时清理事件监听器

### 9.3 文本编辑问题
**问题**：文本编辑功能不工作
**解决方案**：
- 确保导入了 `@leafer-in/text-editor`
- 设置 `editable: true`
- 检查文本元素的尺寸和位置

### 9.4 视口控制问题
**问题**：视口缩放或移动不流畅
**解决方案**：
- 合理设置视口参数
- 避免频繁视口操作
- 使用动画效果平滑过渡

## 10. 技术栈集成

### 10.1 与 Vue 集成

```vue
<template>
  <div class="leafer-app">
    <div ref="canvasRef" class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { App, Rect } from 'leafer-ui';
import '@leafer-in/editor';

const canvasRef = ref<HTMLElement>();
let app: App;

onMounted(() => {
  app = new App({
    view: canvasRef.value!,
    width: 800,
    height: 600
  });
  
  const rect = new Rect({
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    fill: '#ff0000',
    draggable: true,
    resizable: true
  });
  
  app.add(rect);
});

onUnmounted(() => {
  app?.destroy();
});
</script>

<style scoped>
.canvas-container {
  width: 800px;
  height: 600px;
  border: 1px solid #ccc;
}
</style>
```

### 10.2 与 React 集成

```tsx
import React, { useEffect, useRef } from 'react';
import { App, Rect } from 'leafer-ui';
import '@leafer-in/editor';

const LeaferApp: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const app = new App({
        view: canvasRef.current,
        width: 800,
        height: 600
      });
      
      const rect = new Rect({
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        fill: '#ff0000',
        draggable: true,
        resizable: true
      });
      
      app.add(rect);
      appRef.current = app;
    }

    return () => {
      appRef.current?.destroy();
    };
  }, []);

  return (
    <div className="leafer-app">
      <div 
        ref={canvasRef} 
        className="canvas-container"
        style={{ width: '800px', height: '600px', border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default LeaferApp;
```

## 11. 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2024-01-01 | 初始版本 |
| 2.0.0 | 2025-06-15 | 重构核心架构，提升性能 |
| 2.0.8 | 2026-01-10 | 优化文本编辑功能 |
| 2.1.0 | 2026-04-01 | 添加 @leafer-in/state 和 @leafer-in/text-editor |

## 12. 未来展望

- **WebGPU 支持**：利用 WebGPU 进一步提升性能
- **3D 功能**：添加基础 3D 渲染能力
- **更多导出格式**：支持导出为 PDF、SVG 等格式
- **AI 集成**：添加 AI 辅助设计功能
- **插件系统**：支持第三方插件扩展

---

**文档更新时间**：2026-04-27
**作者**：AI Assistant