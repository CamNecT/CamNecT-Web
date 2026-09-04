import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { usePointStore } from "../store/usePointStore";
import { queryClient } from "../api/queryClient";


// 로그아웃 시 공통으로 수행 할 작업들
// STOMP 종료는 useSocketInitializer가 isAuthenticated 변화로 처리하므로 여기서 다루지 않음
export function clearClientSession() {
    // 토큰 + 인증정보 초기화 + pending messages 정리
    useAuthStore.getState().setLogout();

    // 같은 탭에서 다른 계정으로 로그인하면 기존 FCM Token을 새 사용자에게 다시 등록
    sessionStorage.removeItem("FCM_REGISTERED_IN_SESSION");

    // TODO: 푸시 로그아웃을 강화할 때 deleteToken(messaging)으로 로컬 FCM 구독도 해제
    // 이때 FCM 서버 등록 성공 후에만 FCM_REGISTERED_IN_SESSION을 저장하도록 함께 변경

    // 계정 전환 캐시 누수 차단
    queryClient.clear();

    // persist가 없어 새로고침 전까지 남는 메모리 스토어 정리
    usePointStore.getState().reset();
    useNotificationStore.getState().reset();
}
