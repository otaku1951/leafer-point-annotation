# 点标注与笔刷涂抹工具 - 需求文档

## 1. 项目概述

### 1.1 项目背景

本项目是一个基于 Vue3 + LeaferJS 的图像标注工具，主要提供两大核心功能：
- **点标注**：在图片上添加可编辑的标注点
- **笔刷涂抹**：在图片上进行涂抹操作并输出二值图

### 1.2 项目目标

为 AI 模型训练提供高质量的标注数据，支持点标注坐标导出和笔刷涂抹区域的二值图输出。

### 1.3 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.3+ | 前端框架 |
| TypeScript | 6.0+ | 类型系统 |
| LeaferJS | 2.0+ | Canvas 渲染引擎 |
| tinykeys | 3.0+ | 热键系统 |
| @zzalai/leafer-undo-redo | 1.0+ | 撤销/重做系统 |

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
| P2-005 | 笔刷大小可调节（通过浮动组件） | ⭐⭐⭐ |

#### 2.2.2 输出格式

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P2-101 | 输出与原图尺寸相同的二值图 | ⭐⭐⭐ |
| P2-102 | 涂抹区域颜色可配置（默认黑色） | ⭐⭐⭐ |
| P2-103 | 支持透明度配置 | ⭐⭐⭐ |

### 2.3 工具切换

#### 2.3.1 工具栏

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P3-001 | 选择工具（热键 V） | ⭐⭐⭐ |
| P3-002 | 点标注工具（热键 P） | ⭐⭐⭐ |
| P3-003 | 笔刷工具（热键 B） | ⭐⭐⭐ |
| P3-004 | 擦除工具（热键 E） | ⭐⭐⭐ |
| P3-005 | 显示当前激活工具状态 | ⭐⭐⭐ |

#### 2.3.2 Editor 动态控制

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P3-101 | 仅在点标注模式下启用 editor | ⭐⭐⭐ |
| P3-102 | 笔刷模式下禁用 editor（避免干扰） | ⭐⭐⭐ |

### 2.4 撤销/重做

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P4-001 | 支持撤销操作（Ctrl+Z） | ⭐⭐⭐ |
| P4-002 | 支持重做操作（Ctrl+Y） | ⭐⭐⭐ |
| P4-003 | 点标注和笔刷操作统一管理 | ⭐⭐⭐ |
| P4-004 | 清除和擦除操作也支持撤销 | ⭐⭐⭐ |

### 2.5 导出/导入

#### 2.5.1 导出功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P5-001 | 导出完整画布 JSON 数据 | ⭐⭐⭐ |
| P5-002 | 导出仅点标注数据 | ⭐⭐⭐ |
| P5-003 | 导出二值图（PNG） | ⭐⭐⭐ |
| P5-004 | 支持 COCO 格式导出 | ⭐⭐ |
| P5-005 | 支持 YOLO 格式导出 | ⭐⭐ |

#### 2.5.2 导入功能

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P5-101 | 支持导入 JSON 数据 | ⭐⭐⭐ |
| P5-102 | 支持增量导入（追加模式） | ⭐⭐ |
| P5-103 | 支持替换导入（覆盖模式） | ⭐⭐ |

### 2.6 画布控制

| 需求编号 | 功能描述 | 优先级 |
|----------|----------|--------|
| P6-001 | 支持画布缩放（+/-） | ⭐⭐⭐ |
| P6-002 | 支持重置缩放 | ⭐⭐⭐ |
| P6-003 | 支持图片自适应画布 | ⭐⭐⭐ |

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

### 3.2 笔刷数据

```typescript
interface BrushStroke {
  id: string;                    // "stroke_" + UUID
  points: { x: number; y: number }[];  // 路径点
  color: string;                 // 颜色
  opacity: number;               // 透明度
  size: number;                  // 笔刷大小
  createdAt: number;             // 创建时间戳
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
  brushStrokes: BrushStroke[];
  exportTime: number;            // 导出时间
}
```

---

## 4. Props 配置

### 4.1 点标注样式配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| pointStyle.circleRadius | number | 8 | 圆点半径 |
| pointStyle.circleFill | string | '#ff4d4f' | 圆点填充色 |
| pointStyle.circleStroke | string | '#ffffff' | 圆点边框色 |
| pointStyle.circleStrokeWidth | number | 2 | 圆点边框宽度 |
| pointStyle.hoverCircleFill | string | '#ff7875' | Hover 填充色 |
| pointStyle.hoverCircleStroke | string | '#ffffff' | Hover 边框色 |
| pointStyle.selectedCircleFill | string | '#1890ff' | Selected 填充色 |
| pointStyle.selectedCircleStroke | string | '#ffffff' | Selected 边框色 |
| pointStyle.selectedCircleScale | number | 1.2 | Selected 放大比例 |
| pointStyle.labelBackgroundColor | string | '#ffffff' | 标签背景色 |
| pointStyle.labelTextColor | string | '#333333' | 标签文字色 |
| pointStyle.labelFontSize | number | 12 | 标签字体大小 |
| pointStyle.labelPadding | number | 4 | 标签内边距 |

### 4.2 笔刷样式配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| brushStyle.color | string | '#000000' | 笔刷颜色 |
| brushStyle.opacity | number | 1 | 透明度 |
| brushStyle.size | number | 10 | 默认笔刷大小 |
| brushStyle.minSize | number | 2 | 最小笔刷大小 |
| brushStyle.maxSize | number | 50 | 最大笔刷大小 |

### 4.3 画布配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| canvasWidth | number | 800 | 画布宽度 |
| canvasHeight | number | 600 | 画布高度 |
| enableZoom | boolean | true | 是否启用缩放 |
| zoomRange | [number, number] | [0.1, 5] | 缩放范围 |

---

## 5. 交互设计

### 5.1 热键映射

| 热键 | 功能 | 适用工具 |
|------|------|----------|
| V | 选择工具 | 所有 |
| P | 点标注工具 | 所有 |
| B | 笔刷工具 | 所有 |
| E | 擦除工具 | 笔刷模式 |
| Ctrl+Z | 撤销 | 所有 |
| Ctrl+Y | 重做 | 所有 |
| Delete | 删除/清除 | 点标注/笔刷 |
| Ctrl++ | 放大 | 所有 |
| Ctrl+- | 缩小 | 所有 |
| Ctrl+0 | 重置缩放 | 所有 |

### 5.2 工具栏交互

1. **工具切换**：点击工具栏按钮切换当前工具，激活状态高亮显示
2. **笔刷大小调节**：点击笔刷按钮后，在按钮上方浮动显示滑块组件
3. **浮动组件关闭**：点击空白处或按 ESC 键关闭浮动组件

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

---

## 6. 导出格式说明

### 6.1 JSON Full 格式

包含完整的标注数据和笔刷数据，用于数据备份和恢复。

```json
{
  "version": "1.0",
  "imageUrl": "https://example.com/image.jpg",
  "imageWidth": 800,
  "imageHeight": 600,
  "pointAnnotations": [...],
  "brushStrokes": [...],
  "exportTime": 1716960000000
}
```

### 6.2 JSON Points 格式

仅包含点标注数据，用于点标注统计和分析。

```json
[
  {
    "id": "point_xxx",
    "pixel": { "x": 100, "y": 200 },
    "normalized": { "x": 0.125, "y": 0.333 },
    "label": "#1"
  }
]
```

### 6.3 COCO 格式

符合 COCO 数据集标注格式，用于目标检测模型训练。

### 6.4 YOLO 格式

符合 YOLO 数据集标注格式，包含归一化坐标。

### 6.5 二值图格式

PNG 格式图片，涂抹区域为前景色，其余为透明或背景色。

---

**文档版本**：1.0  
**创建日期**：2026-04-28  
**最后更新**：2026-04-28