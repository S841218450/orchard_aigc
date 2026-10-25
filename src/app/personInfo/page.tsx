"use client";

import { useEffect } from "react";
import { Avatar, Button, Card, Form, Input, Upload, App, Tag } from "antd";
import { Mail, Phone, Camera, Save } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useRequest } from "ahooks";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/actions/userCenter";
import { useUserStore } from "@/store";
import { DEFAULT_IMAGES } from "@/constants/assets";

interface ProfileFormValues {
  nickname: string;
  email?: string;
  phone?: string;
}

const PersonInfo = () => {
  const [form] = Form.useForm<ProfileFormValues>();
  const { modal } = App.useApp();
  const router = useRouter();
  const userInfo = useUserStore((s) => s.userInfo);

  const { data: profileRes, loading } = useRequest(getUserProfile);

  // 等 Form 挂载后再回填数据，避免 useForm 未连接 Form 元素的警告
  useEffect(() => {
    if (!profileRes?.success) return;
    const data = profileRes.data as UserProfile;
    form.setFieldsValue({
      nickname: data.nickname,
      email: data.email,
      phone: data.phone || undefined,
    });
  }, [profileRes, form]);

  const { run: runUpdate, loading: saving } = useRequest(updateUserProfile, {
    manual: true,
    onSuccess: (res) => {
      if (!res.success) return;
      modal.success({
        title: "保存成功",
        content: "个人信息已更新",
      });
    },
  });

  const handleFinish = (values: ProfileFormValues) => {
    runUpdate(values);
  };

  return (
    <div className="user-info">
      <Card className="profile-card" loading={loading}>
        <div className="profile-card-glow" aria-hidden="true" />

        <div className="profile-avatar-section">
          <div className="avatar-orb">
            <span className="avatar-orb-ring" aria-hidden="true" />
            <Upload
              name="avatar"
              listType="picture-circle"
              showUploadList={false}
              action="/admin-api/file/upload"
              onChange={(info) => {
                if (info.file.status === "done") {
                  const url = info.file.response?.data?.url;
                  if (url) {
                    modal.success({
                      title: "上传成功",
                      content: "头像已更新",
                    });
                  }
                }
              }}
            >
              <div className="avatar-uploader">
                <Avatar
                  size={96}
                  src={userInfo?.avatar || DEFAULT_IMAGES.defaultAvatar}
                />
                <div className="avatar-mask">
                  <Camera size={20} />
                </div>
              </div>
            </Upload>
          </div>
          <div className="avatar-name">
            {userInfo?.nickname || "未设置昵称"}
          </div>
          <div className="avatar-tip">点击头像可更换图片</div>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="profile-form"
          onFinish={handleFinish}
        >
          <div className="form-grid">
            <Form.Item
              label="昵称"
              name="nickname"
              rules={[{ required: true, message: "请输入昵称" }]}
            >
              <Input placeholder="请输入昵称" maxLength={20} showCount />
            </Form.Item>

            <Form.Item label="手机号" name="phone">
              <Input
                prefix={<Phone size={16} />}
                placeholder="请输入手机号"
                maxLength={11}
              />
            </Form.Item>

            <Form.Item label="邮箱" name="email">
              <Input
                prefix={<Mail size={16} />}
                placeholder="请输入邮箱"
                maxLength={50}
              />
            </Form.Item>
          </div>

          <Form.Item className="form-actions">
            <Button
              type="primary"
              htmlType="submit"
              className="w-200"
              icon={<Save size={16} />}
              loading={saving}
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PersonInfo;
