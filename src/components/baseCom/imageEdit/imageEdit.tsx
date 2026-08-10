"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Popconfirm, Space, Tooltip, Image } from "antd";
import { Paintbrush, Trash2, Square, X } from "lucide-react";
import "./imageEdit.scss";

// 单个选框的数据结构（坐标为相对于图片实际显示内容的百分比，烘焙进原图时可等比换算像素）
export interface SelectionBox {
  id: string;
  x: number; // 0 ~ 100
  y: number; // 0 ~ 100
  width: number; // 0 ~ 100
  height: number; // 0 ~ 100
  color: string;
}
export interface SelectionBoxPrompt {
  pageIndex: number; // 图片索引
  color: string; // 颜色
}
interface ImageEditProps {
  /** 待编辑的图片地址 */
  imageUrl: string;
  /** 初始选框数据（重新打开时恢复上次绘制） */
  initialBoxes?: SelectionBox[];
  /** 选框数据变化时回调（供外部保存） */
  onBoxesChange?: (boxes: SelectionBox[]) => void;
}

// 预设颜色面板
const PRESET_COLORS = [
  { label: "红色", value: "#ef4444" },
  { label: "蓝色", value: "#3b82f6" },
  { label: "绿色", value: "#22c55e" },
  { label: "黄色", value: "#eab308" },
  { label: "紫色", value: "#a855f7" },
  { label: "橙色", value: "#f97316" },
];

// 图片编辑组件：在图片上拖拽框选，支持颜色切换、单个删除、一键清空
export const ImageEdit = ({
  imageUrl,
  initialBoxes = [],
  onBoxesChange,
}: ImageEditProps) => {
  // 选框列表
  const [boxes, setBoxes] = useState<SelectionBox[]>(initialBoxes);
  // 当前选中的画笔颜色
  const [currentColor, setCurrentColor] = useState<string>(
    PRESET_COLORS[0].value,
  );
  // 正在绘制中的临时选框（鼠标按下未抬起时）
  const [drawingBox, setDrawingBox] = useState<SelectionBox | null>(null);
  // 图片画布容器的 DOM 引用（用于计算鼠标相对坐标）
  const canvasRef = useRef<HTMLDivElement | null>(null);
  // 图片实际显示区域在容器内的几何信息（消除 max-height 截断导致的 letterbox 坐标偏移）
  const [stageRect, setStageRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  // 绘制起点（百分比）
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  // 用 ref 缓存最新的 onBoxesChange，避免外部传入内联函数导致 effect 反复触发
  const onBoxesChangeRef = useRef(onBoxesChange);
  useEffect(() => {
    onBoxesChangeRef.current = onBoxesChange;
  });

  // 选框变化时上报给外部
  useEffect(() => {
    onBoxesChangeRef.current?.(boxes);
  }, [boxes]);

  // 测量图片实际显示区域在容器内的几何位置，供绘制坐标与选框定位共用
  const measureStageRect = useCallback(() => {
    const container = canvasRef.current;
    const img = container?.querySelector<HTMLImageElement>(".edit-canvas-img");
    if (!container || !img) return;
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = img;
    let left = imgRect.left;
    let top = imgRect.top;
    let width = imgRect.width;
    let height = imgRect.height;
    // 图片元素可能被 max-height 约束压缩（object-fit: contain 产生 letterbox），
    // 按原始宽高比还原图片实际内容区域
    if (naturalWidth > 0 && naturalHeight > 0) {
      const scale = Math.min(
        imgRect.width / naturalWidth,
        imgRect.height / naturalHeight,
      );
      width = naturalWidth * scale;
      height = naturalHeight * scale;
      left = imgRect.left + (imgRect.width - width) / 2;
      top = imgRect.top + (imgRect.height - height) / 2;
    }
    setStageRect({
      left: left - containerRect.left,
      top: top - containerRect.top,
      width,
      height,
    });
  }, []);

  // 图片加载 / 容器尺寸变化时重新测量
  useEffect(() => {
    measureStageRect();
    const container = canvasRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measureStageRect());
    observer.observe(container);
    return () => observer.disconnect();
  }, [measureStageRect]);

  // 根据鼠标事件计算当前位置相对于图片内容的百分比坐标
  const getRelativePercent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
      const container = canvasRef.current;
      if (!container) return { x: 0, y: 0 };
      const containerRect = container.getBoundingClientRect();
      const rect = stageRect ?? {
        left: 0,
        top: 0,
        width: containerRect.width,
        height: containerRect.height,
      };
      const originX = containerRect.left + rect.left;
      const originY = containerRect.top + rect.top;
      const rawX = ((e.clientX - originX) / rect.width) * 100;
      const rawY = ((e.clientY - originY) / rect.height) * 100;
      // 限制在 0 ~ 100 之间，防止拖出画布
      return {
        x: Math.max(0, Math.min(100, rawX)),
        y: Math.max(0, Math.min(100, rawY)),
      };
    },
    [stageRect],
  );

  // 鼠标按下：开始绘制
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 只响应鼠标左键
      if (e.button !== 0) return;
      const pos = getRelativePercent(e);
      drawStartRef.current = pos;
      setDrawingBox({
        id: `temp-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color: currentColor,
      });
    },
    [currentColor, getRelativePercent],
  );

  // 鼠标移动：更新绘制中的选框尺寸
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawingBox || !drawStartRef.current) return;
      const pos = getRelativePercent(e);
      const start = drawStartRef.current;
      const x = Math.min(start.x, pos.x);
      const y = Math.min(start.y, pos.y);
      const width = Math.abs(pos.x - start.x);
      const height = Math.abs(pos.y - start.y);
      setDrawingBox((prev) => (prev ? { ...prev, x, y, width, height } : prev));
    },
    [drawingBox, getRelativePercent],
  );

  // 鼠标抬起：结束绘制，将临时选框加入正式列表
  const handleCanvasMouseUp = useCallback(() => {
    if (!drawingBox) {
      setDrawingBox(null);
      drawStartRef.current = null;
      return;
    }
    // 过滤掉尺寸太小的误触选框（小于 1% 视为误点）
    if (drawingBox.width < 1 || drawingBox.height < 1) {
      setDrawingBox(null);
      drawStartRef.current = null;
      return;
    }
    const finalBox: SelectionBox = {
      ...drawingBox,
      id: `box-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setBoxes((prev) => [...prev, finalBox]);
    setDrawingBox(null);
    drawStartRef.current = null;
  }, [drawingBox]);

  // 鼠标离开画布区域时同样结束绘制
  const handleCanvasMouseLeave = useCallback(() => {
    if (drawingBox) {
      handleCanvasMouseUp();
    }
  }, [drawingBox, handleCanvasMouseUp]);

  // 删除单个选框
  const handleRemoveBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== boxId));
  };

  // 清空所有选框
  const handleClearAllBoxes = () => {
    setBoxes([]);
  };

  return (
    <div className="image-edit-popover">
      {/* 工具栏 */}
      <div className="edit-toolbar">
        <div className="tool-section">
          <span className="tool-label">
            <Paintbrush size={14} />
            颜色
          </span>
          <Space size={6} wrap={false}>
            {PRESET_COLORS.map((c) => (
              <Tooltip key={c.value} title={c.label}>
                <button
                  type="button"
                  className={`color-dot ${currentColor === c.value ? "active" : ""}`}
                  style={{ background: c.value }}
                  onClick={() => setCurrentColor(c.value)}
                  aria-label={`选择${c.label}`}
                />
              </Tooltip>
            ))}
          </Space>
        </div>

        <div className="tool-divider" />

        <div className="tool-section">
          <Space size={6}>
            <Popconfirm
              title="确认清空所有选框？"
              okText="清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleClearAllBoxes}
              disabled={boxes.length === 0}
            >
              <Button
                size="small"
                icon={<Trash2 size={14} />}
                disabled={boxes.length === 0}
              >
                清空
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <div className="tool-section tool-section-right">
          <span className="box-count-hint">
            <Square size={14} />
            已选 {boxes.length} 处
          </span>
        </div>
      </div>

      {/* 图片画布区（相对定位容器） */}
      <div
        ref={canvasRef}
        className="edit-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
      >
        {/* 底图 */}
        <Image
          src={imageUrl}
          alt="编辑图"
          className="edit-canvas-img"
          draggable={false}
          preview={false}
        />

        {/* 图片内容定位层：与图片实际显示内容对齐，选框在此按百分比绝对定位 */}
        <div
          className="edit-canvas-stage"
          style={
            stageRect
              ? {
                  left: stageRect.left,
                  top: stageRect.top,
                  width: stageRect.width,
                  height: stageRect.height,
                }
              : undefined
          }
        >
          {/* 已保存的选框 */}
          {boxes.map((box) => (
            <div
              key={box.id}
              className="selection-box"
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                borderColor: box.color,
                background: `${box.color}15`, // 15 ≈ 8% 透明度
                boxShadow: `0 0 0 1px ${box.color}40 inset`,
              }}
            >
              {/* 选框标题角标 */}
              <span
                className="box-label"
                style={{
                  background: box.color,
                }}
              >
                {box.width.toFixed(0)}×{box.height.toFixed(0)}
              </span>
              {/* 删除按钮 */}
              <button
                type="button"
                className="box-remove-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBox(box.id);
                }}
                aria-label="删除选框"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {/* 正在绘制中的临时选框 */}
          {drawingBox && (
            <div
              className="selection-box drawing"
              style={{
                left: `${drawingBox.x}%`,
                top: `${drawingBox.y}%`,
                width: `${drawingBox.width}%`,
                height: `${drawingBox.height}%`,
                borderColor: drawingBox.color,
                background: `${drawingBox.color}15`,
                boxShadow: `0 0 0 1px ${drawingBox.color}40 inset`,
              }}
            />
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="edit-hint">
        按住鼠标左键在图片上拖拽即可框选，点击选框右上角 × 可删除单个
      </div>
    </div>
  );
};
