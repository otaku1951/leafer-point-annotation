// 点标注数据结构
export interface PointAnnotation {
  id: string;
  pixel: {
    x: number;
    y: number;
  };
  normalized: {
    x: number;
    y: number;
  };
  label: string;
  createdAt: number;
  updatedAt: number;
}

// 点标注样式配置
export interface PointStyle {
  circleRadius: number;
  circleFill: string;
  circleStroke: string;
  circleStrokeWidth: number;
  hoverCircleFill: string;
  hoverCircleStroke: string;
  selectedCircleFill: string;
  selectedCircleStroke: string;
  selectedCircleScale: number;
  labelBackgroundColor: string;
  labelTextColor: string;
  labelFontSize: number;
  labelPadding: number | number[];
  fixedSizeOnZoom?: boolean;      // 是否开启标注点固定大小（不随画布缩放）
  fixedSizeScale?: number;        // 固定大小的缩放系数（默认为1）
}

// 笔刷样式配置
export interface BrushStyle {
  color: string;
  opacity: number;
  size: number;
  minSize: number;
  maxSize: number;
  continuity: number; // 连续性阈值：两个点之间最大距离（像素），超过就用直线连接
}

// 笔刷笔画数据
export interface BrushStrokeData {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  opacity: number;
  size: number;
  createdAt: number;
}

// 工具类型
export type ToolType = 'select' | 'point' | 'brush' | 'eraser';

// 导出格式类型
export type ExportFormat = 'json-full' | 'json-points' | 'coco' | 'yolo' | 'image-mask';

// 导出选项
export interface ExportOptions {
  includeImage?: boolean;
  maskBackground?: string;
  maskForeground?: string;
  prettyPrint?: boolean;
}

// 导入选项
export interface ImportOptions {
  replace?: boolean;
  resetZoom?: boolean;
}

// 统计信息
export interface Statistics {
  pointCount: number;
  brushStrokeCount: number;
  brushAreaPercent: number;
  hasChanges: boolean;
}

// 导出数据结构
export interface ExportData {
  version: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  pointAnnotations: PointAnnotation[];
  brushStrokes: BrushStrokeData[];
  exportTime: number;
}

// 默认点标注样式
export const DEFAULT_POINT_STYLE: PointStyle = {
  circleRadius: 12,  // 8x8 的圆点
  circleFill: '#ff4d4f',
  circleStroke: '#ffffff',
  circleStrokeWidth: 2,
  hoverCircleFill: '#ff7875',
  hoverCircleStroke: '#ffffff',
  selectedCircleFill: '#1890ff',
  selectedCircleStroke: '#ffffff',
  selectedCircleScale: 1.2,
  labelBackgroundColor: '#ffffff',
  labelTextColor: '#333333',
  labelFontSize: 12,
  labelPadding: [2,4],
  fixedSizeOnZoom: false,    // 默认关闭固定大小功能
  fixedSizeScale: 1,         // 默认缩放系数为1
};

// 默认笔刷样式
export const DEFAULT_BRUSH_STYLE: BrushStyle = {
  color: 'rgba(255,0,0,1)',
  opacity: 0.55,
  size: 100,
  minSize: 50,
  maxSize: 150,
  continuity: 28, // 默认连续性阈值：20像素
};