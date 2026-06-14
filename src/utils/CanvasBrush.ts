import { Canvas, Group } from 'leafer-ui';

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
  private group: Group;
  private width: number;
  private height: number;
  private lastPoint: { x: number; y: number } | null = null;

  constructor(width: number, height: number, style: BrushStyle) {
    this.width = width;
    this.height = height;

    this.canvas = new Canvas({
      width,
      height,
    });
    // 默认禁用点击事件，让点击穿透到图片
    (this.canvas as any).set({ pointerEvents: false });
    
    // 外层 Group，用于设置统一透明度
    this.group = new Group({
      opacity: style.opacity,
    });
    this.group.add(this.canvas);
  }

  public getCanvas(): Canvas {
    return this.canvas;
  }

  public getGroup(): Group {
    return this.group;
  }

  public setOpacity(opacity: number): void {
    this.group.set({ opacity });
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
    _opacity: number,
    continuity: number
  ): void {
    const { context } = this.canvas;
    
    // 保存当前状态
    context.save();
    
    context.fillStyle = color;
    context.globalAlpha = 1;  // 始终 1，透明度由 Group 控制

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
    this.canvas.paint();
    this.group.set({ dirty: true });
  }

  public getImageData(): string {
    return this.canvas.context.canvas.toDataURL('image/png');
  }

  public restoreImageData(dataUrl: string, callback?: () => void): void {
    const img = new Image();
    img.onload = () => {
      const { context } = this.canvas;
      context.clearRect(0, 0, this.width, this.height);
      context.drawImage(img, 0, 0);
      this.canvas.paint();
      this.group.set({ dirty: true });
      if (callback) callback();
    };
    img.src = dataUrl;
  }

  public hasContent(): boolean {
    if (this.width === 0 || this.height === 0) return false;
    const imageData = this.canvas.context.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
    return false;
  }

  // 根据点集合绘制闭合多边形并填充
  // 用于把标注点的轨迹一键生成笔刷区域
  public fillPolygon(points: { x: number; y: number }[], color: string): void {
    if (points.length < 3) return;
    const { context } = this.canvas;
    context.save();
    context.fillStyle = color;
    context.globalAlpha = 1;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
    context.closePath();
    context.fill();
    context.restore();
    this.canvas.paint();
    this.group.set({ dirty: true });
  }
}
