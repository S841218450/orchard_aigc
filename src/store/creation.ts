import { create } from "zustand";

/**
 * 创作页跨组件共享状态：
 * 历史记录点击"修改图片"后，携带目标图片 URL 切换到图生图的参考图列表
 */
interface CreationEditState {
  /** 待加入图生图参考图的图片 URL（消费后清除） */
  editImageUrl: string | null;
  /** 发起修改图片请求 */
  requestEditImage: (url: string) => void;
  /** 消费完成，清除待处理图片 */
  clearEditImage: () => void;
}

export const useCreationEditStore = create<CreationEditState>((set) => ({
  editImageUrl: null,
  requestEditImage: (url) => set({ editImageUrl: url }),
  clearEditImage: () => set({ editImageUrl: null }),
}));
