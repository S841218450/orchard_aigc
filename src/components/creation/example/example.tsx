"use client";

import { useRef } from "react";
import MaterialList from "@/components/home/materialList/materialList";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import type { MaterialItem } from "@/actions/home";
import { formatDate } from "@/utils/timeUtils";
// ==================== 优秀案例组件 ====================
import "./example.scss";

// 优秀案例 mock 数据源（暂未接入真实接口，本地生成全量后走统一分页）
// 追加尺寸/压缩参数，避免拉取原图导致解码与滚动绘制开销过大
const MOCK_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f",
  "https://images.unsplash.com/photo-1507513319174-e556268bb244",
  "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2",
  "https://images.unsplash.com/photo-1492778297155-7be4c83960c7",
  "https://images.unsplash.com/photo-1508062878650-88b52897f298",
  "https://images.unsplash.com/photo-1506158278516-d720e72406fc",
  "https://images.unsplash.com/photo-1552203274-e3c7bd771d26",
  "https://images.unsplash.com/photo-1528163186890-de9b86b54b51",
  "https://images.unsplash.com/photo-1727423304224-6d2fd99b864c",
  "https://images.unsplash.com/photo-1675090391405-432434e23595",
  "https://images.unsplash.com/photo-1554196967-97a8602084d9",
  "https://images.unsplash.com/photo-1491961865842-98f7befd1a60",
  "https://images.unsplash.com/photo-1721728613411-d56d2ddda959",
  "https://images.unsplash.com/photo-1731901245099-20ac7f85dbaa",
  "https://images.unsplash.com/photo-1617694455303-59af55af7e58",
  "https://images.unsplash.com/photo-1709198165282-1dab551df890",
].map((url) => `${url}?w=600&q=80&auto=format&fit=crop`);

// 每页数量（与首页素材列表保持一致）
const PAGE_SIZE = 12;

// 生成 80 条 mock 素材，适配 MaterialItem 结构
const buildMockMaterialList = (): MaterialItem[] => {
  const items: MaterialItem[] = [];
  for (let i = 0; i < 80; i++) {
    items.push({
      id: `example-${i}`,
      authorName: `创作者${(i % 8) + 1}`,
      authorAvatar: "",
      url: MOCK_IMAGE_URLS[i % MOCK_IMAGE_URLS.length],
      userId: `user-${i}`,
      image: MOCK_IMAGE_URLS[i % MOCK_IMAGE_URLS.length],
      title: `AI 生成插画 - 科技未来城市${(i % 16) + 1}`,
      prompt: `AI 生成插画 - 科技未来城市${(i % 16) + 1}`,
      createTime: formatDate(
        new Date(`2023-08-${String((i % 28) + 1).padStart(2, "0")} 10:00`),
      ),
      likeCount: (i * 13) % 500,
      liked: i % 3 === 0,
      params: {
        style: "插画",
        imageQuality: "高清",
        imageProportion: "1:1",
      },
    });
  }
  return items;
};

const mockAllList = buildMockMaterialList();

export const ExampleContent = () => {
  // 滚动容器（.example-list 为实际可滚动区域）
  const listRef = useRef<HTMLDivElement>(null);

  // 本地 mock 分页：按页从全量数据中切片，模拟接口返回结构
  const { list, loading, loadingMore, hasMore, error, loadMore, retry } =
    useInfiniteList<MaterialItem>({
      fetcher: async (pageNum) => {
        const start = (pageNum - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return {
          list: mockAllList.slice(start, end),
          hasMore: end < mockAllList.length,
        };
      },
      containerRef: listRef,
    });

  return (
    <div className="example-content">
      <div className="example-option" />
      <div className="example-list" ref={listRef}>
        <MaterialList
          list={list}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
          onRetry={retry}
        />
      </div>
    </div>
  );
};
