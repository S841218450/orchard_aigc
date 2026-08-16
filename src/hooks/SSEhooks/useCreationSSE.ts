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

/**
 * 文生图 / 图生图统一节点映射（后端 NODE_MAP 的前端版本）
 * 事件 type 已是映射后的类型（如 step_generate），name 为中文步骤名，
 * 供前端展示与错误提示，绝不透出原始节点名
 */
const STEP_NAME_MAP: Record<string, string> = {
  step_input_check: "输入检查",
  step_decision: "方案决策",
  step_supplementary: "补充描述",
  step_interrupt: "补充描述",
  step_prompt_optimize: "提示词优化",
  step_generate: "图片生成",
  step_retry: "重试",
};

/** 从 SSE 事件中提取步骤详情文案：优先取 data.messages，退化回 status */
function extractStepDetail(stepData: SSEStepData): string {
  const data = stepData.data;
  if (data && typeof data.messages === "string" && data.messages) {
    return data.messages;
  }
  return stepData.status;
}

/**
 * 从 step_generate 节点提取结果图列表：优先 data.imageList（{id,url}[]），
 * 兼容 NODE_MAP 中的 image_list 写法
 */
function extractResultImageList(
  stepData: SSEStepData,
): { id: string; url: string }[] {
  const data = stepData.data || {};
  const imageList = (data.imageList ?? data.image_list) as
    | Array<{ id?: string; url?: string }>
    | undefined;
  if (!Array.isArray(imageList)) return [];
  return imageList
    .filter((item) => typeof item?.url === "string" && item.url)
    .map((item) => ({ id: item.id ?? "", url: item.url as string }));
}

/**
 * 判定 step_generate 是否执行失败：
 * 失败节点会显式返回空 imageList（[]），或详情文案包含失败关键字
 */
function isGenerateFailed(stepData: SSEStepData): boolean {
  if (stepData.type !== "step_generate") return false;
  const data = stepData.data || {};
  const imageList = (data.imageList ?? data.image_list) as unknown;
  if (Array.isArray(imageList) && imageList.length === 0) return true;
  const msg = typeof data.messages === "string" ? data.messages : "";
  return /执行失败|未成功/.test(msg);
}

/** 结果图节点解析：从 step_generate 提取结果图，写入 resultUrl / resultImageList */
function applyGenerateResult(
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

/** 计算步骤状态：失败节点 / 错误事件为 error，完成事件为 done，其余为 running */
function getStepState(stepData: SSEStepData): WorkStep["state"] {
  if (stepData.type === "done") return "done";
  if (
    stepData.type === "error" ||
    stepData.type === "step_error" ||
    stepData.type === "step_retry" ||
    isGenerateFailed(stepData)
  ) {
    return "error";
  }
  return "running";
}

interface UseCreationSSEOptions {
  /** 更新消息的回调 */
  onUpdateMessage: (
    id: string,
    updater: (msg: WorkMessage) => WorkMessage,
  ) => void;
}

/**
 * 创作业务 SSE 长连接 Hook（文生图 / 图生图统一节点解析）
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

  /**
   * 通用步骤组装：
   * - 追加新步骤时把上一步置为 done；
   * - done / error 类事件不追加新步骤，终态直接落在最后一步上；
   * - 步骤 name 取 NODE_MAP 中文名，detail 取 data.messages
   */
  const buildStepBase = useCallback(
    (msg: WorkMessage, stepData: SSEStepData): WorkMessage => {
      const prevSteps = msg.steps || [];
      // 上一步置为完成（仅当仍是 running）
      const updatedSteps: WorkStep[] = prevSteps.map((s, idx) =>
        idx === prevSteps.length - 1 && s.state === "running"
          ? { ...s, state: "done" as const }
          : s,
      );

      // done / error 类事件：不追加新步骤，终态直接落在最后一步上
      if (
        stepData.type === "done" ||
        stepData.type === "error" ||
        stepData.type === "step_error"
      ) {
        const steps =
          stepData.type === "done"
            ? updatedSteps
            : updatedSteps.map((s, idx) =>
                idx === updatedSteps.length - 1
                  ? { ...s, state: "error" as const }
                  : s,
              );
        return {
          ...msg,
          status: 1 as const,
          sseStatus: stepData.status,
          steps,
        };
      }

      const newStep: WorkStep = {
        seqId: stepData.seq_id,
        type: stepData.type,
        name: STEP_NAME_MAP[stepData.type],
        status: stepData.status,
        detail: extractStepDetail(stepData),
        timestamp: stepData.timestamp,
        state: getStepState(stepData),
      };

      const shouldAppend =
        stepData.type.startsWith("step_") ||
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
   * 工作流事件状态机（文生图 / 图生图共用同一 NODE_MAP）：
   * 结果图 / 失败 / 补充问题 / 完成 均在此收敛
   */
  const applyStep = useCallback(
    (workId: string, stepData: SSEStepData, msg: WorkMessage): WorkMessage => {
      const base = buildStepBase(msg, stepData);

      switch (stepData.type) {
        case "step_generate":
          // 生成失败：整条消息置为失败（等待重试）
          if (isGenerateFailed(stepData)) {
            sseErrorSetRef.current.add(workId);
            return {
              ...base,
              status: 3 as const,
              sseStepType: "error",
            };
          }
          return applyGenerateResult(stepData, base);

        case "step_supplementary": {
          // 补充描述选项列表：暂存，供 step_interrupt 待操作态使用
          const data = stepData.data as Record<string, unknown> | undefined;
          const selectList =
            (data?.selectList as SelectListItem[] | undefined) ?? [];
          return {
            ...base,
            operationData:
              selectList.length > 0 ? { selectList } : base.operationData,
          };
        }

        case "step_interrupt":
        case "human_in_the_loop": {
          // 兼容旧协议 interrupt.question_list
          const data = stepData.data as Record<string, unknown> | undefined;
          const interrupt = data?.interrupt as
            | { question_list?: SelectListItem[] }
            | undefined;
          const selectList =
            base.operationData?.selectList ?? interrupt?.question_list ?? [];
          return {
            ...base,
            status: 4 as const,
            sseStepType: "human_in_the_loop",
            operationData: { selectList },
          };
        }

        case "step_retry": {
          // 步骤执行失败，等待手动重试
          sseErrorSetRef.current.add(workId);
          return {
            ...base,
            status: 3 as const,
            sseStepType: "retry",
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

  /** 统一事件处理：文生图 / 图生图共用同一套节点解析 */
  const handleStep = useCallback(
    (workId: string, stepData: SSEStepData, msg: WorkMessage): WorkMessage =>
      applyStep(workId, stepData, msg),
    [applyStep],
  );

  /** 建立 SSE 连接：文生图 / 图生图事件解析统一走 handleStep */
  const createConnection = useCallback(
    (workId: string, url: string, body: Record<string, unknown>) => {
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
    [connect, onUpdateMessage, handleStep],
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

      createConnection(workId, "/ai-api/v1/text-to-image/select", {
        threadId: workId,
        userId,
        user_select: answers,
      });
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
