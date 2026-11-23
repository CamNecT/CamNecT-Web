import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/profileApi";
import { useAuthStore } from "../store/useAuthStore";
import { clearClientSession } from "../utils/clearClientSession";

// 사용자가 직접 로그아웃 / 회원 탈퇴할 때 세션을 정리하고 화면을 이동하는 훅
// 세션을 먼저 정리하면 이동 전의 현재 화면에서
// AuthGuard의 '로그인이 필요합니다' 팝업과 캐시 초기화로 인한 로딩/에러 UI가 잠깐 렌더링되어 화면이 깜빡인다.
// 따라서 이동할 화면을 먼저 DOM에 반영(flushSync)한 뒤 세션을 정리한다.
// (토큰 만료 등 강제 로그아웃은 AuthGuard 안내 팝업이 의도된 동작이므로 대상 X)
export const useLogout = () => {
    const navigate = useNavigate();

    // 로그아웃 버튼 중복 클릭 방지
    const isLoggingOutRef = useRef(false);

    // 화면 이동 후 세션 정리
    const leaveSession = useCallback(async (to: string) => {
        // flushSync : 이동한 화면이 DOM에 반영된 뒤 다음 줄 실행 (Data Router 전용 옵션)
        await navigate(to, { replace: true, flushSync: true });
        clearClientSession();
    }, [navigate]);

    // 로그아웃 API 호출 후 로그인 화면으로 이동
    const logoutAndRedirect = useCallback(async () => {
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        try {
            const loginUserId = Number(useAuthStore.getState().user?.id);
            if (!Number.isFinite(loginUserId)) throw new Error("Invalid userId");

            // 세션 정리 전에 호출해야 accessToken이 요청에 포함됨
            await logout(loginUserId);
        } catch (e) {
            // 401 등 API 실패여도 클라이언트 로그아웃은 진행
            console.warn("logout failed:", e);
        } finally {
            await leaveSession("/login");
        }
    }, [leaveSession]);

    return { logoutAndRedirect, leaveSession };
};
