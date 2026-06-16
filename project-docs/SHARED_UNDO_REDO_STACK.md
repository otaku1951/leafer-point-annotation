# 多实例共享撤销/重做栈 — 设计与实现文档

> **版本**: v1.0  |  **状态**: 方案已确定，待实现  |  **对应组件**: `src/components/PointAnnotation.vue`
>
> **适用场景**: 业务上需要多个 PointAnnotation 编辑器共用一个 undo/redo 栈
> （例如：在编辑器 A 创建点标注 → 在编辑器 B 涂抹笔刷 → 按一次 Ctrl+Z 撤销 B 的涂抹 → 再按一次 Ctrl+Z 撤销 A 的点标注）

---

## 1. 设计思路

### 1.1 核心机制：Vue 的 provide / inject

- **父组件**：`provide(KEY, new CommandManager(200))` — 创建一个共享的撤销/重做管理器
- **子组件（每个 PointAnnotation）**：`inject(KEY, null)` — 优先使用父组件注入的共享实例
- **无注入时**：子组件自动创建本地独立的 CommandManager（**100% 向后兼容**）

### 1.2 为什么不需要修改 BrushCommands.ts / PointCommands.ts？

当前的命令对象（`BrushSnapshotCommand`、`AddPointCommand`、`RemovePointCommand`）已经基于**对象引用**实现，命令内部只操作它被创建时传入的具体对象（某实例的 `canvasBrush`、`pointLayer`、`pointAnnotations`）。

当共享 CommandManager 执行 undo 时，命令会自动操作属于那个实例的内部对象——**天然支持跨实例**，无需改动。

### 1.3 全局快捷键的归属

- **独立模式（默认）**：每个 PointAnnotation 自己通过 tinykeys 监听 `Ctrl+Z` / `Ctrl+Y`
- **共享模式**：子组件不绑定这两个快捷键，**由父组件统一监听**，执行 `sharedManager.undo()` 后再让所有子实例调用 `refreshUI()` 刷新各自 UI

---

## 2. 精确修改清单

**修改文件**：`src/components/PointAnnotation.vue`（仅此一个文件）
**无需修改**：`src/utils/BrushCommands.ts`、`src/utils/PointCommands.ts`、`src/App.vue`（按需增加演示）

---

### 修改 1：import 区域 — 增加 inject 与 inject key

**位置**：第 272 行附近（第一个 `import from "vue"` 处）

**旧代码**：
```ts
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import {
  App,
  ImageEvent,
  PointerEvent,
  ZoomEvent,
  Image,
  Group,
} from "leafer-ui";
```

**新代码**：
```ts
import { ref, onMounted, onUnmounted, nextTick, computed, watch, inject } from "vue";

// 共享撤销/重做栈：provide/inject key
// 父组件：provide(POINT_ANNOTATION_COMMAND_MANAGER_KEY, new CommandManager(200))
// 多个 PointAnnotation 子组件将自动共享同一个 undo/redo 栈
export const POINT_ANNOTATION_COMMAND_MANAGER_KEY = 'pointAnnotationCommandManager';

import {
  App,
  ImageEvent,
  PointerEvent,
  ZoomEvent,
  Image,
  Group,
} from "leafer-ui";
```

---

### 修改 2：CommandManager 声明 — 从 let 改为 inject + local 组合

**位置**：第 525 行附近（原 `// 撤销/重做管理器` 处）

**旧代码**：
```ts
// 撤销/重做管理器
let commandManager: CommandManager | null = null;

// 多实例支持：tinykeys 解绑函数
let hotkeysUnsubscribe: (() => void) | null = null;
```

**新代码**：
```ts
// 撤销/重做管理器
// 共享模式：优先从父组件 inject 共享的 CommandManager（多实例共用一个 undo/redo 栈）
const injectedCommandManager = inject<CommandManager | null>(POINT_ANNOTATION_COMMAND_MANAGER_KEY, null);
const isSharedCommandManager = injectedCommandManager !== null;
let localCommandManager: CommandManager | null = null;
const getCommandManager = () => injectedCommandManager ?? localCommandManager;

// 多实例支持：tinykeys 解绑函数
let hotkeysUnsubscribe: (() => void) | null = null;
```

**关键点**：
- `injectedCommandManager` 可能是 `null`（独立模式）或一个共享实例（共享模式）
- `isSharedCommandManager` 是布尔值，用于 tinykeys 绑定决策
- `getCommandManager()` 统一返回「当前应该使用的」CommandManager，调用方无需知道是共享还是独立
- 全文所有 `commandManager.xxx` 的调用全部替换为 `getCommandManager()!.xxx`（见下文修改 6）

---

### 修改 3：onMounted — 共享模式下不新建本地实例

**位置**：原第 1024-1025 行附近（onMounted 内 `// 初始化撤销/重做管理器` 处）

**旧代码**：
```ts
    // 初始化撤销/重做管理器
    commandManager = new CommandManager(100);
```

**新代码**：
```ts
    // 初始化撤销/重做管理器
    // 共享模式：使用父组件注入的实例；独立模式：创建本地实例
    if (!isSharedCommandManager) {
      localCommandManager = new CommandManager(100);
    }
```

---

### 修改 4：tinykeys — 共享模式下不绑定 Ctrl+Z / Ctrl+Y

**位置**：原第 1054-1065 行附近（tinykeys 配置对象内）

**旧代码**：
```ts
      "$mod+KeyZ": (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        event.stopPropagation();
        undo();
      },
      "$mod+KeyY": (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        event.stopPropagation();
        redo();
      },
```

**新代码**：
```ts
      // 共享模式：undo/redo 由父组件统一监听，避免多实例重复响应
      // （独立模式下保持组件内部快捷键）
      ...(isSharedCommandManager ? {} : {
        "$mod+KeyZ": (event: KeyboardEvent) => {
          if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
          event.preventDefault();
          event.stopPropagation();
          undo();
        },
        "$mod+KeyY": (event: KeyboardEvent) => {
          if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
          event.preventDefault();
          event.stopPropagation();
          redo();
        },
      }),
```

**说明**：用展开运算符实现「条件性包含」两个快捷键。共享模式下这两项被替换为空对象，由父组件统一管理。

---

### 修改 5：undo/redo — 抽取 refreshUI，改用 getCommandManager

**位置**：原第 1738-1752 行附近

**旧代码**：
```ts
const undo = () => {
  if (commandManager?.canUndo()) {
    commandManager.undo();
    renumberSequenceNumbers();
    emit("pointChange", [...pointAnnotations.value]);
  }
};

const redo = () => {
  if (commandManager?.canRedo()) {
    commandManager.redo();
    renumberSequenceNumbers();
    emit("pointChange", [...pointAnnotations.value]);
  }
};
```

**新代码**：
```ts
// 刷新本实例的 UI：重新编号 + 通知父组件
// 在共享模式下，父组件调用 sharedManager.undo() 后，
// 需要对每个子实例调用此方法，确保 UI 和 emit 同步
const refreshUI = () => {
  renumberSequenceNumbers();
  emit("pointChange", [...pointAnnotations.value]);
};

const undo = () => {
  const cm = getCommandManager();
  if (cm?.canUndo()) {
    cm.undo();
    refreshUI();
  }
};

const redo = () => {
  const cm = getCommandManager();
  if (cm?.canRedo()) {
    cm.redo();
    refreshUI();
  }
};
```

**关键点**：`refreshUI()` 会暴露到 defineExpose 中（见修改 7），父组件在共享模式下调用 `sharedManager.undo()` 后需要 `for...of` 所有子实例逐个调用 `refreshUI()`。

---

### 修改 6：全文所有 `commandManager.xxx` → `getCommandManager()!.xxx`（共 7 处）

以下按行号精确列出每一处的替换。每处的模式都是：

```
if (commandManager) {                 →    if (getCommandManager()) {
  ...                                  →      ...
  commandManager.executeCommand(...)   →      getCommandManager()!.executeCommand(...)
}                                      →    }
```

**6A. handleBrushUp — 笔刷抬起后保存快照**

位置：原第 1398-1400 行
```ts
// 旧
if (commandManager && brushSnapshotLayer && canvasBrushesByLayer.value[brushSnapshotLayer] && brushSnapshotBeforeDraw) {
    const snapshotCommand = new BrushSnapshotCommand(canvasBrushesByLayer.value[brushSnapshotLayer], brushSnapshotBeforeDraw);
    commandManager.executeCommand(snapshotCommand);
// 新
if (getCommandManager() && brushSnapshotLayer && canvasBrushesByLayer.value[brushSnapshotLayer] && brushSnapshotBeforeDraw) {
    const snapshotCommand = new BrushSnapshotCommand(canvasBrushesByLayer.value[brushSnapshotLayer], brushSnapshotBeforeDraw);
    getCommandManager()!.executeCommand(snapshotCommand);
```

**6B. 添加点标注**

位置：原第 1549-1551 行
```ts
// 旧
  if (commandManager) {
    const addCommand = new AddPointCommand(pointLayer, pointElement, pointAnnotations.value, pointData);
    commandManager.executeCommand(addCommand);
  } else {
// 新
  const cm = getCommandManager();
  if (cm) {
    const addCommand = new AddPointCommand(pointLayer, pointElement, pointAnnotations.value, pointData);
    cm.executeCommand(addCommand);
  } else {
```

**6C. 删除选中点（editor select 删除）**

位置：原第 1609-1611 行
```ts
// 旧
      if (commandManager) {
        const removeCommand = new RemovePointCommand(pointLayer, element, pointAnnotations.value);
        commandManager.executeCommand(removeCommand);
      } else {
// 新
      if (getCommandManager()) {
        const removeCommand = new RemovePointCommand(pointLayer, element, pointAnnotations.value);
        getCommandManager()!.executeCommand(removeCommand);
      } else {
```

**6D. clearBrush — 清除当前图层的笔刷**

位置：原第 1657-1660 行
```ts
// 旧
    if (commandManager) {
      const beforeSnapshot = activeCanvasBrush.value.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(activeCanvasBrush.value, beforeSnapshot, true);
      commandManager.executeCommand(snapshotCommand);
    }
// 新
    if (getCommandManager()) {
      const beforeSnapshot = activeCanvasBrush.value.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(activeCanvasBrush.value, beforeSnapshot, true);
      getCommandManager()!.executeCommand(snapshotCommand);
    }
```

**6E. clearAllBrushLayers — 清除所有图层的笔刷**

位置：原第 1672-1675 行
```ts
// 旧
    if (commandManager) {
      const beforeSnapshot = brush.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(brush, beforeSnapshot, true);
      commandManager.executeCommand(snapshotCommand);
    }
// 新
    if (getCommandManager()) {
      const beforeSnapshot = brush.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(brush, beforeSnapshot, true);
      getCommandManager()!.executeCommand(snapshotCommand);
    }
```

**6F. createBrushFromPoints — 从标注点轨迹生成笔刷区域**

位置：原第 1731-1733 行
```ts
// 旧
  if (commandManager) {
    const snapshotCommand = new BrushSnapshotCommand(brush, beforeSnapshot);
    commandManager.executeCommand(snapshotCommand);
  }
// 新
  if (getCommandManager()) {
    const snapshotCommand = new BrushSnapshotCommand(brush, beforeSnapshot);
    getCommandManager()!.executeCommand(snapshotCommand);
  }
```

**6G. removePointAnnotation — 按索引删除指定点（ref API 调用）**

位置：原第 1790-1792 行
```ts
// 旧
  if (commandManager) {
    const removeCommand = new RemovePointCommand(pointLayer, element as any, pointAnnotations.value);
    commandManager.executeCommand(removeCommand);
  } else {
// 新
  if (getCommandManager()) {
    const removeCommand = new RemovePointCommand(pointLayer, element as any, pointAnnotations.value);
    getCommandManager()!.executeCommand(removeCommand);
  } else {
```

---

### 修改 7：defineExpose — 暴露 3 个新方法

**位置**：原第 1867-1869 行附近（defineExpose 的末尾 `});` 前）

在 `updateBrushStyle,` 之后、`});` 之前插入：

```ts
  updateBrushStyle,
  // 共享撤销/重做栈支持
  refreshUI,  // 父组件调用 sharedManager.undo()/redo() 后，调用此方法刷新本实例 UI 并 emit pointChange
  getCommandManager,  // 获取当前使用的 CommandManager（共享或本地）
  isSharedCommandManager: () => isSharedCommandManager,  // 是否使用共享模式
});
```

---

## 3. 修改完成后：父组件使用示例

在任意父组件中实现以下代码，即可开启多实例共享撤销栈：

```vue
<script setup lang="ts">
import { provide, ref, onMounted, onUnmounted } from 'vue'
import PointAnnotation, { POINT_ANNOTATION_COMMAND_MANAGER_KEY } from '@/components/PointAnnotation.vue'
import { CommandManager } from '@zzalai/leafer-undo-redo'
// @ts-ignore — tinykeys 类型声明问题
import { tinykeys } from 'tinykeys'

// ============================================================
// 1️⃣ 创建共享的 CommandManager，所有子实例共享一个 undo/redo 栈
// ============================================================
const sharedManager = new CommandManager(200)
provide(POINT_ANNOTATION_COMMAND_MANAGER_KEY, sharedManager)

// ============================================================
// 2️⃣ 子组件 ref（用于共享模式下 undo/redo 后调用 refreshUI）
// ============================================================
const ann1 = ref<InstanceType<typeof PointAnnotation> | null>(null)
const ann2 = ref<InstanceType<typeof PointAnnotation> | null>(null)

// ============================================================
// 3️⃣ 父组件统一监听 Ctrl+Z / Ctrl+Y
//    （子组件在共享模式下不绑定这些快捷键）
// ============================================================
let hotkeysUnsubscribe: (() => void) | null = null

onMounted(() => {
  hotkeysUnsubscribe = tinykeys(window, {
    '$mod+KeyZ': (e) => {
      e.preventDefault()
      e.stopPropagation()
      // 先在共享栈中执行撤销
      sharedManager.undo()
      // 关键：让所有子实例刷新 UI 和 emit pointChange
      // （即使某个子实例的命令不是这次 undo 的目标，调用 refreshUI 也无副作用
      //  ——renumberSequenceNumbers 是幂等的，pointChange 只是重新 emit 一次）
      ann1.value?.refreshUI()
      ann2.value?.refreshUI()
    },
    '$mod+KeyY': (e) => {
      e.preventDefault()
      e.stopPropagation()
      sharedManager.redo()
      ann1.value?.refreshUI()
      ann2.value?.refreshUI()
    },
  })
})

onUnmounted(() => {
  if (hotkeysUnsubscribe) {
    hotkeysUnsubscribe()
    hotkeysUnsubscribe = null
  }
})
</script>

<template>
  <div style="display: flex; gap: 12px;">
    <PointAnnotation
      ref="ann1"
      :options="{ enableBrush: true }"
      :imageSource="{ url: 'https://example.com/image1.png' }"
    />
    <PointAnnotation
      ref="ann2"
      :options="{ enableBrush: true }"
      :imageSource="{ url: 'https://example.com/image2.png' }"
    />
  </div>
</template>
```

---

## 4. 验证步骤

实现完成后，按以下步骤自测：

1. `pnpm run build:all` — 确认 TypeScript 类型、CSS、构建产物全部通过
2. `pnpm run dev` 启动开发服务器
3. 打开包含两个并排 PointAnnotation 的演示页
4. **左编辑器**：创建 2 个点标注 → 观察控制台 emit 正常
5. **右编辑器**：用笔刷涂抹一块区域 → 观察控制台 emit 正常
6. 按一次 `Ctrl+Z` → 右编辑器的涂抹被撤销 ✅
7. 按一次 `Ctrl+Z` → 左编辑器最后一个点被撤销 ✅
8. 按 `Ctrl+Y`（重做） → 左编辑器的点恢复 ✅
9. **不提供 provide(POINT_ANNOTATION_COMMAND_MANAGER_KEY, ...) 时**，两个编辑器应该各自独立的 undo/redo 栈（验证向后兼容）

---

## 5. 兼容性与风险评估

| 风险点 | 评估 | 应对方式 |
|--------|------|---------|
| 独立模式行为变化 | ✅ 无变化 | 无 inject 时自动创建本地 CommandManager，行为与原版一致 |
| 共享模式下 refreshUI 多次调用 | ✅ 安全 | renumberSequenceNumbers 是幂等操作；多次 emit pointChange 只是数据重复广播，无副作用 |
| `POINT_ANNOTATION_COMMAND_MANAGER_KEY` 命名冲突 | ✅ 极低 | 使用足够具体的字符串，且使用组件导出的常量 |
| 共享栈容量限制 | ⚠️ 需注意 | 父组件创建时自行指定 `new CommandManager(200)`，容量按业务场景评估 |
| 父组件忘记调用 `refreshUI()` | ⚠️ 需要文档约束 | 共享模式下 undo/redo 由父组件驱动，必须调用所有子实例的 `refreshUI()` |

---

## 6. 实现用时预估

| 步骤 | 预估耗时 | 说明 |
|------|---------|------|
| 修改 1-7 代码 | 约 30 分钟 | 按本文档逐段替换 |
| 更新 App.vue 增加演示用例 | 约 15 分钟 | 复制第 3 节示例代码 |
| 构建 + 自测 | 约 15 分钟 | 运行 `pnpm run build:all` + 手动自测 |
| **总计** | **约 1 小时** | |

---

## 7. 变更后暴露给外部的新 API

| 名称 | 类型 | 说明 |
|------|------|------|
| `POINT_ANNOTATION_COMMAND_MANAGER_KEY` | `string` (export) | provide/inject 的 key，父组件 import 后传入 `provide` |
| `refreshUI()` | `ref` 方法 | 刷新本实例 UI（重编号 + emit pointChange），共享模式下父组件在 undo/redo 后调用 |
| `getCommandManager()` | `ref` 方法 | 返回当前使用的 CommandManager（共享实例或本地实例） |
| `isSharedCommandManager()` | `ref` 方法 | 返回布尔值，标识当前是否处于共享模式 |

---

_EOF_
