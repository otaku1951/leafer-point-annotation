<template>
  <div
    class="point-annotation"
    @focus="isCanvasFocused = true"
    @blur="isCanvasFocused = false"
    @mouseenter="isMouseOverCanvas = true"
    @mouseleave="isMouseOverCanvas = false"
  >
    <!-- 画布容器 -->
    <div ref="canvasContainer" class="canvas-container" tabindex="0">
      <!-- 加载占位 -->
      <div
        v-if="loadStatus === 'loading'"
        class="loading-overlay"
      >
        <div class="gradient-animation"></div>
        <div class="loading-text">图片加载中</div>
      </div>

      <!-- 错误状态 -->
      <div v-if="loadStatus === 'error'" class="error-overlay">
        <p>加载失败</p>
        <button @click="loadImage()">重试</button>
      </div>

      <!-- 缩放控制器 -->
      <div class="zoom-controller">
        <button class="zoom-button" title="缩小 (Ctrl+-)" @click="zoomOut">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="hotkey-hint" v-if="showHotkeys">Ctrl+-</span>
        </button>
        <div
          class="zoom-value"
          @click="resetZoom"
          title="点击重置为100% (Ctrl+0)"
        >
          {{ zoomLevel }}%
          <span class="hotkey-hint" v-if="showHotkeys">Ctrl+0</span>
        </div>
        <button class="zoom-button" title="放大 (Ctrl++)" @click="zoomIn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="hotkey-hint" v-if="showHotkeys">Ctrl++</span>
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <button
        class="tool-button"
        :class="{ active: currentTool === 'select' }"
        title="选择工具 (V)"
        @click="selectTool"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-mouse-pointer2-icon lucide-mouse-pointer-2"
        >
          <path
            d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
          />
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">V</span>
      </button>
      <button
        class="tool-button"
        :class="{ active: currentTool === 'point' }"
        title="点标注工具 (P)"
        @click="pointTool"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">P</span>
      </button>
      <button
        class="tool-button"
        :class="{ active: currentTool === 'brush' }"
        title="笔刷工具 (B)"
        @click="brushTool"
        ref="brushButtonRef"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path>
          <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path>
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">B</span>
      </button>
      <button
        class="tool-button"
        :class="{ active: currentTool === 'eraser' }"
        title="橡皮擦工具 (E)"
        @click="eraserTool"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 20H7L3 16C2.4 15.4 2.4 14.4 3 13.8L13.8 3C14.4 2.4 15.4 2.4 16 3L21 8C21.6 8.6 21.6 9.6 21 10.2L10.2 21C9.6 21.6 8.6 21.6 8 21L3 16"></path>
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">E</span>
      </button>
      <!-- 笔刷大小调整 -->
      <!-- <div v-if="currentTool === 'brush' || currentTool === 'eraser'" class="size-control">
        <div class="size-label">大小</div>
        <input
          type="range"
          class="size-slider"
          :min="localBrushStyle.minSize"
          :max="localBrushStyle.maxSize"
          v-model="localBrushStyle.size"
        />
        <div class="size-value">{{ localBrushStyle.size }}</div>
      </div> -->
      <button class="tool-button" title="撤销 (Ctrl+Z)" @click="undo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">Ctrl+Z</span>
      </button>
      <button class="tool-button" title="重做 (Ctrl+Y)" @click="redo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 7v6h-6"></path>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">Ctrl+Y</span>
      </button>
      <button class="tool-button" title="删除 (Delete)" @click="deleteSelected">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
        <span class="hotkey-hint" v-if="showHotkeys">Del</span>
      </button>
    </div>
  </div>
  
  <!-- 笔刷样式配置面板 -->
  <BrushStylePanel
    :visible="showBrushPanel"
    :brush-style="localBrushStyle"
    :button-rect="brushButtonRect"
    @close="closeBrushPanel"
    @update="updateBrushStyle"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import {
  App,
  ImageEvent,
  PointerEvent,
  ZoomEvent,
  Image,
  Rect,
  Group,
  DragEvent,
} from "leafer-ui";
import "@leafer-in/editor";
import "@leafer-in/resize";
import "@leafer-in/viewport";
import "@leafer-in/view";
import { EditorEvent } from '@leafer-in/editor'
import { CommandManager } from '@zzalai/leafer-undo-redo'
import { AddPointCommand, RemovePointCommand } from '@/utils/PointCommands';
import { BrushSnapshotCommand } from '@/utils/BrushCommands';

// @ts-ignore - tinykeys 类型声明问题
import { tinykeys } from "tinykeys";

import { PointAnnotationElement } from "@/elements/PointAnnotationElement";
import { CanvasBrush } from "@/utils/CanvasBrush";
import BrushStylePanel from "./BrushStylePanel.vue";
import type { PointAnnotation, PointStyle, BrushStyle } from "@/types";
import { DEFAULT_POINT_STYLE, DEFAULT_BRUSH_STYLE } from "@/types";

// Props
export interface ImageSource {
  id?: string;
  url: string;
}

export interface OptionsSource {
  pointStyle?: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    width: number;
    height: number;
  };
  brushStyle?: BrushStyle;
  selectedPointStyle?: {
    fill: string;
    stroke: string;
    strokeWidth?: number;
  };
  maxPoints?: number;
  maxUndoSteps?: number;
}

const props = defineProps({
  imageSource: {
    type: Object as () => ImageSource,
    required: true,
  },
  options: {
    type: Object as () => OptionsSource,
    default: () => ({}),
  },
});

const emit = defineEmits([
  "pointChange",
  "loadStart",
  "loadSuccess",
  "loadError",
  "undoStateChange",
  "redoStateChange",
]);

const canvasContainer = ref<HTMLElement | undefined>(undefined);
const loadStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const imageWidth = ref<number | null>(null);
const imageHeight = ref<number | null>(null);
let app: App | null = null;
let imageBox: Image | null = null;
const contentLayer = new Group({ name: "contentLayer" });
const pointLayer = new Group({ name: "pointLayer" });

const mousePosition = ref({ x: 0, y: 0 });
const isCanvasFocused = ref(false);
const isMouseOverCanvas = ref(false);
const showHotkeys = ref(false);
const currentTool = ref<"select" | "point" | "brush" | "eraser">("select");
const zoomLevel = ref<number>(100);

// 笔刷配置面板相关
const brushButtonRef = ref<HTMLElement | undefined>(undefined);
const showBrushPanel = ref(false);
const brushButtonRect = ref<DOMRect | null>(null);

// 点标注数据
const pointAnnotations = ref<PointAnnotation[]>([]);
const pointCounter = ref(1);

// 点标注样式配置
const pointStyle = computed<PointStyle>(() => ({
  ...DEFAULT_POINT_STYLE,
  ...props.options?.pointStyle,
}));

// 笔刷样式配置
const brushStyle = computed<BrushStyle>(() => ({
  ...DEFAULT_BRUSH_STYLE,
  ...props.options?.brushStyle,
}));

// 本地响应式笔刷状态（用于滑块调整）
const localBrushStyle = ref<BrushStyle>({
  ...DEFAULT_BRUSH_STYLE,
  ...props.options?.brushStyle,
});

// 监听 prop 变化，同步到本地状态
watch(brushStyle, (newVal: BrushStyle) => {
  localBrushStyle.value = { ...newVal };
}, { immediate: true });

// 监听笔刷透明度变化，更新 CanvasBrush 的 Group 透明度
watch(
  () => localBrushStyle.value.opacity,
  (newOpacity) => {
    if (canvasBrush) {
      canvasBrush.setOpacity(newOpacity);
    }
  }
);

// 笔刷相关状态
let canvasBrush: CanvasBrush | null = null;
const isDrawing = ref(false);

// 撤销/重做管理器
let commandManager: CommandManager | null = null;

// 根据配置强制【标注点】不跟随画布Scale变化
const changePointScaleRelativeCanvas = (pointAnnotationLayer: Group | null) => {
  // 检查是否开启固定大小功能
  if (!pointStyle.value.fixedSizeOnZoom) return;
  
  if (pointAnnotationLayer && pointAnnotationLayer.children && pointAnnotationLayer.children.length) {
    const _scaleX = app?.tree.scaleX || 1;
    const scaleFactor = pointStyle.value.fixedSizeScale || 1;
    pointAnnotationLayer.children.forEach(element => {
      element.scale = scaleFactor / _scaleX;
    });
  }
}

const initCanvas = () => {
  app = new App({
    view: canvasContainer.value,
    width: canvasContainer.value?.clientWidth || 800,
    height: canvasContainer.value?.clientHeight || 600,
    fill: "#e3e3e3",
    zoom: { min: 0.2, max: 4 },
    editor: {
      rotateable: false,
      middlePoint: {},
    },
    tree: {
      type: "design",
    },
  });

  app?.tree.add(contentLayer);
  app?.tree.add(pointLayer);

  // 设置图层的 zIndex
  pointLayer.zIndex = 10000;

  if (app) {
    app.on(ZoomEvent.ZOOM, () => {
      updateZoomLevel();
    });

    // 监听画布点击事件，用于创建点标注
    app.on(PointerEvent.TAP, handleCanvasTap);
    app.editor.on(EditorEvent.SELECT, handlePointAnnotationSelected);

    // 笔刷绘制事件
    app.on(PointerEvent.DOWN, handleBrushDown);
    app.on(PointerEvent.MOVE, handleBrushMove);
    app.on(PointerEvent.UP, handleBrushUp);
  }
};

const preloadImageSize = (
  url: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const tempImage = new window.Image();
    tempImage.onload = () => {
      resolve({
        width: tempImage.width,
        height: tempImage.height,
      });
    };
    tempImage.onerror = reject;
    tempImage.src = url;
  });
};

const loadImage = async (imageSrc?: string | undefined) => {
  const _imageSrc = imageSrc ? imageSrc : props.imageSource.url;
  if (!app || !_imageSrc) return;

  if (imageBox) {
    contentLayer.clear();
    imageBox.destroy();
  }

  loadStatus.value = "loading";
  emit("loadStart");
  imageWidth.value = null;
  imageHeight.value = null;

  try {
    const size = await preloadImageSize(_imageSrc);
    imageWidth.value = size.width;
    imageHeight.value = size.height;

    imageBox = new Image({
      url: _imageSrc,
      draggable: false,
      editable: false,
      lazy: true,
      zIndex: -1,
      placeholderColor: "transparent",
    });

    imageBox.on(ImageEvent.LOADED, function () {
      loadStatus.value = "success";
      emit("loadSuccess");
      fitImageToCanvas();
      initBrushLayer();
    });

    imageBox.on(ImageEvent.ERROR, function (e: ImageEvent) {
      loadStatus.value = "error";
      emit("loadError", e);
      console.error("Failed to load image:", e);
    });

    contentLayer.add(imageBox);
  } catch (error) {
    loadStatus.value = "error";
    emit("loadError", error);
    console.error("Failed to preload image size:", error);
  }
};

// 点标注数据结构（内部使用）
interface PointAnnotationInternal {
  id: string;
  x: number;
  y: number;
  normalized: {
    x: number;
    y: number;
  };
}

const getImageInfo = () => {
  return {
    id: props.imageSource.id,
    url: props.imageSource.url,
    width: imageWidth.value,
    height: imageHeight.value,
  };
};

const exportCanvasJSON = (): string => {
  return JSON.stringify({});
};

// 导出二值图（Mask）
const exportMaskImage = (): string | null => {
  if (!canvasBrush) return null;
  return canvasBrush.getImageData();
};

const importCanvasJSON = async (
  jsonString: string,
  options?: { resetZoom?: boolean },
): Promise<boolean> => {
  return false;
};

onMounted(() => {
  nextTick(() => {
    initCanvas();
    loadImage();

    // 初始化撤销/重做管理器
    commandManager = new CommandManager(100);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("focusout", handleFocusOut);

    const unsubscribe = tinykeys(window, {
      v: (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        selectTool();
      },
      p: (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        pointTool();
      },
      b: (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        brushTool();
      },
      e: (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        eraserTool();
      },
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
      Delete: (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        event.stopPropagation();
        deleteSelected();
      },
      "$mod+Equal": (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        event.stopPropagation();
        zoomIn();
      },
      "$mod+Minus": (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        event.stopPropagation();
        zoomOut();
      },
      "$mod+0": (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        event.stopPropagation();
        resetZoom();
      },
      Alt: (event: KeyboardEvent) => {
        if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
        event.preventDefault();
        showHotkeys.value = !showHotkeys.value;
      },
    });

    window.__pointAnnotationHotkeysUnsubscribe = unsubscribe;
  });
});

const handleMouseMove = (e: MouseEvent) => {
  mousePosition.value = {
    x: e.clientX,
    y: e.clientY,
  };
};

const fitImageToCanvas = () => {
  if (!app || !imageBox || !imageWidth.value || !imageHeight.value) return;

  const canvasWidth = app.width as number;
  const canvasHeight = app.height as number;
  const imageWidthVal = imageWidth.value;
  const imageHeightVal = imageHeight.value;

  const scaleX = canvasWidth / imageWidthVal;
  const scaleY = canvasHeight / imageHeightVal;
  const scale = Math.min(scaleX, scaleY, 1);

  const centerX = (canvasWidth - imageWidthVal * Number(scale.toFixed(2))) / 2;
  const centerY = (canvasHeight - imageHeightVal * Number(scale.toFixed(2))) / 2;

  app.tree.scale = Number(scale.toFixed(2));
  app.tree.x = centerX;
  app.tree.y = centerY;
  updateZoomLevel();
};

const isMouseInCanvas = (): boolean => {
  if (!canvasContainer.value) return false;

  const rect = canvasContainer.value.getBoundingClientRect();

  return (
    mousePosition.value.x >= rect.left &&
    mousePosition.value.x <= rect.right &&
    mousePosition.value.y >= rect.top &&
    mousePosition.value.y <= rect.bottom
  );
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    if (isMouseInCanvas()) {
      e.preventDefault();
      return false;
    }
  }
};
const handleFocusOut = (e: FocusEvent) => {
  const target = e.target;
  if (target instanceof HTMLElement && target.classList[0] === 'leafer-text-editor') {
      // 关键：手动触发 DOM 原生的 blur
      // 这会强制让浏览器完成失焦流程，触发插件的销毁逻辑
      app?.editor.cancel()
      // console.log('已强制执行 blur');
  }
};

const updateLabelEditable = (editable: boolean) => {
  // 遍历所有点标注元素，更新标签的可编辑状态
  if (pointLayer && pointLayer.children) {
    pointLayer.children.forEach((element: any) => {
      if (element._element_tag === 'point-annotation' && element.label) {
        element.label.editable = editable;
        // if(!editable) app?.editor.cancel()
      }
    });
  }
};


onUnmounted(() => {
  if (imageBox) {
    app?.tree.remove(imageBox);
    imageBox = null;
  }
  app?.destroy();
  app = null;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener('focusout', handleFocusOut);

  if (window.__pointAnnotationHotkeysUnsubscribe) {
    window.__pointAnnotationHotkeysUnsubscribe();
    delete window.__pointAnnotationHotkeysUnsubscribe;
  }
});

// 工具切换函数
const selectTool = () => {
  currentTool.value = "select";
  // 关闭笔刷配置面板
  showBrushPanel.value = false;
  if (!app) return 
  app.editor.config.moveable = false
  app.editor.config.resizeable = false
  app.editor.config.multipleSelect = true // 启用多选
  // 禁用笔刷 Canvas 的点击事件，让点击穿透到图片
  canvasBrush?.setPointerEvents(false);
  // 启用标签编辑
  updateLabelEditable(true);
};

const pointTool = () => {
  currentTool.value = "point";
  // 关闭笔刷配置面板
  showBrushPanel.value = false;
  if (!app) return 
  app.editor.config.moveable = true
  app.editor.config.multipleSelect = false // 禁用多选
  // 禁用笔刷 Canvas 的点击事件，让点击穿透到图片
  canvasBrush?.setPointerEvents(false);
  // 启用标签编辑
  updateLabelEditable(true);
};

const brushTool = () => {
  currentTool.value = "brush";
  if (!app) return;
  // 切换到笔刷模式时禁用编辑器
  app.editor.config.moveable = false;
  app.editor.config.resizeable = false;
  app.editor.config.multipleSelect = false;
  // 启用笔刷 Canvas 的点击事件
  canvasBrush?.setPointerEvents(true);
  // 禁用标签编辑
  updateLabelEditable(false);
  // 显示配置面板
  showBrushPanel.value = !showBrushPanel.value;
  if (showBrushPanel.value) {
    // 获取按钮位置
    nextTick(() => {
      if (brushButtonRef.value) {
        brushButtonRect.value = brushButtonRef.value.getBoundingClientRect();
      }
    });
  }
};

// 关闭笔刷配置面板
const closeBrushPanel = () => {
  showBrushPanel.value = false;
};

// 更新笔刷样式
const updateBrushStyle = (style: Partial<BrushStyle>) => {
  Object.assign(localBrushStyle.value, style);
};

const eraserTool = () => {
  currentTool.value = "eraser";
  // 关闭笔刷配置面板
  showBrushPanel.value = false;
  if (!app) return;
  // 切换到擦除模式时禁用编辑器
  app.editor.config.moveable = false;
  app.editor.config.resizeable = false;
  app.editor.config.multipleSelect = false;
  // 启用笔刷 Canvas 的点击事件
  canvasBrush?.setPointerEvents(true);
  // 禁用标签编辑
  updateLabelEditable(false);
};

// 初始化笔刷图层（在图片加载后调用）
const initBrushLayer = () => {
  if (!imageWidth.value || !imageHeight.value || !app) return;

  // 清除旧的笔刷
  if (canvasBrush) {
    canvasBrush.getGroup().remove();
  }

  // 创建新的 CanvasBrush 实例
  canvasBrush = new CanvasBrush(
    imageWidth.value,
    imageHeight.value,
    localBrushStyle.value
  );

  // 将 LeaferJS Group 添加到 contentLayer
  contentLayer.add(canvasBrush.getGroup());
};

// 笔刷绘制事件处理
let brushSnapshotBeforeDraw: string | null = null;

const handleBrushDown = (e: any) => {
  if (currentTool.value !== 'brush' && currentTool.value !== 'eraser') return;
  if (!app || !imageBox || !canvasBrush) return;

  isDrawing.value = true;

  // 保存当前画布快照（用于撤销）
  if (commandManager) {
    brushSnapshotBeforeDraw = canvasBrush.getImageData();
  }

  // 获取相对于图片的坐标（与点标注相同的方式）
  const point = contentLayer.getBoxPoint({ x: e.x, y: e.y });

  // 判断是否为擦除模式
  const isErase = currentTool.value === 'eraser';

  // 根据模式绘制
  if (isErase) {
    canvasBrush.erase(point.x, point.y, localBrushStyle.value.size, localBrushStyle.value.continuity);
  } else {
    canvasBrush.draw(
      point.x,
      point.y,
      localBrushStyle.value.size,
      localBrushStyle.value.color,
      localBrushStyle.value.opacity,
      localBrushStyle.value.continuity
    );
  }

  // 触发 Canvas 重绘
  canvasBrush.getCanvas().paint();
};

const handleBrushMove = (e: any) => {
  if (!isDrawing.value || !canvasBrush || !imageBox) return;

  // 获取相对于图片的坐标（与点标注相同的方式）
  const point = contentLayer.getBoxPoint({ x: e.x, y: e.y });

  // 判断是否为擦除模式
  const isErase = currentTool.value === 'eraser';

  // 根据模式绘制
  if (isErase) {
    canvasBrush.erase(point.x, point.y, localBrushStyle.value.size, localBrushStyle.value.continuity);
  } else {
    canvasBrush.draw(
      point.x,
      point.y,
      localBrushStyle.value.size,
      localBrushStyle.value.color,
      localBrushStyle.value.opacity,
      localBrushStyle.value.continuity
    );
  }

  // 触发 Canvas 重绘
  canvasBrush.getCanvas().paint();
};

const handleBrushUp = () => {
  isDrawing.value = false;

  // 如果有保存的快照，创建撤销命令
  if (commandManager && canvasBrush && brushSnapshotBeforeDraw) {
    const snapshotCommand = new BrushSnapshotCommand(canvasBrush, brushSnapshotBeforeDraw);
    commandManager.executeCommand(snapshotCommand);
    brushSnapshotBeforeDraw = null;
  }

  // 重置上一个点，避免下次绘制时从上次结束的地方连线
  canvasBrush?.resetLastPoint();
};

// 生成 UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 处理画布点击事件
const handleCanvasTap = (e: any) => {
  if (currentTool.value !== 'point' || !app || !imageBox) return;

  // 如果编辑器正处于编辑状态（有点标注被选中），不创建新标注
  if (app.editor && app.editor.list && app.editor.list.length > 0) return;

  // 检查是否点击在点标注元素上（遍历父级链）
  let target: any = e.target;
  while (target) {
    if (target._element_tag === 'point-annotation') return;
    target = target.parent;
  }

  // 获取相对于 contentLayer 的坐标
  const point = contentLayer.getBoxPoint({ x: e.x, y: e.y });

  // 检查是否在图片范围内
  if (point.x < 0 || point.x > (imageWidth.value || 0) ||
      point.y < 0 || point.y > (imageHeight.value || 0)) {
    return;
  }

  // 创建点标注
  createPointAnnotation(point.x, point.y);
};

// 处理点击【标注点】选中样式
const handlePointAnnotationSelected = (e: any) => {
  if (currentTool.value === 'brush' || currentTool.value === 'eraser' || !app || !imageBox) return;
  // console.log(e)
  if (e.value) {
    if (Array.isArray(e.value)) {
      e.value.forEach((element: { circle: { set: (arg0: { fill: string; stroke: string; }) => void; }; }) => {
        if (!element.circle) return
        element.circle.set({
          fill: pointStyle.value.selectedCircleFill,
          stroke: pointStyle.value.selectedCircleStroke
        })
      });
    } else {
      const _target = e.value.circle || e.value.parent.circle
      if (!_target) return
      _target.set({
        fill: pointStyle.value.selectedCircleFill,
        stroke: pointStyle.value.selectedCircleStroke
      })
    }
  }
  if (e.oldValue && (!Array.isArray(e.oldValue) || !e.value)) {
    if (Array.isArray(e.oldValue)) {
      e.oldValue.forEach((element: { circle: { set: (arg0: { fill: string; stroke: string; }) => void; }; }) => {
        if (!element.circle) return
        element.circle.set({
          fill: pointStyle.value.circleFill,
          stroke: pointStyle.value.circleStroke
        })
      });
    } else {
      const _target = e.oldValue.circle || e.oldValue.parent.circle
      if (!_target || (e.oldValue === e.value?.parent)) return
      _target.set({
        fill: pointStyle.value.circleFill,
        stroke: pointStyle.value.circleStroke
      })
    }
  }
}

// 创建点标注
const createPointAnnotation = (pixelX: number, pixelY: number) => {
  if (!imageWidth.value || !imageHeight.value) return;

  const id = `point_${generateUUID()}`;
  const label = `#${pointCounter.value}`;

  // 计算归一化坐标
  const normalizedX = pixelX / imageWidth.value;
  const normalizedY = pixelY / imageHeight.value;

  const pointData: PointAnnotation = {
    id,
    pixel: { x: pixelX, y: pixelY },
    normalized: { x: normalizedX, y: normalizedY },
    label,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 创建点标注元素
  const pointElement = new PointAnnotationElement(pointData, pointStyle.value);

  // 根据当前工具设置标签的可编辑状态
  if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
    pointElement.label.editable = false;
  }

  // 使用命令模式添加到图层
  if (commandManager) {
    const addCommand = new AddPointCommand(pointLayer, pointElement, pointAnnotations.value, pointData);
    commandManager.executeCommand(addCommand);
  } else {
    pointLayer.add(pointElement);
    pointAnnotations.value.push(pointData);
  }

  // 强制【标注点】不跟随画布Scale变化
  changePointScaleRelativeCanvas(pointLayer);

  pointCounter.value++;

  // 触发事件
  emit("pointChange", [...pointAnnotations.value]);

  // 选中新创建的点
  if (app?.editor) {
    app.editor.select(pointElement);
  }
};

// 删除选中的点标注或清除笔刷内容
const deleteSelected = () => {
  // 如果当前工具是笔刷，清除所有笔刷内容
  if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
    clearBrush();
    return;
  }

  if (!app?.editor) return;

  const selected = app.editor.list;
  if (selected.length === 0) return;

  selected.forEach((element: any) => {
    // 使用 _element_tag 来识别点标注元素
    if (element._element_tag === 'point-annotation') {
      // 使用命令模式从图层和数据中移除
      if (commandManager) {
        const removeCommand = new RemovePointCommand(pointLayer, element, pointAnnotations.value);
        commandManager.executeCommand(removeCommand);
      } else {
        pointLayer.remove(element);
        element.destroy();
        const index = pointAnnotations.value.findIndex(p => p.id === element.data.id);
        if (index > -1) {
          pointAnnotations.value.splice(index, 1);
        }
      }
    }
  });

  // 清除编辑器选择
  app.editor.cancel();

  // 触发事件
  emit("pointChange", [...pointAnnotations.value]);
};

// 清除所有笔刷内容
const clearBrush = () => {
  if (canvasBrush) {
    if (commandManager) {
      const beforeSnapshot = canvasBrush.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(canvasBrush, beforeSnapshot, true);
      commandManager.executeCommand(snapshotCommand);
    }

    canvasBrush.clear();
    canvasBrush.getCanvas().paint();
  }
};

// 获取点标注数据
const getPointAnnotations = (): PointAnnotation[] => {
  return [...pointAnnotations.value];
};

const undo = () => {
  if (commandManager?.canUndo()) {
    commandManager.undo();
  }
};

const redo = () => {
  if (commandManager?.canRedo()) {
    commandManager.redo();
  }
};

const zoomOut = () => {
  if (!app) return;
  app.tree.zoom("out");
  updateZoomLevel();
};

const zoomIn = () => {
  if (!app) return;
  app.tree.zoom("in");
  updateZoomLevel();
};

const resetZoom = () => {
  if (!app) return;
  app.tree.zoom(1);
  updateZoomLevel();
};

const updateZoomLevel = () => {
  if (!app || !app.tree || app.tree.scaleX === undefined) return;
  zoomLevel.value = Math.round(app.tree.scaleX * 100);
  // 强制【标注点】不跟随画布Scale变化
  changePointScaleRelativeCanvas(pointLayer);
};

defineExpose({
  getPointAnnotations,
  getImageInfo,
  exportCanvasJSON,
  exportMaskImage,
  importCanvasJSON,
  loadImage,
  clearBrush,
});

declare global {
  interface Window {
    __pointAnnotationHotkeysUnsubscribe?: () => void;
  }
}
</script>

<style>
:root {
  --leafer-point-color-primary: #007aff;
  --leafer-point-color-background: #f5f5f5;
  --leafer-point-color-background-light: #f0f0f0;
  --leafer-point-color-white: #fff;
  --leafer-point-color-text: #333;
  --leafer-point-color-text-secondary: #666;
  --leafer-point-color-text-tertiary: #999999;
  --leafer-point-color-border: #ddd;
  --leafer-point-color-border-light: #e0e0e0;
  --leafer-point-color-error: #e74c3c;
  --leafer-point-color-button: #3498db;
  --leafer-point-color-button-hover: #2980b9;

  --leafer-point-padding-toolbar: 10px;
  --leafer-point-padding-tool-button: 8px;
  --leafer-point-size-tool-icon: 18px;
  --leafer-point-size-zoom-button: 36px;
  --leafer-point-size-zoom-value: 60px;
  --leafer-point-font-size-hotkey: 10px;
  --leafer-point-padding-hotkey: 1px 3px;
  --leafer-point-padding-error: 20px;
  --leafer-point-padding-error-button: 8px 16px;

  --leafer-point-border-radius-tool-button: 4px;
  --leafer-point-border-radius-hotkey: 2px;
  --leafer-point-border-radius-overlay: 8px;
  --leafer-point-border-radius-zoom: 8px;

  --leafer-point-shadow-tool-button: 0 2px 4px rgba(0, 0, 0, 0.1);
  --leafer-point-shadow-tool-button-active: 0 2px 4px rgba(0, 122, 255, 0.3);
  --leafer-point-shadow-tool-button-hover: 0 4px 6px rgba(0, 0, 0, 0.1);
  --leafer-point-shadow-overlay: 0 4px 12px rgba(0, 0, 0, 0.1);
  --leafer-point-shadow-zoom: 0 2px 8px rgba(0, 0, 0, 0.15);

  --leafer-point-transition-time: 0.2s;
  --leafer-point-animation-gradient: 2s;
}
</style>
<style scoped>
.point-annotation {
  width: 100%;
  height: 100%;
}

.canvas-container {
  width: 100%;
  height: calc(100% - 55px);
  position: relative;
  overflow: hidden;
  outline: none;
}

.canvas-container:focus {
  outline: 2px solid var(--leafer-point-color-primary);
  outline-offset: -2px;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--leafer-point-color-background-light);
  border-radius: var(--leafer-point-border-radius-overlay);
  box-shadow: var(--leafer-point-shadow-overlay);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  min-width: 100%;
  min-height: 100%;
}

.gradient-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 200% 200%;
  animation: gradientShift var(--leafer-point-animation-gradient) ease-in-out
    infinite;
  opacity: 0.7;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.loading-text {
  position: relative;
  z-index: 1;
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--leafer-point-color-white);
  border-radius: var(--leafer-point-border-radius-overlay);
  box-shadow: var(--leafer-point-shadow-overlay);
  padding: var(--leafer-point-padding-error);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  min-width: 200px;
}

.error-overlay p {
  margin-bottom: 20px;
  color: var(--leafer-point-color-error);
  font-size: 16px;
}

.error-overlay button {
  padding: var(--leafer-point-padding-error-button);
  background-color: var(--leafer-point-color-button);
  color: white;
  border: none;
  border-radius: var(--leafer-point-border-radius-tool-button);
  cursor: pointer;
  font-size: 14px;
}

.error-overlay button:hover {
  background-color: var(--leafer-point-color-button-hover);
}

.zoom-controller {
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  background-color: var(--leafer-point-color-white);
  border-radius: var(--leafer-point-border-radius-zoom);
  box-shadow: var(--leafer-point-shadow-zoom);
  overflow: hidden;
  z-index: 100;
}

.zoom-button {
  width: var(--leafer-point-size-zoom-button);
  height: var(--leafer-point-size-zoom-button);
  border: none;
  background-color: var(--leafer-point-color-white);
  color: var(--leafer-point-color-text);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all var(--leafer-point-transition-time) ease;
  position: relative;
}

.zoom-button:hover {
  background-color: var(--leafer-point-color-background-light);
  color: var(--leafer-point-color-primary);
}

.zoom-button:active {
  background-color: #e0e0e0;
}

.zoom-value {
  min-width: var(--leafer-point-size-zoom-value);
  height: var(--leafer-point-size-zoom-button);
  line-height: var(--leafer-point-size-zoom-button);
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--leafer-point-color-text);
  cursor: pointer;
  border-left: 1px solid var(--leafer-point-color-border-light);
  border-right: 1px solid var(--leafer-point-color-border-light);
  transition: all var(--leafer-point-transition-time) ease;
  position: relative;
}
.zoom-value .hotkey-hint {
  line-height: 1;
}

.zoom-value:hover {
  background-color: var(--leafer-point-color-background-light);
  color: var(--leafer-point-color-primary);
}

.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--leafer-point-padding-toolbar);
  background-color: var(--leafer-point-color-background);
  border-top: 1px solid var(--leafer-point-color-border);
  gap: 10px;
}

.tool-button {
  padding: var(--leafer-point-padding-tool-button);
  border: none;
  border-radius: var(--leafer-point-border-radius-tool-button);
  background-color: var(--leafer-point-color-white);
  color: var(--leafer-point-color-text);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all var(--leafer-point-transition-time) ease;
  position: relative;
  box-shadow: var(--leafer-point-shadow-tool-button);
}

.tool-button:hover {
  background-color: var(--leafer-point-color-background-light);
  color: var(--leafer-point-color-primary);
  box-shadow: var(--leafer-point-shadow-tool-button-hover);
}

.tool-button:active {
  transform: translateY(1px);
  box-shadow: var(--leafer-point-shadow-tool-button);
}

.tool-button.active {
  background-color: var(--leafer-point-color-primary);
  color: white;
  box-shadow: var(--leafer-point-shadow-tool-button-active);
}

.hotkey-hint {
  position: absolute;
  top: 0;
  right: 0;
  font-size: var(--leafer-point-font-size-hotkey);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: var(--leafer-point-padding-hotkey);
  border-radius: var(--leafer-point-border-radius-hotkey);
  pointer-events: none;
  white-space: nowrap;
}

.size-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--leafer-point-padding-tool-button);
  background-color: var(--leafer-point-color-white);
  border-radius: var(--leafer-point-border-radius-tool-button);
  box-shadow: var(--leafer-point-shadow-tool-button);
}

.size-label {
  font-size: 12px;
  color: var(--leafer-point-color-text);
  white-space: nowrap;
}

.size-slider {
  width: 120px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--leafer-point-color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all var(--leafer-point-transition-time) ease;
  border: 2px solid white;
}

.size-slider::-webkit-slider-thumb:hover,
.size-slider::-webkit-slider-thumb:active,
.size-slider:focus::-webkit-slider-thumb {
  transform: scale(1.15);
  background: var(--leafer-point-color-primary-hover);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

.size-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--leafer-point-color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  border: none;
  border: 2px solid white;
  transition: all var(--leafer-point-transition-time) ease;
}

.size-slider::-moz-range-thumb:hover,
.size-slider::-moz-range-thumb:active,
.size-slider:focus::-moz-range-thumb {
  transform: scale(1.15);
  background: var(--leafer-point-color-primary-hover);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

.size-slider:focus {
  outline: none;
}

.size-value {
  min-width: 30px;
  text-align: center;
  font-size: 12px;
  color: var(--leafer-point-color-primary);
  font-weight: 600;
}
</style>