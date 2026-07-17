/**
 * SSE 客户端工具
 * 基于 ReadableStream 解析 SSE 协议，支持 Buffer 缓冲 + 节流渲染
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
  /** 每次收到事件的回调 */
  onMessage: (event: SSEEvent) => void;
  /** 连接错误回调 */
  onError?: (error: Error) => void;
  /** 连接结束回调 */
  onDone?: () => void;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 节流间隔（ms），默认 50 */
  throttleMs?: number;
}

/**
 * 解析 SSE 文本流为事件对象
 * 支持多行 data 合并
 */
function parseSSEChunk(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split("\n");

  let currentEvent: Partial<SSEEvent> = {};

  for (const line of lines) {
    if (line.startsWith("event:")) {
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      const data = line.slice(5).trim();
      currentEvent.data = currentEvent.data
        ? currentEvent.data + "\n" + data
        : data;
    } else if (line.startsWith("id:")) {
      currentEvent.id = line.slice(3).trim();
    } else if (line.trim() === "") {
      // 空行表示一个事件结束
      if (currentEvent.data !== undefined) {
        events.push(currentEvent as SSEEvent);
      }
      currentEvent = {};
    }
  }

  return events;
}

/**
 * 创建 SSE 连接（POST 方式）
 * 使用 ReadableStream + Buffer 缓冲 + requestAnimationFrame 节流
 */
export function createSSE(options: SSEOptions): AbortController {
  const {
    url,
    body,
    onMessage,
    onError,
    onDone,
    headers = {},
    throttleMs = 50,
  } = options;

  const abortController = new AbortController();
  let buffer: SSEEvent[] = [];
  let rafId: number | null = null;
  let lastFlushTime = 0;
  let partialData = ""; // 处理不完整的 SSE 行

  // 刷新缓冲区，将事件批量传递给回调
  const flush = () => {
    if (buffer.length === 0) return;
    const events = [...buffer];
    buffer = [];
    events.forEach((event) => onMessage(event));
  };

  // 节流刷新
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

  // 发起请求
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `SSE 请求失败: ${response.status} ${response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 处理剩余数据
          if (partialData) {
            const events = parseSSEChunk(partialData);
            buffer.push(...events);
          }
          flush();
          onDone?.();
          break;
        }

        // 解码并拼接不完整的数据
        const text = partialData + decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        // 最后一行可能不完整，保留到下次处理
        partialData = lines.pop() || "";

        const events = parseSSEChunk(lines.join("\n") + "\n");
        buffer.push(...events);
        throttledFlush();
      }
    })
    .catch((error) => {
      if (error.name === "AbortError") return; // 主动取消，不报错
      onError?.(error);
    });

  return abortController;
}
