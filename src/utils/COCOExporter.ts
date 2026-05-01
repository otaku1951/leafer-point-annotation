import { PointAnnotation } from '@/types';

export interface COCOExportResult {
  info: {
    year: number;
    version: string;
    contributor: string;
    date_created: string;
  };
  images: Array<{
    id: number;
    file_name: string;
    width: number;
    height: number;
  }>;
  annotations: Array<{
    id: number;
    image_id: number;
    category_id: number;
    keypoints: number[];
    num_keypoints: number;
   iscrowd: number;
  }>;
  categories: Array<{
    id: number;
    name: string;
    supercategory: string;
    keypoints: string[];
    skeleton: number[][];
  }>;
}

export function exportCOCOFormat(
  pointAnnotations: PointAnnotation[],
  imageUrl: string,
  imageWidth: number,
  imageHeight: number,
  options?: {
    categoryName?: string;
    imageId?: number;
  }
): COCOExportResult {
  const imageId = options?.imageId || 1;
  const categoryName = options?.categoryName || 'point';

  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  };

  const coco: COCOExportResult = {
    info: {
      year: new Date().getFullYear(),
      version: '1.0',
      contributor: 'leafer-point-annotation',
      date_created: new Date().toISOString().split('T')[0],
    },
    images: [
      {
        id: imageId,
        file_name: getFileName(imageUrl),
        width: imageWidth,
        height: imageHeight,
      },
    ],
    annotations: pointAnnotations.map((point, index) => ({
      id: index + 1,
      image_id: imageId,
      category_id: 1,
      keypoints: [point.pixel.x, point.pixel.y, 2],
      num_keypoints: 1,
      iscrowd: 0,
    })),
    categories: [
      {
        id: 1,
        name: categoryName,
        supercategory: 'annotation',
        keypoints: ['point'],
        skeleton: [],
      },
    ],
  };

  return coco;
}