"use client";

import "./creation.scss";

import Aside from "@/components/creation/Aside/aside";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { useState, useCallback, useEffect, useRef } from "react";
import { useUserStore } from "@/store/user";
import { useRequest } from "ahooks";
import API from "@/api";
import { createSSE } from "@/utils/sseClient";
import type { SSEEvent } from "@/utils/sseClient";

import {
  HistoryContent,
  WorkMessage,
} from "@/components/creation/message/message";

import { ExampleContent } from "@/components/creation/example/example";
// ==================== 类型定义 ====================

/** SSE 事件解析后的结构 */
interface SSEStepData {
  seq_id: number;
  type: string;
  status: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// ==================== 主页面 ====================

const CreationPage = () => {
  const [activeMenu, setActiveMenu] = useState("textToImage");
  const [activeTab, setActiveTab] = useState("1");
  const [messageList, setMessageList] = useState<WorkMessage[]>([]);
  const userId = useUserStore((state) => state.userInfo)?.userId;
  const sseAbortRef = useRef<AbortController | null>(null);

  // 获取历史对话记录（ahooks 管理 loading / error / 手动刷新）
  const {
    loading: historyLoading,
    error: historyError,
    run: fetchHistory,
  } = useRequest(
    async () => {
      const res = await API.getWorkList({ currentPage: 1, pageSize: 10 });
      return res.data?.list || [];
    },
    {
      onSuccess: (list) => setMessageList(list),
      onError: (e) => console.log("获取历史记录报错", e),
    },
  );

  // 更新指定消息的状态
  const updateMessage = useCallback(
    (id: number, updater: (msg: WorkMessage) => WorkMessage) => {
      setMessageList((prev) =>
        prev.map((msg) => (msg.id === id ? updater(msg) : msg)),
      );
    },
    [],
  );

  // 处理 SSE 事件
  const handleSSEEvent = useCallback(
    (workId: number, event: SSEEvent) => {
      try {
        const stepData: SSEStepData = JSON.parse(event.data);
        updateMessage(workId, (msg) => ({
          ...msg,
          status: 1, // 处理中
          sseStatus: stepData.status,
        }));

        // 如果是生成完成事件，更新结果
        if (stepData.type === "generation_complete" && stepData.data?.url) {
          updateMessage(workId, (msg) => ({
            ...msg,
            status: 2, // 已完成
            resultUrl: stepData.data.url as string,
            sseStatus: "生成完成",
          }));
        }
      } catch (e) {
        console.error("解析 SSE 事件失败:", e);
      }
    },
    [updateMessage],
  );

  // 提交创作：先存 Java → 再建立 SSE
  const setChatMessage = useCallback(
    async (workData: WorkMessage) => {
      // 1. 先将消息加入列表（待处理状态）
      setMessageList((prev) => [workData, ...prev]);

      // 2. 建立 SSE 连接到 agent 端
      const abortController = createSSE({
        url: "/ai-api/v1/text-to-image/generate",
        body: {
          threadId: workData.id,
          userId,
          prompt: workData.prompt,
          params: workData.params,
        },
        onMessage: (event) => {
          handleSSEEvent(workData.id, event);
        },
        onError: (error) => {
          console.error("SSE 连接错误:", error);
          updateMessage(workData.id, (msg) => ({
            ...msg,
            status: 3, // 失败
            sseStatus: "生成失败",
          }));
        },
        onDone: () => {
          // 流结束但没有收到完成事件，标记为已完成
          updateMessage(workData.id, (msg) => {
            if (msg.status === 1) {
              return { ...msg, status: 2, sseStatus: "生成完成" };
            }
            return msg;
          });
        },
      });

      sseAbortRef.current = abortController;
    },
    [userId, handleSSEEvent, updateMessage],
  );

  // 组件卸载时取消 SSE 连接
  useEffect(() => {
    return () => {
      sseAbortRef.current?.abort();
    };
  }, []);

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
          onRetry={fetchHistory}
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
