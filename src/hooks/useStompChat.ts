import type { StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useState } from "react";
import type { StompChatResponse, StompMessageRequest, StompMessageResponse, StompPendingChatMessage } from "../api-types/stompApiTypes";
import { isReadReceipt } from "../api-types/stompApiTypes";
import { stompClient } from "../api/stompClient";
import { useChatStore } from "../store/useChatStore";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import type { ChatRoomDetailData } from "./useChatQuery";
import type { ChatMessage } from "../types/coffee-chat/coffeeChatTypes";


// 개별 채팅방 구독 및 메시지 송수신을 위한 훅
export const useStompChat = (roomId: string) => {

    const queryClient = useQueryClient();

    // 모든 실시간 메시지들 (수신 / 발신)
    const [messages, setMessages] = useState<StompMessageResponse[]>([]);
    // PWA/FCM 직접 진입 시 현재 방 구독이 생성되기 전까지 채팅 화면 렌더링을 보류
    const [isRoomSubscriptionReady, setIsRoomSubscriptionReady] = useState(false);

    const {
        addPendingMessage,
        markPendingMessagePublishFailed,
        removePendingMessage,
    } = useChatStore(
        useShallow((state) => ({
            addPendingMessage: state.addPendingMessage,
            markPendingMessagePublishFailed: state.markPendingMessagePublishFailed,
            removePendingMessage: state.removePendingMessage,
        }))
    );

    // 1. 메시지 발행 함수 (발신) - useCallback으로 메모이제이션 
    const sendMessage = useCallback((content: string): boolean => {
        // 논리 메시지 ID 생성 (서버 ACK 받기 전 UI 렌더용)
        const clientMessageId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // 현재 온라인이고 STOMP 연결이 되어 있는지 확인
        const canPublish = navigator.onLine && stompClient.connected;

        const requestMessage: StompMessageRequest = {
            clientMessageId,
            roomId: Number(roomId),
            content,
        };
        const pendingMessage: StompPendingChatMessage = {
            roomId,
            content,
            createdAt,
            lastAttemptAt: canPublish ? createdAt : null,
            clientMessageId,
            state: 'pending',
            publishAttempted: canPublish,
            retryCount: 0,
        };

        // 연결 여부와 관계없이 먼저 로컬 말풍선 생성
        addPendingMessage(pendingMessage);

        // 오프라인 메시지는 로컬에만 남기고 전송 X
        if (!canPublish) {
            return true;
        }

        try {
            stompClient.publish({
                destination: `/pub/chat/message`,
                body: JSON.stringify(requestMessage),
            });
        } catch (error) {
            // 연결 확인 직후 끊겨 publish 자체가 실패한 경우 미전송 상태로 보존
            console.error("메시지 publish 실패:", error);
            markPendingMessagePublishFailed(clientMessageId);
        }
        
        return true; // 로컬 메시지 등록 완료
    }, [roomId, addPendingMessage, markPendingMessagePublishFailed]);

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
            // 연결 전 호출은 건너뛰고, 연결 완료 이벤트에서 다시 시도
            if (!stompClient.connected) return;

            // 재연결 시 이전 연결의 구독은 이미 종료됐으므로 새 구독 객체로 덮어쓴다.
            subscription = stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                // 개별 채팅방 구독시의 서버의 응답
                const data: StompChatResponse = JSON.parse(message.body); // String -> Object 변환 (응답 response)

                // 읽음 type 여부 -> 읽음 처리 로직
                if (isReadReceipt(data)) {
                    // 실시간 메시지 갱신
                    setMessages((prev) => 
                        prev.map((msg) => 
                            msg.messageId <= data.lastReadMessageId 
                                ? { ...msg, read: true, readAt: data.readAt } 
                                : msg
                        )
                    );

                    // REST 기존 메시지 갱신
                    // setQueryData : 로컬 캐시 데이터를 업데이트 (updater 함수의 첫 인자는 oldData)
                    queryClient.setQueryData(['chatRoom', roomId], (oldData: ChatRoomDetailData | undefined) => {
                                            
                        // 캐시가 아직 없을 때(API 응답보다 읽음 영수증이 먼저 도착) 방어
                        // undefined를 반환하면 react-query가 캐시를 건드리지 않고 넘어감
                        if (!oldData) return oldData;
                        return {
                            ...oldData, // 다른 property들은 유지
                            messages: oldData.messages.map((msg: ChatMessage) =>
                                Number(msg.id) <= data.lastReadMessageId
                                    ? { ...msg, isRead: true, readAt: data.readAt }
                                    : msg
                            )
                        };
                    });
                    
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

            setIsRoomSubscriptionReady(true);
        };

        const handleStompConnected = () => {
            performSubscribe();
        };

        // 현재 연결 여부와 무관하게 리스너를 유지해 이후의 모든 재연결을 처리
        window.addEventListener('stomp-connected', handleStompConnected);

        // 마운트 시 이미 연결된 경우에는 연결 이벤트를 기다리지 않고 즉시 구독
        performSubscribe();

        return () => {
            // 끊어진 연결에는 UNSUBSCRIBE를 보낼 수 없으므로 살아 있는 구독만 해제
            if (subscription && stompClient.connected) {
                subscription.unsubscribe();
            }

            // 종료된 연결의 구독 객체가 다음 생명주기에 남지 않도록 참조를 비움
            subscription = null;

            window.removeEventListener('stomp-connected', handleStompConnected);
            leaveChatRoom();
        };
    }, [roomId, leaveChatRoom, removePendingMessage, queryClient]);

    return { messages, sendMessage, setMessages, leaveChatRoom, isRoomSubscriptionReady };
};
