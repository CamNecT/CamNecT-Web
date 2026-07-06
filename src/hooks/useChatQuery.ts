import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAllChatRequest, deleteAllTeamRecruit, requestChatRespond, requestChatRoomClose, requestChatRoomExit, viewChatRequestDetail, viewChatRequestList, viewChatRoomDetail, viewChatRoomList } from "../api/chat";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import type { ChatMessage, ChatRoomListItem, ChatRoomListItemType, ChatUser } from "../types/coffee-chat/coffeeChatTypes";

const normalizeText = (value: unknown) => {
    if (value === null || value === undefined) return "";
    return String(value);
};

const normalizeStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => normalizeText(item).trim())
        .filter((item) => item.length > 0);
};

// API 응답 데이터를 가공한 최종 상세 데이터 타입
export interface ChatRoomDetailData {
    partner: ChatUser & { tags: string[] };
    requestInfo: {
        createdAt: string;
        type: string;
        tags: string[];
        content: string;
        recruitmentTitle?: string;
        recruitmentId?: number;
        activityId?: number;
    };
    messages: ChatMessage[];
    closed: boolean;
    opponentExited: boolean;
}

// 1-1. 전체 안 읽은 메시지 개수 조회 전용 쿼리
export const useUnreadCountQuery = () => {
    const { user, isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['chatUnreadCount'],
        queryFn: async () => {
            if (!user?.id) return 0;
            const response = await viewChatRoomList({
                userId: Number(user?.id)
            });
            const count = response.data.totalUnreadCount;
            return count;
        },
        enabled: isAuthenticated && !!user?.id && user?.nextStep === 'HOME',
        staleTime: 1000 * 60, // 1분간 신선도 유지
    });
};

// 1. 채팅방 목록 조회 API [GET] (/api/chat/rooms)
export const useChatRooms = (type: ChatRoomListItemType) => {
    const { user } = useAuthStore(); // 1. 유저 정보 가져오기 
    const { setTotalUnreadCount } = useChatStore();

    return useQuery({
        queryKey: ['chatRooms', user?.id, type], // 데이터 고유이름 (캐싱용)
        queryFn: async () => {

            const response = await viewChatRoomList({
                userId: Number(user?.id),
                type: type
            })

            // 전역 안 읽은 개수 업데이트
            setTotalUnreadCount(response.data.totalUnreadCount);

            // 4. API 응답 데이터를 UI에서 사용하는 형식으로 변환 (Mapper)
            return {
                chatRooms: response.data.chatRoomList.map((room): ChatRoomListItem => ({
                    roomId: String(room.roomId),
                    type: type,
                    partner: {
                        id: String(room.opponentId), 
                        name: normalizeText(room.opponentName),
                        major: normalizeText(room.opponentMajor),
                        studentId: normalizeText(room.opponentStudentYear),
                        profileImg: room.opponentProfileImgUrl,
                    },
                    lastMessage: normalizeText(room.lastMessage),
                    lastMessageDate: room.lastMessageTime,
                    unreadCount: room.unreadCount,
                    isClosed: room.closed || room.opponentExited,
                })),
                requestExists: response.data.requestExists
            };
        },
        enabled: !!user?.id // 유저 ID가 있을 때만 실행
    });
};

// 2. 채팅방 조회 상세 API [GET] (/api/chat/room/{roomId})
export const useChatRoom = (roomId: string) => {
    const { user } = useAuthStore(); // 1. 유저 정보 가져오기 

    return useQuery({
        queryKey: ['chatRoom', roomId],
        queryFn: async () => {
            
            const response = await viewChatRoomDetail({
                userId: Number(user?.id),
                roomId: Number(roomId)
            });

            const { data } = response;

            // 4. API DTO -> UI DTO 매핑
            return {
                // 커피챗 상대 정보
                partner: {
                    id: String(data.opponentId),
                    name: normalizeText(data.opponentName),
                    major: normalizeText(data.opponentMajor),
                    studentId: normalizeText(data.opponentStudentYear),
                    profileImg: data.opponentProfileImg,
                    tags: normalizeStringArray(data.opponentTags), // 상대방 전문 분야
                },
                // 커피챗 요청 상세 정보 (카드 영역)
                requestInfo: {
                    createdAt: data.requestAt,
                    type: data.requestType,
                    tags: normalizeStringArray(data.requestTags),
                    content: normalizeText(data.requestContent),
                    recruitmentTitle: normalizeText(data.recruitmentTitle),
                    recruitmentId: data.recruitmentId,
                    activityId: data.activityId,
                },
                // 채팅 메시지 리스트
                messages: data.chatList.map((message): ChatMessage => ({
                    id: String(message.messageId),
                    roomId: String(message.roomId),
                    senderId: String(message.senderId),
                    content: message.message,
                    createdAt: message.sendDate,
                    isRead: message.read,
                    readAt: message.readAt
                })),
                closed: data.closed,
                opponentExited: data.opponentExited,
            };
        },
        enabled: !!roomId && !!user?.id
    });
};

// 3. 커피챗 요청 목록 조회 API [GET] (/api/request/list)
export const useChatRequests = (type: ChatRoomListItemType) => {

    const { user } = useAuthStore();

    return useQuery<ChatRoomListItem[]>({
        // type이 바뀔때 마다 재요청
        queryKey: ['chatRequests', user?.id, type],
        queryFn: async () => { 

            // API 호출
            const response = await viewChatRequestList({
                userId: Number(user?.id),
                type:type
            })

            // 응답 매핑
            return response.data.chatRequestList.map((room): ChatRoomListItem => ({
                roomId: String(room.requestId), // 요청 ID를 채팅방 ID로 사용 (식별자)
                type: type,
                partner: {
                    id: String(room.opponentId), 
                    name: normalizeText(room.opponentName),
                    major: normalizeText(room.opponentMajor),
                    studentId: normalizeText(room.opponentStudentYear),
                    profileImg: room.opponentProfileImg,
                },
                lastMessage: normalizeText(room.requestContent),
                lastMessageDate: room.createdAt,
                unreadCount: 0, // 요청은 1번 밖에 못보내므로 
                requestPostTitle: normalizeText(room.recruitmentTitle),
                recruitmentId: room.recruitmentId,
            }));
        },
        enabled: !!user?.id
    });
};

// 4. 커피챗 요청 상세 조회 API [GET] (/api/request/{requestId})
export const useChatRequestRoom = (requestId: string) => {

    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['chatRequestRoom', requestId],
        queryFn: async () => {

            const response = await viewChatRequestDetail({
                userId: Number(user?.id),
                requestId: Number(requestId)
            })

            const { data } = response;

            // 4. API DTO -> UI DTO 매핑
            return {
                // 커피챗 상대 정보
                partner: {
                    id: String(data.opponentId),
                    name: normalizeText(data.opponentName),
                    major: normalizeText(data.opponentMajor),
                    studentId: normalizeText(data.opponentStudentYear),
                    profileImg: data.opponentProfileImg,
                    tags: normalizeStringArray(data.opponentTags), // 상대방 전문 분야
                },
                // 커피챗 요청 상세 정보 (카드 영역)
                requestInfo: {
                    createdAt: data.createdAt,
                    type: data.requestType,
                    tags: normalizeStringArray(data.requestTags),
                    content: normalizeText(data.requestContent),
                }
            };
        },
        enabled: !!requestId
    });
};

// 5. 커피챗 요청 수락/거절 API [POST] (/api/request/respond)
export const useChatRequestRespond = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { requestId: number; isAccepted: boolean }) => 
            requestChatRespond({
                userId: Number(user?.id),
                ...variables
            }),
        onSuccess: () => {
            // 요청 목록, 채팅 목록 최신화
            queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
            queryClient.invalidateQueries({ queryKey: ['home'] });
        }
    });
};

// 6. (게시글 별) 팀원 모집 전체 삭제 API [DELETE] (/api/request/all/team-recruit/{recruitmentId})
export const useDeleteAllTeamRecruitRequest = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { recruitmentId: number }) => 
            deleteAllTeamRecruit({
                userId: Number(user?.id),
                ...variables
            }),
        onSuccess: () => {
            // 요청 목록 최신화
            queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
        }
    });
};

// 7. 커피챗 요청 전체 삭제 API [DELETE] (/api/request/all/coffee-chat)
export const useDeleteAllChatRequest = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => 
            deleteAllChatRequest({
                userId: Number(user?.id)
            }),
        onSuccess: () => {
            // 요청 목록 최신화
            queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
        }
    });
};

// 8. 채팅방 대화종료 API [PATCH] (/api/chat/room/{roomId}/close)
export const useChatRoomClose = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { roomId: number }) => 
            requestChatRoomClose({
                userId: Number(user?.id),
                ...variables
            }),
        onSuccess: () => {
            // 채팅 목록 최신화
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        }
    });
};
    
// 9. 채팅방 나가기 API [PATCH] (/api/chat/room/{roomId}/exit)
export const useChatRoomExit = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { roomId: number }) => 
            requestChatRoomExit({
                userId: Number(user?.id),
                ...variables
            }),
        onSuccess: () => {
            // 채팅 목록 최신화
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        }
    });
};
