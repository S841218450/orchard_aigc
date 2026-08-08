import type { MessageInstance } from "antd/es/message/interface";

type MessageType = "success" | "error" | "warning" | "info";

interface MessageItem {
  type: MessageType;
  content: string;
  duration?: number;
}

interface QueuedMessage extends MessageItem {
  id: string;
  timestamp: number;
}

const STORAGE_KEY = "app_pending_messages";
const MAX_MESSAGE_COUNT = 5;
const DE_DUPLICATE_WINDOW = 1500;

class MessageManager {
  private messageApi: MessageInstance | null = null;
  private recentMessages: Map<string, number> = new Map();
  private queue: QueuedMessage[] = [];
  private activeCount = 0;
  private isInitialized = false;

  setMessageApi(api: MessageInstance) {
    this.messageApi = api;
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.consumePendingMessages();
    }
  }

  success(content: string = "操作成功", duration?: number) {
    this.push("success", content, duration);
  }

  error(content: string = "操作失败", duration?: number) {
    this.push("error", content, duration);
  }

  warning(content: string = "操作警告", duration?: number) {
    this.push("warning", content, duration);
  }

  info(content: string = "操作提示", duration?: number) {
    this.push("info", content, duration);
  }

  private push(type: MessageType, content: string, duration?: number) {
    const dedupKey = `${type}:${content}`;
    const now = Date.now();
    const lastTime = this.recentMessages.get(dedupKey);

    if (lastTime && now - lastTime < DE_DUPLICATE_WINDOW) {
      return;
    }
    this.recentMessages.set(dedupKey, now);

    if (this.recentMessages.size > 50) {
      const cutoff = now - DE_DUPLICATE_WINDOW * 2;
      for (const [key, time] of this.recentMessages) {
        if (time < cutoff) {
          this.recentMessages.delete(key);
        }
      }
    }

    const item: QueuedMessage = {
      id: `${type}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      content,
      duration,
      timestamp: now,
    };

    if (this.messageApi && this.activeCount < MAX_MESSAGE_COUNT) {
      this.showMessage(item);
    } else {
      this.queue.push(item);
      if (!this.messageApi) {
        this.saveToStorage();
      }
    }
  }

  private showMessage(item: QueuedMessage) {
    if (!this.messageApi) return;

    this.activeCount++;
    const duration = item.duration ?? 2.5;

    this.messageApi[item.type]({
      content: item.content,
      duration,
      onClose: () => {
        this.activeCount--;
        this.processQueue();
      },
    });
  }

  private processQueue() {
    if (!this.messageApi || this.queue.length === 0) return;
    if (this.activeCount >= MAX_MESSAGE_COUNT) return;

    const next = this.queue.shift();
    if (next) {
      this.showMessage(next);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      const existing = this.loadFromStorage();
      const all = [...existing, ...this.queue];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      this.queue = [];
    } catch {
      // ignore
    }
  }

  private loadFromStorage(): QueuedMessage[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) =>
            item &&
            typeof item.content === "string" &&
            ["success", "error", "warning", "info"].includes(item.type),
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  private consumePendingMessages() {
    if (typeof window === "undefined") return;
    const pending = this.loadFromStorage();
    if (pending.length > 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      pending.forEach((item, index) => {
        setTimeout(() => {
          this.showMessage(item);
        }, index * 200);
      });
    }
  }
}

export const messageManager = new MessageManager();

export default messageManager;
