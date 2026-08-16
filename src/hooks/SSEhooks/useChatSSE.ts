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

/** 从 SSE 事件中提取回答文本（每个 step 节点都可能携带累积式 data.answer；error/done 由调用方提前分流处理） */
function extractAnswerChunk(chatData: SSEChatData): string {
  const data = chatData.data;
  // 流式分片可能直接为字符串
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  // data.answer 为回答文本，data.messages 为思考过程，二者不可混用
  const value = data.answer;
  return typeof value === "string" ? value : "";
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

/** 从 SSE 事件中提取推理过程文本（data.messages 字段，后端各 step 的思考链） */
function extractThinkingText(chatData: SSEChatData): string {
  const data = chatData.data;
  if (!data || typeof data !== "object") return "";
  const messages = data.messages;
  // 直接为字符串
  if (typeof messages === "string") return messages;
  // 数组形式：字符串数组 或 { role, content } 消息对象数组
  if (Array.isArray(messages)) {
    return messages
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const content = (item as Record<string, unknown>).content;
          return typeof content === "string" ? content : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

interface UseChatSSEOptions {
  /** 更新消息的回调 */
  onUpdateMessage: (id: string, updater: (msg: Message) => Message) => void;
  /** 思考步骤变化回调（由 step_* 事件驱动；结束时所有步骤置为 done，由 UI 折叠展示思考内容） */
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
  /** 已交由打字机输出的累积回答文本（各节点累积式 answer 的增量基准，避免重复输出） */
  const deliveredAnswerRef = useRef("");
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

  /**
   * 按增量追加节点携带的回答文本：
   * 新 answer 是已输出全文的前缀扩展（累积式协议）时只追加增量；
   * 不是前缀扩展（逐节点分片协议）时视为新分片直接追加，均不重复输出
   */
  const appendAnswerDelta = useCallback(
    (messageId: string, answer: string) => {
      if (!answer) return;
      const delivered = deliveredAnswerRef.current;
      const delta = answer.startsWith(delivered)
        ? answer.slice(delivered.length)
        : answer;
      if (!delta) return;
      deliveredAnswerRef.current = delivered + delta;
      // 打字机运行中直接追加到待输出队列，否则启动打字机输出增量
      if (typewriterTimerRef.current) {
        pendingTextRef.current += delta;
      } else {
        startTypewriter(messageId, delta);
      }
    },
    [startTypewriter],
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
      const status = chatData.status ?? chatData.type;
      // 提取该步骤携带的推理过程文本（data.messages）
      const detail = extractThinkingText(chatData);
      const next = [...stepsRef.current];
      // 1) 后端显式提供 seq_id 时按 seqId 定位同一节点；
      //    必须同时满足 type 一致，否则 seqId 复用（如后端恒为 0）会误覆盖其他步骤，
      //    导致推理结束后只剩最后一条步骤
      let idx = -1;
      if (typeof chatData.seq_id === "number") {
        idx = next.findIndex(
          (s) => s.seqId === chatData.seq_id && s.type === chatData.type,
        );
      }
      // 2) 未命中再按 type + detail 合并：同一节点反复推送相同 type + messages
      //    （如每 10 字符一个 step_chat 事件）时更新原步骤并保持其为"当前步骤"，不重复添加
      if (idx < 0 && detail) {
        idx = next.findIndex(
          (s) => s.type === chatData.type && s.detail === detail,
        );
      }
      let stepSeqId: number;
      if (idx >= 0) {
        // 已有步骤：保留原 seqId（排序基准），仅刷新状态与详情
        stepSeqId = next[idx].seqId;
        next[idx] = {
          ...next[idx],
          status,
          detail: detail || next[idx].detail,
          state: "running",
        };
      } else {
        // 新步骤：seqId 取现有最大值 + 1，保证单调递增且不与任何已有步骤冲突
        stepSeqId = next.reduce((m, s) => Math.max(m, s.seqId), 0) + 1;
        next.push({
          seqId: stepSeqId,
          type: chatData.type,
          status,
          detail,
          timestamp: chatData.timestamp ?? Date.now(),
          state: "running",
        });
      }
      // 更早的步骤标记为 done（新步骤的 seqId 恒为最大值；重复推送合并时保持原序号）
      const steps = next
        .map((s) =>
          s.seqId < stepSeqId ? { ...s, state: "done" as const } : s,
        )
        .sort((a, b) => a.seqId - b.seqId);
      stepsRef.current = steps;
      onStepsChange?.(steps);
    },
    [onStepsChange],
  );

  /** 清空思考步骤（新连接开始 / 会话切换时重置思考区） */
  const clearSteps = useCallback(() => {
    if (stepsRef.current.length > 0) {
      stepsRef.current = [];
      onStepsChange?.([]);
    }
  }, [onStepsChange]);

  /** 思考过程结束：所有步骤标记为 done（保留思考区，由 UI 折叠展示） */
  const finishSteps = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    if (stepsRef.current.every((s) => s.state === "done")) return;
    const next = stepsRef.current.map((s) => ({
      ...s,
      state: "done" as const,
    }));
    stepsRef.current = next;
    onStepsChange?.(next);
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
      // 新连接开始：重置思考步骤与回答增量基准
      clearSteps();
      deliveredAnswerRef.current = "";

      const handleFinish = () => {
        // 输出剩余文本，避免 done 前连接关闭导致丢内容
        flushTypewriter(activeMessageIdRef.current);
        activeMessageIdRef.current = null;
        finishResolverRef.current = null;
        // 思考过程结束：保留步骤并置为 done，由 UI 折叠展示
        finishSteps();
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
            // 完成事件：思考过程结束，保留步骤并折叠展示
            if (chatData.type === "done") {
              // 立即输出剩余文本后标记成功
              flushTypewriter(messageId);
              onUpdateMessage(messageId, (msg) =>
                msg.answerStatus === "loading"
                  ? { ...msg, answerStatus: "success" as const }
                  : msg,
              );
              finishSteps();
              return;
            }
            // 思考步骤事件（step_*）：更新思考区，并按增量输出节点携带的累积回答
            if (chatData.type.startsWith("step_")) {
              handleStepEvent(chatData);
              // 每个节点都可能携带累积式 data.answer，只追加增量避免重复渲染
              appendAnswerDelta(messageId, extractAnswerChunk(chatData));
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
      finishSteps,
      flushTypewriter,
      stopTypewriter,
      appendAnswerDelta,
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
    // 暂停后保留已产生的思考过程，置为 done 由 UI 折叠
    finishSteps();
    disconnect();
    finish?.();
  }, [
    disconnect,
    onUpdateMessage,
    finishSteps,
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
