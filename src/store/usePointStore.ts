import { create } from 'zustand';

type PointState = {
  point: number;
  phoneNum: string;
  getPoint: () => number;
  reset: () => void; // 로그아웃 시 초기화
  setPoint: (point: number) => void;
  setPhoneNum: (phoneNum: string) => void;
  deductPoint: (amount: number) => void;
};

const initialState = {
  point: 0,
  phoneNum: '',
};

// 보안 및 데이터 정합성을 위해 persist(localStorage)를 제거하고 순수 메모리 스토어로 관리
export const usePointStore = create<PointState>((set, get) => ({
  ...initialState,
  getPoint: () => get().point,
  setPoint: (point) => set({ point }),
  setPhoneNum: (phoneNum) => set({ phoneNum }),
  deductPoint: (amount) =>
    set((state) => ({ point: Math.max(0, state.point - amount) })),
  // 새로고침 없이 계정 전환 시 이전 사용자 포인트/연락처가 남지 않도록 초기화
  reset: () => set(initialState),
}));
