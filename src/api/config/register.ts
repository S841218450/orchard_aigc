import aiModule from "../module/ai";
import authModule from "../module/auth";
import userModule from "../module/user";
import commonModule from "../module/common";
import workModule from "../module/work";
// 注册 API 模块
const modules = [aiModule, authModule, userModule, commonModule, workModule];

// 检查 API 重复
const checkApiDuplicates = (apiList: { url: string; name: string }[]) => {
  apiList.forEach((item) => {
    if (apiList.filter((api) => api.url === item.url).length > 1) {
      console.log(`API 重复: ${item.url} 名称: ${item.name}`);
    }
  });
};

// 注册 API - 返回对象
export const registerApi = () => {
  const apiList = modules.flat().filter(Boolean);
  checkApiDuplicates(apiList);

  // 将数组转换为以 name 为键的对象
  const apiObject: Record<string, any> = {};
  apiList.forEach((api: any) => {
    apiObject[api.name] = api;
  });

  return apiObject;
};
