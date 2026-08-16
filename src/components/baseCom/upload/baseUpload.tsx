"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button, Image, Popconfirm, Tooltip, Upload } from "antd";
import type { UploadProps } from "antd";
import { DEFAULT_ICONS } from "@/constants/assets";

import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import API from "@/api";
import messageManager from "@/utils/messageManager";
import { formatFileSize } from "@/utils/fileUtils";
import { uploadKnowledgeBatch } from "@/actions/file";
import "./baseUpload.scss";

const { Dragger } = Upload;

// ==================== 类型定义 ====================

/** 图片模式条目（上传成功的图片 URL） */
export interface UploadImageItem {
  id: number;
  url: string;
}

/** 文件模式待传条目（选择后先暂存，点击"开始上传"统一上传） */
interface PendingFile {
  uid: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "uploading" | "done" | "error";
  percent?: number;
  error?: string;
}

/** 文件模式批量上传函数 */
export type UploadFilesFn = (
  files: File[],
  extraData: Record<string, string>,
  onProgress?: (percent: number) => void,
) => Promise<{ success: boolean; error?: string }>;

// ==================== Props 定义（按 type 区分图片 / 文件模式） ====================

/** 图片模式 Props */
export interface ImageUploadProps {
  type: "image";
  /** 参考图列表（受控） */
  images: UploadImageItem[];
  /** 列表变化回调（上传成功 / 删除时触发，直接传 setState 即可） */
  onChange: Dispatch<SetStateAction<UploadImageItem[]>>;
  maxImages?: number; /** 最多上传张数，默认 4 */
  /** 缩略图自定义渲染（默认渲染纯图片；可在此内嵌 Popover、标注角标等交互） */
  renderThumbnail?: (item: UploadImageItem, index: number) => ReactNode;
  /** 删除图片前的回调（用于清理图片关联的外部数据） */
  onRemove?: (item: UploadImageItem) => void;
  /** 单张上传函数，默认 API.uploadFile（formData 含 file 字段），返回文件 URL */
  uploadImage?: (
    file: File,
  ) => Promise<{ success: boolean; fileUrl?: string; error?: string }>;
}

/** 文件模式 Props */
export interface FileUploadProps {
  type: "file";
  /** 拖拽区提示文案 */
  hint?: string;
  /** 批量上传函数，默认 actions 层 uploadKnowledgeBatch（formData 含 files + extraData 字段） */
  uploadFiles?: UploadFilesFn;
  /** 批量上传附加字段（如 folderId） */
  extraData?: Record<string, string>;
  /** 上传成功回调 */
  onUploadComplete?: () => void;
}

export type BaseUploadProps = ImageUploadProps | FileUploadProps;

// 默认批量上传实现：files 多值字段 + extraData 附加字段
const defaultUploadFiles: UploadFilesFn = async (
  files,
  extraData,
  onProgress,
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  Object.entries(extraData).forEach(([key, value]) =>
    formData.append(key, value),
  );
  return uploadKnowledgeBatch(formData, onProgress);
};

// ==================== 图片模式 ====================

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 4,
  renderThumbnail,
  onRemove,
  uploadImage,
}) => {
  const [uploading, setUploading] = useState(false);
  // 与受控列表保持同步，供异步上传回调读取最新张数（并发多选时避免超限）。
  // 在 effect 中同步而非渲染期直接赋值，避免 "Cannot update ref during render" 警告
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // 单张即时上传：返回 URL 后追加到参考图列表
  const uploadProps: UploadProps = {
    name: "file",
    accept: "image/*",
    multiple: true,
    showUploadList: false,
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      if (imagesRef.current.length >= maxImages) {
        messageManager.warning(`最多只能上传 ${maxImages} 张图片`);
        return;
      }
      setUploading(true);
      try {
        let fileUrl: string;
        if (uploadImage) {
          const res = await uploadImage(file as File);
          if (!res.success || !res.fileUrl) {
            throw new Error(res.error || "图片上传失败，请重试");
          }
          fileUrl = res.fileUrl;
        } else {
          const formData = new FormData();
          formData.append("file", file);
          const res = await API.uploadFile(formData);
          fileUrl = res.data.fileUrl;
        }
        // 函数式更新：并发上传时基于最新列表追加，避免竞态丢图
        onChange((prev) =>
          prev.length >= maxImages
            ? prev
            : [...prev, { id: Date.now(), url: fileUrl }],
        );
        onSuccess?.(fileUrl);
        messageManager.success("图片上传成功");
      } catch (e) {
        console.error("上传失败:", e);
        onError?.(e as Error);
        messageManager.error("图片上传失败，请重试");
      } finally {
        setUploading(false);
      }
    },
  };

  const handleRemoveImage = (index: number, item: UploadImageItem) => {
    onRemove?.(item);
    onChange((prev) => prev.filter((_, i) => i !== index));
  };

  // 动态布局：图片张数 + 追加卡片达到 4 项启用堆叠，否则平铺等宽
  const itemsCount = images.length + (images.length < maxImages ? 1 : 0);
  const isStacked = itemsCount >= 4;

  return (
    <div className="upload-area image-mode">
      {images.length > 0 ? (
        <div
          className={`stacked-images ${
            isStacked ? "stacked-mode" : "linear-mode"
          } count-${itemsCount}`}
        >
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="stacked-image-item"
              style={{
                zIndex: isStacked ? index + 1 : 1,
              }}
            >
              {renderThumbnail ? (
                renderThumbnail(img, index)
              ) : (
                <div className="thumbnail-wrapper">
                  <Image
                    src={img.url}
                    alt={`参考图 ${index + 1}`}
                    className="stacked-preview-img"
                    preview={{ open: false }}
                  />
                </div>
              )}
              <Popconfirm
                title="确认删除该参考图？"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleRemoveImage(index, img)}
              >
                <Button
                  type="text"
                  danger
                  shape="circle"
                  size="small"
                  icon={<X size={12} />}
                  className="stacked-remove-btn"
                />
              </Popconfirm>
            </div>
          ))}

          {/* 追加上传卡片：Dragger 支持拖拽上传，未达到上限时显示 */}
          {images.length < maxImages && (
            <div
              className="stacked-image-item stacked-add-item"
              style={{
                zIndex: isStacked ? images.length + 1 : 1,
              }}
            >
              <Dragger {...uploadProps} className="stacked-add-dragger">
                {uploading ? (
                  <div className="uploading-state">
                    <Loader2 size={20} className="spin" />
                    <span>上传中...</span>
                  </div>
                ) : (
                  <Plus size={28} />
                )}
              </Dragger>
            </div>
          )}
        </div>
      ) : (
        <Dragger {...uploadProps} className="upload-placeholder">
          {uploading ? (
            <div className="uploading-state">
              <Loader2 size={24} className="spin" />
              <span>上传中...</span>
            </div>
          ) : (
            <>
              <ImageIcon size={24} />
              <p>点击或拖拽上传图片</p>
              <p className="upload-hint">
                支持 JPG、PNG 格式，最多 {maxImages} 张
              </p>
            </>
          )}
        </Dragger>
      )}
    </div>
  );
};

// ==================== 文件模式 ====================

const FileUpload: React.FC<FileUploadProps> = ({
  hint,
  uploadFiles,
  extraData,
  onUploadComplete,
}) => {
  // 待上传文件列表（暂存，不自动上传）
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const doUpload = uploadFiles ?? defaultUploadFiles;

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
    // 拖拽/选择场景下 file.type 可能为空（尤其 Windows 下 Office 文件），
    // 统一按扩展名校验更可靠，MIME 判断仅作为兜底
    const extWhitelist = [".pdf", ".docx", ".xlsx", ".md", ".txt"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const typeValid =
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!extWhitelist.includes(ext) && !typeValid) {
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

  // ---------- 批量上传：单次请求上传所有待传文件（同一目录） ----------
  const handleUploadAll = async () => {
    if (uploading) return;
    const targets = pendingFiles.filter((f) => f.status !== "done");
    if (targets.length === 0) return;

    setUploading(true);
    // 全部标记为上传中
    targets.forEach((item) =>
      updatePendingFile(item.uid, {
        status: "uploading",
        percent: 0,
        error: undefined,
      }),
    );

    try {
      const res = await doUpload(
        targets.map((item) => item.file),
        extraData ?? {},
        (p) => {
          // 批量上传只有整体进度，同步展示到每个条目
          targets.forEach((item) =>
            updatePendingFile(item.uid, { percent: p }),
          );
        },
      );
      if (res.success) {
        targets.forEach((item) =>
          updatePendingFile(item.uid, { status: "done", percent: 100 }),
        );
        messageManager.success(`成功上传 ${targets.length} 个文件`);
        // 清空待传列表
        setPendingFiles([]);
        onUploadComplete?.();
      } else {
        const msg = res.error || "上传失败，请重试";
        targets.forEach((item) =>
          updatePendingFile(item.uid, { status: "error", error: msg }),
        );
        messageManager.error(msg);
      }
    } catch (e) {
      const msg = (e as Error)?.message || "上传失败，请重试";
      targets.forEach((item) =>
        updatePendingFile(item.uid, { status: "error", error: msg }),
      );
      messageManager.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`upload-area file-mode ${uploading ? "uploading" : ""}`}>
      <div className="upload-dragger">
        <Dragger
          name="file"
          accept=".pdf,.docx,.xlsx,.md,.txt"
          multiple={true}
          showUploadList={false}
          fileList={[]}
          beforeUpload={beforeUpload}
        >
          <p className="ant-upload-drag-icon">
            <UploadIcon size={36} className="drag-icon-lucide" />
          </p>
          <p className="ant-upload-text">拖拽文件到此处，或点击选择文件上传</p>
          <p className="ant-upload-hint">{hint}</p>
        </Dragger>
      </div>

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

          <div className="pending-list-content">
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
                      <DEFAULT_ICONS.error size={14} className="status-error" />
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
                  <Button
                    type="text"
                    size="small"
                    icon={<X size={12} />}
                    aria-label="移除文件"
                    disabled={uploading}
                    className="pending-file-remove"
                  />
                </Popconfirm>
              </div>
            ))}
          </div>
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

// ==================== 统一入口：按 type 分发 ====================

export const BaseUpload = (props: BaseUploadProps) =>
  props.type === "image" ? (
    <ImageUpload {...props} />
  ) : (
    <FileUpload {...props} />
  );
