import { Canvas, Group } from 'leafer-ui';

export interface BrushStyle {
  color: string;
  opacity: number;
  size: number;
  minSize: number;
  maxSize: number;
  continuity: number;
}

export class CanvasBrush {
  private dataCanvas: Canvas;
  private previewCanvas: Canvas;
  private group: Group;
  private width: number;
  private height: number;
  private lastPoint: { x: number; y: number } | null = null;
  private currentColor: string = '#000000';

  constructor(width: number, height: number, style: BrushStyle) {
    this.width = width;
    this.height = height;
    this.currentColor = style.color;

    this.dataCanvas = new Canvas({
      width,
      height,
    });
    (this.dataCanvas as any).set({ pointerEvents: false });

    this.previewCanvas = new Canvas({
      width,
      height,
    });
    (this.previewCanvas as any).set({ pointerEvents: false });

    this.group = new Group({
      opacity: style.opacity,
    });
    this.group.add(this.previewCanvas);
  }

  public getCanvas(): Canvas {
    return this.previewCanvas;
  }

  public getDataCanvas(): Canvas {
    return this.dataCanvas;
  }

  public getGroup(): Group {
    return this.group;
  }

  public setOpacity(opacity: number): void {
    this.group.set({ opacity });
  }

  public setPointerEvents(value: boolean): void {
    (this.previewCanvas as any).set({ pointerEvents: value });
  }

  public setColor(color: string): void {
    this.currentColor = color;
    this.updatePreview();
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
    this.currentColor = color;
    const ctx = this.dataCanvas.context;

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 1;

    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > continuity) {
        const steps = Math.ceil(distance / (size / 2));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const midX = this.lastPoint.x + dx * t;
          const midY = this.lastPoint.y + dy * t;
          ctx.beginPath();
          ctx.arc(midX, midY, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.lastPoint = { x, y };

    this.updatePreview();
  }

  public erase(x: number, y: number, size: number, continuity: number): void {
    const ctx = this.dataCanvas.context;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > continuity) {
        const steps = Math.ceil(distance / (size / 2));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const midX = this.lastPoint.x + dx * t;
          const midY = this.lastPoint.y + dy * t;
          ctx.beginPath();
          ctx.arc(midX, midY, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.lastPoint = { x, y };

    this.updatePreview();
  }

  public clear(): void {
    const dataCtx = this.dataCanvas.context;
    dataCtx.clearRect(0, 0, this.width, this.height);

    const previewCtx = this.previewCanvas.context;
    previewCtx.clearRect(0, 0, this.width, this.height);

    this.resetLastPoint();
    this.dataCanvas.paint();
    this.previewCanvas.paint();
    this.group.set({ dirty: true });
  }

  public getImageData(): string {
    return this.dataCanvas.context.canvas.toDataURL('image/png');
  }

  public getPreviewImageData(): string {
    return this.previewCanvas.context.canvas.toDataURL('image/png');
  }

  public restoreImageData(dataUrl: string, callback?: () => void): void {
    const img = new Image();
    img.onload = () => {
      const dataCtx = this.dataCanvas.context;
      dataCtx.clearRect(0, 0, this.width, this.height);
      dataCtx.drawImage(img, 0, 0);
      this.dataCanvas.paint();

      this.updatePreview();

      if (callback) callback();
    };
    img.src = dataUrl;
  }

  public hasContent(): boolean {
    if (this.width === 0 || this.height === 0) return false;
    const imageData = this.dataCanvas.context.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
    return false;
  }

  public fillPolygon(points: { x: number; y: number }[], color: string): void {
    if (points.length < 3) return;
    this.currentColor = color;
    const ctx = this.dataCanvas.context;

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    this.dataCanvas.paint();
    this.updatePreview();
  }

  private updatePreview(): void {
    const previewCtx = this.previewCanvas.context;
    previewCtx.clearRect(0, 0, this.width, this.height);

    previewCtx.drawImage(this.dataCanvas.context.canvas, 0, 0);

    previewCtx.globalCompositeOperation = 'source-in';
    previewCtx.fillStyle = this.currentColor;
    previewCtx.fillRect(0, 0, this.width, this.height);
    previewCtx.globalCompositeOperation = 'source-over';

    this.previewCanvas.paint();
    this.group.set({ dirty: true });
  }
}