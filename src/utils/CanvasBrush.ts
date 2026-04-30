import { Canvas } from 'leafer-ui';

export interface BrushStyle {
  color: string;
  opacity: number;
  size: number;
  minSize: number;
  maxSize: number;
  continuity: number; // 连续性阈值：两个点之间最大距离（像素），超过就用直线连接
}

export class CanvasBrush {
  private canvas: Canvas;
  private width: number;
  private height: number;
  private lastPoint: { x: number; y: number } | null = null;

  constructor(width: number, height: number, _style: BrushStyle) {
    this.width = width;
    this.height = height;

    this.canvas = new Canvas({
      width,
      height,
    });
    // 默认禁用点击事件，让点击穿透到图片
    (this.canvas as any).set({ pointerEvents: false });
  }

  public getCanvas(): Canvas {
    return this.canvas;
  }

  public setPointerEvents(value: boolean): void {
    (this.canvas as any).set({ pointerEvents: value });
  }

  public resetLastPoint(): void {
    this.lastPoint = null;
  }

  public draw(
    x: number,
    y: number,
    size: number,
    color: string,
    opacity: number,
    continuity: number
  ): void {
    const { context } = this.canvas;
    
    // 保存当前状态
    context.save();
    
    context.fillStyle = color;
    context.globalAlpha = opacity;

    // 如果有上一个点，且两点之间距离超过连续性阈值，先画连线
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > continuity) {
        // 画连线（用多个圆填充）
        const steps = Math.ceil(distance / (size / 2));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const midX = this.lastPoint.x + dx * t;
          const midY = this.lastPoint.y + dy * t;
          context.beginPath();
          context.arc(midX, midY, size / 2, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    // 画当前点
    context.beginPath();
    context.arc(x, y, size / 2, 0, Math.PI * 2);
    context.fill();

    // 恢复状态
    context.restore();

    // 保存当前点
    this.lastPoint = { x, y };
  }

  public erase(x: number, y: number, size: number, continuity: number): void {
    const { context } = this.canvas;

    // 保存当前状态
    context.save();
    
    context.globalCompositeOperation = 'destination-out';

    // 如果有上一个点，且两点之间距离超过连续性阈值，先画连线
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > continuity) {
        // 画连线（用多个圆填充）
        const steps = Math.ceil(distance / (size / 2));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const midX = this.lastPoint.x + dx * t;
          const midY = this.lastPoint.y + dy * t;
          context.beginPath();
          context.arc(midX, midY, size / 2, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    // 画当前点
    context.beginPath();
    context.arc(x, y, size / 2, 0, Math.PI * 2);
    context.fill();

    // 恢复状态
    context.restore();

    // 保存当前点
    this.lastPoint = { x, y };
  }

  public clear(): void {
    const { context } = this.canvas;
    context.clearRect(0, 0, this.width, this.height);
    this.resetLastPoint();
  }

  public getImageData(): string {
    return this.canvas.context.canvas.toDataURL('image/png');
  }
}
