import { Group, Ellipse, Text } from 'leafer-ui';
import type { PointAnnotation, PointStyle } from '@/types';
import { DEFAULT_POINT_STYLE } from '@/types';
import "@leafer-in/state"
import "@leafer-in/text-editor"
// import { EditorEvent, InnerEditorEvent } from '@leafer-in/editor';

export class PointAnnotationElement extends Group {
  public circle: Ellipse;
  public label: Text;
  public data: PointAnnotation;
  private style: PointStyle;
  public _element_tag: string
  private _lastValidLabel: string;

  constructor(data: PointAnnotation, style?: Partial<PointStyle>) {
    super();
    
    this.data = data;
    this.style = { ...DEFAULT_POINT_STYLE, ...style };
    this._lastValidLabel = data.label;

    // 创建圆点 - Ellipse 的 x, y 是圆心位置，around 设置为 center
    this.circle = new Ellipse({
      x: 0,
      y: 0,
      width: this.style.circleRadius,
      height: this.style.circleRadius,
      fill: this.style.circleFill,
      stroke: this.style.circleStroke,
      strokeWidth: this.style.circleStrokeWidth,
      draggable: false,
      editable: false,
      around: 'center',
      hoverStyle: {
        fill: this.style.hoverCircleFill ? this.style.hoverCircleFill : this.style.circleFill
      },
    });

    // 创建标签 - around 设置为 bottom-left，显示在圆点右上角
    this.label = new Text({
      x: this.style.circleRadius / 2 - 2,
      y: - this.style.circleRadius / 2 + 2,
      text: data.label,
      fontSize: this.style.labelFontSize,
      fill: this.style.labelTextColor,
      padding: this.style.labelPadding,
      editable: true,
      editConfig: {
        strokeWidth: 0, // 需要置0，否则有边难看
        moveable: false,
        resizeable: false
      },
      around: 'bottom-left',
      boxStyle: {
        fill: this.style.labelBackgroundColor,
        cornerRadius: 4,
        whiteSpace: 'nowrap',
        shadow: {
          x: 1,
          y: 1,
          blur: 2,
          color: 'rgba(0,0,0, .2)'
        }
      }
    });

    // 添加到组
    this.add(this.circle);
    this.add(this.label);

    // 设置组属性 - 组的位置就是圆心位置
    this.x = data.pixel.x;
    this.y = data.pixel.y;
    this.draggable = true;
    this.editable = true;
    // this.hitChildren = false;
    this.editConfig = {
      strokeWidth: 0, // 需要置0，否则有边难看
      resizeable: false
    },
    this._element_tag = 'point-annotation';

    // 绑定事件
    this.bindEvents();
  }

  private bindEvents(): void {
    // Hover 效果已通过 hoverStyle 配置，无需监听事件
    // this.circle.on('pointerenter', () => this.updateHover(true));
    // this.circle.on('pointerleave', () => this.updateHover(false));

    // 标签编辑完成
    // this.label.on('text:change', (e: any) => this.handleLabelChange(e.text));
    this.label.on('property.change', (e) => {
      // console.log(e);
      // 2.0.8 的标准数据结构
      const data = e.data || e; 
      if (data.attrName === 'text') {
        console.log('数据落地了:', data.newValue);
        this.handleLabelChange(data.newValue);
      }
    });
  }

  // 外部调用的选中处理方法
  public handlePointAnnotationSelected(isSelected: boolean): void {
    const targetStyle = isSelected ? this.style.selectedCircleFill : this.style.circleFill;
    const targetStroke = isSelected ? this.style.selectedCircleStroke : this.style.circleStroke;
    const targetScale = isSelected ? this.style.selectedCircleScale : 1;
    
    this.circle.set({
      fill: targetStyle,
      stroke: targetStroke,
      scale: targetScale,
    });
  }

  public handleLabelChange(newLabel: string): void {
    // 去除首尾空格
    const trimmedLabel = newLabel.trim();
    
    // 空值或空白，恢复上一次的值
    if (!trimmedLabel) {
      this.label.text = this._lastValidLabel;
      return;
    }
    
    // 更新有效标签
    this._lastValidLabel = trimmedLabel;
    this.data.label = trimmedLabel;
    this.data.updatedAt = Date.now();
  }

  public updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.data.pixel = { x, y };
    this.data.updatedAt = Date.now();
  }

  public updateLabel(label: string): void {
    this.label.text = label;
    this._lastValidLabel = label;
    this.data.label = label;
    this.data.updatedAt = Date.now();
  }

  public getLabel(): string {
    return this.data.label;
  }

  public getLastValidLabel(): string {
    return this._lastValidLabel;
  }
}