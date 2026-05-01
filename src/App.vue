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
      
      <div class="control-group">
        <h3>Brush Mask Export</h3>
        <div class="mask-options">
          <label>
            Format:
            <select v-model="maskFormat">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </label>
          <label>
            Foreground:
            <select v-model="maskForeground">
              <option value="black">Black</option>
              <option value="white">White</option>
            </select>
          </label>
        </div>
        <button @click="exportMaskImage">Export Mask Image</button>
        <button @click="clearBrush">Clear Brush</button>
      </div>

      <div class="control-group">
        <h3>Annotation Format Export</h3>
        <button @click="exportCOCO">Export COCO JSON</button>
        <button @click="exportYOLO">Export YOLO</button>
      </div>

      <div class="control-group">
        <h3>API Methods</h3>
        <div class="api-row">
          <button @click="testUndo">Undo</button>
          <button @click="testRedo">Redo</button>
        </div>
        <div class="api-row">
          <label>Tool:</label>
          <select v-model="currentTool">
            <option value="select">Select</option>
            <option value="point">Point</option>
            <option value="brush">Brush</option>
            <option value="eraser">Eraser</option>
          </select>
          <button @click="callSetTool">Set Tool</button>
        </div>
        <div class="api-row">
          <button @click="testAddPoint">Add Point (100,100)</button>
          <button @click="testRemovePoint">Remove Last Point</button>
        </div>
        <div class="api-row">
          <span>Current Tool: {{ currentToolDisplay }}</span>
        </div>
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
const maskFormat = ref<'png' | 'jpeg'>('png')
const maskForeground = ref<'black' | 'white'>('black')
const currentTool = ref<'select' | 'point' | 'brush' | 'eraser'>('select')
const currentToolDisplay = ref('select')
const lastAddedPointId = ref<string | null>(null)

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

// 导出Mask图片
const exportMaskImage = async () => {
  if (pointAnnotation.value) {
    const maskData = await pointAnnotation.value.exportMaskImage(maskFormat.value, maskForeground.value)
    if (maskData) {
      const ext = maskFormat.value === 'png' ? 'png' : 'jpg'
      const a = document.createElement('a')
      a.href = maskData
      a.download = `brush-mask.${ext}`
      a.click()
    } else {
      alert('No brush data to export.')
    }
  }
}

// 导出COCO格式
const exportCOCO = () => {
  if (pointAnnotation.value) {
    const coco = pointAnnotation.value.exportCOCO()
    const blob = new Blob([coco], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'annotation-coco.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 导出YOLO格式
const exportYOLO = () => {
  if (pointAnnotation.value) {
    const yolo = pointAnnotation.value.exportYOLO()
    const blob = new Blob([yolo.annotations], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'annotation-yolo.txt'
    a.click()
    URL.revokeObjectURL(url)

    const classBlob = new Blob([yolo.classNames], { type: 'text/plain' })
    const classUrl = URL.createObjectURL(classBlob)
    const classA = document.createElement('a')
    classA.href = classUrl
    classA.download = 'class-names.txt'
    classA.click()
    URL.revokeObjectURL(classUrl)
  }
}

// 清除笔刷
const clearBrush = () => {
  if (pointAnnotation.value) {
    pointAnnotation.value.clearBrush?.()
    alert('Brush cleared!')
  }
}

// API 测试方法
const testUndo = () => {
  if (pointAnnotation.value) {
    pointAnnotation.value.undo()
  }
}

const testRedo = () => {
  if (pointAnnotation.value) {
    pointAnnotation.value.redo()
  }
}

const callSetTool = () => {
  if (pointAnnotation.value) {
    pointAnnotation.value.setTool(currentTool.value)
    currentToolDisplay.value = currentTool.value
  }
}

const testAddPoint = () => {
  if (pointAnnotation.value) {
    const id = pointAnnotation.value.createPointAnnotation(100, 100)
    if (id) {
      lastAddedPointId.value = id
      alert(`Point added with id: ${id}`)
    }
  }
}

const testRemovePoint = () => {
  if (pointAnnotation.value && lastAddedPointId.value) {
    const success = pointAnnotation.value.removePointAnnotation(lastAddedPointId.value)
    if (success) {
      lastAddedPointId.value = null
      alert('Point removed')
    }
  } else {
    const points = pointAnnotation.value?.getPointAnnotations()
    if (points && points.length > 0) {
      const lastPoint = points[points.length - 1]
      const success = pointAnnotation.value?.removePointAnnotation(lastPoint.id)
      if (success) {
        alert('Last point removed')
      }
    } else {
      alert('No points to remove')
    }
  }
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

.mask-options {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.mask-options label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: normal;
}

.mask-options select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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