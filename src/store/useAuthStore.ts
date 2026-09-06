import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthState } from "../types/auth/authTypes";
import { useChatStore } from "./useChatStore";

// 앱 전체에서 사용하는 로그인 상태 관리

// persist: 새로고침 이후에도 로그인 상태를 유지하기 위함
// todo JS가 localstorage에 접근하면 토큰 탈취 가능 (추후에 HttpOnly Cookie로 보안강화 가능)
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            isAuthenticated: false,
            user: null,
            
            setLogin: (accessToken, user) => set({
                accessToken: accessToken,
                isAuthenticated: true,
                user: user
            }),
            setLogout: () => {
                // 수동 로그아웃뿐 아니라 인증 만료(REST/STOMP 401)에서도
                // 다른 사용자 세션으로 전송 대기 메시지가 넘어가지 않도록 함께 초기화
                useChatStore.getState().clearPendingMessages();

                set({
                    accessToken: null,
                    isAuthenticated: false,
                    user: null
                });
            },
            setUserId: (userId: string) => set((state) => ({
                user: state.user ? { ...state.user, id: userId } : { id: userId }
            }))
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
);
