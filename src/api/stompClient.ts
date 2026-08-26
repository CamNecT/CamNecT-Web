import { Client, ReconnectionTimeMode } from "@stomp/stompjs";
import type { StompSocketError } from "../api-types/stompApiTypes";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { STOMP_ERROR_CODES } from "../constants/serverErrors/stompErrors";

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

// STOMP ERROR frame 처리
stompClient.onStompError = (frame) => {
    try {
        // ERROR frame의 문자열 body를 객체로 변환
        const error =
            JSON.parse(frame.body) as StompSocketError;

        console.error('STOMP Error:', error);

        // SEND 인터셉터에서 거절 당한 메세지 제거
        useChatStore
            .getState()
            .markPendingMessageFailed(error);

        // 401 인증 오류 처리
        if (error.status === 401) {
            void stompClient.deactivate();
            useAuthStore.getState().setLogout();

            return;
        }

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
