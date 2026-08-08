"use client";

import { Image, Skeleton, Masonry, Spin } from "antd";
import { FolderOpen, AlertCircle } from "lucide-react";
import type { MaterialItem, ImageProportion } from "@/actions/home";
import Loading from "@/components/core/loadding/loading";

import "./materialList.scss";

// 组件 Props 接口
export interface MaterialListProps {
  list: MaterialItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  onRetry: () => void;
}

const defaultImg = "https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png";

// 固定比例字符串 -> 宽高比数值（宽 / 高），骨架屏据此占位防止图片加载后重排
const PROPORTION_RATIO: Record<ImageProportion, number> = {
  "1:1": 1,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "24:3": 24 / 3,
};

// 骨架屏占位卡片循环使用的比例（与 mock 数据分配顺序一致，首屏骨架位置接近真实数据）
const SKELETON_PROPORTIONS: ImageProportion[] = ["1:1", "9:16", "16:9", "24:3"];

// 比例字符串转 aspect-ratio 数值，无法识别时回退 1:1
const getAspectRatio = (proportion?: ImageProportion): number =>
  proportion ? PROPORTION_RATIO[proportion] : PROPORTION_RATIO["1:1"];

const MaterialList = ({
  list,
  loading,
  loadingMore,
  hasMore,
  error,
  onRetry,
}: MaterialListProps) => {
  //渲染空状态
  const renderEmpty = () => (
    <div className="empty-state">
      <div className="empty-icon">
        <FolderOpen size={48} />
      </div>
      <h3 className="empty-title">暂无素材</h3>
      <p className="empty-desc">试试搜索其他关键词吧</p>
    </div>
  );

  //渲染错误状态
  const renderError = () => (
    <div className="error-state">
      <div className="error-icon">
        <AlertCircle size={48} />
      </div>
      <h3 className="error-title">加载失败</h3>
      <p className="error-desc">{error?.message || "加载失败，请稍后重试"}</p>
      <button className="error-action" onClick={onRetry}>
        重新加载
      </button>
    </div>
  );

  //渲染内容
  const renderContent = () => (
    <>
      <Masonry
        columns={4}
        gutter={10}
        items={list.map((item) => ({
          key: item.id,
          data: item,
        }))}
        itemRender={({ data }) => (
          <div className="material-card">
            <div
              className="card-image-wrapper"
              style={{ aspectRatio: getAspectRatio(data.imageProportion) }}
            >
              <div className="card-skeleton-placeholder" />
              <Image
                src={data.image || defaultImg}
                alt={data.title}
                preview={{
                  open: false,
                  cover: (
                    <div className="card-overlay">
                      <div className="card-info">
                        <div className="card-title">{data.title}</div>
                        <div className="card-time">{data.time}</div>
                      </div>
                    </div>
                  ),
                }}
                className="card-image"
                fallback={defaultImg}
                placeholder={
                  <div className="card-skeleton-placeholder">
                    <Skeleton.Image active className="card-skeleton-img" />
                  </div>
                }
              />
            </div>
          </div>
        )}
      />
      {loadingMore && (
        <div className="loading-more">
          <Spin size="small" />
          <span className="loading-more-text">加载中...</span>
        </div>
      )}
      {!hasMore && list.length > 0 && <div className="no-more">没有更多了</div>}
    </>
  );

  return (
    <div className="material-list-wrapper">
      <div className="material-content">
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
    </div>
  );
};

export default MaterialList;
