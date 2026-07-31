"use client";

import { useState, useCallback } from "react";
import { Form, Input, Button, App } from "antd";
import { Smartphone, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import API from "@/api";

type AccountLoginProps = {
  onSuccess: (data: any) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export default function AccountLogin({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: AccountLoginProps) {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [loginType, setLoginType] = useState<"password" | "sms">("password");
  const [codeCountdown, setCodeCountdown] = useState(0);

  const handleGetCode = useCallback(async () => {
    const account = form.getFieldValue("account");
    if (!account) {
      messageApi.warning("请输入账号");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(account)) {
      messageApi.warning("请输入正确的手机号作为账号");
      return;
    }
    try {
      const res = await API.sendSms({ phone: account });
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
    async (values: { account: string; password: string }) => {
      setIsLoading(true);
      try {
        const res = await API.loginPassword({
          username: values.account,
          password: values.password,
        });

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
    <div className="account-login">
      <Form
        form={form}
        onFinish={handleLogin}
        layout="vertical"
        size="large"
        className="login-form"
      >
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

        <Form.Item
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password
            prefix={<Lock size={18} style={{ color: "rgba(0,0,0,0.35)" }} />}
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
    </div>
  );
}
