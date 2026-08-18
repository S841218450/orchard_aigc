"use client";
import { useState } from "react";
import { Image, Spin, Button, Popconfirm, Tooltip } from "antd";
import {
  Copy,
  Trash2,
  Download,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Maximize2,
  Share,
  Quote,
} from "lucide-react";
import type { WorkMessage } from "@/actions/types";
import { WORK_STATUS_MAP } from "@/actions/types";
import { formatDate } from "@/utils/timeUtils";
import { DEFAULT_IMAGES, DEFAULT_ICONS } from "@/constants/assets";
import messageManager from "@/utils/messageManager";
import Loading from "@/components/core/loadding/loading";
import "./workList.scss";
import { createAsset } from "@/actions/asset";
// 状态值映射到 CSS class 名
const STATUS_CLASS_MAP: Record<number, string> = {
  0: "status-pending",
  1: "status-running",
  2: "status-success",
  3: "status-failed",
  4: "status-pending",
};

// 比例字符串 -> 结果图展示尺寸
const getImgSize = (proportion?: string) => {
  const sizeMap: Record<string, { width: number; height: number }> = {
    "1:1": { width: 280, height: 280 },
    "4:3": { width: 280, height: 210 },
    "3:4": { width: 280, height: 373 },
    "16:9": { width: 280, height: 157 },
    "9:16": { width: 280, height: 498 },
  };
  return sizeMap[proportion || "1:1"] || sizeMap["1:1"];
};

export interface WorkListProps {
  list: WorkMessage[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null | undefined;
  onLoadMore: () => void;
  onRetry: () => void;
  /** 删除回调（列表项删除按钮触发） */
  onDelete?: (item: WorkMessage) => void;
}

// ========== 列表项组件（结构参照消息页 message-item） ==========
const WorkListItem = ({
  item,
  onDelete,
}: {
  item: WorkMessage;
  onDelete?: (item: WorkMessage) => void;
}) => {
  const imgSize = getImgSize(item.params?.imageProportion);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // 结果图列表：优先多图列表，无则退化为单张 resultUrl
  const resultImages =
    item.dataList && item.dataList.length > 0
      ? item.dataList
      : item.resultUrl
        ? [{ id: "", url: item.resultUrl }]
        : [];

  const copyPrompt = () => {
    messageManager.success("已复制到剪贴板");
    navigator.clipboard?.writeText(item.prompt);
  };

  // 先 fetch 转 blob 再下载：避免 a.download 对跨域图片失效（被浏览器直接打开）
  const downloadImage = async (url: string) => {
    const fileName = url.split("/").pop() || "image.jpg";
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // fetch 受限（如服务器未开放 CORS）时退回 a 标签直接下载
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    }
  };

  return (
    <div className="wm-item">
      {/* 头部：时间 + 状态 + 操作按钮 */}
      <div className="wm-header">
        <div className="wm-time-wrap">
          <span className="wm-time">{formatDate(item.createTime)}</span>
          {/* 状态多彩标签 */}
          {WORK_STATUS_MAP[item.status] && (
            <span
              className={`wm-status-badge ${STATUS_CLASS_MAP[item.status] ?? "status-pending"}`}
            >
              {WORK_STATUS_MAP[item.status].label}
            </span>
          )}
        </div>
        <div className="wm-actions">
          <Tooltip title="复制提示词">
            <Button
              size="small"
              type="text"
              icon={<Copy size={16} />}
              onClick={copyPrompt}
              className="action-btn"
            />
          </Tooltip>
          <Popconfirm
            title="删除记录"
            description="确认删除这条记录吗？"
            onConfirm={() => onDelete?.(item)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              size="small"
              type="text"
              icon={<Trash2 size={16} />}
              className="action-btn action-btn-danger"
            />
          </Popconfirm>
        </div>
      </div>

      {/* 提示词内容 */}
      <div className="wm-content-wrap">
        <span className="wm-quote">
          <Quote size={10} />
        </span>
        <p className="wm-content">{item.prompt}</p>
      </div>

      {/* 参数 chip 标签 */}
      <div className="wm-chips">
        {item.model && (
          <span className="chip">
            <Sparkles size={12} />
            {item.model === "default" ? "默认模型" : item.model}
          </span>
        )}
        {item.params?.style && (
          <span className="chip">
            <Palette size={12} />
            {item.params.style}
          </span>
        )}
        {item.params?.imageQuality && (
          <span className="chip">
            <ImageIcon size={12} />
            {item.params.imageQuality}
          </span>
        )}
        {item.params?.imageProportion && (
          <span className="chip">
            <Maximize2 size={12} />
            {item.params.imageProportion}
          </span>
        )}
      </div>

      {/* 生成结果图片 */}
      {resultImages.length > 0 && (
        <div className="wm-images">
          {resultImages.map((img, index) => (
            <div className="wm-image-wrap" key={`${img.id}-${index}`}>
              <Image
                className="wm-image"
                src={img.url}
                alt={`生成素材${index + 1}`}
                fallback={DEFAULT_IMAGES.fallback}
                // cover 内的按钮必须阻止冒泡，否则会触发图片自身的 preview 打开
                preview={{
                  mask: { blur: true },
                  cover: (
                    <div className="wm-image-cover">
                      <Button
                        icon={<Download size={14} />}
                        type="primary"
                        className="W80"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(img.url);
                        }}
                      >
                        下载图片
                      </Button>
                      <Button
                        icon={<Share size={14} />}
                        type="primary"
                        className="W80"
                        loading={sharingId !== null && sharingId === img.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSharingId(img.id);
                          try {
                            const res = await createAsset({
                              workId: item.id,
                              imageId: img.id,
                              tags: [],
                            });
                            if (res.success) {
                              messageManager.success("已分享至素材库");
                            } else {
                              messageManager.error(res.error ?? "分享失败");
                            }
                          } finally {
                            setSharingId(null);
                          }
                        }}
                      >
                        分享至素材
                      </Button>
                    </div>
                  ),
                }}
                style={{
                  width: imgSize.width,
                  height: imgSize.height,
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========== 列表容器 ==========
const WorkList = ({
  list,
  loading,
  loadingMore,
  hasMore,
  error,
  onRetry,
  onDelete,
}: WorkListProps) => {
  const renderEmpty = () => (
    <div className="wm-state">
      <div className="wm-state-icon">
        <DEFAULT_ICONS.empty size={48} />
      </div>
      <h3 className="wm-state-title">暂无项目</h3>
      <p className="wm-state-desc">快去创作你的第一幅作品吧</p>
    </div>
  );

  const renderError = () => (
    <div className="wm-state">
      <div className="wm-state-icon">
        <DEFAULT_ICONS.error size={48} />
      </div>
      <h3 className="wm-state-title">加载失败</h3>
      <p className="wm-state-desc">
        {error?.message || "加载失败，请稍后重试"}
      </p>
      <button className="wm-state-action" onClick={onRetry}>
        重新加载
      </button>
    </div>
  );

  return (
    <div className="work-list-content">
      {loading ? (
        <Loading />
      ) : error ? (
        renderError()
      ) : list.length > 0 ? (
        <>
          {list.map((item) => (
            <WorkListItem key={item.id} item={item} onDelete={onDelete} />
          ))}
          {loadingMore && (
            <div className="wm-loading-more">
              <Spin size="small" />
              <span>加载中...</span>
            </div>
          )}
          {!hasMore && <div className="wm-no-more">没有更多了</div>}
        </>
      ) : (
        renderEmpty()
      )}
    </div>
  );
};

export default WorkList;
