// Auth 模块 API 列表
const apiList = [
  // 登录
  { url: "/login/password", apiName: "loginPassword", type: "post" }, // 密码登录
  { url: "/login/sms", apiName: "loginSms", type: "post" }, // 手机号验证码登录
  { url: "/login/sendSms", apiName: "sendSms", type: "post" }, // 发送验证码

  // 注册
  { url: "/register", apiName: "register", type: "post" },
  // 登出
  { url: "/logout", apiName: "logout", type: "post" },
  // 刷新token
  { url: "/refresh", apiName: "refresh", type: "post" },
  // 第三方登录
  { url: "/oauth/url", apiName: "thirdPartyLogin", type: "get" },
  // 第三方登录回调
  { url: "/oauth/callback", apiName: "thirdPartyLoginCallback", type: "get" },
];
const baseUrl = "/auth";
export default apiList.map((item) => ({
  name: item.apiName,
  url: baseUrl + item.url,
  type: item.type || "post",
}));
