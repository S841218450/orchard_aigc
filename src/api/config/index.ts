import instance from "./request";

/**
 * 将API配置转换为可调用对象
 */
export const createApiCallerObject = (apiConfigList: Record<string, any>) => {
  const apiCallerObject: Record<string, any> = {};

  Object.values(apiConfigList).forEach((api: any) => {
    apiCallerObject[api.name] = (params?: any) => {
      const method = (api.type || "post").toLowerCase();
      const extraConfig: Record<string, any> = {};
      // 支持接口级别的 baseURL 覆盖（如 py 后端不走 /admin-api 前缀）
      if (api.baseURL !== undefined) {
        extraConfig.baseURL = api.baseURL;
      } else {
        extraConfig.baseURL = "/admin-api";
      }
      if (method === "get") {
        return instance.get(api.url, { ...extraConfig, params });
      }
      return instance.request({
        url: api.url,
        method: method.toUpperCase(),
        data: params,
        ...extraConfig,
      });
    };
  });

  return apiCallerObject;
};
