/**
 * SSE 客户端工具（生产级增强版）
 * 基于 ReadableStream 解析 SSE 协议，支持：
 *  - Buffer 缓冲 + rAF 节流渲染
 *  - 自动重连（指数退避 + 随机抖动 + 最大重试次数）
 *  - 心跳保活 / 半开连接检测（注释帧 + 无事件超时主动断连）
 *  - Last-Event-ID 断点续传
 *  - 动态鉴权头注入（每次连接 / 重连实时获取 token）
 */

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
}

export interface SSEOptions {
  /** 请求 URL */
  url: string;
  /** 请求体（POST 方式发送） */
  body?: Record<string, unknown>;
  /** 每次收到业务事件的回调（不含心跳注释帧） */
  onMessage: (event: SSEEvent) => void;
  /** 连接错误回调（达到最大重试次数后才会触发；中间重试只触发 onReconnecting） */
  onError?: (error: Error) => void;
  /** 连接正常结束回调（由服务端正常关闭流触发） */
  onDone?: () => void;
  /** 自定义请求头（静态，动态鉴权使用 getAuthHeaders） */
  headers?: Record<string, string>;
  /** 动态获取鉴权头，每次建立/重连时调用，支持异步 */
  getAuthHeaders?: () =>
    | Record<string, string>
    | Promise<Record<string, string>>;
  /** 渲染节流间隔（ms），默认 50 */
  throttleMs?: number;

  // ====== 重连策略 ======
  /** 最大重试次数，默认 5；设为 0 则不重试 */
  maxRetries?: number;
  /** 基础退避时长（ms），默认 1000；实际 delay = base * 2^n * (0.8 ~ 1.2) */
  baseRetryDelayMs?: number;
  /** 触发重试前回调（可用于 UI 提示「正在第 n 次重连」） */
  onReconnecting?: (retryCount: number, delayMs: number) => void;
  /** 重连成功回调 */
  onReconnected?: () => void;

  // ====== 心跳保活 ======
  /** 无事件超时时长（ms），默认 60000；超过此时长未收到任何帧则主动断连并重连 */
  heartbeatTimeoutMs?: number;
}

/**
 * 解析 SSE 文本流为事件对象数组
 * 支持：
 *  - 多行 data 合并（换行拼接）
 *  - `:` 开头注释帧（返回 isComment=true，用于刷新心跳计时）
 *  - id / event / retry 字段
 */
interface ParsedEvent {
  events: SSEEvent[];
  /** 本次 chunk 是否包含注释帧（用于刷新心跳） */
  hasComment: boolean;
}

// 解析 SSE 文本流为事件对象数组
function parseSSEChunk(chunk: string): ParsedEvent {
  const events: SSEEvent[] = [];
  let hasComment = false;
  const lines = chunk.split("\n");

  let currentEvent: Partial<SSEEvent> = {};

  for (const rawLine of lines) {
    // 去 CRLF 的 \r
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;

    if (line === "") {
      // 空行表示一个事件结束
      if (currentEvent.data !== undefined) {
        events.push(currentEvent as SSEEvent);
      }
      currentEvent = {};
      continue;
    }

    if (line.startsWith(":")) {
      // SSE 注释帧（心跳），不产出事件但刷新心跳计时
      hasComment = true;
      continue;
    }

    const colonIdx = line.indexOf(":");
    const field = colonIdx === -1 ? line : line.slice(0, colonIdx);
    // 规范允许冒号后接一个空格作为分隔，跳过
    const value =
      colonIdx === -1
        ? ""
        : line.slice(line[colonIdx + 1] === " " ? colonIdx + 2 : colonIdx + 1);

    switch (field) {
      case "event":
        currentEvent.event = value;
        break;
      case "data":
        currentEvent.data = currentEvent.data
          ? currentEvent.data + "\n" + value
          : value;
        break;
      case "id":
        // 规范：id 不能包含空字符，这里简单跳过空 id
        if (value.indexOf("\0") === -1) {
          currentEvent.id = value;
        }
        break;
      case "retry":
        // 服务端建议的重连间隔（暂不使用，保留扩展点）
        break;
      default:
        // 未知字段按规范忽略
        break;
    }
  }

  return { events, hasComment };
}

/** 指数退避 + 随机抖动，避免羊群效应 */
function getRetryDelay(baseMs: number, retryCount: number): number {
  const exponential = baseMs * Math.pow(2, retryCount);
  const jitter = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
  return Math.floor(exponential * jitter);
}

/**
 * SSE 连接控制器：扩展 AbortController，额外暴露「永久停止（不再重试）」语义
 */
export interface SSEController extends AbortController {
  /** 永久停止：断开连接并取消后续所有自动重连 */
  stopPermanently(): void;
}

// 创建 SSE 连接控制器
function createSSEController(): SSEController {
  const controller = new AbortController() as SSEController;
  (controller as any)._permanentStop = false;
  controller.stopPermanently = () => {
    (controller as any)._permanentStop = true;
    controller.abort();
  };
  return controller;
}

// 检查控制器是否已永久停止
function isPermanentStop(controller: SSEController): boolean {
  return (controller as any)._permanentStop === true;
}

/**
 * 创建 SSE 连接（POST 方式）
 * 返回 SSEController，调用 .abort() 可暂停当前连接（若未达最大重试会继续重连），
 * 调用 .stopPermanently() 则彻底终止并不再重连。
 */
export function createSSE(options: SSEOptions): SSEController {
  const {
    url,
    body,
    onMessage,
    onError,
    onDone,
    headers = {},
    getAuthHeaders,
    throttleMs = 50,
    maxRetries = 5,
    baseRetryDelayMs = 1000,
    onReconnecting,
    onReconnected,
    heartbeatTimeoutMs = 60_000,
  } = options;

  const controller = createSSEController();
  let retryCount = 0;
  let lastEventId: string | null = null;
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  // 标记当前这次连接是否为「重连」（用于决定是否注入 lastEventId 与触发 onReconnected）
  let isReconnect = false;

  /** 清心跳计时 */
  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  /** 重置心跳计时 */
  const resetHeartbeat = () => {
    clearHeartbeat();
    heartbeatTimer = setTimeout(() => {
      // 超时：说明半开/死连接，主动断开，触发重连逻辑
      console.warn(`[SSE] ${heartbeatTimeoutMs}ms 无事件，主动断开重连`);
      currentInnerAbort?.abort();
    }, heartbeatTimeoutMs);
  };

  // 用于内部单次连接的 abort（与永久停止的 controller 区分）
  let currentInnerAbort: AbortController | null = null;

  /** 执行一次实际连接（递归调用实现重连） */
  const runOnce = async () => {
    // 如果外部永久停止了，直接返回
    if (isPermanentStop(controller)) return;

    // 当前连接级 Abort，既能被心跳/重试打断，也会被外部 controller.abort 连带打断
    const innerAbort = new AbortController();
    currentInnerAbort = innerAbort;
    const linkOnOuterAbort = () => innerAbort.abort();
    controller.signal.addEventListener("abort", linkOnOuterAbort);

    let renderBuffer: SSEEvent[] = [];
    let rafId: number | null = null;
    let lastFlushTime = 0;
    let partialData = "";
    let finishedNormally = false;

    const flush = () => {
      if (renderBuffer.length === 0) return;
      const events = [...renderBuffer];
      renderBuffer = [];
      events.forEach((event) => {
        // 更新 Last-Event-ID（如果有）
        if (event.id) lastEventId = event.id;
        onMessage(event);
      });
    };

    const throttledFlush = () => {
      const now = Date.now();
      if (now - lastFlushTime >= throttleMs) {
        flush();
        lastFlushTime = now;
      } else if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          flush();
          lastFlushTime = Date.now();
          rafId = null;
        });
      }
    };

    try {
      // 动态获取鉴权头（支持异步）
      const authHeaders = getAuthHeaders ? await getAuthHeaders() : {};

      // 注入 Last-Event-ID（重连且有缓存 id 时）
      const finalBody: Record<string, unknown> = { ...(body || {}) };
      if (isReconnect && lastEventId) {
        finalBody.lastEventId = lastEventId;
      }

      const mergedHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...headers,
        ...authHeaders,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: mergedHeaders,
        body:
          Object.keys(finalBody).length > 0
            ? JSON.stringify(finalBody)
            : undefined,
        signal: innerAbort.signal,
      });

      if (!response.ok) {
        throw new Error(
          `AI服务请求失败: ${response.status} ${response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      // HTTP 建连成功：如果是重连，通知业务层
      if (isReconnect) {
        onReconnected?.();
        isReconnect = false;
      }
      // 首次/重连成功后重置重试计数
      retryCount = 0;

      const decoder = new TextDecoder();
      resetHeartbeat();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 服务端正常结束流
          finishedNormally = true;
          if (partialData) {
            const { events } = parseSSEChunk(partialData);
            renderBuffer.push(...events);
          }
          flush();
          clearHeartbeat();
          onDone?.();
          break;
        }

        // 解码并拼接不完整的数据
        const text = partialData + decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        partialData = lines.pop() || "";

        const { events, hasComment } = parseSSEChunk(lines.join("\n") + "\n");
        if (events.length > 0 || hasComment) {
          resetHeartbeat();
        }
        if (events.length > 0) {
          renderBuffer.push(...events);
          throttledFlush();
        }
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error(typeof err === "string" ? err : "SSE 未知错误");

      // 清渲染 & 心跳
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearHeartbeat();

      // 主动取消的情况：分两种语义
      if (error.name === "AbortError") {
        // 永久停止：彻底结束，不重连
        if (isPermanentStop(controller)) return;
        // 否则是心跳超时/内部主动断：走重连逻辑
      }

      // 是否达到最大重试次数
      if (retryCount >= maxRetries) {
        onError?.(error);
        return;
      }

      // 进入重连流程
      retryCount += 1;
      const delayMs = getRetryDelay(baseRetryDelayMs, retryCount - 1);
      onReconnecting?.(retryCount, delayMs);
      isReconnect = true;

      retryTimer = setTimeout(() => {
        retryTimer = null;
        runOnce();
      }, delayMs);
    } finally {
      controller.signal.removeEventListener("abort", linkOnOuterAbort);
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearHeartbeat();
      // 正常结束（非异常非取消）就不重连；未 finishedNormally 已在 catch 中处理重连
      if (finishedNormally) {
        // noop，正常结束不再重连
      }
    }
  };

  // 监听外部永久停止：如果有重试在排队，立即取消
  controller.signal.addEventListener("abort", () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  });

  // 启动第一次连接
  void runOnce();

  return controller;
}
