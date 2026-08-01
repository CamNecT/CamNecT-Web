import type { StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useState } from "react";
import type { StompChatResponse, StompMessageRequest, StompMessageResponse, StompPendingChatMessage } from "../api-types/stompApiTypes";
import { isReadReceipt } from "../api-types/stompApiTypes";
import { stompClient } from "../api/stompClient";
import { useChatStore } from "../store/useChatStore";
import { useShallow } from "zustand/react/shallow";

// 개별 채팅방 구독 및 메시지 송수신을 위한 훅
export const useStompChat = (roomId: number) => {
    // 모든 실시간 메시지들 (수신 / 발신)
    const [messages, setMessages] = useState<StompMessageResponse[]>([]);

    const { addPendingMessage, removePendingMessage } = useChatStore(
        useShallow((state) => ({
            addPendingMessage: state.addPendingMessage,
            removePendingMessage: state.removePendingMessage,
        }))
    );

    // 1. 메시지 발행 함수 (발신) - useCallback으로 메모이제이션 
    const sendMessage = useCallback((content: string): boolean => {
        // stomp 연결 여부 검사
        if (!stompClient.connected) {
            
            console.log("소켓 연결 안됨 (발신함수)");
            return false; 
        }

        // 논리 메시지 ID 생성 (서버 ACK 받기 전 UI 렌더용)
        const clientMessageId = crypto.randomUUID();

        const requestMessage: StompMessageRequest = { clientMessageId, roomId, content };
        const pendingMessage: StompPendingChatMessage = {
            roomId,
            content,
            createdAt: new Date().toISOString(), // pending 메시지 생성 시간
            clientMessageId,
            state: 'pending',
            retryCount: 0,
        };

        addPendingMessage(pendingMessage); // pending 전역상태 말풍선에 추가 (publish 이전)

        // STOMP 연결여부 검사 후 발송 
        stompClient.publish({
            destination: `/pub/chat/message`,
            body: JSON.stringify(requestMessage) // STOMP는 String형태로만 전송가능
        });
        
        return true; // pending 등록 및 publish 요청 실행 완료
    }, [roomId, addPendingMessage]);

    // 2. 채팅방 나가기 함수 - useCallback으로 메모이제이션 (없었을때의 안읽은 채팅뱃지 개수 문제)
    const leaveChatRoom = useCallback(() => {
        if (stompClient.connected) {
            stompClient.publish({
                destination: `/pub/chat/room/${roomId}/leave`
            });
        }
    }, [roomId]);

    // 특정 채팅방 구독 (수신) 및 클린업
    useEffect(() => {
        let subscription: StompSubscription | null = null; // 구독 객체

        // 특정 roomId 구독 함수
        const performSubscribe = () => {
            if (!stompClient.connected || subscription) return;
            
            subscription = stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                // 개별 채팅방 구독시의 서버의 응답
                const data: StompChatResponse = JSON.parse(message.body); // String -> Object 변환 (응답 response)

                // 읽음 type 여부 -> 읽음 처리 로직
                if (isReadReceipt(data)) {
                    setMessages((prev) => 
                        prev.map((msg) => 
                            msg.messageId <= data.lastReadMessageId 
                                ? { ...msg, read: true, readAt: data.readAt } 
                                : msg
                        )
                    );
                    return;
                }

                // clientMessageId가 존재할 경우 pendingMessages에서 해당 메시지 제거
                if (data.clientMessageId) {
                    removePendingMessage(data.clientMessageId);
                }

                // upsert (수신한 데이터로 기존 데이터 업데이트, 없으면 추가)
                setMessages((prev) => {
                    const isExist = prev.some((msg) => msg.messageId === data.messageId);

                    // update
                    if (isExist) {
                        // update (기존 메시지 업데이트) 
                        return prev.map((msg) => 
                            msg.messageId === data.messageId 
                                ? data 
                                : msg
                        );
                    }
                    
                    // insert (새로운 메시지)
                    return [...prev, data];
                });
            });
        };

        const handleStompConnected = () => {
            performSubscribe();
        };

        if (stompClient.connected) {
            performSubscribe();
        } else {
            // stomp-connected 발생 시 performSubscribe(채팅방 구독) 실행
            window.addEventListener('stomp-connected', handleStompConnected);
        }

        return () => {
            // 구독 시 구독취소 로직
            if (subscription) subscription.unsubscribe();
            window.removeEventListener('stomp-connected', handleStompConnected);
            leaveChatRoom();
        };
    }, [roomId, leaveChatRoom, removePendingMessage]);

    return { messages, sendMessage, setMessages, leaveChatRoom };
};