import { z } from "zod";
import API from "@/api";

// ==================== 类型定义 ====================

/** 会话信息 */
export interface Session {
  id: string;
  title: string;
  updateTime: string;
}

/**
 * 消息信息
 * 后端单条消息同时承载问题与回答，不再区分 role；
 * 有问题必有回答，删除问题即删除回答，回答可重新调用接口生成。
 */
export interface Message {
  id: string;
  sessionId: string;
  /** 用户问题 */
  question: string;
  /** AI 回答，未生成时为 null */
  answer: string | null;
  attachments?: Attachment[] | null;
  /** 后端消息状态：0=待生成，1=生成中，2=成功，3=失败 */
  status: number;
  errorMsg?: string | null;
  createTime?: string;
  /** 前端 UI 状态（非后端字段）：回答的待生成/加载/成功/失败 */
  answerStatus?: "pending" | "loading" | "success" | "error";
}

/** 发送消息参数 */
export interface Attachment {
  name: string;
  url: string;
  type: "image" | "file" | "video";
}
export interface SendMessageParams {
  sessionId: string;
  message: string;
  attachments?: Attachment[];
}

// ==================== 验证 Schema ====================

const createSessionSchema = z.object({
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string().min(1, "会话ID不能为空"),
  message: z.string().min(1, "消息内容不能为空"),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1, "文件名不能为空"),
        url: z.string().min(1, "文件URL不能为空"),
        type: z.enum(["image", "file", "video"]),
      }),
    )
    .optional(),
});

const updateSessionSchema = z.object({
  id: z.string().min(1, "会话ID不能为空"),
  title: z.string().min(1, "标题不能为空"),
});

// ==================== Action 结果类型 ====================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==================== 会话管理 Actions ====================

/**
 * 创建新会话
 */
export async function createSession(
  data?: z.infer<typeof createSessionSchema>,
): Promise<ActionResult<Session>> {
  const parsed = createSessionSchema.safeParse(data || {});
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const res = await API.createSession(parsed.data);
    return { success: true, data: res.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "创建会话失败",
    };
  }
}

/**
 * 获取会话列表
 */
export async function getSessionList(): Promise<ActionResult<Session[]>> {
  try {
    const res = await API.getSessionList();
    return { success: true, data: res.data || [] };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "获取会话列表失败",
    };
  }
}

/**
 * 更新会话
 */
export async function updateSession(
  data: z.infer<typeof updateSessionSchema>,
): Promise<ActionResult<void>> {
  const parsed = updateSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await API.updateSession(parsed.data);
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "更新会话失败",
    };
  }
}

/**
 * 删除会话
 */
export async function deleteSession(
  sessionId: string,
): Promise<ActionResult<void>> {
  try {
    await API.deleteSession({ id: sessionId });
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "删除会话失败",
    };
  }
}

// ==================== 消息管理 Actions ====================

/**
 * 获取消息列表
 */
export async function getMessageList(
  sessionId: string,
): Promise<ActionResult<Message[]>> {
  try {
    const res = await API.getMsgList({ sessionId });
    console.log("获取消息列表成功:", res.data || []);
    return { success: true, data: res.data || [] };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "获取消息列表失败",
    };
  }
}

/**
 * 发送消息
 */

export async function sendMessage(
  data: z.infer<typeof sendMessageSchema>,
): Promise<ActionResult<Message>> {
  const parsed = sendMessageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const res = await API.sendMessage(parsed.data);
    return { success: true, data: res.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "发送消息失败",
    };
  }
}

/**
 * 删除消息
 */
export async function deleteMessage(
  messageId: string,
): Promise<ActionResult<void>> {
  try {
    await API.deleteMsg({ messageId: messageId });
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "删除消息失败",
    };
  }
}
