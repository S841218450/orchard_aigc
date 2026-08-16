import API from "@/api";

//获取素材列表
interface AssetListRequest {
  type: "image" | "video" | "audio" | null; //素材类型
  tag: string | null; //标签
  query: string | null; //查询关键词
  pageNum: number; //当前页码
  pageSize: number; //每页数量
}
interface paramsType {
  style: string;
  imageProportion: "1:1" | "9:16" | "16:9" | "24:3";
  imageQuality: string;
  imageCount: number;
}
interface AssetType {
  id: string; //素材ID
  userId: string; //用户ID
  authorName: string; //作者名称
  authorAvatar?: string; //作者头像
  prompt: string; //素材描述
  url: string; //素材URL
  type: "image" | "video" | "audio"; //素材类型
  tags: string[] | null; //标签
  query: string | null; //查询关键词
  params: paramsType; //参数列表
  likeCount: number; //点赞数
  liked: boolean; //是否点赞过
  createTime: string; //创建时间
}
export const getAssetDataList = async (params: AssetListRequest) => {
  const apiName = "getAssetList"; //接口名
  try {
    const res = await API[apiName](params);
    return { success: true, data: (res.data?.list as AssetType[]) || [] };
  } catch (e) {
    return {
      success: false,
      error: "获取素材列表失败",
    };
  }
};

export const createAsset = async ({
  workId,
  imageId,
  tags,
}: {
  workId: string;
  imageId: string;
  tags: string[];
}) => {
  const apiName = "createAsset"; //接口名
  try {
    const res = await API[apiName]({ workId, imageId, tags });
    return { success: true, data: res.data as AssetType };
  } catch (e) {
    console.error("创建素材失败", e);
    return {
      success: false,
      error: "创建素材失败",
    };
  }
};

export const getAssetDetail = async (id: string) => {
  const apiName = "getAssetDetail"; //接口名
  try {
    const res = await API[apiName]({ id });
    return { success: true, data: res.data as AssetType };
  } catch (e) {
    return {
      success: false,
      error: "获取素材详情失败",
    };
  }
};
export const deleteAsset = async (id: string) => {
  const apiName = "deleteAsset"; //接口名
  try {
    const res = await API[apiName]({ id });
    return { success: true, data: res.data as AssetType };
  } catch (e) {
    return {
      success: false,
      error: "删除素材失败",
    };
  }
};

// 点赞/取消点赞素材（id 素材ID，liked 目标点赞状态；后端按需忽略多余字段）
export const likeAsset = async ({
  id,
  liked,
}: {
  id: string;
  liked: boolean;
}) => {
  const apiName = "likeAsset"; //接口名
  try {
    const res = await API[apiName]({ id, liked });
    return { success: true, data: res.data };
  } catch (e) {
    return {
      success: false,
      error: "操作失败，请稍后重试",
    };
  }
};
