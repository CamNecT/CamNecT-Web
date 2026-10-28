import { create } from 'zustand';
import type { NotificationItem } from '../pages/home/notificationData';

type NotificationState = {
  items: NotificationItem[];
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  setItems: (items: NotificationItem[]) => void;
  reset: () => void; // 로그아웃 시 초기화
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
  // 새로고침 없이 계정 전환 시 이전 사용자 알림이 남지 않도록 초기화
  reset: () => set({ items: [] }),
}));
