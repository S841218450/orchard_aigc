import { create } from "zustand";

interface LoadingState {
  loadingCount: number;
  isLoading: boolean;
  show: () => void;
  hide: () => void;
  reset: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  loadingCount: 0,
  isLoading: false,

  show: () => {
    const next = get().loadingCount + 1;
    set({ loadingCount: next, isLoading: next > 0 });
  },

  hide: () => {
    const next = Math.max(get().loadingCount - 1, 0);
    set({ loadingCount: next, isLoading: next > 0 });
  },

  reset: () => {
    set({ loadingCount: 0, isLoading: false });
  },
}));
