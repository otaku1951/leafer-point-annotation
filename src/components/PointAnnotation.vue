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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
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

// @ts-ignore - tinykeys 类型声明问题
import { tinykeys } from "tinykeys";

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

const mousePosition = ref({ x: 0, y: 0 });
const isCanvasFocused = ref(false);
const isMouseOverCanvas = ref(false);
const showHotkeys = ref(false);
const currentTool = ref<"select" | "point" | "brush">("select");
const zoomLevel = ref<number>(100);

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
      selectedStyle: {
        ...props.options.selectedPointStyle,
      }
    },
    tree: {
      type: "design",
    },
  });

  app?.tree.add(contentLayer);

  if (app) {
    app.on(ZoomEvent.ZOOM, () => {
      updateZoomLevel();
    });
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

interface PointAnnotation {
  id: string;
  x: number;
  y: number;
  normalized: {
    x: number;
    y: number;
  };
}

const getPointAnnotations = (): PointAnnotation[] => {
  return [];
};

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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);

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

onUnmounted(() => {
  if (imageBox) {
    app?.tree.remove(imageBox);
    imageBox = null;
  }
  app?.destroy();
  app = null;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mousemove", handleMouseMove);

  if (window.__pointAnnotationHotkeysUnsubscribe) {
    window.__pointAnnotationHotkeysUnsubscribe();
    delete window.__pointAnnotationHotkeysUnsubscribe;
  }
});

const selectTool = () => {
  currentTool.value = "select";
};

const pointTool = () => {
  currentTool.value = "point";
};

const brushTool = () => {
  currentTool.value = "brush";
};

const undo = () => {
  // TODO: implement undo
};

const redo = () => {
  // TODO: implement redo
};

const deleteSelected = () => {
  // TODO: implement delete
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
};

defineExpose({
  getPointAnnotations,
  getImageInfo,
  exportCanvasJSON,
  importCanvasJSON,
  loadImage,
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
</style>