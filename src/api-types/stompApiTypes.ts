//STOMP 실시간 통신을 위한 DTO 

// 1. [구독] 채팅방 목록 메시지 수신 (/sub/user/{userId}/rooms)
export interface StompChatRoomListResponse {
    roomId: number;
    lastMessage: string;
    unreadCount: number;
    time: string; // 마지막 메시지 시간 
    totalUnreadCount: number; // 전체 안읽은 메시지 수 -> 전역 뱃지 초기화 용도
}
 
// 2. [구독] 채팅방 내부 일반 메시지 (/sub/chat/room/{roomId})
export interface StompMessageResponse {
    messageId: number;
    roomId: number;
    senderId: number;
    sender: string;
    receiverId: number;
    receiver: string;
    message: string;
    read: boolean; // 읽음 여부
    sendDate: string;
    readAt: string | null; // 읽은 시각
}

// 3. [구독] 읽음 처리의 수신 데이터 (/sub/chat/room/{roomId})
export interface StompReadReceiptResponse {
    roomId: number;
    lastReadMessageId: number;
    readAt: string;
    type?: 'READ'; // 해당 optional 필드로 읽음여부 판단
}

// 4. [발행] 메시지 보내기 (/pub/chat/message)
export interface StompMessageRequest {
    roomId: number;
    content: string;
}

// 5. 유니온 타입: 소켓으로 받은 데이터에 type 필드가 있으면 읽음 처리, 없으면 일반 메시지
export type StompChatResponse = StompMessageResponse | StompReadReceiptResponse;

// 타입 가드: 수신된 데이터가 '읽음 처리 데이터'인지 판단
// (data is StompReadReceiptResponse) : Type predicate (해당 함수가 true면 호출부에서 StompReadReceiptResponse 타입으로 추론)
export const isReadReceipt = (data: StompChatResponse): data is StompReadReceiptResponse => {
    return (data as StompReadReceiptResponse).type === 'READ';
};