// 知识库相关
const apiList = [
  // 上传知识库文档
  { url: "/upload", apiName: "uploadKnowledge" },
  // 上传知识库文档（分块）
  { url: "/uploadBatch", apiName: "uploadKnowledgeBatch" },
  // 重试上传知识库文档
  { url: "/retry", apiName: "retryKnowledgeUpload" },
  // 获取知识库文档列表
  { url: "/list", apiName: "getKnowledgeList" },
  // 删除知识库文档
  {
    url: "/delete",
    apiName: "deleteKnowledge",
  },
  // 获取知识库文档详情
  {
    url: "/detail",
    apiName: "getKnowledgeDetail",
  },
  { url: "/folder/create", apiName: "createKnowledgeFolder" },
  { url: "/folder/tree", apiName: "getKnowledgeFolderTree" },
  { url: "/folder/delete", apiName: "deleteKnowledgeFolder" },
];

const baseURL = "/api/ai/knowledge";
export default apiList.map((item) => ({
  name: item.apiName,
  url: `${baseURL}${item.url}`,
  type: "post",
}));
