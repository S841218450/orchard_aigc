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
  const [activeTab, setActiveTab] = useState("1");
  const [messageList, setMessageList] = useState<WorkMessage[]>([]);
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

  // 获取历史对话记录
  const {
    loading: historyLoading,
    error: historyError,
    run: fetchHistory,
  } = useRequest(
    async () => {
      const result = await getWorkList(1, 10);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error ?? "获取历史记录失败");
    },
    {
      onSuccess: (list) => setMessageList(list),
      onError: (e) => console.log("获取历史记录报错", e),
    },
  );

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
      // 先将消息加入列表
      setMessageList((prev) => [workData, ...prev]);

      // 建立 SSE 连接
      submitCreation(workData.id, userId!, {
        model: workData.model,
        prompt: workData.prompt,
        params: workData.params,
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

  // 重试
  const handleRetry = useCallback(
    (message: WorkMessage) => {
      retry(message.id, userId!);
    },
    [userId, retry],
  );

  // 标签页
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "生成历史",
      children: (
        <HistoryContent
          activeKey={activeMenu}
          onSwitchTab={() => setActiveTab("2")}
          messageList={messageList}
          loading={historyLoading}
          error={historyError}
          onRetry={handleRetry}
          onRegenerate={handleRegenerate}
          onSelectSubmit={handleSelectSubmit}
          onDelete={handleDelete}
          onRetryHistory={fetchHistory}
        />
      ),
    },
    {
      key: "2",
      label: "优秀案例",
      children: <ExampleContent activeKey={activeMenu} />,
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
        />
      </div>
    </div>
  );
};

export default CreationPage;
