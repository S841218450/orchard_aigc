"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useRequest, useScroll } from "ahooks";
import messageManager from "@/utils/messageManager";

/** 分页接口统一返回结构 */
export interface PageListResult<T> {
  list: T[];
  hasMore: boolean;
}

export interface UseInfiniteListOptions<T> {
  /** 分页拉取函数：入参页码（从 1 开始），返回该页列表与是否还有更多 */
  fetcher: (pageNum: number) => Promise<PageListResult<T>>;
  /** 首屏加载依赖，变化时自动重新加载第一页（如搜索关键词） */
  refreshDeps?: unknown[];
  /** 滚动容器 ref，传入后滚动到底部自动加载下一页 */
  containerRef?: RefObject<HTMLElement | null>;
  /** 触底加载阈值（px），默认 200 */
  threshold?: number;
  /** 加载更多失败时的轻提示文案 */
  loadMoreErrorMessage?: string;
}

/**
 * 通用滚动分页列表 Hook：
 * - 首屏自动加载第一页，refreshDeps 变化时自动重置并重新加载
 * - 滚动到底部自动加载下一页，失败后停止自动加载并支持手动重试
 */
export function useInfiniteList<T>({
  fetcher,
  refreshDeps = [],
  containerRef,
  threshold = 200,
  loadMoreErrorMessage = "加载更多失败，请检查网络后重试",
}: UseInfiniteListOptions<T>) {
  const [list, setList] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  // 始终持有最新的 fetcher，避免外部依赖（如搜索关键词）变化时闭包过期
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // 首屏加载（挂载自动执行；refreshDeps 变化时重新加载第一页）
  const { loading, error, run } = useRequest(
    () => fetcherRef.current(1),
    {
      manual: false,
      refreshDeps,
      onSuccess: (result) => {
        setList(result.list);
        setHasMore(result.hasMore);
        setPage(1);
        setLoadMoreFailed(false);
      },
    },
  );

  // 首屏 loading 最新值（供 loadMore 防重入判断）
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  // 加载下一页
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loadingRef.current || loadMoreFailed) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetcherRef.current(nextPage);
      setList((prev) => [...prev, ...result.list]);
      setHasMore(result.hasMore);
      setPage(nextPage);
      setLoadMoreFailed(false);
    } catch {
      setLoadMoreFailed(true);
      messageManager.error(loadMoreErrorMessage);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, loadMoreFailed, loadMoreErrorMessage]);

  // 滚动到底部自动加载下一页（clientHeight 为 0 表示容器隐藏，跳过避免误触底）
  const scrollPosition = useScroll(containerRef);
  useEffect(() => {
    if (!containerRef?.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (
      clientHeight > 0 &&
      scrollHeight - scrollTop - clientHeight < threshold
    ) {
      loadMore();
    }
  }, [scrollPosition, loadMore, threshold, containerRef]);

  // 失败重试：重置失败标记并重新加载第一页
  const retry = useCallback(() => {
    setLoadMoreFailed(false);
    run();
  }, [run]);

  return {
    list,
    setList,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMoreFailed,
    loadMore,
    retry,
  };
}

export default useInfiniteList;
