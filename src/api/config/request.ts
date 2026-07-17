import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { message } from "antd";
import { useUserStore } from "@/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
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
  useUserStore.setState({ token: null, refreshToken: null });
  window.location.href = "/login";
};

// 安全弹窗提示（避免Node环境报错）
const safeMessageError = (text: string) => {
  if (typeof window === "undefined") return;
  message.error(text);
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
      { timeout: TIMEOUT, _isRefreshReq: true },
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
  (config) => {
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
  (error) => Promise.reject(error),
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 拦截业务错误码
    if (res.code !== 200) {
      safeMessageError(res.msg || "请求异常");
      return Promise.reject(res);
    }
    return res;
  },
  async (error) => {
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
          safeMessageError("拒绝访问");
          typeof window !== "undefined" && (window.location.href = "/error");
          break;
        case 404:
          safeMessageError("请求资源不存在");
          break;
        case 500:
          safeMessageError("服务器错误");
          break;
      }
    }
    return Promise.reject(error);
  },
);

export default instance;
