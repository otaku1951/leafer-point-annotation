<template>
  <div
    class="point-annotation"
    :class="{ 'has-image': hasImage && showToolbar }"
    @focus="isCanvasFocused = true"
    @blur="isCanvasFocused = false"
    @mouseenter="isMouseOverCanvas = true"
    @mouseleave="isMouseOverCanvas = false"
  >
    <!-- 画布容器 -->
    <div
      ref="canvasContainer"
      class="canvas-container"
      tabindex="0"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :style="loadingStyleVars"
    >
      <!-- 加载占位 -->
      <div
        v-if="loadStatus === 'loading'"
        class="loading-overlay"
      >
        <div class="gradient-animation"></div>
        <div class="loading-text">图片加载中</div>
      </div>

      <!-- 隐藏的文件选择 input（始终存在于 DOM，供 openFileDialog 调用） -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileUpload"
      />

      <!-- 空状态/上传区域 -->
      <div v-if="loadStatus === 'idle'" class="upload-overlay" :class="{ 'drag-over': isDragOver }">
        <div class="upload-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <p class="upload-text">点击选择本地图片</p>
        <p class="upload-hint">或拖拽图片到此处</p>
        <button class="upload-button" @click="openFileDialog">选择图片</button>
      </div>

      <!-- 错误状态 -->
      <div v-if="loadStatus === 'error'" class="error-overlay">
        <p>加载失败</p>
        <button @click="loadImage()">重试</button>
      </div>

      <!-- 缩放控制器 - 只在有图片时显示 -->
      <div v-if="showZoomController" class="zoom-controller">
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

    <!-- 工具栏 - 只在有图片时显示 -->
    <div v-if="showToolbar" class="toolbar">
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
      <template v-if="effectiveEnableBrush">
        <button
          class="tool-button"
          :class="{ active: currentTool === 'brush' }"
          title="笔刷工具 (B)"
          @click="brushTool()"
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
      </template>
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
  
  <!-- 笔刷样式配置面板（仅在 enableBrush=true 时渲染） -->
  <BrushStylePanel
    v-if="effectiveEnableBrush"
    :visible="showBrushPanel"
    :brush-style="localBrushStyle"
    :button-rect="brushButtonRect"
    @close="closeBrushPanel"
    @update="updateBrushStyle"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch, PropType } from "vue";
import {
  App,
  ImageEvent,
  PointerEvent,
  ZoomEvent,
  Image,
  Group,
  Ellipse,
} from "leafer-ui";
import "@leafer-in/editor";
import "@leafer-in/resize";
import "@leafer-in/viewport";
import "@leafer-in/view";
import { EditorEvent } from '@leafer-in/editor'
import { CommandManager } from '@zzalai/leafer-undo-redo'
import { AddPointCommand, RemovePointCommand } from '@/utils/PointCommands';
import { BrushSnapshotCommand } from '@/utils/BrushCommands';
import { exportCOCOFormat } from '@/utils/COCOExporter';
import { exportYOLOFormat } from '@/utils/YOLOExporter';

// @ts-ignore - tinykeys 类型声明问题
import { tinykeys } from "tinykeys";

import { PointAnnotationElement } from "@/elements/PointAnnotationElement";
import { CanvasBrush } from "@/utils/CanvasBrush";
import BrushStylePanel from "./BrushStylePanel.vue";
import type { PointAnnotation, PointStyle, BrushStyle, BrushLayerConfig, ImageSource, OptionsSource } from "@/types";
import { DEFAULT_POINT_STYLE, DEFAULT_BRUSH_STYLE } from "@/types";

const props = defineProps({
  imageSource: {
    type: Object as () => ImageSource,
    required: false,
    default: null,
  },
  options: {
    type: Object as () => OptionsSource,
    default: () => ({}),
  },
  currentLayer: {
    type: String,
    required: false,
    default: null,
  },
  // 📍 创建点标注前的回调：父组件可做业务判定
  // 返回 false 阻止创建；支持 Promise<boolean> 用于异步场景（如弹确认框）
  // 参数：x(像素X), y(像素Y), normalizedX(0-1), normalizedY(0-1), existingPointCount(已有点数)
  beforeCreatePoint: {
    type: Function as PropType<(x: number, y: number, normalizedX: number, normalizedY: number, existingPointCount: number) => boolean | Promise<boolean>>,
    required: false,
    default: undefined,
  },
});

const emit = defineEmits([
  "pointChange",
  "loadStart",
  "loadSuccess",
  "loadError",
  "undoStateChange",
  "redoStateChange",
  "update:currentLayer",
  "layerChange",
  "point-hover",
  "point-select",
  "init",
  "update:imageSource",
]);

const canvasContainer = ref<HTMLElement | undefined>(undefined);
const fileInputRef = ref<HTMLInputElement | null>(null);
const loadStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const imageWidth = ref<number | null>(null);
const imageHeight = ref<number | null>(null);
const isDragOver = ref(false);
const blobUrls = new Set<string>();
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

// 是否显示工具界面
const hasImage = computed(() => loadStatus.value === 'success');
const showToolbar = computed(() => hasImage.value && (props.options?.showToolbar !== false));
const showZoomController = computed(() => hasImage.value && (props.options?.showZoomController !== false));
const effectiveEnableBrush = computed(() => props.options?.enableBrush !== false);
const brushCursorEnabled = computed(() => props.options?.brushCursorEnabled !== false);

// 加载中样式变量（通过 CSS 变量注入）
const loadingStyleVars = computed(() => {
  const defaultColors: [string, string] = ['#e8e0ff', '#d8e8ff'];  // 淡紫 -> 淡蓝
  const colors = props.options?.loadingGradientColors || defaultColors;
  const textColor = props.options?.loadingTextColor || '#4a5568';
  
  return {
    '--loading-gradient-start': colors[0],
    '--loading-gradient-end': colors[1],
    '--loading-text-color': textColor,
  };
});

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

// 本地响应式橡皮擦大小（独立于笔刷大小）
const localEraserSize = ref<number>(
  props.options?.brushStyle?.eraserSize ?? localBrushStyle.value.size
);

// 监听 prop 变化，同步到本地状态
watch(brushStyle, (newVal: BrushStyle) => {
  localBrushStyle.value = { ...newVal };
  if (newVal.eraserSize !== undefined) {
    localEraserSize.value = newVal.eraserSize;
  }
}, { immediate: true });

// 监听笔刷透明度变化，更新所有图层的 CanvasBrush 透明度
watch(
  () => localBrushStyle.value.opacity,
  (newOpacity) => {
    Object.values(canvasBrushesByLayer.value).forEach(brush => {
      brush.setOpacity(newOpacity);
    });
  }
);

// 监听笔刷属性变化（颜色/大小/透明度/橡皮擦大小），同步更新笔刷光标样式
watch(
  () => ({
    color: localBrushStyle.value.color,
    size: localBrushStyle.value.size,
    opacity: localBrushStyle.value.opacity,
    eraserSize: localEraserSize.value,
  }),
  () => {
    updateBrushCursorStyle();
  },
  { deep: true }
);

// 监听当前工具变化，同步显示/隐藏笔刷光标
watch(
  currentTool,
  () => {
    syncBrushCursorVisibility();
  }
);

// 监听笔刷光标开关配置变化，运行时切换也能生效
watch(
  brushCursorEnabled,
  () => {
    if (brushCursorEnabled.value && !brushCursorLayer) {
      createBrushCursor();
    }
    syncBrushCursorVisibility();
  }
);

// 监听 props.imageSource 变化
watch(
  () => props.imageSource?.url,
  (newUrl, oldUrl) => {
    if (newUrl) {
      loadImage(newUrl);
    } else if (oldUrl && !newUrl) {
      clearAllAnnotationsAndBrush();
      if (imageBox) {
        contentLayer.clear();
        imageBox.destroy();
        imageBox = null;
      }
      loadStatus.value = 'idle';
    }
  },
  //{ immediate: true }
);

// 多图层相关状态
const MAX_BRUSH_LAYERS = 8;
const DEFAULT_LAYER_VALUE = 'default';

// 计算实际的图层配置
const effectiveBrushLayers = computed<BrushLayerConfig[]>(() => {
  const configured = props.options?.brushLayers;
  if (!configured || configured.length === 0) {
    return [{
      label: '笔刷',
      value: DEFAULT_LAYER_VALUE,
      color: localBrushStyle.value.color,
      opacity: localBrushStyle.value.opacity,
      size: localBrushStyle.value.size,
    }];
  }
  const maxLayers = props.options?.maxBrushLayers || MAX_BRUSH_LAYERS;
  return configured.slice(0, maxLayers);
});

// 每个图层独立的 CanvasBrush 实例
const canvasBrushesByLayer = ref<Record<string, CanvasBrush>>({});

// 内部当前激活图层（非受控模式使用）
const internalCurrentLayer = ref<string>('');

// 实际当前激活图层（受控 or 非受控）
const effectiveCurrentLayer = computed<string>(() => {
  if (props.currentLayer && effectiveBrushLayers.value.some(l => l.value === props.currentLayer)) {
    return props.currentLayer;
  }
  if (internalCurrentLayer.value && effectiveBrushLayers.value.some(l => l.value === internalCurrentLayer.value)) {
    return internalCurrentLayer.value;
  }
  return effectiveBrushLayers.value[0]?.value || DEFAULT_LAYER_VALUE;
});

// 当前激活的 canvasBrush
const activeCanvasBrush = computed<CanvasBrush | null>(() => {
  return canvasBrushesByLayer.value[effectiveCurrentLayer.value] || null;
});

// 监听 enableBrush 变化（运行时切换笔刷开关）
// - 关闭：清除所有笔刷 canvas 并重置 tool
// - 开启：重新初始化笔刷图层
watch(
  () => effectiveEnableBrush.value,
  (newVal) => {
    // 关闭笔刷 → 清理画布 + 重置 tool 状态
    if (!newVal) {
      if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
        currentTool.value = 'select';
      }
      showBrushPanel.value = false;
    }
    // 开启笔刷（且已有画布）→ 重新初始化笔刷图层
    if (newVal && imageWidth.value && imageHeight.value && app) {
      initBrushLayers();
    }
  }
);

// 监听图层配置变化（支持运行时从单图层切到多图层，或切换图层配置）
watch(
  () => {
    const layers = props.options?.brushLayers;
    return layers ? layers.map(l => l.value).sort().join(',') : '';
  },
  () => {
    if (!effectiveEnableBrush.value) return;
    if (imageWidth.value && imageHeight.value && app) {
      initBrushLayers();
    }
  }
);

// 笔刷相关状态
const isDrawing = ref(false);
const isSpacePressed = ref(false);

// 笔刷光标（跟随鼠标的预览圆圈）
let brushCursorCircle: Ellipse | null = null;
let brushCursorCircleInner: Ellipse | null = null;  // 橡皮擦模式下的黑色内环
let brushCursorGroup: Group | null = null;
let brushCursorLayer: Group | null = null;  // 独立图层，zIndex 高于 pointLayer

// 撤销/重做管理器
let commandManager: CommandManager | null = null;

// 🔧 多实例支持：tinykeys 解绑函数（保存在组件作用域，避免多个实例互相覆盖 window.__pointAnnotationHotkeysUnsubscribe）
let hotkeysUnsubscribe: (() => void) | null = null;

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
  const canvasBackground = props.options?.canvasBackground ?? "#e3e3e3";
  const zoomMin = props.options?.zoomMin ?? 0.2;
  const zoomMax = props.options?.zoomMax ?? 4;
  app = new App({
    view: canvasContainer.value,
    width: canvasContainer.value?.clientWidth || 800,
    height: canvasContainer.value?.clientHeight || 600,
    fill: canvasBackground,
    zoom: { min: zoomMin, max: zoomMax },
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

  // 创建笔刷光标（跟随鼠标的预览圆圈）
  createBrushCursor();

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

    // 笔刷光标跟随鼠标
    app.on(PointerEvent.MOVE, (e: any) => {
      if (!brushCursorCircle || !brushCursorGroup || !brushCursorGroup.visible || !app) return;
      // 关键修复：e.x/e.y 是 app 根级坐标（屏幕坐标）
      // brushCursorCircle 在 app.tree 子层内部，需要转换到 app.tree 本地坐标
      const treeScale = (app.tree as any).scale ?? 1;
      const treeX = (app.tree as any).x ?? 0;
      const treeY = (app.tree as any).y ?? 0;
      const localX = (e.x - treeX) / treeScale;
      const localY = (e.y - treeY) / treeScale;
      updateBrushCursorPos(localX, localY);
    });
  }

  emit("init");
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
  const _imageSrc = imageSrc || props.imageSource?.url || '';
  
  if (!app || !_imageSrc) {
    loadStatus.value = "idle";
    return;
  }

  if (imageBox) {
    contentLayer.clear();
    imageBox.destroy();
  }

  if (pointLayer && pointLayer.children) {
    pointLayer.children.forEach((el: any) => el.destroy());
    pointLayer.clear();
  }
  pointAnnotations.value = [];
  pointCounter.value = 1;

  if (commandManager) {
    commandManager = new CommandManager(100);
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
      emit("loadSuccess", {
        url: props.imageSource?.url || '',
        width: imageWidth.value,
        height: imageHeight.value,
        id: props.imageSource?.id || '',
        isLocal: props.imageSource?.isLocal || false,
        file: props.imageSource?.file || undefined,
      });
      const currentUrl = props.imageSource?.url || '';
      if (blobUrls.has(currentUrl)) {
        URL.revokeObjectURL(currentUrl);
        blobUrls.delete(currentUrl);
      }
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

const getImageInfo = () => {
  return {
    id: props.imageSource?.id || '',
    url: props.imageSource?.url || '',
    width: imageWidth.value,
    height: imageHeight.value,
    isLocal: props.imageSource?.isLocal || false,
    file: props.imageSource?.file || undefined,
  };
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    blobUrls.add(url);
    emit('update:imageSource', {
      id: 'local-image-' + Date.now(),
      url: url,
      width: 0,
      height: 0,
      isLocal: true,
      file: file,
    });
  }
  target.value = '';
};

const openFileDialog = () => {
  fileInputRef.value?.click();
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      blobUrls.add(url);
      emit('update:imageSource', {
        id: 'local-image-' + Date.now(),
        url: url,
        width: 0,
        height: 0,
        isLocal: true,
        file: file,
      });
    }
  }
};

const exportCanvasJSON = (): string => {
  const brushLayersData: Record<string, string> = {};
  Object.entries(canvasBrushesByLayer.value).forEach(([layerValue, brush]) => {
    const maskData = brush.getImageData();
    if (maskData) {
      brushLayersData[layerValue] = maskData;
    }
  });

  const exportData = {
    version: '1.0',
    imageUrl: props.imageSource?.url || '',
    imageWidth: imageWidth.value,
    imageHeight: imageHeight.value,
    pointAnnotations: [...pointAnnotations.value],
    brushLayers: brushLayersData,
    brushMask: activeCanvasBrush.value?.getImageData() || null,
    exportTime: Date.now(),
  };
  return JSON.stringify(exportData, null, 2);
};

// 内部辅助：把笔刷图层渲染为 HTMLCanvas + mime（二值图）
const buildMaskCanvas = (
  brush: any,
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<{ canvas: HTMLCanvasElement; mime: string } | null> => {
  return new Promise((resolve) => {
    const exportFormat = format || props.options?.maskExportFormat || 'png';
    const fgColor = foregroundColor || props.options?.maskExportForeground || 'black';
    const mime = exportFormat === 'png' ? 'image/png' : 'image/jpeg';

    const dataCanvas = brush.getDataCanvas?.();
    if (!dataCanvas) {
      resolve(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = imageWidth.value || 0;
    canvas.height = imageHeight.value || 0;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      resolve(null);
      return;
    }

    const isWhite = fgColor === 'white';
    const backgroundColor = isWhite ? 'black' : 'white';
    const contentColor = isWhite ? 'white' : 'black';

    ctx.drawImage(dataCanvas.context.canvas, 0, 0);

    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = contentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    resolve({ canvas, mime });
  });
};

// 辅助函数：导出单个图层的 mask（返回 dataURL）
const exportSingleLayerMask = async (
  brush: any,
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<string | null> => {
  const result = await buildMaskCanvas(brush, format, foregroundColor);
  if (!result) return null;
  const { canvas, mime } = result;
  return mime === 'image/png'
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', 0.95);
};

// 导出二值图（Mask）- 当前激活图层（笔刷禁用时返回 null）
const exportMaskImage = (format?: 'png' | 'jpeg' | 'jpg', foregroundColor?: 'black' | 'white'): Promise<string | null> => {
  if (!effectiveEnableBrush.value) return Promise.resolve(null);
  if (!activeCanvasBrush.value) return Promise.resolve(null);
  
  // ✅ 真实判断：检查 brush 是否有实际内容
  if (!activeCanvasBrush.value.hasContent?.()) {
    console.log('[exportMaskImage] 当前图层没有笔刷内容');
    return Promise.resolve(null);
  }
  
  return exportSingleLayerMask(activeCanvasBrush.value, format, foregroundColor);
};

// 导出指定图层的 mask（笔刷禁用时返回 null）
const exportMaskImageByLayer = (
  layerValue: string,
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<string | null> => {
  if (!effectiveEnableBrush.value) return Promise.resolve(null);
  const brush = canvasBrushesByLayer.value[layerValue];
  if (!brush) return Promise.resolve(null);
  
  // ✅ 真实判断：检查 brush 是否有实际内容
  if (!brush.hasContent?.()) {
    console.log(`[exportMaskImageByLayer] 图层 ${layerValue} 没有笔刷内容`);
    return Promise.resolve(null);
  }
  return exportSingleLayerMask(brush, format, foregroundColor);
};

// 导出所有图层的 masks（笔刷禁用时返回空对象）
const exportAllMaskImages = (
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<Record<string, string>> => {
  if (!effectiveEnableBrush.value) return Promise.resolve({});
  return new Promise(async (resolve) => {
    const result: Record<string, string> = {};
    for (const [layerValue, brush] of Object.entries(canvasBrushesByLayer.value)) {
      // ✅ 真实判断：检查 brush 是否有实际内容
      if (!brush.hasContent?.()) {
        console.log(`[exportAllMaskImages] 图层 ${layerValue} 没有笔刷内容，跳过`);
        continue;
      }
      const mask = await exportSingleLayerMask(brush, format, foregroundColor);
      if (mask) {
        result[layerValue] = mask;
      }
    }
    resolve(result);
  });
};

// canvas.toBlob 的 Promise 版本（避免回调地狱）
const canvasToBlob = (canvas: HTMLCanvasElement, mime: string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, mime, mime === 'image/jpeg' ? 0.95 : undefined);
    } catch (_e) {
      resolve(null);
    }
  });
};

// 获取指定图层 mask 为 Blob（用于传后端接口上传文件）
// - layerValue 不传 → 当前激活图层
// - 笔刷禁用时返回 null
const getMaskBlob = (
  layerValue?: string,
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<Blob | null> => {
  if (!effectiveEnableBrush.value) return Promise.resolve(null);
  const brush = layerValue
    ? canvasBrushesByLayer.value[layerValue]
    : activeCanvasBrush.value;
  if (!brush) return Promise.resolve(null);
  
  // ✅ 真实判断：检查 brush 是否有实际内容
  if (!brush.hasContent?.()) {
    console.log(`[getMaskBlob] 图层 ${layerValue || '当前'} 没有笔刷内容`);
    return Promise.resolve(null);
  }
  
  return new Promise(async (resolve) => {
    const result = await buildMaskCanvas(brush, format, foregroundColor);
    if (!result) return resolve(null);
    const blob = await canvasToBlob(result.canvas, result.mime);
    resolve(blob);
  });
};

// 获取指定图层 mask 为 File（用于传后端接口上传）
// - 笔刷禁用时返回 null
const getMaskFile = (
  layerValue?: string,
  filename?: string,
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<File | null> => {
  if (!effectiveEnableBrush.value) return Promise.resolve(null);
  return new Promise(async (resolve) => {
    const blob = await getMaskBlob(layerValue, format, foregroundColor);
    if (!blob) return resolve(null);
    const mime = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' || format === 'jpg' ? 'jpg' : 'png';
    const finalName = filename || `mask_${layerValue || 'current'}_${Date.now()}.${ext}`;
    try {
      resolve(new File([blob], finalName, { type: mime }));
    } catch (_e) {
      const fallback: any = blob as any;
      fallback.name = finalName;
      fallback.type = mime;
      resolve(fallback);
    }
  });
};

// 导出 UI 层（预览层）的 blob（带颜色的视觉效果）
// - layerValue: 图层标识（不传则为当前激活图层）
// - 笔刷禁用时返回 null
const getMaskUIBlob = (layerValue?: string): Promise<Blob | null> => {
  if (!effectiveEnableBrush.value) return Promise.resolve(null);
  
  const brush = layerValue 
    ? canvasBrushesByLayer.value[layerValue] 
    : activeCanvasBrush.value;
  
  if (!brush) return Promise.resolve(null);
  
  const dataCanvas = brush.getDataCanvas().context.canvas;
  const groupOpacity = (brush.getGroup() as any).opacity ?? 1;
  const color = brush.getCurrentColor();
  
  const canvas = document.createElement('canvas');
  canvas.width = imageWidth.value || 0;
  canvas.height = imageHeight.value || 0;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  
  ctx.drawImage(dataCanvas, 0, 0);
  
  ctx.globalAlpha = groupOpacity;
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || null);
    }, 'image/png');
  });
};

// 获取所有图层的 mask Blob（笔刷禁用时返回空对象）
const getAllMaskBlobs = (
  format?: 'png' | 'jpeg' | 'jpg',
  foregroundColor?: 'black' | 'white'
): Promise<Record<string, Blob>> => {
  if (!effectiveEnableBrush.value) return Promise.resolve({});
  return new Promise(async (resolve) => {
    const result: Record<string, Blob> = {};
    for (const [layerValue, brush] of Object.entries(canvasBrushesByLayer.value)) {
      // ✅ 真实判断：检查 brush 是否有实际内容
      if (!brush.hasContent?.()) {
        console.log(`[getAllMaskBlobs] 图层 ${layerValue} 没有笔刷内容，跳过`);
        continue;
      }
      const canvasResult = await buildMaskCanvas(brush, format, foregroundColor);
      if (!canvasResult) continue;
      const blob = await canvasToBlob(canvasResult.canvas, canvasResult.mime);
      if (blob) result[layerValue] = blob;
    }
    resolve(result);
  });
};

const exportCOCO = (): string => {
  const coco = exportCOCOFormat(
    pointAnnotations.value,
    props.imageSource?.url || '',
    imageWidth.value || 0,
    imageHeight.value || 0
  );
  return JSON.stringify(coco, null, 2);
};

const exportYOLO = (): { annotations: string; classNames: string } => {
  const yolo = exportYOLOFormat(
    pointAnnotations.value,
    imageWidth.value || 0,
    imageHeight.value || 0
  );
  return {
    annotations: yolo.annotations,
    classNames: yolo.classNames,
  };
};

const importCanvasJSON = async (
  jsonString: string,
  options?: { resetZoom?: boolean },
): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString);

    if (options?.resetZoom) {
      resetZoom();
      fitImageToCanvas();
    }

    pointAnnotations.value.forEach((p: any) => {
      const element = pointLayer.findOne(`#${p.id}`);
      if (element) {
        pointLayer.remove(element);
        element.destroy();
      }
    });
    pointAnnotations.value = [];

    // 清除所有图层的笔刷
    Object.values(canvasBrushesByLayer.value).forEach(brush => brush.clear());

    if (data.imageUrl && data.imageUrl !== props.imageSource.url) {
      await loadImage(data.imageUrl);
    }

    if (data.pointAnnotations && Array.isArray(data.pointAnnotations)) {
      for (const pointData of data.pointAnnotations) {
        const pointElement = new PointAnnotationElement(pointData, pointStyle.value, () => {
          emit("pointChange", [...pointAnnotations.value]);
        });
        pointElement.setImageSize(imageWidth.value || 1, imageHeight.value || 1);
        if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
          pointElement.label.editable = false;
        }
        pointLayer.add(pointElement);
        pointAnnotations.value.push(pointData);
      }
    }

    // 优先恢复多图层笔刷遮罩
    if (data.brushLayers && typeof data.brushLayers === 'object') {
      Object.entries(data.brushLayers).forEach(([layerValue, maskData]) => {
        const brush = canvasBrushesByLayer.value[layerValue];
        if (brush && maskData) {
          brush.restoreImageData(maskData as string);
        }
      });
    } else if (data.brushMask && activeCanvasBrush.value) {
      // 向后兼容：单个 brushMask 时恢复到当前图层
      activeCanvasBrush.value.restoreImageData(data.brushMask);
    }

    // 重排导入点的序号（确保显示为连续数字，兼容旧数据）
    renumberSequenceNumbers();

    changePointScaleRelativeCanvas(pointLayer);

    return true;
  } catch (error) {
    console.error('Failed to import canvas JSON:', error);
    return false;
  }
};

onMounted(() => {
    initCanvas();
    loadImage();

    // 初始化撤销/重做管理器
    commandManager = new CommandManager(100);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("focusout", handleFocusOut);

    // 根据 enableHotkeys 配置决定是否注册热键（默认不启用，显式传 true 才启用）
    if (props.options.enableHotkeys) {
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
          if (!effectiveEnableBrush.value) return;
          if (!isCanvasFocused.value && !isMouseOverCanvas.value) return;
          event.preventDefault();
          brushTool();
        },
        e: (event: KeyboardEvent) => {
          if (!effectiveEnableBrush.value) return;
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

      // 🔧 多实例支持：unsubscribe 保存在当前组件作用域，不再使用全局 window 存储
      hotkeysUnsubscribe = unsubscribe;
    }
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
    isSpacePressed.value = true;
    if (isMouseInCanvas()) {
      e.preventDefault();
      return false;
    }
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    isSpacePressed.value = false;
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

  // 销毁笔刷光标
  destroyBrushCursor();

  app?.destroy();
  app = null;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener('focusout', handleFocusOut);

  // 🔧 多实例支持：调用当前实例自己的 unsubscribe，不再使用全局 window
  if (hotkeysUnsubscribe) {
    hotkeysUnsubscribe();
    hotkeysUnsubscribe = null;
  }

  // 清理未释放的 blob URL
  for (const url of blobUrls) {
    URL.revokeObjectURL(url);
  }
  blobUrls.clear();
});

// 工具切换函数
const selectTool = () => {
  currentTool.value = "select";
  showBrushPanel.value = false;
  if (!app) return 
  app.editor.config.moveable = false
  app.editor.config.resizeable = false
  app.editor.config.multipleSelect = true
  Object.values(canvasBrushesByLayer.value).forEach(brush => brush.setPointerEvents(false));
  updateLabelEditable(false);
};

const pointTool = () => {
  currentTool.value = "point";
  showBrushPanel.value = false;
  if (!app) return 
  app.editor.config.moveable = true
  app.editor.config.multipleSelect = false
  app.editor.config.boxSelect = false
  Object.values(canvasBrushesByLayer.value).forEach(brush => brush.setPointerEvents(false));
  updateLabelEditable(false);
};

const brushTool = (openPanel?: boolean) => {
  if (!effectiveEnableBrush.value) return;
  currentTool.value = "brush";
  if (!app) return;
  app.editor.config.moveable = false;
  app.editor.config.resizeable = false;
  app.editor.config.multipleSelect = false;
  Object.entries(canvasBrushesByLayer.value).forEach(([layerValue, brush]) => {
    brush.setPointerEvents(layerValue === effectiveCurrentLayer.value);
  });
  updateLabelEditable(false);
  const willOpen = openPanel !== undefined ? openPanel : !showBrushPanel.value;
  showBrushPanel.value = willOpen;
  if (willOpen) {
    nextTick(() => {
      if (brushButtonRef.value) {
        brushButtonRect.value = brushButtonRef.value.getBoundingClientRect();
      }
    });
  }
};

const closeBrushPanel = () => {
  showBrushPanel.value = false;
};

const updateBrushStyle = (style: Partial<BrushStyle>) => {
  if (!effectiveEnableBrush.value) return;
  Object.assign(localBrushStyle.value, style);
  if (style.eraserSize !== undefined) {
    localEraserSize.value = style.eraserSize;
  }
};

const eraserTool = () => {
  if (!effectiveEnableBrush.value) return;
  currentTool.value = "eraser";
  showBrushPanel.value = false;
  if (!app) return;
  app.editor.config.moveable = false;
  app.editor.config.resizeable = false;
  app.editor.config.multipleSelect = false;
  Object.entries(canvasBrushesByLayer.value).forEach(([layerValue, brush]) => {
    brush.setPointerEvents(layerValue === effectiveCurrentLayer.value);
  });
  updateLabelEditable(false);
};

// ====== 笔刷光标（跟随鼠标的预览圆圈） ======

const createBrushCursor = () => {
  if (!app) return;
  if (brushCursorLayer) return;  // 已创建，避免重复
  if (!brushCursorEnabled.value) return;  // 用户配置关闭了笔刷光标，不创建

  // 独立图层，zIndex 高于 pointLayer，放在最上层
  brushCursorLayer = new Group({
    name: 'brushCursorLayer',
    pointerEvents: 'none',
  });
  app.tree.add(brushCursorLayer);
  brushCursorLayer.zIndex = 20000;

  // 外层 Group 用于控制透明度
  brushCursorGroup = new Group({
    pointerEvents: 'none',
    visible: false,
  });
  brushCursorLayer.add(brushCursorGroup);

  // 核心圆圈
  const style = localBrushStyle.value;
  const toolSize = currentTool.value === 'eraser' ? localEraserSize.value : style.size;
  brushCursorCircle = new Ellipse({
    around: 'center',
    width: toolSize,
    height: toolSize,
    fill: style.color,
    stroke: style.color,
    strokeWidth: 1,
    pointerEvents: 'none',
  });
  brushCursorGroup.add(brushCursorCircle);

  brushCursorCircleInner = new Ellipse({
    around: 'center',
    width: toolSize,
    height: toolSize,
    fill: 'transparent',
    stroke: '#000000',
    strokeWidth: 1,
    pointerEvents: 'none',
    visible: false,
  });
  brushCursorGroup.add(brushCursorCircleInner);

  updateBrushCursorStyle();
};

const showBrushCursor = () => {
  if (!brushCursorGroup) return;
  brushCursorGroup.visible = true;
  updateBrushCursorStyle();
};

const hideBrushCursor = () => {
  if (!brushCursorGroup) return;
  brushCursorGroup.visible = false;
};

const updateBrushCursorStyle = () => {
  if (!brushCursorCircle || !brushCursorGroup) return;
  const style = localBrushStyle.value;
  const tool = currentTool.value;

  if (tool === 'brush') {
    brushCursorCircle.set({
      width: style.size,
      height: style.size,
      fill: style.color,
      stroke: style.color,
      strokeWidth: 1,
      dashPattern: null as any,
    });
    brushCursorGroup.opacity = style.opacity;
    if (brushCursorCircleInner) {
      brushCursorCircleInner.visible = false;
    }
  } else if (tool === 'eraser') {
    brushCursorCircle.set({
      width: localEraserSize.value,
      height: localEraserSize.value,
      fill: 'transparent',
      stroke: '#ffffff',
      strokeWidth: 2,
      dashPattern: null as any,
    });
    if (brushCursorCircleInner) {
      brushCursorCircleInner.set({
        width: localEraserSize.value,
        height: localEraserSize.value,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 1,
        visible: true,
      });
    }
    brushCursorGroup.opacity = 1;
  }
  brushCursorCircle.around = 'center';
  if (brushCursorCircleInner) {
    brushCursorCircleInner.around = 'center';
  }
};

const updateBrushCursorPos = (x: number, y: number) => {
  if (!brushCursorCircle) return;
  brushCursorCircle.set({ x, y });
  if (brushCursorCircleInner) {
    brushCursorCircleInner.set({ x, y });
  }
};

// 切换工具时统一更新光标显示状态
const syncBrushCursorVisibility = () => {
  // 配置关闭：不显示自定义光标，也不隐藏浏览器默认指针
  if (!brushCursorEnabled.value) {
    hideBrushCursor();
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = '';
      canvasContainer.value.querySelectorAll('canvas').forEach((el) => {
        (el as HTMLCanvasElement).style.cursor = '';
      });
    }
    return;
  }
  const isBrushMode = currentTool.value === 'brush' || currentTool.value === 'eraser';
  if (isBrushMode) {
    showBrushCursor();
  } else {
    hideBrushCursor();
  }
  // 隐藏浏览器默认鼠标指针（笔刷/橡皮擦模式用自定义圆圈光标替代）
  // 作用于 canvas 容器与内部所有 canvas 元素（防止 Leafer 内部元素可能自带 cursor）
  if (canvasContainer.value) {
    canvasContainer.value.style.cursor = isBrushMode ? 'none' : '';
    canvasContainer.value.querySelectorAll('canvas').forEach((el) => {
      (el as HTMLCanvasElement).style.cursor = isBrushMode ? 'none' : '';
    });
  }
};

// 销毁笔刷光标
const destroyBrushCursor = () => {
  // 恢复浏览器默认指针，防止卸载后残留 cursor: none
  if (canvasContainer.value) {
    canvasContainer.value.style.cursor = '';
    canvasContainer.value.querySelectorAll('canvas').forEach((el) => {
      (el as HTMLCanvasElement).style.cursor = '';
    });
  }
  if (brushCursorCircle) {
    brushCursorCircle.destroy();
    brushCursorCircle = null;
  }
  if (brushCursorCircleInner) {
    brushCursorCircleInner.destroy();
    brushCursorCircleInner = null;
  }
  if (brushCursorGroup) {
    brushCursorGroup.destroy();
    brushCursorGroup = null;
  }
  if (brushCursorLayer) {
    brushCursorLayer.destroy();
    brushCursorLayer = null;
  }
};

// ====== /笔刷光标 ======

// 初始化所有笔刷图层（在图片加载后调用）
// 当 enableBrush=false 时，仅做清理工作，不创建任何笔刷 canvas
const initBrushLayers = () => {
  if (!imageWidth.value || !imageHeight.value || !app) return;

  // 清除所有旧的笔刷
  Object.values(canvasBrushesByLayer.value).forEach(brush => {
    brush.getGroup().remove();
  });
  canvasBrushesByLayer.value = {};

  // 禁用笔刷 → 不创建任何图层
  if (!effectiveEnableBrush.value) {
    return;
  }

  // 为每个图层创建独立的 CanvasBrush 实例
  effectiveBrushLayers.value.forEach((layerConfig) => {
    const layerBrushStyle: BrushStyle = {
      color: layerConfig.color || localBrushStyle.value.color,
      opacity: layerConfig.opacity !== undefined ? layerConfig.opacity : localBrushStyle.value.opacity,
      size: layerConfig.size || localBrushStyle.value.size,
      minSize: localBrushStyle.value.minSize,
      maxSize: localBrushStyle.value.maxSize,
      continuity: localBrushStyle.value.continuity,
    };

    const brush = new CanvasBrush(
      imageWidth.value!,
      imageHeight.value!,
      layerBrushStyle
    );

    contentLayer.add(brush.getGroup());
    canvasBrushesByLayer.value[layerConfig.value] = brush;
  });

  // 默认选中第一个图层
  if (!internalCurrentLayer.value) {
    internalCurrentLayer.value = effectiveBrushLayers.value[0]?.value || DEFAULT_LAYER_VALUE;
  }

  updateAllLayersVisibility();
};

const updateAllLayersVisibility = () => {
  Object.values(canvasBrushesByLayer.value).forEach(brush => {
    const group = brush.getGroup();
    if (group) {
      (group as any).visible = true;
    }
  });
};

// 切换当前图层
const setActiveLayer = (layerValue: string) => {
  if (!effectiveBrushLayers.value.some(l => l.value === layerValue)) return;
  internalCurrentLayer.value = layerValue;
  if (!props.currentLayer) {
    emit('update:currentLayer', layerValue);
    emit('layerChange', layerValue);
  }
};

// 兼容旧代码
const initBrushLayer = initBrushLayers;

// 笔刷绘制事件处理
let brushSnapshotBeforeDraw: string | null = null;
let brushSnapshotLayer: string | null = null;

const handleBrushDown = (e: any) => {
  if (currentTool.value !== 'brush' && currentTool.value !== 'eraser') return;
  if (!app || !imageBox || !activeCanvasBrush.value) return;
  if (isSpacePressed.value) return;

  isDrawing.value = true;
  brushSnapshotLayer = effectiveCurrentLayer.value;

  // 保存当前画布快照（用于撤销）
  if (commandManager) {
    brushSnapshotBeforeDraw = activeCanvasBrush.value.getImageData();
  }

  // 获取相对于图片的坐标（与点标注相同的方式）
  const point = contentLayer.getBoxPoint({ x: e.x, y: e.y });

  // 判断是否为擦除模式
  const isErase = currentTool.value === 'eraser';

  // 根据模式绘制到当前激活图层
  if (isErase) {
    activeCanvasBrush.value.erase(point.x, point.y, localEraserSize.value, localBrushStyle.value.continuity);
  } else {
    activeCanvasBrush.value.draw(
      point.x,
      point.y,
      localBrushStyle.value.size,
      localBrushStyle.value.color,
      localBrushStyle.value.opacity,
      localBrushStyle.value.continuity
    );
  }

  // 触发 Canvas 重绘
  activeCanvasBrush.value.getCanvas().paint();
};

const handleBrushMove = (e: any) => {
  if (!isDrawing.value || !activeCanvasBrush.value || !imageBox) return;
  if (isSpacePressed.value) return;

  // 获取相对于图片的坐标（与点标注相同的方式）
  const point = contentLayer.getBoxPoint({ x: e.x, y: e.y });

  // 判断是否为擦除模式
  const isErase = currentTool.value === 'eraser';

  // 根据模式绘制到当前激活图层
  if (isErase) {
    activeCanvasBrush.value.erase(point.x, point.y, localEraserSize.value, localBrushStyle.value.continuity);
  } else {
    activeCanvasBrush.value.draw(
      point.x,
      point.y,
      localBrushStyle.value.size,
      localBrushStyle.value.color,
      localBrushStyle.value.opacity,
      localBrushStyle.value.continuity
    );
  }

  // 触发 Canvas 重绘
  activeCanvasBrush.value.getCanvas().paint();
};

const handleBrushUp = () => {
  isDrawing.value = false;

  // 如果有保存的快照，创建撤销命令（使用操作开始时的图层）
  if (commandManager && brushSnapshotLayer && canvasBrushesByLayer.value[brushSnapshotLayer] && brushSnapshotBeforeDraw) {
    const snapshotCommand = new BrushSnapshotCommand(canvasBrushesByLayer.value[brushSnapshotLayer], brushSnapshotBeforeDraw);
    commandManager.executeCommand(snapshotCommand);
    brushSnapshotBeforeDraw = null;
    brushSnapshotLayer = null;
  }

  // 重置上一个点，避免下次绘制时从上次结束的地方连线
  activeCanvasBrush.value?.resetLastPoint();
};

// 生成 UUID
// const generateUUID = (): string => {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// };

// 处理画布点击事件
const handleCanvasTap = async (e: any) => {
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

  // 创建点标注（beforeCreatePoint 检查统一放在 createPointAnnotation 内部）
  await createPointAnnotation(point.x, point.y);
};

// 处理点击【标注点】选中样式
// const handlePointAnnotationSelected = (e: any) => {
//   if (currentTool.value === 'brush' || currentTool.value === 'eraser' || !app || !imageBox) return;
//   // console.log(e)
//   if (e.value) {
//     if (Array.isArray(e.value)) {
//       e.value.forEach((element: { circle: { set: (arg0: { fill: string; stroke: string, selected: boolean; }) => void; }; }) => {
//         if (!element.circle) return
//         element.circle.set({
//           fill: pointStyle.value.selectedCircleFill,
//           stroke: pointStyle.value.selectedCircleStroke,
//           selected: true,
//         })
//       });
//     } else {
//       const _target = e.value.circle || e.value.parent.circle
//       if (!_target) return
//       _target.set({
//         fill: pointStyle.value.selectedCircleFill,
//         stroke: pointStyle.value.selectedCircleStroke,
//         selected: true,
//       })
//     }
//   }
//   if (e.oldValue && (!Array.isArray(e.oldValue) || !e.value)) {
//     if (Array.isArray(e.oldValue)) {
//       e.oldValue.forEach((element: { circle: { set: (arg0: { fill: string; stroke: string, selected: boolean; }) => void; }; }) => {
//         if (!element.circle) return
//         element.circle.set({
//           fill: pointStyle.value.circleFill,
//           stroke: pointStyle.value.circleStroke,
//           selected: false,
//         })
//       });
//     } else {
//       const _target = e.oldValue.circle || e.oldValue.parent.circle
//       if (!_target || (e.oldValue === e.value?.parent)) return
//       _target.set({
//         fill: pointStyle.value.circleFill,
//         stroke: pointStyle.value.circleStroke,
//         selected: false,
//       })
//     }
//   }
// }

// 处理点击【标注点】选中样式
const previousSelectedStates = new Map<string, boolean>();
// 🔒 外部联动时设置的锁：防止 SELECT 事件回调中再次 emit point-select 造成循环
let isExternalSelectSync = false;

const handlePointAnnotationSelected = (e: any) => {
  if (currentTool.value === 'brush' || currentTool.value === 'eraser' || !app || !imageBox) return;

  const selectedIds = new Set<string>();
  const newValues = Array.isArray(e.value) ? e.value : (e.value ? [e.value] : []);
  newValues.forEach((element: any) => {
    if (element.data?.id) selectedIds.add(element.data.id);
  });

  pointLayer.children.forEach((p: any) => {
    if (p._element_tag !== 'point-annotation') return;
    const id = p.data?.id;
    const isSelected = selectedIds.has(id);
    const wasSelected = previousSelectedStates.get(id) ?? false;
    p.handlePointAnnotationSelected?.(isSelected);
    if (isSelected !== wasSelected) {
      previousSelectedStates.set(id, isSelected);
      if (!isExternalSelectSync) {
        emit("point-select", { ...p.data }, isSelected);
      }
    }
  });
};

// 创建点标注
const createPointAnnotation = async (pixelX: number, pixelY: number): Promise<string | null> => {
  if (!imageWidth.value || !imageHeight.value) return null;

  // 📍 创建点标注前，父组件可介入做业务判定
  if (props.beforeCreatePoint) {
    const normalizedX = pixelX / (imageWidth.value || 1);
    const normalizedY = pixelY / (imageHeight.value || 1);
    const result = props.beforeCreatePoint(
      pixelX, pixelY,
      normalizedX, normalizedY,
      pointAnnotations.value.length
    );
    const allow = result instanceof Promise ? await result : result;
    if (!allow) return null;
  }

  // const id = `point_${generateUUID()}`;
  const id = `point_${pointCounter.value}`
  // const label = `#${pointCounter.value}`;
  const order = pointCounter.value;
  const sequenceNumber = pointAnnotations.value.length + 1;

  // 计算归一化坐标
  const normalizedX = pixelX / imageWidth.value;
  const normalizedY = pixelY / imageHeight.value;

  const pointData: PointAnnotation = {
    id,
    order,
    sequenceNumber,
    pixel: { x: pixelX, y: pixelY },
    normalized: { x: normalizedX, y: normalizedY },
    // label,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 创建点标注元素
  const pointElement = new PointAnnotationElement(pointData, pointStyle.value, () => {
    emit("pointChange", [...pointAnnotations.value]);
  });
  pointElement.setImageSize(imageWidth.value || 1, imageHeight.value || 1);

  pointElement.on(PointerEvent.ENTER, () => {
    emit("point-hover", { ...pointElement.data }, true);
  });
  pointElement.on(PointerEvent.LEAVE, () => {
    emit("point-hover", { ...pointElement.data }, false);
  });

  // 根据当前工具设置标签的可编辑状态
  // 注意：由于 PointAnnotationElement.hitChildren = false，子元素无法接收鼠标事件，
  //       这里设置 label.editable 实际**不会产生视觉效果**（label 永远收不到双击/点击进入编辑）。
  //       保留这段逻辑是为了：
  //       1) 状态上保持一致性（工具切换时设置正确的可编辑状态）
  //       2) 如果未来把 hitChildren 改回 true，这个设置立即生效
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

  return id;
};

// 删除选中的点标注或清除笔刷内容
const deleteSelected = () => {
  // 如果当前工具是笔刷，清除所有笔刷内容（笔刷禁用时不会走到这里）
  if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
    clearBrush();
    return;
  }

  // select 模式下未选中任何元素，清除所有
  if (currentTool.value === 'select') {
    const selected = app?.editor?.list || [];
    // 禁用笔刷时只关心点标注
    let hasBrushContent = false;
    if (effectiveEnableBrush.value) {
      hasBrushContent = Object.values(canvasBrushesByLayer.value).some(brush => brush?.hasContent?.());
    }
    if (selected.length === 0 && (pointAnnotations.value.length > 0 || hasBrushContent)) {
      const confirmMsg = effectiveEnableBrush.value
        ? '确定清除所有标注和笔刷绘制区域吗？'
        : '确定清除所有标注吗？';
      if (confirm(confirmMsg)) {
        clearAllAnnotationsAndBrush();
      }
      return;
    }
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

  // 重排剩余点的序号
  renumberSequenceNumbers();

  // 触发事件
  emit("pointChange", [...pointAnnotations.value]);
};

// 清除所有标注点（不动笔刷）
const clearAllAnnotations = () => {
  if (pointAnnotations.value.length === 0) return;

  // 取消当前 editor 选中，避免 editor 内部持有已删除元素引用
  if (app) app.editor.cancel();

  // 从图层移除所有点元素并销毁
  pointAnnotations.value.forEach((p: any) => {
    const element = pointLayer.children.find((el: any) => el.data?.id === p.id);
    if (element) {
      pointLayer.remove(element);
      element.destroy();
    }
  });
  pointAnnotations.value = [];

  // 清除选中状态追踪
  previousSelectedStates.clear();

  emit("pointChange", []);
};

// 清除所有标注和笔刷
const clearAllAnnotationsAndBrush = () => {
  // 先清除所有点标注
  clearAllAnnotations();

  // 清除所有图层的笔刷（仅当启用笔刷时）
  if (effectiveEnableBrush.value) {
    Object.values(canvasBrushesByLayer.value).forEach(brush => brush.clear());
  }
};

// 重置画布到初始化无图片状态
const resetCanvas = () => {
  clearAllAnnotationsAndBrush();
  if (imageBox) {
    contentLayer.clear();
    imageBox.destroy();
    imageBox = null;
  }
  if (commandManager) {
    commandManager = new CommandManager(100);
  }
  loadStatus.value = 'idle';
};

// 清除当前图层的笔刷内容（仅当启用笔刷时）
const clearBrush = () => {
  if (!effectiveEnableBrush.value) return;
  if (activeCanvasBrush.value) {
    if (commandManager) {
      const beforeSnapshot = activeCanvasBrush.value.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(activeCanvasBrush.value, beforeSnapshot, true);
      commandManager.executeCommand(snapshotCommand);
    }

    activeCanvasBrush.value.clear();
    activeCanvasBrush.value.getCanvas().paint();
  }
};

// 清除所有图层的笔刷内容（仅当启用笔刷时）
const clearAllBrushLayers = () => {
  if (!effectiveEnableBrush.value) return;
  Object.entries(canvasBrushesByLayer.value).forEach(([_layerValue, brush]) => {
    if (commandManager) {
      const beforeSnapshot = brush.getImageData();
      const snapshotCommand = new BrushSnapshotCommand(brush, beforeSnapshot, true);
      commandManager.executeCommand(snapshotCommand);
    }
    brush.clear();
    brush.getCanvas().paint();
  });
};

// 获取当前激活图层
const getCurrentLayer = (): string => {
  return effectiveCurrentLayer.value;
};

// 获取所有图层配置
const getAllLayers = (): BrushLayerConfig[] => {
  return [...effectiveBrushLayers.value];
};

// 获取点标注数据
const getPointAnnotations = (): PointAnnotation[] => {
  return [...pointAnnotations.value];
};

// 更新指定标注点的 label（父组件通过 id 找到对应元素并更新名称）
// 支持点标注后，父组件通过此方法改点标注点的名称
const updatePointAnnotationLabel = (id: string, label: string): boolean => {
  const element = pointLayer.children.find((el: any) => el.data?.id === id) as PointAnnotationElement;
  if (!element) return false;
  if (element.updateLabel) {
    element.updateLabel(label);
  }
  emit("pointChange", [...pointAnnotations.value]);
  return true;
};

// 根据所有标注点的轨迹，在当前笔刷层中生成闭合多边形填充区域
// - 点 < 3 不操作（无法形成多边形）
// - 自动按 sequenceNumber 排序
// - 使用当前笔刷的 color、opacity
// - 支持撤销/重做
// - 笔刷禁用时返回 false
const createBrushFromPoints = (): boolean => {
  if (!effectiveEnableBrush.value) return false;
  const brush = activeCanvasBrush.value;
  if (!brush) return false;
  const points = [...pointAnnotations.value];
  if (points.length < 3) return false;
  points.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const pixelPoints = points.map(p => ({ x: p.pixel.x, y: p.pixel.y }));

  // 操作前保存快照（BrushSnapshotCommand 会在第一次 execute 时自动保存操作后快照）
  const beforeSnapshot = brush.getImageData();

  // 执行填充多边形（color 就是笔刷的颜色；opacity 由外层 Group 控制，canvas 上设为 1）
  brush.fillPolygon(pixelPoints, localBrushStyle.value.color);

  // 包装为撤销命令（第一次 execute 时 BrushSnapshotCommand 会自动保存操作后快照）
  if (commandManager) {
    const snapshotCommand = new BrushSnapshotCommand(brush, beforeSnapshot);
    commandManager.executeCommand(snapshotCommand);
  }
  return true;
};

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

const getCurrentTool = (): "select" | "point" | "brush" | "eraser" => {
  return currentTool.value;
};

const setTool = (tool: "select" | "point" | "brush" | "eraser") => {
  // 笔刷禁用时，不允许切到 brush/eraser
  if (!effectiveEnableBrush.value && (tool === 'brush' || tool === 'eraser')) {
    return;
  }
  switch (tool) {
    case 'point':
      pointTool();
      break;
    case 'brush':
      brushTool();
      break;
    case 'eraser':
      eraserTool();
      break;
    case 'select':
      selectTool();
      break;
  }
};

// 根据当前数组顺序重排所有点的显示序号（sequenceNumber）
const renumberSequenceNumbers = () => {
  // 1. 更新数据中的 sequenceNumber
  pointAnnotations.value.forEach((p, i) => {
    p.sequenceNumber = i + 1;
  });

  // 2. 按数据顺序查找对应 DOM 元素并更新 circleText.text
  //    （注意：pointLayer.children 顺序可能与 pointAnnotations 不一致，比如 undo/redo 后）
  pointAnnotations.value.forEach((p, i) => {
    const child = pointLayer.children.find((el: any) => el.data?.id === p.id) as PointAnnotationElement;
    if (child?.updateSequenceNumber) {
      child.updateSequenceNumber(i + 1);
    }
  });
};

const removePointAnnotation = (id: string): boolean => {
  const index = pointAnnotations.value.findIndex(p => p.id === id);
  if (index === -1) return false;

  const element = pointLayer.children[index];
  if (!element) return false;

  if (commandManager) {
    const removeCommand = new RemovePointCommand(pointLayer, element as any, pointAnnotations.value);
    commandManager.executeCommand(removeCommand);
  } else {
    pointLayer.remove(element);
    element.destroy();
    pointAnnotations.value.splice(index, 1);
  }

  // 重排所有点的序号
  renumberSequenceNumbers();

  emit("pointChange", [...pointAnnotations.value]);
  return true;
};

const findPointElement = (pointId: string): PointAnnotationElement | null => {
  if (!pointLayer || !pointLayer.children) return null;
  for (const el of pointLayer.children as any[]) {
    if (el?._element_tag === 'point-annotation' && el.data?.id === pointId) {
      return el as PointAnnotationElement;
    }
  }
  return null;
};

const findPointBySequenceNumber = (seq: number): { id: string; data: any } | null => {
  if (!pointLayer || !pointLayer.children) return null;
  for (const el of pointLayer.children as any[]) {
    if (el?._element_tag === 'point-annotation' && el.data?.sequenceNumber === seq) {
      return { id: el.data.id, data: { ...el.data } };
    }
  }
  return null;
};

const setPointHoverState = (pointId: string, isHover: boolean): boolean => {
  const element = findPointElement(pointId);
  if (!element) return false;
  element.setHoverState(isHover);
  return true;
};

// 设置点的选中状态（通过 editor API，确保 editor 内部选中集与 previousSelectedStates 一致）
// 为什么通过 editor API？—— 如果只改点元素样式和 previousSelectedStates，
// 下次 editor 触发 SELECT 事件时，判断逻辑会错乱（状态不同步）。
const setPointSelectState = (pointId: string, isSelected: boolean): boolean => {
  const element = findPointElement(pointId);
  if (!element || !app?.editor) return false;

  const currentList = app.editor.list || [];
  const isInList = currentList.some((el: any) => el.data?.id === pointId);

  // 已经是目标状态，无需操作
  if (isSelected === isInList) return true;

  // 上锁：SELECT 事件回调中检测到此标志时不 emit point-select，防止循环联动
  isExternalSelectSync = true;
  try {
    if (isSelected) {
      // ✅ 替换模式：只选中目标点，清除其他所有选中
      // 符合编辑器默认交互语义（点击一个点 = 只选中这个点）
      app.editor.select(element);
    } else {
      // 排除模式：从当前选中中移除目标点
      const remaining = currentList.filter((el: any) => el.data?.id !== pointId);
      if (remaining.length === 0) {
        app.editor.cancel();
      } else {
        try {
          (app.editor as any).select(remaining);
        } catch {
          app.editor.select(remaining[0]);
        }
      }
    }
  } finally {
    setTimeout(() => { isExternalSelectSync = false; }, 0);
  }
  return true;
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
  exportMaskImageByLayer,
  exportAllMaskImages,
  getMaskBlob,
  getMaskFile,
  getAllMaskBlobs,
  getMaskUIBlob,
  exportCOCO,
  exportYOLO,
  importCanvasJSON,
  clearBrush,
  clearAllBrushLayers,
  clearAllAnnotations,
  clearAllAnnotationsAndBrush,
  resetCanvas,
  zoomIn,
  zoomOut,
  resetZoom,
  undo,
  redo,
  getCurrentTool,
  setTool,
  selectTool,
  pointTool,
  brushTool,
  eraserTool,
  deleteSelected,
  getCurrentLayer,
  setActiveLayer,
  getAllLayers,
  createPointAnnotation,
  removePointAnnotation,
  updatePointAnnotationLabel,
  createBrushFromPoints,
  getBrushStyle: () => ({ ...localBrushStyle.value }),
  updateBrushStyle,
  setPointHoverState,
  setPointSelectState,
  findPointBySequenceNumber,
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
  --leafer-point-color-placeholder: #999999;
  --leafer-point-color-border: #ddd;
  --leafer-point-color-border-light: #e0e0e0;
  --leafer-point-color-error: #e74c3c;
  --leafer-point-color-button: #3498db;
  --leafer-point-color-button-rgb: 52, 152, 219;
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
  height: 100%;
  position: relative;
  overflow: hidden;
  outline: none;
}

.point-annotation.has-image .canvas-container {
  height: calc(100% - 55px);
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
  background: linear-gradient(135deg, var(--loading-gradient-start, #f0edff) 0%, var(--loading-gradient-end, #e6f0ff) 100%);
  background-size: 200% 200%;
  animation: gradientShift var(--leafer-point-animation-gradient) ease-in-out
    infinite;
  opacity: 0.6;
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
  color: var(--loading-text-color, #4a5568);
  font-size: 18px;
  font-weight: 500;
  text-shadow: none;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--leafer-point-color-white);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  border: 3px dashed var(--leafer-point-color-border);
  transition: all 0.2s ease;
}

.upload-icon {
  color: var(--leafer-point-color-placeholder);
  margin-bottom: 24px;
  transform: scale(1.2);
}

.upload-text {
  color: var(--leafer-point-color-text);
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 12px;
}

.upload-hint {
  color: var(--leafer-point-color-placeholder);
  font-size: 14px;
  margin-bottom: 28px;
}

.upload-button {
  padding: 12px 32px;
  background-color: var(--leafer-point-color-button);
  color: white;
  border: none;
  border-radius: var(--leafer-point-border-radius-tool-button);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.upload-button:hover {
  background-color: var(--leafer-point-color-button-hover);
  transform: translateY(-1px);
}

.upload-overlay.drag-over {
  border-color: var(--leafer-point-color-button);
  background-color: rgba(var(--leafer-point-color-button-rgb), 0.05);
}

.upload-overlay.drag-over .upload-icon {
  color: var(--leafer-point-color-button);
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--leafer-point-color-white);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.error-overlay p {
  margin-bottom: 24px;
  color: var(--leafer-point-color-error);
  font-size: 18px;
  font-weight: 500;
}

.error-overlay button {
  padding: 12px 32px;
  background-color: var(--leafer-point-color-button);
  color: white;
  border: none;
  border-radius: var(--leafer-point-border-radius-tool-button);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.error-overlay button:hover {
  background-color: var(--leafer-point-color-button-hover);
  transform: translateY(-1px);
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