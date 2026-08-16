"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  File,
  RefreshCw,
} from "lucide-react";
import { App, Empty, Table, Tag, Button } from "antd";
import type { TableColumnsType } from "antd";
import type { FileDetailVo } from "@/actions/file";
import {
  deleteFile,
  retryKnowledgeUpload,
  getKnowledgeDetail,
} from "@/actions/file";
import { EXT_COLOR_CACHE, formatFileSize } from "@/utils/fileUtils";
import { formatDate } from "@/utils/timeUtils";
import messageManager from "@/utils/messageManager";

// ==================== Props 定义 ====================
export interface FileTableProps {
  fileList: FileDetailVo[];
  loading: boolean;
  onRefresh: () => void;
  /** 局部更新单条文件：用于重试后轮询状态，避免整表重拉闪烁 */
  onUpdateFile?: (id: string, patch: Partial<FileDetailVo>) => void;
  /** 服务端分页信息 */
  pagination?: { current: number; pageSize: number; total: number };
  /** 分页变化回调 */
  onPageChange?: (page: number, pageSize: number) => void;
}

// ==================== 文件类型图标 ====================
const renderFileIcon = (fileType: string) => {
  const ext = fileType?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) {
    return <ImageIcon size={18} />;
  }
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return <Film size={18} />;
  }
  if (["mp3", "wav", "flac", "aac"].includes(ext)) {
    return <Music size={18} />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <Archive size={18} />;
  }
  if (
    ["doc", "docx", "pdf", "txt", "md", "xls", "xlsx", "ppt", "pptx"].includes(
      ext,
    )
  ) {
    return <FileText size={18} />;
  }
  return <File size={18} />;
};

// ==================== 文件类型Tag ====================
const renderFileTypeTag = (fileType: string) => {
  const ext = fileType?.toLowerCase() || "";
  const color = ext ? EXT_COLOR_CACHE[ext] : undefined;
  return (
    <Tag color={color || "default"} variant="filled">
      {ext ? fileType.toUpperCase() : "—"}
    </Tag>
  );
};

// ==================== 文件状态Tag（语义化颜色） ====================
type FileStatus = 0 | 1 | 2 | 3;

const STATUS_META: Record<FileStatus, { label: string; color: string }> = {
  0: { label: "待处理", color: "default" },
  1: { label: "上传中", color: "processing" },
  2: { label: "生效中", color: "success" },
  3: { label: "上传失败", color: "error" },
};

// 终态：2=生效中，3=上传失败；到达终态才停止轮询（待处理 0 不视为终态）
const isFinalStatus = (s: number) => s === 2 || s === 3;

const renderFileStatusTag = (status: number) => {
  const s = (status as FileStatus) ?? 0;
  const meta = STATUS_META[s] ?? STATUS_META[0];
  return (
    <Tag color={meta.color} variant="filled">
      {meta.label}
    </Tag>
  );
};

// 轮询配置：自适应退避
// 处理快的文件（十几秒）用短间隔高频探测；处理慢的文件（几分钟）间隔自动翻倍，避免对接口无效轰炸
const POLL_INITIAL_INTERVAL_MS = 5000; // 起始间隔 5s
const POLL_MAX_INTERVAL_MS = 20000; // 间隔上限 20s，达到后保持 20s 轮询
const POLL_MAX_DURATION_MS = 10 * 60 * 1000; // 总轮询时长上限 10 分钟，兜底保护

// ==================== 组件 ====================
const FileTable: React.FC<FileTableProps> = ({
  fileList,
  loading,
  onRefresh,
  onUpdateFile,
  pagination,
  onPageChange,
}) => {
  const { modal } = App.useApp();

  // ---------- 轮询哨兵 & 定时器 ----------
  // pollingIdRef：当前正在轮询的文件id，用于"任务切换/组件卸载"时丢弃旧请求结果
  const pollingIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 本次轮询起始时间（用于总时长兜底） */
  const startTimeRef = useRef(0);
  /** 当前轮询间隔（每轮翻倍，封顶 POLL_MAX_INTERVAL_MS） */
  const intervalRef = useRef(POLL_INITIAL_INTERVAL_MS);

  const clearPollTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    pollingIdRef.current = null;
    clearPollTimer();
  }, [clearPollTimer]);

  // 卸载时清理：避免切页后定时器仍跑造成内存泄漏
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ---------- 启动对单个文件的轮询（自适应退避） ----------
  const startPollStatus = useCallback(
    (fileId: string) => {
      // 若已有轮询在跑，先清掉（保证同组件内只轮询一个文件）
      clearPollTimer();
      pollingIdRef.current = fileId;
      startTimeRef.current = Date.now();
      intervalRef.current = POLL_INITIAL_INTERVAL_MS;

      const tick = async () => {
        const currentId = pollingIdRef.current;
        // 哨兵：切换了重试目标/已停止 → 丢弃
        if (currentId !== fileId) return;

        // 总时长兜底：超过上限仍未到终态，停止并提示
        if (Date.now() - startTimeRef.current > POLL_MAX_DURATION_MS) {
          stopPolling();
          messageManager.warning("文档状态轮询超时，请稍后手动刷新列表");
          return;
        }

        const res = await getKnowledgeDetail({ id: fileId });
        // 哨兵二次校验：请求期间可能已停止/切了目标
        if (pollingIdRef.current !== fileId) return;

        if (!res.success) {
          // 单条详情失败不做重拉，等下一轮
          return;
        }
        const detail = res.data;
        if (!detail) return;

        // 1) 先局部更新 UI（哪怕还在处理中，也让用户看到状态变化）
        onUpdateFile?.(fileId, {
          status: detail.status,
          fileName: detail.fileName,
          docType: detail.docType,
          fileSize: detail.fileSize,
          fileUrl: detail.fileUrl,
        });

        // 2) 到达终态（生效/失败）：停轮询 + 消息提示
        if (isFinalStatus(detail.status)) {
          stopPolling();
          if (detail.status === 2) {
            messageManager.success("文档上传处理完成，已生效");
          } else if (detail.status === 3) {
            messageManager.error("文档处理失败，可再次点击重新上传");
          }
          return;
        }

        // 3) 未到终态：间隔翻倍后继续下一轮（封顶），慢文件不再高频打接口
        intervalRef.current = Math.min(
          intervalRef.current * 2,
          POLL_MAX_INTERVAL_MS,
        );
        scheduleNext();
      };

      // 下一轮在 intervalRef 间隔后执行（首轮为起始间隔，不立即发起）
      const scheduleNext = () => {
        timerRef.current = setTimeout(tick, intervalRef.current);
      };

      scheduleNext();
    },
    [clearPollTimer, stopPolling, onUpdateFile],
  );

  // ---------- 自动轮询：列表出现非终态文件（上传/重试后）自动启动 ----------
  // 仅在无轮询任务时触发；当前文件到终态后自动接力下一个非终态文件，串行处理
  useEffect(() => {
    if (pollingIdRef.current) return;
    const target = fileList.find((f) => !isFinalStatus(f.status));
    if (target) startPollStatus(target.id);
  }, [fileList, startPollStatus]);

  // ---------- 删除文件 ----------
  const handleDeleteFile = useCallback(
    async (id: string, name: string) => {
      modal.confirm({
        title: "删除文件",
        content: `确定要删除文件「${name}」吗？此操作不可恢复。`,
        okText: "删除",
        okButtonProps: { danger: true },
        cancelText: "取消",
        onOk: async () => {
          const res = await deleteFile(id);
          if (res.success) {
            // 若删除的是正在轮询的文件，停止轮询
            if (pollingIdRef.current === id) stopPolling();
            messageManager.success("删除成功");
            onRefresh();
          } else {
            messageManager.error(res.error);
          }
        },
      });
    },
    [modal, onRefresh, stopPolling],
  );

  // ---------- 重新上传（失败状态下可用） ----------
  const handleRetryUpload = useCallback(
    async (record: FileDetailVo) => {
      onUpdateFile?.(record.id, { status: 1 });

      // 2) 调重试接口（Agent 异步处理，通常无返回业务数据）
      const res = await retryKnowledgeUpload({ id: record.id });
      if (!res.success) {
        // 失败回滚状态 + 报错
        onUpdateFile?.(record.id, { status: 3 });
        messageManager.error(res.error);
        return;
      }
      messageManager.info("已提交重试任务，正在处理中…");

      // 3) 启动单条详情轮询，模拟"实时状态更新"
      startPollStatus(record.id);
    },
    [onUpdateFile, startPollStatus],
  );

  // ---------- 列定义 ----------
  const columns = useMemo<TableColumnsType<FileDetailVo>>(
    () => [
      {
        title: "文件名",
        dataIndex: "fileName",
        key: "fileName",
        ellipsis: true,
        render: (_, record) => (
          <div className="file-name-wrap">
            <span className="file-icon">{renderFileIcon(record.docType)}</span>
            <span className="file-name" title={record.fileName}>
              {record.fileName}
            </span>
          </div>
        ),
      },
      {
        title: "类型",
        dataIndex: "docType",
        key: "docType",
        width: 100,
        render: (type: string) => renderFileTypeTag(type),
      },
      {
        title: "大小",
        dataIndex: "fileSize",
        key: "fileSize",
        width: 110,
        render: (size: string | number) => (
          <span className="col-size">{formatFileSize(size)}</span>
        ),
      },
      {
        title: "创建时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 170,
        render: (t: number | string) => (
          <span className="col-time">{formatDate(t)}</span>
        ),
      },
      {
        title: "文档状态",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status: number) => renderFileStatusTag(status),
      },
      {
        title: "操作",
        key: "actions",
        width: 120,
        fixed: "right" as const,
        render: (_, record) => {
          const pollingThis = pollingIdRef.current === record.id;
          return (
            <div className="col-actions">
              {[0, 2, 3].includes(record.status) && (
                <button
                  className="action-link"
                  title="重新上传"
                  disabled={pollingThis}
                  onClick={() => handleRetryUpload(record)}
                >
                  <Upload size={14} className={pollingThis ? "spin" : ""} />
                </button>
              )}
              <a
                className="action-link"
                href={record.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="下载"
              >
                <Download size={14} />
              </a>

              <button
                className="action-link danger"
                title="删除"
                onClick={() => handleDeleteFile(record.id, record.fileName)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [handleDeleteFile, handleRetryUpload],
  );

  return (
    <div className="file-section">
      <div className="file-section-title">
        <span>文件列表</span>
        <span className="file-count">{fileList.length} 个</span>
        <Button title="刷新" type="link" onClick={onRefresh}>
          <RefreshCw size={14} />
        </Button>
      </div>

      <div className="file-table-wrap">
        <Table<FileDetailVo>
          rowKey="id"
          columns={columns}
          dataSource={fileList}
          loading={loading}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                description="当前文件夹暂无文件"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={{
            current: pagination?.current ?? 1,
            pageSize: pagination?.pageSize ?? 20,
            total: pagination?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => onPageChange?.(p, s),
          }}
        />
      </div>
    </div>
  );
};

export default FileTable;
