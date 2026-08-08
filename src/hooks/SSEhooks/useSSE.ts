"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  createSSE,
  type SSEEvent,
  type SSEController,
} from "@/utils/sseClient";
import { useUserStore } from "@/store/user";

/** SSE 连接配置：URL、请求体与事件回调均由业务层传入 */
export interface SSEConnectOptions {
  /** 请求 URL（各业务接口地址不同） */
  url: string;
  /** 请求体 */
  body?: Record<string, unknown>;
  /** 每次收到事件的回调 */
  onMessage?: (event: SSEEvent) => void;
  /** 连接错误回调（达到最大重试次数后才会触发） */
  onError?: (error: Error) => void;
  /** 连接结束回调（服务端正常关闭流） */
  onDone?: () => void;
  /** 最大重试次数，默认 5；0=不重试 */
  maxRetries?: number;
  /** 基础退避时长 ms，默认 1000 */
  baseRetryDelayMs?: number;
  /** 正在第 n 次重连（可用于 UI 提示） */
  onReconnecting?: (retryCount: number, delayMs: number) => void;
  /** 重连成功回调 */
  onReconnected?: () => void;
  /** 无事件超时时长 ms，默认 60000 */
  heartbeatTimeoutMs?: number;
  /** 自定义静态 headers */
  headers?: Record<string, string>;
  /**
   * 是否自动注入 Authorization 头（从 Zustand userStore 取 token）
   * 默认 true；不需要时设为 false
   */
  autoAuth?: boolean;
}

/**
 * 通用 SSE 长连接 Hook（生产级增强）
 *
 * 连接生命周期：建立连接 / 手动永久断开 / 卸载时自动断开
 * 新增能力：
 *  - 指数退避自动重连 + 最大重试次数
 *  - 心跳保活 + 无事件超时半开检测
 *  - Last-Event-ID 断点续传（由 sseClient 内部维护）
 *  - 自动注入最新 Authorization 头（每次连接/重连实时取 token）
 *  - reconnecting / retryCount 响应式状态供 UI 使用
 */
export function useSSE() {
  const sseAbortRef = useRef<SSEController | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 组件卸载时取消 SSE 连接（永久停止，不再重连）
  useEffect(() => {
    return () => {
      sseAbortRef.current?.stopPermanently();
    };
  }, []);

  /** 建立 SSE 连接 */
  const connect = useCallback((options: SSEConnectOptions) => {
    const {
      url,
      body,
      onMessage,
      onError,
      onDone,
      maxRetries,
      baseRetryDelayMs,
      onReconnecting,
      onReconnected,
      heartbeatTimeoutMs,
      headers,
      autoAuth = true,
    } = options;

    // 如果已有旧连接，先永久停止
    sseAbortRef.current?.stopPermanently();

    setReconnecting(false);
    setRetryCount(0);

    const controller = createSSE({
      url,
      body,
      onMessage: onMessage ?? (() => {}),
      onError: (error) => {
        setReconnecting(false);
        onError?.(error);
      },
      onDone: () => {
        setReconnecting(false);
        onDone?.();
      },
      maxRetries,
      baseRetryDelayMs,
      onReconnecting: (count, delayMs) => {
        setReconnecting(true);
        setRetryCount(count);
        onReconnecting?.(count, delayMs);
      },
      onReconnected: () => {
        setReconnecting(false);
        setRetryCount(0);
        onReconnected?.();
      },
      heartbeatTimeoutMs,
      headers,
      // 动态鉴权头：每次连接/重连都从 Zustand 取最新 token
      getAuthHeaders: autoAuth
        ? () => {
            const token = useUserStore.getState().token;
            const header: Record<string, string> = {};
            if (token) header.Authorization = `Bearer ${token}`;
            return header;
          }
        : undefined,
    });

    sseAbortRef.current = controller;
    return controller;
  }, []);

  /**
   * 取消当前 SSE 连接（永久停止，不再自动重连）
   * 语义与旧版一致，保持向后兼容
   */
  const disconnect = useCallback(() => {
    sseAbortRef.current?.stopPermanently();
    sseAbortRef.current = null;
    setReconnecting(false);
    setRetryCount(0);
  }, []);

  return { connect, disconnect, reconnecting, retryCount };
}
