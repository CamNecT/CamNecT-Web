import type { StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { StompChatResponse } from "../../api-types/stompApiTypes";
import { isReadReceipt } from "../../api-types/stompApiTypes";
import { stompClient } from "../../api/stompClient";
import Icon from "../../components/Icon";
import PopUp from "../../components/Pop-up";
import Toggle from "../../components/Toggle/Toggle";
import { useChatRoom, useChatRoomClose, useChatRoomExit, type ChatRoomDetailData } from "../../hooks/useChatQuery";
import { useStompChat } from "../../hooks/useStompChat";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import type { ChatMessage } from "../../types/coffee-chat/coffeeChatTypes";
import { formatFullDateWithDay, formatTime } from "../../utils/formatDate";
import { ChatRoomInfo } from "./components/ChatRoomInfo";
import { TypingArea } from "./components/TypingArea";

export const ChatRoomPage = () => {
    const { id } = useParams<{ id: string }>();
    
    return <ChatRoomContent key={id} roomId={id || ""} />;
};

const ChatRoomContent = ({ roomId }: { roomId: string }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { user } = useAuthStore();

    const { data: chatRoomData, isLoading: isRoomLoading } = useChatRoom(roomId);
    const { mutate: endChat } = useChatRoomClose();
    const { mutate: exitChat } = useChatRoomExit();

    const {messages: socketMessages, sendMessage, leaveChatRoom} = useStompChat(Number(roomId));
    
    // 검색 관련 상태
    const [isSearching, setIsSearching] = useState(false);
    const [roomSearchQuery, setRoomSearchQuery] = useState("");

    // todo 소켓 연결 상태를 추적할 로컬 상태 추가 (지연 초기화로 최신 상태 반영)
    const [isSocketReady, setIsSocketReady] = useState(() => stompClient.connected);
    
    // 메뉴 관련 상태
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRecruitExpanded, setIsRecruitExpanded] = useState(false);
    const [confirmPopUpConfig, setConfirmPopUpConfig] = useState<{
        title: string;
        content: string;
        leftButtonText: string;
        onConfirm: () => void;
    } | null>(null);
    const [localIsTerminated, setLocalIsTerminated] = useState(false);
    
    // 종료 여부 (서버 데이터 우선, 없을 시 로컬 상태 사용)
    const isTerminated = chatRoomData?.closed || localIsTerminated;
    const opponentExited = chatRoomData?.opponentExited;

    const menuRef = useRef<HTMLDivElement>(null);

    // 메뉴 바깥 클릭/터치 시 닫기
    useEffect(() => {
        const handleOutsideAction = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            const isOptionButton = (target as HTMLElement).closest('[aria-label="option"]');
            
            if (menuRef.current && !menuRef.current.contains(target) && !isOptionButton) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleOutsideAction);
            document.addEventListener("touchstart", handleOutsideAction);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideAction);
            document.removeEventListener("touchstart", handleOutsideAction);
        };
    }, [isMenuOpen]);

    // todo (복습) 실시간 읽음 처리 (Read Receipt) 감시 및 캐시 동기화
    useEffect(() => {
        // 1. 백그라운드일때 OS가 아예 socket을 종료시켰을수도 있으니 체크 (socketInitializer를 호출하면 되는것 아닌지?)
        if (!stompClient.active) {
            stompClient.activate();
        }

        let subscription: StompSubscription | null = null;

        const performSubscribe = () => {
            if (!stompClient.connected || subscription) return;

            subscription = stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const data: StompChatResponse = JSON.parse(message.body);

                if (isReadReceipt(data)) {
                    queryClient.setQueryData(['chatRoom', roomId], (oldData: ChatRoomDetailData | undefined) => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            messages: oldData.messages.map((msg: ChatMessage) => 
                                Number(msg.id) <= data.lastReadMessageId 
                                    ? { ...msg, isRead: true, readAt: data.readAt } 
                                    : msg
                            )
                        };
                    });
                }
            });
            console.log("채팅방 구독 성공:", roomId);
            setIsSocketReady(true);
        }

        // 연결 상태 소식 듣기
        const handleStompConnected = () => {
            console.log("ChatRoomPage: 연결 소식 접수!");
            performSubscribe();
        };

        if (stompClient.connected) {
            performSubscribe();
        } else {
            // 전역 이벤트 리스너 등록
            window.addEventListener('stomp-connected', handleStompConnected);
        }

        return () => {
            if (subscription) {
                subscription.unsubscribe();
                subscription = null;
            }
            window.removeEventListener('stomp-connected', handleStompConnected);
        };
    }, [roomId, queryClient]);

    // STOMP 채팅방 나가기 처리 (브라우저 종료/새로고침 대응)
    // SPA 내부 이동 시 퇴장 처리는 useStompChat 훅의 클린업에서 자동으로 수행
    useEffect(() => {
        const handleBeforeUnload = () => {
            leaveChatRoom();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [leaveChatRoom]);

    // 초기 진입 시 깜빡임 방지를 위한 상태
    const [isReady, setIsReady] = useState(false);

    const isLoading = isRoomLoading;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const roomInfo = chatRoomData?.partner;
    const requestInfo = chatRoomData?.requestInfo;
    const isTeamRecruit = requestInfo?.type === 'TEAM_RECRUIT';

    // API로 받은 기존 채팅 내역 데이터들
    const remoteMessages = useMemo(() => {
        return chatRoomData?.messages || [];
    }, [chatRoomData?.messages]);

    const myId = String(user?.id);

    // 실시간 메시지를 도메인 타입으로 변환
    const mappedSocketMessages = useMemo(() => {
        return socketMessages.map((msg):ChatMessage => ({
            id: String(msg.messageId),
            roomId: String(msg.roomId),
            senderId: String(msg.senderId),
            content: msg.message,
            createdAt: msg.sendDate,
            isRead: msg.read,
            readAt: msg.readAt
        }))
    }, [socketMessages]);

    // API 데이터와 소켓 메시지를 합치기
    const allMessages = useMemo(() => {
        return [...remoteMessages, ...mappedSocketMessages];
    }, [remoteMessages, mappedSocketMessages]);

    // 검색어 필터링 적용
    const localMessages = useMemo(() => {
        if (!isSearching || !roomSearchQuery.trim()) return allMessages;
        return allMessages.filter(msg => 
            msg.content.toLowerCase().includes(roomSearchQuery.toLowerCase())
        );
    }, [allMessages, isSearching, roomSearchQuery]);

    // todo 내가 보낸 제일 마지막 메시지 인덱스 (읽음 표시용)
    const lastMyMessageIndex = useMemo(() => {
        for (let i = localMessages.length - 1; i >= 0; i--) {
            if (String(localMessages[i].senderId) === myId) return i;
        }
        return -1;
    }, [localMessages, myId]);

    // 가장 아래로 스크롤하는 함수 (전체 문서 기준)
    const scrollToBottom = () => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    };

    // 1. 레이아웃 안정화 및 초기 스크롤
    useLayoutEffect(() => {
        if (!isLoading && !isReady && isSocketReady) {
            if (localMessages.length > 0) {
                window.scrollTo(0, document.documentElement.scrollHeight);
                requestAnimationFrame(() => {
                    window.scrollTo(0, document.documentElement.scrollHeight);
                    setIsReady(true);
                });
            } else {
                requestAnimationFrame(() => {
                    setIsReady(true);
                });
            }
        }
    }, [isLoading, localMessages.length, isReady, isSocketReady]);

    // 2. 메시지가 추가될 때 부드럽게 스크롤
    useEffect(() => {
        if (isReady && localMessages.length > 0 && isSocketReady) {
            scrollToBottom();
        }
    }, [localMessages.length, isReady, isSocketReady]);

    // 3. 채팅방을 나갈 때(언마운트) 전역 안 읽은 개수 다시 가져오도록 설정
    useEffect(() => {
        return () => {
            queryClient.invalidateQueries({ queryKey: ['chatUnreadCount'] });
        };
    }, [queryClient]);

    // 소켓이 준비되지 않은 상태에서 렌더링을 시도하면 STOMP 커넥션 에러가 발생할 수 있음
    if (!isSocketReady) {
        return (
            <HeaderLayout headerSlot={<MainHeader title="연결 중..." />}>
                <div className="flex h-[calc(100vh-100px)] items-center justify-center text-gray-400">
                    채팅 서버에 연결하고 있습니다...
                </div>
            </HeaderLayout>
        );
    }

    // 메시지 전송 함수 
    const handleSendMessage = (text: string) => {
        sendMessage(text);
    }

    // 채팅 종료 함수 
    const handleEndChat = () => {
        setIsMenuOpen(false);

        setConfirmPopUpConfig({
            title: "채팅을 종료하시겠습니까?",
            content: "더이상 대화가 불가능하며,\n이후 채팅방 나가기를 통해 목록에서 제거됩니다.",
            leftButtonText: "종료하기",
            onConfirm: () => {
                endChat({ roomId: Number(roomId) }, {
                    onSuccess: () => {
                        setLocalIsTerminated(true);
                        queryClient.invalidateQueries({ queryKey: ['chatRoom', roomId] });
                        setConfirmPopUpConfig(null);
                    }
                });
            }
        });
    }

    // 채팅방 나가기 함수 (목록에서 삭제)
    const handleExitChat = () => {
        setIsMenuOpen(false);
        
        setConfirmPopUpConfig({
            title: "채팅방을 나가시겠습니까?",
            content: "방을 나가면 채팅목록에서 사라지며\n다시 복구할 수 없습니다.",
            leftButtonText: "나가기",
            onConfirm: () => {
                exitChat({ roomId: Number(roomId) }, {
                    onSuccess: () => {
                        navigate('/chat', { replace: true });
                        setConfirmPopUpConfig(null);
                    }
                });
            }
        });
    }

    return (
        <HeaderLayout
            headerSlot={
                !isSearching ? (
                    <div className="fixed left-0 right-0 top-0 z-50 bg-white">
                        <MainHeader
                            title={roomInfo?.name}
                            rightActions={[
                                { icon: 'search', onClick: () => setIsSearching(true) },
                                { icon: 'option', onClick: () => setIsMenuOpen(!isMenuOpen) }
                            ]}
                        />

                        {/* 모집 공고 정보 바 (TEAM_RECRUIT 유형일 때만) */}
                        {isTeamRecruit && requestInfo.recruitmentTitle && (
                            <>
                                <div className="h-[10px] bg-white" />
                                <div className="px-[25px] pb-[10px] w-full bg-white">
                                    <div 
                                        className={`mx-auto flex max-w-[380px] flex-col rounded-[5px] px-[15px] py-[10px] transition-all duration-300 bg-gray-100 border border-gray-150 ${isRecruitExpanded ? 'gap-[10px]' : 'h-[40px] justify-center'}`} 
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-[10px]">
                                                <span className="text-m-14 tracking-[-0.56px] text-gray-650 whitespace-nowrap">
                                                    모집 공고
                                                </span>
                                                <span 
                                                    onClick={() => requestInfo.activityId && navigate(`/activity/recruit/${requestInfo.recruitmentId}`)}
                                                    className="text-m-14 tracking-[-0.56px] text-primary underline cursor-pointer"
                                                >
                                                    {requestInfo.recruitmentTitle}
                                                </span>
                                            </div>
                                            <Toggle 
                                                toggled={isRecruitExpanded} 
                                                onToggle={setIsRecruitExpanded} 
                                                width={20} 
                                                height={20} 
                                                strokeColor="#A1A1A1"
                                            />
                                        </div>
                                        
                                        {isRecruitExpanded && (
                                            <div className="flex items-start gap-[10px]">
                                                <span className="text-m-14 tracking-[-0.56px] text-gray-650 whitespace-nowrap">
                                                    요청 내용
                                                </span>
                                                <span className="text-m-14 tracking-[-0.56px] text-gray-750">
                                                    {requestInfo.content}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                            
                        )}

                        {/* 더보기 메뉴 드롭다운 */}
                        {isMenuOpen && (
                            <div 
                                ref={menuRef}
                                className="absolute right-[25px] top-[55px] z-[99] min-w-[160px] bg-white rounded-[10px] shadow-[0_4px_20px_0_rgba(0,0,0,0.1)] border border-gray-150 overflow-hidden flex flex-col items-start p-[15px_20px_15px_15px] gap-[10px]"
                            >
                                {isTerminated ? (
                                    <button 
                                        onClick={handleExitChat}
                                        className="w-full flex items-center gap-[15px] hover:bg-gray-50 transition-colors"
                                    >
                                        <Icon name="logOut" className="w-[24px] h-[24px]" />
                                        <span className="text-r-16 text-[#FF3838] tracking-[-0.64px]">채팅 나가기</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleEndChat}
                                        className="w-full flex items-center gap-[15px] hover:bg-gray-50 transition-colors"
                                    >
                                        <Icon name="logOut" className="w-[24px] h-[24px]" />
                                        <span className="text-r-16 text-[#FF3838] tracking-[-0.64px]">채팅 종료하기</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <header 
                        className="fixed left-0 right-0 top-0 z-50 flex items-center bg-white px-[25px] py-[10px]"
                        style={{
                            paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
                            top: 'env(safe-area-inset-top, 0px)',
                        }}
                    >
                        <div className="flex items-center justify-center gap-[15px] w-full">
                            <div className="flex items-center w-[282px] h-[40px] px-[15px] py-[8px] bg-gray-150 rounded-[10px]">
                                <Icon name="search" style={{ width: '20px', height: '20px' }} />
                                <input 
                                    autoFocus
                                    type="text"
                                    value={roomSearchQuery}
                                    onChange={(e) => setRoomSearchQuery(e.target.value)}
                                    placeholder="채팅 내용 검색"
                                    aria-label="채팅 내용 검색"
                                    className="flex-1 ml-[15px] bg-transparent border-none outline-none text-gray-750 text-r-16 tracking-[-0.64px] placeholder:text-gray-400"
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    setIsSearching(false);
                                    setRoomSearchQuery("");
                                }}
                                className="text-gray-650 text-B-16-hn tracking-[-0.4px] shrink-0"
                            >
                                취소
                            </button>
                        </div>
                    </header>
                )
            }
        >
            <div 
                className={`flex flex-col pb-[80px] ${!isReady ? 'invisible' : 'visible'} ${allMessages.length === 0 ? 'min-h-[calc(100dvh-100px)] justify-end' : ''}`}
                style={{
                    paddingTop: `calc(${isTeamRecruit ? (isRecruitExpanded ? '200px' : '134px') : '74px'} + env(safe-area-inset-top, 0px))`
                }}
            >
                {/* 상단 정보 영역 */}
                {roomInfo && requestInfo && (
                    <ChatRoomInfo 
                        partner={roomInfo} 
                        requestInfo={requestInfo} 
                    />
                )}
                
                {/* 메시지 리스트 영역 */}
                <div className="flex flex-col mt-[40px] px-[25px]">
                    {localMessages.map((msg, index) => {
                        const isMe = String(msg.senderId) === myId;
                        
                        // 날짜 구분선 표시 여부 확인
                        const showDateDivider = index === 0 || !dayjs(msg.createdAt).isSame(dayjs(localMessages[index - 1].createdAt), 'day');

                        // 연속 메시지 판단 (작성자가 같고 1분 이내)
                        const isSameAsPrev = index > 0 && msg.senderId === localMessages[index - 1].senderId
                            && dayjs(msg.createdAt).isSame(dayjs(localMessages[index - 1].createdAt), 'minute');

                        const isSameAsNext = index < localMessages.length - 1 && msg.senderId === localMessages[index + 1].senderId
                            && dayjs(msg.createdAt).isSame(dayjs(localMessages[index + 1].createdAt), 'minute');
                        
                        // 말풍선 곡률: 중간 메시지는 둥글게, 마지막 메시지만 꼬리 노출
                        const bubbleRounding = isMe 
                            ? (isSameAsNext ? 'rounded-[20px]' : 'rounded-l-[20px] rounded-br-[20px] rounded-tr-none')
                            : (isSameAsNext ? 'rounded-[20px]' : 'rounded-t-[20px] rounded-br-[20px] rounded-bl-none');

                        return (
                            <React.Fragment key={msg.id}>
                                {
                                    // 날짜 구분선
                                    showDateDivider && (
                                    <div className="flex items-center gap-[15px] my-[10px]">
                                        <div className="flex-1 h-[1px] bg-gray-150"></div>
                                        <div className="text-r-12 text-gray-650 tracking-[-0.24px] shrink-0">
                                            {formatFullDateWithDay(msg.createdAt)}
                                        </div>
                                        <div className="flex-1 h-[1px] bg-gray-150"></div>
                                    </div>
                                )}
                                
                                <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isSameAsPrev ? 'mt-[3px]' : 'mt-[7px]'}`}>
                                    <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-[6px] max-w-[80%]`}>
                                        
                                        {/* 상대방일 때 프로필 영역: isSameAsPrev일 때도 공간은 차지해야 함 */}
                                        {!isMe && (
                                            <div className="w-[32px] mr-[4px] flex-shrink-0 self-start">
                                                {!isSameAsPrev && (
                                                    roomInfo?.profileImg ? (
                                                        <img 
                                                            src={roomInfo.profileImg} 
                                                            alt={`${roomInfo.name} 프로필`} 
                                                            className="w-[32px] h-[32px] rounded-full object-cover shrink-0 cursor-pointer" 
                                                            onClick={() => navigate(`/alumni/profile/${roomInfo?.id}`)}
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="w-[32px] h-[32px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                                                            onClick={() => navigate(`/alumni/profile/${roomInfo?.id}`)}
                                                        >
                                                            <span className="text-[12px] font-bold text-gray-600">
                                                                {roomInfo?.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} pt-[3px] gap-[7px]`}>
                                            {!isMe && !isSameAsPrev && (
                                                <span className="text-r-12 text-gray-750 tracking-[-0.24px] ml-[2px] ">{roomInfo?.name}</span>
                                            )}
                                            <div className={`px-[13px] py-[7px] text-r-16 tracking-[-0.64px] ${bubbleRounding} ${
                                                isMe ? 'bg-primary text-white' : 'bg-gray-150 text-gray-750'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </div>

                                        {/* todo 시간 및 읽음 상태 표시 영역 */}
                                        <div className={`flex flex-col justify-end gap-[2px] mb-[2px] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* 1. 내 메시지이고 안 읽었을 때 & "내가 보낸 전체 메시지 중 마지막"일 때만 '1' 표시 */}
                                            {isMe && !msg.isRead && index === lastMyMessageIndex && (
                                                <span className="text-[11px] text-primary font-bold leading-none mb-[1px]">1</span>
                                            )}

                                            {/* 2. 내 메시지이고 읽었을 때 & "내가 보낸 전체 메시지 중 마지막"일 때만 '읽음' 표시 */}
                                            {isMe && msg.isRead && index === lastMyMessageIndex && (
                                                <span className="text-[11px] text-gray-400 font-medium leading-none mb-[1px]">읽음</span>
                                            )}
                                            
                                            {/* 3. 시간 표시: 묶음의 마지막 메시지일 때만 노출 
                                                상대가 읽었으면 읽은 시간(readAt), 안 읽었으면 보낸 시간(createdAt) 표시
                                            */}
                                            {!isSameAsNext && (
                                                <span className="text-r-12 text-gray-750 tracking-[-0.24px] shrink-0">
                                                    {msg.isRead && msg.readAt 
                                                        ? formatTime(msg.readAt) 
                                                        : formatTime(msg.createdAt)
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {/* 채팅 종료 구분선 */}
                    {isTerminated && (
                        <div className="flex items-center gap-[15px] my-[20px]">
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                            <div className="text-r-12 text-gray-650 tracking-[-0.24px] shrink-0">
                                채팅이 종료되었습니다
                            </div>
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                        </div>
                    )}
                    {/* 상대방이 나갔을 때 표시 */}
                    {opponentExited && (
                        <div className="flex items-center gap-[15px] my-[20px]">
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                            <div className="text-r-12 text-gray-650 tracking-[-0.24px] shrink-0">
                                상대방이 채팅방을 나갔습니다
                            </div>
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 고정된 입력창 */}
            {!isTerminated && <TypingArea onSend={handleSendMessage} />}
            
            <PopUp isOpen={isLoading} type="loading" />
            
            {confirmPopUpConfig && (
                <PopUp 
                    isOpen={!!confirmPopUpConfig}
                    type="warning"
                    title={confirmPopUpConfig.title}
                    content={confirmPopUpConfig.content}
                    leftButtonText={confirmPopUpConfig.leftButtonText}
                    onLeftClick={confirmPopUpConfig.onConfirm}
                    onRightClick={() => setConfirmPopUpConfig(null)}
                />
            )}

            {!isLoading && !roomInfo && (
                <div className="fixed inset-0 flex justify-center items-center bg-white z-[60] text-gray-400">
                    채팅방 정보를 찾을 수 없습니다.
                </div>
            )}
        </HeaderLayout>
    )
}
