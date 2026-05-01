import { PointAnnotation } from '@/types';

export interface YOLOExportResult {
  annotations: string;
  classNames: string;
  imageWidth: number;
  imageHeight: number;
}

export function exportYOLOFormat(
  pointAnnotations: PointAnnotation[],
  imageWidth: number,
  imageHeight: number,
  options?: {
    className?: string;
    pointSize?: number;
  }
): YOLOExportResult {
  const className = options?.className || 'point';
  const pointSize = options?.pointSize || 20;

  const classId = 0;

  const annotationsLines = pointAnnotations.map(point => {
    const xCenter = point.normalized.x;
    const yCenter = point.normalized.y;
    const width = pointSize / imageWidth;
    const height = pointSize / imageHeight;

    return `${classId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
  });

  return {
    annotations: annotationsLines.join('\n'),
    classNames: className,
    imageWidth,
    imageHeight,
  };
}