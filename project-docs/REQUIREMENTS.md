# 点标注与笔刷涂抹工具 - 需求文档

> **版本**: v1.1.x  |  **用途**: 记录项目所有已实现功能与约束，作为验收与回归基准

---

## 1. 项目概述

### 1.1 项目背景

本项目是一个基于 Vue 3 和 LeaferJS 的图像标注工具，主要提供两大核心功能：
- **点标注**：在图片上添加可编辑的标注点（适用于 keypoint 数据集构建、关键点定位场景）
- **笔刷涂抹**：在图片上涂抹/擦除并输出二值图（适用于 segmentation、掩蔽区域、遮挡区域场景）

### 1.2 项目目标

1. 为 AI 模型训练提供高质量的标注数据：支持点标注像素/归一化坐标、笔刷涂抹区域的二值图输出
2. 作为 Vue 3 组件发布到 npm，可被任意 Vue 3 项目作为依赖安装
3. 提供 GitHub Pages 在线演示（`docs/` 目录）

### 1.3 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.3+ | 前端框架（peer dependency） |
| TypeScript | 6.0+ | 类型系统 |
| Vite | 8.0+ | 构建工具（含 vite-plugin-dts） |
| LeaferUI | 2.0.8+ | Canvas 渲染引擎 |
| @leafer-in/editor | 2.0.8+ | 编辑器插件（选择/框选） |
| @leafer-in/viewport | 2.0.8+ | 视口插件（缩放/平移） |
| @leafer-in/state | 2.1.0+ | hover/selected 状态 |
| @leafer-in/text-editor | 2.1.0+ | label 文本编辑 |
| @zzalai/leafer-undo-redo | 1.0.3 | 撤销/重做 CommandManager |
| tinykeys | 3.0+ | 键盘热键系统 |
| vue-pick-colors | 1.8+ | 颜色选择器组件 |

### 1.4 发布信息

| 字段 | 值 |
|------|---|
| npm 包名 | `@zzalai/leafer-point-annotation` |
| 版本 | `1.1.x` |
| 入口 | ESM: `dist/leafer-point-annotation.es.js`  UMD: `dist/leafer-point-annotation.umd.js` |
| 类型声明 | `dist/index.d.ts` |
| 样式文件 | `dist/leafer-point-annotation.css`（需手动 import） |
| 演示站点 | GitHub Pages (`docs/` 目录) |
| 作者 | `zzalai` |
| License | `MIT` |

---

## 2. 功能需求（按模块）

### 2.1 图片加载与显示（P0-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P0-001 | 通过 `props.imageSource.url` 加载远程图片 | ⭐⭐⭐ | ✅ |
| P0-002 | 未传 imageSource 时显示大面积上传区域（点击 + 拖拽均可） | ⭐⭐⭐ | ✅ |
| P0-003 | 本地上传后若 props.imageSource.url 变化，应丢弃本地标记并重新加载远程 | ⭐⭐⭐ | ✅ |
| P0-004 | 无图片时不渲染画布、工具栏、缩放控制器，仅显示上传区域 | ⭐⭐⭐ | ✅ |
| P0-005 | 提供 `loadStart` / `loadSuccess` / `loadError` 事件 | ⭐⭐⭐ | ✅ |
| P0-006 | 图片加载成功后画布自动适应图片尺寸 | ⭐⭐⭐ | ✅ |
| P0-007 | 通过 `options.canvasBackground` 自定义画布背景色 | ⭐⭐ | ✅ |

### 2.2 点标注功能（P1-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P1-001 | 在图片上点击添加标注点（需在 point 工具下） | ⭐⭐⭐ | ✅ |
| P1-002 | 标注点由 `Ellipse`（圆点） + `Text`（序号/label）构成，继承自 `Group` | ⭐⭐⭐ | ✅ |
| P1-003 | 标注点支持拖拽移动（在 select 工具下） | ⭐⭐⭐ | ✅ |
| P1-004 | 标注点支持删除：Delete 键 / 工具栏按钮 / `removePointAnnotation(id)` | ⭐⭐⭐ | ✅ |
| P1-005 | 点序号：按 `sequenceNumber` 自动显示 1,2,3...；删除后剩余点自动重排 | ⭐⭐⭐ | ✅ |
| P1-006 | `order` 字段保留历史创建顺序（不随删除变化）；`sequenceNumber` 是显示序号 | ⭐⭐⭐ | ✅ |
| P1-007 | label 编辑：通过 `updatePointAnnotationLabel(id, label)` 修改文案；label 不允许为空 | ⭐⭐⭐ | ✅ |
| P1-008 | undo/redo 时 label.text 的"自动重排变值"不应被误判为用户手动编辑 | ⭐⭐⭐ | ✅ |
| P1-009 | hover 状态：鼠标移上去圆点颜色变深（hoverCircleFill） | ⭐⭐⭐ | ✅ |
| P1-010 | press 状态：按下时圆点进一步变化 | ⭐⭐⭐ | ✅ |
| P1-011 | selected 状态：selectedCircleFill + selectedCircleScale 放大 | ⭐⭐⭐ | ✅ |
| P1-012 | 点标注数据：像素坐标 + 归一化坐标 + label + 时间戳 | ⭐⭐⭐ | ✅ |
| P1-013 | `pointChange` 事件：每次点新增/删除/修改/重排都 emit | ⭐⭐⭐ | ✅ |
| P1-014 | `maxPoints` 可配置最大点数限制 | ⭐⭐ | ✅ |
| P1-015 | `options.pointStyle` 可覆盖默认样式（circleRadius、circleFill、circleStroke、hover*、selected*、label 背景/文字/字号、fixedSizeOnZoom 等） | ⭐⭐⭐ | ✅ |
| P1-016 | `fixedSizeOnZoom` 让点不随画布缩放而变大 | ⭐⭐ | ✅ |

### 2.3 笔刷涂抹功能（P2-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P2-001 | 笔刷工具：拖动鼠标/触摸涂抹 | ⭐⭐⭐ | ✅ |
| P2-002 | 橡皮擦工具：擦除已绘制内容 | ⭐⭐⭐ | ✅ |
| P2-003 | 笔刷大小可调：通过 `updateBrushStyle({size})` 或工具栏面板 | ⭐⭐⭐ | ✅ |
| P2-004 | 笔刷颜色可调 | ⭐⭐⭐ | ✅ |
| P2-005 | 笔刷透明度可调（通过 Group.opacity，避免叠加问题） | ⭐⭐⭐ | ✅ |
| P2-006 | 笔刷连续性阈值 `continuity`：超过则不连线 | ⭐⭐ | ✅ |
| P2-006-1 | 橡皮擦独立尺寸：`brushStyle.eraserSize` 独立配置橡皮擦大小，与笔刷尺寸分离 | ⭐⭐ | ✅ |
| P2-007 | 实时预览涂抹效果（canvas 即时渲染） | ⭐⭐⭐ | ✅ |
| P2-008 | 套索工具：自由绘制闭合区域进行填充/擦除，与笔刷共享颜色、透明度、图层设置 | ⭐⭐⭐ | ✅ |
| P2-009 | 套索轨迹采用黑色 1px 主线 + 白色 3px 描边的高对比度设计，适应各种背景 | ⭐⭐ | ✅ |
| P2-010 | `lassoFixedSizeOnZoom` 配置：套索轨迹是否保持固定屏幕大小（不随画布缩放变粗），默认 true | ⭐⭐ | ✅ |
| P2-011 | 橡皮擦光标采用白色 2px 外圈 + 黑色 1px 内圈的双环设计（类似 Photoshop），适应各种背景 | ⭐⭐ | ✅ |
| P2-012 | 清空当前图层笔刷：`clearBrush()` | ⭐⭐⭐ | ✅ |
| P2-013 | 清空所有图层笔刷：`clearAllBrushLayers()` | ⭐⭐⭐ | ✅ |
| P2-014 | 多图层笔刷：通过 `options.brushLayers` 配置多个图层（`{label, value, color?, opacity?, size?}`） | ⭐⭐⭐ | ✅ |
| P2-015 | 默认单图层：不传 brushLayers 时自动创建 `{label:'默认图层', value:'default'}` | ⭐⭐⭐ | ✅ |
| P2-016 | 图层切换：`setActiveLayer(value)` 或通过 `v-model:currentLayer` 受控驱动 | ⭐⭐⭐ | ✅ |
| P2-017 | `effectiveCurrentLayer` / `activeCanvasBrush` 为运行时当前笔刷的入口 | ⭐⭐⭐ | ✅ |
| P2-018 | 笔刷撤销/重做：基于 ImageData 快照（BrushSnapshotCommand） | ⭐⭐⭐ | ✅ |

### 2.4 enableBrush 功能开关（P3-XXX）

> v1.1 新增

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P3-001 | `options.enableBrush = false` 时禁用所有笔刷功能 | ⭐⭐⭐ | ✅ |
| P3-002 | 禁用时工具栏笔刷/橡皮擦按钮不渲染 | ⭐⭐⭐ | ✅ |
| P3-003 | 禁用时 BrushStylePanel 不渲染 | ⭐⭐⭐ | ✅ |
| P3-004 | 禁用时 `brushTool()` / `eraserTool()` / `updateBrushStyle()` / `clearBrush()` / `clearAllBrushLayers()` / `createBrushFromPoints()` 直接 return | ⭐⭐⭐ | ✅ |
| P3-005 | 禁用时 `setTool('brush'|'eraser')` 被拦截 | ⭐⭐⭐ | ✅ |
| P3-006 | 禁用时 `initBrushLayers` 不创建 canvas 实例，仅清除旧的 | ⭐⭐⭐ | ✅ |
| P3-007 | 禁用时快捷键 `b` / `e` 不生效 | ⭐⭐⭐ | ✅ |
| P3-008 | 禁用时 `exportMaskImage*` / `getMaskBlob` / `getMaskFile` / `getAllMaskBlobs` 返回 null 或 {} | ⭐⭐⭐ | ✅ |
| P3-009 | 禁用时删除/清空确认文案不出现"笔刷"字样 | ⭐⭐ | ✅ |
| P3-010 | 运行时切换 enableBrush：开启时若有画布则重建笔刷层；关闭时自动把当前 tool 重置为 select | ⭐⭐ | ✅ |

### 2.5 点轨迹生成笔刷区域（P4-XXX）

> v1.1 新增

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P4-001 | `createBrushFromPoints()`：按所有点标注的 sequenceNumber 顺序将像素坐标连成多边形 | ⭐⭐⭐ | ✅ |
| P4-002 | 点数量 < 3 时不操作（无法形成多边形） | ⭐⭐⭐ | ✅ |
| P4-003 | 自动闭合多边形起点终点 | ⭐⭐⭐ | ✅ |
| P4-004 | 使用当前笔刷的 color + opacity 填充 | ⭐⭐⭐ | ✅ |
| P4-005 | 支持撤销/重做（通过 BrushSnapshotCommand 保存操作前后快照） | ⭐⭐⭐ | ✅ |

### 2.6 导出功能（P5-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P5-001 | `getPointAnnotations()`：获取当前所有点标注（含像素/归一化坐标、label） | ⭐⭐⭐ | ✅ |
| P5-002 | `exportMaskImage()`：当前图层导出为 mask（dataURL）；前景色可配置黑/白 | ⭐⭐⭐ | ✅ |
| P5-003 | `exportMaskImageByLayer(layerValue)`：指定图层 mask | ⭐⭐⭐ | ✅ |
| P5-004 | `exportAllMaskImages()`：所有图层 mask → Record<layerValue, dataURL> | ⭐⭐⭐ | ✅ |
| P5-005 | `getMaskBlob(layerValue?, format?, fg?)`：当前/指定图层 mask 导出为 Blob（后端上传用） | ⭐⭐⭐ | ✅ |
| P5-006 | `getMaskFile(layerValue?, filename?, format?, fg?)`：当前/指定图层 mask 导出为 File | ⭐⭐⭐ | ✅ |
| P5-007 | `getAllMaskBlobs()`：所有图层 Blob 集合 | ⭐⭐⭐ | ✅ |
| P5-008 | `exportCOCO()`：导出 COCO JSON（keypoints） | ⭐⭐ | ✅ |
| P5-009 | `exportYOLO()`：导出 YOLO 标注文件 | ⭐⭐ | ✅ |
| P5-010 | `exportCanvasJSON()`：全量导出（点 + 笔刷 + 图片信息） | ⭐⭐⭐ | ✅ |
| P5-011 | `importCanvasJSON(data)`：从导出的 JSON 恢复画布 | ⭐⭐ | ✅ |
| P5-012 | 导出格式支持 png / jpeg，通过 options 或调用参数指定 | ⭐⭐ | ✅ |

### 2.7 工具栏与快捷键（P6-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P6-001 | 默认工具栏含：select、point、brush、eraser、lasso、delete、clear、undo、redo 按钮 | ⭐⭐⭐ | ✅ |
| P6-002 | `options.showToolbar = false` 可隐藏默认工具栏 | ⭐⭐⭐ | ✅ |
| P6-003 | `options.showZoomController = false` 可隐藏缩放控制器 | ⭐⭐⭐ | ✅ |
| P6-004 | 父组件可通过 `ref` 调用暴露的方法自定义工具栏 | ⭐⭐⭐ | ✅ |
| P6-005 | 快捷键 `v` 选择工具 / `p` 点工具 / `b` 笔刷 / `e` 橡皮 / `l` 套索 / `Ctrl+Z` 撤销 / `Ctrl+Y` 重做 / `Delete` 删除选中 / `Ctrl++` 放大 / `Ctrl+-` 缩小 / `Ctrl+0` 重置 | ⭐⭐⭐ | ✅ |
| P6-006 | 快捷键生效条件：画布 focus 或鼠标 hover 画布 | ⭐⭐⭐ | ✅ |
| P6-007 | `Alt` 键显示/隐藏快捷键提示浮层 | ⭐⭐ | ✅ |
| P6-008 | `b` / `e` / `l` 快捷键受 `enableBrush` 限制 | ⭐⭐⭐ | ✅ |

### 2.8 撤销与重做（P7-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P7-001 | 点新增：通过 AddPointCommand 进栈 | ⭐⭐⭐ | ✅ |
| P7-002 | 点删除：通过 RemovePointCommand 进栈 | ⭐⭐⭐ | ✅ |
| P7-003 | 笔刷绘制：通过 BrushSnapshotCommand 进栈（基于 ImageData 快照） | ⭐⭐⭐ | ✅ |
| P7-004 | 笔刷擦除：同上 | ⭐⭐⭐ | ✅ |
| P7-005 | 点轨迹生成笔刷：同上 | ⭐⭐⭐ | ✅ |
| P7-006 | 套索填充/擦除：同上 | ⭐⭐⭐ | ✅ |
| P7-007 | 最大 undo 步数：可配置（options.maxUndoSteps），默认 100 | ⭐⭐ | ✅ |
| P7-008 | `undoStateChange` / `redoStateChange` 事件供父组件监听 undo/redo 是否可继续 | ⭐⭐ | ✅ |

### 2.9 缩放与视口（P8-XXX）

| 编号 | 功能描述 | 优先级 | 状态 |
|------|----------|--------|------|
| P8-001 | `zoomIn()` / `zoomOut()` / `resetZoom()` 可通过 ref 调用 | ⭐⭐⭐ | ✅ |
| P8-002 | 顶部缩放控制器显示当前百分比并可调 | ⭐⭐⭐ | ✅ |
| P8-003 | `options.zoomMin` / `options.zoomMax` 限制缩放范围 | ⭐⭐ | ✅ |
| P8-004 | 画布平移/缩放通过 @leafer-in/viewport 驱动 | ⭐⭐⭐ | ✅ |

### 2.10 父组件 API 暴露（P9-XXX）

> 完整方法列表详见 ARCHITECTURE.md 第 3.6 节

| 分类 | 已暴露方法 |
|------|-----------|
| 点标注 | `getPointAnnotations`, `createPointAnnotation`, `removePointAnnotation`, `updatePointAnnotationLabel` |
| 图片 & 画布 | `getImageInfo`, `loadImage` |
| 工具切换 | `getCurrentTool`, `setTool`, `selectTool`, `pointTool`, `brushTool`, `eraserTool`, `lassoTool` |
| 删除 / 清空 | `deleteSelected`, `clearAllAnnotationsAndBrush`, `clearBrush`, `clearAllBrushLayers` |
| 笔刷图层 | `getCurrentLayer`, `setActiveLayer`, `getAllLayers` |
| 笔刷样式 | `getBrushStyle`, `updateBrushStyle` |
| 点轨迹 | `createBrushFromPoints` |
| 缩放 | `zoomIn`, `zoomOut`, `resetZoom` |
| 撤销 / 重做 | `undo`, `redo` |
| 导入导出 | `exportCanvasJSON`, `importCanvasJSON`, `exportMaskImage`, `exportMaskImageByLayer`, `exportAllMaskImages`, `getMaskBlob`, `getMaskFile`, `getAllMaskBlobs`, `exportCOCO`, `exportYOLO` |

---

## 3. 非功能需求（NFR）

| 编号 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
| NFR-001 | 组件必须以 TypeScript 开发并对外暴露完整类型 | ⭐⭐⭐ | ✅ |
| NFR-002 | 使用 Composition API + `<script setup>` | ⭐⭐⭐ | ✅ |
| NFR-003 | 构建产物必须同时提供 ESM 和 UMD 两种格式 | ⭐⭐⭐ | ✅ |
| NFR-004 | 构建产物必须包含独立的 CSS 文件（不随 JS 自动注入） | ⭐⭐⭐ | ✅ |
| NFR-005 | 构建产物必须包含 .d.ts 类型声明文件 | ⭐⭐⭐ | ✅ |
| NFR-006 | Vue 3 作为 peerDependency（不打包进产物） | ⭐⭐⭐ | ✅ |
| NFR-007 | 样式文件必须手动 import：`import '@zzalai/leafer-point-annotation/dist/leafer-point-annotation.css'` | ⭐⭐⭐ | ✅ |
| NFR-008 | 使用 pnpm 作为包管理器 | ⭐⭐ | ✅ |
| NFR-009 | GitHub Pages 演示站由 `docs/` 目录提供（通过 `vite.docs.config.ts` 构建） | ⭐⭐⭐ | ✅ |
| NFR-010 | `dist/` 必须干净：仅含 `.es.js` / `.umd.js` / `.css` / `.d.ts` | ⭐⭐⭐ | ✅ |
| NFR-011 | `build:all` 一步构建（dist + docs 同时生成） | ⭐⭐ | ✅ |
| NFR-012 | 中文 README + 英文 README 同步维护 | ⭐⭐ | ✅ |

---

## 4. 约束与边界

| 编号 | 约束/边界 | 说明 |
|------|----------|------|
| C-001 | 仅支持 Vue 3.3+ | 不支持 Vue 2 |
| C-002 | 仅支持图片（jpg/png/webp 等浏览器可加载格式） | 不支持视频/多帧图像 |
| C-003 | 点标注顺序由 `sequenceNumber` 决定，`order` 只表示历史创建顺序 | 历史兼容用 |
| C-004 | 笔刷图层不支持运行时动态增删（只能通过 options.brushLayers 配置，变了会重建） | 避免运行时图层表与已绘制数据不一致 |
| C-005 | enableBrush=false 时，即使 options.brushLayers 有值也不会创建笔刷 canvas | enableBrush 优先级更高 |
| C-006 | 笔刷撤销基于 ImageData 快照；对超大图片，单张快照 ~4*W*H 字节，maxUndoSteps 不宜过大 | 性能注意 |
| C-007 | Mask 导出格式 png/jpeg，jpeg 会丢失透明度（建议 png 用于二值图） | 导出注意 |
| C-008 | getMaskBlob/getMaskFile/getAllMaskBlobs 基于 HTMLCanvasElement.toBlob，必须在浏览器环境（不支持 SSR） | 服务端渲染不适用 |
| C-009 | 套索工具与笔刷共享颜色、透明度、图层设置，使用同一套撤销/重做机制 | 套索本质是笔刷的另一种绘制方式 |
| C-010 | 套索轨迹默认固定屏幕大小（`lassoFixedSizeOnZoom=true`），与标注点 `fixedSizeOnZoom` 概念一致 | 可通过配置关闭 |

---

## 5. 版本与发布流程

### 5.1 构建验证清单（发布前必须全部 ✅）

- [ ] `pnpm run build:all` 执行无错误
- [ ] `dist/` 目录包含：`.es.js`、`.umd.js`、`.css`、`index.d.ts`
- [ ] `docs/` 目录包含最新演示站点（可本地预览验证）
- [ ] `tsc --noEmit` 类型检查通过
- [ ] README.md / README_EN.md 已同步更新
- [ ] `project-docs/` 中文档已同步
- [ ] skills/project-context 文件已更新

### 5.2 发布命令

```bash
# 1. 安装依赖 & 构建
pnpm install
pnpm run build:all

# 2. 升级版本（package.json）
#    例如：手动把 version 从 1.1.2 改为 1.1.3

# 3. 发布
npm publish       # 需已登录 npm 账号，且有 @zzalai 命名空间权限

# 4. 推送到 GitHub（让 GitHub Pages 自动刷新）
git add .
git commit -m "chore: release v1.1.3"
git push
```
