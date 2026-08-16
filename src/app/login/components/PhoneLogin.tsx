"use client";

import { useState, useCallback, useEffect } from "react";
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
  // 验证码输入框显示值：Form.Item 直接子元素是 div 无法自动绑定，用 state 承载显示并同步到表单 store
  const [code, setCode] = useState("");
  // 验证码倒计时：每秒递减，归零后按钮恢复可用
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setTimeout(() => {
      setCodeCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [codeCountdown]);

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
