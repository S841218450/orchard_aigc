"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store";
import "./page.scss";

import MaterialList from "@/components/home/materialList/materialList";
import ChatMain from "@/components/chat/chatMain/chatMain";
import ChatInput from "@/components/chat/chatInput/chatInput";

// 模拟作品数据（可替换为真实数据）
const mockWorks = [
  { id: 1, title: "营销海报", color: "#F2995F" },
  { id: 2, title: "商品主图", color: "#D4A574" },
  { id: 3, title: "品牌Logo", color: "#60C4C4" },
  { id: 4, title: "社交媒体", color: "#FFD294" },
  { id: 5, title: "电商详情", color: "#FCD3BC" },
  { id: 6, title: "广告Banner", color: "#E0F4F4" },
  { id: 7, title: "产品包装", color: "#D4A574" },
  { id: 8, title: "活动页面", color: "#F2995F" },
  { id: 9, title: "宣传册", color: "#60C4C4" },
  { id: 10, title: "UI设计", color: "#FFD294" },
  { id: 11, title: "插画设计", color: "#FCD3BC" },
  { id: 12, title: "视频封面", color: "#E0F4F4" },
];

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(input);
  const { setInitialMessage } = useChatStore();

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const handleSend = () => {
    const currentInput = inputRef.current.trim();
    if (!currentInput || isLoading) return;
    setInitialMessage(currentInput);
    setInput("");
    router.push("/workbench");
  };

  return (
    <div className="home-page">
      {/* 环形滚动作品背景 */}
      <div className="ring-showcase" suppressHydrationWarning>
        <div className="ring-track">
          {mockWorks.map((work, index) => {
            const angle = (360 / mockWorks.length) * index;
            const delay = -(60 / mockWorks.length) * index;
            return (
              <div
                key={work.id}
                className={`ring-item ring-item-${index}`}
                suppressHydrationWarning
              >
                <div className="ring-card">
                  <div className="ring-card-inner">
                    <span className="ring-card-icon">
                      {work.title.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chat-container">
        <ChatMain />
        <ChatInput
          sendMessage={handleSend}
          leftOpration={null}
          rightOpration={null}
        />
        <div>
          <p className="input-tip">AI 可能会犯错，请核实重要信息。</p>
        </div>
      </div>

      <div className="data-list">
        <MaterialList />
      </div>
    </div>
  );
}
