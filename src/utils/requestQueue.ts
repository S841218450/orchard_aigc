import type { AxiosRequestConfig } from "axios";

interface QueueItem {
  key: string;
  timestamp: number;
  controller: AbortController;
}

class RequestQueue {
  private queue: Map<string, QueueItem> = new Map();
  private readonly DUPLICATE_INTERVAL = 1000; // 1秒内不允许重复请求

  // 生成请求唯一标识
  private generateKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    return `${method}-${url}-${JSON.stringify(params || {})}-${JSON.stringify(data || {})}`;
  }

  // 检查是否重复请求
  isDuplicate(config: AxiosRequestConfig): boolean {
    const key = this.generateKey(config);
    const existing = this.queue.get(key);

    if (!existing) return false;

    const now = Date.now();
    const timeDiff = now - existing.timestamp;

    // 1秒内视为重复请求
    if (timeDiff < this.DUPLICATE_INTERVAL) {
      return true;
    }

    // 超过1秒，移除旧记录
    this.remove(key);
    return false;
  }

  // 添加请求到队列
  add(config: AxiosRequestConfig): AbortController {
    const key = this.generateKey(config);
    const controller = new AbortController();

    // 如果存在旧的相同请求，先取消
    const existing = this.queue.get(key);
    if (existing) {
      existing.controller.abort();
    }

    this.queue.set(key, {
      key,
      timestamp: Date.now(),
      controller,
    });

    return controller;
  }

  // 移除请求
  remove(key: string): void {
    this.queue.delete(key);
  }

  // 根据配置移除请求
  removeByConfig(config: AxiosRequestConfig): void {
    const key = this.generateKey(config);
    this.remove(key);
  }

  // 取消所有请求
  cancelAll(): void {
    this.queue.forEach((item) => {
      item.controller.abort();
    });
    this.queue.clear();
  }

  // 获取队列大小
  get size(): number {
    return this.queue.size;
  }
}

export const requestQueue = new RequestQueue();
