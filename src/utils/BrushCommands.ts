import { ICommand } from '@zzalai/leafer-undo-redo';
import { CanvasBrush } from './CanvasBrush';

export class BrushSnapshotCommand implements ICommand {
  private canvasBrush: CanvasBrush;
  private beforeSnapshot: string;
  private afterSnapshot: string;
  private isFirstExecute: boolean;
  private isClearOperation: boolean;

  constructor(canvasBrush: CanvasBrush, beforeSnapshot: string, isClearOperation: boolean = false) {
    this.canvasBrush = canvasBrush;
    this.beforeSnapshot = beforeSnapshot;
    this.afterSnapshot = '';
    this.isFirstExecute = true;
    this.isClearOperation = isClearOperation;
  }

  execute(): void {
    if (this.isFirstExecute) {
      if (this.isClearOperation) {
        this.afterSnapshot = '';
      } else {
        this.afterSnapshot = this.canvasBrush.getImageData();
      }
      this.isFirstExecute = false;
    } else {
      if (this.afterSnapshot) {
        this.canvasBrush.restoreImageData(this.afterSnapshot);
      } else {
        this.canvasBrush.clear();
      }
    }
  }

  undo(): void {
    this.canvasBrush.restoreImageData(this.beforeSnapshot);
  }

  redo(): void {
    if (this.afterSnapshot) {
      this.canvasBrush.restoreImageData(this.afterSnapshot);
    } else {
      this.canvasBrush.clear();
    }
  }
}