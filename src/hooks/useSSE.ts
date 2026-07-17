import { useState, useRef, useCallback } from "react";
import { useUserStore } from "@/store/user";

interface SSEOptions {
  url: string;
  params: Record<string, any>;
  onStart?: () => void;
  onMessage?: (data: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

interface SSEReturn {
  isLoading: boolean;
  error: Error | null;
  sendMessage: (params: Record<string, any>) => void;
  stopMessage: () => void;
}

export const useSSE = (options: SSEOptions): SSEReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // 在 hook 内部获取 store 状态
  const token = useUserStore((state) => state.token);
  const userId = useUserStore((state) => state.userInfo?.userId);

  const getConfig = useCallback(
    () => ({
      baseURL: import.meta.env.PROD ? "" : "/ai-api",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Access-Token": token || "",
        user_id: userId ?? "",
      },
    }),
    [token, userId],
  );

  const stopMessage = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (params: Record<string, any>) => {
      const { url, onStart, onMessage, onComplete, onError } =
        optionsRef.current;

      // 停止之前的请求
      stopMessage();

      const controller = new AbortController();
      controllerRef.current = controller;
      setIsLoading(true);
      setError(null);
      onStart?.();

      try {
        const config = getConfig();
        const response = await fetch(`${config.baseURL}${url}`, {
          method: "POST",
          headers: config.headers,
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let fullText = "";
        let isDone = false;

        while (!isDone) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                isDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const content =
                  parsed.choices?.[0]?.delta?.content || parsed.content || "";
                if (content) {
                  fullText += content;
                  onMessage?.(content);
                }
              } catch {
                // 处理非 JSON 格式的数据
                if (data) {
                  fullText += data;
                  onMessage?.(data);
                }
              }
            }
          }
        }

        if (!controller.signal.aborted) {
          onComplete?.(fullText);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          onError?.(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          controllerRef.current = null;
        }
      }
    },
    [stopMessage, getConfig],
  );

  return { isLoading, error, sendMessage, stopMessage };
};

export default useSSE;
