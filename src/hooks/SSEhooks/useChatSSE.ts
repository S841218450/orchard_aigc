"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSSE } from "@/hooks/SSEhooks/useSSE";
import API from "@/api";
import type { Message, Attachment } from "@/actions/chat";
import type { WorkStep } from "@/actions/types";

/** 打字机效果：每次定时追加的字符数 */
const TYPEWRITER_STEP = 2;
/** 打字机效果：追加间隔 ms */
const TYPEWRITER_INTERVAL = 20;

/** 知识库问答 SSE 事件解析后的结构 */
interface SSEChatData {
  seq_id?: number;
  type: string;
  status?: string;
  data?: Record<string, unknown> | string;
  timestamp?: number;
}

/** 从 SSE 事件中提取回答文本分片 */
function extractAnswerChunk(chatData: SSEChatData): string {
  // 只有最终节点 step_format 携带可流式输出的答案，其余 step_* 均为思考过程
  if (chatData.type !== "step_format") return "";
  const data = chatData.data;
  // data 直接为字符串
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  // 常见文本字段
  for (const key of ["answer", "content", "text", "message", "chunk"]) {
    const value = data[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

/** 从错误事件中提取错误文案 */
function extractErrorMessage(chatData: SSEChatData): string {
  const data = chatData.data;
  if (data && typeof data === "object") {
    for (const key of ["error", "message", "detail"]) {
      const value = data[key];
      if (typeof value === "string" && value) return value;
    }
  }
  return chatData.status || "生成回答失败";
}

interface UseChatSSEOptions {
  /** 更新消息的回调 */
  onUpdateMessage: (id: string, updater: (msg: Message) => Message) => void;
  /** 思考步骤变化回调（由 step_* 事件驱动；done/结束/停止时回传空数组以隐藏思考区） */
  onStepsChange?: (steps: WorkStep[]) => void;
}

/**
 * 知识库问答业务 SSE 长连接 Hook
 *
 * 复用通用 useSSE 的连接生命周期，知识库问答专属的接口 URL、
 * 请求参数组装、SSE 事件解析（回答分片 / 错误 / 完成）均收敛在此。
 */
export function useChatSSE({
  onUpdateMessage,
  onStepsChange,
}: UseChatSSEOptions) {
  const { connect, disconnect } = useSSE();
  /** 当前正在流式输出的消息 id */
  const activeMessageIdRef = useRef<string | null>(null);
  /** 当前连接的完成回调（供暂停时手动 resolve） */
  const finishResolverRef = useRef<(() => void) | null>(null);
  /** 当前思考步骤列表（由 step_* 事件增量更新） */
  const stepsRef = useRef<WorkStep[]>([]);
  /** 打字机：尚未输出的剩余答案文本 */
  const pendingTextRef = useRef("");
  /** 打字机：定时器句柄 */
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  /** 清理打字机定时器与待输出文本（不触发追加） */
  const stopTypewriter = useCallback(() => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    pendingTextRef.current = "";
  }, []);

  /** 立即输出剩余文本并停止定时器（停止/完成时兜底，避免丢内容） */
  const flushTypewriter = useCallback(
    (messageId?: string | null) => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      const rest = pendingTextRef.current;
      pendingTextRef.current = "";
      if (rest && messageId) {
        onUpdateMessage(messageId, (msg) => ({
          ...msg,
          answer: (msg.answer ?? "") + rest,
          answerStatus: "loading" as const,
        }));
      }
    },
    [onUpdateMessage],
  );

  /** 启动打字机：整段答案按固定步长定时追加到消息 */
  const startTypewriter = useCallback(
    (messageId: string, fullText: string) => {
      stopTypewriter();
      pendingTextRef.current = fullText;
      typewriterTimerRef.current = setInterval(() => {
        const chunk = pendingTextRef.current.slice(0, TYPEWRITER_STEP);
        pendingTextRef.current = pendingTextRef.current.slice(TYPEWRITER_STEP);
        onUpdateMessage(messageId, (msg) => ({
          ...msg,
          answer: (msg.answer ?? "") + chunk,
          answerStatus: "loading" as const,
        }));
        if (!pendingTextRef.current) {
          stopTypewriter();
        }
      }, TYPEWRITER_INTERVAL);
    },
    [onUpdateMessage, stopTypewriter],
  );

  // 组件卸载时清理打字机定时器
  useEffect(() => {
    return () => {
      stopTypewriter();
    };
  }, [stopTypewriter]);

  /** 更新步骤列表并通知外层：新步骤置为 running，之前的步骤置为 done */
  const handleStepEvent = useCallback(
    (chatData: SSEChatData) => {
      const seqId = chatData.seq_id ?? stepsRef.current.length + 1;
      const next = [...stepsRef.current];
      const idx = next.findIndex((s) => s.seqId === seqId);
      const status = chatData.status ?? next[idx]?.status ?? chatData.type;
      if (idx >= 0) {
        next[idx] = { ...next[idx], status, state: "running" };
      } else {
        next.push({
          seqId,
          type: chatData.type,
          status,
          detail: "",
          timestamp: chatData.timestamp ?? Date.now(),
          state: "running",
        });
      }
      const steps = next
        .map((s) => (s.seqId < seqId ? { ...s, state: "done" as const } : s))
        .sort((a, b) => a.seqId - b.seqId);
      stepsRef.current = steps;
      onStepsChange?.(steps);
    },
    [onStepsChange],
  );

  /** 清空思考步骤（思考过程结束 / 连接终止时隐藏思考区） */
  const clearSteps = useCallback(() => {
    if (stepsRef.current.length > 0) {
      stepsRef.current = [];
      onStepsChange?.([]);
    }
  }, [onStepsChange]);

  /** 建立知识库问答 SSE 连接 */
  const createConnection = useCallback(
    (
      messageId: string,
      url: string,
      body: Record<string, unknown>,
      onFinish?: () => void,
    ) => {
      activeMessageIdRef.current = messageId;
      finishResolverRef.current = onFinish ?? null;
      // 新连接开始：重置思考步骤
      clearSteps();

      const handleFinish = () => {
        // 输出剩余文本，避免 done 前连接关闭导致丢内容
        flushTypewriter(activeMessageIdRef.current);
        activeMessageIdRef.current = null;
        finishResolverRef.current = null;
        clearSteps();
        onFinish?.();
      };

      connect({
        url,
        body,
        onMessage: (event) => {
          let chunk = "";
          try {
            const chatData: SSEChatData = JSON.parse(event.data);
            // 错误事件
            if (chatData.type === "error" || chatData.type === "step_error") {
              onUpdateMessage(messageId, (msg) => ({
                ...msg,
                answerStatus: "error" as const,
                errorMsg: extractErrorMessage(chatData),
              }));
              return;
            }
            // 完成事件：思考过程结束，隐藏思考区
            if (chatData.type === "done") {
              // 立即输出剩余文本后标记成功
              flushTypewriter(messageId);
              onUpdateMessage(messageId, (msg) =>
                msg.answerStatus === "loading"
                  ? { ...msg, answerStatus: "success" as const }
                  : msg,
              );
              clearSteps();
              return;
            }
            // 思考步骤事件（step_*）：更新步骤状态
            if (chatData.type.startsWith("step_")) {
              handleStepEvent(chatData);
              // 非最终节点不参与文本累积
              if (chatData.type !== "step_format") return;
              // 最终节点：整段答案进入打字机队列逐字输出
              const answer = extractAnswerChunk(chatData);
              if (answer) {
                startTypewriter(messageId, answer);
              }
              return;
            }
            chunk = extractAnswerChunk(chatData);
          } catch {
            // 非 JSON 事件按纯文本分片处理
            chunk = event.data;
          }
          if (!chunk) return;
          // 累积回答分片
          onUpdateMessage(messageId, (msg) => ({
            ...msg,
            answer: (msg.answer ?? "") + chunk,
            answerStatus: "loading" as const,
          }));
        },
        onError: (error) => {
          console.error("SSE 连接错误:", error);
          // 错误时不补输出剩余文本，保留已打字部分
          stopTypewriter();
          onUpdateMessage(messageId, (msg) => ({
            ...msg,
            answerStatus: "error" as const,
            errorMsg: error.message,
          }));
          handleFinish();
        },
        onDone: () => {
          onUpdateMessage(messageId, (msg) =>
            msg.answerStatus === "loading"
              ? { ...msg, answerStatus: "success" as const }
              : msg,
          );
          handleFinish();
        },
      });
    },
    [
      connect,
      onUpdateMessage,
      handleStepEvent,
      clearSteps,
      flushTypewriter,
      startTypewriter,
      stopTypewriter,
    ],
  );

  /** 建立知识库问答 SSE 连接，流式累积回答，流结束后 resolve */
  const createKnowledgeQuery = useCallback(
    (
      messageId: string,
      userId: string,
      query: string,
      chat_history: Message[],
      attachments: Record<string, unknown>,
    ) =>
      new Promise<void>((resolve) => {
        createConnection(
          messageId,
          "/ai-api/v1/knowledge-base/query",
          {
            threadId: messageId,
            userId,
            question: query,
            chat_history,
            ...attachments,
          },
          resolve,
        );
      }),
    [createConnection],
  );

  /** 发送消息：建立 SSE 连接，流式累积回答 */
  const sendChatMessage = useCallback(
    (
      messageId: string,
      userId: string,
      query: string,
      chat_history: Message[],
      attachments: Record<string, unknown>,
    ) =>
      createKnowledgeQuery(messageId, userId, query, chat_history, attachments),
    [createKnowledgeQuery],
  );

  /**
   * 暂停输出：先请求后端中断 LangGraph 运行，再断开 SSE 连接，
   * 保留已生成的部分回答
   */
  const stopChat = useCallback(() => {
    const finish = finishResolverRef.current;
    finishResolverRef.current = null;
    const messageId = activeMessageIdRef.current;
    activeMessageIdRef.current = null;

    if (messageId) {
      // best-effort 通知后端停止 agent，失败仅告警，不影响断开
      API.stopKnowledgeChat({ threadId: messageId }).catch((e: unknown) => {
        console.error("中断知识库问答失败:", e);
      });
      // 立即输出打字机剩余文本，避免暂停后内容缺失
      flushTypewriter(messageId);
      onUpdateMessage(messageId, (msg) =>
        msg.answerStatus === "loading"
          ? { ...msg, answerStatus: "success" as const }
          : msg,
      );
    } else {
      stopTypewriter();
    }
    clearSteps();
    disconnect();
    finish?.();
  }, [
    disconnect,
    onUpdateMessage,
    clearSteps,
    flushTypewriter,
    stopTypewriter,
  ]);

  /** 重新生成回答：清空原回答后重新建立 SSE 连接 */
  const regenerate = useCallback(
    (
      messageId: string,
      userId: string,
      query: string,
      chat_history: Message[],
      attachments: Attachment[],
    ) => {
      onUpdateMessage(messageId, (msg) => ({
        ...msg,
        answer: "",
        answerStatus: "loading" as const,
        errorMsg: null,
      }));
      return createKnowledgeQuery(messageId, userId, query, chat_history, {
        attachments,
      });
    },
    [createKnowledgeQuery, onUpdateMessage],
  );

  return { sendChatMessage, stopChat, regenerate };
}
