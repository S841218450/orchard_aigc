import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/user";
import { Crown, UserRound, Gift, Settings, Sparkles, Bell } from "lucide-react";
import { Avatar, Tag } from "antd";
import { DEFAULT_IMAGES } from "@/constants/assets";
interface MenuItemType {
  icon: React.ReactNode;
  text: string;
  key: string;
  path: string;
  disabled?: boolean;
}
export const PersonAside = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userInfo = useUserStore((s) => s.userInfo);
  const menuItems: MenuItemType[] = [
    {
      icon: <UserRound size={20} />,
      text: "个人信息",
      key: "info",
      path: "/personInfo",
    },
    {
      icon: <Crown size={20} />,
      text: "会员中心",
      key: "vip",
      path: "/personInfo/vip",
    },
    {
      icon: <Gift size={20} />,
      text: "邀请记录",
      key: "invite",
      path: "/personInfo/invite",
    },
    {
      icon: <Bell size={20} />,
      text: "消息中心",
      key: "messages",
      path: "/personInfo/messages",
    },
    {
      icon: <Settings size={20} />,
      text: "设置",
      key: "setting",
      path: "",
      disabled: true,
    },
  ];
  const activeKey =
    menuItems.find((item) => item.path && pathname === item.path)?.key ??
    "info";

  const handleSelect = (item: MenuItemType) => {
    if (item.disabled || !item.path) return;
    router.push(item.path);
  };
  return (
    <aside className="person-aside">
      <div className="aside-user">
        <div className="aside-user-orb">
          <span className="aside-user-ring" aria-hidden="true" />
          <Avatar
            size={60}
            src={userInfo?.avatar || DEFAULT_IMAGES.defaultAvatar}
          />
        </div>
        <div className="aside-user-name">
          {userInfo?.nickname || "未设置昵称"}
        </div>
        <Tag variant="filled" className="aside-user-tag">
          <Sparkles size={12} />
          个人中心
        </Tag>
      </div>

      <nav className="aside-nav">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`aside-nav-item ${activeKey === item.key ? "is-active" : ""} ${item.disabled ? "is-disabled" : ""}`}
            onClick={() => handleSelect(item)}
          >
            <span className="aside-nav-icon">{item.icon}</span>
            <span className="aside-nav-text">{item.text}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};
