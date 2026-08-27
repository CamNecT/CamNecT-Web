import { create } from 'zustand';

type GlobalOfflineState = {
  isOffline: boolean;
  setOffline: () => void;
  clearOffline: () => void;
};

// 여러 요청이 동시에 실패해도 단일 boolean만 갱신해 전역 팝업이 중복되지 않게 한다.
export const useGlobalOfflineStore = create<GlobalOfflineState>((set) => ({
  isOffline: false,
  setOffline: () => set({ isOffline: true }),
  clearOffline: () => set({ isOffline: false }),
}));
