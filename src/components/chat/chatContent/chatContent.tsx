import { Bot, User } from "lucide-react";
import { Message } from "@/type/chat";
import API from "@/api";
import { useState, useEffect } from "react";
import { App } from "antd";
interface ChatContentProps {
  messages: Message[];
}

const ChatContent = ({ messageList }: { messageList: Message[] }) => {
  const { message } = App.useApp();
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success("已复制到剪贴板");
  };

  return (
    <div className="chat-content">
      <div className="message-list">
        {messageList?.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === "ai" ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`message-content ${msg.status}`}>{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ChatContent;
