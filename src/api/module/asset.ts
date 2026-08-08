// 素材模块 API 列表
const apiList = [
  // 创建素材
  { url: "/createAsset", apiName: "createAsset" },
  // 获取素材列表
  { url: "/getAssetList", apiName: "getAssetList" },
  // 更新素材
  { url: "/updateAsset", apiName: "updateAsset" },
  // 删除素材（路径参数）
  {
    url: "/deleteAsset",
    apiName: "deleteAsset",
  },
  //点赞
  { url: "/likeAsset", apiName: "likeAsset" },
];
const baseUrl = "/api/ai/asset";
export default apiList.map((item) => ({
  name: item.apiName,
  url: baseUrl + item.url,
  type: "post",
}));
