<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div class="brush-panel-overlay" v-if="visible" @click="$emit('close')"></div>
    
    <!-- 配置面板 -->
    <div 
      class="brush-style-panel" 
      v-if="visible"
      :style="panelStyle"
      @click.stop
    >
      <div class="panel-header">
        <span>笔刷配置</span>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="panel-content">
        <!-- 颜色选择 -->
        <div class="config-item">
          <label class="config-label">颜色: </label>
          <div class="color-picker-wrapper">
            <PickColors 
              v-model:value="localColor" 
              :predefine-colors="predefinedColors"
              placement="right"
              :z-index="2001"
              :popupContainer="false"
            />
          </div>
        </div>
        
        <!-- 透明度 -->
        <div class="config-item">
          <label class="config-label">透明度: </label>
          <input 
            type="range" 
            class="config-slider"
            v-model.number="localOpacity" 
            min="0.1" 
            max="1" 
            step="0.1" 
          />
          <span class="config-value">{{ Math.round(localOpacity * 100) }}%</span>
        </div>
        
        <!-- 大小 -->
        <div class="config-item">
          <label class="config-label">大小:</label>
          <input 
            type="range" 
            class="config-slider"
            v-model.number="localSize" 
            :min="brushStyle.minSize" 
            :max="brushStyle.maxSize" 
          />
          <span class="config-value">{{ localSize }}</span>
        </div>
        
        <!-- 连续性 -->
        <div class="config-item">
          <label class="config-label">连续性: </label>
          <input 
            type="range" 
            class="config-slider"
            v-model.number="localContinuity" 
            min="5" 
            max="50" 
          />
          <span class="config-value">{{ localContinuity }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import PickColors from 'vue-pick-colors';
import type { BrushStyle } from '@/types';

const props = defineProps<{
  visible: boolean;
  brushStyle: BrushStyle;
  buttonRect?: DOMRect | null;
}>();

const emit = defineEmits(['close', 'update']);

// 预定义颜色
const predefinedColors = [
  '#FF4D4F', '#FF7875', '#FFA940', '#FFC53D', 
  '#A0D911', '#52C41A', '#34D399', '#10B981',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#000000', '#666666', '#999999', '#CCCCCC',
];

// 本地状态
const localColor = ref(props.brushStyle.color);
const localOpacity = ref(props.brushStyle.opacity);
const localSize = ref(props.brushStyle.size);
const localContinuity = ref(props.brushStyle.continuity);

// 监听props变化（包括组件重新创建时立即执行）
watch(() => props.brushStyle, (newVal) => {
  localColor.value = newVal.color;
  localOpacity.value = newVal.opacity;
  localSize.value = newVal.size;
  localContinuity.value = newVal.continuity;
}, { deep: true, immediate: true });

// 监听本地状态变化，通知父组件
const notifyUpdate = () => {
  // 确保颜色格式正确（移除可能的alpha值，因为我们有单独的opacity控制）
  let color = localColor.value;
  
  if (color.startsWith('rgba')) {
    // 提取rgb部分并转换为hex
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      color = '#' + 
        parseInt(match[1]).toString(16).padStart(2, '0') +
        parseInt(match[2]).toString(16).padStart(2, '0') +
        parseInt(match[3]).toString(16).padStart(2, '0');
    }
  } else if (color.startsWith('rgb')) {
    // 提取rgb部分并转换为hex
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      color = '#' + 
        parseInt(match[1]).toString(16).padStart(2, '0') +
        parseInt(match[2]).toString(16).padStart(2, '0') +
        parseInt(match[3]).toString(16).padStart(2, '0');
    }
  }
  
  emit('update', {
    color: color,
    opacity: localOpacity.value,
    size: localSize.value,
    continuity: localContinuity.value,
  });
};

watch([localColor, localOpacity, localSize, localContinuity], () => {
  notifyUpdate();
});

// 面板位置计算
const panelStyle = computed(() => {
  if (!props.buttonRect) {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
  const buttonCenterX = props.buttonRect.left + props.buttonRect.width / 2;
  const buttonTop = props.buttonRect.top;
  return {
    left: `${buttonCenterX}px`,
    bottom: `calc(100vh - ${buttonTop - 10}px)`,
    transform: 'translateX(-50%)',
  };
});
</script>

<style scoped>
.brush-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1500;
}

.brush-style-panel {
  position: fixed;
  z-index: 1501;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  min-width: 240px;
  overflow: visible;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--leafer-point-color-background-light);
  border-bottom: 1px solid var(--leafer-point-color-border);
  border-radius: 10px 10px 0 0;
}

.panel-header span {
  font-size: 14px;
  font-weight: 600;
  color: var(--leafer-point-color-text);
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  color: var(--leafer-point-color-text);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--leafer-point-color-border);
}

.panel-content {
  padding: 16px;
  padding-bottom: 24px;
}

.config-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.config-item:last-child {
  margin-bottom: 0;
}

.config-label {
  display: block;
  font-size: 12px;
  color: var(--leafer-point-color-text);
  /* margin-bottom: 8px; */
  min-width: 50px;
  padding-right: 5px;
  text-align: right;
}

.config-value {
  padding-left: 5px;
  font-size: 12px;
  color: var(--leafer-point-color-text);
  width: 30px;
}

.color-picker-wrapper {
  width: 100%;
  margin: -10px 0;
}

.config-slider {
  /* flex: 1;
  width: 100%; */
  width: 200px;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.config-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--leafer-point-color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
}

.config-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--leafer-point-color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
}
</style>
