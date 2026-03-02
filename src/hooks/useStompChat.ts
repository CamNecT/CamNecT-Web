import type { StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useState } from "react";
import type { StompChatResponse, StompMessageRequest, StompMessageResponse } from "../api-types/stompApiTypes";
import { isReadReceipt } from "../api-types/stompApiTypes";
import { stompClient } from "../api/stompClient";

// 개별 채팅방 구독 및 메시지 송수신을 위한 훅
export const useStompChat = (roomId: number) => {
    // 실시간으로 수신된 메시지들 저장 
    const [messages, setMessages] = useState<StompMessageResponse[]>([]);

    // 1. 메시지 발행 함수 (발신) - useCallback으로 메모이제이션 
    const sendMessage = useCallback((content: string) => {
        const message: StompMessageRequest = { roomId, content };

        if (stompClient.connected) {
            stompClient.publish({
                destination: `/pub/chat/message`,
                body: JSON.stringify(message) // STOMP는 String형태로만 전송가능
            });
        }
    }, [roomId]);

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

                setMessages((prev) => [...prev, data]); // 일반 메시지일때 병합
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
    }, [roomId, leaveChatRoom]);

    return { messages, sendMessage, setMessages, leaveChatRoom };
};