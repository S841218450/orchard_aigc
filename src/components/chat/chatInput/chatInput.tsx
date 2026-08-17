"use client";

import "./chatInput.scss";
import { Button, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useRef, useState } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { Sender, Attachments } from "@ant-design/x";
import messageManager from "@/utils/messageManager";

/**
 * Attachments 的 items 类型（Attachment = UploadFile & FileCardProps 可选字段），
 * @ant-design/x 主入口未导出 Attachment 类型，此处用 UploadFile 兼容结构代替
 */
type AttachmentLike = UploadFile & { description?: React.ReactNode };

export interface FileItem {
  id: string;
  file: File;
  preview?: string;
  name: string;
  size: string;
  type: "image" | "file";
}

interface ChatInputProps {
  /** 是否正在流式生成中（未接入流式的场景可不传，默认 false） */
  isStreaming?: boolean;
  /** 停止流式生成回调（未接入流式的场景可不传） */
  stopChat?: () => void;
  sendMessage: (message: string, files?: FileItem[]) => void;
  leftOpration?: React.ReactNode;
  rightOpration?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

/** 单个附件最大 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;
/** 文件选择 accept（与扩展名白名单保持一致） */
const FILE_ACCEPT = "image/*,.pdf,.txt,.doc,.docx";
/** 允许的扩展名白名单（Windows 下 Office 文件 type 为空，扩展名优先） */
const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "txt",
  "doc",
  "docx",
];

const ChatInput = ({
  isStreaming = false,
  stopChat = () => {},
  sendMessage,
  leftOpration,
  rightOpration,
  value,
  onChange,
  placeholder = "发挥你的奇思妙想",
}: ChatInputProps) => {
  const [internalValue, setInternalValue] = useState("");
  const messageText = value !== undefined ? value : internalValue;
  const setMessageText = (text: string) => {
    if (value === undefined) {
      setInternalValue(text);
    }
    onChange?.(text);
  };

  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const attachmentsRef = useRef<React.ElementRef<typeof Attachments>>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 附件校验：超限或扩展名不在白名单内的直接忽略；
  // 合法文件返回 false 仅本地展示，阻止 antd Upload 实际上传
  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      messageManager.error(`${file.name} 超过 10MB 限制`);
      return Upload.LIST_IGNORE;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      messageManager.error(`${file.name} 格式不支持`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  // 发送时把 UploadFile 列表映射为页面约定的 FileItem
  const buildFileItems = (files: UploadFile[]): FileItem[] | undefined => {
    if (files.length === 0) return undefined;
    return files
      .filter((f) => f.originFileObj instanceof File)
      .map((f) => ({
        id: f.uid,
        file: f.originFileObj as File,
        name: f.name,
        size: formatFileSize(f.size ?? 0),
        type: (f.type?.startsWith("image/")
          ? "image"
          : "file") as FileItem["type"],
      }));
  };

  const handleSend = () => {
    if (messageText.trim() === "" && uploadList.length === 0) return;
    sendMessage(messageText.trim(), buildFileItems(uploadList));
    setMessageText("");
    setUploadList([]);
  };

  // 点击附件按钮：先展开面板，再触发文件选择（面板渲染后 ref 才可用）
  const handleOpenAttachments = () => {
    setAttachmentsOpen(true);
    setTimeout(() => {
      attachmentsRef.current?.select({
        accept: FILE_ACCEPT,
        multiple: true,
      });
    }, 0);
  };

  return (
    <div className="chat-input-wrapper">
      <Sender
        className="chat-sender"
        value={messageText}
        onChange={(text) => setMessageText(text)}
        onSubmit={handleSend}
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 6 }}
        loading={isStreaming}
        onCancel={stopChat}
        prefix={
          <div className="chat-input-prefix">
            <Button
              type="text"
              className="attach-btn"
              icon={<Paperclip size={18} />}
              title="添加附件"
              aria-label="添加附件"
              onClick={handleOpenAttachments}
            />
            {leftOpration}
          </div>
        }
        suffix={
          isStreaming ? (
            <Button
              shape="circle"
              type="primary"
              icon={<Square size={18} />}
              aria-label="停止生成"
              onClick={stopChat}
            />
          ) : (
            <Button
              shape="circle"
              type="primary"
              icon={<ArrowUp size={18} />}
              aria-label="发送消息"
              disabled={messageText.trim() === "" && uploadList.length === 0}
              onClick={handleSend}
            />
          )
        }
        footer={
          rightOpration ? (
            <div className="chat-input-footer">{rightOpration}</div>
          ) : null
        }
        header={
          <Sender.Header
            title="附件"
            open={attachmentsOpen}
            onOpenChange={setAttachmentsOpen}
            closable
          >
            <Attachments
              ref={attachmentsRef}
              items={uploadList as unknown as AttachmentLike[]}
              accept={FILE_ACCEPT}
              beforeUpload={beforeUpload}
              onChange={({ fileList }) => setUploadList(fileList)}
              placeholder={{
                icon: <Paperclip size={24} />,
                title: "拖拽或点击上传附件",
                description:
                  "支持图片 / PDF / Word / 文本，单个文件不超过 10MB",
              }}
            />
          </Sender.Header>
        }
      />
    </div>
  );
};

export default ChatInput;
