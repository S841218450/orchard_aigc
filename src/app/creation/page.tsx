"use client";

import "./creation.scss";

import Aside from "@/app/creation/components/Aside/aside";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { useState, useCallback } from "react";
import { useUserStore } from "@/store/user";
import { useRequest } from "ahooks";

import { HistoryContent } from "@/components/creation/message/message";
import type { WorkMessage, SelectAnswer } from "@/actions/types";

import { ExampleContent } from "@/components/creation/example/example";
import { getWorkList, deleteWork } from "@/actions/creation";
import { useCreationSSE } from "@/hooks/SSEhooks/useCreationSSE";
import messageManager from "@/utils/messageManager";

// ==================== 主页面 ====================

const CreationPage = () => {
  const [activeMenu, setActiveMenu] = useState("textToImage");
  const [activeTab, setActiveTab] = useState("2"); //默认展示案例
  const [messageList, setMessageList] = useState<WorkMessage[]>([]);
  // 分页状态（与首页素材列表滚动加载保持一致）
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // 加载更多失败标志：失败后停止自动加载，避免服务器异常时无限重试
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const PAGE_SIZE = 10;
  const userId = useUserStore((state) => state.userInfo)?.userId;

  // 更新指定消息的状态
  const updateMessage = useCallback(
    (id: string, updater: (msg: WorkMessage) => WorkMessage) => {
      setMessageList((prev) =>
        prev.map((msg) => (msg.id === id ? updater(msg) : msg)),
      );
    },
    [],
  );

  // 文生图 SSE hook（业务封装）
  const { submitCreation, regenerate, submitSelect, retry } = useCreationSSE({
    onUpdateMessage: updateMessage,
  });

  // 获取历史对话记录（第一页，加载结果直接替换列表）
  const {
    loading: historyLoading,
    error: historyError,
    run: fetchHistory,
  } = useRequest(
    async () => {
      const result = await getWorkList(1, PAGE_SIZE);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error ?? "获取历史记录失败");
    },
    {
      onSuccess: (list) => {
        setMessageList(list);
        setPage(1);
        setHasMore(list.length >= PAGE_SIZE);
        setLoadMoreFailed(false);
      },
      onError: (e) => console.log("获取历史记录报错", e),
    },
  );

  // 实际加载下一页逻辑（不拦截 loadMoreFailed，供失败后手动重试复用）
  const doLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || historyLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getWorkList(nextPage, PAGE_SIZE);
      if (result.success) {
        const list = result.data;
        setMessageList((prev) => [...prev, ...list]);
        setHasMore(list.length >= PAGE_SIZE);
        setPage(nextPage);
        setLoadMoreFailed(false);
      } else {
        setLoadMoreFailed(true);
        messageManager.error("加载更多失败，请检查网络后重试");
      }
    } catch (e) {
      setLoadMoreFailed(true);
      messageManager.error("加载更多失败，请检查网络后重试");
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, historyLoading]);

  // 滚动到底部自动加载更多（失败后停止自动加载）
  const loadMoreHistory = useCallback(() => {
    if (loadMoreFailed) return;
    doLoadMore();
  }, [doLoadMore, loadMoreFailed]);

  // 加载更多失败后手动重试
  const handleRetryLoadMore = useCallback(() => {
    setLoadMoreFailed(false);
    doLoadMore();
  }, [doLoadMore]);

  // 删除指定消息
  const handleDelete = useCallback(async (message: WorkMessage) => {
    const result = await deleteWork(message.id);
    if (result.success) {
      messageManager.success("删除成功");
      setMessageList((prev) => prev.filter((item) => item.id !== message.id));
    } else {
      messageManager.error(result.error ?? "删除失败");
    }
  }, []);

  // 提交创作
  const setChatMessage = useCallback(
    async (workData: WorkMessage) => {
      // 提交创作后，切换到生成历史标签页
      if (activeTab === "2") setActiveTab("1");
      // 先将消息加入列表
      setMessageList((prev) => [workData, ...prev]);

      // 建立 SSE 连接（携带参考图时自动走图生图接口）
      submitCreation(workData.id, userId!, {
        type: workData.type,
        model: workData.model,
        prompt: workData.prompt,
        params: workData.params,
        originImageList: workData.originImageList,
      });
    },
    [userId, submitCreation],
  );

  // 重新生成
  const handleRegenerate = useCallback(
    (message: WorkMessage) => {
      regenerate(message.id, userId!, {
        prompt: message.prompt,
        params: message.params,
        originImageList: message.originImageList,
      });
    },
    [userId, regenerate],
  );

  // 提交补充问题选择
  const handleSelectSubmit = useCallback(
    (message: WorkMessage, answers: SelectAnswer[]) => {
      submitSelect(message.id, userId!, answers);
    },
    [userId, submitSelect],
  );

  // 重试（根据是否携带参考图选择图生图/文生图重试接口）
  const handleRetry = useCallback(
    (message: WorkMessage) => {
      retry(message.id, userId!, !!message.originImageList?.length);
    },
    [userId, retry],
  );

  // 标签页（编辑排印式 Tab：衬线编号 + 中文名）
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span className="creation-tab-label">
          <em className="creation-tab-index">01</em>生成历史
        </span>
      ),
      children: (
        <HistoryContent
          onSwitchTab={() => setActiveTab("2")}
          messageList={messageList}
          loading={historyLoading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          loadMoreError={loadMoreFailed}
          error={historyError}
          onRetry={handleRetry}
          onRegenerate={handleRegenerate}
          onSelectSubmit={handleSelectSubmit}
          onDelete={handleDelete}
          onRetryHistory={fetchHistory}
          onLoadMore={loadMoreHistory}
          onRetryLoadMore={handleRetryLoadMore}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span className="creation-tab-label">
          <em className="creation-tab-index">02</em>优秀案例
        </span>
      ),
      children: <ExampleContent />,
    },
  ];

  const changeTab = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className="creation-page">
      <Aside onMenuChange={setActiveMenu} setChatMessage={setChatMessage} />
      <div className="creation-content-container">
        <Tabs
          className="creation-tabs"
          activeKey={activeTab}
          items={items}
          onChange={changeTab}
          destroyOnHidden={false}
        />
      </div>
    </div>
  );
};

export default CreationPage;
