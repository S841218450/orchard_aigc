"use client";

import { Button, Popover, Avatar, Tag } from "antd";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap,
  User,
  FolderOpen,
  ShoppingCart,
  BookOpen,
  Gift,
  LogOut,
} from "lucide-react";
import { useUserStore } from "@/store";
import "./header.scss";
import NextImage from "next/image";

const MENU_LIST = [
  { key: "/", text: "首页", icon: <Zap size={16} /> },
  { key: "/workbench", text: "工作台", icon: <FolderOpen size={16} /> },
  {
    key: "/materialCreation",
    text: "素材创作",
    icon: <ShoppingCart size={16} />,
  },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, userInfo, logout } = useUserStore();

  const handleLogin = () => router.push("/login");

  const handleLogout = async () => {
    router.push("/login");
    await logout();
  };

  const pointInfo = {
    memberPoint: 0,
    paidPoint: 0,
    giftPoint: 112,
    expireDate: "2026-07-01",
  };

  const operationButtons = [
    { text: "个人信息", icon: <User size={20} />, onClick: () => {} },
    { text: "我的创作", icon: <FolderOpen size={20} />, onClick: () => {} },
    { text: "我的订单", icon: <ShoppingCart size={20} />, onClick: () => {} },
    { text: "教程中心", icon: <BookOpen size={20} />, onClick: () => {} },
    { text: "邀请记录", icon: <Gift size={20} />, onClick: () => {} },
    { text: "退出登录", icon: <LogOut size={20} />, onClick: handleLogout },
  ];

  const userPanelContent = (
    <div className="user-panel">
      <div className="user-panel-header">
        <div className="user-panel-avatar">
          <Avatar size={48} src={userInfo?.avatar || "/avatar.png"} />
        </div>
        <div className="user-panel-info">
          <div className="user-panel-phone">
            {userInfo?.nickname || "用户"}
            <Tag color="default" className="vip-tag">
              未开通
            </Tag>
          </div>
          <div className="user-panel-vip-text">未开通会员</div>
        </div>
      </div>

      <div className="vip-card">
        <div className="vip-card-left">
          <div className="vip-card-title">开通VIP会员</div>
          <div className="vip-card-desc">开通会员，享更多权益！</div>
        </div>
        <Button type="primary" className="vip-card-btn">
          开通会员
        </Button>
      </div>

      <div className="point-card">
        <div className="point-card-title">积分余额</div>
        <div className="point-card-row">
          <div className="point-item">
            <div className="point-label">会员积分</div>
            <div className="point-value">{pointInfo.memberPoint}</div>
          </div>
          <div className="point-item">
            <div className="point-label">付费积分</div>
            <div className="point-value">{pointInfo.paidPoint}</div>
          </div>
          <div className="point-item">
            <div className="point-label">赠送积分</div>
            <div className="point-value highlight">{pointInfo.giftPoint}</div>
            <div className="point-expire">最早过期 {pointInfo.expireDate}</div>
          </div>
        </div>
        <div className="point-card-footer">
          <span className="point-link">积分明细</span>
          <span className="point-divider">|</span>
          <span className="point-link">积分规则</span>
        </div>
      </div>

      <div className="user-operations">
        {operationButtons.map((item, index) => (
          <Button
            key={index}
            type="text"
            className="operation-btn"
            onClick={item.onClick}
          >
            {item.icon}
            <span>{item.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <header className="header">
      <div className="header-left">
        <NextImage
          className="header-logo"
          onClick={() => router.push("/")}
          width={100}
          loading="eager"
          height={50}
          src="/logo_all.jpg"
          alt="巧思-AI智能创作平台"
        />
        <nav className="header-menu">
          {MENU_LIST.map((item) => {
            const isActive =
              pathname === item.key ||
              (item.key !== "/" && pathname.startsWith(item.key));
            return (
              <button
                key={item.key}
                className={`menu-tab ${isActive ? "menu-tab--active" : ""}`}
                onClick={() => router.push(item.key)}
              >
                {item.icon}
                <span>{item.text}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="header-center"></div>

      <div className="header-right">
        {isLoggedIn ? (
          <Popover
            content={userPanelContent}
            trigger="click"
            placement="bottomRight"
            overlayClassName="user-popover"
          >
            <div className="user-avatar-trigger">
              <Avatar size={32} src={userInfo?.avatar || "/avatar.png"} />
            </div>
          </Popover>
        ) : (
          <Button type="primary" onClick={handleLogin}>
            登录
          </Button>
        )}
      </div>
    </header>
  );
}
