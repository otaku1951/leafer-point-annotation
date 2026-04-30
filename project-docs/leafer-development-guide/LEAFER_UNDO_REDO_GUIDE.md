# @zzalai/leafer-undo-redo 详细指南

## 1. 库的概述

**@zzalai/leafer-undo-redo** 是一个基于命令模式的 LeaferJS 应用程序的健壮且灵活的撤销/重做系统。它为 LeaferJS 应用提供了专业级的撤销/重做功能，支持复杂的用户操作管理。

## 2. 核心功能

### 2.1 基于命令模式
- **清晰的架构**：使用命令模式设计，每个操作都是一个命令对象
- **可扩展性**：易于添加新的命令类型
- **类型安全**：完整的 TypeScript 类型定义

### 2.2 撤销/重做堆栈
- **历史记录管理**：自动维护操作历史
- **堆栈限制**：可配置的历史记录长度限制（默认 50）
- **状态追踪**：提供 `canUndo()` 和 `canRedo()` 方法检查操作状态

### 2.3 内置命令
- **AddElementCommand**：添加元素
- **MoveCommand**：移动元素
- **ResizeCommand**：调整元素大小
- **RemoveElementCommand**：删除元素
- **BatchCommand**：批量命令（将多个操作组合为一个）

## 3. 核心 API

### 3.1 ICommand 接口

```typescript
interface ICommand {
  execute(): void;  // 执行命令
  undo(): void;     // 撤销命令
}
```

### 3.2 CommandManager 类

```typescript
class CommandManager {
  constructor(limit?: number);  // 可选的历史记录限制
  
  executeCommand(command: ICommand): void;  // 执行命令并添加到历史记录
  undo(): void;  // 撤销上一个命令
  redo(): void;  // 重做上一个撤销的命令
  canUndo(): boolean;  // 检查是否可以撤销
  canRedo(): boolean;  // 检查是否可以重做
  clear(): void;  // 清除历史记录
}
```

### 3.3 内置命令

#### AddElementCommand
```typescript
class AddElementCommand implements ICommand {
  constructor(container: any, element: any);
  execute(): void;  // 添加元素到容器
  undo(): void;     // 从容器移除元素
}
```

#### MoveCommand
```typescript
class MoveCommand implements ICommand {
  constructor(target: any, fromX: number, fromY: number, toX: number, toY: number);
  execute(): void;  // 移动到目标位置
  undo(): void;     // 恢复到原始位置
}
```

#### ResizeCommand
```typescript
class ResizeCommand implements ICommand {
  constructor(target: any, fromWidth: number, fromHeight: number, toWidth: number, toHeight: number);
  execute(): void;  // 调整到目标大小
  undo(): void;     // 恢复到原始大小
}
```

#### RemoveElementCommand
```typescript
class RemoveElementCommand implements ICommand {
  constructor(container: any, element: any);
  execute(): void;  // 从容器移除元素
  undo(): void;     // 将元素添加回容器
}
```

#### BatchCommand
```typescript
class BatchCommand implements ICommand {
  constructor(commands: ICommand[]);
  execute(): void;  // 执行所有命令
  undo(): void;     // 撤销所有命令
}
```

## 4. 使用方法

### 4.1 基本用法

```typescript
import { CommandManager, AddElementCommand, MoveCommand } from '@zzalai/leafer-undo-redo';
import { App, Rect } from 'leafer-ui';

// 创建命令管理器
const commandManager = new CommandManager(100); // 历史记录限制为100

// 创建应用实例
const app = new App({...});

// 添加元素
const rect = new Rect({ x: 100, y: 100, width: 50, height: 50, fill: 'red' });
const addCommand = new AddElementCommand(app, rect);
commandManager.executeCommand(addCommand);

// 移动元素
const moveCommand = new MoveCommand(rect, 100, 100, 200, 200);
commandManager.executeCommand(moveCommand);

// 撤销/重做
commandManager.undo();   // 撤销移动
commandManager.undo();   // 撤销添加
commandManager.redo();   // 重做添加
commandManager.redo();   // 重做移动
```

### 4.2 批量命令

```typescript
import { BatchCommand, AddElementCommand } from '@zzalai/leafer-undo-redo';

// 创建多个命令
const commands = [
  new AddElementCommand(app, rect1),
  new AddElementCommand(app, rect2),
  new AddElementCommand(app, rect3)
];

// 创建批量命令
const batchCommand = new BatchCommand(commands);
commandManager.executeCommand(batchCommand);

// 撤销整个批量操作
commandManager.undo();  // 会撤销所有三个添加操作
```

### 4.3 自定义命令

```typescript
import { ICommand } from '@zzalai/leafer-undo-redo';

class ChangeColorCommand implements ICommand {
  private target: any;
  private fromColor: string;
  private toColor: string;

  constructor(target: any, fromColor: string, toColor: string) {
    this.target = target;
    this.fromColor = fromColor;
    this.toColor = toColor;
  }

  execute(): void {
    this.target.set({ fill: this.toColor });
  }

  undo(): void {
    this.target.set({ fill: this.fromColor });
  }
}

// 使用自定义命令
const colorCommand = new ChangeColorCommand(rect, 'red', 'blue');
commandManager.executeCommand(colorCommand);
```

## 5. 集成示例

### 5.1 Vue 组件集成

```vue
<template>
  <div class="annotation-editor">
    <div class="toolbar">
      <button @click="undo" :disabled="!canUndo">撤销</button>
      <button @click="redo" :disabled="!canRedo">重做</button>
    </div>
    <div ref="canvasRef" class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { App, Rect } from 'leafer-ui';
import { CommandManager, AddElementCommand } from '@zzalai/leafer-undo-redo';

const canvasRef = ref<HTMLElement>();
const commandManager = new CommandManager();
let app: App;

const canUndo = computed(() => commandManager.canUndo());
const canRedo = computed(() => commandManager.canRedo());

const undo = () => commandManager.undo();
const redo = () => commandManager.redo();

const addPoint = (x: number, y: number) => {
  const point = new Rect({
    x: x - 5,
    y: y - 5,
    width: 10,
    height: 10,
    fill: '#ff0000'
  });
  
  const command = new AddElementCommand(app, point);
  commandManager.executeCommand(command);
};

onMounted(() => {
  app = new App({
    view: canvasRef.value!,
    width: 800,
    height: 600
  });
  
  // 点击添加点
  app.on('pointerdown', (e: any) => {
    addPoint(e.x, e.y);
  });
});
</script>
```

### 5.2 事件处理集成

```typescript
// 处理元素拖动
app.on('dragend', (e: any) => {
  const target = e.target;
  const moveCommand = new MoveCommand(
    target,
    e.startX,
    e.startY,
    target.x,
    target.y
  );
  commandManager.executeCommand(moveCommand);
});

// 处理元素调整大小
app.on('resizeend', (e: any) => {
  const target = e.target;
  const resizeCommand = new ResizeCommand(
    target,
    e.startWidth,
    e.startHeight,
    target.width,
    target.height
  );
  commandManager.executeCommand(resizeCommand);
});
```

## 6. 最佳实践

### 6.1 性能优化
- **合理设置历史记录限制**：根据应用复杂度调整 `CommandManager` 的历史记录限制
- **使用批量命令**：对于复杂操作，使用 `BatchCommand` 减少历史记录条目
- **命令粒度**：合理设计命令粒度，避免过于细粒度的操作导致历史记录膨胀

### 6.2 错误处理
- **命令执行安全**：确保命令的 `execute()` 和 `undo()` 方法能够安全执行
- **状态验证**：在执行命令前验证目标元素的状态
- **异常处理**：在命令执行过程中添加适当的异常处理

### 6.3 测试建议
- **单元测试**：为自定义命令编写单元测试
- **集成测试**：测试命令管理器与应用的集成
- **边界测试**：测试历史记录限制、空操作等边界情况

## 7. 常见问题

### 7.1 命令执行失败
**问题**：命令执行后无法撤销
**解决方案**：确保命令的 `execute()` 和 `undo()` 方法能够正确恢复状态

### 7.2 历史记录过大
**问题**：历史记录占用过多内存
**解决方案**：设置合理的历史记录限制，使用批量命令减少条目

### 7.3 并发操作冲突
**问题**：多个操作同时执行导致状态不一致
**解决方案**：确保命令执行的原子性，避免并发修改

## 8. 未来扩展

- **命令序列化**：支持命令历史的保存和加载
- **命令优先级**：为命令添加优先级机制
- **命令分组**：支持命令的逻辑分组
- **自定义历史记录存储**：允许自定义历史记录的存储方式

## 9. 技术细节

### 9.1 命令模式原理

命令模式将请求封装为对象，使得可以用不同的请求参数化客户端，支持可撤销操作。在 LeaferJS 应用中，每个用户操作都被封装为一个命令对象，通过 CommandManager 管理执行和撤销。

### 9.2 堆栈实现

- **撤销堆栈**：存储已执行的命令，按执行顺序排列
- **重做堆栈**：存储已撤销的命令，按撤销顺序排列
- **堆栈清理**：当执行新命令时，清空重做堆栈

## 10. 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2026-01-01 | 初始版本 |
| 1.0.1 | 2026-02-15 | 修复批量命令执行顺序 |
| 1.0.2 | 2026-03-20 | 添加命令历史限制功能 |
| 1.0.3 | 2026-04-10 | 优化命令执行性能 |

---

**文档更新时间**：2026-04-27
**作者**：AI Assistant