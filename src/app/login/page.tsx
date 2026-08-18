"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Segmented, Image } from "antd";
import { ArrowLeft, Sparkles, Images, Megaphone } from "lucide-react";
import { useUserStore } from "@/store";
import { DEFAULT_IMAGES } from "@/constants/assets";
import messageManager from "@/utils/messageManager";
import "@/style/basePage/login.scss";
import PhoneLogin from "./components/PhoneLogin";
import AccountLogin from "./components/AccountLogin";
import ThirdPartyLogin from "./components/ThirdPartyLogin";
import Register from "./components/Register";

type LoginMode = "phone" | "account";
type ThirdPartyType = "wechat" | "alipay" | "github";

/** 左侧品牌展示区能力点 */
const SHOWCASE_FEATURES: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  desc: string;
}[] = [
  { icon: Sparkles, title: "文生图", desc: "一句话描述，快速生成图像" },
  { icon: Images, title: "图生图", desc: "以图绘图，风格自由切换" },
  { icon: Megaphone, title: "营销素材", desc: "海报推广内容一键产出" },
];

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, setLoginData } = useUserStore();
  const [loginMode, setLoginMode] = useState<LoginMode>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<"login" | "register">("login");

  useEffect(() => {
    if (isLoggedIn) router.push("/");
  }, [router, isLoggedIn]);

  const handleLoginSuccess = useCallback(
    (data: any) => {
      setLoginData(data);
      messageManager.success("登录成功");
      router.push("/");
    },
    [router, setLoginData],
  );

  const handleThirdPartyLoginSuccess = useCallback(
    (data: any, type: ThirdPartyType) => {
      setLoginData(data, type);
      messageManager.success("登录成功");
      router.push("/");
    },
    [router, setLoginData],
  );

  const handleLoginError = useCallback((msg: string) => {
    messageManager.error(msg);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleRegisterSuccess = useCallback(() => {
    setType("login");
  }, []);

  const handleSwitchType = (newType: "login" | "register") => {
    if (newType !== type) {
      setType(newType);
    }
  };

  return (
    <div className={`login-page ${isLoading ? "is-loading" : ""}`}>
      {/* 左侧品牌展示区 */}
      <div className="login-showcase">
        <div className="showcase-bg" aria-hidden="true">
          <div className="showcase-orb showcase-orb--warm" />
          <div className="showcase-orb showcase-orb--cyan" />
          <div className="showcase-orb showcase-orb--gray" />
          <div className="showcase-grain" />
          <div className="showcase-watermark">ORCHARD</div>
        </div>

        <div className="showcase-content">
          <div className="showcase-brand">
            <span className="showcase-brand-cn">巧思</span>
            <span className="showcase-brand-en">Orchard AIGC</span>
          </div>

          <div className="showcase-mid">
            <p className="showcase-eyebrow">AI 智能创作平台</p>
            <h1 className="showcase-title">
              让创作
              <br />
              <span className="showcase-title-accent">更简单</span>
            </h1>
            <p className="showcase-desc">
              文生图、图生图、营销素材……一句话唤起灵感，让想法快速落地为作品。
            </p>
          </div>

          <div className="showcase-features">
            {SHOWCASE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="showcase-feature">
                  <span className="showcase-feature-icon">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <div className="showcase-feature-text">
                    <p className="showcase-feature-title">{feature.title}</p>
                    <p className="showcase-feature-desc">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="showcase-footer">巧思 · 面向个人与团队的 AI 创作平台</p>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="login-main">
        <div className="back-btn" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>返回</span>
        </div>

        <div className="auth-card">
          <div className="login-header">
            <div className="logo-wrapper">
              <Image
                width={200}
                preview={false}
                src={DEFAULT_IMAGES.logoFull}
                alt="巧思 logo"
              />
            </div>
            <h1 className="auth-title">
              {type === "login" ? "欢迎回来" : "创建账号"}
            </h1>
            <p className="auth-subtitle">
              {type === "login"
                ? "登录后继续你的创作之旅"
                : "注册后即可开启 AI 创作"}
            </p>
          </div>

          <div key={type} className="auth-panel">
            {type === "login" ? (
              <>
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
                <div>
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
                </div>
                <div className="signup-link">
                  还没有账号？
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSwitchType("register");
                    }}
                    className="signup-btn"
                  >
                    立即注册
                  </a>
                </div>
              </>
            ) : (
              <>
                <Register
                  onSuccess={handleRegisterSuccess}
                  onError={handleLoginError}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
                <div className="signup-link">
                  已有账号？
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSwitchType("login");
                    }}
                    className="signup-btn"
                  >
                    去登录
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="login-copyright">
          © 2026 巧思 · AI 智能创作平台 保留所有权利
        </p>
      </div>
    </div>
  );
}
