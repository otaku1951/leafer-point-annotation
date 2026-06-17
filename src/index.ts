import PointAnnotation from './components/PointAnnotation.vue'

// ======================================================================
// 重新导出所有公共类型
// 用户：import type { OptionsSource, ImageSource, PointAnnotationItem, ... } from '@zzalai/leafer-point-annotation'
// ======================================================================
export type {
  PointAnnotation as PointAnnotationItem,  // 点标注数据结构（别名，避免与 Vue 组件 PointAnnotation 命名歧义）
  PointStyle,                              // 点标注样式配置
  BrushStyle,                              // 笔刷样式配置
  BrushLayerConfig,                        // 笔刷图层配置
  BrushStrokeData,                         // 笔刷笔画数据
  ToolType,                                // 工具类型：'select' | 'point' | 'brush' | 'eraser'
  ImageSource,                             // 图片源配置（props.imageSource）
  OptionsSource,                           // 组件配置项（props.options）
  ExportFormat,                            // 导出格式：'json-full' | 'json-points' | 'coco' | 'yolo' | 'image-mask'
  ExportOptions,                           // 导出选项
  ImportOptions,                           // 导入选项
  Statistics,                              // 统计信息
  ExportData,                              // 完整导出数据结构
} from './types'

// ======================================================================
// 重新导出公共常量
// ======================================================================
export {
  DEFAULT_POINT_STYLE,                // 默认点标注样式
  DEFAULT_BRUSH_STYLE,                // 默认笔刷样式
} from './types'

// ======================================================================
// 导出 Vue 组件（默认导出 + 具名导出）
// ======================================================================
export { PointAnnotation }
export default PointAnnotation