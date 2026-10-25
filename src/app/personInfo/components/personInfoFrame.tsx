"use client";

import { usePathname } from "next/navigation";
import { UserRound, Crown, Gift, Settings, Bell } from "lucide-react";
import { PersonAside } from "./Aside/personAside";
import { PersonHeader } from "./Header/personHeader";

export interface ActInfo {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const MENU_META: Record<string, ActInfo> = {
  info: {
    icon: <UserRound size={20} />,
    title: "个人信息",
    desc: "管理你的账户资料",
  },
  vip: {
    icon: <Crown size={20} />,
    title: "会员中心",
    desc: "查看会员权益",
  },
  invite: {
    icon: <Gift size={20} />,
    title: "邀请记录",
    desc: "查看邀请与奖励",
  },
  messages: {
    icon: <Bell size={20} />,
    title: "消息中心",
    desc: "查看全部站内消息",
  },
  setting: {
    icon: <Settings size={20} />,
    title: "设置",
    desc: "偏好与安全设置",
  },
};

const getActInfo = (pathname: string): ActInfo => {
  const key = Object.keys(MENU_META).find(
    (k) => pathname === `/personInfo${k === "info" ? "" : `/${k}`}`,
  );
  return MENU_META[key ?? "info"];
};

const PersonInfoFrame = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const actInfo = getActInfo(pathname);

  return (
    <>
      <PersonAside />
      <div className="person-info-main">
        <PersonHeader actInfo={actInfo} />
        {children}
      </div>
    </>
  );
};

export default PersonInfoFrame;
