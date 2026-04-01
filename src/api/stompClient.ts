import { Client } from "@stomp/stompjs";

// STOMP protocol 처리 객체 (STOMP 규격의 메시지 단위 생성 및 해석)
export const stompClient = new Client({
    brokerURL: import.meta.env.VITE_SOCKET_URL, // WebSocket pipeline 연결주소 
    // 연결 상태를 로그로 확인
    debug: (str) => {
        console.log('STOMP Debug:', str);
    },
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
})