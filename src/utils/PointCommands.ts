import { Group } from 'leafer-ui';
import { ICommand } from '@zzalai/leafer-undo-redo';
import type { PointAnnotation } from '@/types';

export interface PointAnnotationElement extends Group {
  data: PointAnnotation;
}

export class AddPointCommand implements ICommand {
  private container: Group;
  private element: PointAnnotationElement;
  private dataArray: PointAnnotation[];
  private pointData: PointAnnotation;

  constructor(
    container: Group,
    element: PointAnnotationElement,
    dataArray: PointAnnotation[],
    pointData: PointAnnotation
  ) {
    this.container = container;
    this.element = element;
    this.dataArray = dataArray;
    this.pointData = pointData;
  }

  execute(): void {
    this.container.add(this.element);
  }

  undo(): void {
    this.container.remove(this.element);
    const index = this.dataArray.findIndex(p => p.id === this.pointData.id);
    if (index > -1) {
      this.dataArray.splice(index, 1);
    }
  }
}

export class RemovePointCommand implements ICommand {
  private container: Group;
  private element: PointAnnotationElement;
  private dataArray: PointAnnotation[];
  private insertIndex: number;

  constructor(
    container: Group,
    element: PointAnnotationElement,
    dataArray: PointAnnotation[]
  ) {
    this.container = container;
    this.element = element;
    this.dataArray = dataArray;
    this.insertIndex = dataArray.findIndex(p => p.id === element.data.id);
  }

  execute(): void {
    this.container.remove(this.element);
    const index = this.dataArray.findIndex(p => p.id === this.element.data.id);
    if (index > -1) {
      this.dataArray.splice(index, 1);
    }
  }

  undo(): void {
    this.container.add(this.element);
    if (this.insertIndex > -1 && this.insertIndex <= this.dataArray.length) {
      this.dataArray.splice(this.insertIndex, 0, this.element.data);
    } else {
      this.dataArray.push(this.element.data);
    }
  }
}