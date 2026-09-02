// STOMP 오류 code 모음
// SEND_MESSAGE·LEAVE_ROOM: /user/queue/chat-errors
// CONNECT·SUBSCRIBE: STOMP ERROR 프레임 수신 가능
// STOMP code는 number, Axios error code는 정규화된 string이므로 혼용 금지
export const STOMP_ERROR_CODES = {
    // 작업 구분 없이 공통으로 올 수 있는 code
    common: {
        invalidPayload: 40000, // 잘못된 Payload, 자동 재시도 금지
        internal: 50000, // 저장 여부 미확정인 일반 서버 오류, unconfirmed 상태에서 수동 재시도 제공
        temporarilyUnavailable: 50310, // 일시적 서버 장애, 저장 여부 미확정 및 자동 재연결 대상
    },

    // 연결·인증 단계(CONNECT), 대부분 자동 재연결 중단 대상
    //   백엔드 요청 문서 3절 해결 후 재연결 중단·세션 정리·로그인 이동 분기 구현
    connection: {
        invalidToken: 40100, // JWT 만료·서명·claim 오류, 연결 종료 후 로그인 상태 갱신
        sessionRevoked: 41103, // Redis 세션에 없거나 폐기된 access token, 연결 종료 후 재인증
        notAccessToken: 41106, // Access Token이 아닌 토큰 사용, 연결 종료
        malformedAuthHeader: 41109, // Bearer 누락·Authorization 형식 오류
        accountRestricted: 41302, // 정지된 사용자, 자동 재연결 금지
        accountWithdrawn: 41303, // 탈퇴한 사용자, 세션 정리 및 로그인 화면 이동
        accountInactive: 41304, // 활성 계정이 아님, 자동 재연결 금지
    },

    // 메시지 전송·방 접근 단계(SEND_MESSAGE, LEAVE_ROOM)
    chat: {
        invalidContent: 48003, // 공백·길이 오류 안내
        roomClosed: 48005, // 닫힌 방 안내 후 목록·이력 재조회
        invalidClientMessageId: 48006, // UUID 생성 로직 확인
        forbidden: 48302, // 접근 불가 안내 후 해당 구독·화면 정리
        roomNotFound: 48402, // 존재하지 않는 roomId, 해당 화면 종료하고 목록 재조회
        duplicateIdConflict: 48903, // 같은 방·발신자·UUID에 다른 내용 사용, 기존 메시지는 유지하고 현재 내용은 저장하지 않음
    },
} as const;

// 현재 메시지의 DB 미저장이 확정된 code 화이트리스트
// 목록 외 code: 커밋 후 오류·신규 code에 대비해 unconfirmed 처리
// 48903: 기존 행 유지, 현재 다른 내용 미저장 -> failed
// 같은 UUID·같은 내용 재전송 -> duplicate: true ACK
export const DEFINITELY_UNSENT_ERROR_CODES = new Set<number>([
    STOMP_ERROR_CODES.common.invalidPayload,
    STOMP_ERROR_CODES.chat.invalidContent,
    STOMP_ERROR_CODES.chat.roomClosed,
    STOMP_ERROR_CODES.chat.invalidClientMessageId,
    STOMP_ERROR_CODES.chat.forbidden,
    STOMP_ERROR_CODES.chat.roomNotFound,
    STOMP_ERROR_CODES.chat.duplicateIdConflict,
]);
