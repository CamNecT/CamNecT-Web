import { create } from 'zustand';
import type {
    StompPendingChatMessage, StompMessageAck, StompSocketError
} from '../api-types/stompApiTypes';

const PENDING_CONFIRM_TIMEOUT_MS = 15_000; // timeout 판별 기준
const PENDING_TIMEOUT_CHECK_INTERVAL_MS = 1_000; // timeout 검사주기

// interval 중복 생성 방지
let pendingTimeoutIntervalId: ReturnType<typeof setInterval> | null = null;

interface ChatState {
    // 전역상태
    totalUnreadCount: number;
    isStompConnected: boolean; // stomp 연결여부
    pendingMessages: StompPendingChatMessage[]; // 유저가 전송한 메시지 (서버 응답대기)

    // 전역상태 변경 함수
    setTotalUnreadCount: (count: number) => void;
    setIsStompConnected: (isConnected: boolean) => void;

    addPendingMessage: (message: StompPendingChatMessage) => void;
    markPendingMessagePublishFailed: (clientMessageId: string) => void; // publish 호출 자체가 실패한 경우
    markPendingMessageSent: (ack: StompMessageAck) => void; // sent 처리 
    decideMarkExpiredPendingMessages: (now: number) => void; // 응답 대기 timeout 처리
    markPendingMessageFailed: (error: StompSocketError) => void; // failed 처리
    removePendingMessage: (clientMessageId: string) => void; // 메시지가 실제 채팅방에 추가된 후 제거
    removeFailedPendingMessage: (clientMessageId: string) => void; // 미전송이 확정된 메시지만 제거
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
        }));

        // 타임아웃 감시는 STOMP 연결 여부가 아니라 pending 메시지 생성 시점에 시작한다.
        startPendingMessageTimeoutWatcher();
    },

    // 연결 경합으로 publish가 동기적으로 실패하면 미전송 실패 상태로 되돌린다.
    markPendingMessagePublishFailed: (clientMessageId) => {
        set((state) => ({
            pendingMessages: state.pendingMessages.map((pending) =>
                pending.clientMessageId === clientMessageId
                    ? {
                        ...pending,
                        state: 'failed',
                        publishAttempted: false,
                        lastAttemptAt: null,
                        failureKind: 'offline',
                    }
                    : pending
            ),
        }));
    },

    // ACK 수신 후 sent로 변경
    markPendingMessageSent: (ack) => {
        set((state) => ({
            pendingMessages: state.pendingMessages.map(
                (pending) => pending.clientMessageId === ack.clientMessageId
                    ? {
                        ...pending,
                        serverMessageId: ack.messageId,
                        state: 'sent',
                        failureKind: undefined,
                        errorCode: undefined,
                    }
                    : pending
            ),
        }));
    },

    // ACK/ERROR 대기 시간이 만료되어도 전송 실패로 단정하지 않음
    // 이미 서버에 저장됐지만 응답만 늦은 경우일 수 있으므로 미확정 상태로 변경
    decideMarkExpiredPendingMessages: (now) => {
        set((state) => {
            let hasChanged = false; // 리렌더링 방지용 (pendingMessages 변화체크)

            const pendingMessages = state.pendingMessages.map((pending) => {

                if (pending.state !== 'pending') {
                    return pending;
                }

                const pendingStartedAt = pending.lastAttemptAt ?? pending.createdAt;
                const isExpired = now - new Date(pendingStartedAt).getTime() >= PENDING_CONFIRM_TIMEOUT_MS;

                if (!isExpired) {
                    return pending;
                }

                hasChanged = true;                    
                // todo publish 후 응답이 끊긴 unconfirmed 메시지는 STOMP 재연결 시
                // 채팅방 상세를 재조회하고 clientMessageId로 sent/failed 상태를 확정해야 함
                // 발동 조건: publish 후 15초 동안 ACK/ERROR/채팅방 메시지를 모두 받지 못한 경우
                // 발생 빈도: 정상 환경에서는 드물며, 전송 순간 네트워크 전환·단절 또는 서버 재시작 시 가능
                // 보류 이유: 재연결 후 서버 채팅 내역과 동기화해야 하므로 현재 MVP 범위보다 복잡함
                return {
                    ...pending,
                    state: pending.publishAttempted ? 'unconfirmed' as const : 'failed' as const,
                    failureKind: pending.publishAttempted ? 'timeout' as const : 'offline' as const,
                };
            });

            // timeout 없을 시 기존 state 반환
            return hasChanged ? { pendingMessages } : state;
        });
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
                    ? { ...pending, state: 'failed', failureKind: 'server', errorCode: error.code}
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

    // publish하지 않았거나 서버가 SEND_MESSAGE 오류로 거절한 메시지만 로컬 대기 목록에서 제거
    // 이 함수는 publish를 호출하지 않는다.
    removeFailedPendingMessage: (clientMessageId) => {
        set((state) => {
            const target = state.pendingMessages.find((pending) => pending.clientMessageId === clientMessageId);
            const isDefinitelyUnsent =
                target?.failureKind === 'offline' || target?.failureKind === 'server';

            if (!target || target.state !== 'failed' || !isDefinitelyUnsent) return state;
            return { pendingMessages: state.pendingMessages.filter((pending) => pending.clientMessageId !== clientMessageId) };
        });
    },

    // 로그아웃 시 pending 메시지와 타임아웃 감시를 함께 초기화
    clearPendingMessages: () => {
        set({ pendingMessages: [] });
        stopPendingMessageTimeoutWatcher();
    },

}));

// 전역 타이머 실행
export const startPendingMessageTimeoutWatcher = () => {
    if (pendingTimeoutIntervalId !== null) {
        return; // 이미 실행 중
    }

    pendingTimeoutIntervalId = setInterval(() => {
        useChatStore
            .getState()
            .decideMarkExpiredPendingMessages(Date.now());

        // 더 이상 제한 시간을 검사할 메시지가 없으면 불필요한 interval을 중단한다.
        const hasPendingMessage = useChatStore
            .getState()
            .pendingMessages
            .some((message) => message.state === 'pending');

        if (!hasPendingMessage) {
            stopPendingMessageTimeoutWatcher();
        }
        
    }, PENDING_TIMEOUT_CHECK_INTERVAL_MS);
};

export const stopPendingMessageTimeoutWatcher = () => {
    if (pendingTimeoutIntervalId === null) {
        return; // 실행 중 아님
    }

    clearInterval(pendingTimeoutIntervalId);
    pendingTimeoutIntervalId = null;
};

// todo 전송 상태(pending/failed) UI 확인용. 개발 환경에서만 콘솔로 store 접근 허용
// 상태 변경만 하므로 서버로 발행되는 메시지는 없음 (publish는 useStompChat에서만 호출)
if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).useChatStore = useChatStore;
}
