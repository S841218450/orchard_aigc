"use client";

import { useState, useCallback } from "react";
import {
  Upload as UploadIcon,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Upload, Button, Popconfirm, Tooltip } from "antd";
import type { UploadProps } from "antd";
import { uploadFile } from "@/actions/file";
import { formatFileSize } from "@/utils/fileUtils";
import messageManager from "@/utils/messageManager";

const { Dragger } = Upload;

// ==================== Props 定义 ====================
export interface UploadFileProps {
  selectedFolderId: string | null;
  selectedFolderName: string;
  onUploadComplete: () => void;
}

// 待上传文件条目（选择后先暂存，不立即上传）
interface PendingFile {
  uid: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "uploading" | "done" | "error";
  percent?: number;
  error?: string;
}

// ==================== 组件 ====================
const UploadFile: React.FC<UploadFileProps> = ({
  selectedFolderId,
  selectedFolderName,
  onUploadComplete,
}) => {
  // 待上传文件列表（暂存，不自动上传）
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 更新指定 uid 文件的状态
  const updatePendingFile = useCallback(
    (uid: string, patch: Partial<PendingFile>) => {
      setPendingFiles((prev) =>
        prev.map((f) => (f.uid === uid ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  // ---------- 文件选择：仅暂存到列表，阻止自动上传 ----------
  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isPdf = file.type === "application/pdf";
    const isDocx =
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isXlsx =
      file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isPdf && !isDocx && !isXlsx) {
      messageManager.error("仅支持上传PDF、Word、Excel文件");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 1024 * 1024 * 50) {
      messageManager.error("为防止服务器压力过大，文件大小不能超过50MB");
      return Upload.LIST_IGNORE;
    }
    // 加入待传列表（返回 LIST_IGNORE 阻止 antd 自动上传）
    setPendingFiles((prev) => [
      ...prev,
      {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: file as File,
        name: file.name,
        size: file.size,
        status: "pending",
      },
    ]);
    return Upload.LIST_IGNORE;
  };

  // ---------- 删除单个待传文件 ----------
  const handleRemoveFile = (uid: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.uid !== uid));
  };

  // ---------- 清空待传列表 ----------
  const handleClearAll = () => {
    setPendingFiles([]);
  };

  // ---------- 统一上传（跳过已成功项，便于失败重试） ----------
  const handleUploadAll = async () => {
    if (uploading) return;
    const targets = pendingFiles.filter((f) => f.status !== "done");
    if (targets.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of targets) {
      updatePendingFile(item.uid, {
        status: "uploading",
        percent: 0,
        error: undefined,
      });
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("folderId", selectedFolderId || "");
        const res = await uploadFile(formData, (p) => {
          updatePendingFile(item.uid, { percent: p });
        });
        if (res.success) {
          successCount += 1;
          updatePendingFile(item.uid, { status: "done", percent: 100 });
        } else {
          errorCount += 1;
          updatePendingFile(item.uid, { status: "error", error: res.error });
        }
      } catch (e) {
        errorCount += 1;
        updatePendingFile(item.uid, {
          status: "error",
          error: (e as Error)?.message || "上传失败",
        });
      }
    }

    setUploading(false);

    // 汇总提示
    if (successCount > 0 && errorCount === 0) {
      messageManager.success(`成功上传 ${successCount} 个文件`);
    } else if (successCount > 0 && errorCount > 0) {
      messageManager.warning(
        `上传完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
      );
    } else if (errorCount > 0) {
      messageManager.error(`上传失败 ${errorCount} 个文件，请重试`);
    }
    // 有成功项才刷新文件列表
    if (successCount > 0) {
      onUploadComplete();
    }
  };

  return (
    <div className={`upload-area ${uploading ? "uploading" : ""}`}>
      <Dragger
        name="file"
        accept=".pdf,.docx,.xlsx"
        multiple
        showUploadList={false}
        fileList={[]}
        beforeUpload={beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <UploadIcon size={36} className="drag-icon-lucide" />
        </p>
        <p className="ant-upload-text">拖拽文件到此处，或点击选择文件上传</p>
        <p className="ant-upload-hint">
          将上传到「{selectedFolderName}」，支持批量上传PDF、Word、Excel文件
        </p>
      </Dragger>

      {/* 待上传列表 */}
      {pendingFiles.length > 0 && (
        <div className="pending-file-list">
          <div className="pending-list-header">
            <span>待上传文件（{pendingFiles.length}）</span>
            <Popconfirm
              title="确认清空待上传列表？"
              okText="清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleClearAll}
              disabled={uploading}
            >
              <Button type="text" size="small" danger disabled={uploading}>
                清空
              </Button>
            </Popconfirm>
          </div>

          {pendingFiles.map((item) => (
            <div className="pending-file-item" key={item.uid}>
              <div className="pending-file-info">
                <span className="pending-file-name" title={item.name}>
                  {item.name}
                </span>
                <span className="pending-file-size">
                  {formatFileSize(item.size)}
                </span>
              </div>

              <div className="pending-file-status">
                {item.status === "pending" && (
                  <span className="status-pending">待上传</span>
                )}
                {item.status === "uploading" && (
                  <span className="status-uploading">
                    <Loader2 size={12} className="spin" />
                    {item.percent ?? 0}%
                  </span>
                )}
                {item.status === "done" && (
                  <CheckCircle2 size={14} className="status-done" />
                )}
                {item.status === "error" && (
                  <Tooltip title={item.error || "上传失败"}>
                    <AlertCircle size={14} className="status-error" />
                  </Tooltip>
                )}
              </div>

              <Popconfirm
                title="确认移除该文件？"
                okText="移除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleRemoveFile(item.uid)}
                disabled={uploading}
              >
                <button
                  type="button"
                  className="pending-file-remove"
                  aria-label="移除文件"
                  disabled={uploading}
                >
                  <X size={12} />
                </button>
              </Popconfirm>
            </div>
          ))}

          <Button
            type="primary"
            block
            onClick={handleUploadAll}
            loading={uploading}
            disabled={uploading || pendingFiles.length === 0}
          >
            {uploading ? "上传中..." : "开始上传"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
