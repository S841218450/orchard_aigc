import { create } from "zustand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

type ActiveView = "chat" | "myproject";

interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  isLoading: boolean;
  initialMessage: string | null;
  activeView: ActiveView;

  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setLoading: (loading: boolean) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  deleteSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  getCurrentSession: () => Session | null;
  setInitialMessage: (msg: string | null) => void;
  setActiveView: (view: ActiveView) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  initialMessage: null,
  activeView: "chat",

  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialMessage: (msg) => set({ initialMessage: msg }),
  setActiveView: (view) => set({ activeView: view }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),

  deleteSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSessionId:
        state.currentSessionId === sessionId ? null : state.currentSessionId,
    })),

  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: new Date(),
            }
          : s
      ),
    })),

  getCurrentSession: () => {
    const state = get();
    return (
      state.sessions.find((s) => s.id === state.currentSessionId) || null
    );
  },
}));
