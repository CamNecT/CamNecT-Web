import type {
    ChatRoomDetailRequest, ChatRoomDetailResponse,
    ChatRoomListRequest, ChatRoomListResponse,
    ChatRequestDetailRequest, ChatRequestDetailResponse,
    ChatRequestListRequest, ChatRequestListResponse,
    ChatRespondRequest, ChatRespondResponse,
    DeleteAllChatRequest, DeleteAllChatResponse,
    DeleteAllTeamRecruitRequest, DeleteAllTeamRecruitResponse,
    ChatRoomCloseRequest, ChatRoomCloseResponse,
    ChatRoomExitRequest, ChatRoomExitResponse
} from "../api-types/chatApiTypes";
import { axiosInstance } from "./axiosInstance";

/*
---------------------------------------------------------------------------------------------------
*/

// 1. 채팅방 목록 조회 API [GET] (/api/chat/rooms)
export const viewChatRoomList = async (data: ChatRoomListRequest) => {
    
    const response = await axiosInstance.get<ChatRoomListResponse>("/api/chat/rooms", {
        params: data
    });
    return response.data;
}

// 2. 채팅방 상세 조회 API [GET] (/api/chat/room/{roomId})
export const viewChatRoomDetail = async (data: ChatRoomDetailRequest) => {
    const { roomId, ...queryParams } = data;
    
    const response = await axiosInstance.get<ChatRoomDetailResponse>(`/api/chat/room/${roomId}`, {
        params: queryParams
    });
    return response.data;
}

// 3. 채팅방 대화종료 API [PATCH] (/api/chat/room/{roomId}/close)
export const requestChatRoomClose = async (data: ChatRoomCloseRequest) => {
    const { roomId, userId } = data;
    
    const response = await axiosInstance.patch<ChatRoomCloseResponse>(`/api/chat/room/${roomId}/close`, {
        params: { userId }
    });
    return response.data;
}

// 4. 채팅방 나가기 API [PATCH] (/api/chat/room/{roomId}/exit)
export const requestChatRoomExit = async (data: ChatRoomExitRequest) => {
    const { roomId, userId } = data;
    
    const response = await axiosInstance.patch<ChatRoomExitResponse>(`/api/chat/room/${roomId}/exit`, {
        params: { userId }
    });
    return response.data;
}

// 5. 채팅방 종료 및 나가기 API [PATCH] (/api/chat/room/{roomId}/complete-exit)
export const requestChatRoomCompleteExit = async (data: ChatRoomExitRequest) => {
    const { roomId, userId } = data;
    
    const response = await axiosInstance.patch<ChatRoomExitResponse>(`/api/chat/room/${roomId}/complete-exit`, {
        params: { userId }
    });
    return response.data;
}

// 6. 커피챗 요청 수락/거절 API [POST] (/api/request/respond)
export const requestChatRespond = async (data: ChatRespondRequest) => {
    const { userId, ...body } = data;
    
    const response = await axiosInstance.post<ChatRespondResponse>("/api/request/respond", body, {
        params: { userId }
    });
    return response.data;
}

// 7. 커피챗 요청 상세 조회 API [GET] (/api/request/{requestId})
export const viewChatRequestDetail = async (data: ChatRequestDetailRequest) => {
    const { userId, requestId } = data;
    
    const response = await axiosInstance.get<ChatRequestDetailResponse>(`/api/request/${requestId}`, {
        params: { userId }
    });
    return response.data;
}

// 8. 커피챗 요청 목록 조회 API [GET] (/api/request/list)
export const viewChatRequestList = async (data: ChatRequestListRequest) => {
    const { userId, type } = data;
    
    const response = await axiosInstance.get<ChatRequestListResponse>("/api/request/list", {
        params: { userId, type }
    });
    return response.data;
}

// 9. (게시글 별) 팀원 모집 전체 삭제  API [DELETE] (/api/request/all/team-recruit/{recruitmentId})
export const deleteAllTeamRecruit = async (data: DeleteAllTeamRecruitRequest) => {
    const { userId, recruitmentId } = data;
    
    const response = await axiosInstance.delete<DeleteAllTeamRecruitResponse>(`/api/request/all/team-recruit/${recruitmentId}`, {
        params: { userId }
    });
    return response.data;
}

// 10. 커피챗 요청 전체 삭제 API [DELETE] (/api/request/all/coffee-chat)
export const deleteAllChatRequest = async (data: DeleteAllChatRequest) => {
    const { userId } = data;
    
    const response = await axiosInstance.delete<DeleteAllChatResponse>("/api/request/all/coffee-chat", {
        params: { userId }
    });
    return response.data;
}