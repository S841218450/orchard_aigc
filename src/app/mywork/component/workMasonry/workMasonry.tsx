"use client";
import { Image, Masonry, Spin, Tooltip } from "antd";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
import type { WorkMessage } from "@/actions/types";
import { formatDate } from "@/utils/timeUtils";
import { DEFAULT_IMAGES, DEFAULT_ICONS } from "@/constants/assets";
import Loading from "@/components/core/loadding/loading";
import "./workMasonry.scss";

// 比例字符串 -> 宽高比数值（宽/高），无法识别时回退 1:1
const PROPORTION_RATIO: Record<string, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};
const getRatio = (proportion?: string): number =>
  (proportion && PROPORTION_RATIO[proportion]) || 1;

export interface WorkMasonryProps {
  list: WorkMessage[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null | undefined;
  onLoadMore: () => void;
  onRetry: () => void;
}

const WorkMasonry = ({
  list,
  loading,
  loadingMore,
  hasMore,
  error,
  onRetry,
}: WorkMasonryProps) => {
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

  const renderContent = () => {
    // 瀑布流平铺：将每个作品的 dataList 全部展开成独立卡片，无多图时退化为单张 resultUrl
    const cards = list.flatMap((item) => {
      const imgs =
        item.dataList && item.dataList.length > 0
          ? item.dataList
          : item.resultUrl
            ? [{ id: item.id, url: item.resultUrl }]
            : [];
      return imgs.map((img) => ({
        key: `${item.id}-${img.id}`,
        url: img.url,
        prompt: item.prompt,
        createTime: item.createTime,
        status: item.status,
        proportion: item.params?.imageProportion,
      }));
    });

    return (
      <>
        <Masonry
          columns={4}
          gutter={12}
          items={cards.map((card) => ({ key: card.key, data: card }))}
          itemRender={({ data }) => {
            return (
              <div className="wm-card">
                <div
                  className="wm-card-image-wrap"
                  style={{ aspectRatio: getRatio(data.proportion) }}
                >
                  {/* 类型角标 */}
                  <span className="wm-card-type-badge type-image">
                    <ImageIcon size={12} />
                    图片
                  </span>
                  {/* hover 打开图标浮层 */}
                  <div className="wm-card-open-overlay" title="查看大图">
                    <ExternalLink size={16} />
                  </div>
                  <Image
                    className="wm-card-image"
                    src={data.url || DEFAULT_IMAGES.fallback}
                    alt={data.prompt}
                    loading="lazy"
                    decoding="async"
                    fallback={DEFAULT_IMAGES.fallback}
                    preview={{ mask: { blur: true } }}
                  />
                </div>
                <div className="wm-card-info">
                  <Tooltip title={data.prompt}>
                    <p className="wm-card-title">{data.prompt}</p>
                  </Tooltip>
                  <div className="wm-card-meta">
                    <span className="wm-card-time">
                      {formatDate(data.createTime)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
        />
        {loadingMore && (
          <div className="wm-loading-more">
            <Spin size="small" />
            <span>加载中...</span>
          </div>
        )}
        {!hasMore && list.length > 0 && (
          <div className="wm-no-more">没有更多了</div>
        )}
      </>
    );
  };

  return (
    <div className="work-masonry-wrapper">
      {loading ? (
        <Loading />
      ) : error ? (
        renderError()
      ) : list.length > 0 ? (
        renderContent()
      ) : (
        renderEmpty()
      )}
    </div>
  );
};

export default WorkMasonry;
