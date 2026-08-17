"use client";

import { Bubble, type BubbleItemType } from "@ant-design/x";
import { Button, Popconfirm } from "antd";
import { Bot, User, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/actions/chat";
import type { WorkStep } from "@/actions/types";
import "./chatContent.scss";
import messageManager from "@/utils/messageManager";

/** 用户问题气泡内容（携带消息 id 供操作按钮使用） */
interface UserBubbleContent {
  id: string;
  question: string;
}

/** 思考过程折叠块：统一封装于 thinkBlock/thinkBlock，供聊天与创作步骤流复用 */
export { ThinkBlock } from "./thinkBlock/thinkBlock";
import ThinkBlock from "./thinkBlock/thinkBlock";

/**
 * AI 回答气泡内容（memo 化）：
 * 流式输出期间打字机每 ~20ms 追加一次文本，若整列表参与渲染会导致历史气泡全部重渲染。
 * 这里将本条消息的回答文本/状态以原始值传入，React.memo 浅比较保证
 * 只有「回答正在增长的那一条」气泡重渲染，其余气泡直接跳过。
 */
const AiBubbleContent = memo(function AiBubbleContent({
  text,
  isError,
  isUpdating,
  thinkingText,
  thinkingStreaming,
  runningStepStatus,
  isLast,
  markdownComponents,
}: {
  text: string;
  isError: boolean;
  isUpdating: boolean;
  thinkingText: string;
  thinkingStreaming: boolean;
  runningStepStatus?: string;
  isLast: boolean;
  markdownComponents: Components;
}) {
  // 思考过程仅在最新 AI 气泡上展示（流式期间展开，完成后折叠）
  const showThinking = isLast && Boolean(thinkingText || thinkingStreaming);

  if (isError) {
    return <div className="message-content error">{text}</div>;
  }

  return (
    <div className="ai-bubble-body">
      {showThinking && (
        <ThinkBlock
          text={thinkingText}
          done={!thinkingStreaming}
          title={
            thinkingStreaming ? runningStepStatus || "正在思考..." : "思考完成"
          }
          components={markdownComponents}
        />
      )}
      {text ? (
        // 流式输出中：纯文本渲染（保留换行），避免对整段不断增长的文本反复做 markdown 解析；
        // 输出完成后一次性切回 ReactMarkdown 渲染
        isUpdating ? (
          <div className="markdown-body streaming-text">{text}</div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {text}
            </ReactMarkdown>
          </div>
        )
      ) : thinkingStreaming ? (
        <span className="typing-dots">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <div className="message-content empty">暂无回答</div>
      )}
    </div>
  );
});
AiBubbleContent.displayName = "AiBubbleContent";

interface ChatContentProps {
  messageList: Message[];
  /** 是否有回答正在流式生成 */
  streaming?: boolean;
  /** 重新生成回答 */
  onRegenerate?: (message: Message) => void;
  /** 删除消息（问题与回答一并删除） */
  onDelete?: (messageId: string) => void;
  /** 当前 agent 思考步骤（step_* 事件驱动，结束时折叠展示思考内容） */
  steps?: WorkStep[];
}

const ChatContent = ({
  messageList,
  streaming,
  onRegenerate,
  onDelete,
  steps,
}: ChatContentProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (id: string, content: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      messageManager.success("已复制到剪贴板");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      messageManager.error("复制失败");
    }
  }, []);

  // Markdown 渲染配置：链接新窗口打开并禁止携带 opener
  const markdownComponents = useMemo<Components>(
    () => ({
      a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    }),
    [],
  );

  // 最后一条消息（思考过程仅展示在最新 AI 气泡上）
  const lastMsg = messageList[messageList.length - 1];

  // 思考过程：各 SSE 步骤 data.messages 拼接而成的推理文本
  const thinkingText = useMemo(
    () =>
      (steps ?? [])
        .map((s) => s.detail)
        .filter(Boolean)
        .join("\n\n"),
    [steps],
  );
  // 是否仍有步骤执行中（流式期间展开实时显示，完成后自动折叠）
  const thinkingStreaming = useMemo(
    () => (steps ?? []).some((s) => s.state === "running"),
    [steps],
  );
  // 流式期间当前步骤的实时状态（如"正在检索知识库"）作为折叠标题
  const runningStepStatus = useMemo(
    () => (steps ?? []).find((s) => s.state === "running")?.status,
    [steps],
  );

  // AI 气泡内容渲染：按消息 id 定位，交给 memo 化的 AiBubbleContent，
  // 流式更新时只有 answer 在增长的那条消息会重渲染
  const renderAiContent = useCallback((content: unknown) => {
      const msgId = String(content ?? "");
      const msg = messageList.find((m) => m.id === msgId);
      if (!msg) return null;
      const isError = msg.answerStatus === "error";
      return (
        <AiBubbleContent
          text={isError ? msg.errorMsg || "生成回答失败" : msg.answer || ""}
          isError={isError}
          isUpdating={msg.answerStatus === "loading"}
          thinkingText={thinkingText}
          thinkingStreaming={thinkingStreaming}
          runningStepStatus={runningStepStatus}
          isLast={Boolean(lastMsg && msg.id === lastMsg.id)}
          markdownComponents={markdownComponents}
        />
      );
    },
    [
      messageList,
      thinkingText,
      thinkingStreaming,
      runningStepStatus,
      lastMsg,
      markdownComponents,
    ],
  );

  // 操作按钮：复制 / 重新生成 / 删除（Bubble footer 插槽，info.key 定位消息）
  const renderActions = useCallback(
    (_content: unknown, info: { key?: string | number; status?: string }) => {
      const rawKey = String(info.key ?? "");
      const msg = messageList.find(
        (m) => m.id === rawKey.replace(/-(q|a)$/, ""),
      );
      if (!msg) return null;
      const isAnswer = rawKey.endsWith("-a");
      const copyContent = isAnswer ? (msg.answer ?? "") : msg.question;
      return (
        <div className="message-actions">
          <Button
            type="text"
            size="small"
            className="copy-btn"
            title="复制"
            aria-label="复制内容"
            onClick={() => handleCopy(rawKey, copyContent)}
          >
            {copiedId === rawKey ? <Check size={14} /> : <Copy size={14} />}
          </Button>
          {isAnswer && onRegenerate && (
            <Button
              type="text"
              size="small"
              className="action-btn"
              title="重新生成"
              aria-label="重新生成回答"
              disabled={!!streaming}
              onClick={() => onRegenerate(msg)}
            >
              <RefreshCw size={14} />
              重新生成
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title="删除消息"
              description="删除后问题与回答将一并移除，是否继续？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => onDelete(msg.id)}
            >
              <Button
                type="text"
                size="small"
                className="action-btn danger"
                title="删除"
                aria-label="删除消息"
              >
                <Trash2 size={14} />
                删除
              </Button>
            </Popconfirm>
          )}
        </div>
      );
    },
    [messageList, copiedId, streaming, onRegenerate, onDelete, handleCopy],
  );

  // 后端消息模型为"问题+回答"同一实体，此处拆分为 user/ai 两条气泡
  const bubbleItems = useMemo<BubbleItemType[]>(() => {
    const items: BubbleItemType[] = [];
    messageList.forEach((msg) => {
      const isError = msg.answerStatus === "error";
      items.push({
        key: `${msg.id}-q`,
        role: "user",
        content: { id: msg.id, question: msg.question } as UserBubbleContent,
      });
      items.push({
        key: `${msg.id}-a`,
        role: "ai",
        // content 固定为消息 id（稳定字符串）：渲染逻辑由 renderAiContent 按 id 定位，
        // 流式更新时 content 引用不变，配合 AiBubbleContent memo 跳过未变化的气泡
        content: msg.id,
        status: isError
          ? "error"
          : msg.answerStatus === "loading"
            ? "updating"
            : "success",
        // answer 为空且 loading 时展示打字动画；SSE 打字机已逐字渲染，无需开启 Bubble typing。
        // 思考流式进行中（thinkingStreaming）即使 answer 为空也不进 loading，
        // 否则 Bubble.List 只渲染打字点、contentRender 不执行，思考区无法展示
        loading:
          msg.answerStatus === "loading" && !msg.answer && !thinkingStreaming,
      });
    });
    return items;
  }, [messageList, thinkingStreaming]);

  // Bubble 角色配置：useMemo 缓存保持引用稳定，避免 ChatContent 重渲染时
  // Bubble.List 认为 role 变化而全量重建气泡
  const bubbleRoles = useMemo(
    () => ({
      user: {
        placement: "end" as const,
        variant: "filled" as const,
        avatar: (
          <div className="message-avatar user-avatar">
            <User size={18} />
          </div>
        ),
        contentRender: (content: unknown) => {
          const { question } = content as UserBubbleContent;
          return <div className="message-content">{question}</div>;
        },
        footer: renderActions,
      },
      ai: {
        placement: "start" as const,
        variant: "filled" as const,
        avatar: (
          <div className="message-avatar ai-avatar">
            <Bot size={18} />
          </div>
        ),
        loadingRender: () => (
          <span className="typing-dots">
            <span />
            <span />
            <span />
          </span>
        ),
        contentRender: renderAiContent,
        footer: renderActions,
      },
    }),
    [renderAiContent, renderActions],
  );

  return (
    <div className="chat-content">
      <Bubble.List items={bubbleItems} role={bubbleRoles} />
    </div>
  );
};

export default ChatContent;
