import { Client, ReconnectionTimeMode } from "@stomp/stompjs";
import type { StompSocketError } from "../api-types/stompApiTypes";
import { useChatStore } from "../store/useChatStore";
import { STOMP_ERROR_CODES, STOMP_SESSION_LOGOUT_ERROR_CODES } from "../constants/serverErrors/stompErrors";
import { clearClientSession } from "../utils/clearClientSession";
import { useAuthStore } from "../store/useAuthStore";
import { refreshAccessToken } from "./axiosInstance";

const isLocalDevHost = () => {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};

// 모바일 LAN 개발 접속(예: 192.168.x.x)에서는 UI 확인을 위해 소켓 연결을 비활성화
export const isStompEnabled = !import.meta.env.DEV || isLocalDevHost();

// dev에서는 현재 접속한 호스트 기준으로 Vite proxy(/ws-stomp)를 태우고, 프로덕션에서는 실제 소켓 주소를 사용
// (https 접속이면 wss, http면 ws로 자동 선택)
const brokerURL = import.meta.env.DEV
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws-stomp`
    : import.meta.env.VITE_SOCKET_URL;

// STOMP protocol 처리 객체 (STOMP 규격의 메시지 단위 생성 및 해석)
export const stompClient = new Client({
    brokerURL, // WebSocket pipeline 연결주소
    // 연결 상태를 로그로 확인
    // debug: (str) => {
    //     console.log('STOMP Debug:', str);
    // },
    reconnectDelay: 2000,
    reconnectTimeMode:
    ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: 30000,

    connectionTimeout: 10000, // 최초 연결 무응답 방지
    // 10초간격으로 서버와 연결확인
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onWebSocketError: (event) => {
        console.error('WebSocket Error:', event);
    },
});

// STOMP 연결 직전마다 store의 최신 accessToken을 CONNECT 헤더에 주입
stompClient.beforeConnect = () => {
    const { accessToken } = useAuthStore.getState();

    // 로그아웃, 자동 재연결이 겹치는 순간 방어
    stompClient.connectHeaders = accessToken ? {
        Authorization: `Bearer ${accessToken}`,
    } : {};
};

// 새 토큰으로 STOMP 재연결을 이미 시도했는지 확인
let hasRetriedAfterTokenRefresh = false;

export const resetStompTokenRefreshRetry = () => {
    hasRetriedAfterTokenRefresh = false;
};

// STOMP ERROR frame 처리
stompClient.onStompError = async (frame) => {
    try {
        // ERROR frame의 문자열 body를 객체로 변환
        const error = JSON.parse(frame.body) as StompSocketError;

        // SEND 인터셉터에서 거절 당한 메세지 제거
        useChatStore
            .getState()
            .markPendingMessageFailed(error);

        // todo: 403 발생 시 해당 roomId 재구독 차단 후 공용 연결 복구

        if (
            error.code ===
            STOMP_ERROR_CODES.common.temporarilyUnavailable
        ) {
            console.warn(
                'STOMP 일시 장애입니다. 서버 종료 후 자동 재연결을 기다립니다.',
                error
            );

            return;
        }

        // 40100 처리
        if (error.code === STOMP_ERROR_CODES.connection.invalidToken) {
            const { refreshToken } = useAuthStore.getState();

            if (hasRetriedAfterTokenRefresh || !refreshToken) {
                await stompClient.deactivate();
                clearClientSession();

                return;
            }

            try {
                await refreshAccessToken(refreshToken);
                hasRetriedAfterTokenRefresh = true;
                
                // 기존 STOMP연결 해제 및 재연결
                await stompClient.deactivate();
                stompClient.activate();
            } catch {
                // refresh 실패 되어 로그아웃 상태 시
                const { isAuthenticated } = useAuthStore.getState();

                if (!isAuthenticated) {
                    await stompClient.deactivate();
                }
            }

            return;
        }

        // RTR 호출하면 안되는 cases
        if (STOMP_SESSION_LOGOUT_ERROR_CODES.has(error.code)) {
            await stompClient.deactivate();
            clearClientSession();

            return;
        }
    
    } catch (parseError) {
        // JSON이 아닌 ERROR가 와도 앱이 죽지 않도록 방어
        console.error(
            'STOMP ERROR JSON 파싱 실패:',
            parseError,
            frame.body
        );

        // 원인을 알 수 없으므로 자동 재연결 중단
        void stompClient.deactivate();
    }
};

// localhost 재연결 테스트 전용 — 테스트 후 제거
// 명령어 : window.__stompClient.forceDisconnect();
if (isLocalDevHost()) {
    (
        window as Window & {
            __stompClient?: Client;
        }
    ).__stompClient = stompClient;
}
