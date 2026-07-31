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

import {
  HistoryContent,
  WorkMessage,
  SelectAnswer,
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
  // 记录 SSE 流中已出错的消息 ID（防止 done 事件覆盖错误状态）
  const sseErrorSetRef = useRef<Set<number>>(new Set());

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

  // 删除指定消息（从列表中移除）
  const handleDelete = useCallback((message: WorkMessage) => {
    setMessageList((prev) => prev.filter((item) => item.id !== message.id));
  }, []);

  // 更新指定消息的状态
  const updateMessage = useCallback(
    (id: number, updater: (msg: WorkMessage) => WorkMessage) => {
      setMessageList((prev) =>
        prev.map((msg) => (msg.id === id ? updater(msg) : msg)),
      );
    },
    [],
  );

  // 建立 SSE 连接的通用方法
  const createSSEConnection = useCallback(
    (workId: number, url: string, body: Record<string, unknown>) => {
      const abortController = createSSE({
        url,
        body,
        onMessage: (event) => {
          try {
            const stepData: SSEStepData = JSON.parse(event.data);
            // 根据事件类型更新消息状态
            updateMessage(workId, (msg) => {
              const base = {
                ...msg,
                status: 1 as const,
                sseStatus: stepData.status,
              };

              switch (stepData.type) {
                case "step_generate": {
                  // 生成图片事件，更新图片URL
                  const url = stepData.data?.url as string | undefined;
                  return url ? { ...base, resultUrl: url } : base;
                }
                case "human_in_the_loop": {
                  // 补充问题事件
                  return {
                    ...base,
                    status: 4 as const,
                    sseStepType: "human_in_the_loop",
                    operationData: {
                      selectList: (stepData.data as any)?.interrupt?.question_list || [],
                    },
                  };
                }
                case "step_error":
                case "error": {
                  // 错误事件：标记该消息已出错
                  sseErrorSetRef.current.add(workId);
                  return {
                    ...base,
                    status: 3 as const,
                    sseStepType: "error",
                  };
                }
                case "done": {
                  // 完成事件：如果流中曾出现错误或处于人工介入状态，不覆盖
                  if (
                    sseErrorSetRef.current.has(workId) ||
                    msg.status === 3 ||
                    msg.status === 4
                  ) {
                    sseErrorSetRef.current.delete(workId);
                    return msg;
                  }
                  sseErrorSetRef.current.delete(workId);
                  return {
                    ...base,
                    status: 2 as const,
                    sseStatus: "生成完成",
                    sseStepType: undefined,
                    selectList: undefined,
                  };
                }
                default:
                  return base;
              }
            });
          } catch (e) {
            console.error("解析 SSE 事件失败:", e);
          }
        },
        onError: (error) => {
          console.error("SSE 连接错误:", error);
          updateMessage(workId, (msg) => ({
            ...msg,
            status: 3,
            sseStatus: "生成失败",
          }));
        },
        onDone: () => {
          // 流结束：只对仍在处理中的消息标记完成
          updateMessage(workId, (msg) => {
            if (msg.status === 1) {
              return { ...msg, status: 2, sseStatus: "生成完成" };
            }
            return msg;
          });
        },
      });
      sseAbortRef.current = abortController;
    },
    [updateMessage],
  );

  // 提交创作：先保存信息 → 再建立 SSE连接
  const setChatMessage = useCallback(
    async (workData: WorkMessage) => {
      // 1. 先将消息加入列表（待处理状态）
      setMessageList((prev) => [workData, ...prev]);

      // 2. 建立 SSE 连接到 agent 端
      createSSEConnection(workData.id, "/ai-api/v1/text-to-image/generate", {
        threadId: workData.id,
        userId,
        model: workData.model,
        prompt: workData.prompt,
        params: workData.params,
      });
    },
    [userId, createSSEConnection],
  );

  // 重新生成
  const handleRegenerate = useCallback(
    (message: WorkMessage) => {
      // 重置消息状态为处理中
      updateMessage(message.id, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "重新生成中...",
        sseStepType: undefined,
        selectList: undefined,
        humanInTheLoop: undefined,
        resultUrl: null,
      }));

      // 建立新的 SSE 连接
      createSSEConnection(message.id, "/ai-api/v1/text-to-image/generate", {
        threadId: message.id,
        userId,
        prompt: message.prompt,
        params: message.params,
      });
    },
    [userId, createSSEConnection, updateMessage],
  );

  // 提交补充问题选择
  const handleSelectSubmit = useCallback(
    (message: WorkMessage, answers: SelectAnswer[]) => {
      // 重置补充问题状态，标记为处理中
      updateMessage(message.id, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "正在根据补充信息生成...",
        sseStepType: undefined,
        selectList: undefined,
      }));

      // 请求 select 接口，后续依然是相同的 SSE 连接结构
      createSSEConnection(message.id, "/ai-api/v1/text-to-image/select", {
        threadId: message.id,
        userId,
        user_select: answers,
      });
    },
    [userId, createSSEConnection, updateMessage],
  );
  //结点报错重试
  const handleRetry = useCallback(
    (message: WorkMessage) => {
      updateMessage(message.id, (msg) => ({
        ...msg,
        status: 1,
        sseStatus: "尝试重试...",
      }));
      createSSEConnection(message.id, "/ai-api/v1/text-to-image/retry", {
        threadId: message.id,
        userId,
      });
    },
    [userId, createSSEConnection, updateMessage],
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
