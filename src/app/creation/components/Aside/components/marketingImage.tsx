import { useState } from "react";
import { Button, Select } from "antd";
import { Megaphone, Palette, Sparkles } from "lucide-react";
import ChatInput from "@/components/chat/chatInput/chatInput";
import type { MarketingImageFormData } from "@/actions/creationSchemas";

// 营销图
export const MarketingImage = ({
  activeKey,
  generateImage,
}: {
  activeKey: string;
  generateImage: (data: MarketingImageFormData) => void;
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [style, setStyle] = useState("modern");

  const handleSubmit = () => {
    generateImage({ activeKey, title, subtitle, style });
  };

  return (
    <>
      <div className="aside-content">
        <div className="aside-title">
          <Megaphone size={16} />
          <span>主标题</span>
        </div>
        <ChatInput
          value={title}
          onChange={setTitle}
          sendMessage={handleSubmit}
          placeholder="输入营销主标题..."
        />
      </div>
      <div className="aside-content">
        <div className="aside-title">
          <span>副标题</span>
        </div>
        <ChatInput
          value={subtitle}
          onChange={setSubtitle}
          sendMessage={handleSubmit}
          placeholder="输入副标题..."
        />
      </div>
      <div className="aside-content">
        <div className="aside-title">
          <Palette size={16} />
          <span>营销风格</span>
        </div>
        <Select
          value={style}
          size="large"
          onChange={setStyle}
          options={[
            { value: "modern", label: "现代简约" },
            { value: "luxury", label: "高端奢华" },
            { value: "playful", label: "活泼趣味" },
            { value: "professional", label: "商务专业" },
          ]}
        />
      </div>
      <Button
        type="primary"
        size="large"
        block
        onClick={handleSubmit}
        icon={<Sparkles size={16} />}
        className="generate-btn"
      >
        开始生成
      </Button>
    </>
  );
};
