// 用户中心模块 API 列表
const apiList = [
  // 获取个人信息
  { url: "/user/getUserDetail", apiName: "getUserDetail", type: "get" },
  // 更新个人信息
  { url: "/user/updateUser", apiName: "updateUser", type: "put" },
  // 获取会员信息
  { url: "/vip/info", apiName: "getVipInfo", type: "get" },
  // 获取会员套餐列表
  { url: "/vip/plans", apiName: "getVipPlans", type: "get" },
  // 获取订单列表
  { url: "/order/list", apiName: "getOrderList", type: "get" },
  // 获取邀请信息
  { url: "/invite/info", apiName: "getInviteInfo", type: "get" },
  // 获取邀请记录列表
  { url: "/invite/records", apiName: "getInviteRecords", type: "get" },
];

export default apiList.map((item) => ({
  name: item.apiName,
  url: item.url,
  type: item.type || "post",
}));
