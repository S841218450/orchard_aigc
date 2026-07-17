"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Modal, Segmented, message, Tabs } from "antd";
import {
  GithubOutlined,
  WechatOutlined,
  AlipayOutlined,
} from "@ant-design/icons";
import {
  Eye,
  EyeOff,
  Smartphone,
  Lock,
  MessageSquare,
  ArrowLeft,
  MessageCircle,
  Wallet,
} from "lucide-react";
import API from "@/api";
import { useUserStore } from "@/store";
import "@/style/basePage/login.scss";
import NextImage from "next/image";

type LoginMode = "phone" | "account";
type LoginType = "password" | "sms";
type ThirdPartyType = "wechat" | "alipay" | "github";

const THIRD_PARTY_CONFIG: Record<
  ThirdPartyType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  wechat: {
    icon: <WechatOutlined size={18} />,
    label: "微信",
    color: "#07c160",
  },
  alipay: {
    icon: <AlipayOutlined size={18} />,
    label: "支付宝",
    color: "#1677ff",
  },
  github: {
    icon: <GithubOutlined size={18} />,
    label: "Github",
    color: "#333",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, setLoginData } = useUserStore();
  const [form] = Form.useForm();
  const [loginMode, setLoginMode] = useState<LoginMode>("phone");
  const [loginType, setLoginType] = useState<LoginType>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  useEffect(() => {
    if (isLoggedIn) router.push("/");
  }, [router, isLoggedIn]);

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setInterval(() => setCodeCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [codeCountdown]);

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
          setLoginData(res.data, state as ThirdPartyType);
          message.success("登录成功");
          router.push("/");
        } else {
          message.error(res.msg || "第三方登录失败");
        }
      } catch {
        message.error("第三方登录失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, setLoginData]);

  const handleGetCode = useCallback(async () => {
    const phone = form.getFieldValue("phone");
    if (!phone) {
      message.warning("请输入手机号");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.warning("请输入正确的手机号");
      return;
    }
    try {
      const res = await API.sendSms({ phone });
      if (res.success) {
        setCodeCountdown(60);
        message.success("验证码已发送");
      } else {
        message.error(res.msg || "发送失败");
      }
    } catch {
      message.error("发送失败，请稍后重试");
    }
  }, [form]);

  const handleLogin = useCallback(
    async (values: {
      phone: string;
      account: string;
      password: string;
      code: string;
    }) => {
      setIsLoading(true);
      try {
        const username = loginMode === "phone" ? values.phone : values.account;
        const password =
          loginType === "password" ? values.password : values.code;

        const res =
          loginType === "password"
            ? await API.loginPassword({ username, password })
            : await API.loginSms({ phone: username, code: password });

        if (res.success) {
          setLoginData(res.data);
          message.success("登录成功");
          router.push("/");
        } else {
          message.error(res.msg || "登录失败");
        }
      } catch {
        message.error("登录失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    },
    [loginMode, loginType, router, setLoginData],
  );

  //第三方登录
  const handleThirdPartyLogin = useCallback(async (type: ThirdPartyType) => {
    try {
      const res = await API.thirdPartyLogin({ oauthType: type });
      if (!res.success) {
        message.error(res.msg || "获取授权链接失败");
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
        message.warning("弹窗被浏览器拦截，请允许弹出窗口");
      }
    } catch {
      message.error("暂不支持该登录方式");
    }
  }, []);

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
            onChange={(val) => {
              setLoginMode(val as LoginMode);
              form.resetFields();
            }}
            options={[
              { label: "手机号登录", value: "phone" },
              { label: "账号登录", value: "account" },
            ]}
          />
        </div>

        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
          size="large"
          className="login-form"
        >
          {loginMode === "phone" && (
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: "请输入手机号" },
                { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" },
              ]}
            >
              <Input
                prefix={
                  <Smartphone size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
                }
                placeholder="请输入手机号"
                disabled={isLoading}
              />
            </Form.Item>
          )}

          {loginMode === "account" && (
            <Form.Item
              name="account"
              rules={[{ required: true, message: "请输入账号" }]}
            >
              <Input
                prefix={
                  <Smartphone size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
                }
                placeholder="请输入账号"
                disabled={isLoading}
              />
            </Form.Item>
          )}

          {loginType === "password" ? (
            <Form.Item
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                prefix={
                  <Lock size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
                }
                placeholder="请输入密码"
                disabled={isLoading}
                iconRender={(visible) =>
                  visible ? (
                    <EyeOff size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
                  ) : (
                    <Eye size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
                  )
                }
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="code"
              rules={[{ required: true, message: "请输入验证码" }]}
            >
              <Input
                prefix={
                  <MessageSquare
                    size={18}
                    style={{ color: "rgba(0,0,0,0.35)" }}
                  />
                }
                placeholder="请输入验证码"
                disabled={isLoading}
                addonAfter={
                  <Button
                    type="link"
                    onClick={handleGetCode}
                    disabled={codeCountdown > 0 || isLoading}
                    style={{
                      color:
                        codeCountdown > 0 || isLoading ? "#a1a1aa" : "#2563eb",
                      padding: 0,
                    }}
                  >
                    {codeCountdown > 0 ? `${codeCountdown}s` : "获取验证码"}
                  </Button>
                }
              />
            </Form.Item>
          )}

          {loginType === "password" && (
            <div className="form-footer">
              <a href="#" className="forgot-password">
                忘记密码？
              </a>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={isLoading}
              className="login-btn"
            >
              {isLoading && <span className="btn-loading-spinner" />}
              {isLoading ? "登录中" : "登 录"}
            </Button>
          </Form.Item>
        </Form>

        <div className="divider">
          <span className="divider-line"></span>
          <span className="divider-text">其他登录方式</span>
          <span className="divider-line"></span>
        </div>

        <div className="third-party-login">
          {(
            Object.entries(THIRD_PARTY_CONFIG) as [
              ThirdPartyType,
              (typeof THIRD_PARTY_CONFIG)[ThirdPartyType],
            ][]
          ).map(([key, config]) => (
            <Button key={key} onClick={() => handleThirdPartyLogin(key)}>
              <span style={{ color: config.color }}>{config.icon}</span>
              {config.label}
            </Button>
          ))}
        </div>

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
