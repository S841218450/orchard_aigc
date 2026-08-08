"use client";

import { useState, useCallback } from "react";
import { Form, Input, Button } from "antd";
import { Smartphone, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import API from "@/api";
import messageManager from "@/utils/messageManager";

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
  const [form] = Form.useForm();
  const [codeCountdown, setCodeCountdown] = useState(0);

  const handleGetCode = useCallback(async () => {
    const phone = form.getFieldValue("phone");
    if (!phone) {
      messageManager.warning("请输入手机号");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      messageManager.warning("请输入正确的手机号");
      return;
    }
    try {
      const res = await API.sendSms({ phone });
      if (res.success) {
        setCodeCountdown(60);
        messageManager.success("验证码已发送");
      } else {
        messageManager.error(res.msg || "发送失败");
      }
    } catch {
      messageManager.error("发送失败，请稍后重试");
    }
  }, [form]);

  const handleLogin = useCallback(
    async (values: { phone: string; password: string; code: string }) => {
      setIsLoading(true);
      try {
        const res = await API.loginSms({
          phone: values.phone,
          code: values.code,
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
    [onSuccess, onError, setIsLoading],
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
          <div className="flex-gap-5">
            <Input
              prefix={
                <MessageSquare
                  size={18}
                  style={{ color: "rgba(0,0,0,0.35)" }}
                />
              }
              placeholder="请输入验证码"
              disabled={isLoading}
            />
            <Button
              onClick={handleGetCode}
              disabled={codeCountdown > 0 || isLoading}
            >
              <span className="fs-14">
                {codeCountdown > 0 ? `${codeCountdown}s` : "获取验证码"}
              </span>
            </Button>
          </div>
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
