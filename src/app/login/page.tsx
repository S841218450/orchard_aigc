"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Segmented, App } from "antd";
import { ArrowLeft } from "lucide-react";
import { useUserStore } from "@/store";
import "@/style/basePage/login.scss";
import NextImage from "next/image";
import PhoneLogin from "./components/PhoneLogin";
import AccountLogin from "./components/AccountLogin";
import ThirdPartyLogin from "./components/ThirdPartyLogin";

type LoginMode = "phone" | "account";
type ThirdPartyType = "wechat" | "alipay" | "github";

export default function LoginPage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const { isLoggedIn, setLoginData } = useUserStore();
  const [loginMode, setLoginMode] = useState<LoginMode>("phone");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.push("/");
  }, [router, isLoggedIn]);

  const handleLoginSuccess = useCallback(
    (data: any) => {
      setLoginData(data);
      messageApi.success("登录成功");
      router.push("/");
    },
    [router, setLoginData],
  );

  const handleThirdPartyLoginSuccess = useCallback(
    (data: any, type: ThirdPartyType) => {
      setLoginData(data, type);
      messageApi.success("登录成功");
      router.push("/");
    },
    [router, setLoginData],
  );

  const handleLoginError = useCallback(
    (msg: string) => {
      messageApi.error(msg);
    },
    [messageApi],
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className={`login-page ${isLoading ? "is-loading" : ""}`}>
      <div className="login-bg"></div>

      <div className="back-btn" onClick={handleBack}>
        <ArrowLeft size={16} />
        <span>返回</span>
      </div>

      <div className="login-container animate__animated animate__fadeInUp">
        <div className="login-header">
          <div className="logo-wrapper">
            <NextImage
              width={100}
              height={50}
              src="/logo_opcity.png"
              alt="logo"
            />
          </div>
          <p className="brand-slogan">AI 驱动的智能创作平台</p>
        </div>

        <div className="login-segmented">
          <Segmented
            value={loginMode}
            block
            onChange={(val) => setLoginMode(val as LoginMode)}
            options={[
              { label: "手机号登录", value: "phone" },
              { label: "账号登录", value: "account" },
            ]}
          />
        </div>

        {loginMode === "phone" ? (
          <PhoneLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <AccountLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        <div className="divider">
          <span className="divider-line"></span>
          <span className="divider-text">其他登录方式</span>
          <span className="divider-line"></span>
        </div>

        <ThirdPartyLogin
          onSuccess={handleThirdPartyLoginSuccess}
          onError={handleLoginError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        <div className="signup-link">
          还没有账号？
          <a href="#" className="signup-btn">
            立即注册
          </a>
        </div>
      </div>
    </div>
  );
}
