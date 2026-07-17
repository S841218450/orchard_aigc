"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Input, Select } from "antd";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store";
import "./page.scss";

import MaterialList from "@/components/home/materialList/materialList";
import ChatMain from "@/components/chat/chatMain/page";
import ChatInput from "@/components/chat/chatInput/chatInput";

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
