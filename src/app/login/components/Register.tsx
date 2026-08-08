"use client";

import { useState, useCallback } from "react";
import { Form, Input, Button } from "antd";
import { Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import API from "@/api";
import { encryptPassword } from "@/utils/encrypt";
import { useRequest } from "ahooks";
import { getPublicKey } from "@/actions/login";
import messageManager from "@/utils/messageManager";

type RegisterProps = {
  onSuccess: () => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export default function Register({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: RegisterProps) {
  const [form] = Form.useForm();
  const [publicKey, setPublicKey] = useState("");

  useRequest(getPublicKey, {
    onSuccess: (data) => {
      setPublicKey(data);
    },
  });

  const handleRegister = useCallback(
    async (values: {
      phone: string;
      password: string;
      confirmPassword: string;
    }) => {
      setIsLoading(true);
      try {
        const res = await API.register({
          phone: values.phone,
          password: encryptPassword(values.password, publicKey),
        });
        if (res.success) {
          messageManager.success("注册成功，请登录");
          onSuccess();
        } else {
          onError(res.msg || "注册失败");
        }
      } catch {
        onError("注册失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, setIsLoading, publicKey],
  );

  const validateConfirmPassword = ({ getFieldValue }: any) => ({
    validator(_: any, value: string) {
      if (!value || getFieldValue("password") === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("两次输入的密码不一致"));
    },
  });

  return (
    <div className="register-form">
      <div className="register-title">
        <h2>注册账号</h2>
        <p>手机号快速注册，开启 AI 创作之旅</p>
      </div>
      <Form
        form={form}
        onFinish={handleRegister}
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
            maxLength={11}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 6, message: "密码长度不能少于6位" },
            { max: 20, message: "密码长度不能超过20位" },
          ]}
        >
          <Input.Password
            prefix={<Lock size={18} style={{ color: "rgba(0,0,0,0.35)" }} />}
            placeholder="请设置密码（6-20位）"
            disabled={isLoading}
            iconRender={(visible) =>
              visible ? <Eye size={16} /> : <EyeOff size={16} />
            }
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "请再次输入密码" },
            validateConfirmPassword,
          ]}
        >
          <Input.Password
            prefix={<Lock size={18} style={{ color: "rgba(0,0,0,0.35)" }} />}
            placeholder="请确认密码"
            disabled={isLoading}
            iconRender={(visible) =>
              visible ? <Eye size={16} /> : <EyeOff size={16} />
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
            {isLoading ? "注册中" : "注 册"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
