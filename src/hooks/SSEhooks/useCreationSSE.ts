"use client";

import { useCallback, useRef } from "react";
import { useSSE } from "@/hooks/SSEhooks/useSSE";
import type { SelectListItem, WorkMessage, WorkStep } from "@/actions/types";

/** SSE 事件解析后的结构 */
interface SSEStepData {
  seq_id: number;
  type: string;
  status: string;
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * 从 SSE 事件中提取步骤详情文案
 */
function extractStepDetail(stepData: SSEStepData): string {
  const data = stepData.data;
  if (!data) return stepData.status;

  // 优先取 messages 字段
  if (typeof data.messages === "string" && data.messages) {
    return data.messages;
  }
  // step_generate 有 url 数组时
  if (stepData.type === "step_generate" && data.url) {
    const arr = data.url as unknown[];
    return Array.isArray(arr) && arr.length > 0
      ? `生成 ${arr.length} 张图片完成`
      : stepData.status;
  }
  // done 事件
  if (stepData.type === "done") {
    return "所有步骤执行完毕";
  }
  return stepData.status;
}

interface UseCreationSSEOptions {
  /** 更新消息的回调 */
  onUpdateMessage: (
    id: string,
    updater: (msg: WorkMessage) => WorkMessage,
  ) => void;
}

/**
 * 文生图业务 SSE 长连接 Hook
 *
 * 复用通用 useSSE 的连接生命周期，文生图专属的接口 URL、
 * 请求参数组装、SSE 事件解析（步骤流 / 结果图 / 失败 / 补充问题）均收敛在此。
 */
export function useCreationSSE({ onUpdateMessage }: UseCreationSSEOptions) {
  const { connect } = useSSE();
  const sseErrorSetRef = useRef<Set<string>>(new Set());

  /** 建立文生图 SSE 连接 */
  const createConnection = useCallback(
    (workId: string, url: string, body: Record<string, unknown>) => {
      connect({
        url,
        body,
        onMessage: (event) => {
          try {
            const stepData: SSEStepData = JSON.parse(event.data);
            onUpdateMessage(workId, (msg) => {
              const prevSteps = msg.steps || [];
              // 把上一步标记为完成
              const updatedSteps: WorkStep[] = prevSteps.map((s, idx) =>
                idx === prevSteps.length - 1 && s.state === "running"
                  ? { ...s, state: "done" as const }
                  : s,
              );

              // 从 stepData 里提取步骤详情文案
              const stepDetail = extractStepDetail(stepData);

              // 判断当前步骤状态
              let stepState: WorkStep["state"] = "running";
              if (stepData.type === "step_error" || stepData.type === "error") {
                stepState = "error";
              } else if (stepData.type === "done") {
                stepState = "done";
              }

              const newStep: WorkStep = {
                seqId: stepData.seq_id,
                type: stepData.type,
                status: stepData.status,
                detail: stepDetail,
                timestamp: stepData.timestamp,
                state: stepState,
              };

              // 只有带有效信息的 step 才追加（跳过 heartbeat、纯 done 等没有实质内容的）
              const shouldAppend =
                stepData.type.startsWith("step_") ||
                stepData.type === "done" ||
                stepData.type === "error" ||
                stepData.type === "human_in_the_loop";

              const steps = shouldAppend
                ? [...updatedSteps, newStep]
                : updatedSteps;

              const base = {
                ...msg,
                status: 1 as const,
                sseStatus: stepData.status,
                steps,
              };

              switch (stepData.type) {
                case "step_generate": {
                  const urlData = stepData.data?.url as
                    | Array<{ fileUrl: string }>
                    | undefined;
                  const url = urlData?.[0]?.fileUrl;
                  return url ? { ...base, resultUrl: url } : base;
                }
                case "human_in_the_loop": {
                  const questionList =
                    (
                      stepData.data as unknown as {
                        interrupt?: { question_list?: SelectListItem[] };
                      }
                    )?.interrupt?.question_list || [];
                  return {
                    ...base,
                    status: 4 as const,
                    sseStepType: "human_in_the_loop",
                    operationData: { selectList: questionList },
                  };
                }
                case "step_error":
                case "error": {
                  sseErrorSetRef.current.add(workId);
                  return {
                    ...base,
                    status: 3 as const,
                    sseStepType: "error",
                  };
                }
                case "done": {
                  if (
                    sseErrorSetRef.current.has(workId) ||
                    msg.status === 3 ||
                    msg.status === 4
                  ) {
                    sseErrorSetRef.current.delete(workId);
                    return { ...msg, steps };
                  }
                  sseErrorSetRef.current.delete(workId);
                  return {
                    ...base,
                    status: 2 as const,
                    sseStatus: "生成完成",
                    sseStepType: undefined,
                    selectList: undefined,
                  };
                }
                default:
                  return base;
              }
            });
          } catch (e) {
            console.error("解析 SSE 事件失败:", e);
          }
        },
        onError: (error) => {
          console.error("SSE 连接错误:", error);
          onUpdateMessage(workId, (msg) => ({
            ...msg,
            status: 3,
            sseStatus: "生成失败",
          }));
        },
        onDone: () => {
          onUpdateMessage(workId, (msg) => {
            if (msg.status === 1) {
              return { ...msg, status: 2, sseStatus: "生成完成" };
            }
            return msg;
          });
        },
      });
    },
    [connect, onUpdateMessage],
  );

  /** 提交创作：建立 SSE 连接 */
  const submitCreation = useCallback(
    (workId: string, userId: string, data: Record<string, unknown>) => {
      createConnection(workId, "/ai-api/v1/text-to-image/generate", {
        threadId: workId,
        userId,
        ...data,
      });
    },
    [createConnection],
  );

  /** 重新生成 */
  const regenerate = useCallback(
    (workId: string, userId: string, data: Record<string, unknown>) => {
      onUpdateMessage(workId, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "重新生成中...",
        sseStepType: undefined,
        selectList: undefined,
        humanInTheLoop: undefined,
        resultUrl: null,
        steps: [],
      }));

      createConnection(workId, "/ai-api/v1/text-to-image/generate", {
        threadId: workId,
        userId,
        ...data,
      });
    },
    [createConnection, onUpdateMessage],
  );

  /** 提交补充问题选择 */
  const submitSelect = useCallback(
    (
      workId: string,
      userId: string,
      answers: Array<{ question: string; options: string }>,
    ) => {
      onUpdateMessage(workId, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "正在根据补充信息生成...",
        sseStepType: undefined,
        selectList: undefined,
        steps: [],
      }));

      createConnection(workId, "/ai-api/v1/text-to-image/select", {
        threadId: workId,
        userId,
        user_select: answers,
      });
    },
    [createConnection, onUpdateMessage],
  );

  /** 重试 */
  const retry = useCallback(
    (workId: string, userId: string) => {
      onUpdateMessage(workId, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "尝试重试...",
        steps: [],
      }));
      createConnection(workId, "/ai-api/v1/text-to-image/retry", {
        threadId: workId,
        userId,
      });
    },
    [createConnection, onUpdateMessage],
  );

  return {
    submitCreation,
    regenerate,
    submitSelect,
    retry,
  };
}
