import type { StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { StompChatRoomListResponse, StompMessageAck, StompSocketError } from "../api-types/stompApiTypes";
import { isStompEnabled, stompClient } from "../api/stompClient";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

// 로그인 / 로그아웃 시 소켓 연결/해제 (커피챗 실시간 수신을 위해)
export const useSocketInitializer = () => {
    const { isAuthenticated, user, accessToken } = useAuthStore();
    const queryClient = useQueryClient();

    // 로그인 상태 바뀔 때만 수행
    useEffect(() => {
        let ackSubscription: StompSubscription | null = null;
        let errorSubscription: StompSubscription | null = null;
        let roomsSubscription: StompSubscription | null = null;
        
        if (!isStompEnabled) {
            if (stompClient.active) {
                stompClient.deactivate();
            }
            return;
        }

        // 로그아웃 체크 또는 가입 완료 전(HOME이 아닌 경우) 연결 방지
        if (!isAuthenticated || !user?.id || user?.nextStep !== 'HOME') {
            useChatStore.getState().clearPendingMessages(); // 다른 사용자 세션으로 pending message 이전 방지

            if (stompClient.active) {
                stompClient.deactivate();
            }
            return;
        }
        
        // accessToken 주입
        stompClient.connectHeaders = {
            Authorization: `Bearer ${accessToken}`,
        };

        // 전역 구독 (1.ack -> 2.error -> 3.rooms)
        const setUpGlobalSubscriptions = () => {
            if (!stompClient.connected) return;

            ackSubscription = stompClient.subscribe(`/user/queue/chat-acks`, (frame) => {
                const ack = JSON.parse(frame.body) as StompMessageAck;
                useChatStore.getState().markPendingMessageSent(ack);
                // todo 배포 전 console.log 삭제
                console.log("메시지 저장 성공 ACK:", ack);
            });

            errorSubscription = stompClient.subscribe(`/user/queue/chat-errors`, (frame) => {
                const error = JSON.parse(frame.body) as StompSocketError;
                useChatStore.getState().markPendingMessageFailed(error);

                console.log("메시지 저장 실패 ERROR:", error);
            });

            roomsSubscription = stompClient.subscribe(`/sub/user/${user?.id}/rooms`, (frame) => {
                const roomsUpdate = JSON.parse(frame.body) as StompChatRoomListResponse ;
                
                // 채팅방 목록 API 갱신
                queryClient.invalidateQueries({ 
                    queryKey: ['chatRooms'], 
                    exact: false, 
                    refetchType: 'all' 
                });

                // 안읽은 메시지 개수 API 갱신
                queryClient.setQueryData(
                    ['chatUnreadCount'],
                    roomsUpdate.totalUnreadCount
                );
            });
        }

        // socket 연결 성공 후 실행될 단 하나의 마스터 핸들러
        stompClient.onConnect = (frame) => {
            console.log("STOMP 연결 성공! 전역 구독 및 이벤트 발송");
            setUpGlobalSubscriptions();
            
            // 다른 컴포넌트들에게 연결 완료 event 알림 (전역상태 사용 X -> 불필요한 리렌더링 방지) 
            window.dispatchEvent(new CustomEvent('stomp-connected', { detail: frame }));
        }
        
        // 소켓 연결 (if문으로 검사 이유?)
        if (!stompClient.active) {
            console.log("소켓 활성화 명령");
            stompClient.activate();
        }

        // 이미 socket이 켜져있을때 새로운 구독 실행
        if (stompClient.connected) {
            setUpGlobalSubscriptions();
        }

        // 앱이 백그라운드에서 돌아왔을 때(visibilitychange) 소켓 재연결
        const handleVisibilityChange = () => {

            // Page visibility API (Web API) : 브라우저 탭이 활성화 되었는지 감지 
            if (document.visibilityState === 'visible') {
                if (!stompClient.active && isAuthenticated) {
                    console.log("앱 복귀 감지: 소켓 재활성화 시도");
                    stompClient.activate();
                }
            }
        };

        // 예약된 이벤트(visibilitychange) 등록 : 브라우저가 자동으로 실행
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // 이전 effect에서 등록한 탭 활성화 감지 이벤트 제거
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            // 연결 중일 때만 UNSUBSCRIBE frame을 보내 전역 구독의 중복 등록 방지
            if (stompClient.connected) {
                ackSubscription?.unsubscribe();
                errorSubscription?.unsubscribe();
                roomsSubscription?.unsubscribe();
            }

            // 현재 effect가 소유한 subscription 참조 초기화
            ackSubscription = null;
            errorSubscription = null;
            roomsSubscription = null;

            // 현재는 effect 정리 시 공용 STOMP 연결도 종료
            // 명세상 방 화면 이탈 시에는 이 effect가 언마운트되지 않으므로 방 구독만 별도로 해제됨
            if (stompClient.active) {
                stompClient.deactivate();
            }
        }
    }, [isAuthenticated, user?.id, user?.nextStep, accessToken, queryClient])
    
}
