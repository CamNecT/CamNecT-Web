import { create } from 'zustand';

// App 전역 offline 팝업의 노출 여부만 공유하는 최소 상태다.
// 실패한 요청이나 Axios 오류 원본은 저장하지 않아 도메인 오류 처리 책임을 가져오지 않는다.
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
