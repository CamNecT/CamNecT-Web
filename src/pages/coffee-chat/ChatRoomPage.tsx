import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
// [모바일 LAN UI 테스트 전용] 필요할 때 아래 import를 활성화한다.
// import { isStompEnabled } from "../../api/stompClient";
import Icon from "../../components/Icon";
import PopUp from "../../components/Pop-up";
import Toggle from "../../components/Toggle/Toggle";
import { useChatRoom, useChatRoomClose, useChatRoomExit} from "../../hooks/useChatQuery";
import { useStompChat } from "../../hooks/useStompChat";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import type { ChatMessage } from "../../types/coffee-chat/coffeeChatTypes";
import { formatFullDateWithDay, formatTime } from "../../utils/formatDate";
import { ChatDropdown } from "./components/ChatDropdown";
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
    const userId = user?.id;

    // 전송 대기 메시지 리스트
    const {
        pendingMessages,
        removePendingMessage,
        removeFailedPendingMessage,
        isStompConnected,
    } = useChatStore(
        useShallow((state) => ({
            pendingMessages: state.pendingMessages,
            removePendingMessage: state.removePendingMessage,
            removeFailedPendingMessage: state.removeFailedPendingMessage,
            isStompConnected: state.isStompConnected,
        }))
    );

    const { data: chatRoomData, isLoading: isRoomLoading } = useChatRoom(roomId);
    const { mutate: endChat } = useChatRoomClose();
    const { mutate: exitChat } = useChatRoomExit();

    const { messages: socketMessages,
        sendMessage, retryMessage, leaveChatRoom,
        isRoomSubscriptionReady } = useStompChat(roomId);

    // 검색 관련 상태
    const [isSearching, setIsSearching] = useState(false);
    const [roomSearchQuery, setRoomSearchQuery] = useState("");

    // 메뉴 관련 상태
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRecruitExpanded, setIsRecruitExpanded] = useState(false);
    const [confirmPopUpConfig, setConfirmPopUpConfig] = useState<{
        title: string;
        content: string;
        leftButtonText: string;
        onConfirm: () => void;
    } | null>(null);

    // 종료 여부 
    const isTerminated = Boolean(chatRoomData?.closed);
    const opponentExited = chatRoomData?.opponentExited;

    // 전송 실패 메시지의 드롭다운: 열려 있는 메시지의 id (없으면 null)
    const [openFailedMenuId, setOpenFailedMenuId] = useState<string | null>(null);

    // 메뉴 바깥 클릭/터치 감지 로직은 ChatDropdown 컴포넌트로 이동함 (menuRef, useEffect 제거)

    // STOMP 채팅방 나가기 처리 (브라우저 종료/새로고침 대응)
    // SPA 내부 이동 시 퇴장 처리는 useStompChat 훅의 클린업에서 자동으로 수행
    useEffect(() => {
        const handleBeforeUnload = () => {
            leaveChatRoom();
        };

        // beforeunload : 브라우저 수준의 종료/새로고침시의 대응
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [leaveChatRoom]);

    // REST 채팅 내역에서 서버 저장이 확인된 메시지를 zustand / sessionStorage에서 제거
    useEffect(() => {
        const serverMessages = chatRoomData?.messages;

        // 아직 REST 조회 결과가 없으면 대조하지 않음
        if (!serverMessages) return;

        // REST 정상 메시지들의 clientMessageId 목록
        const serverClientMessageIds = new Set(
            serverMessages
                .map((message) => message.clientMessageId)
                .filter(
                    (clientMessageId): clientMessageId is string =>
                        clientMessageId !== null
                )
        );

        pendingMessages
            .filter((pending) => pending.roomId === roomId) // 현재 채팅방 pending만 확인
            .filter((pending) =>                            // REST에 같은 clientMessageId가 있는 pending만 선택
                serverClientMessageIds.has(
                    pending.clientMessageId
                )
            )
            .forEach((pending) => {                         // 서버 저장이 확인됐으므로 로컬에서 실제 삭제
                removePendingMessage(
                    pending.clientMessageId
                );
            });
    }, [
        chatRoomData?.messages,
        pendingMessages,
        roomId,
        removePendingMessage,
    ]);

    // 초기 진입 시 깜빡임 방지를 위한 상태
    const [isReady, setIsReady] = useState(false);

    const isLoading = isRoomLoading;
    // 실시간 채팅 기능 이용가능 여부
    const isRealtimeReady = isStompConnected && isRoomSubscriptionReady;
    // [모바일 LAN UI 테스트 전용]
    // STOMP 없이 TypingArea와 로컬 실패 UI를 확인하려면 isStompEnabled를 import하고
    // 아래 조건을 `isRealtimeReady || !isStompEnabled`로 임시 변경한다.
    const canUseComposer = isRealtimeReady;
    const isChatUnavailable = isLoading || !chatRoomData || isTerminated || opponentExited;

    // 전송 버튼 비활성화 조건 : 채팅방 사용 불가능 OR 실시간 채팅 준비 안됨
    const isSendDisabled = isChatUnavailable || !canUseComposer;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const roomInfo = chatRoomData?.partner;
    const requestInfo = chatRoomData?.requestInfo;
    const isTeamRecruit = requestInfo?.type === 'TEAM_RECRUIT';

    const myId = String(userId);

    // 기존 채팅 내역 + 실시간 채팅 내역 병합 (pending 메시지)
    const allMessages = useMemo(() => {
        // 1. API로 받은 기존 채팅 내역 데이터들
        const remoteMessages = chatRoomData?.messages || [];

        // 2. 실시간 메시지를 도메인 타입으로 변환
        const mappedSocketMessages = socketMessages.map((msg): ChatMessage => ({
            id: String(msg.messageId),
            roomId: String(msg.roomId),
            senderId: String(msg.senderId),
            content: msg.message,
            createdAt: msg.sendDate,
            readAt: msg.readAt,

            // 서버에서 수신된 메시지는 저장이 완료된 상태
            clientMessageId: msg.clientMessageId,
            deliveryState: 'sent',
            // todo 재전송 기능 구현 전까지 서버 메시지의 재시도 횟수는 관리하지 않음
            retryCount: null,

            // 읽음 여부 판단용
            isRead: msg.read,
        }));

        const serverMessagesById = new Map<string, ChatMessage>();

        remoteMessages.forEach((message) => {
            serverMessagesById.set(message.id, message)
        });

        mappedSocketMessages.forEach((message) => {
            serverMessagesById.set(message.id, message)
        })

        // messageId 중복제거된 서버 메시지들
        const serverMessages = Array.from(serverMessagesById.values());

        // 3. 현재 roomId의 pendingMessages들 선택
        const currentRoomPendingMessages = pendingMessages.filter(
            (pending) => pending.roomId === roomId
        );

        // 중복 제거: 서버에서 이미 수신되어 화면에 표시되고 있는 pending 메시지는 제외
        const visiblePendingMessages = currentRoomPendingMessages.filter((pending) => {
            // 1) 서버 메시지가 먼저 도착 (clientMessageId로 확인)
            const matchedByClientMessageId = serverMessages.some(
                (serverMessage) =>
                (serverMessage.clientMessageId !== null &&
                    serverMessage.clientMessageId === pending.clientMessageId)
            );

            // 2) ACK가 먼저 도착 (serverMessageId로 확인)
            const matchedByServerMessageId =
                // null이 아니라 undefined인 이유
                pending.serverMessageId !== undefined &&
                serverMessagesById.has(String(pending.serverMessageId));

            // 서버 메시지가 아닌 pending 메시지만 유지
            return !matchedByClientMessageId && !matchedByServerMessageId;
        });

        // 4. 화면에 남길 임시 메시지를 ChatMessage 타입으로 변환
        const mappedPendingMessages = visiblePendingMessages.map(
            (pending): ChatMessage => ({
                id: `pending:${pending.clientMessageId}`, // clientMessageId로 임시 ID 설정
                roomId: pending.roomId,
                senderId: myId, // 내 ID로 설정
                content: pending.content,
                createdAt: pending.createdAt,
                clientMessageId: pending.clientMessageId,
                deliveryState: pending.state, // pending / sent / failed
                retryCount: pending.retryCount,
                errorCode: pending.errorCode,

                // 읽음 여부: pending 상태이므로 당연히 false
                isRead: false,
                readAt: null // 아직 전송 전이거나 서버에서 응답이 안 왔으므로 null
            })
        );

        // 5. 기존 메시지 + 실시간 메시지 + pending 메시지 모두 합치기
        const mergedMessages = [
            ...serverMessages,
            ...mappedPendingMessages,
        ]

        // 6 메시지 시간 순 정렬
        return mergedMessages.sort(
            (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
        );
    }, [chatRoomData?.messages, socketMessages, pendingMessages, myId, roomId]);

    // 검색어 필터링 적용
    const localMessages = useMemo(() => {
        if (!isSearching || !roomSearchQuery.trim()) return allMessages;
        return allMessages.filter(msg =>
            msg.content.toLowerCase().includes(roomSearchQuery.toLowerCase())
        );
    }, [allMessages, isSearching, roomSearchQuery]);

    // 내가 보낸 제일 마지막 메시지 인덱스 (읽음 표시용)
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

    // todo 1. 레이아웃 안정화 및 초기 스크롤
    useLayoutEffect(() => {
        if (!isLoading && !isReady) {
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
    }, [isLoading, localMessages.length, isReady]);

    // 2. 메시지가 추가될 때 부드럽게 스크롤
    useEffect(() => {
        if (isReady && localMessages.length > 0) {
            scrollToBottom();
        }
    }, [localMessages.length, isReady]);

    // 3. 채팅방을 나갈 때(언마운트) 전역 안 읽은 개수 다시 가져오도록 설정
    useEffect(() => {
        return () => {
            queryClient.invalidateQueries({ queryKey: ['chatUnreadCount', userId] });
        };
    }, [queryClient, userId]);

    // 메시지 전송 함수
    const handleSendMessage = (text: string): boolean => {
        if (isSendDisabled) return false;

        return sendMessage(text);
    }

    // 메시지 재전송 함수
    const handleRetryMessage = (clientMessageId: string): boolean => {
        if (isSendDisabled) return false;
        setOpenFailedMenuId(null); // 메뉴 닫기

        return retryMessage(clientMessageId);
    }

    // 서버가 미전송으로 확정한 failed 메시지만 삭제한다.
    // 삭제는 로컬 대기 항목 제거만 수행하며 publish를 호출하지 않는다.
    const handleRemoveMessage = (clientMessageId: string) => {
        setOpenFailedMenuId(null); // 메뉴 닫기

        setConfirmPopUpConfig({
            title: "전송을 취소하시겠습니까?",
            content: "해당 메시지는 삭제됩니다.",
            leftButtonText: "삭제",
            onConfirm: () => {
                removeFailedPendingMessage(clientMessageId);
                setConfirmPopUpConfig(null);
            }
        });
    }

    // 채팅 종료 함수
    const handleEndChat = () => {
        setIsMenuOpen(false);

        setConfirmPopUpConfig({
            title: "채팅을 종료하시겠습니까?",
            content: "더이상 대화가 불가능하며,\n이후 채팅방 나가기를 통해 목록에서 제거됩니다.",
            leftButtonText: "종료하기",
            onConfirm: () => {
                endChat({ roomId }, {
                    onSuccess: () => {
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
                exitChat({ roomId }, {
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
                                { icon: 'more_menu', onClick: () => setIsMenuOpen(!isMenuOpen), ariaLabel: '채팅방 옵션 열기' }
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

                        {/* 더보기 메뉴 드롭다운
                            기존 인라인 마크업 → ChatDropdown 컴포넌트로 교체.
                            위치/셀렉터/스타일 값은 기존과 동일하고, 항목만 items 배열로 옮김 */}
                        <ChatDropdown
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            positionClassName="right-[25px] top-[55px]"
                            triggerSelector='[aria-label="option"]'
                            hasDivider={false}
                            items={[
                                isTerminated
                                    ? {
                                        label: "채팅 나가기",
                                        icon: <Icon name="logOut" className="w-[24px] h-[24px]" />,
                                        labelClassName: "text-r-16 tracking-[-0.64px] text-[#FF3838]",
                                        onClick: handleExitChat,
                                    }
                                    : {
                                        label: "채팅 종료하기",
                                        icon: <Icon name="logOut" className="w-[24px] h-[24px]" />,
                                        labelClassName: "text-r-16 tracking-[-0.64px] text-[#FF3838]",
                                        onClick: handleEndChat,
                                    },
                            ]}
                        />
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
                                <Icon name="search" style={{ width: '20px', height: '20px', color: 'var(--ColorBlack,#202023)' }} />
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
                <div className="flex flex-col mt-[40px] px-[25px] select-none">
                    {localMessages.map((msg, index) => {
                        const isMe = String(msg.senderId) === myId;
                        const clientMessageId = msg.clientMessageId; // 삭제 식별용 아이디

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
                        
                        const isPending = msg.deliveryState === 'pending';
                        const isUnconfirmed = msg.deliveryState === 'unconfirmed';
                        const isFailed = msg.deliveryState === 'failed'; 
                    
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

                                            {/* 채팅 메시지 */}
                                            <div className="flex items-center gap-[7px] relative">
                                                <div className={`px-[13px] py-[7px] text-r-16 tracking-[-0.64px] ${bubbleRounding}
                                                    ${isMe ? 'bg-primary text-white' : 'bg-gray-150 text-gray-750'}
                                                    ${isPending || isUnconfirmed ? 'opacity-40' : ''}`}>
                                                    <span className="select-text">{msg.content}</span>
                                                </div>

                                                {/* 전송 실패 메시지 */}
                                                {isMe && (isUnconfirmed || isFailed) && (
                                                    <div className="shrink-0 flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            data-dropdown-trigger
                                                            aria-label={isFailed ? "전송 실패, 재전송 메뉴 열기" : "전송 확인 안 됨, 재전송 메뉴 열기"}
                                                            className="flex items-center justify-center"
                                                            onClick={() => setOpenFailedMenuId(openFailedMenuId === msg.id ? null : msg.id)}
                                                        >
                                                            <Icon name="send_failed" size={24} className="text-red" />
                                                        </button>

                                                        {/* 아이콘 클릭시 메뉴 드롭다운 */}
                                                        <ChatDropdown
                                                            isOpen={openFailedMenuId === msg.id}
                                                            onClose={() => setOpenFailedMenuId(null)}
                                                            positionClassName="bottom-full right-0 mb-[7px]"
                                                            triggerSelector="[data-dropdown-trigger]"
                                                            hasDivider={true}
                                                            items={[
                                                                {
                                                                    label: "재전송",
                                                                    labelClassName: "text-m-16 tracking-[-0.4px] text-gray-750",
                                                                    onClick: () => clientMessageId && handleRetryMessage(clientMessageId),
                                                                },
                                                                // isFailed일 때만 '전송 취소' 항목 포함
                                                                ...(isFailed ? [{
                                                                    label: "전송 취소",
                                                                    labelClassName: "text-m-16 tracking-[-0.4px] text-red",
                                                                    onClick: () => clientMessageId && handleRemoveMessage(clientMessageId),
                                                                }] : []),
                                                            ]}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 
                                            todo 시간 및 읽음 상태 표시 영역 (deliveryState = sent)
                                        */}
                                        {msg.deliveryState === 'sent' && (
                                            <div className={`flex flex-col justify-end gap-[2px] mb-[2px] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {/* 1. 내 메시지이고 안 읽었을 때 & "내가 보낸 전체 메시지 중 마지막"일 때만 '1' 표시 */}
                                                {isMe && !msg.isRead && index === lastMyMessageIndex && (
                                                    <span className="text-[11px] text-primary font-bold leading-none mb-[1px]">1</span>
                                                )}

                                                {/* 2. 내 메시지이고 읽었을 때 & "내가 보낸 전체 메시지 중 마지막"일 때만 '읽음' 표시 */}
                                                {isMe && msg.isRead && index === lastMyMessageIndex && (
                                                    <span className="text-[11px] text-gray-400 font-medium leading-none mb-[1px]">읽음</span>
                                                )}

                                                {/* 3. 시간 표시: 읽음 여부와 관계없이 보낸 시간을 묶음의 마지막 메시지에만 노출 */}
                                                {!isSameAsNext && (
                                                    <span className="text-r-12 text-gray-750 tracking-[-0.24px] shrink-0">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {isPending && (
                                            <span className="text-r-12 text-gray-750 tracking-[-0.24px] 
                                            shrink-0 mr-[1px] inline-flex items-center">
                                                <span>전송 중</span>
                                                <span className="inline-block w-[9px] text-left animate-loading-dots" />
                                            </span>
                                        )}

                                        {isUnconfirmed && (
                                            <span className="text-r-12 text-gray-750 tracking-[-0.24px] shrink-0 mr-[1px]">
                                                전송 확인 중
                                            </span>
                                        )}
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
            {!isChatUnavailable && (
                canUseComposer ? (
                    <TypingArea
                        onSend={handleSendMessage}
                        disabled={isSendDisabled}
                    />
                ) : (
                    <div
                        role="status"
                        aria-live="polite"
                        className="
                            fixed bottom-0 left-1/2 z-50
                            w-full max-w-[430px]
                            -translate-x-1/2
                            border-t border-gray-150
                            bg-white
                            px-[25px] pt-[12px]
                            pb-[calc(20px+env(safe-area-inset-bottom))]
                        "
                    >
                        <div
                            className="
                                flex min-h-[44px] flex-col
                                items-center justify-center
                                rounded-[10px] bg-gray-100
                                px-[15px] py-[8px]
                                text-center
                            "
                        >
                            <span className="text-m-14 text-gray-750">
                                연결 중에는 이전 대화만 확인할 수 있어요
                            </span>
                        </div>
                    </div>
                )
            )}

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
