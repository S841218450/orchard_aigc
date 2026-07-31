import { useRouter } from "next/navigation";
import API from "@/api";
import { useUserStore } from "@/store";
import { App } from "antd";

export const useAuth = () => {
  const router = useRouter();
  const userStore = useUserStore();
  const { message } = App.useApp();

  // 登录
  const login = async (data: { username: string; password: string }) => {
    try {
      const res = await API.login(data);
      if (res.success) {
        userStore.setToken(res.data.token);
        userStore.setUserInfo(res.data.data);
        router.push("/");
      } else {
        message.error(res.msg || "登录失败");
      }
    } catch (e) {
      console.error("login|", e);
    }
  };

  // 登出
  const logout = async () => {
    try {
      await userStore.logout();
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return { login, logout };
};
