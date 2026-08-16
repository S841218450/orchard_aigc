"use client";

import { useState, useCallback, useEffect } from "react";
import { Form, Input, Button } from "antd";
import { Smartphone, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
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
  const [codeCountdown, setCodeCountdown] = useState(0);
  // 验证码输入框显示值：Form.Item 直接子元素是 div 无法自动绑定，用 state 承载显示并同步到表单 store
  const [code, setCode] = useState("");
  useRequest(getPublicKey, {
    onSuccess: (data) => {
      setPublicKey(data);
    },
  });
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setTimeout(() => {
      setCodeCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [codeCountdown]);
  const handleRegister = useCallback(
    async (values: {
      phone: string;
      password: string;
      code: string;
      confirmPassword: string;
    }) => {
      setIsLoading(true);
      try {
        const res = await API.register({
          phone: values.phone,
          password: encryptPassword(values.password, publicKey),
          code: values.code,
        });
        if (res.success) {
          messageManager.success("注册成功，请登录");
          onSuccess();
        } else {
          onError(res.msg || "注册失败");
        }
      } catch (error) {
        onError("注册失败，请稍后重试");
        console.error("注册失败，请稍后重试", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, setIsLoading, publicKey],
  );
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
        setTimeout(() => {
          // 测试环境：直接把验证码写入表单，回填输入框
          form.setFieldsValue({ code: "123456" });
          setCode("123456");
          messageManager.success("项目仅为测试环境，验证码已自动填写");
        }, 3000);
      } else {
        messageManager.error(res.msg || "发送失败");
      }
    } catch {
      messageManager.error("发送失败，请稍后重试");
    }
  }, [form]);
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
            allowClear={true}
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
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                form.setFieldsValue({ code: e.target.value });
              }}
            />
            <Button
              onClick={handleGetCode}
              className="w-100"
              disabled={codeCountdown > 0 || isLoading}
            >
              <span className="fs-14">
                {codeCountdown > 0 ? `${codeCountdown}s` : "获取验证码"}
              </span>
            </Button>
          </div>
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
