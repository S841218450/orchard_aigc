// ==================== 类型定义 ====================

/** 补充问题选项 */
export interface SelectListItem {
  question: string;
  select_type: string;
  options: string[];
}

/** 用户选择的答案 */
export interface SelectAnswer {
  question: string;
  options: string;
}

/** 参考图项（图生图输入） */
export interface OriginImageItem {
  id: number;
  url: string;
}

/** SSE 执行步骤（前端根据 SSE 事件补充） */
export interface WorkStep {
  seqId: number;
  type: string;
  /** 中文步骤名（后端 NODE_MAP 的 name，供展示与错误提示，不暴露原始节点名） */
  name?: string;
  status: string;
  detail: string;
  timestamp: number;
  state: "running" | "done" | "error";
}

/** 后端 work 消息结构 */
export interface WorkMessage {
  id: string;
  type: string;
  prompt: string;
  model: string;
  dataList: { id: string; url: string }[];
  params: {
    style: string;
    imageProportion: string;
    imageQuality: string;
    imageCount: string;
  };
  resultUrl: string | null;
  /** SSE 生成的多张结果图列表（前端补充，step_generate 返回 imageList/url 数组） */
  resultImageList?: { id: string; url: string }[];
  operationData: {
    selectList: SelectListItem[];
  } | null;
  /** 参考图列表（图生图输入，前端补充透传） */
  originImageList?: OriginImageItem[];
  status: WorkStatus;
  createTime: number;
  sseStatus?: string;
  sseStepType?: string;
  /** SSE 执行步骤（前端补充） */
  steps?: WorkStep[];
  /** 待补充问题列表（前端补充，human_in_the_loop） */
  selectList?: SelectListItem[];
  /** human_in_the_loop 标志（前端补充） */
  humanInTheLoop?: boolean;
}

/** 作品状态：0-待处理 1-处理中 2-已完成 3-失败 */
export type WorkStatus = 0 | 1 | 2 | 3 | 4;

export const WORK_STATUS_MAP: Record<
  WorkStatus,
  { label: string; color: string }
> = {
  0: { label: "等待中", color: "#8c8c8c" },
  1: { label: "生成中", color: "#1677ff" },
  2: { label: "已完成", color: "#52c41a" },
  3: { label: "失败", color: "#ff4d4f" },
  4: { label: "待操作", color: "#ff9900" },
};
