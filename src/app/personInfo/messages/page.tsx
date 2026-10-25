"use client";

import "./messages.scss";
import { useState } from "react";
import { Button, Tabs, Spin, Empty } from "antd";
import { Bell, CheckCheck } from "lucide-react";
import { useRequest } from "ahooks";
import {
  getMessages,
  markMessageRead,
  markAllMessagesRead,
} from "@/actions/userCenter";
import type { MessageItem } from "@/actions/userCenter";
import { formatDate } from "@/utils/timeUtils";
import messageManager from "@/utils/messageManager";

type TabKey = "all" | "unread";

const MessagesPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const { data: res, loading, refresh } = useRequest(
    () => getMessages({ onlyUnread: activeTab === "unread" }),
    { refreshDeps: [activeTab] }
  );

  const messages: MessageItem[] = res && res.success ? res.data || [] : [];

  const handleItemClick = async (msg: MessageItem) => {
    if (msg.isRead) return;
    const result = await markMessageRead(msg.id);
    if (result.success) {
      refresh();
    } else {
      messageManager.error(result.error || "标记已读失败");
    }
  };

  const handleReadAll = async () => {
    const result = await markAllMessagesRead();
    if (result.success) {
      messageManager.success("已全部标记为已读");
      refresh();
    } else {
      messageManager.error(result.error || "操作失败");
    }
  };

  return (
    <div className="messages-page">
      <div className="messages-content">
        <div className="messages-toolbar">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            className="messages-tabs"
            items={[
              { key: "all", label: "全部" },
              { key: "unread", label: "未读" },
            ]}
          />
          <Button icon={<CheckCheck size={16} />} onClick={handleReadAll}>
            全部已读
          </Button>
        </div>

        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
          </div>
        ) : messages.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <div className="msg-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`msg-card ${msg.isRead ? "is-read" : "is-unread"}`}
                onClick={() => handleItemClick(msg)}
              >
                <span className="msg-icon">
                  <Bell size={18} />
                </span>
                <div className="msg-body">
                  <div className="msg-title">{msg.title}</div>
                  <div className="msg-content">{msg.content}</div>
                </div>
                <span className="msg-time">
                  {formatDate(msg.createTime, "Auto")}
                </span>
                {!msg.isRead && <span className="msg-unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
