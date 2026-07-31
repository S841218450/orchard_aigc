import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "@/api";

export type OAuthType = "wechat" | "alipay" | "github" | null;

export interface UserInfo {
  userId: number;
  nickname: string;
  avatar?: string;
  phone?: string | null;
}

interface UserState {
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  oauthType: OAuthType;
  setLoginData: (
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      userId: number;
      nickname: string;
      avatar?: string;
      phone?: string | null;
    },
    oauthType?: OAuthType,
  ) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  logout: () => Promise<void>;
}

// 第三方平台退出 URL
const OAUTH_LOGOUT_URLS: Record<string, string> = {
  wechat: "https://open.weixin.qq.com/connect/qrconnect?logout=1",
  alipay: "https://openauth.alipay.com/oauth2/publicAppLogout.htm",
  github: "https://github.com/logout",
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      expiresIn: null,
      userInfo: null,
      isLoggedIn: false,
      oauthType: null,

      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      setRefreshToken: (refreshToken: string | null) => set({ refreshToken }),
      // 设置登录数据
      setLoginData: (data, oauthType = null) =>
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          userInfo: {
            userId: data.userId,
            nickname: data.nickname,
            avatar: data.avatar,
            phone: data.phone,
          },
          isLoggedIn: true,
          oauthType,
        }),
      // 登出
      logout: async () => {
        const { token, oauthType } = get();
        // 1. 调用后端登出接口
        try {
          if (token) {
            await API.logout();
          }
        } catch (e) {
          console.error("logout API error:", e);
        }
        // 2. 清除本地状态
        set({
          token: null,
          refreshToken: null,
          expiresIn: null,
          userInfo: null,
          isLoggedIn: false,
          oauthType: null,
        });
        // 3. 如果是第三方登录，清除第三方平台 session
        if (oauthType && OAUTH_LOGOUT_URLS[oauthType]) {
          const logoutUrl = OAUTH_LOGOUT_URLS[oauthType];
          const w = window.open(logoutUrl, "_blank", "width=1,height=1");
          if (w) {
            setTimeout(() => w.close(), 2000);
          }
        }
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        expiresIn: state.expiresIn,
        userInfo: state.userInfo,
        isLoggedIn: state.isLoggedIn,
        oauthType: state.oauthType,
      }),
    },
  ),
);
