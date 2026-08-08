import type { AxiosRequestConfig } from "axios";

interface QueueItem {
  key: string;
  controller: AbortController;
}

class RequestQueue {
  private queue: Map<string, QueueItem> = new Map();

  private generateKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    return `${method}-${url}-${JSON.stringify(params || {})}-${JSON.stringify(data || {})}`;
  }

  add(config: AxiosRequestConfig): AbortController {
    const key = this.generateKey(config);
    const controller = new AbortController();

    const existing = this.queue.get(key);
    if (existing) {
      existing.controller.abort();
    }

    this.queue.set(key, {
      key,
      controller,
    });

    return controller;
  }

  remove(key: string): void {
    this.queue.delete(key);
  }

  removeByConfig(config: AxiosRequestConfig): void {
    const key = this.generateKey(config);
    this.remove(key);
  }

  cancelAll(): void {
    this.queue.forEach((item) => {
      item.controller.abort();
    });
    this.queue.clear();
  }

  get size(): number {
    return this.queue.size;
  }
}

export const requestQueue = new RequestQueue();
