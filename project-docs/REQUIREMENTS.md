# 点标注与笔刷涂抹工具 - 需求文档

## 1. 项目概述

### 1.1 项目背景

本项目是一个基于 Vue3 和 LeaferJS 的图像标注工具，主要提供两大核心功能：
- **点标注**：在图片上添加可编辑的标注点
- **笔刷涂抹**：在图片上进行涂抹操作并输出二值图

### 1.2 项目目标

为 AI 模型训练提供高质量的标注数据，支持点标注坐标导出和笔刷涂抹区域的二值图输出。

### 1.3 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.3+ | 前端框架 |
| TypeScript | 6.0+ | 类型系统 |
| LeaferUI | 2.0.8+ | Canvas 渲染引擎 |
| LeaferEditor | 2.0.8+ | 编辑器插件 |
| LeaferViewport | 2.0.8+ | 视口插件 |
| LeaferTextEditor | 2.1.0+ | 文本编辑插件 |
| LeaferResize | 2.0.8+ | 缩放插件 |
| tinykeys | 3.0+ | 热键系统 |
| @zzalai/leafer-undo-redo | 1.0.3+ | 撤销/重做系统 |
| vue-pick-colors | 1.8+ | 颜色选择器 |

---

## 2. 功能需求

### 2.1 点标注功能

#### 2.1.1 核心功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P1-001 | 在图片上点击添加标注点 | ⭐⭐⭐ |
| P1-002 | 标注点由圆点（Ellipse）+ 可编辑标签（Text）组成 | ⭐⭐⭐ |
| P1-003 | 标注点支持拖拽移动 | ⭐⭐⭐ |
| P1-004 | 标注点支持删除 | ⭐⭐⭐ |
| P1-005 | 标签默认值为 #1、#2、#3... 自动递增 | ⭐⭐⭐ |
| P1-006 | 标签支持编辑，但不允许重复或为空 | ⭐⭐⭐ |
| P1-007 | 选中状态可通过 app.editor.list 获取 | ⭐⭐⭐ |
| P1-008 | 支持标注点固定大小（不随画布缩放） | ⭐⭐ |

#### 2.1.2 视觉效果

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P1-101 | Hover 状态：圆点样式变化 | ⭐⭐⭐ |
| P1-102 | Selected 状态：圆点放大并高亮 | ⭐⭐⭐ |
| P1-103 | 标签带背景色（boxStyle） | ⭐⭐⭐ |

#### 2.1.3 数据输出

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P1-201 | 输出归一化坐标（0-1） | ⭐⭐⭐ |
| P1-202 | 输出像素坐标 | ⭐⭐⭐ |
| P1-203 | 输出标签文本 | ⭐⭐⭐ |

### 2.2 笔刷涂抹功能

#### 2.2.1 核心功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P2-001 | 支持笔刷涂抹绘制 | ⭐⭐⭐ |
| P2-002 | 支持擦除功能 | ⭐⭐⭐ |
| P2-003 | 实时预览涂抹效果 | ⭐⭐⭐ |
| P2-004 | 一键清除所有涂抹 | ⭐⭐⭐ |
| P2-005 | 笔刷大小可调节（通过浮动配置面板） | ⭐⭐⭐ |
| P2-006 | 笔刷颜色可配置 | ⭐⭐⭐ |
| P2-007 | 笔刷透明度可配置 | ⭐⭐⭐ |
| P2-008 | 笔刷连续性阈值可配置 | ⭐⭐ |
| P2-009 | 使用 Group 控制整体透明度，避免多次叠加 | ⭐⭐ |
| P2-010 | 提供 hasContent() 方法检测是否有笔刷内容 | ⭐⭐ |

#### 2.2.2 输出格式

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P2-101 | 输出与原图尺寸相同的二值图 | ⭐⭐⭐ |
| P2-102 | 涂抹区域颜色可配置（默认黑色） | ⭐⭐⭐ |
| P2-103 | 支持 PNG 和 JPG 格式输出 | ⭐⭐⭐ |
| P2-104 | JPG 格式自动处理背景色 | ⭐⭐ |

### 2.3 工具切换

#### 2.3.1 工具栏

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P3-001 | 选择工具（热键 V） | ⭐⭐⭐ |
| P3-002 | 点标注工具（热键 P） | ⭐⭐⭐ |
| P3-003 | 笔刷工具（热键 B） | ⭐⭐⭐ |
| P3-004 | 擦除工具（热键 E） | ⭐⭐⭐ |
| P3-005 | 显示当前激活工具状态 | ⭐⭐⭐ |
| P3-006 | 点击笔刷工具显示/隐藏配置面板 | ⭐⭐⭐ |
| P3-007 | 点击面板外其他地方关闭配置面板 | ⭐⭐⭐ |

#### 2.3.2 Editor 动态控制

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P3-101 | 仅在 select 和 point 模式下启用 editor | ⭐⭐⭐ |
| P3-102 | 笔刷和擦除模式下禁用 editor（避免干扰） | ⭐⭐⭐ |
| P3-103 | 标签编辑权限控制：仅 select 和 point 工具可编辑 | ⭐⭐⭐ |
| P3-104 | focusout 时自动取消编辑器选中状态 | ⭐⭐ |

### 2.4 撤销/重做

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P4-001 | 支持撤销操作（Ctrl+Z） | ⭐⭐⭐ |
| P4-002 | 支持重做操作（Ctrl+Y） | ⭐⭐⭐ |
| P4-003 | 点标注和笔刷操作统一管理 | ⭐⭐⭐ |
| P4-004 | 清除和擦除操作也支持撤销 | ⭐⭐⭐ |
| P4-005 | 可配置历史记录步数限制（默认100） | ⭐⭐ |

### 2.5 导出/导入

#### 2.5.1 导出功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P5-001 | 导出完整画布 JSON 数据（包含笔刷 mask） | ⭐⭐⭐ |
| P5-002 | 导出 COCO 格式数据 | ⭐⭐ |
| P5-003 | 导出 YOLO 格式数据 | ⭐⭐ |
| P5-004 | 导出二值图 Mask（PNG/JPG 可选） | ⭐⭐⭐ |
| P5-005 | 二值图前景色可配置（黑/白） | ⭐⭐⭐ |
| P5-006 | 导出格式可通过 options 配置 | ⭐⭐ |

#### 2.5.2 导入功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P5-101 | 支持导入 JSON 数据 | ⭐⭐⭐ |
| P5-102 | 支持重置缩放和自适应图片 | ⭐⭐⭐ |
| P5-103 | 支持导入不同 URL 的图片 | ⭐⭐ |

### 2.6 画布控制

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P6-001 | 支持画布缩放（+/-） | ⭐⭐⭐ |
| P6-002 | 支持重置缩放 | ⭐⭐⭐ |
| P6-003 | 支持图片自适应画布 | ⭐⭐⭐ |
| P6-004 | 显示当前缩放比例 | ⭐⭐ |

### 2.7 本地图片上传功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P7-001 | imageSource 未提供时，显示本地上传界面 | ⭐⭐⭐ |
| P7-002 | 支持点击选择本地图片文件 | ⭐⭐⭐ |
| P7-003 | 支持拖拽图片文件到画布区域上传 | ⭐⭐⭐ |
| P7-004 | 本地图片上传后，自动加载到画布 | ⭐⭐⭐ |
| P7-005 | 上传区域样式：占满整个画布，虚线边框，拖拽时有视觉反馈 | ⭐⭐⭐ |

### 2.8 清除所有功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P8-001 | select 模式下未选中任何标注点时，按 Delete 清除所有标注和笔刷 | ⭐⭐⭐ |
| P8-002 | 清除前显示确认对话框 | ⭐⭐⭐ |

---

## 3. 数据结构

### 3.1 点标注数据

```typescript
interface PointAnnotation {
  id: string;                    // "point_" + UUID
  pixel: {
    x: number;                   // 像素坐标 X
    y: number;                   // 像素坐标 Y
  };
  normalized: {
    x: number;                   // 归一化坐标 X (0-1)
    y: number;                   // 归一化坐标 Y (0-1)
  };
  label: string;                 // 标签文本
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}
```

### 3.2 笔刷数据（内部快照）

```typescript
interface BrushSnapshot {
  id: string;
  imageData: string;             // Base64 编码的图片数据
  timestamp: number;
}
```

### 3.3 导出数据结构

```typescript
interface ExportData {
  version: string;               // 数据版本
  imageUrl: string;              // 图片地址
  imageWidth: number;            // 图片宽度
  imageHeight: number;           // 图片高度
  pointAnnotations: PointAnnotation[];
  brushMask: string | null;      // Base64 编码的笔刷 mask
  exportTime: number;            // 导出时间
}
```

### 3.4 COCO 格式数据

```typescript
interface COCOAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  keypoints: number[];          // [x, y, visibility] 格式
  num_keypoints: number;
  bbox: [number, number, number, number];
  area: number;
  iscrowd: number;
}

interface COCOImage {
  id: number;
  file_name: string;
  width: number;
  height: number;
}

interface COCOCategory {
  id: number;
  name: string;
  keypoints: string[];
  skeleton: number[][];
}

interface COCOExport {
  info: {
    description: string;
    version: string;
    year: number;
    date_created: string;
  };
  licenses: any[];
  images: COCOImage[];
  annotations: COCOAnnotation[];
  categories: COCOCategory[];
}
```

### 3.5 YOLO 格式数据

```typescript
interface YOLOExport {
  annotations: string;           // YOLO 格式的标注字符串
  classNames: string;            // 类名列表（每行一个）
}
```

---

## 4. Props 配置

### 4.1 图片源配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| imageSource | { id?: string, url: string } \| null | null | 图片源配置（可选，未提供时显示本地上传界面） |

### 4.2 点标注样式配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| options.pointStyle.circleRadius | number | 12 | 圆点半径 |
| options.pointStyle.circleFill | string | '#ff4d4f' | 圆点填充色 |
| options.pointStyle.circleStroke | string | '#ffffff' | 圆点边框色 |
| options.pointStyle.circleStrokeWidth | number | 2 | 圆点边框宽度 |
| options.pointStyle.hoverCircleFill | string | '#ff7875' | Hover 填充色 |
| options.pointStyle.hoverCircleStroke | string | '#ffffff' | Hover 边框色 |
| options.pointStyle.selectedCircleFill | string | '#1890ff' | Selected 填充色 |
| options.pointStyle.selectedCircleStroke | string | '#ffffff' | Selected 边框色 |
| options.pointStyle.selectedCircleScale | number | 1.2 | Selected 放大比例 |
| options.pointStyle.labelBackgroundColor | string | '#ffffff' | 标签背景色 |
| options.pointStyle.labelTextColor | string | '#333333' | 标签文字色 |
| options.pointStyle.labelFontSize | number | 12 | 标签字体大小 |
| options.pointStyle.labelPadding | number[] | [2, 4] | 标签内边距 |
| options.pointStyle.fixedSizeOnZoom | boolean | false | 是否开启标注点固定大小（不随画布缩放） |
| options.pointStyle.fixedSizeScale | number | 1 | 固定大小的缩放系数 |

### 4.3 笔刷样式配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| options.brushStyle.color | string | 'rgba(255,0,0,1)' | 笔刷颜色 |
| options.brushStyle.opacity | number | 0.55 | 透明度 |
| options.brushStyle.size | number | 100 | 默认笔刷大小 |
| options.brushStyle.minSize | number | 50 | 最小笔刷大小 |
| options.brushStyle.maxSize | number | 150 | 最大笔刷大小 |
| options.brushStyle.continuity | number | 28 | 连续性阈值（像素） |

### 4.4 导出配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| options.maskExportFormat | 'png' \| 'jpg' \| 'jpeg' | 'png' | Mask 导出格式 |
| options.maskExportForeground | 'black' \| 'white' | 'black' | Mask 前景色 |

### 4.5 其他配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| options.maxUndoSteps | number | 100 | 最大撤销/重做步数 |

---

## 5. 交互设计

### 5.1 热键映射

| 热键 | 功能 | 适用工具 |
|------|------|----------|
| V | 选择工具 | 所有 |
| P | 点标注工具 | 所有 |
| B | 笔刷工具 | 所有 |
| E | 擦除工具 | 所有 |
| Ctrl+Z | 撤销 | 所有 |
| Ctrl+Y | 重做 | 所有 |
| Delete | 删除选中/清除所有 | 所有 |
| Ctrl++ | 放大 | 所有 |
| Ctrl+- | 缩小 | 所有 |
| Ctrl+0 | 重置缩放 | 所有 |
| Alt | 显示/隐藏热键提示 | 所有 |

### 5.2 工具栏交互

1. **工具切换**：点击工具栏按钮切换当前工具，激活状态高亮显示
2. **笔刷配置面板**：点击笔刷工具按钮后，在按钮上方浮动显示配置面板
3. **浮动面板关闭**：点击空白处或按 ESC 键关闭浮动配置面板
4. **热键提示**：按住 Alt 键显示热键提示

### 5.3 点标注交互

1. **创建**：点击画布空白处创建新标注点
2. **移动**：拖拽标注点到目标位置
3. **编辑标签**：双击标签进入编辑模式，失焦后校验唯一性
4. **选择**：点击标注点选中，支持多选（Shift+点击）
5. **删除**：选中后按 Delete 键或点击删除按钮

### 5.4 笔刷交互

1. **绘制**：按住鼠标左键拖动进行涂抹
2. **擦除**：切换到擦除工具后，按住鼠标左键拖动擦除
3. **清除**：点击删除按钮或按 Delete 键清除所有涂抹
4. **配置**：点击笔刷工具按钮打开配置面板调整样式

### 5.5 本地图片上传交互

1. **无图片状态**：imageSource 未提供时，整个画布区域显示上传界面
2. **点击上传**：点击"选择图片"按钮打开文件选择器
3. **拖拽上传**：拖拽图片文件到画布区域，显示高亮边框反馈
4. **文件选择**：选择本地图片后，自动加载到画布
5. **图片切换**：通过 props.imageSource.url 变化时，自动切换图片并清空画布
6. **图片清空**：props.imageSource.url 为空时，清空画布回到上传状态

### 5.6 清除所有交互

1. **条件**：select 模式下未选中任何标注点
2. **触发**：点击删除按钮或按 Delete 键
3. **确认**：显示确认对话框
4. **执行**：确认后清除所有标注点和笔刷绘制

---

## 6. 导出格式说明

### 6.1 JSON Full 格式

包含完整的标注数据和笔刷数据，用于数据备份和恢复。

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

### 6.2 COCO 格式

符合 COCO 数据集标注格式，用于关键点检测模型训练。

```json
{
  "info": {
    "description": "Point Annotation Export",
    "version": "1.0",
    "year": 2024,
    "date_created": "2024-05-01"
  },
  "licenses": [],
  "images": [
    {
      "id": 1,
      "file_name": "image.jpg",
      "width": 1280,
      "height": 720
    }
  ],
  "annotations": [
    {
      "id": 1,
      "image_id": 1,
      "category_id": 1,
      "keypoints": [100, 200, 2],
      "num_keypoints": 1,
      "bbox": [92, 192, 24, 24],
      "area": 452.16,
      "iscrowd": 0
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "point",
      "keypoints": ["point"],
      "skeleton": []
    }
  ]
}
```

### 6.3 YOLO 格式

符合 YOLO 数据集标注格式，包含归一化坐标。

```txt
# 类名文件（classNames）
point

# 标注文件（annotations）
0 0.078 0.278 0.019 0.033
```

### 6.4 二值图 Mask 格式

PNG 或 JPG 格式图片，涂抹区域为前景色，其余为透明（PNG）或背景色（JPG）。

- PNG：涂抹区域为前景色，其余透明
- JPG：涂抹区域为前景色，其余为背景色（前景为黑则背景为白，反之亦然）

---

## 7. 对外 API

### 7.1 暴露的方法

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| getPointAnnotations | 无 | PointAnnotation[] | 获取所有点标注数据 |
| getImageInfo | 无 | { id?: string, url: string, width: number, height: number } | 获取图片信息 |
| exportCanvasJSON | 无 | string | 导出完整 JSON 数据 |
| exportMaskImage | format?: string, fgColor?: string | Promise&lt;string \| null&gt; | 导出二值图 dataURL |
| exportCOCO | 无 | string | 导出 COCO 格式 JSON 字符串 |
| exportYOLO | 无 | { annotations: string, classNames: string } | 导出 YOLO 格式数据 |
| importCanvasJSON | jsonString: string, options?: { resetZoom?: boolean } | Promise&lt;boolean&gt; | 导入 JSON 数据 |
| loadImage | url?: string | Promise&lt;void&gt; | 手动加载图片 |
| clearBrush | 无 | void | 清除所有笔刷内容 |
| zoomIn | 无 | void | 放大画布 |
| zoomOut | 无 | void | 缩小画布 |
| resetZoom | 无 | void | 重置缩放 |
| undo | 无 | void | 撤销操作 |
| redo | 无 | void | 重做操作 |
| getCurrentTool | 无 | 'select' \| 'point' \| 'brush' \| 'eraser' | 获取当前工具 |
| setTool | tool: string | void | 设置当前工具 |
| createPointAnnotation | x: number, y: number | string \| null | 创建标注点，返回 id |
| removePointAnnotation | id: string | boolean | 删除指定 id 的点标注 |

### 7.2 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| pointChange | PointAnnotation[] | 点标注数据变化 |
| loadStart | - | 图片开始加载 |
| loadSuccess | - | 图片加载成功 |
| loadError | error: any | 图片加载失败 |
| undoStateChange | - | 撤销状态变化 |
| redoStateChange | - | 重做状态变化 |

---

## 8. 性能要求

### 8.1 响应时间

| 操作 | 响应时间要求 |
|------|--------------|
| 图片加载 | < 3s |
| 点标注创建 | < 50ms |
| 笔刷绘制 | < 16ms（60fps） |
| 缩放操作 | < 100ms |
| 撤销/重做 | < 100ms |

### 8.2 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

---

**文档版本**：2.1  
**创建日期**：2024-04-28  
**最后更新**：2026-05-08
