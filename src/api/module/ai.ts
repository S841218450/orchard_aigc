// AI 模块 API 列表
const apiList = [
  //文生图接口（py 后端，绕过 /admin-api 前缀）
  {
    url: "/text-to-image/generate",
    apiName: "generateImage",
    type: "post",
    baseURL: "/ai-api/v1/",
  },
  {
    url: "/text-to-image/select",
    apiName: "selectPromptDesc",
    type: "post",
    baseURL: "/ai-api/v1/",
  },

  // 画面风格接口
  { url: "/api/ai/chat/send", apiName: "sendMessage", type: "post" },
  // AI 聊天接口，发送消息
  { url: "/api/ai/chat/stream", apiName: "chatStream", type: "post" },
  // 获取消息列表
  { url: "/api/ai/message/list", apiName: "getMsgList", type: "get" },
  // 删除消息
  { url: "/api/ai/message/delete", apiName: "deleteMsg", type: "post" },

  // 创建会话
  { url: "/api/ai/session/add", apiName: "createSession", type: "post" },
  // 获取会话列表
  { url: "/api/ai/session/list", apiName: "getSessionList", type: "get" },
  // 更新会话
  { url: "/api/ai/session/update", apiName: "updateSession", type: "post" },
  // 删除会话
  { url: "/api/ai/session/delete", apiName: "deleteSession", type: "post" },
];

export default apiList.map((item) => ({
  name: item.apiName,
  url: item.url,
  type: item.type || "post",
  baseURL: item.baseURL || "/admin-api",
}));
