"use client";

import "./chat.scss";
import ChatAside from "@/components/chat/Aside/aside";
import ChatContent from "@/components/chat/chatContent/chatContent";
import ChatInput from "@/components/chat/chatInput/chatInput";
import ChatMain from "@/components/chat/chatMain/chatMain";
import KnowledgeCom from "./components/knowledgeCom/knowledgeCom";
import { useState, useEffect, useRef, useCallback } from "react";
import Loading from "@/components/core/loadding/loading";
import { App } from "antd";
import {
  getMessageList,
  Message,
  createSession,
  sendMessage,
  deleteMessage,
  getSessionList,
  deleteSession,
  Session,
} from "@/actions/chat";
import { useRequest } from "ahooks";
import { useChatStore, useUserStore } from "@/store";
import { useChatSSE } from "@/hooks/SSEhooks/useChatSSE";
import messageManager from "@/utils/messageManager";
import type { FileItem } from "@/components/chat/chatInput/chatInput";
import type { WorkStep } from "@/actions/types";

export const ChatPage = () => {
  const { activeView, currentSessionId, setCurrentSession } = useChatStore();
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  /** 当前 agent 思考步骤（SSE step_* 事件驱动，完成后清空隐藏） */
  const [steps, setSteps] = useState<WorkStep[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useUserStore((state) => state.userInfo)?.userId;

  // 更新指定消息的状态
  const updateMessage = useCallback(
    (id: string, updater: (msg: Message) => Message) => {
      setMessageList((prev) =>
        prev.map((msg) => (msg.id === id ? updater(msg) : msg)),
      );
    },
    [],
  );

  // 知识库问答 SSE hook（业务封装）
  const { sendChatMessage, stopChat, regenerate } = useChatSSE({
    onUpdateMessage: updateMessage,
    onStepsChange: setSteps,
  });

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 获取消息列表
  const { loading: messageLoading } = useRequest(
    async () => {
      if (!currentSessionId) {
        setMessageList([]);
        return [] as Message[];
      }
      setMessageList([]);
      const result = await getMessageList(currentSessionId);
      if (result.success) {
        const list = (result.data || []).map((msg) => ({
          ...msg,
          answerStatus: (msg.answer
            ? "success"
            : "pending") as Message["answerStatus"],
        }));
        setMessageList(list);
        return list;
      }
      messageManager.error(result.msg ?? "获取消息列表失败");
      return [] as Message[];
    },
    {
      manual: false, // 挂载自动执行一次
      refreshDeps: [currentSessionId],
      onError: (e) => console.error("获取消息列表失败:", e),
    },
  );
  // 消息列表变化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  /**
   * 流式生成回答：通过 SSE 长连接流式累积回答分片到指定消息，
   * 分片更新/错误/完成状态均由 useChatSSE 内部回调驱动
   */
  const getHistortList = () => {
    //获取最后10条消息（排除最后一条）
    const length = messageList.length;
    const history =
      (length > 11
        ? messageList.slice(length - 11, length - 1)
        : messageList.slice(0, length - 1)) || [];

    return history;
  };
  const streamAnswer = async (messageId: string, question: string) => {
    await sendChatMessage(messageId, userId!, question, getHistortList(), {});
  };

  /**
   * 发送消息：后端返回的单条消息同时承载问题与回答，
   * 这里先追加消息（answer 为空），再通过流式接口填充回答
   */
  const handleSendMessage = async (content: string, files?: FileItem[]) => {
    if (!content.trim()) {
      messageManager.warning("请输入消息内容");
      return;
    }
    // 没有会话，先创建会话，创建成功后自动切换
    let sessionId = currentSessionId;
    if (!sessionId) {
      const res = await createSession({
        title: content.slice(0, 10) || "默认会话",
      });
      if (res.success) {
        sessionId = res.data.id;
        setCurrentSession(sessionId);
        // 新会话同步进侧边栏列表
        refreshSessionList();
      } else {
        messageManager.error(res.error ?? "创建会话失败");
        return;
      }
    }
    // 发送消息
    const messageData = await sendMessage({
      sessionId,
      message: content,
      attachments:
        files?.map((file) => ({
          name: file.name,
          url: file.file.url,
          type: file.type,
        })) || [],
    });
    // 追加单条消息（问题 + 待生成的回答）
    const newMessage: Message = {
      ...messageData.data,
      answerStatus: "loading",
    };
    setMessageList((prev) => [...prev, newMessage]);
    // 新消息开始：清空上一条的思考过程
    setSteps([]);
    setStreaming(true);

    //请求到agent端执行
    await streamAnswer(newMessage.id, content);
    setStreaming(false);
  };

  // 重新生成回答
  const handleRegenerate = async (message: Message) => {
    if (!currentSessionId || streaming) return;
    setStreaming(true);
    // 重新生成：清空旧思考过程
    setSteps([]);
    await regenerate(
      message.id,
      userId!,
      message.question,
      getHistortList(),
      message.attachments || [],
    );
    setStreaming(false);
  };

  /**
   * 删除消息：问题与回答属于同一实体，删除即同时移除
   * （二次确认由组件内 Popconfirm 负责）
   */
  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteMessage(messageId);
    if (result.success) {
      setMessageList((prev) => prev.filter((msg) => msg.id !== messageId));
      messageManager.success("删除成功");
    } else {
      messageManager.error(result.error ?? "删除失败");
    }
  };

  // 选择模板
  const handleSelectTemplate = (template: {
    id: string;
    title: string;
    content: string;
  }) => {
    // 可以在这里处理模板选择逻辑
    console.log("选择模板:", template);
  };
  //======================会话相关======================
  const [sessionList, setSessionList] = useState<Session[]>([]);
  const { modal } = App.useApp();
  // 获取会话列表
  const { loading, run: refreshSessionList } = useRequest(
    async () => {
      const result = await getSessionList();
      if (!result.success) {
        messageManager.error(result.error ?? "获取会话列表失败");
        return [];
      }
      return result.data || [];
    },
    {
      manual: false, // 挂载自动执行一次
      onSuccess: (data) => setSessionList(data),
      onError: (e) => console.error("获取会话列表失败:", e),
    },
  );
  // 删除会话：二次确认 + 删除当前会话时同步清空选中（消息列表随 refreshDeps 自动清空）
  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      modal.confirm({
        title: "删除会话",
        content: "确定要删除该会话吗？此操作不可恢复。",
        okText: "删除",
        okButtonProps: { danger: true },
        cancelText: "取消",
        onOk: async () => {
          const res = await deleteSession(sessionId);
          if (res.success) {
            if (currentSessionId === sessionId) setCurrentSession(null);
            refreshSessionList();
            messageManager.success("删除成功");
          } else {
            messageManager.error(res.error ?? "删除失败");
          }
        },
      });
    },
    [currentSessionId, modal, refreshSessionList, setCurrentSession],
  );
  return (
    <div className="chat-page">
      <div className="chat-aside">
        <ChatAside
          sessionList={sessionList}
          onDelete={handleDeleteSession}
          loading={loading}
        />
      </div>
      <div className="chat-content-wrapper">
        <div className="chat-main-content">
          {activeView === "knowledge" ? (
            <KnowledgeCom />
          ) : currentSessionId ? (
            <>
              {messageLoading ? (
                <Loading />
              ) : (
                <ChatContent
                  messageList={messageList}
                  streaming={streaming}
                  steps={steps}
                  onRegenerate={handleRegenerate}
                  onDelete={handleDeleteMessage}
                />
              )}
            </>
          ) : (
            <ChatMain
              chatType="default"
              onSelectTemplate={handleSelectTemplate}
            />
          )}
          {activeView !== "knowledge" && <div ref={messagesEndRef} />}
        </div>
        {activeView !== "knowledge" && (
          <div className="chat-input-container">
            <ChatInput
              isStreaming={streaming}
              stopChat={stopChat}
              sendMessage={handleSendMessage}
              placeholder={"你想问我什么问题呢？"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
