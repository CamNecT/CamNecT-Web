import { Client } from "@stomp/stompjs";

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
    // 4초간격으로 서버와 연결확인 
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onWebSocketError: (event) => {
        console.error('WebSocket Error:', event);
    },
    onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
        console.log('STOMP Error Details:', frame.body);
    },
});

// localhost 재연결 테스트 전용 — 테스트 후 제거
// 명령어 : window.__stompClient.forceDisconnect();
if (isLocalDevHost()) {
    (
        window as Window & {
            __stompClient?: Client;
        }
    ).__stompClient = stompClient;
}
