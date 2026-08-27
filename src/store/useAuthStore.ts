import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { NextStepType, UserRole } from "../api-types/authApiTypes";

export type AuthUser = {
    id: string;
    name?: string;
    role?: UserRole;
    nextStep?: NextStepType;
};

export interface AuthState {
    accessToken: string | null;
    signupToken: string | null;
    isAuthenticated: boolean;
    user: AuthUser | null;
    setUserLogin: (accessToken: string, user: AuthUser) => void;
    setSignupLogin: (signupToken: string, user: AuthUser) => void;
    setLogout: () => void;
    setUserId: (userId: string) => void;
}

// 앱 전체에서 사용하는 로그인 상태 관리

// persist: 새로고침 이후에도 로그인 상태를 유지하기 위함
// todo JS가 localstorage에 접근하면 토큰 탈취 가능 (추후에 HttpOnly Cookie로 보안강화 가능)
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            signupToken: null, // 회원가입 이메일 인증 이후에 발급되는 임시토큰
            isAuthenticated: false,
            user: null,
            
            setUserLogin: (accessToken, user) => set({
                accessToken,
                signupToken: null,
                isAuthenticated: true,
                user
            }),
            setSignupLogin: (signupToken, user) => set({
                accessToken: null,
                signupToken,
                isAuthenticated: false,
                user
            }),
            setLogout: () => set({
                accessToken: null,
                signupToken: null,
                isAuthenticated: false,
                user: null
            }),
            setUserId: (userId: string) => set((state) => ({
                user: state.user ? { ...state.user, id: userId } : { id: userId }
            }))
        }),
        {
            name: "camnect-auth",
            storage: createJSONStorage(() => localStorage)
        }
    )
);