import API from "@/api";
import type { WorkMessage } from "./types";
import {
  createWorkSchema,
  textToImageSchema,
  type CreateWorkInput,
  type SubmitTextToImageInput,
} from "./creationSchemas";

// ==================== Action 结果类型 ====================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==================== Actions ====================

/**
 * 获取历史作品列表
 */
export async function getWorkList(
  pageNum: number = 1,
  pageSize: number = 10,
): Promise<ActionResult<WorkMessage[]>> {
  try {
    const res = await API.getWorkList({ pageNum, pageSize });
    return { success: true, data: res.data?.list || [] };
  } catch (e) {
    return {
      success: false,
      error: "获取历史记录失败",
    };
  }
}

/**
 * 创建新作品
 */
export async function createWork(
  data: CreateWorkInput,
): Promise<ActionResult<WorkMessage>> {
  const parsed = createWorkSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const res = await API.createWork(parsed.data);
    return { success: true, data: res.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "创建作品失败",
    };
  }
}

/**
 * 删除作品
 */
export async function deleteWork(workId: string): Promise<ActionResult<void>> {
  try {
    await API.deleteWork(workId);
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "删除作品失败",
    };
  }
}

/**
 * 文生图提交
 */
export async function submitTextToImage(
  data: SubmitTextToImageInput,
): Promise<ActionResult<WorkMessage>> {
  const parsed = textToImageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const res = await API.createWork({
      type: "image",
      ...parsed.data,
    });
    return { success: true, data: res.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "提交失败",
    };
  }
}
