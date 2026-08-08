import API from "@/api";

// ==================== 类型定义 ====================

/** 文件夹树节点 */
export interface FolderTreeVo {
  id: string;
  folderName: string;
  parentId: string | null;
  docCount: number;
  createTime?: string;
  children: FolderTreeVo[];
}

/** 文件详情 */
export interface FileDetailVo {
  id: string;
  fileName: string;
  originalName: string;
  docType: string;
  status: number;
  fileSize: number;
  fileUrl: string;
  folderId: string | null;
  createTime?: string;
}

/** 创建文件夹参数 */
export interface CreateFolderParams {
  folderName: string;
  parentId?: string | null;
}

/** 服务端分页结果（对应后端 { list, size, current, total }） */
export interface PageResult<T> {
  list: T[];
  current: number;
  size: number;
  total?: number;
}

/** 文件列表分页查询参数 */
export interface FileListParams {
  current: number;
  size: number;
}

// ==================== 结果类型 ====================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==================== 上传文件 ====================

export async function uploadFile(
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<ActionResult<FileDetailVo>> {
  try {
    const res = await API.uploadKnowledge(formData); // 上传至知识库
    return { success: true, data: res?.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "上传文件失败",
    };
  }
}

// ==================== 文件夹操作 ====================

/** 创建文件夹 */
export async function createFileFolder(
  data: CreateFolderParams,
): Promise<ActionResult<FolderTreeVo>> {
  try {
    const res = await API.createKnowledgeFolder(data);
    return { success: true, data: res.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "创建文件夹失败",
    };
  }
}

/** 获取文件夹树 */
export async function getFileListTree(): Promise<ActionResult<FolderTreeVo[]>> {
  try {
    const res = await API.getKnowledgeFolderTree();
    return { success: true, data: res.data || [] };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "获取文件夹树失败",
    };
  }
}

/** 获取文件夹下文件列表（服务端分页） */
export async function getFileFolderFiles(
  folderId: string | null,
  params: FileListParams = { current: 1, size: 20 },
): Promise<ActionResult<PageResult<FileDetailVo>>> {
  try {
    const res = await API.getKnowledgeList(
      folderId ? { folderId, ...params } : undefined,
    );
    const raw = res?.data;
    // 兼容：后端可能直接返回数组（旧逻辑）或 { list, size, current, total }
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.list)
        ? raw.list
        : [];
    return {
      success: true,
      data: {
        list,
        current: raw?.current ?? params.current,
        size: raw?.size ?? params.size,
        total: raw?.total,
      },
    };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "获取文件列表失败",
    };
  }
}

/** 删除文件夹 */
export async function deleteFileFolder(
  folderId: string,
): Promise<ActionResult<void>> {
  try {
    await API.deleteKnowledgeFolder({ id: folderId });
    return { success: true, data: undefined };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "删除文件夹失败",
    };
  }
}

/** 删除文件 */
export async function deleteFile(fileId: string): Promise<ActionResult<void>> {
  try {
    await API.deleteKnowledge({ id: fileId });
    return { success: true, data: undefined };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "删除文件失败",
    };
  }
}

// ==================== 文件重试 & 详情（用于上传失败后重试+状态轮询） ====================

/** 重试上传知识库文档（入参文件id，Agent端异步处理，通常无返回业务数据） */
export async function retryKnowledgeUpload(params: {
  id: string;
}): Promise<ActionResult<void>> {
  try {
    await API.retryKnowledgeUpload(params);
    return { success: true, data: undefined };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "重试上传失败",
    };
  }
}

/** 获取单个知识库文档详情（用于重试后轮询状态变化） */
export async function getKnowledgeDetail(params: {
  id: string;
}): Promise<ActionResult<FileDetailVo>> {
  try {
    const res = await API.getKnowledgeDetail(params);
    return { success: true, data: res?.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || e?.message || "获取文档详情失败",
    };
  }
}
