"use client";

import "./profile.scss";
import { Avatar, Button, Card, Form, Input, Upload, App } from "antd";
import { UserRound, Phone, Mail, Camera, Save, Sparkles } from "lucide-react";
import { useRequest } from "ahooks";
import { getUserProfile, updateUserProfile } from "@/actions/userCenter";
import { useUserStore } from "@/store";
import { DEFAULT_IMAGES } from "@/constants/assets";
import UserCenterBackground from "@/components/userCenter/pageBackground/pageBackground";

interface ProfileFormValues {
  nickname: string;
  email?: string;
  phone?: string;
  bio?: string;
}

const ProfilePage = () => {
  const [form] = Form.useForm<ProfileFormValues>();
  const { modal } = App.useApp();
  const userInfo = useUserStore((s) => s.userInfo);

  const { loading } = useRequest(getUserProfile, {
    onSuccess: (res) => {
      if (!res.success) return;
      form.setFieldsValue({
        nickname: res.data.nickname,
        email: res.data.email,
        phone: res.data.phone || undefined,
      });
    },
  });

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
    <div className="profile-page">
      <UserCenterBackground tone="warm" />
      <div className="profile-header">
        <div className="header-left">
          <h1>
            <UserRound size={24} />
            个人信息
          </h1>
          <span className="header-desc">管理你的个人资料与账号信息</span>
        </div>
        <span className="header-badge">
          <Sparkles size={14} />
          账号安全
        </span>
      </div>

      <div className="profile-content">
        <Card className="profile-card" loading={loading}>
          <div className="profile-card-glow" aria-hidden="true" />
          <div className="profile-avatar-section">
            <div className="avatar-orb">
              <span className="avatar-orb-ring" aria-hidden="true" />
              <Upload
                name="avatar"
                listType="picture-circle"
                showUploadList={false}
                // 头像上传走项目通用上传接口，返回体为 { code, data: { url } }
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
    </div>
  );
};

export default ProfilePage;
