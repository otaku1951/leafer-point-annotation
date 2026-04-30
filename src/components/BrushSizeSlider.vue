<template>
  <Transition name="fade">
    <div v-if="visible" class="brush-size-slider" :style="positionStyle">
      <div class="slider-header">
        <span class="title">笔刷大小</span>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="slider-body">
        <div class="preview-container">
          <div class="preview-circle" :style="previewStyle"></div>
        </div>
        <input
          type="range"
          :min="min"
          :max="max"
          :value="modelValue"
          @input="handleInput"
          class="range-slider"
        />
        <div class="size-display">
          <span class="size-value">{{ modelValue }}px</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  modelValue: number;
  min: number;
  max: number;
  position?: { x: number; y: number };
  color?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'close': [];
}>();

const positionStyle = computed(() => ({
  left: `${props.position?.x || 50}px`,
  top: `${props.position?.y || 50}px`,
}));

const previewStyle = computed(() => ({
  width: `${props.modelValue}px`,
  height: `${props.modelValue}px`,
  backgroundColor: props.color || '#000000',
}));

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
};
</script>

<style scoped>
.brush-size-slider {
  position: fixed;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 220px;
  user-select: none;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e8e8e8;
}

.slider-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
}

.preview-circle {
  border-radius: 50%;
  opacity: 0.8;
  transition: width 0.1s, height 0.1s;
}

.range-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #f0f0f0;
  border-radius: 3px;
  outline: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #1890ff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
  transition: transform 0.2s;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #1890ff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
}

.size-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-value {
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  min-width: 50px;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>