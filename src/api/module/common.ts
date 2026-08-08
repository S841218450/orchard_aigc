// 公共模块
const apiList = [
  // 上传文件
  { url: "/file/upload", apiName: "uploadFile", type: "post" },

  // 创建文件夹
  { url: "/file/folder/create", apiName: "createFileFolder", type: "post" },
  // 获取文件夹树
  { url: "/file/folder/tree", apiName: "getFileListTree", type: "get" },
  // 获取文件夹下文件列表
  { url: "/file/folder/files", apiName: "getFileFolderFiles", type: "get" },
  // 删除文件夹
  { url: "/file/folder/delete", apiName: "deleteFileFolder", type: "delete" },
  // 删除文件
  { url: "/file/delete", apiName: "deleteFile", type: "delete" },
];

export default apiList.map((item) => ({
  name: item.apiName,
  url: item.url,
  type: item.type || "post",
}));
