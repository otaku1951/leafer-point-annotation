<template>
  <div class="app">
    <h1>LeaferJS Point Annotation Test</h1>
    
    <div class="editor-container" :class="{ 'multi-instance': enableMultiInstance }">
      <PointAnnotation 
        ref="pointAnnotation"
        v-model:imageSource="imageSource" 
        :options="editorOptions"
        v-model:currentLayer="activeLayer"
        :before-create-point="useBeforeCreatePoint ? beforeCreatePoint : undefined"
        @pointChange="handlePointChange"
        @point-hover="(p, h) => onPointHover('A', p, h)"
        @point-select="(p, s) => onPointSelect('A', p, s)"
        @loadStart="handleLoadStart"
        @loadSuccess="handleLoadSuccess"
        @loadError="handleLoadError"
        @update:currentLayer="handleLayerChange"
        @init="handleAnnotationInit"
      />
      <PointAnnotation 
        v-if="enableMultiInstance"
        ref="pointAnnotation2"
        :imageSource="imageSource2" 
        :options="editorOptions2"
        @pointChange="handlePointChange2"
        @point-hover="(p, h) => onPointHover('B', p, h)"
        @point-select="(p, s) => onPointSelect('B', p, s)"
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
          placeholder="Enter image URL (or leave empty for local upload)"
        />
      </div>

      <div class="control-group">
        <h3>Multi-Layer Mode</h3>
        <div class="multi-layer-row">
          <label>
            <input type="checkbox" v-model="useMultiLayer" />
            Enable multi-layer brush
          </label>
          <span class="layer-info">Active layer: <b>{{ activeLayer }}</b></span>
        </div>
        <div class="multi-layer-row" v-if="useMultiLayer">
          <label>Switch layer (parent-driven):</label>
          <select v-model="activeLayer">
            <option v-for="l in layerConfig" :key="l.value" :value="l.value">{{ l.label }} ({{ l.value }})</option>
          </select>
          <button @click="printAllLayers">Log All Layers</button>
          <button @click="printCurrentLayer">Log Current Layer</button>
        </div>
      </div>
      
      <div class="control-group">
        <button @click="fetchPointData">Get Point Data</button>
        <button @click="exportData">Export Point Data</button>
        <button @click="refreshImage">Refresh Image</button>
        <button @click="reselectLocalImage">🔄 Reselect Local Image (重置画布并重新上传)</button>
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
        <h3>Custom Toolbar (via ref)</h3>
        <p class="subtle">隐藏组件自带工具栏后，父组件自定义按钮调用 API 替代</p>
        <div class="multi-layer-row">
          <label><input type="checkbox" v-model="showToolbar" /> 显示组件工具栏</label>
          <label><input type="checkbox" v-model="showZoomController" /> 显示缩放控制器</label>
          <label><input type="checkbox" v-model="enableBrush" /> 启用笔刷功能</label>
          <label><input type="checkbox" v-model="enableMultiInstance" /> 双实例测试（验证多实例快捷键不冲突）</label>
          <label><input type="checkbox" v-model="useBeforeCreatePoint" /> beforeCreatePoint 前置判定（限 5 点+ 右半区域 + 确认框）</label>
        </div>
        <div class="multi-layer-row">
          <label>背景色: <input type="color" v-model="canvasBackground" style="width: 40px; height: 28px; vertical-align: middle; margin-left: 6px;" /></label>
          <label>最小缩放: <input type="number" v-model.number="zoomMin" step="0.1" min="0.01" max="1" style="width: 70px; margin-left: 6px;" /></label>
          <label>最大缩放: <input type="number" v-model.number="zoomMax" step="0.5" min="1" max="32" style="width: 70px; margin-left: 6px;" /></label>
        </div>
        <p class="subtle">注：画布背景色和缩放范围在图片加载时生效，修改后请重新加载图片</p>
        <div class="multi-layer-row">
          <button
            :class="{ 'active-btn': currentToolValue === 'select' }"
            @click="pointAnnotation?.selectTool()"
          >选择工具</button>
          <button
            :class="{ 'active-btn': currentToolValue === 'point' }"
            @click="pointAnnotation?.pointTool()"
          >点标注工具</button>
          <button
            :class="{ 'active-btn': currentToolValue === 'brush' }"
            @click="pointAnnotation?.brushTool(false)"
          >笔刷工具</button>
          <button
            :class="{ 'active-btn': currentToolValue === 'eraser' }"
            @click="pointAnnotation?.eraserTool()"
          >橡皮擦</button>
        </div>
        <div class="multi-layer-row">
          <button @click="pointAnnotation?.undo()">↶ 撤销</button>
          <button @click="pointAnnotation?.redo()">↷ 重做</button>
          <button @click="deleteSelectedBoth">🗑 删除选中</button>
          <button @click="pointAnnotation?.clearAllAnnotationsAndBrush()">⚠ 清除全部</button>
        </div>
      </div>

      <div class="control-group">
        <h3>Image Transform (via ref API)</h3>
        <p class="subtle">旋转/翻转图片会清空所有已有标注和笔刷数据（简化方案）</p>
        <div class="multi-layer-row">
          <button @click="pointAnnotation?.rotateImage()">↻ 顺时针旋转 90°</button>
          <button @click="pointAnnotation?.rotateImageLeft()">↺ 逆时针旋转 90°</button>
          <button @click="pointAnnotation?.flipImage('h')">⇆ 水平翻转</button>
          <button @click="pointAnnotation?.flipImage('v')">⇅ 垂直翻转</button>
        </div>
        <div v-if="transformedFilePreviewUrl || metaFilePreviewUrl" class="preview-row">
          <div v-if="transformedFilePreviewUrl" class="preview-item">
            <span class="preview-label">当前 file（变换后）</span>
            <img :src="transformedFilePreviewUrl" alt="transformed file" />
            <span class="preview-meta" v-if="localImageInfo?.file">
              {{ localImageInfo.file.name }} · {{ (localImageInfo.file.size / 1024).toFixed(1) }} KB
            </span>
          </div>
          <div v-if="metaFilePreviewUrl" class="preview-item">
            <span class="preview-label">metaFile（原始）</span>
            <img :src="metaFilePreviewUrl" alt="meta file" />
            <span class="preview-meta" v-if="localImageInfo?.metaFile">
              {{ localImageInfo.metaFile.name }} · {{ (localImageInfo.metaFile.size / 1024).toFixed(1) }} KB
            </span>
          </div>
        </div>
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
        <button @click="exportMaskImage">Export Current Layer Mask</button>
        <button @click="exportMaskUIBlob">Export UI Layer (Visual)</button>
        <button @click="clearBrush">Clear Current Layer Brush</button>
        <button @click="clearAllBrushLayers" v-if="useMultiLayer">Clear ALL Layers</button>
        <button @click="resetCanvas" class="danger">Reset Canvas (No Image)</button>
      </div>

      <div class="control-group">
        <h3>Brush Style (via ref API)</h3>
        <p class="subtle">通过组件 ref 调用 updateBrushStyle / getBrushStyle，可单独修改任一字段</p>
        <div class="multi-layer-row">
          <button @click="pointAnnotation?.updateBrushStyle({ color: '#ff4d4f' })">🟥 红色</button>
          <button @click="pointAnnotation?.updateBrushStyle({ color: '#52c41a' })">🟩 绿色</button>
          <button @click="pointAnnotation?.updateBrushStyle({ color: '#1890ff' })">🟦 蓝色</button>
          <button @click="pointAnnotation?.updateBrushStyle({ color: '#faad14' })">🟨 黄色</button>
        </div>
        <div class="multi-layer-row">
          <label>Size: {{ brushStyleSize }}</label>
          <input type="range" min="5" max="300" :value="brushStyleSize" @input="onSizeChange($event)" />
          <button @click="pointAnnotation?.updateBrushStyle({ size: 100 })">Reset Size</button>
        </div>
        <div class="multi-layer-row">
          <label>Opacity: {{ brushStyleOpacity }}</label>
          <input type="range" min="0.1" max="1" step="0.05" :value="brushStyleOpacity" @input="onOpacityChange($event)" />
          <button @click="pointAnnotation?.updateBrushStyle({ opacity: 0.55 })">Reset Opacity</button>
        </div>
        <div class="multi-layer-row">
          <label>Continuity: {{ brushStyleContinuity }}</label>
          <input type="range" min="5" max="50" :value="brushStyleContinuity" @input="onContinuityChange($event)" />
          <button @click="pointAnnotation?.updateBrushStyle({ continuity: 20 })">Reset Continuity</button>
        </div>
        <div class="multi-layer-row">
          <button @click="printBrushStyle">Log Current Brush Style</button>
          <button @click="pointAnnotation?.updateBrushStyle({ color: '#ff4d4f', size: 100, opacity: 0.55, continuity: 20 })">Restore All Defaults</button>
        </div>
      </div>

      <div class="control-group">
        <h3>Upload Mask as File to Backend API (via ref API)</h3>
        <p class="subtle">直接拿 File 对象传给后端 form-data 上传接口，无需自己做 dataURL 转换</p>
        <div class="multi-layer-row">
          <label>上传接口 URL:</label>
          <input type="text" v-model="uploadApiUrl" placeholder="https://your-api.com/upload" style="width: 280px;" />
        </div>
        <div class="multi-layer-row">
          <label>上传字段名:</label>
          <input type="text" v-model="uploadFieldName" placeholder="file" style="width: 120px;" />
          <button @click="uploadMaskFile">📤 上传当前图层 mask 到后端</button>
          <button @click="uploadAllMaskFiles">📦 上传所有图层 mask</button>
        </div>
        <div v-if="uploadLog" class="upload-log">{{ uploadLog }}</div>
      </div>

      <!-- 本地图片 File 上传 demo（演示 loadSuccess 事件推送原始 File 对象） -->
      <div class="control-group">
        <h3>本地图片 File 上传到后端（loadSuccess 事件推送原始 File）</h3>
        <p class="subtle">本地选图后，父组件通过 @load-success 事件拿到原始 File 对象，直接用于 multipart/form-data 上传，无需自己做 dataURL 转换</p>
        <div v-if="localImageInfo" class="multi-layer-row">
          <span>isLocal: <b>{{ localImageInfo.isLocal }}</b></span>
          <span v-if="localImageInfo.file">fileName: <b>{{ localImageInfo.file.name }}</b></span>
          <span>size: <b>{{ localImageInfo.file ? (localImageInfo.file.size / 1024).toFixed(1) + ' KB' : 'N/A' }}</b></span>
          <span>dim: <b>{{ localImageInfo.width }} × {{ localImageInfo.height }}</b></span>
        </div>
        <div v-else class="subtle">请先在画布上点击"选择图片"或拖拽本地图片</div>
        <div class="multi-layer-row">
          <button @click="uploadLocalImageFile">📤 上传本地原始 File 到后端</button>
          <button @click="localImageUploadLog = ''">清除日志</button>
        </div>
        <div v-if="localImageUploadLog" class="upload-log">{{ localImageUploadLog }}</div>
      </div>

      <div class="control-group">
        <h3>Point Label Editor (via ref API)</h3>
        <p class="subtle">点标注后，父组件通过 updatePointAnnotationLabel(id, label) 修改标注点名称</p>
        <div v-if="pointsData.length === 0" class="subtle">暂无点标注，请在画布上点击添加</div>
        <div v-else class="point-list">
          <div v-for="point in pointsData" :key="point.id" class="point-list-row">
            <span class="point-num">#{{ point.sequenceNumber }}</span>
            <input 
              type="text" 
              class="label-input"
              :value="point.label || ''" 
              placeholder="输入自定义名称"
              @input="(e: any) => updatePointLabel(point.id, (e.target as HTMLInputElement).value)"
            />
            <span class="point-id">{{ point.id }}</span>
          </div>
        </div>
      </div>

      <div class="control-group">
        <h3>Generate Brush From Points (via ref API)</h3>
        <p class="subtle">根据标注点轨迹生成闭合多边形填充区域（需 ≥3 个点），使用当前笔刷颜色和透明度</p>
        <div class="multi-layer-row">
          <button @click="generateBrushFromPoints">🎨 一键生成笔刷区域</button>
          <button @click="pointAnnotation?.clearBrush()">🧹 清除当前笔刷层</button>
        </div>
      </div>

      <div class="control-group" v-if="useMultiLayer">
        <h3>Per-Layer Mask Export</h3>
        <div class="multi-layer-row">
          <label>Layer:</label>
          <select v-model="exportLayerValue">
            <option v-for="l in layerConfig" :key="l.value" :value="l.value">{{ l.label }} ({{ l.value }})</option>
          </select>
          <button @click="exportMaskByLayer">Export This Layer Mask</button>
        </div>
        <button @click="exportAllLayerMasks">Export ALL Layer Masks (zip by browser)</button>
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
      <p v-if="localImageInfo">isLocal: <b>{{ localImageInfo.isLocal }}</b> — {{ localImageInfo.file ? '原始 File 可用，可直接用于 multipart/form-data 上传' : '来自外部 URL，无本地 File' }}</p>
      <p>Multi-Layer Mode: {{ useMultiLayer ? 'ON' : 'OFF' }}</p>
      <p v-if="useMultiLayer">Active Layer (v-model:currentLayer): <b>{{ activeLayer }}</b></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import PointAnnotation from './components/PointAnnotation.vue'
import type { OptionsSource } from './types'

// 图片URL
const imageUrl = ref('')
const imageSource = ref<any>(null)

watch(imageUrl, (newUrl) => {
  if (newUrl) {
    imageSource.value = {
      id: 'test-image',
      url: newUrl
    }
  } else {
    imageSource.value = null
  }
})

// --- 多图层相关 ---
const useMultiLayer = ref(false)
const useBeforeCreatePoint = ref(false)  // 📍 beforeCreatePoint 开关
const layerConfig = [
  { label: '前景区域', value: 'foreground' },
  { label: '背景区域', value: 'background' },
  { label: '忽略区域', value: 'ignore' }
]
const activeLayer = ref<string>('foreground')
const exportLayerValue = ref<string>('foreground')

// 当切换到多图层模式时，重置 activeLayer 到默认第一个
watch(useMultiLayer, (enabled) => {
  if (enabled) {
    activeLayer.value = layerConfig[0].value
    exportLayerValue.value = layerConfig[0].value
  }
})

// 编辑器选项（根据 useMultiLayer 动态注入 brushLayers）
const baseOptions: OptionsSource = {
  pointStyle: {
    circleFill: '#00f',
    circleStroke: '#fff',
    selectedCircleFill: '#f00',
    selectedCircleStroke: '#fff'
  },
  brushStyle: {
    color: '#ff4d4f',
    opacity: 0.55,
    size: 100
  },
  brushCursorEnabled: true
}

const showToolbar = ref(false)
const showZoomController = ref(true)
const canvasBackground = ref('#f6f6f6')
const zoomMin = ref(0.2)
const zoomMax = ref(4)
const enableBrush = ref(true)
const enableMultiInstance = ref(false)

const imageSource2 = ref<any>(null)

watch(imageUrl, (newUrl) => {
  if (newUrl) {
    imageSource2.value = { id: 'test-image-2', url: newUrl }
  } else {
    imageSource2.value = null
  }
})

const editorOptions2 = computed<OptionsSource>(() => {
  return {
    pointStyle: {
      circleFill: '#00ff00',
      circleStroke: '#fff',
      hoverCircleFill: '#665533',
      hoverCircleStroke: '#fff',
      selectedCircleFill: '#ff0',
      selectedCircleStroke: '#000'
    },
    brushStyle: {
      color: '#00ff00',
      opacity: 0.55,
      size: 100
    },
    showToolbar: showToolbar.value,
    showZoomController: true,
    enableBrush: enableBrush.value,
    enableHotkeys: false
  }
})

const handlePointChange2 = (points: any[]) => {
  console.log('Editor 2 - Points changed:', points)
}

// =============================================================
// 双向联动：两个 PointAnnotation 实例之间
// - hover 联动（onPointHover）
// - 选中状态联动（onPointSelect）
//
// 匹配规则：按 sequenceNumber（圆圈内序号）匹配
// 语义：A 上第 N 个点 ↔ B 上第 N 个点
// 新增点不做联动；删除由父组件统一执行 deleteSelectedBoth()
// =============================================================

// hover 双向同步（按 sequenceNumber 匹配）
const onPointHover = (source: 'A' | 'B', pointData: any, isHover: boolean) => {
  if (!enableMultiInstance.value) return
  const targetRef = source === 'A' ? pointAnnotation2 : pointAnnotation
  if (!targetRef.value) return
  const target = targetRef.value.findPointBySequenceNumber(pointData.sequenceNumber)
  if (target) {
    targetRef.value.setPointHoverState(target.id, isHover)
  }
}

// 选中状态双向同步（按 sequenceNumber 匹配）
const onPointSelect = (source: 'A' | 'B', pointData: any, isSelected: boolean) => {
  if (!enableMultiInstance.value) return
  const targetRef = source === 'A' ? pointAnnotation2 : pointAnnotation
  if (!targetRef.value) return
  const target = targetRef.value.findPointBySequenceNumber(pointData.sequenceNumber)
  if (target) {
    targetRef.value.setPointSelectState(target.id, isSelected)
  }
}

// === 双实例删除：父组件统一执行 ===
// 由于 hover/选中状态已经双向联动（两端选中的点一致），
// 直接分别调用两个实例的 deleteSelected() 即可保持删除一致。
// 不再依赖 pointChange 事件做删除匹配，避免 renumber 造成的删错问题。
const deleteSelectedBoth = () => {
  pointAnnotation.value?.deleteSelected()
  if (enableMultiInstance.value) {
    pointAnnotation2.value?.deleteSelected()
  }
}

// 双实例模式下：父组件监听 Delete 键，统一删除两个实例的选中标注
const onAppKeyDown = (e: KeyboardEvent) => {
  if (!enableMultiInstance.value) return
  const target = e.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
  if (e.code === 'Delete' || e.key === 'Delete') {
    e.preventDefault()
    deleteSelectedBoth()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onAppKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onAppKeyDown)
})

const editorOptions = computed<OptionsSource>(() => {
  if (useMultiLayer.value) {
    return {
      ...baseOptions,
      brushLayers: layerConfig,
      maxBrushLayers: 8,
      showToolbar: showToolbar.value,
      showZoomController: showZoomController.value,
      canvasBackground: canvasBackground.value,
      zoomMin: zoomMin.value,
      zoomMax: zoomMax.value,
      enableBrush: enableBrush.value,
      enableHotkeys: false
    }
  }
  return {
    ...baseOptions,
    showToolbar: showToolbar.value,
    showZoomController: showZoomController.value,
    canvasBackground: canvasBackground.value,
    zoomMin: zoomMin.value,
    zoomMax: zoomMax.value,
    enableBrush: enableBrush.value,
    enableHotkeys: false
  }
})

// 状态
const loadStatus = ref('idle')
const pointData = ref('')
const pointAnnotation = ref<InstanceType<typeof PointAnnotation> | null>(null)
const pointAnnotation2 = ref<InstanceType<typeof PointAnnotation> | null>(null)
// 点标注列表（用于父组件修改 label 的 demo）
const pointsData = ref<any[]>([])
const maskFormat = ref<'png' | 'jpeg'>('png')
const maskForeground = ref<'black' | 'white'>('black')
const uploadApiUrl = ref<string>('https://your-api.com/upload')
const uploadFieldName = ref<string>('file')
const uploadLog = ref<string>('')
const currentTool = ref<'select' | 'point' | 'brush' | 'eraser'>('select')
const currentToolDisplay = ref('select')
const lastAddedPointId = ref<string | null>(null)
// 本地选图相关：loadSuccess 事件推送的图片信息
const localImageInfo = ref<any>(null)  // { url, width, height, isLocal, file? }
const localImageUploadLog = ref<string>('')
const transformedFilePreviewUrl = ref<string>('')
const metaFilePreviewUrl = ref<string>('')

// 用于 UI 轮询显示当前笔刷样式（每 500ms 触发一次刷新）
const brushStyleTick = ref(0)
setInterval(() => { brushStyleTick.value++ }, 500)

const currentBrushStyle = computed(() => {
  brushStyleTick.value
  return pointAnnotation.value?.getBrushStyle?.() || {
    color: '#ff4d4f', opacity: 0.55, size: 100, continuity: 20, minSize: 5, maxSize: 300
  }
})
const brushStyleSize = computed(() => currentBrushStyle.value.size)
const brushStyleOpacity = computed(() => currentBrushStyle.value.opacity)
const brushStyleContinuity = computed(() => currentBrushStyle.value.continuity)

const currentToolValue = computed(() => {
  brushStyleTick.value
  return pointAnnotation.value?.getCurrentTool?.() || 'select'
})

const onSizeChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  pointAnnotation.value?.updateBrushStyle({ size: val })
}
const onOpacityChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  pointAnnotation.value?.updateBrushStyle({ opacity: val })
}
const onContinuityChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  pointAnnotation.value?.updateBrushStyle({ continuity: val })
}
const printBrushStyle = () => {
  const style = pointAnnotation.value?.getBrushStyle?.()
  console.log('Current brush style:', style)
  alert('Brush style logged to console:\n' + JSON.stringify(style, null, 2))
}

// 父组件感知图层切换
const handleLayerChange = (layer: string) => {
  console.log('[App.vue] Layer changed via event:', layer)
}

// 处理点变化
const handlePointChange = (data: any) => {
  pointData.value = JSON.stringify(data, null, 2)
  const arr = Array.isArray(data) ? [...data] : []
  pointsData.value = arr
}

// 父组件修改某个标注点的 label（demo）
const updatePointLabel = (id: string, newLabel: string) => {
  pointAnnotation.value?.updatePointAnnotationLabel(id, newLabel)
}

// 一键根据标注点生成笔刷区域（demo）
const generateBrushFromPoints = () => {
  const result = pointAnnotation.value?.createBrushFromPoints()
  if (result === false) {
    alert('请先在画布上添加至少 3 个标注点')
  }
}

// 上传当前图层 mask 为 File 到后端接口（demo）
const uploadMaskFile = async () => {
  const file = await pointAnnotation.value?.getMaskFile(undefined, 'mask.png')
  if (!file) {
    uploadLog.value = '❌ 当前图层没有可导出的 mask，先在画布上画几笔或标注'
    return
  }
  if (!uploadApiUrl.value) {
    uploadLog.value = '❌ 请先填写上传接口 URL'
    return
  }
  try {
    const formData = new FormData()
    formData.append(uploadFieldName.value || 'file', file)
    uploadLog.value = `⏳ 正在上传 ${file.name} (${(file.size / 1024).toFixed(1)} KB) 到 ${uploadApiUrl.value}...`
    const res = await fetch(uploadApiUrl.value, { method: 'POST', body: formData })
    const text = await res.text()
    uploadLog.value = `✅ 上传完成，状态 ${res.status}，响应: ${text.substring(0, 300)}`
  } catch (e) {
    uploadLog.value = `❌ 上传失败: ${e}`
  }
}

// 上传所有图层 mask 到后端（demo）
const uploadAllMaskFiles = async () => {
  const blobs = await pointAnnotation.value?.getAllMaskBlobs()
  if (!blobs || Object.keys(blobs).length === 0) {
    uploadLog.value = '❌ 没有可导出的 mask'
    return
  }
  if (!uploadApiUrl.value) {
    uploadLog.value = '❌ 请先填写上传接口 URL'
    return
  }
  try {
    const formData = new FormData()
    let totalSize = 0
    for (const [layerValue, blob] of Object.entries(blobs)) {
      const name = `mask_${layerValue}.png`
      const file = new File([blob], name, { type: 'image/png' })
      formData.append(uploadFieldName.value || 'file', file)
      totalSize += blob.size
    }
    uploadLog.value = `⏳ 正在上传 ${Object.keys(blobs).length} 个文件 (共 ${(totalSize / 1024).toFixed(1)} KB) 到 ${uploadApiUrl.value}...`
    const res = await fetch(uploadApiUrl.value, { method: 'POST', body: formData })
    const text = await res.text()
    uploadLog.value = `✅ 上传完成，状态 ${res.status}，响应: ${text.substring(0, 300)}`
  } catch (e) {
    uploadLog.value = `❌ 上传失败: ${e}`
  }
}

// 上传本地图片原始 File 对象到后端（demo）
// 本地选图后，loadSuccess 事件会推送原始 File 对象，父组件可直接用于 multipart/form-data 上传
const uploadLocalImageFile = async () => {
  const file = localImageInfo.value?.file as File | undefined
  if (!file) {
    localImageUploadLog.value = '❌ 当前不是本地选图，没有原始 File 对象。请先在画布上点击或拖拽选择本地图片'
    return
  }
  if (!uploadApiUrl.value) {
    localImageUploadLog.value = '❌ 请先填写上传接口 URL'
    return
  }
  try {
    const formData = new FormData()
    formData.append(uploadFieldName.value || 'file', file)
    localImageUploadLog.value = `⏳ 正在上传 ${file.name} (${(file.size / 1024).toFixed(1)} KB) 到 ${uploadApiUrl.value}...`
    const res = await fetch(uploadApiUrl.value, { method: 'POST', body: formData })
    const text = await res.text()
    localImageUploadLog.value = `✅ 上传完成，状态 ${res.status}，响应: ${text.substring(0, 300)}`
  } catch (e) {
    localImageUploadLog.value = `❌ 上传失败: ${e}`
  }
}

// 处理图片加载开始
const handleLoadStart = () => {
  loadStatus.value = 'loading'
}

// 处理图片加载成功
// info: { url, width, height, isLocal, file? } — 本地选图时 file 为原始 File 对象
const handleLoadSuccess = (info?: any) => {
  loadStatus.value = 'success'
  localImageInfo.value = info || null
  localImageUploadLog.value = ''
  console.log('[App.vue] loadSuccess payload:', info)

  // 生成 file 和 metaFile 的预览 URL 用于验证
  if (transformedFilePreviewUrl.value) {
    URL.revokeObjectURL(transformedFilePreviewUrl.value)
    transformedFilePreviewUrl.value = ''
  }
  if (metaFilePreviewUrl.value) {
    URL.revokeObjectURL(metaFilePreviewUrl.value)
    metaFilePreviewUrl.value = ''
  }
  if (info?.file) {
    transformedFilePreviewUrl.value = URL.createObjectURL(info.file)
  }
  if (info?.metaFile) {
    metaFilePreviewUrl.value = URL.createObjectURL(info.metaFile)
  }
}

// 处理图片加载失败
const handleLoadError = (error: any) => {
  loadStatus.value = 'error'
  console.error('Image load error:', error)
}

// 重新加载图片（通过重置 imageSource 触发）
const refreshImage = () => {
  const currentSource = imageSource.value
  if (currentSource) {
    imageSource.value = null
    setTimeout(() => {
      imageSource.value = currentSource
    }, 0)
  }
}

// 重新选择本地图片（使用组件内部的上传按钮）
const reselectLocalImage = () => {
  alert('请点击画布上的"选择图片"按钮进行本地图片选择')
}

// 📍 beforeCreatePoint 示例：创建点标注前的业务判定
// 开启 useBeforeCreatePoint 开关后生效，演示 3 种典型场景：
//   1. 限制最多 5 个点
//   2. 只允许在图片右半部分创建
//   3. 创建前弹确认框（异步）
const beforeCreatePoint = async (
  x: number, y: number,
  normalizedX: number, _normalizedY: number,
  existingPointCount: number
) => {
  // 示例 1：限制点数量
  if (existingPointCount >= 5) {
    console.warn('[beforeCreatePoint] 最多只能创建 5 个点标注，已阻止')
    return false
  }

  // 示例 2：只允许在图片右半部分创建
  if (normalizedX < 0.5) {
    console.warn(`[beforeCreatePoint] 点击位置 (nx=${normalizedX.toFixed(2)}) 不在右半部分，已阻止`)
    return false
  }

  // 示例 3：异步确认（实际业务可以替换为 UI 组件的确认框）
  const confirmed = window.confirm(
    `确定在坐标 (${Math.round(x)}, ${Math.round(y)}) 创建第 ${existingPointCount + 1} 个点标注吗？`
  )
  return confirmed
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

// 监听组件初始化完成事件（更可靠的方式）
const handleAnnotationInit = () => {
  console.log('PointAnnotation initialized, now calling pointTool()');
  pointAnnotation.value?.pointTool();
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

// 导出UI层（预览层）- 带颜色的视觉效果
const exportMaskUIBlob = async () => {
  if (!pointAnnotation.value) return
  const blob = await pointAnnotation.value.getMaskUIBlob?.()
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brush-ui-mask.png'
    a.click()
    URL.revokeObjectURL(url)
  } else {
    alert('No brush data to export (UI layer).')
  }
}

// 重置画布到无图片状态
const resetCanvas = () => {
  if (confirm('确定要重置画布吗？这将清除所有标注和笔刷数据，并回到无图片状态。')) {
    imageSource.value = null;
    pointAnnotation.value?.resetCanvas();
  }
};

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

const testAddPoint = async () => {
  if (pointAnnotation.value) {
    const id = await pointAnnotation.value.createPointAnnotation(100, 100)
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

// --- 多图层 API 测试方法 ---
const printAllLayers = () => {
  if (!pointAnnotation.value) return
  const layers = pointAnnotation.value.getAllLayers?.()
  console.log('All layers:', layers)
  alert('Layers printed to console: ' + JSON.stringify(layers, null, 2))
}

const printCurrentLayer = () => {
  if (!pointAnnotation.value) return
  const layer = pointAnnotation.value.getCurrentLayer?.()
  console.log('Current layer:', layer)
  alert('Current layer: ' + layer)
}

const clearAllBrushLayers = () => {
  if (!pointAnnotation.value) return
  pointAnnotation.value.clearAllBrushLayers?.()
  alert('All brush layers cleared!')
}

const exportMaskByLayer = async () => {
  if (!pointAnnotation.value) return
  const mask = await pointAnnotation.value.exportMaskImageByLayer?.(
    exportLayerValue.value,
    maskFormat.value,
    maskForeground.value
  )
  if (mask) {
    const ext = maskFormat.value === 'png' ? 'png' : 'jpg'
    const a = document.createElement('a')
    a.href = mask
    a.download = `brush-mask-${exportLayerValue.value}.${ext}`
    a.click()
  } else {
    alert(`No brush data on layer "${exportLayerValue.value}"`)
  }
}

const exportAllLayerMasks = async () => {
  if (!pointAnnotation.value) return
  const masks = await pointAnnotation.value.exportAllMaskImages?.(
    maskFormat.value,
    maskForeground.value
  )
  if (!masks || Object.keys(masks).length === 0) {
    alert('No brush data on any layer')
    return
  }
  const ext = maskFormat.value === 'png' ? 'png' : 'jpg'
  // 浏览器逐一下载每个图层的 mask
  Object.entries(masks).forEach(([layerValue, maskData], idx) => {
    setTimeout(() => {
      const a = document.createElement('a')
      a.href = maskData
      a.download = `brush-mask-${layerValue}.${ext}`
      a.click()
    }, idx * 300) // 延迟避免浏览器拦截连续下载
  })
  alert(`Started downloading ${Object.keys(masks).length} mask images`)
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

.editor-container.multi-instance {
  display: flex;
  gap: 12px;
  height: auto;
}

.editor-container.multi-instance > :deep(.point-annotation),
.editor-container.multi-instance > .point-annotation {
  flex: 1;
  min-width: 0;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
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

.multi-layer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.multi-layer-row > label {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
}

.multi-layer-row > select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.multi-layer-row > button {
  margin-right: 0;
}

.layer-info {
  font-size: 14px;
  color: #555;
}

.layer-info b {
  color: #007bff;
}

.subtle {
  font-size: 13px;
  color: #888;
  margin: 0 0 8px 0;
}

.preview-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
}

.preview-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.preview-item img {
  max-width: 120px;
  max-height: 120px;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.preview-meta {
  font-size: 11px;
  color: #999;
}

.active-btn {
  background-color: var(--leafer-point-color-primary, #409eff);
  color: white;
  border-color: var(--leafer-point-color-primary, #409eff);
}

.active-btn:hover {
  background-color: var(--leafer-point-color-primary, #409eff);
  opacity: 0.9;
}

/* 点标注列表 - label 编辑 */
.point-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.point-list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
}

.point-num {
  min-width: 32px;
  font-weight: bold;
  color: #007bff;
  font-size: 14px;
}

.label-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.label-input:focus {
  outline: none;
  border-color: #007bff;
}

.point-id {
  font-size: 12px;
  color: #aaa;
  min-width: 80px;
}

.upload-log {
  margin-top: 10px;
  padding: 10px 12px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 13px;
  color: #333;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}
</style>