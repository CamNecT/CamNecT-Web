import { create } from 'zustand';
import type { NotificationItem } from '../pages/home/notificationData';

type NotificationState = {
  items: NotificationItem[];
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  setItems: (items: NotificationItem[]) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  markAsRead: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
    })),
  markAsUnread: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isRead: false } : item,
      ),
    })),
  setItems: (items) => set({ items }),
}));
