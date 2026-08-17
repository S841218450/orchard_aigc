import { create } from "zustand";

/** 创作菜单 key（与 Aside 菜单项保持一致） */
export type CreationMenuKey = "textToImage" | "imageToImage" | "marketingImage";

/** 首页输入框携带的参考图（本地预览 URL） */
export interface CarryImage {
  id: number;
  url: string;
}

/**
 * 创作页跨组件共享状态：
 * 1. 历史记录点击"修改图片"后，携带目标图片 URL 切换到图生图的参考图列表
 * 2. 首页输入框发送后，携带 目标菜单/描述/参考图 一次性写入创作页
 */
interface CreationEditState {
  /** 待加入图生图参考图的图片 URL（消费后清除） */
  editImageUrl: string | null;
  /** 发起修改图片请求 */
  requestEditImage: (url: string) => void;
  /** 消费完成，清除待处理图片 */
  clearEditImage: () => void;

  /** 首页跳转携带的目标菜单（消费后清除） */
  initialMenu: CreationMenuKey | null;
  /** 首页携带的描述文字 */
  initialPrompt: string;
  /** 首页携带的参考图（本地预览 URL，进入图生图后提交时再统一上传） */
  initialImages: CarryImage[];
  /** 一次性写入首页跳转携带的数据 */
  setInitialData: (data: {
    menu: CreationMenuKey;
    prompt?: string;
    images?: CarryImage[];
  }) => void;
  /** 消费完成，清除携带数据（防止刷新/返回后残留） */
  clearInitialData: () => void;
}

export const useCreationEditStore = create<CreationEditState>((set) => ({
  editImageUrl: null,
  requestEditImage: (url) => set({ editImageUrl: url }),
  clearEditImage: () => set({ editImageUrl: null }),

  initialMenu: null,
  initialPrompt: "",
  initialImages: [],
  setInitialData: ({ menu, prompt = "", images = [] }) =>
    set({ initialMenu: menu, initialPrompt: prompt, initialImages: images }),
  clearInitialData: () =>
    set({ initialMenu: null, initialPrompt: "", initialImages: [] }),
}));
