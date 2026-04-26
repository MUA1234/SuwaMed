import { create } from 'zustand';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const removed = state.notifications.find((n) => n._id === id);
      return {
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: state.unreadCount - (removed && !removed.isRead ? 1 : 0),
      };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
