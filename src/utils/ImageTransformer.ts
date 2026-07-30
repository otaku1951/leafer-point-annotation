export type TransformDirection = 'rotate90' | 'flipH' | 'flipV';

export interface TransformedImage {
  blobUrl: string;
  blob: Blob;
}

/**
 * 图片变换工具 - 基于 Canvas 2D 实现旋转和翻转
 * 用于在图片加载后对像素进行变换，生成新的 Blob URL
 */

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

const createTransformedBlob = (
  img: HTMLImageElement,
  direction: TransformDirection,
): Promise<{ blob: Blob; blobUrl: string }> => {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  if (direction === 'rotate90') {
    canvas = document.createElement('canvas');
    canvas.width = h;
    canvas.height = w;
    ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else if (direction === 'flipH') {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(0, h);
    ctx.scale(1, -1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          resolve({ blob, blobUrl });
        } else {
          reject(new Error('Failed to create blob from transformed canvas'));
        }
      },
      'image/png',
    );
  });
};

/**
 * 对图片进行变换并返回新的 Blob 和 Blob URL
 * @param imageUrl 原始图片 URL
 * @param direction 变换方向：'rotate90' 顺时针90° | 'flipH' 水平翻转 | 'flipV' 垂直翻转
 * @returns 变换后的 blob 和 blobUrl
 */
export const transformImage = async (
  imageUrl: string,
  direction: TransformDirection,
): Promise<TransformedImage> => {
  const img = await loadImage(imageUrl);
  return createTransformedBlob(img, direction);
};
