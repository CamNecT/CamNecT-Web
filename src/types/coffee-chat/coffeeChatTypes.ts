// 1. 채팅 도메인에서의 유저 정보
export interface ChatUser {
  id: string;          // 유저 식별자
  name: string;    // "김갑수", "김익명"
  profileImg: string | null; // null -> placeholder 이미지
  major: string;      
  studentId: string;  
  introduction?: string; 
  tags?: string[];      // ["UX&UI", "취업", "포트폴리오"] 
}

// 2. 첨부파일 및 게시글 데이터 정의
export interface FileAttachment {
  type: "PDF" | "ZIP" | "HWP" | "ETC"; // 아이콘 결정을 위해 필요할 수 있음
  name: string;        // "파일이름.pdf"
  size: string;        
  url: string;         
  expiryDate: string;  // "2026.03.15" (파일 보관 기간)
}

export interface PostAttachment {
  postId: string;
  title: string;       // "OO 기업 면접 난이도 어떤가요"
  category: string;   
  thumbnailUrl?: string; 
  description?: string; // 게시글 본문 일부 (옵션)
}

// pending : 서버 응답 대기 / unconfirmed : 응답 제한 시간을 넘겼지만 저장 여부 미확정
// sent : ACK 수신 or 서버 메시지 수신 완료 / failed : chat-errors로 미전송 확정
export type ChatMessageDeliveryState = 'pending' | 'unconfirmed' | 'sent' | 'failed';

// 3. 채팅 메시지 
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;    // 이 ID가 내 ID와 같으면 오른쪽(초록말풍선), 다르면 왼쪽(회색) 배치
  content: string;     // 텍스트 메시지 내용 (파일/이미지일 경우 "사진을 보냈습니다" 같은 대체 텍스트 or empty) 
  
  clientMessageId: string | null; // 프론트에서 생성한 ID (pending 메시지, ACK, 실제 방 메시지를 서로 연결)
  deliveryState: ChatMessageDeliveryState;
  retryCount: number | null; // 추후 재전송 기능 구현 시 pending 메시지는 0부터 증가, 현재는 null
  errorCode?: number; // 실패 원인 및 재시도 가능 여부 판단용도

  // 타입에 따른 추가 데이터 (Optional)
  imageUrls?: string[]; // 사진은 여러 장 묶어서 보낼 수 있다
  file?: FileAttachment;
  post?: PostAttachment;
  
  createdAt: string;   
  isRead: boolean;     
  readAt: string | null;
}

export type ChatRoomListItemType = "COFFEE_CHAT" | "TEAM_RECRUIT";

// 4. 채팅 목록 아이템 (ChatRoomListItem)
export interface ChatRoomListItem {
  roomId: string;
  type?: ChatRoomListItemType;
  partner: ChatUser;   // 상대방 정보 객체 
  
  lastMessage: string; // 내가 보낸 메시지 일 수도
  lastMessageDate: string; // ISO 8601 형식 (e.g., "2026-01-27T05:26:06Z")
  
  unreadCount: number; // 0이면 뱃지 숨김, 1이상이면 초록색 원에 숫자 표시
  requestPostTitle?: string; // 팀원 모집 게시글 제목
  recruitmentId?: number; // 팀원 모집 게시글 ID
  isClosed?: boolean; // 대화 종료 여부
}

// 5. 커피챗 요청 수락/거절용 (Request)
export interface CoffeeChatRequest {
  id: string;
  sender: ChatUser;    // 요청자 정보
  receiver: ChatUser;  // 수신자 정보
  
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  
  requestTags: string[]; // ["태그1", "태그2"] (요청 분야)
  message: string;       // "커피챗을 요청하는 이유와 궁금한 점..."
  
  createdAt: string;      // ISO 8601 (e.g., "2026-01-15T09:00:00Z")
}
