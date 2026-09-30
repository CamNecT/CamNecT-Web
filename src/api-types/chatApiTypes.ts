// 채팅방 목록 조회 DTO (/api/chat/rooms)
export interface ChatRoomListRequest {
    userId: number;
    type?: 'COFFEE_CHAT' | 'TEAM_RECRUIT';
}

export interface ChatRoomInfo {
    roomId: number;
    opponentId: number;
    opponentName: string;
    opponentProfileImgUrl: string;
    opponentMajor: string;
    opponentStudentYear: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    closed: boolean;
    opponentExited: boolean;
}

export interface ChatRoomListResponse {
    status: number;
    message: string;
    data: {
        chatRoomList: ChatRoomInfo[];
        totalUnreadCount: number;
        requestExists: boolean;
    };
}

// 채팅방 상세 조회 DTO (/api/chat/room/{roomId})
export interface ChatRoomDetailRequest {
    roomId: number;
    userId: number;
}

export interface ChatMessageInfo {
    messageId: number;
    roomId: number;
    clientMessageId: string | null;
    senderId: number;
    sender: string;
    receiverId: number;
    receiver: string;
    message: string;
    read: boolean;
    sendDate: string;
    readAt: string;
}

export interface ChatRoomDetailResponse {
    status: number;
    message: string;
    data: {
        roomId: number;
        myId: number;
        opponentId: number;
        opponentName: string;
        opponentMajor: string;
        opponentStudentYear: string;
        opponentProfileImg: string;
        opponentTags: string[];
        requestAt: string;
        requestType: string;
        requestTags: string[];
        requestContent: string;
        recruitmentTitle: string;
        activityId: number;
        recruitmentId: number;
        chatList: ChatMessageInfo[];
        closed: boolean;
        opponentExited: boolean;
    };
}

// 채팅 종료 DTO (/api/chat/room/{roomId}/close)
export interface ChatRoomCloseRequest {
    roomId: number;
    userId: number;
}

export interface ChatRoomCloseResponse {
    status: number;
    message: string;
    data: string;
}

// 개별 채팅방 나가기 DTO (/api/chat/room/{roomId}/exit)
export interface ChatRoomExitRequest {
    roomId: number;
    userId: number;
}

export interface ChatRoomExitResponse {
    status: number;
    message: string;
    data: string;
}

// 커피챗 요청 수락/거절 DTO (/api/request/respond)
export interface ChatRespondRequest {
    userId: number;
    requestId: number;
    isAccepted: boolean;
}

export interface ChatRespondResponse {
    status: number;
    message: string;
    data: string;
}

// 커피챗 요청 목록 조회 DTO (api/request/list)
export interface ChatRequestListRequest {
    userId: number;
    type?: 'COFFEE_CHAT' | 'TEAM_RECRUIT';
}

export interface ChatRequestInfo {
    opponentId: number;
    opponentName: string;
    opponentMajor: string;
    opponentStudentYear: string;
    opponentProfileImg: string;
    requestId: number;
    requestType: string;
    requestContent: string;
    createdAt: string;
    recruitmentTitle: string;
    activityId: number;
    recruitmentId: number;
}

export interface ChatRequestListResponse {
    status: number;
    message: string;
    data: {
        chatRequestList: ChatRequestInfo[];
    };
}

// 커피챗 요청 상세 조회 DTO (api/request/{requestId})
export interface ChatRequestDetailRequest {
    userId: number;
    requestId: number;
}

export interface ChatRequestDetailResponse {
    status: number;
    message: string;
    data: {
        myId: number;
        opponentId: number;
        opponentName: string;
        opponentMajor: string;
        opponentStudentYear: string;
        opponentProfileImg: string;
        opponentTags: string[];
        requestId: number;
        requestType: string;
        requestTags: string[];
        requestContent: string;
        createdAt: string;
        recruitmentTitle: string;
        activityId: number;
        recruitmentId: number;
    };
}

// 팀원 모집 요청 전체 삭제 (게시글 별) DTO (api/request/all/team-recruit/{recruitmentId})
export interface DeleteAllTeamRecruitRequest {
    userId: number;
    recruitmentId: number;
}

export interface DeleteAllTeamRecruitResponse {
    status: number;
    message: string;
    data: string;
}

// 커피챗 요청 전체 삭제 DTO (api/request/all/coffee-chat)
export interface DeleteAllChatRequest {
    userId: number;
}

export interface DeleteAllChatResponse {
    status: number;
    message: string;
    data: string;
}