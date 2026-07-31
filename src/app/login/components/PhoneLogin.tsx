"use client";

import { useState, useCallback } from "react";
import { Form, Input, Button, App } from "antd";
import { Smartphone, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import API from "@/api";

type PhoneLoginProps = {
  onSuccess: (data: any) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export default function PhoneLogin({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: PhoneLoginProps) {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [loginType, setLoginType] = useState<"password" | "sms">("password");
  const [codeCountdown, setCodeCountdown] = useState(0);

  const handleGetCode = useCallback(async () => {
    const phone = form.getFieldValue("phone");
    if (!phone) {
      messageApi.warning("请输入手机号");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      messageApi.warning("请输入正确的手机号");
      return;
    }
    try {
      const res = await API.sendSms({ phone });
      if (res.success) {
        setCodeCountdown(60);
        messageApi.success("验证码已发送");
      } else {
        messageApi.error(res.msg || "发送失败");
      }
    } catch {
      messageApi.error("发送失败，请稍后重试");
    }
  }, [form]);

  const handleLogin = useCallback(
    async (values: { phone: string; password: string; code: string }) => {
      setIsLoading(true);
      try {
        const password =
          loginType === "password" ? values.password : values.code;
        const res =
          loginType === "password"
            ? await API.loginPassword({ username: values.phone, password })
            : await API.loginSms({ phone: values.phone, code: password });

        if (res.success) {
          onSuccess(res.data);
        } else {
          onError(res.msg || "登录失败");
        }
      } catch {
        onError("登录失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    },
    [loginType, onSuccess, onError, setIsLoading],
  );

  return (
    <div className="phone-login">
      <Form
        form={form}
        onFinish={handleLogin}
        layout="vertical"
        size="large"
        className="login-form"
      >
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

        <Form.Item
          name="code"
          rules={[{ required: true, message: "请输入验证码" }]}
        >
          <Input
            prefix={
              <MessageSquare size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
            }
            placeholder="请输入验证码"
            disabled={isLoading}
            addonAfter={
              <Button
                type="link"
                onClick={handleGetCode}
                disabled={codeCountdown > 0 || isLoading}
                style={{
                  color: codeCountdown > 0 || isLoading ? "#a1a1aa" : "#2563eb",
                  padding: 0,
                }}
              >
                {codeCountdown > 0 ? `${codeCountdown}s` : "获取验证码"}
              </Button>
            }
          />
        </Form.Item>

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
    </div>
  );
}
