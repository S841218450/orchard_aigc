"use client";

import {
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Brain,
  LoaderCircle,
} from "lucide-react";
import { Message } from "@/actions/chat";
import type { WorkStep } from "@/actions/types";
import { useState } from "react";
import { Popconfirm, Button } from "antd";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import "./chatContent.scss";
import messageManager from "@/utils/messageManager";

/** 思考步骤类型 → 中文标签 */
const STEP_LABEL_MAP: Record<string, string> = {
  step_intent: "意图识别",
  step_query_understanding: "查询理解",
  step_bm25: "关键词检索",
  step_vector: "向量检索",
  step_merge: "结果合并",
  step_rerank: "重排序",
  step_context: "上下文构建",
  step_generate: "生成答案",
  step_confidence: "置信度评估",
  step_format: "整理结果",
};

interface ChatContentProps {
  messageList: Message[];
  /** 是否有回答正在流式生成 */
  streaming?: boolean;
  /** 重新生成回答 */
  onRegenerate?: (message: Message) => void;
  /** 删除消息（问题与回答一并删除） */
  onDelete?: (messageId: string) => void;
  /** 当前 agent 思考步骤（step_* 事件驱动，完成后清空隐藏） */
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

  const handleCopy = async (id: string, content: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      messageManager.success("已复制到剪贴板");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      messageManager.error("复制失败");
    }
  };

  // Markdown 渲染配置：链接新窗口打开并禁止携带 opener
  const markdownComponents: Components = {
    a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  };

  // AI 回答内容支持 markdown 渲染（GFM：表格/删除线/任务列表）
  const renderMarkdown = (content: string) => (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  // 渲染回答内容：错误/加载中/空回答/正常回答
  const renderAnswer = (msg: Message) => {
    if (msg.answerStatus === "error") {
      return msg.errorMsg || "生成回答失败";
    }
    if (msg.answerStatus === "loading") {
      return msg.answer ? (
        renderMarkdown(msg.answer)
      ) : (
        <span className="typing-dots">
          <span />
          <span />
          <span />
        </span>
      );
    }
    return msg.answer ? renderMarkdown(msg.answer) : "暂无回答";
  };

  return (
    <div className="chat-content">
      <div className="message-list">
        {messageList?.map((msg, index) => {
          const isLastMessage = index === messageList.length - 1;
          return (
            <div key={msg.id} className="message-group">
              {/* 用户问题：右侧 */}
              <div className="message-item user">
                <div className="message-avatar">
                  <User size={18} />
                </div>
                <div className="message-body">
                  <div
                    className="message-content"
                    onClick={() =>
                      handleCopy(`${msg.id}-question`, msg.question)
                    }
                  >
                    {msg.question}
                  </div>
                  <div className="message-actions">
                    <Button
                      type="text"
                      size="small"
                      className="copy-btn"
                      onClick={() =>
                        handleCopy(`${msg.id}-question`, msg.question)
                      }
                      title="复制"
                    >
                      {copiedId === `${msg.id}-question` ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                    {onDelete && (
                      <Popconfirm
                        title="删除消息"
                        description="确认删除吗？删除整条消息包括AI回答部分"
                        onConfirm={() => onDelete(msg.id)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button
                          type="link"
                          size="small"
                          className="action-btn danger"
                          title="删除"
                        >
                          <Trash2 size={14} />
                          删除
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              </div>

              {/* AI 回答：左侧 */}
              <div className="message-item assistant">
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
                <div className="message-body">
                  {/* 最后一条消息：展示 agent 思考过程（step_* 事件驱动，done 后清空隐藏） */}
                  {isLastMessage && steps && steps.length > 0 && (
                    <div className="thinking-process">
                      <div className="thinking-header">
                        <Brain size={14} />
                        <span>思考过程</span>
                      </div>
                      <div className="thinking-steps">
                        {steps.map((step) => (
                          <div
                            key={step.seqId}
                            className={`thinking-step ${step.state}`}
                          >
                            <span className="step-icon">
                              {step.state === "running" ? (
                                <LoaderCircle size={12} className="step-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                            </span>
                            <span className="step-label">
                              {STEP_LABEL_MAP[step.type] ?? step.type}
                            </span>
                            <span className="step-status">{step.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    className={`message-content ${msg.answerStatus === "error" ? "error" : ""}`}
                  >
                    {renderAnswer(msg)}
                  </div>
                  <div className="message-actions">
                    <Button
                      type="text"
                      size="small"
                      className="copy-btn"
                      onClick={() =>
                        msg.answer && handleCopy(`${msg.id}-answer`, msg.answer)
                      }
                      title="复制"
                    >
                      {copiedId === `${msg.id}-answer` ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                    {onRegenerate && (
                      <Button
                        type="text"
                        size="small"
                        className="action-btn"
                        onClick={() => onRegenerate(msg)}
                        disabled={streaming}
                        title="重新生成"
                      >
                        <RefreshCw size={14} />
                        重新生成
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatContent;
