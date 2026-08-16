"use client";

import { Button, Spin } from "antd";
import {
  SquarePen,
  MessageSquare,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import "./aside.scss";
import { useState } from "react";
import { Session } from "@/actions/chat";
import { useChatStore } from "@/store";

export default function ChatAside({
  onDelete,
  sessionList,
  loading,
}: {
  onDelete: (e: React.MouseEvent, sessionId: string) => void;
  sessionList: Session[];
  loading: boolean;
}) {
  const { activeView, setActiveView, currentSessionId, setCurrentSession } =
    useChatStore();
  const [collapsed, setCollapsed] = useState(false);

  // 新建一个会话
  const createNewSession = () => {
    setActiveView("chat");
    setCurrentSession(null);
  };

  // 进入知识库
  const handleSelectKnowledge = () => {
    setActiveView("knowledge");
    setCurrentSession(null);
  };

  // 选择一个会话
  const handleSelectSession = (sessionId: string) => {
    setActiveView("chat");
    setCurrentSession(sessionId);
  };

  return (
    <div
      className={`chat-aside ${!collapsed ? "collapsed" : "close-collapsed"}`}
    >
      <div className="aside-header">
        {!collapsed && (
          <Button
            type="primary"
            block
            onClick={createNewSession}
            icon={<SquarePen size={16} />}
          >
            新建对话
          </Button>
        )}
        <Button
          type="text"
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          icon={
            collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )
          }
        />
      </div>

      {!collapsed && (
        <>
          {/* 导航菜单 */}
          <div className="aside-nav">
            {/* <div
              className={`nav-item ${activeView === "myproject" ? "active" : ""}`}
              onClick={handleSelectMyProject}
            >
              <FolderOpen size={18} />
              <span>我的项目</span>
            </div> */}

            <div
              className={`nav-item ${activeView === "knowledge" ? "active" : ""}`}
              onClick={handleSelectKnowledge}
            >
              <MessageSquare size={18} />
              <span>知识库</span>
            </div>
          </div>

          {/* 会话列表 */}
          <div className="session-list">
            <div className="fs-12 mt20">历史记录</div>
            {loading ? (
              <div className="session-loading">
                <Spin size="small" />
              </div>
            ) : sessionList.length === 0 ? (
              <div className="session-empty">暂无对话</div>
            ) : (
              sessionList.map((session, index) => (
                <div
                  key={session.id}
                  className={`session-item ${currentSessionId === session.id ? "active" : ""}`}
                  onClick={() => handleSelectSession(session.id)}
                  style={{ ["--i" as any]: index }}
                >
                  <div className="session-title">
                    {session.title || "新对话"}
                  </div>
                  <Button
                    type="text"
                    size="small"
                    className="session-delete"
                    icon={<Trash2 size={14} />}
                    onClick={(e) => onDelete(e, session.id)}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
