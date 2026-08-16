"use client";
import {
  House,
  Sparkle,
  FolderOpen,
  User,
  LogOut,
  ShoppingCart,
  BookOpen,
  Gift,
  Crown,
  UserRound,
  Bot,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, Popover, Tag, Button } from "antd";
import { useUserStore } from "@/store";
import { DEFAULT_IMAGES } from "@/constants/assets";
import NextImage from "next/image";
import "./aside.scss";

type MenuItem = {
  icon: React.ReactNode;
  title: string;
  href: string;
};

const MenuBtn = () => {
  const router = useRouter();
  const pathname = usePathname();
  const menuList: MenuItem[] = [
    { icon: <House size={20} />, title: "灵感", href: "/" },
    { icon: <Sparkle size={20} />, title: "创作", href: "/creation" },
    { icon: <FolderOpen size={20} />, title: "资产", href: "/mywork" },
    { icon: <Bot size={20} />, title: "AI客服", href: "/chat" },
  ];

  return (
    <div className="menu-wrap">
      {menuList.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <button
            key={item.href}
            className={`menu-item ${isActive ? "menu-item--active" : ""}`}
            onClick={() => router.push(item.href)}
          >
            {item.icon}
            <p className="menu-title">{item.title}</p>
          </button>
        );
      })}
    </div>
  );
};

const PersonPanel = () => {
  const router = useRouter();
  const { isLoggedIn, userInfo, logout } = useUserStore();
  const handleLogin = () => router.push("/login");
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const operationButtons = [
    {
      text: "个人信息",
      icon: <User size={20} />,
      onClick: () => router.push("/profile"),
    },
    {
      text: "会员中心",
      icon: <Crown size={20} />,
      onClick: () => router.push("/vip"),
    },
    {
      text: "我的订单",
      icon: <ShoppingCart size={20} />,
      onClick: () => router.push("/orders"),
    },
    {
      text: "关于我们",
      icon: <BookOpen size={20} />,
      onClick: () => router.push("/about"),
    },
    {
      text: "邀请记录",
      icon: <Gift size={20} />,
      onClick: () => router.push("/invite"),
    },
    { text: "退出登录", icon: <LogOut size={20} />, onClick: handleLogout },
  ];

  const userPanelContent = (
    <div className="user-panel">
      <div className="user-panel-header">
        <div className="user-panel-avatar">
          <Avatar
            size={48}
            src={userInfo?.avatar || DEFAULT_IMAGES.defaultAvatar}
          />
        </div>
        <div className="user-panel-info">
          <div className="user-panel-phone">
            {userInfo?.nickname || "用户"}
            <Tag color="default">未开通</Tag>
          </div>
          <div className="user-panel-vip-text">未开通会员</div>
        </div>
      </div>

      <div className="vip-card">
        <div className="vip-card-left">
          <div className="vip-card-title">开通VIP会员</div>
          <div className="vip-card-desc">开通会员，享更多权益！</div>
        </div>
        <Button
          type="primary"
          className="vip-card-btn"
          onClick={() => router.push("/vip")}
        >
          开通会员
        </Button>
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

  if (!isLoggedIn) {
    return (
      <div className="person-panel">
        <Button
          onClick={handleLogin}
          type="default"
          shape="circle"
          icon={<UserRound />}
        />
      </div>
    );
  }

  return (
    <div className="person-panel">
      <Popover
        content={userPanelContent}
        trigger="click"
        placement="rightBottom"
        className="user-popover"
      >
        <div className="user-avatar-trigger">
          <Avatar
            size={36}
            src={userInfo?.avatar || DEFAULT_IMAGES.defaultAvatar}
          />
        </div>
      </Popover>
    </div>
  );
};

const Aside = () => {
  const router = useRouter();
  return (
    <div className="aside">
      <div className="aside-logo" onClick={() => router.push("/")}>
        <NextImage
          src={DEFAULT_IMAGES.logo}
          alt="巧思-AI智能创作平台"
          width={36}
          height={36}
          loading="eager"
        />
      </div>
      <MenuBtn />
      <PersonPanel />
    </div>
  );
};

export default Aside;
