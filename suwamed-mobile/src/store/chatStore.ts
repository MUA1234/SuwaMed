import { create } from 'zustand';

interface Message {
  _id: string;
  consultationId: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface ChatStore {
  messages: Message[];
  isTyping: boolean;
  typingUserId: string | null;
  isConnected: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markMessageRead: (messageId: string) => void;
  setTyping: (isTyping: boolean, userId?: string) => void;
  setConnected: (connected: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,
  typingUserId: null,
  isConnected: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  markMessageRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
      ),
    })),
  setTyping: (isTyping, userId) => set({ isTyping, typingUserId: userId || null }),
  setConnected: (isConnected) => set({ isConnected }),
  clearMessages: () => set({ messages: [], isTyping: false, typingUserId: null }),
}));
