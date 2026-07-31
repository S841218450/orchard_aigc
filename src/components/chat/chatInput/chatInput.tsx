"use client";

import "./chatInput.scss";
import { Input, Button, App, Image } from "antd";
import { useState, useRef, useCallback } from "react";
const { TextArea } = Input;
import {
  ArrowUp,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  name: string;
  size: string;
  type: "image" | "file";
}

interface ChatInputProps {
  sendMessage: (message: string, files?: FileItem[]) => void;
  leftOpration?: React.ReactNode;
  rightOpration?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const ChatInput = ({
  sendMessage,
  leftOpration,
  rightOpration,
  value,
  onChange,
  placeholder = "发挥你的奇思妙想",
}: ChatInputProps) => {
  const { message } = App.useApp();
  const [internalValue, setInternalValue] = useState("");
  const messageText = value !== undefined ? value : internalValue;
  const setMessageText = (text: string) => {
    if (value === undefined) {
      setInternalValue(text);
    }
    onChange?.(text);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: FileItem[] = [];
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSize) {
        message.error(`${file.name} 超过 10MB 限制`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        message.error(`${file.name} 格式不支持`);
        return;
      }

      const isImage = file.type.startsWith("image/");
      const item: FileItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: isImage ? "image" : "file",
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          item.preview = e.target?.result as string;
          setFiles((prev) => [...prev, item]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(item);
      }
    });

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当鼠标真正离开容器时才取消高亮
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = "";
      }
    },
    [processFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleSend = async () => {
    if (messageText.trim() === "" && files.length === 0) {
      return;
    }

    const currentMessage = messageText.trim();
    setIsLoading(true);

    try {
      sendMessage(currentMessage, files.length > 0 ? files : undefined);
      setMessageText("");
      setFiles([]);
    } catch (e) {
      console.error("handleSend error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={16} />;
      case "file":
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div
      className={`chat-input-wrapper ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-content">
            <Paperclip size={32} />
            <p>释放文件即可上传</p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.id} className="file-item">
              {file.type === "image" && file.preview ? (
                <div className="file-preview">
                  <div className="file-preview-wrapper">
                    <Image
                      height={40}
                      src={file.preview}
                      alt={file.name}
                      preview={false}
                    />
                    <div className="file-preview-mask">
                      <Button
                        type="text"
                        size="small"
                        className="file-remove-btn"
                        icon={<X size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="file-icon">{getFileIcon(file.type)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <TextArea
        value={messageText}
        className="chat-input-textarea"
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 6 }}
        disabled={isLoading}
      />

      <div className="chat-input-operator">
        <div className="operator-left">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelect}
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
          />
          <Button
            type="text"
            icon={<Paperclip size={18} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          />
          {leftOpration}
        </div>
        <div className="operator-right">
          {rightOpration}
          <Button
            shape="circle"
            type="primary"
            icon={<ArrowUp size={18} />}
            onClick={handleSend}
            loading={isLoading}
            disabled={
              isLoading || (messageText.trim() === "" && files.length === 0)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
