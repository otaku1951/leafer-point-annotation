import { Group, Path } from 'leafer-ui';

export interface LassoPoint {
  x: number;
  y: number;
}

export class LassoOverlay {
  private layer: Group | null = null;
  private path: Path | null = null;
  private pathOutline: Path | null = null;
  private points: LassoPoint[] = [];
  private readonly zIndex: number;
  private app: any = null;
  private readonly baseStrokeWidth = 1;
  private readonly baseOutlineWidth = 3;
  private readonly baseDashPattern = [6, 4];
  private zoomChangeListener: any = null;
  private fixedSizeOnZoom: boolean = true;

  constructor(zIndex: number = 20001) {
    this.zIndex = zIndex;
  }

  public setFixedSizeOnZoom(enabled: boolean): void {
    this.fixedSizeOnZoom = enabled;
    if (this.path && this.path.visible) {
      this.adjustForZoom();
    }
  }

  public init(app: any): void {
    if (this.layer) return;
    this.app = app;

    this.layer = new Group({
      name: 'lassoOverlayLayer',
      pointerEvents: 'none',
    });
    app.tree.add(this.layer);
    this.layer.zIndex = this.zIndex;

    this.pathOutline = new Path({
      stroke: '#FFFFFF',
      strokeWidth: this.baseOutlineWidth,
      dashPattern: [...this.baseDashPattern],
      pointerEvents: 'none',
      visible: false,
    });
    this.layer.add(this.pathOutline);

    this.path = new Path({
      stroke: '#000000',
      strokeWidth: this.baseStrokeWidth,
      dashPattern: [...this.baseDashPattern],
      pointerEvents: 'none',
      visible: false,
    });
    this.layer.add(this.path);

    this.zoomChangeListener = () => {
      if (this.path && this.path.visible) {
        this.adjustForZoom();
      }
    };
    app.tree.on('resize', this.zoomChangeListener);
  }

  public start(x: number, y: number): void {
    if (!this.path) return;
    this.points = [{ x, y }];
    this.path.visible = true;
    if (this.pathOutline) {
      this.pathOutline.visible = true;
    }
    this.updatePath();
  }

  public addPoint(x: number, y: number): void {
    if (!this.path) return;
    this.points.push({ x, y });
    this.updatePath();
  }

  public close(): LassoPoint[] {
    if (!this.path) return [];
    const closedPoints = [...this.points];
    this.clear();
    return closedPoints;
  }

  public clear(): void {
    if (!this.path) return;
    this.points = [];
    this.path.visible = false;
    (this.path as any).path = '';
    if (this.pathOutline) {
      this.pathOutline.visible = false;
      (this.pathOutline as any).path = '';
    }
  }

  public destroy(): void {
    this.clear();
    if (this.app && this.zoomChangeListener) {
      this.app.tree.off('resize', this.zoomChangeListener);
      this.zoomChangeListener = null;
    }
    if (this.path) {
      this.path.destroy();
      this.path = null;
    }
    if (this.pathOutline) {
      this.pathOutline.destroy();
      this.pathOutline = null;
    }
    if (this.layer) {
      this.layer.destroy();
      this.layer = null;
    }
    this.app = null;
  }

  public isActive(): boolean {
    return this.points.length > 0;
  }

  public getPoints(): LassoPoint[] {
    return [...this.points];
  }

  public getPointCount(): number {
    return this.points.length;
  }

  private updatePath(): void {
    if (!this.path || this.points.length < 2) return;
    let pathData = `M${this.points[0].x} ${this.points[0].y}`;
    for (let i = 1; i < this.points.length; i++) {
      pathData += ` L${this.points[i].x} ${this.points[i].y}`;
    }
    (this.path as any).path = pathData;
    if (this.pathOutline) {
      (this.pathOutline as any).path = pathData;
    }
    this.adjustForZoom();
  }

  private adjustForZoom(): void {
    if (!this.path || !this.app) return;
    if (!this.fixedSizeOnZoom) {
      this.path.strokeWidth = this.baseStrokeWidth;
      this.path.dashPattern = [...this.baseDashPattern];
      if (this.pathOutline) {
        this.pathOutline.strokeWidth = this.baseOutlineWidth;
        this.pathOutline.dashPattern = [...this.baseDashPattern];
      }
      return;
    }
    const scale = this.app.tree.scaleX || 1;
    this.path.strokeWidth = this.baseStrokeWidth / scale;
    this.path.dashPattern = this.baseDashPattern.map((v) => v / scale);
    if (this.pathOutline) {
      this.pathOutline.strokeWidth = this.baseOutlineWidth / scale;
      this.pathOutline.dashPattern = this.baseDashPattern.map((v) => v / scale);
    }
  }
}