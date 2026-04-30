import { Path, Group } from 'leafer-ui';

export class BrushStroke {
  public path: Path;
  private points: { x: number; y: number }[] = [];
  private isFinished: boolean = false;
  private pathData: string = '';
  private container: Group | any;

  constructor(
    container: Group | any,
    color: string,
    size: number,
    opacity: number,
    isErase: boolean = false
  ) {
    this.container = container;
    
    this.path = new Path({
      stroke: color,
      strokeWidth: size,
      opacity: opacity,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      globalCompositeOperation: isErase ? 'destination-out' : 'source-over',
    });
    
    // 支持 Group 或 App 作为容器
    if (container.add) {
      container.add(this.path);
    } else if (container.tree?.add) {
      container.tree.add(this.path);
    }
  }

  public addPoint(x: number, y: number): void {
    if (this.isFinished) return;

    this.points.push({ x, y });

    if (this.points.length === 1) {
      this.pathData = `M${x} ${y}`;
    } else {
      this.pathData += ` L${x} ${y}`;
    }
    
    // Leafer UI 使用 path 属性而不是 d 属性
    (this.path as any).path = this.pathData;
  }

  public finish(): { points: { x: number; y: number }[] } {
    this.isFinished = true;
    return { points: [...this.points] };
  }

  public remove(): void {
    if (this.container.remove) {
      this.container.remove(this.path);
    } else if (this.container.tree?.remove) {
      this.container.tree.remove(this.path);
    }
  }

  public getPathData(): string {
    return this.pathData;
  }

  public getPoints(): { x: number; y: number }[] {
    return [...this.points];
  }

  public isEmpty(): boolean {
    return this.points.length === 0;
  }

  public getBoundingBox(): { x: number; y: number; width: number; height: number } | null {
    if (this.points.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}