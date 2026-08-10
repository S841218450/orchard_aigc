import type { SelectionBox } from "@/components/baseCom/imageEdit/imageEdit";

/**
 * 将选框绘制进原图的实际像素，导出为 PNG Blob（用于重新上传覆盖原图）。
 * 选框坐标为相对图片实际显示内容的百分比，此处按原图宽高等比换算为像素。
 * 图片跨域导致画布被污染、无法导出时返回 null，由调用方决定降级为原图。
 */
export const bakeBoxesToImage = (
  imageUrl: string,
  boxes: SelectionBox[],
): Promise<Blob | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        // 边框线宽与编辑面板显示效果近似（480px 宽对应 2px，等比放大到原图）
        const lineWidth = Math.max(2, Math.round(canvas.width / 240));
        boxes.forEach((box) => {
          const x = (box.x / 100) * canvas.width;
          const y = (box.y / 100) * canvas.height;
          const w = (box.width / 100) * canvas.width;
          const h = (box.height / 100) * canvas.height;
          // 半透明填充（与遮罩效果一致，约 8% 透明度）
          ctx.fillStyle = `${box.color}15`;
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = box.color;
          ctx.lineWidth = lineWidth;
          ctx.strokeRect(x, y, w, h);
        });
        canvas.toBlob((blob) => resolve(blob), "image/png");
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
