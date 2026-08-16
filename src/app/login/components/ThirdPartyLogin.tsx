"use client";

import { useEffect, useCallback } from "react";
import { Button } from "antd";
import {
  GithubOutlined,
  WechatOutlined,
  AlipayOutlined,
} from "@ant-design/icons";
import API from "@/api";
import messageManager from "@/utils/messageManager";

type ThirdPartyType = "wechat" | "alipay" | "github";

const THIRD_PARTY_CONFIG: Record<
  ThirdPartyType,
  { icon: React.ReactNode; label: string; color: string; disabled: boolean }
> = {
  wechat: {
    icon: <WechatOutlined size={18} />,
    label: "微信",
    color: "#07c160",
    disabled: true,
  },
  alipay: {
    icon: <AlipayOutlined size={18} />,
    label: "支付宝",
    color: "#1677ff",
    disabled: true,
  },
  github: {
    icon: <GithubOutlined size={18} />,
    label: "Github",
    color: "#333",
    disabled: false,
  },
};

type ThirdPartyLoginProps = {
  onSuccess: (data: any, type: ThirdPartyType) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export default function ThirdPartyLogin({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: ThirdPartyLoginProps) {
  const handleThirdPartyLogin = useCallback(async (type: ThirdPartyType) => {
    try {
      const res = await API.thirdPartyLogin({ oauthType: type });
      if (!res.success) {
        messageManager.error(res.msg || "获取授权链接失败");
        return;
      }
      const authUrl = res.data;

      const width = 520;
      const height = 680;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const popup = window.open(
        authUrl,
        `oauth_${type}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes`,
      );

      if (!popup) {
        messageManager.warning("弹窗被浏览器拦截，请允许弹出窗口");
      }
    } catch (error) {
      console.error("第三方登录失败:", error);
      messageManager.error("暂不支持该登录方式");
    }
  }, []);

  // 监听 OAuth 弹窗回传消息
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "oauth_callback") return;

      const { code, state } = event.data;
      if (!code) return;

      setIsLoading(true);
      try {
        const res = await API.thirdPartyLoginCallback({
          code,
          state,
          oauthType: state as ThirdPartyType,
        });
        if (res.success) {
          onSuccess(res.data, state as ThirdPartyType);
        } else {
          onError(res.msg || "第三方登录失败");
        }
      } catch {
        onError("第三方登录失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError, setIsLoading]);

  return (
    <div className="third-party-login">
      {(
        Object.entries(THIRD_PARTY_CONFIG) as [
          ThirdPartyType,
          (typeof THIRD_PARTY_CONFIG)[ThirdPartyType],
        ][]
      ).map(([key, config]) => (
        <Button
          key={key}
          className={config.disabled ? "disabled" : ""}
          onClick={() => handleThirdPartyLogin(key)}
          disabled={isLoading || config.disabled}
        >
          <span style={{ color: config.color }}>{config.icon}</span>
          {config.label}
        </Button>
      ))}
    </div>
  );
}
