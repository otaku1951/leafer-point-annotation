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
  private _onPositionChange: (() => void) | null = null;  // 拖拽结束后同步坐标的回调
  private _imageWidth: number = 1;  // 图片宽度，用于计算归一化坐标
  private _imageHeight: number = 1;  // 图片高度，用于计算归一化坐标

  constructor(data: PointAnnotation, style?: Partial<PointStyle>, onPositionChange?: () => void) {
    super();

    this._defaultLabel = data.label ?? `#${data.sequenceNumber}`;
    this.data = data;
    this.style = { ...DEFAULT_POINT_STYLE, ...style };
    this._lastValidLabel = this._defaultLabel;
    this._isSelected = false;
    this._isRenumbering = false;
    this._onPositionChange = onPositionChange ?? null;

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
      fontFamily: this.style.labelFontFamily,
      fill: this.style.labelFill,
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
        fill: this.style.hoverCircleFill,
        stroke: this.style.hoverCircleStroke,
      })
      // this.label.editable = true;
    })
    this.on(PointerEvent.LEAVE, () => {
      if (this._isSelected) {
        // 选中状态：保持选中样式（覆盖可能的 hover 样式）
        this.circle.set({ fill: this.style.selectedCircleFill, stroke: this.style.selectedCircleStroke })
      } else {
        // 未选中状态：恢复正常样式
        this.circle.set({ fill: this.style.circleFill, stroke: this.style.circleStroke })
      }
      // this.label.editable = true;
    })
    // Hover 效果已通过 hoverStyle 配置，无需监听事件
    // this.circle.on('pointerenter', () => this.updateHover(true));
    // this.circle.on('pointerleave', () => this.updateHover(false));

    // 拖拽结束后同步像素坐标
    // 当 LeaferJS 编辑器拖拽元素并释放后，元素的 x/y 已更新，此时同步到 data.pixel 和 data.normalized
    this.on(PointerEvent.UP, (e: any) => {
      console.log('===== 拖拽结束事件触发 =====');
      console.log('事件对象:', e);
      console.log('当前元素 ID:', this.data?.id || '未知');
      console.log('元素当前 x/y:', { x: this.x, y: this.y });
      console.log('拖拽前 pixel 坐标:', this.data?.pixel ? JSON.stringify(this.data.pixel) : '无');
      console.log('拖拽前 normalized 坐标:', this.data?.normalized ? JSON.stringify(this.data.normalized) : '无');
      try {
        this.syncPixelData();
        console.log('坐标同步成功');
      } catch (error) {
        console.error('坐标同步失败:', error);
        console.error('错误堆栈:', (error as Error).stack);
      }
    });

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
      // this.label.text = this._lastValidLabel;
      this.label.text = this._defaultLabel;
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

  // 同步当前元素位置到 data.pixel 和 data.normalized
  // 在 pointerup（拖拽结束）时调用，此时 LeaferJS 已更新了元素的 x/y
  public syncPixelData(): void {
    console.log('------ syncPixelData 方法执行 ------');
    
    const x = this.x ?? 0;
    const y = this.y ?? 0;
    console.log('获取元素坐标 x/y:', { x, y });
    console.log('图片尺寸 _imageWidth/_imageHeight:', { width: this._imageWidth, height: this._imageHeight });
    
    const oldPixelX = this.data.pixel?.x ?? '未定义';
    const oldPixelY = this.data.pixel?.y ?? '未定义';
    const oldNormalizedX = this.data.normalized?.x ?? '未定义';
    const oldNormalizedY = this.data.normalized?.y ?? '未定义';
    
    console.log('更新前 - pixel:', { x: oldPixelX, y: oldPixelY });
    console.log('更新前 - normalized:', { x: oldNormalizedX, y: oldNormalizedY });
    
    // 计算归一化坐标
    const normalizedX = this._imageWidth > 0 ? x / this._imageWidth : 0;
    const normalizedY = this._imageHeight > 0 ? y / this._imageHeight : 0;
    
    console.log('计算后 - normalized:', { x: normalizedX, y: normalizedY });
    
    // 更新数据
    if (!this.data.pixel) {
      console.warn('data.pixel 为 undefined，创建新对象');
      this.data.pixel = { x: 0, y: 0 };
    }
    if (!this.data.normalized) {
      console.warn('data.normalized 为 undefined，创建新对象');
      this.data.normalized = { x: 0, y: 0 };
    }
    
    this.data.pixel.x = x;
    this.data.pixel.y = y;
    this.data.normalized.x = normalizedX;
    this.data.normalized.y = normalizedY;
    this.data.updatedAt = Date.now();
    
    console.log('更新后 - pixel:', JSON.stringify(this.data.pixel));
    console.log('更新后 - normalized:', JSON.stringify(this.data.normalized));
    console.log('updatedAt:', this.data.updatedAt);
    
    // 触发回调
    console.log('_onPositionChange 回调存在:', !!this._onPositionChange);
    if (this._onPositionChange) {
      try {
        this._onPositionChange();
        console.log('回调执行成功');
      } catch (callbackError) {
        console.error('回调执行失败:', callbackError);
      }
    }
    
    console.log('------ syncPixelData 方法完成 ------');
  }

  // 设置图片尺寸（用于计算归一化坐标），由父组件在创建元素时传入
  public setImageSize(width: number, height: number): void {
    this._imageWidth = width || 1;
    this._imageHeight = height || 1;
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

  // 设置 hover 状态（外部调用）
  public setHoverState(isHover: boolean): void {
    if (isHover) {
      this.circle.set({
        fill: this.style.hoverCircleFill,
        stroke: this.style.hoverCircleStroke,
      });
    } else if (this._isSelected) {
      this.circle.set({ fill: this.style.selectedCircleFill, stroke: this.style.selectedCircleStroke });
    } else {
      this.circle.set({ fill: this.style.circleFill, stroke: this.style.circleStroke });
    }
  }

  // 更新圆内显示的序号（删除点后自动重排时调用）
  // 逻辑：如果用户改过 label（this.data.label 有值），只更新 circleText；
  //       如果 label 仍是默认值（"#序号"），则同步更新 label，保持序号一致性。
  public updateSequenceNumber(newNum: number): void {
    this.data.sequenceNumber = newNum;
    if (this.circleText) {
      this.circleText.text = newNum;
    }

    // 如果用户没改过 label，同步更新 label 显示
    // 检查当前 label 是否是默认格式（"#序号" 或纯数字）
    const currentLabel = this.label.text ?? '';
    const isDefaultLabel = !this.data.label || 
                          currentLabel === `#${this._defaultLabel.replace('#', '')}` ||
                          (typeof currentLabel === 'string' && /^\d+$/.test(currentLabel));
    
    if (isDefaultLabel) {
      this._isRenumbering = true;
      this.label.text = `#${newNum}`;
      this._isRenumbering = false;
      this._defaultLabel = `#${newNum}`;
    }
  }
}