"use client";

import { useCallback, useRef } from "react";
import { useSSE } from "@/hooks/SSEhooks/useSSE";
import type {
  OriginImageItem,
  SelectListItem,
  WorkMessage,
  WorkStep,
} from "@/actions/types";

/** SSE 事件解析后的结构 */
interface SSEStepData {
  seq_id: number;
  type: string;
  status: string;
  data: Record<string, unknown>;
  timestamp: number;
}

/** 创作工作流类型：text=文生图，image=图生图 */
type WorkType = "text" | "image";

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

/**
 * 从 step_generate 节点提取结果图列表：
 * 优先取 data.imageList（{ id, url }[]），兼容 data.url（字符串数组 / 老版 fileUrl 数组）
 */
function extractResultImageList(
  stepData: SSEStepData,
): { id: string; url: string }[] {
  const data = stepData.data || {};
  const imageList = data.imageList as
    | Array<{ id?: string; url?: string }>
    | undefined;
  if (Array.isArray(imageList) && imageList.length > 0) {
    return imageList
      .filter((item) => typeof item?.url === "string" && item.url)
      .map((item) => ({ id: item.id ?? "", url: item.url as string }));
  }
  const url = data.url as unknown;
  if (Array.isArray(url) && url.length > 0) {
    return url
      .map((item) => {
        if (typeof item === "string") return { id: "", url: item };
        const fileUrl = (item as { fileUrl?: string })?.fileUrl;
        return fileUrl ? { id: "", url: fileUrl } : null;
      })
      .filter((item): item is { id: string; url: string } => item !== null);
  }
  return [];
}

/**
 * 文生图结果图节点解析：从 step_generate 的 imageList/url 数组中提取全部结果图
 */
function extractTextResultImage(
  stepData: SSEStepData,
  base: WorkMessage,
): WorkMessage {
  const imageList = extractResultImageList(stepData);
  if (imageList.length === 0) return base;
  return {
    ...base,
    resultUrl: imageList[0].url,
    resultImageList: imageList,
  };
}

/**
 * 图生图结果图节点解析：节点结构与文生图不同，
 * 当前暂复用通用解析，待后端图生图节点协议确认后在此按需调整
 */
function extractImageResultImage(
  stepData: SSEStepData,
  base: WorkMessage,
): WorkMessage {
  return extractTextResultImage(stepData, base);
}

interface UseCreationSSEOptions {
  /** 更新消息的回调 */
  onUpdateMessage: (
    id: string,
    updater: (msg: WorkMessage) => WorkMessage,
  ) => void;
}

/**
 * 创作业务 SSE 长连接 Hook（文生图 / 图生图）
 *
 * 复用通用 useSSE 的连接生命周期，创作专属的接口 URL（文生图/图生图分流）、
 * 请求参数组装、SSE 事件解析（步骤流 / 结果图 / 失败 / 补充问题）均收敛在此。
 */
export function useCreationSSE({ onUpdateMessage }: UseCreationSSEOptions) {
  const { connect } = useSSE();
  const sseErrorSetRef = useRef<Set<string>>(new Set());

  /** 从请求体中取参考图列表（无参考图视为文生图） */
  const getOriginImageList = useCallback(
    (data: Record<string, unknown>): OriginImageItem[] => {
      const list = data.originImageList as OriginImageItem[] | undefined;
      return Array.isArray(list) ? list : [];
    },
    [],
  );

  /** 根据是否携带参考图返回对应的生成接口（文生图/图生图） */
  const getGenerateUrl = useCallback(
    (isImageToImage: boolean) =>
      isImageToImage
        ? "/ai-api/v1/image-to-image/generate"
        : "/ai-api/v1/text-to-image/generate",
    [],
  );

  /** 通用步骤基础组装：把上一步标记完成、追加新步骤、组装基础消息 */
  const buildStepBase = useCallback(
    (msg: WorkMessage, stepData: SSEStepData): WorkMessage => {
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

      const steps = shouldAppend ? [...updatedSteps, newStep] : updatedSteps;

      return {
        ...msg,
        status: 1 as const,
        sseStatus: stepData.status,
        steps,
      };
    },
    [],
  );

  /**
   * 工作流事件状态机：结果图节点（step_generate）按各工作流提取函数解析，
   * 其余状态转换（补充问题 / 失败 / 完成）两种工作流共用
   */
  const applyStep = useCallback(
    (
      workId: string,
      stepData: SSEStepData,
      msg: WorkMessage,
      extractResultImage: (
        stepData: SSEStepData,
        base: WorkMessage,
      ) => WorkMessage,
    ): WorkMessage => {
      const base = buildStepBase(msg, stepData);

      switch (stepData.type) {
        case "step_generate":
          return extractResultImage(stepData, base);
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
            return { ...msg, steps: base.steps };
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
    },
    [buildStepBase],
  );

  /** 文生图事件处理：节点按文生图工作流解析 */
  const handleTextToImageStep = useCallback(
    (workId: string, stepData: SSEStepData, msg: WorkMessage): WorkMessage =>
      applyStep(workId, stepData, msg, extractTextResultImage),
    [applyStep],
  );

  /** 图生图事件处理：节点按图生图工作流解析（节点差异收敛在 extractImageResultImage） */
  const handleImageToImageStep = useCallback(
    (workId: string, stepData: SSEStepData, msg: WorkMessage): WorkMessage =>
      applyStep(workId, stepData, msg, extractImageResultImage),
    [applyStep],
  );

  /** 建立 SSE 连接：workType 决定事件按文生图/图生图工作流解析 */
  const createConnection = useCallback(
    (
      workId: string,
      url: string,
      body: Record<string, unknown>,
      workType: WorkType,
    ) => {
      const handleStep =
        workType === "image" ? handleImageToImageStep : handleTextToImageStep;
      connect({
        url,
        body,
        onMessage: (event) => {
          try {
            const stepData: SSEStepData = JSON.parse(event.data);
            onUpdateMessage(workId, (msg) => handleStep(workId, stepData, msg));
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
    [connect, onUpdateMessage, handleTextToImageStep, handleImageToImageStep],
  );

  /** 提交创作：根据是否携带参考图选择文生图/图生图 SSE 接口 */
  const submitCreation = useCallback(
    (workId: string, userId: string, data: Record<string, unknown>) => {
      const originImageList = getOriginImageList(data);
      const isImageToImage = originImageList.length > 0;
      createConnection(
        workId,
        getGenerateUrl(isImageToImage),
        isImageToImage
          ? {
              threadId: workId,
              userId,
              type: "image",
              prompt: data.prompt,
              params: data.params,
              originImageList,
            }
          : {
              threadId: workId,
              userId,
              ...data,
            },
        isImageToImage ? "image" : "text",
      );
    },
    [createConnection, getGenerateUrl, getOriginImageList],
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
        resultImageList: undefined,
        steps: [],
      }));

      const originImageList = getOriginImageList(data);
      const isImageToImage = originImageList.length > 0;
      createConnection(
        workId,
        getGenerateUrl(isImageToImage),
        isImageToImage
          ? {
              threadId: workId,
              userId,
              type: "image",
              prompt: data.prompt,
              params: data.params,
              originImageList,
            }
          : {
              threadId: workId,
              userId,
              ...data,
            },
        isImageToImage ? "image" : "text",
      );
    },
    [createConnection, getGenerateUrl, getOriginImageList, onUpdateMessage],
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

      createConnection(
        workId,
        "/ai-api/v1/text-to-image/select",
        {
          threadId: workId,
          userId,
          user_select: answers,
        },
        "text",
      );
    },
    [createConnection, onUpdateMessage],
  );

  /** 重试（isImageToImage 为 true 时走图生图重试接口） */
  const retry = useCallback(
    (workId: string, userId: string, isImageToImage = false) => {
      onUpdateMessage(workId, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "尝试重试...",
        steps: [],
      }));
      createConnection(
        workId,
        isImageToImage
          ? "/ai-api/v1/image-to-image/retry"
          : "/ai-api/v1/text-to-image/retry",
        {
          threadId: workId,
          userId,
        },
        isImageToImage ? "image" : "text",
      );
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
