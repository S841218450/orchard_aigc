import { useState } from "react";
import { Wand2, Sparkles, ImageIcon, Megaphone } from "lucide-react";
import "./aside.scss";
import { createWork } from "@/actions/creation";
import type {
  CreateWorkInput,
  GenerateWorkData,
} from "@/actions/creationSchemas";
import type { WorkMessage } from "@/actions/types";
import messageManager from "@/utils/messageManager";
import { TextToImage } from "@/app/creation/components/Aside/components/textToImage";
import { ImageToImage } from "@/app/creation/components/Aside/components/imageToImage";
import { MarketingImage } from "@/app/creation/components/Aside/components/marketingImage";

const menuItems = [
  { key: "textToImage", label: "文生图", icon: Sparkles },
  { key: "imageToImage", label: "图生图", icon: ImageIcon },
  { key: "marketingImage", label: "营销图", icon: Megaphone },
];

export const Aside = ({
  onMenuChange,
  setChatMessage,
}: {
  onMenuChange?: (menu: string) => void;
  setChatMessage: (data: WorkMessage) => void;
}) => {
  const [menu, setMenu] = useState("textToImage");

  // 切换菜单
  const handleMenuChange = (key: string) => {
    setMenu(key);
    onMenuChange?.(key);
  };

  // 提交创作描述
  const generateImage = async (data: GenerateWorkData) => {
    try {
      // 图生图/营销图表单数据尚未与 createWorkSchema 完全对齐，先收敛为 schema 入参类型
      const result = await createWork(data as unknown as CreateWorkInput);
      if (result.success) {
        //保存消息到历史记录中
        setChatMessage(result.data);
      } else {
        messageManager.error(result.error ?? "生成失败");
      }
    } catch (error) {
      messageManager.error("生成失败");
      console.error("createWork失败:", error);
    }
  };

  const getPage = () => {
    switch (menu) {
      case "textToImage":
        return <TextToImage activeKey={menu} generateImage={generateImage} />;
      case "imageToImage":
        return <ImageToImage activeKey={menu} generateImage={generateImage} />;
      case "marketingImage":
        return (
          <MarketingImage activeKey={menu} generateImage={generateImage} />
        );
      default:
        return <TextToImage activeKey={menu} generateImage={generateImage} />;
    }
  };

  return (
    <div className="creation-aside">
      <div className="aside-header">
        <Wand2 size={20} />
        <span>创作助手</span>
      </div>
      <div className="aside-toolbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`toolbar-item ${menu === item.key ? "active" : ""}`}
              onClick={() => handleMenuChange(item.key)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="aside-body">{getPage()}</div>
    </div>
  );
};

export default Aside;
