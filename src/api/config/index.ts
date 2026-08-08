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

      // 路径参数模式：将参数拼接到 URL 末尾
      const url = api.url;
      if (method === "get") {
        return instance.get(url, {
          ...extraConfig,
          params: api.pathParams ? undefined : params,
        });
      }
      const hasBody = !api.pathParams;
      return instance.request({
        url,
        method: method.toUpperCase(),
        data: hasBody ? params : undefined,
        ...extraConfig,
      });
    };
  });

  return apiCallerObject;
};
