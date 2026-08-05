import { create } from 'zustand';
import type {
    StompPendingChatMessage, StompMessageAck, StompSocketError
} from '../api-types/stompApiTypes';

interface ChatState {
    // 전역상태
    totalUnreadCount: number;
    isStompConnected: boolean; // stomp 연결여부
    pendingMessages: StompPendingChatMessage[]; // 유저가 전송한 메시지 (서버 응답대기)

    // 전역상태 변경 함수
    setTotalUnreadCount: (count: number) => void;
    setIsStompConnected: (isConnected: boolean) => void;

    addPendingMessage: (message: StompPendingChatMessage) => void;
    markPendingMessageSent: (ack: StompMessageAck) => void; // sent 처리 
    markPendingMessageFailed: (error: StompSocketError) => void; // failed 처리
    removePendingMessage: (clientMessageId: string) => void; // 메시지가 실제 채팅방에 추가된 후 제거 
    clearPendingMessages: () => void; // 로그아웃 시 초기화
}

export const useChatStore = create<ChatState>((set) => ({
    totalUnreadCount: 0,
    isStompConnected: false,
    pendingMessages: [],

    // 전역상태 변경 함수
    setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),
    setIsStompConnected: (isConnected) => set({ isStompConnected: isConnected }),

    // 메시지 전송 직전에 pending 목록에 추가 
    addPendingMessage: (message) => {
        set((state) => ({
            // 중복 추가 방지
            pendingMessages: state.pendingMessages.some(
                (pending) => pending.clientMessageId === message.clientMessageId
            )
            ? state.pendingMessages 
            : [...state.pendingMessages, message],
        }))
    },

    // ACK 수신 후 sent로 변경
    markPendingMessageSent: (ack) => {
        set((state) => ({
            pendingMessages: state.pendingMessages.map(
                (pending) => pending.clientMessageId === ack.clientMessageId
                    ? {
                        ...pending,
                        serverMessageId: ack.messageId,
                        state: 'sent'
                    }
                    : pending
            ),
        }));
    },

    // 오류 시 삭제하지 않고 failed로 변경 
    markPendingMessageFailed: (error) => {
        // 메시지 전송과 연결된 오류가 아니면 pending 메시지를 변경하지 않음
        if (
            error.operation !== 'SEND_MESSAGE' ||
            !error.clientMessageId
        ) {
            return;
        }               

        set((state) => ({
            pendingMessages: state.pendingMessages.map(
                (pending) => pending.clientMessageId === error.clientMessageId
                    ? { ...pending, state: 'failed', errorCode: error.code}
                    : pending
            ),
        }));
    },
       
    // 실제 채팅방 메시지와 병합 후 pending에서 제거
    removePendingMessage: (clientMessageId) => {
        set((state) => ({
            pendingMessages: state.pendingMessages.filter(
                (pending) => pending.clientMessageId !== clientMessageId
            )
        }))
    },

    // 로그아웃 시 pending 메시지 초기화
    clearPendingMessages: () => set({ pendingMessages: [] }),

}));

// todo 전송 상태(pending/failed) UI 확인용. 개발 환경에서만 콘솔로 store 접근 허용
// 상태 변경만 하므로 서버로 발행되는 메시지는 없음 (publish는 useStompChat에서만 호출)
if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).useChatStore = useChatStore;
}
