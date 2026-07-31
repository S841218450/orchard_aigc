// 作品模块 API 列表
const apiList = [
  // 创建作品
  { url: "/api/ai/work/create", apiName: "createWork", type: "post" },
  // 获取作品列表
  { url: "/api/ai/work/list", apiName: "getWorkList", type: "get" },
  // 更新作品
  { url: "/api/ai/work/update", apiName: "updateWork", type: "post" },
  // 删除作品（路径参数）
  {
    url: "/api/ai/work/delete/",
    apiName: "deleteWork",
    type: "post",
    pathParams: true,
  },
];

export default apiList.map((item) => ({
  name: item.apiName,
  url: item.url,
  type: item.type || "post",
  pathParams: item.pathParams || false,
}));
