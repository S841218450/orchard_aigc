// 素材生成参数中的固定比例（与 /actions/asset.ts 的 paramsType.imageProportion 对齐）
export type ImageProportion = "1:1" | "9:16" | "16:9" | "24:3";

// 素材项接口定义
export interface MaterialItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  url: string;
  userId: string;
  image: string;
  title: string;
  prompt: string; // 素材描述提示
  createTime: string; // 创建时间
  likeCount: number; // 点赞数
  liked: boolean; // 是否点赞
  params: {
    style: string;
    imageQuality: string;
    imageProportion: ImageProportion;
  };
}

// 素材列表响应接口
export interface MaterialListResponse {
  list: MaterialItem[];
  hasMore: boolean;
}
