import { Bot, User } from "lucide-react";
import { Message } from "@/type/chat";

interface ChatContentProps {
  messageList: Message[];
}

const ChatMessages = ({ messageList }: ChatContentProps) => {
  return (
    <div className="chat-content">
      <div className="message-list">
        {messageList.map((msg: Message) => (
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
export default ChatMessages;
