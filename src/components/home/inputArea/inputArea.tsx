"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input, Popconfirm, Upload, Image } from "antd";
import type { UploadProps } from "antd";
import { ArrowUp, ImagePlus, X } from "lucide-react";
import messageManager from "@/utils/messageManager";
import { type SendMessageData } from "@/actions/home";
import "./inputArea.scss";

// 最多上传图片数量
const MAX_IMAGES = 4;
// 单张图片最大 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// 允许的图片扩展名白名单
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
// 相邻照片的水平错位间距（每张相对前一张向右平移，避免完全重叠）
const STACK_OFFSET = -45;

/** 本地待发送图片（仅本地暂存预览，不调用上传接口） */
interface LocalImage {
  id: string;
  url: string; // URL.createObjectURL 生成的本地地址
  name: string;
  file: File;
}

// 主页一体化输入框：图片堆叠墙 + 描述输入 + 发送，携带数据跳转创作页对应菜单
const InputArea = ({
  onSendMessage,
}: {
  onSendMessage: (data: SendMessageData) => void;
}) => {
  const { TextArea } = Input;
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  // 与受控列表同步，供 beforeUpload 读取最新张数（并发多选时避免超限）
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // 选择图片：仅本地暂存，不上传接口（进入创作页后按需统一上传）
  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (imagesRef.current.length >= MAX_IMAGES) {
      messageManager.warning(`最多上传 ${MAX_IMAGES} 张图片`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE) {
      messageManager.error(`${file.name} 超过 10MB 限制`);
      return Upload.LIST_IGNORE;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      messageManager.error(`${file.name} 格式不支持`);
      return Upload.LIST_IGNORE;
    }
    setImages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: URL.createObjectURL(file),
        name: file.name,
        file,
      },
    ]);
    return Upload.LIST_IGNORE;
  };

  // 移除图片并释放本地地址，避免内存泄漏
  const removeImage = (img: LocalImage) => {
    URL.revokeObjectURL(img.url);
    setImages((prev) => prev.filter((item) => item.id !== img.id));
  };

  const handleSend = () => {
    const message = inputText.trim();
    if (!message && images.length === 0) return;
    onSendMessage({
      message,
      files: images.map((img) => ({ id: img.id, url: img.url })),
    });
  };

  const hasContent = inputText.trim() !== "" || images.length > 0;

  return (
    <div className="input-area-wrapper">
      <div className="input-area-card">
        <div className="flex-gap-5">
          {/* 图片堆叠区：仅本地预览，左右交替倾斜 + 层级递增，hover 置顶放大 */}
          <div className="photo-stack">
            {images.length < MAX_IMAGES && (
              <Upload
                accept="image/*"
                multiple
                showUploadList={false}
                beforeUpload={beforeUpload}
                className="photo-stack-upload"
              >
                <div className="photo-stack-add">
                  <ArrowUp size={18} />
                </div>
              </Upload>
            )}
            {images.map((img, index) => (
              <div
                key={img.id}
                className="photo-stack-item"
                style={{
                  zIndex: index + 1,
                  marginLeft: index === 0 ? 0 : STACK_OFFSET,
                  transform: `rotate(${index % 2 === 0 ? 10 : -10}deg)`,
                }}
              >
                <Image
                  src={img.url}
                  alt={img.name}
                  className="photo-stack-img"
                  preview={false}
                />
                <Popconfirm
                  title="删除该图片？"
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => removeImage(img)}
                >
                  <Button
                    type="text"
                    danger
                    shape="circle"
                    size="small"
                    icon={<X size={12} />}
                    className="photo-stack-remove"
                    aria-label="删除图片"
                  />
                </Popconfirm>
              </div>
            ))}
          </div>

          {/* 描述输入 */}
          <div className="input-area-text">
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入你的奇思妙想"
              autoSize={{ minRows: 2, maxRows: 5 }}
            />
          </div>
        </div>
        {/* 底部操作行 */}
        <div className="input-area-footer">
          <span className="input-area-hint">
            {images.length > 0
              ? `已添加 ${images.length}/${MAX_IMAGES} 张图片`
              : "支持 JPG / PNG / WebP，可添加图片进入图生图"}
          </span>
          <Button
            title="发送"
            type="primary"
            shape="circle"
            icon={<ArrowUp size={18} />}
            disabled={!hasContent}
            onClick={handleSend}
          />
        </div>
      </div>
    </div>
  );
};

export default InputArea;
