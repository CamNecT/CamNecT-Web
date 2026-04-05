import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { stompClient } from "../api/stompClient";
import { useAuthStore } from "../store/useAuthStore";

// 로그인 / 로그아웃 시 소켓 연결/해제 (커피챗 실시간 수신을 위해)
export const useSocketInitializer = () => {
    const { isAuthenticated, user, accessToken } = useAuthStore();
    const queryClient = useQueryClient();

    // 로그인 상태 바뀔 때만 수행
    useEffect(() => {
        // 로그아웃 체크 또는 가입 완료 전(HOME이 아닌 경우) 연결 방지
        if (!isAuthenticated || !user?.id || user?.nextStep !== 'HOME') {
            if (stompClient.active) {
                stompClient.deactivate();
            }
            return;
        }
        
        // accessToken 주입
        stompClient.connectHeaders = {
            Authorization: `Bearer ${accessToken}`,
        };

        // 전역 채팅 목록 구독함수
        const setUpSubscriptions = () => {
             if (!stompClient.connected) return;
             
            // 전역 채팅 목록 destination (개인 채팅방 전체 구독)
            stompClient.subscribe(`/sub/user/${user?.id}/rooms`, () => {
                // 채팅방 목록 API 갱신
                queryClient.invalidateQueries({ 
                    queryKey: ['chatRooms'], 
                    exact: false, 
                    refetchType: 'all' 
                });

                // 안읽은 메시지 개수 API 갱신
                queryClient.invalidateQueries({
                    queryKey: ['chatUnreadCount']
                });
            });
        }

        // socket 연결 성공 후 실행될 단 하나의 마스터 핸들러
        stompClient.onConnect = (frame) => {
            console.log("STOMP 연결 성공! 전역 구독 및 이벤트 발송");
            setUpSubscriptions();
            
            // 다른 컴포넌트들에게 연결 완료 event 알림 (전역상태 사용 X -> 불필요한 리렌더링 방지) 
            window.dispatchEvent(new CustomEvent('stomp-connected', { detail: frame }));
        }
        
        // 소켓 연결 (if문으로 검사 이유?)
        if (!stompClient.active) {
            console.log("소켓 활성화 명령");
            stompClient.activate();
        }

        // 이미 socket이 켜져있을때 새로운 구독 실행
        if(stompClient.connected){
            setUpSubscriptions();
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
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // 언마운트 시 매번 비활성화하기보다는 인증 해제 시에만 처리하도록 조정 가능
            // 여기서는 기존 유지
            if (stompClient.active) {
                stompClient.deactivate();
            }
        }
    }, [isAuthenticated, user?.id, user?.nextStep, accessToken, queryClient])
    
}