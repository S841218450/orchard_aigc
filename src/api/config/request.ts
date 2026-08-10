import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import NProgress from "nprogress";
import { useUserStore, useLoadingStore } from "@/store";
import { requestQueue } from "@/utils/requestQueue";
import { messageManager } from "@/utils/messageManager";
// 配置 NProgress
NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  speed: 400,
  trickleSpeed: 200,
});

// 请求计数器
let requestCount = 0;

const BASE_URL = process.env.ADMIN_API_TARGET;
const TIMEOUT = 30000;

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token 刷新状态
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 订阅 token 刷新
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

// 通知所有订阅者 token 已刷新
function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// 安全跳转登录（兼容Node/浏览器）
const jumpToLogin = () => {
  if (typeof window === "undefined") return;
  useUserStore.setState({
    token: null,
    refreshToken: null,
    expiresIn: null,
    userInfo: null,
    isLoggedIn: false,
  });
  window.location.href = "/login";
};

// 刷新 token
async function refreshToken(): Promise<string | null> {
  const refreshTokenValue = useUserStore.getState().refreshToken;
  if (!refreshTokenValue) {
    return null;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/auth/refresh`,
      { refreshToken: refreshTokenValue },
      { timeout: TIMEOUT, _isRefreshReq: true } as AxiosRequestConfig & {
        _isRefreshReq: boolean;
      },
    );
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    useUserStore.setState({
      token: accessToken,
      refreshToken: newRefreshToken,
    });
    return accessToken;
  } catch (e) {
    console.error("刷新 token 失败:", e);
    return null;
  }
}

// 请求拦截器
instance.interceptors.request.use(
  (
    config: AxiosRequestConfig &
      InternalAxiosRequestConfig & { _isRefreshReq?: boolean },
  ) => {
    // 添加到请求队列（相同请求会取消旧的，保留新的）
    const controller = requestQueue.add(config);
    config.signal = controller.signal;

    // 启动进度条 + 全局 loading
    if (requestCount === 0) {
      NProgress.start();
    }
    requestCount++;
    useLoadingStore.getState().show();

    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 如果是 FormData，自动设置正确的 Content-Type
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }
    return config;
  },
  (error) => {
    // 请求拦截器出错时也要修正计数
    requestCount--;
    if (requestCount <= 0) {
      requestCount = 0;
      NProgress.done();
    }
    useLoadingStore.getState().hide();
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  // 成功响应
  (response) => {
    // 从队列中移除
    requestQueue.removeByConfig(response.config);
    // 更新进度条
    requestCount--;
    if (requestCount === 0) {
      NProgress.done();
    }
    useLoadingStore.getState().hide();

    const res = response.data;
    // 拦截业务错误码
    if (res.code !== 200) {
      messageManager.error(res.msg || "请求异常");
      return Promise.reject(res);
    }
    return res;
  },
  // 错误响应
  async (error) => {
    // 从队列中移除
    if (error.config) {
      requestQueue.removeByConfig(error.config);
    }
    // 更新进度条
    requestCount--;
    if (requestCount <= 0) {
      requestCount = 0;
      NProgress.done();
    }
    useLoadingStore.getState().hide();

    // 取消的请求直接 reject，不做错误处理
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _isRefreshReq?: boolean;
    };

    if (error.response) {
      const { status } = error.response;
      // 401 未登录/过期，排除刷新接口自身，且只重试一次
      if (
        status === 401 &&
        !originalRequest._retry &&
        !originalRequest._isRefreshReq
      ) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;

          if (newToken) {
            onTokenRefreshed(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } else {
            // 刷新失败，清空队列并登出
            refreshSubscribers = [];
            messageManager.error("登录过期，请重新登录");
            jumpToLogin();
            return Promise.reject(error);
          }
        } else {
          // 正在刷新，加入等待队列
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(instance(originalRequest));
            });
          });
        }
      }

      switch (status) {
        case 403:
          messageManager.error("拒绝访问");
          typeof window !== "undefined" && (window.location.href = "/error");
          break;
        case 404:
          messageManager.error("请求资源不存在");
          break;
        case 500:
          messageManager.error("服务器错误");
          break;
      }
    }
    return Promise.reject(error);
  },
);

// 导出取消所有请求的方法
export const cancelAllRequests = () => {
  requestQueue.cancelAll();
  requestCount = 0;
  NProgress.done();
  useLoadingStore.getState().reset();
};

export default instance;
