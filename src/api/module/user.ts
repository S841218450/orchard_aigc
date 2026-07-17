// AI 模块 API 列表
const apiList = [
  // 获取用户信息
  { url: "/user/info", apiName: "getUserInfo", type: "get" },
];
const baseUrl = "/auth";
export default apiList.map((item) => ({
  name: item.apiName,
  url: baseUrl + item.url,
  type: item.type || "post",
}));
