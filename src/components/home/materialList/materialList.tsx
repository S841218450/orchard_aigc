"use client";

import {
  useState,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import { useRequest } from "ahooks";
import { Avatar, Button, Image, Skeleton, Masonry, Spin } from "antd";
import { Heart, Copy } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { MaterialItem } from "@/actions/home";
import { likeAsset } from "@/actions/asset";
import { DEFAULT_IMAGES, DEFAULT_ICONS } from "@/constants/assets";
import { getRatioValue, SKELETON_PROPORTIONS } from "@/constants/creationModel";
import messageManager from "@/utils/messageManager";

import "./materialList.scss";

// 组件 Props 接口
export interface MaterialListProps {
  list: MaterialItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  // useRequest 失败时返回 undefined，兼容 undefined
  error: Error | null | undefined;
  onLoadMore: () => void;
  onRetry: () => void;
  // 滚动容器 ref（Home 页为 .home-page）：用于卡片滚入视口入场 + 游标光斑定位
  scrollerRef?: RefObject<HTMLDivElement | null>;
}

// ScrollTrigger 注册（模块级只注册一次）
gsap.registerPlugin(ScrollTrigger);

// 单张素材卡片：列宽固定，图片按自身比例自然撑高形成瀑布流；
// 信息区展示作者头像/名字与点赞，prompt 提示词不展示，通过复制按钮获取
const MaterialCard = ({
  item,
  scrollerRef,
}: {
  item: MaterialItem;
  scrollerRef?: RefObject<HTMLDivElement | null>;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  // 点赞状态（初始来自列表数据，点赞成功后本地更新）
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  // 点赞请求：手动触发，成功后按目标状态更新数量，失败仅提示（保留原状态）
  const { loading: liking, run: toggleLike } = useRequest(
    (targetLiked: boolean) => likeAsset({ id: item.id, liked: targetLiked }),
    {
      manual: true,
      onSuccess: (res, [targetLiked]) => {
        if (res.success) {
          setLiked(targetLiked);
          setLikeCount((prev) => prev + (targetLiked ? 1 : -1));
        } else {
          messageManager.error(res.error ?? "点赞失败，请稍后重试");
        }
      },
    },
  );

  const handleLike = () => {
    if (liking) return;
    toggleLike(!liked);
  };

  // 复制提示词（prompt 不在卡片上展示，通过复制按钮获取）
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt || "");
      messageManager.success("提示词已复制");
    } catch {
      messageManager.error("复制失败，请手动复制");
    }
  };

  // 游标光斑：跟随鼠标在卡片内亮起高光（用于 hover 时描边/高光定位）
  const handleSpot = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x.toFixed(1)}px`);
    el.style.setProperty("--spot-y", `${y.toFixed(1)}px`);
  }, []);

  // 卡片滚入视口时交错上浮入场（绑定在 Home 滚动容器上）
  useGSAP(
    () => {
      const el = cardRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        el,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          delay: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller: scrollerRef?.current ?? undefined,
            start: "top 96%",
            once: true,
          },
        },
      );
    },
    { scope: cardRef, dependencies: [scrollerRef] },
  );

  return (
    <div
      className="material-card"
      ref={cardRef}
      onPointerMove={handleSpot}
    >
      <div className="card-image-wrapper">
        <div className="card-skeleton-placeholder" />
        <Image
          src={item.image || DEFAULT_IMAGES.fallback}
          alt={item.title}
          // 懒加载 + 异步解码：避免全部图片并发下载、解码阻塞主线程导致滚动卡顿
          loading="lazy"
          decoding="async"
          preview={{ open: false }}
          className="card-image"
          fallback={DEFAULT_IMAGES.fallback}
          placeholder={
            <div className="card-skeleton-placeholder">
              <Skeleton.Image active className="card-skeleton-img" />
            </div>
          }
        />
        {/* 遮罩层信息：hover 图片时浮现作者 + 复制/点赞 */}
        <div className="card-overlay">
          <div className="card-info-panel">
            <div className="card-author">
              <Avatar
                size={26}
                src={item.authorAvatar || undefined}
                className="card-avatar"
              >
                {item.authorName?.[0] ?? "?"}
              </Avatar>
              <span className="card-author-name" title={item.authorName}>
                {item.authorName || "匿名作者"}
              </span>
            </div>
            <div className="card-actions">
              <Button
                type="text"
                size="small"
                title="复制提示词"
                className="card-action-btn card-copy-btn"
                icon={<Copy size={15} />}
                onClick={copyPrompt}
              />
              <Button
                type="text"
                size="small"
                loading={liking}
                className={`card-action-btn card-like-btn${liked ? " liked" : ""}`}
                icon={
                  <Heart size={15} fill={liked ? "currentColor" : "none"} />
                }
                onClick={handleLike}
              >
                {likeCount}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MaterialList = ({
  list,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry,
  scrollerRef,
}: MaterialListProps) => {
  //渲染空状态
  const renderEmpty = () => (
    <div className="empty-state">
      <div className="empty-icon">
        <DEFAULT_ICONS.empty size={48} />
      </div>
      <h3 className="empty-title">暂无素材</h3>
      <p className="empty-desc">试试搜索其他关键词吧</p>
    </div>
  );

  //渲染错误状态
  const renderError = () => (
    <div className="error-state">
      <div className="error-icon">
        <DEFAULT_ICONS.error size={48} />
      </div>
      <h3 className="error-title">加载失败</h3>
      <p className="error-desc">{error?.message || "加载失败，请稍后重试"}</p>
      <button className="error-action" onClick={onRetry}>
        重新加载
      </button>
    </div>
  );

  // 渲染骨架屏：按 MaterialItem 结构占位（图片比例 + 标题/风格/质量/作者/点赞信息区），
  // 图片用与真实数据一致的 aspectRatio 占位，加载完成后无需重排
  const renderSkeleton = () => (
    <Masonry
      columns={4}
      gutter={10}
      items={Array.from({ length: 8 }, (_, i) => ({
        key: `skeleton-${i}`,
        data: SKELETON_PROPORTIONS[i % SKELETON_PROPORTIONS.length],
      }))}
      itemRender={({ data }) => (
        <div className="material-card material-card-skeleton">
          <div
            className="card-image-wrapper"
            style={{ aspectRatio: getRatioValue(data) }}
          >
            <div className="card-skeleton-placeholder">
              <Skeleton.Image active className="card-skeleton-img" />
            </div>
          </div>
          <div className="card-info-skeleton">
            {/* 标题：对应 MaterialItem.title */}
            <Skeleton active title={{ width: "80%" }} paragraph={false} />
            {/* 参数 chips：对应 params.style / params.imageQuality */}
            <div className="skeleton-chips">
              <Skeleton.Button
                active
                size="small"
                shape="round"
                style={{ width: 56, height: 22 }}
              />
              <Skeleton.Button
                active
                size="small"
                shape="round"
                style={{ width: 64, height: 22 }}
              />
            </div>
            {/* 作者 + 点赞：对应 authorName / likeCount */}
            <div className="skeleton-meta">
              <Skeleton.Avatar active size="small" shape="circle" />
              <Skeleton.Input active size="small" style={{ width: 88 }} />
              <Skeleton.Input active size="small" style={{ width: 40 }} />
            </div>
          </div>
        </div>
      )}
    />
  );

  //渲染内容
  const renderContent = () => (
    <>
      <Masonry
        columns={4}
        gutter={10}
        // fresh：图片按真实比例加载完成后高度变化时，通过逐项 ResizeObserver 重新测量布局
        fresh
        items={list.map((item) => ({
          key: item.id,
          data: item,
        }))}
        itemRender={({ data }) => (
          <MaterialCard item={data} scrollerRef={scrollerRef} />
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
        {loading
          ? renderSkeleton()
          : error
            ? renderError()
            : list.length > 0
              ? renderContent()
              : renderEmpty()}
      </div>
    </div>
  );
};

export default MaterialList;
