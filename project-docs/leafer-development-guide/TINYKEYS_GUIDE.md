# tinykeys 热键系统使用指南

## 1. 库的概述

**tinykeys** 是一个轻量级的 JavaScript 热键系统库，它提供了简洁而强大的 API 来处理键盘快捷键。它的设计理念是简单易用，同时支持复杂的键盘组合和事件处理。

## 2. 核心功能

### 2.1 轻量级设计
- **体积小**：压缩后只有几 KB
- **无依赖**：纯 JavaScript 实现，无外部依赖
- **高性能**：事件处理高效，不会影响页面性能

### 2.2 灵活的键位定义
- **支持单个键**：如 `'v'`、`'p'`、`'b'`
- **支持组合键**：如 `'$mod+KeyZ'`（Ctrl/Command+Z）
- **支持修饰键**：如 `'Shift+'`、`'Alt+'`、`'Ctrl+'`
- **支持序列键**：如 `'g g'`（快速按两次 G）

### 2.3 强大的事件处理
- **事件阻止**：可选择是否阻止默认事件
- **事件冒泡控制**：可控制事件是否冒泡
- **上下文感知**：可根据当前上下文启用或禁用热键

## 3. 核心 API

### 3.1 基本用法

```typescript
import { tinykeys } from 'tinykeys';

// 注册热键
const unsubscribe = tinykeys(window, {
  // 单个键
  'v': (event) => {
    event.preventDefault();
    // 执行选择工具
  },
  
  // 组合键
  '$mod+KeyZ': (event) => {
    event.preventDefault();
    // 撤销操作
  },
  
  // 序列键
  'g g': (event) => {
    event.preventDefault();
    // 执行全局操作
  }
});

// 清理热键
unsubscribe();
```

### 3.2 键位语法

| 语法 | 描述 | 示例 |
|------|------|------|
| 单个字符 | 单个按键 | `'v'`, `'p'` |
| `$mod` | 修饰键（Ctrl/Command） | `'$mod+KeyZ'` |
| `Shift+` | Shift 修饰键 | `'Shift+KeyA'` |
| `Alt+` | Alt 修饰键 | `'Alt+KeyS'` |
| `Ctrl+` | Ctrl 修饰键 | `'Ctrl+KeyD'` |
| 空格 | 键位序列 | `'g g'`（按两次 G） |

### 3.3 事件对象

```typescript
interface TinyKeysEvent extends KeyboardEvent {
  // 原始 KeyboardEvent 属性
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  
  // 方法
  preventDefault(): void;
  stopPropagation(): void;
}
```

## 4. 高级用法

### 4.1 上下文感知热键

```typescript
// 只在画布区域启用热键
const canvasElement = document.getElementById('canvas');
let isCanvasFocused = false;

canvasElement?.addEventListener('focus', () => {
  isCanvasFocused = true;
});

canvasElement?.addEventListener('blur', () => {
  isCanvasFocused = false;
});

tinykeys(window, {
  'v': (event) => {
    if (!isCanvasFocused) return; // 只在画布聚焦时生效
    event.preventDefault();
    // 执行选择工具
  }
});
```

### 4.2 动态热键映射

```typescript
// 可配置的热键映射
const hotkeyMap = {
  selectTool: 'v',
  pointTool: 'p',
  brushTool: 'b',
  undo: '$mod+KeyZ',
  redo: '$mod+KeyY'
};

const handlers = {
  selectTool: () => { /* 处理选择工具 */ },
  pointTool: () => { /* 处理点工具 */ },
  brushTool: () => { /* 处理笔刷工具 */ },
  undo: () => { /* 处理撤销 */ },
  redo: () => { /* 处理重做 */ }
};

// 动态生成热键配置
const hotkeyConfig: Record<string, (event: KeyboardEvent) => void> = {};

Object.entries(hotkeyMap).forEach(([action, key]) => {
  hotkeyConfig[key] = (event) => {
    event.preventDefault();
    handlers[action as keyof typeof handlers]();
  };
});

tinykeys(window, hotkeyConfig);
```

### 4.3 热键提示

```typescript
// 生成热键提示
const getHotkeyHint = (action: string): string => {
  const hotkeyMap: Record<string, string> = {
    selectTool: 'V',
    pointTool: 'P',
    brushTool: 'B',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y'
  };
  return hotkeyMap[action] || '';
};

// 在 UI 中显示热键提示
const toolButton = document.createElement('button');
toolButton.innerHTML = `
  选择工具
  <span class="hotkey-hint">${getHotkeyHint('selectTool')}</span>
`;
```

## 5. 集成示例

### 5.1 Vue 组件集成

```vue
<template>
  <div class="annotation-editor">
    <div class="toolbar">
      <button 
        class="tool-button" 
        :class="{ active: currentTool === 'select' }"
        @click="selectTool"
        title="选择工具 (V)"
      >
        选择
        <span class="hotkey-hint" v-if="showHotkeys">V</span>
      </button>
      <button 
        class="tool-button" 
        :class="{ active: currentTool === 'point' }"
        @click="pointTool"
        title="点标注工具 (P)"
      >
        点标注
        <span class="hotkey-hint" v-if="showHotkeys">P</span>
      </button>
      <button 
        class="tool-button" 
        :class="{ active: currentTool === 'brush' }"
        @click="brushTool"
        title="笔刷工具 (B)"
      >
        笔刷
        <span class="hotkey-hint" v-if="showHotkeys">B</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { tinykeys } from 'tinykeys';

const currentTool = ref<'select' | 'point' | 'brush'>('select');
const showHotkeys = ref(true);

const selectTool = () => currentTool.value = 'select';
const pointTool = () => currentTool.value = 'point';
const brushTool = () => currentTool.value = 'brush';

onMounted(() => {
  const unsubscribe = tinykeys(window, {
    'v': (event) => {
      event.preventDefault();
      selectTool();
    },
    'p': (event) => {
      event.preventDefault();
      pointTool();
    },
    'b': (event) => {
      event.preventDefault();
      brushTool();
    }
  });
  
  // 存储清理函数
  window.__tinykeysUnsubscribe = unsubscribe;
});

onUnmounted(() => {
  window.__tinykeysUnsubscribe?.();
});
</script>

<style scoped>
.tool-button {
  position: relative;
  padding: 8px 12px;
  margin: 0 4px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.tool-button.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.hotkey-hint {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: #999;
  background: #f5f5f5;
  padding: 1px 4px;
  border-radius: 2px;
}
</style>
```

### 5.2 React 组件集成

```tsx
import React, { useEffect, useState } from 'react';
import { tinykeys } from 'tinykeys';

const AnnotationEditor: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<'select' | 'point' | 'brush'>('select');
  const [showHotkeys, setShowHotkeys] = useState(true);

  useEffect(() => {
    const unsubscribe = tinykeys(window, {
      'v': (event) => {
        event.preventDefault();
        setCurrentTool('select');
      },
      'p': (event) => {
        event.preventDefault();
        setCurrentTool('point');
      },
      'b': (event) => {
        event.preventDefault();
        setCurrentTool('brush');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="annotation-editor">
      <div className="toolbar">
        <button 
          className={`tool-button ${currentTool === 'select' ? 'active' : ''}`}
          onClick={() => setCurrentTool('select')}
          title="选择工具 (V)"
        >
          选择
          {showHotkeys && <span className="hotkey-hint">V</span>}
        </button>
        <button 
          className={`tool-button ${currentTool === 'point' ? 'active' : ''}`}
          onClick={() => setCurrentTool('point')}
          title="点标注工具 (P)"
        >
          点标注
          {showHotkeys && <span className="hotkey-hint">P</span>}
        </button>
        <button 
          className={`tool-button ${currentTool === 'brush' ? 'active' : ''}`}
          onClick={() => setCurrentTool('brush')}
          title="笔刷工具 (B)"
        >
          笔刷
          {showHotkeys && <span className="hotkey-hint">B</span>}
        </button>
      </div>
    </div>
  );
};

export default AnnotationEditor;
```

## 6. 最佳实践

### 6.1 热键设计原则
- **一致性**：遵循操作系统和常见应用的热键约定
- **可发现性**：在 UI 中显示热键提示
- **可定制性**：允许用户自定义热键
- **冲突避免**：避免与浏览器默认热键冲突

### 6.2 性能优化
- **事件委托**：使用事件委托减少事件监听器数量
- **条件执行**：只在必要时处理热键事件
- **及时清理**：组件卸载时清理热键监听器

### 6.3 用户体验
- **反馈机制**：热键触发时提供视觉或听觉反馈
- **容错处理**：允许一定的按键延迟和错误
- **帮助系统**：提供热键帮助文档

## 7. 常见问题

### 7.1 热键不生效
**问题**：注册的热键没有响应
**解决方案**：
- 检查键位语法是否正确
- 确保事件没有被其他处理程序阻止
- 检查上下文条件是否满足

### 7.2 热键冲突
**问题**：自定义热键与浏览器默认热键冲突
**解决方案**：
- 选择不常用的键位组合
- 在特定上下文下启用热键
- 提供热键冲突检测

### 7.3 序列键不工作
**问题**：序列键（如 `'g g'`）不响应
**解决方案**：
- 确保按键速度足够快
- 检查是否有其他事件处理程序干扰
- 调整序列键的超时设置

## 8. 浏览器兼容性

| 浏览器 | 支持情况 | 备注 |
|--------|----------|------|
| Chrome | ✅ | 完全支持 |
| Firefox | ✅ | 完全支持 |
| Safari | ✅ | 完全支持 |
| Edge | ✅ | 完全支持 |
| IE 11 | ❌ | 不支持 |

## 9. 与其他库的比较

| 库 | 体积 | 功能 | 易用性 | 依赖 |
|----|------|------|--------|------|
| tinykeys | 极小 | 基础热键 | 高 | 无 |
| Mousetrap | 中等 | 丰富 | 中 | 无 |
| keymaster | 小 | 基础 | 高 | 无 |
| hotkeys-js | 中等 | 丰富 | 中 | 无 |

## 10. 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2023-01-01 | 初始版本 |
| 2.0.0 | 2024-06-15 | 重构 API，支持序列键 |
| 3.0.0 | 2025-03-10 | 优化性能，增加 TypeScript 支持 |

---

**文档更新时间**：2026-04-27
**作者**：AI Assistant