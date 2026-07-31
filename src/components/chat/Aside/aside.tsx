"use client";

import { Button, Input, Spin, App } from "antd";
import {
  SquarePen,
  Search,
  MessageSquare,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import "./aside.scss";
import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/store";
import API from "@/api";
import { useUserStore } from "@/store/user";
interface SessionItem {
  id: string;
  title: string;
  updateTime: string;
}

export default function Aside({
  changeSessionId,
}: {
  changeSessionId: (id: string) => void;
}) {
  const { message } = App.useApp();
  const { activeView, setActiveView, currentSessionId, setCurrentSession } =
    useChatStore();
  const [collapsed, setCollapsed] = useState(false);
  const [sessionList, setSessionList] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  //获取会话列表
  useEffect(() => {
    const fetchSessionList = async () => {
      setLoading(true);
      try {
        const res = await API.getSessionList();
        if (res.success) {
          setSessionList(res.data || []);
        }
      } catch (e) {
        console.error("获取会话列表失败:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionList();
  }, [currentSessionId]);

  //新建一个会话
  const createNewSession = () => {
    setActiveView("chat");
    setCurrentSession(null);
    changeSessionId("");
  };

  //查看我的项目
  const handleSelectMyProject = () => {
    setActiveView("myproject");
  };

  //删除一个会话
  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string,
  ) => {
    e.stopPropagation();
    try {
      const res = await API.deleteSession({ id: sessionId });
      if (res.success) {
        setSessionList((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSession(null);
        }
      }
    } catch {
      message.error("删除失败");
    }
  };

  //选择一个会话
  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId);
    changeSessionId(sessionId);
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
            <div
              className={`nav-item ${activeView === "myproject" ? "active" : ""}`}
              onClick={handleSelectMyProject}
            >
              <FolderOpen size={18} />
              <span>我的项目</span>
            </div>
            <div
              className={`nav-item ${activeView === "chat" ? "active" : ""}`}
              onClick={() => setActiveView("chat")}
            >
              <MessageSquare size={18} />
              <span>对话</span>
            </div>
          </div>

          {/* 会话列表 */}
          {activeView === "chat" && (
            <div className="session-list">
              {loading ? (
                <div className="session-loading">
                  <Spin size="small" />
                </div>
              ) : sessionList.length === 0 ? (
                <div className="session-empty">暂无对话</div>
              ) : (
                sessionList.map((session) => (
                  <div
                    key={session.id}
                    className={`session-item ${currentSessionId === session.id ? "active" : ""}`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="session-title">
                      {session.title || "新对话"}
                    </div>
                    <Button
                      type="text"
                      size="small"
                      className="session-delete"
                      icon={<Trash2 size={14} />}
                      onClick={(e) => handleDeleteSession(e, session.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
