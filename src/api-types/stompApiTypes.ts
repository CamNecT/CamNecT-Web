// STOMP 실시간 통신을 위한 DTO

// 1. [구독] 메시지 저장 성공 ACK (/user/queue/chat-acks)
// 유저가 보낸 메시지가 서버 DB에 저장됐는지
export interface StompMessageAck {
    type: 'ACK'; // ACK 이벤트 구분값
    messageId: number; // 서버(DB)에 저장된 메시지 ID
    roomId: number; // 채팅방 ID
    clientMessageId: string; // 프론트에서 요청 시 사용한 UUID
    duplicate: boolean; // 기존에 저장된 메시지이면 true
}

// 2. STOMP 오류가 발생한 작업 구분값
export type StompSocketOperation =
    | 'CONNECT'
    | 'SUBSCRIBE'
    | 'SEND_MESSAGE'
    | 'LEAVE_ROOM'
    | 'UNKNOWN';

// 3. [구독] 메시지 전송·퇴장 애플리케이션 오류 (/user/queue/chat-errors)
export interface StompSocketError {
    type: 'ERROR'; // 오류 이벤트 구분값
    status: number; // 상태 코드
    code: number; // 프런트 분기용 오류 코드
    message: string; // 사용자 안내 메시지
    operation: StompSocketOperation; // 오류가 발생한 작업
    roomId: number | null; // 관련 채팅방 ID
    clientMessageId: string | null; // 관련 메시지 UUIDx
}

// 4. [구독] 채팅방 목록 메시지 수신 (/sub/user/{userId}/rooms)
export interface StompChatRoomListResponse {
    roomId: number; // 갱신할 채팅방 ID
    lastMessage: string; // 마지막 메시지
    unreadCount: number; // 해당 방의 안 읽은 메시지 수
    time: string; // 마지막 메시지 시각
    totalUnreadCount: number; // 전체 채팅방의 안 읽은 메시지 수
}

// 5. [구독] 채팅방 내부 일반 메시지 (/sub/chat/room/{roomId})
export interface StompMessageResponse {
    messageId: number; // 서버 메시지 ID
    roomId: number; // 채팅방 ID
    clientMessageId: string | null; // 프론트가 생성한 UUID, 과거 메시지는 null 가능
    senderId: number; // 발신자 ID
    sender: string; // 발신자 이름
    receiverId: number; // 수신자 ID
    receiver: string; // 수신자 이름
    message: string; // 메시지 내용
    read: boolean; // 상대방 읽음 여부
    sendDate: string; // 전송 시각
    readAt: string | null; // 읽은 시각, 읽지 않았으면 null
}

// 6. [구독] 채팅방 내부 읽음 이벤트 (/sub/chat/room/{roomId})
export interface StompReadReceiptResponse {
    roomId: number; // 채팅방 ID
    lastReadMessageId: number; // 마지막으로 읽은 메시지 ID
    readAt: string; // 읽음 처리 시각
    type: 'READ'; // 일반 메시지와 읽음 이벤트를 구분하는 값
}

// 7. [발행] 메시지 보내기 (/pub/chat/message)
export interface StompMessageRequest {
    roomId: number; // 채팅방 ID
    content: string; // 메시지 내용, 공백 불가, 최대 16,000자
    clientMessageId: string; // 논리 메시지마다 한 번 생성하고 재전송 시 재사용하는 UUID v4
}

// 8. 클라이언트에서 관리하는 전송 대기 메시지 상태
// unconfirmed: 제한 시간 안에 ACK/ERROR를 받지 못해 서버 저장 여부를 아직 확정할 수 없는 상태
export type StompPendingState = 'pending' | 'unconfirmed' | 'sent' | 'failed';

// 전송 상태를 확정하지 못한 원인 또는 전송 실패 원인
export type StompPendingFailureKind = 'offline' | 'timeout' | 'server';

export interface StompPendingChatMessage {
    roomId: number; // 채팅방 ID
    content: string; // 최초 전송 내용
    createdAt: string; // pending 메시지 생성 시간
    lastAttemptAt: string | null; // 마지막 publish 시도 시각. 아직 publish하지 않았으면 null
    clientMessageId: string; // 최초 생성한 UUID
    serverMessageId?: number; // ACK로 확인한 서버 메시지 ID
    state: StompPendingState; // 현재 전송 상태
    publishAttempted: boolean; // 이 논리 메시지에 대해 실제 publish를 호출했는지 여부
    retryCount: number; // 재시도 횟수
    failureKind?: StompPendingFailureKind; // 전송 실패 원인
    errorCode?: number; // 전송 실패 시 서버 오류 코드
}

// 9. 같은 채팅방 구독 주소로 수신되는 일반 메시지와 읽음 이벤트의 Union Type
export type StompChatResponse = StompMessageResponse | StompReadReceiptResponse;

// 타입 가드: 수신된 데이터가 '읽음 처리 데이터'인지 판단
// (data is StompReadReceiptResponse) : Type predicate (해당 함수가 true면 호출부에서 StompReadReceiptResponse 타입으로 추론)
export const isReadReceipt = (data: StompChatResponse): data is StompReadReceiptResponse => {
    // as : casting X, data가 StompMessageResponse면 undefined 
    // boolean 반환해야 type predicate 사용 가능
    return (data as StompReadReceiptResponse).type === 'READ';
};
