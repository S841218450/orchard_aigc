"use client";

import { useState, useCallback } from "react";
import { Form, Input, Button, App } from "antd";
import { Smartphone, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import API from "@/api";
import { encryptPassword } from "@/utils/encrypt";
import { useRequest } from "ahooks";
import { getPublicKey } from "@/actions/login";
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
  const [form] = Form.useForm();
  const [publicKey, setPublicKey] = useState("");

  useRequest(getPublicKey, {
    onSuccess: (data) => {
      setPublicKey(data);
    },
  });
  const handleLogin = useCallback(
    async (values: { account: string; password: string }) => {
      setIsLoading(true);
      try {
        const res = await API.loginPassword({
          phone: values.account,
          password: encryptPassword(values.password, publicKey),
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
    [publicKey, onSuccess, onError, setIsLoading],
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

        <div className="form-footer">
          <a href="#" className="forgot-password">
            忘记密码？
          </a>
        </div>

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
