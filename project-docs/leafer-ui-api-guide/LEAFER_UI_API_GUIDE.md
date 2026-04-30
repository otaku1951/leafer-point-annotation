# Leafer UI 2.0 API 学习指南

## 概述

本文档记录 Leafer UI 2.0 版本的正确 API 用法，基于实际项目实践经验整理，旨在避免使用过时或错误的 API。

---

## 1. 核心元素

### 1.1 Ellipse（椭圆）

**正确用法：**

```typescript
import { Ellipse } from 'leafer-ui';

const circle = new Ellipse({
  x: 0,
  y: 0,
  width: 20,      // 宽度（不是 rx）
  height: 20,     // 高度（不是 ry）
  fill: '#ff4d4f',
  stroke: '#ffffff',
  strokeWidth: 2,
  around: 'center', // 以中心为定位点
  hoverStyle: {
    fill: '#ff7875'
  }
});
```

**常见错误：**

| 错误用法 | 正确用法 | 说明 |
|---------|---------|------|
| `rx: 10, ry: 10` | `width: 20, height: 20` | rx/ry 已过时或效果不符合预期 |
| 不设置 around | `around: 'center'` | 默认左上角定位，需要设置 center 使圆心居中 |

### 1.2 Text（文本）

**正确用法：**

```typescript
import { Text } from 'leafer-ui';

const label = new Text({
  x: 10,
  y: 0,
  text: '#1',
  fontSize: 12,
  fill: '#333333',
  padding: [2, 4],  // 在 Text 层级设置，不是 boxStyle
  editable: true,
  around: 'bottom-left',
  editConfig: {
    strokeWidth: 0,   // 去除编辑边框
    moveable: false,  // 编辑时不可移动
    resizeable: false // 编辑时不可调整大小
  },
  boxStyle: {
    fill: '#ffffff',       // 不是 backgroundColor
    cornerRadius: 4,       // 不是 borderRadius
    whiteSpace: 'nowrap',
    shadow: {
      x: 1,
      y: 1,
      blur: 2,
      color: 'rgba(0,0,0, .2)'
    }
  }
});
```

**boxStyle 属性对照表：**

| 错误属性名 | 正确属性名 |
|-----------|-----------|
| `backgroundColor` | `fill` |
| `borderRadius` | `cornerRadius` |

---

## 2. 交互与状态

### 2.1 hoverStyle（悬停样式）

直接在元素上配置，无需手动监听事件：

```typescript
const circle = new Ellipse({
  x: 0,
  y: 0,
  width: 20,
  height: 20,
  fill: '#ff4d4f',
  hoverStyle: {
    fill: '#ff7875',
    stroke: '#ffffff'
  }
});
```

### 2.2 选中状态处理

**正确方式**：通过全局 `app.editor.on('select', callback)` 监听

```typescript
// 在 PointAnnotation.vue 中
app.editor.on('select', (e: any) => {
  const selected = e.target;
  if (selected && selected._element_tag === 'point-annotation') {
    selected.handlePointAnnotationSelected(true);
  }
});

app.editor.on('unselect', (e: any) => {
  const unselected = e.target;
  if (unselected && unselected._element_tag === 'point-annotation') {
    unselected.handlePointAnnotationSelected(false);
  }
});
```

**错误方式**：直接在元素上监听 select 事件（无效）

```typescript
// ❌ 无效
element.on('select', () => {});
```

---

## 3. 坐标转换

### 3.1 获取点击位置

**正确方式**：使用 `getBoxPoint` 获取相对于图层的坐标

```typescript
const handleCanvasTap = (e: any) => {
  // 获取相对于 contentLayer 的坐标
  const point = contentLayer.getBoxPoint({ x: e.x, y: e.y });
  
  // point.x, point.y 就是相对于图层的坐标
};
```

**错误方式**：使用 `getPagePoint()` 获取页面坐标（需要手动计算偏移）

---

## 4. Group（容器）配置

```typescript
import { Group } from 'leafer-ui';

const group = new Group({
  x: 100,
  y: 100,
  draggable: true,      // 允许拖动整个组
  editable: true,       // 允许选中
  editConfig: {
    strokeWidth: 0,     // 去除选中边框
    resizeable: false   // 不可调整大小
  },
  tag: 'point-annotation'  // 自定义标签，用于标识
});
```

---

## 5. Editor（编辑器）

### 5.1 编辑器配置

在创建 App 时配置：

```typescript
import { App } from 'leafer-ui';
import '@leafer-in/editor';

const app = new App({
  view: canvasContainer.value,
  editor: {
    rotateable: false,    // 禁止旋转
    selectedStyle: {
      strokeColor: 'rgba(200, 149, 237, 0.8)',
      fill: 'rgba(200, 149, 237, 0.3)'
    }
  }
});
```

### 5.2 编辑器属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `app.editor.list` | IUI[] | 当前选中的元素列表 |
| `app.editor.select(target)` | void | 选中指定元素 |
| `app.editor.cancel()` | void | 取消选中 |

---

## 6. 常用事件

### 6.1 指针事件

```typescript
element.on('pointerenter', () => {});  // 鼠标进入
element.on('pointerleave', () => {});  // 鼠标离开
element.on('pointerdown', () => {});   // 鼠标按下
element.on('pointerup', () => {});     // 鼠标抬起
element.on('pointermove', () => {});   // 鼠标移动
```

### 6.2 编辑器事件

```typescript
app.editor.on('select', (e: any) => {
  console.log('选中:', e.target);
});

app.editor.on('unselect', (e: any) => {
  console.log('取消选中:', e.target);
});
```

### 6.3 文本编辑事件

```typescript
text.on('text:change', (e: any) => {
  console.log('文本改变:', e.text);
});
```

---

## 7. 样式属性

### 7.1 通用样式

| 属性 | 类型 | 说明 |
|------|------|------|
| `fill` | string/object | 填充颜色 |
| `stroke` | string | 描边颜色 |
| `strokeWidth` | number | 描边宽度 |
| `opacity` | number | 透明度 (0-1) |
| `visible` | boolean | 是否可见 |
| `draggable` | boolean | 是否可拖动 |
| `editable` | boolean | 是否可编辑 |
| `around` | string | 定位锚点（center, bottom-left 等） |

### 7.2 阴影

```typescript
shadow: {
  x: 1,
  y: 1,
  blur: 2,
  color: 'rgba(0,0,0, .2)'
}
```

---

## 8. 注意事项

### 8.1 避免的错误

1. **不要**使用 `rx`/`ry` 设置椭圆尺寸，改用 `width`/`height`
2. **不要**在 `boxStyle` 中使用 `backgroundColor`，改用 `fill`
3. **不要**在 `boxStyle` 中使用 `borderRadius`，改用 `cornerRadius`
4. **不要**将 `padding` 放在 `boxStyle` 中，应放在 Text 层级
5. **不要**直接在元素上监听 `select` 事件，应通过 `app.editor.on('select')`

### 8.2 最佳实践

1. 使用 `around: 'center'` 使圆形元素居中定位
2. 使用 `hoverStyle` 配置悬停效果，无需手动监听
3. 通过 `tag` 或自定义属性标识元素类型
4. 使用 `contentLayer.getBoxPoint()` 获取相对坐标

---

## 版本说明

本文档基于 **Leafer UI 2.0.8** 版本编写。

---

## 参考链接

- [Leafer UI 官方文档](https://www.leaferjs.com/docs/)
- [Leafer UI API 参考](https://www.leaferjs.com/docs/api/)