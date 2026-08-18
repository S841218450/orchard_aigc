"use client";
import WorkList from "./component/workList/workList";
import WorkMasonry from "./component/workMasonry/workMasonry";
import "./mywork.scss";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "antd";
import {
  Search,
  FolderOpen,
  Grid3X3,
  List,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import { getWorkList, deleteWork } from "@/actions/creation";
import type { WorkMessage } from "@/actions/types";
import useInfiniteList from "@/hooks/useInfiniteList";
import messageManager from "@/utils/messageManager";
import UserCenterBackground from "@/components/userCenter/pageBackground/pageBackground";

// 每页条数（瀑布流首屏数量）
const PAGE_SIZE = 12;

const MyWorkPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  // 滚动容器：mywork-content，滚动到底自动加载下一页
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    list: materialList,
    setList,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  } = useInfiniteList<WorkMessage>({
    fetcher: async (pageNum) => {
      // 类型/标签过滤由服务端完成：type 对应素材类型，搜索关键词对应 tag
      const res = await getWorkList(
        pageNum,
        PAGE_SIZE,
        filterType === "all" ? undefined : filterType,
        searchKeyword.trim() || undefined,
      );
      if (!res.success) throw new Error(res.error ?? "获取作品列表失败");
      return {
        // 后端对未生成图片的记录 dataList 可能为 null，空值守卫后过滤掉无图片项
        list: res.data.filter((item) => (item.dataList?.length ?? 0) > 0),
        hasMore: res.data.length >= PAGE_SIZE,
      };
    },
    containerRef: contentRef,
    // 筛选条件变化时重新拉取第一页
    refreshDeps: [filterType, searchKeyword],
  });

  // 删除记录
  const handleDelete = async (item: WorkMessage) => {
    const res = await deleteWork(item.id);
    if (res.success) {
      messageManager.success("删除成功");
      setList((prev) => prev.filter((m) => m.id !== item.id));
    } else {
      messageManager.error(res.error ?? "删除失败");
    }
  };

  return (
    <div className="mywork-page">
      <UserCenterBackground tone="warm" />
      <div className="mywork-header">
        <div className="header-left">
          <h1>
            <FolderOpen size={24} />
            我的资产
          </h1>
          <span className="work-count">{materialList.length} 个项目</span>
        </div>
        <Button
          type="primary"
          onClick={() => router.push("/creation")}
          icon={<Plus size={16} />}
        >
          新建项目
        </Button>
      </div>

      <div className="mywork-toolbar">
        <div className="toolbar-left">
          <Input
            prefix={<Search size={16} />}
            placeholder="搜索项目..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
            options={[
              { label: "全部类型", value: "all" },
              { label: "图片", value: "image" },
              { label: "文案", value: "text" },
              { label: "视频", value: "video" },
            ]}
          />
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <Button
              type={viewMode === "grid" ? "primary" : "text"}
              icon={<Grid3X3 size={16} />}
              onClick={() => setViewMode("grid")}
            />
            <Button
              type={viewMode === "list" ? "primary" : "text"}
              icon={<List size={16} />}
              onClick={() => setViewMode("list")}
            />
          </div>
          <Button icon={<SlidersHorizontal size={16} />}>筛选</Button>
        </div>
      </div>

      <div className="mywork-content" ref={contentRef}>
        {viewMode === "grid" ? (
          <WorkMasonry
            list={materialList}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={loadMore}
            onRetry={retry}
          />
        ) : (
          <WorkList
            list={materialList}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={loadMore}
            onRetry={retry}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default MyWorkPage;
