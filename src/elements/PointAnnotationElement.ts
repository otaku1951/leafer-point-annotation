import { Group, Ellipse, Text, PointerEvent } from 'leafer-ui';
// import { EllipseBox } from '@leafer-in/box'
import type { PointAnnotation, PointStyle } from '@/types';
import { DEFAULT_POINT_STYLE } from '@/types';
import "@leafer-in/state"
import "@leafer-in/text-editor"  // 引入以支持 label.text 的 property.change 事件（虽然当前 label 不可编辑，但保留以防未来启用）

export class PointAnnotationElement extends Group {
  public circle: Ellipse;
  public circleText: Text;
  public label: Text;
  public data: PointAnnotation;
  private style: PointStyle;
  public _element_tag: string;
  private _lastValidLabel: string;
  private _isSelected: boolean;
  private _defaultLabel: string;
  private _isRenumbering: boolean;  // 是否在 renumber 期间，用于防止 label.text 变更触发 handleLabelChange 把 data.label 固定

  constructor(data: PointAnnotation, style?: Partial<PointStyle>) {
    super();

    this._defaultLabel = data.label ?? `#${data.sequenceNumber}`;
    this.data = data;
    this.style = { ...DEFAULT_POINT_STYLE, ...style };
    this._lastValidLabel = this._defaultLabel;
    this._isSelected = false;
    this._isRenumbering = false;

    // 创建圆点文本
    this.circleText = new Text({
      x: - this.style.circleRadius / 2,
      y: - this.style.circleRadius / 2,
      text: data.sequenceNumber ?? data.order,  // 优先显示当前位置序号，兼容旧数据回退到 order
      width: this.style.circleRadius,
      height: this.style.circleRadius,
      lineHeight: this.style.circleRadius,
      fontSize: this.style.circleTextFontSize,
      fontFamily: this.style.circleTextFontFamily,
      fill: this.style.circleTextFill,
      editable: false,
      editConfig: {
        strokeWidth: 0, // 需要置0，否则有边难看
        moveable: false,
        resizeable: false
      },
      // around: 'center',
      textAlign: 'center',
      // boxStyle: {
      //   fill: this.style.labelBackgroundColor,
      // }
    });

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
      // transition: {
      //   duration: 200,
      //   easing: 'bounce-out',
      // },
      // hoverStyle: {
      //   fill: this.style.hoverCircleFill ? this.style.hoverCircleFill : this.style.circleFill
      // },
    });

    // 创建标签 - around 设置为 bottom-left，显示在圆点右上角
    // 注意：当前 label 不可编辑，主要用于展示自定义名称或默认 "#序号"。
    //       editable=false + hitChildren=false 双重保证用户无法直接编辑 label。
    //       如需启用编辑，需要同时：
    //       1) 把 hitChildren 改为 true（让 Group 的子元素接收鼠标事件）
    //       2) 把 label.editable 改为 true
    this.label = new Text({
      x: this.style.circleRadius / 2 - 2,
      y: - this.style.circleRadius / 2 + 2,
      text: this._defaultLabel,
      fontSize: this.style.labelFontSize,
      fill: this.style.labelTextColor,
      padding: this.style.labelPadding,
      editable: false,
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
    this.add(this.circleText);
    this.add(this.label);

    // 设置组属性 - 组的位置就是圆心位置
    this.x = data.pixel.x;
    this.y = data.pixel.y;
    this.draggable = true;
    this.editable = true;
    // hitChildren=false：让 Group 作为整体接收事件，不穿透到子元素（circle、circleText、label）。
    // 副作用：label 的 editable 设置无效（因为 label 收不到鼠标事件）。
    // 这是一个**有意的设计决策**：当前不需要编辑 label，整体交互更简洁。
    this.hitChildren = false;
    // this.hitChildren = true;  // 如果要启用 label 编辑，需要启用此行并注释上一行
    this.editConfig = {
      strokeWidth: 0, // 需要置0，否则有边难看
      resizeable: false
    },
    this._element_tag = 'point-annotation';

    // 绑定事件
    this.bindEvents();
  }

  private bindEvents(): void {
    this.on(PointerEvent.ENTER, () => {
      this.circle.set({
        fill: this.style.selectedCircleFill,
        stroke: this.style.selectedCircleStroke,
      })
      // this.label.editable = true;
    })
    this.on(PointerEvent.LEAVE, () => {
      if (this._isSelected) return
      this.circle.set({
        fill: this.style.circleFill,
        stroke: this.style.circleStroke,
      })
      // this.label.editable = true;
    })
    // Hover 效果已通过 hoverStyle 配置，无需监听事件
    // this.circle.on('pointerenter', () => this.updateHover(true));
    // this.circle.on('pointerleave', () => this.updateHover(false));

    // 标签编辑完成
    // 说明：当前 label 是 editable=false，这个事件**不会被用户操作触发**。
    //       保留监听是为了：
    //       1) 外部通过 updateLabel() 编程式修改 label 时也能触发一致性检查
    //       2) 未来启用 label 编辑时不需要改这里
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
    // const targetScale = isSelected ? this.style.selectedCircleScale : 1;

    
    this._isSelected = isSelected;
    
    this.circle.set({
      fill: targetStyle,
      stroke: targetStroke,
      // scale: targetScale,
    });
  }

  public handleLabelChange(newLabel: string): void {
    // 去除首尾空格
    const trimmedLabel = newLabel.trim();
    
    // 空值或空白，恢复上一次的值（保证 label 永不为空）
    if (!trimmedLabel) {
      this.label.text = this._lastValidLabel;
      return;
    }

    // renumber 期间：只更新 _lastValidLabel 和显示，不固定 data.label
    // 防止 renumber 时 label.text 变化触发此函数，把 data.label 永久固定下来
    if (this._isRenumbering) {
      this._lastValidLabel = trimmedLabel;
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
    return this.data.label ?? this._defaultLabel;
  }

  public getLastValidLabel(): string {
    return this._lastValidLabel;
  }

  // 更新圆内显示的序号（删除点后自动重排时调用）
  // 逻辑：如果用户改过 label（this.data.label 有值），只更新 circleText；
  //       如果 label 仍是默认值（"#序号"），则同步更新 label，保持序号一致性。
  public updateSequenceNumber(newNum: number): void {
    this.data.sequenceNumber = newNum;
    if (this.circleText) {
      this.circleText.text = String(newNum);
    }
    // 用户没改过 label → label 跟随序号一起更新；
    // 用户已改过 label → label 保持用户自定义，不更新。
    // 使用 _isRenumbering 标记防止 label.text 变更触发 handleLabelChange 把 data.label 固定下来。
    if (!this.data.label) {
      this._isRenumbering = true;
      try {
        this._defaultLabel = `#${newNum}`;
        this.label.text = this._defaultLabel;
      } finally {
        this._isRenumbering = false;
      }
    }
  }
}