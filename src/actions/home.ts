// 素材生成参数中的固定比例（与 /actions/asset.ts 的 paramsType.imageProportion 对齐）
export type ImageProportion = "1:1" | "9:16" | "16:9" | "24:3";

// 素材项接口定义
export interface MaterialItem {
  id: string;
  image: string;
  title: string;
  time: string;
  // 生成参数中的固定比例，骨架屏可据此占位防止重排
  imageProportion: ImageProportion;
}

// 素材列表响应接口
export interface MaterialListResponse {
  list: MaterialItem[];
  hasMore: boolean;
}
