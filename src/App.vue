<template>
  <div class="app">
    <h1>LeaferJS Point Annotation Test</h1>
    
    <div class="editor-container">
      <PointAnnotation 
        ref="pointAnnotation"
        :imageSource="imageSource" 
        :options="editorOptions"
        @pointChange="handlePointChange"
        @loadStart="handleLoadStart"
        @loadSuccess="handleLoadSuccess"
        @loadError="handleLoadError"
      />
    </div>
    
    <div class="controls">
      <h2>Controls</h2>
      <div class="control-group">
        <label for="imageUrl">Image URL:</label>
        <input 
          type="text" 
          id="imageUrl" 
          v-model="imageUrl" 
          placeholder="Enter image URL"
        />
      </div>
      
      <div class="control-group">
        <button @click="fetchPointData">Get Point Data</button>
        <button @click="exportData">Export Point Data</button>
        <button @click="refreshImage">Refresh Image</button>
      </div>
      
      <div class="control-group">
        <h3>Canvas Export/Import</h3>
        <button @click="exportCanvasJSON">Export Canvas JSON</button>
        <input 
          type="file" 
          ref="fileInput" 
          style="display: none" 
          accept=".json" 
          @change="importCanvasJSON"
        />
        <button @click="triggerFileInput">Import Canvas JSON</button>
      </div>
    </div>
    
    <div class="output">
      <h2>Point Data</h2>
      <pre>{{ pointData }}</pre>
    </div>
    
    <div class="status">
      <h2>Status</h2>
      <p>Image Load Status: {{ loadStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PointAnnotation from './components/PointAnnotation.vue'

// 图片URL
const imageUrl = ref('https://picsum.photos/1280/1080')
const imageSource = computed(() => ({
  id: 'test-image',
  url: imageUrl.value
}))

// 编辑器选项
const editorOptions = ref({
  pointStyle: {
    fill: '#f00',
    stroke: '#fff',
    strokeWidth: 2,
    width: 16,
    height: 16,
    radius: 8
  },
  selectedPointStyle: {
    fill: '#00f',
    stroke: '#fff',
    strokeWidth: 2,
    radius: 10
  }
})

// 状态
const loadStatus = ref('idle')
const pointData = ref('')
const pointAnnotation = ref<InstanceType<typeof PointAnnotation> | null>(null)

// 处理点变化
const handlePointChange = (data: any) => {
  pointData.value = JSON.stringify(data, null, 2)
}

// 处理图片加载开始
const handleLoadStart = () => {
  loadStatus.value = 'loading'
}

// 处理图片加载成功
const handleLoadSuccess = () => {
  loadStatus.value = 'success'
}

// 处理图片加载失败
const handleLoadError = (error: any) => {
  loadStatus.value = 'error'
  console.error('Image load error:', error)
}

// 重新加载图片
const refreshImage = () => {
  if (pointAnnotation.value) {
    pointAnnotation.value.loadImage()
  }
}

// 导出点数据
const exportData = () => {
  // 调用PointAnnotation的getPointAnnotations方法获取最新数据
  if (pointAnnotation.value) {
    const annotations = pointAnnotation.value.getPointAnnotations()
    const data = JSON.stringify(annotations, null, 2)
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'point-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 手动获取点数据
const fetchPointData = () => {
  if (pointAnnotation.value) {
    const annotations = pointAnnotation.value.getPointAnnotations()
    pointData.value = JSON.stringify(annotations, null, 2)
  }
}

// 导出画布JSON
const exportCanvasJSON = () => {
  if (pointAnnotation.value) {
    const json = pointAnnotation.value.exportCanvasJSON()
    
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canvas-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 触发文件输入
const fileInput = ref<HTMLInputElement | null>(null)
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 导入画布JSON
const importCanvasJSON = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const jsonString = e.target?.result as string
      if (pointAnnotation.value) {
        const success = await pointAnnotation.value.importCanvasJSON(jsonString, { resetZoom: true })
        if (success) {
          alert('Canvas imported successfully!')
        } else {
          alert('Failed to import canvas.')
        }
      }
    }
    reader.readAsText(file)
  }
  // 重置文件输入
  target.value = ''
}
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.editor-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 30px;
}

.controls {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.control-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:hover {
  background-color: #0069d9;
}

.output {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: white;
  padding: 15px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.status {
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}
</style>