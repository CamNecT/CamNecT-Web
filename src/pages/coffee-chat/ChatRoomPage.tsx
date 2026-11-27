import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
// [모바일 LAN UI 테스트 전용] 아래 import 활성화
// import { isStompEnabled } from "../../api/stompClient";
import BottomSheetIcon from '../../components/BottomSheetModal/Icon';
import Icon from "../../components/Icon";
import { LinkifiedText } from "../../components/LinkifiedText";
import PopUp from "../../components/Pop-up";
import PressableMotion from "../../components/PressableMotion";
import ReportModal from "../../components/report/ReportModal";
import Toggle from "../../components/Toggle/Toggle";
import { useChatRoom, useChatRoomClose, useChatRoomCloseAndExit, useChatRoomExit } from "../../hooks/useChatQuery";
import { useStompChat } from "../../hooks/useStompChat";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import type { ChatMessage } from "../../types/coffee-chat/coffeeChatTypes";
import { isAdminUserId } from '../../utils/admin';
import { formatFullDateWithDay, formatTime } from "../../utils/formatDate";
import { ChatDropdown } from "./components/ChatDropdown";
import { ChatRoomInfo } from "./components/ChatRoomInfo";
import { NewMessagePreview } from "./components/NewMessagePreview";
import { TypingArea } from "./components/TypingArea";

export const ChatRoomPage = () => {
    const { id } = useParams<{ id: string }>();

    // 방 변경 시 재마운트 (연결 이력·읽음 경계 초기화)
    return <ChatRoomContent key={id} roomId={id || ""} />;
};

const ChatRoomContent = ({ roomId }: { roomId: string }) => {

    // ==================== 외부 훅 · 전역 상태 · 서버 데이터 ====================

    // ---------- 화면 이동·쿼리 캐시 ----------
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // ---------- 로그인 사용자 ----------
    const { user } = useAuthStore();
    const userId = user?.id;

    // ---------- 메시지 전송 상태·소켓 연결 ----------
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

    // ---------- 채팅방 상세 조회 ----------
    const {
        data: chatRoomData,
        isLoading: isRoomLoading,
        isFetchedAfterMount: isRoomFetchedAfterMount,
    } = useChatRoom(roomId);

    // ---------- 채팅 종료·나가기 ----------
    const {
        mutate: endChat,
        isPending: isEndChatPending,
    } = useChatRoomClose();

    const { mutate: exitChat } = useChatRoomExit();
    const {
        mutate: endAndExitChat,
        isPending: isEndAndExitPending,
    } = useChatRoomCloseAndExit();

    // ---------- 실시간 메시지 송수신·방 구독 ----------
    const { messages: socketMessages,
        sendMessage, retryMessage, leaveChatRoom,
        isRoomSubscriptionReady } = useStompChat(roomId);

    // ======================== 로컬 상태 (useState) ========================

    // ---------- 대화 검색 ----------
    const [isSearching, setIsSearching] = useState(false);
    const [roomSearchQuery, setRoomSearchQuery] = useState("");

    // ---------- 읽음 구분선 ----------
    const [firstUnreadMessageId, setFirstUnreadMessageId]
        = useState<string | null | undefined>(undefined); // undefined 미확정 / null 경계 없음

    // ---------- 하단 고정 영역 높이 ----------
    // 현재 표시된 입력창 또는 연결 안내 영역의 실측 높이
    const [measuredBottomAreaHeight, setMeasuredBottomAreaHeight] = useState(0);

    // ---------- 메시지 관련 ----------
    // 화면 아래의 최신 상대 메시지 ID (미리보기 후보)
    const [belowCandidateMessageId, setBelowCandidateMessageId] = useState<string | null>(null);  
    // 확인된 미리보기 메시지 ID
    const [seenCandidateMessageId, setSeenCandidateMessageId] = useState<string | null>(null);
    // 화면 아래의 마지막 메시지 ID
    const [belowLastMessageId, setBelowLastMessageId] = useState<string | null>(null);

    // ---------- 채팅방 메뉴 ----------
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // ---------- 모집 공고 ----------
    const [isRecruitExpanded, setIsRecruitExpanded] = useState(false);

    // ---------- 확인·오류 팝업 ----------
    // 종료 팝업의 채팅방 삭제 선택 여부
    const [shouldDeleteChatRoom, setShouldDeleteChatRoom] = useState(false);

    // 공통 확인 팝업 설정 (문구·확정 동작)
    const [confirmPopUpConfig, setConfirmPopUpConfig] = useState<{
        title: string;
        content: string;
        leftButtonText: string;
        rightButtonText?: string;
        showDeleteCheckbox?: boolean;
        onConfirm: (shouldDeleteChatRoom?: boolean) => void;
    } | null>(null);
    const [errorPopUpConfig, setErrorPopUpConfig] = useState<{
        title: string;
        content: string;
    } | null>(null);

    // ---------- 전송 실패 메뉴 ----------
    // 메뉴가 열린 메시지 ID (없으면 null)
    const [openFailedMenuId, setOpenFailedMenuId] = useState<string | null>(null);

    // ---------- 초기 화면 배치 ----------
    // 초기 하단 스크롤 배치 완료 여부 (깜빡임 방지)
    const [isReady, setIsReady] = useState(false);

    // ---------- 실시간 연결 이력 ----------
    // false → true 단방향 전환 / 방 변경 시 초기화
    const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

    // ======================== DOM 참조 · 이전 값 (useRef) ========================

    // ---------- 하단 고정 영역 높이·스크롤 보정 ----------
    const bottomAreaRef = useRef<HTMLDivElement>(null);
    // 입력창 높이 차이 계산용 이전 높이
    const previousBottomAreaHeightRef = useRef(0);

    // ---------- 메시지 관련  ----------
    const candidateRef = useRef<HTMLDivElement>(null); // 최신 상대 메시지 말풍선 참조
    const latestMessageRef = useRef<HTMLDivElement>(null);// 마지막 메시지 말풍선 참조

    // ======================== 일반 변수 · 파생 값 ========================

    // ---------- 채팅방 이용 상태 ----------
    // 채팅 종료·상대방 퇴장 여부
    const isTerminated = Boolean(chatRoomData?.closed);
    const opponentExited = chatRoomData?.opponentExited;

    const isLoading = isRoomLoading;

    // ---------- 실시간 연결 ----------
    // 실시간 연결 준비 여부 (소켓 연결 + 방 구독)
    const isRealtimeReady = isStompConnected && isRoomSubscriptionReady;

    // 최초 연결 완료 시 렌더 중 상태 갱신 (JSX 반영 전 재렌더)
    if (isRealtimeReady && !hasConnectedOnce) {
        setHasConnectedOnce(true);
    }

    // ---------- 입력창·연결 안내 표시 ----------
    // 입력 영역 비활성 조건 (로딩·방 정보 없음·종료·상대방 퇴장)
    const isChatUnavailable = isLoading || !chatRoomData || isTerminated || opponentExited;
    // 최초 연결 전 안내문 표시 / 연결 이력이 있으면 재연결 중에도 입력창 유지
    const isComposerVisible = isRealtimeReady || hasConnectedOnce;

    // [모바일 LAN/PWA UI 테스트 전용]
    // STOMP 비활성 환경의 입력창 확인용
    // 상단 isStompEnabled import 활성화 후 아래 조건 임시 사용
    // const isComposerVisible = isRealtimeReady || hasConnectedOnce || !isStompEnabled;

    const isBottomAreaVisible = !isChatUnavailable;
    const isTypingAreaVisible = isBottomAreaVisible && isComposerVisible;
    // 위치·노출 계산에 사용할 하단 고정 영역 높이 (입력창·연결 안내가 없으면 0)
    const bottomAreaHeight = isBottomAreaVisible ? measuredBottomAreaHeight : 0;

    // ---------- 참여자·요청 정보 ----------
    const roomInfo = chatRoomData?.partner;
    const requestInfo = chatRoomData?.requestInfo;
    const isAdminPartner = isAdminUserId(roomInfo?.id);
    const isTeamRecruit = requestInfo?.type === 'TEAM_RECRUIT';

    const myId = String(userId);

    // ---------- 새 메시지 미리보기 ----------
    let latestOpponentMessage: (typeof socketMessages)[number] | undefined;

    // 소켓 수신 목록의 최신 상대 메시지 추출 (미리보기 후보)
    if (userId != null) {
        for (let index = socketMessages.length - 1; index >= 0; index--) {
            if (String(socketMessages[index].senderId) !== String(userId)) {
                latestOpponentMessage = socketMessages[index];
                break;
            }
        }
    }

    const previewMessageCandidate = latestOpponentMessage ? {
        id: String(latestOpponentMessage.messageId), // 같은 내용의 메시지 구별용
        message: latestOpponentMessage.message,
    } : null;

    const candidateId = previewMessageCandidate?.id;
    // 미리보기 후보 관찰 가능 여부 (화면 준비·검색 종료·후보 존재·미확인)
    const canObservePreviewCandidate = isReady && !isSearching &&
        !!candidateId && seenCandidateMessageId !== candidateId;

    // 미리보기 표시 조건 (검색 중 제외·화면 아래·미확인)
    const isPreviewVisible= !isSearching && candidateId != null &&
        belowCandidateMessageId === candidateId && seenCandidateMessageId !== candidateId;

    // ---------- 상단 연결 안내 (비활성) ----------
    // 오프라인 안내는 GlobalOfflineBanner 담당
    // const shouldShowRealtimeNotice = !isSearching && hasConnectedOnce && !isRealtimeReady && !isChatUnavailable;

    // ---------- 읽음 구분선 ----------
    // 입장 후 첫 읽음 경계 고정 (필드 누락 시 다음 응답 대기)
    if (isRoomFetchedAfterMount && firstUnreadMessageId === undefined && chatRoomData?.firstUnreadMessageId !== undefined) {
        setFirstUnreadMessageId(chatRoomData.firstUnreadMessageId);
    }

    // ==================== 메시지 가공 (useMemo) ====================

    // ---------- 메시지 통합 ----------
    // REST·소켓·전송 대기 메시지 병합 (중복 제거·시간순 정렬)
    const allMessages = useMemo(() => {
        // 1) REST 채팅 내역
        const remoteMessages = chatRoomData?.messages || [];

        // 2) 실시간 메시지 타입 변환
        const mappedSocketMessages = socketMessages.map((msg): ChatMessage => ({
            id: String(msg.messageId),
            roomId: String(msg.roomId),
            senderId: String(msg.senderId),
            content: msg.message,
            createdAt: msg.sendDate,
            readAt: msg.readAt,

            // 서버 수신 메시지 → 저장 완료
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

        // 같은 ID 중복 시 소켓 수신 값 우선
        mappedSocketMessages.forEach((message) => {
            serverMessagesById.set(message.id, message)
        })

        // messageId 기준 중복 제거 결과
        const serverMessages = Array.from(serverMessagesById.values());

        // 3) 현재 방의 전송 대기 메시지 추출
        const currentRoomPendingMessages = pendingMessages.filter(
            (pending) => pending.roomId === roomId
        );

        // 서버 수신이 확인된 전송 대기 메시지 제외
        const visiblePendingMessages = currentRoomPendingMessages.filter((pending) => {
            // 서버 메시지 우선 수신 시 clientMessageId로 대조
            const matchedByClientMessageId = serverMessages.some(
                (serverMessage) =>
                (serverMessage.clientMessageId !== null &&
                    serverMessage.clientMessageId === pending.clientMessageId)
            );

            // ACK(전송 확인 응답) 우선 수신 시 serverMessageId로 대조
            const matchedByServerMessageId =
                // 최초 ACK 수신 전 serverMessageId 미할당
                pending.serverMessageId !== undefined &&
                serverMessagesById.has(String(pending.serverMessageId));

            // 서버 수신 미확인 메시지만 유지
            return !matchedByClientMessageId && !matchedByServerMessageId;
        });

        // 4) 화면에 남길 전송 대기 메시지 타입 변환
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

                // 전송 대기 메시지의 읽음 상태 초기값
                isRead: false,
                readAt: null // 읽음 확인 전
            })
        );

        // 5) 서버 메시지 + 전송 대기 메시지 병합
        const mergedMessages = [
            ...serverMessages,
            ...mappedPendingMessages,
        ]

        // 6) 전송 시간순 정렬
        return mergedMessages.sort(
            (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
        );
    }, [chatRoomData?.messages, socketMessages, pendingMessages, myId, roomId]);

    // ---------- 대화 검색 ----------
    // 검색어 필터링 결과 (현재 화면의 메시지 목록)
    const localMessages = useMemo(() => {
        if (!isSearching || !roomSearchQuery.trim()) return allMessages;
        return allMessages.filter(msg =>
            msg.content.toLowerCase().includes(roomSearchQuery.toLowerCase())
        );
    }, [allMessages, isSearching, roomSearchQuery]);

    // ---------- 읽음 표시 ----------
    // 내 마지막 전송 완료 메시지 인덱스
    const lastMyMessageIndex = useMemo(() => {
        for (let i = localMessages.length - 1; i >= 0; i--) {
            const message = localMessages[i];
            
            if (String(message.senderId) === myId && message.deliveryState === 'sent') {
                return i;
            }
        }
        return -1;
    }, [localMessages, myId]);

    // ---------- 최근 메시지 이동 관련 ----------
    // 화면 목록의 마지막 메시지
    const latestMessage = localMessages.at(-1);
    const latestMessageId = latestMessage?.id;
    const isRecentMessageButtonVisible =
        isReady && latestMessage != null &&
        belowLastMessageId === latestMessageId &&
        !isPreviewVisible;

    // ==================== 외부 동기화 · 화면 배치 (useEffect / useLayoutEffect) ====================

    // ---------- 채팅방 퇴장 ----------
    // 브라우저 종료·새로고침 시 STOMP 퇴장 처리
    // SPA 내부 이동 시 useStompChat 클린업에서 처리
    useEffect(() => {
        const handleBeforeUnload = () => {
            leaveChatRoom();
        };

        // 브라우저 종료·새로고침 이벤트 등록
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [leaveChatRoom]);

    // ---------- 전송 대기 메시지 정리 ----------
    // REST 저장 확인 항목 제거 (Zustand·sessionStorage)
    useEffect(() => {
        const serverMessages = chatRoomData?.messages;

        // REST 조회 전 대조 생략
        if (!serverMessages) return;

        // REST 저장 확인 메시지의 clientMessageId 목록
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
            .forEach((pending) => {                         // 서버 저장 확인 후 로컬 대기 항목 삭제
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

    // ---------- 새 메시지 미리보기 ----------
    // 후보 위치 감지 (노출 시 확인·화면 아래일 때 표시)
    useEffect(() => {
        if (!canObservePreviewCandidate) return;

        const messageElement = candidateRef.current; // 관찰할 말풍선 (상대의 최근 메시지)
        // 말풍선 DOM 미연결 시 관찰 생략
        if (!messageElement) return; 

        // 대상 요소와 뷰포트의 교차 상태 변화를 비동기로 감지
        const observer = new IntersectionObserver(
            // 브라우저의 관찰결과를 실행하는 함수 (entry : 관찰결과)
            ([entry]) => {
                // 1) 화면 노출 → 확인 처리
                if (entry.isIntersecting) {
                    setSeenCandidateMessageId(candidateId);
                    setBelowCandidateMessageId(null);
                }
                // 2) 화면 아래 → 미리보기 후보 등록
                else if (
                    // 말풍선 위쪽 끝 <-> 관찰영역 아래쪽 끝
                    entry.boundingClientRect.top >=
                    (entry.rootBounds?.bottom ?? window.innerHeight)
                ) {
                    setBelowCandidateMessageId(candidateId);
                }
                // 3) 화면 위 → 미리보기 숨김
                else {
                    setBelowCandidateMessageId(null);
                }
            },
            // 하단 고정 영역만큼 관찰 영역 축소 (가려진 말풍선 제외)
            { rootMargin: `0px 0px -${bottomAreaHeight}px 0px` }
        );

        observer.observe(messageElement); // 후보 메시지를 관찰대상에 등록

        return () => observer.disconnect();
    }, [candidateId, canObservePreviewCandidate, bottomAreaHeight]);

    // ---------- 최근 메시지 visible 탐지 ----------
    useEffect(() => {
        if (!latestMessageId) return;

        const messageElement = latestMessageRef.current;
        // 말풍선 DOM 미연결 시 관찰 생략
        if (!messageElement) return; 

        const observer = new IntersectionObserver(
            ([entry]) => {
                // 1) 화면 노출 → 확인 처리
                if (entry.isIntersecting) {
                    setBelowLastMessageId(null);
                }
                // 2) 화면 아래 → 미리보기 후보 등록
                else if (
                    // 말풍선 위쪽 끝 <-> 관찰영역 아래쪽 끝
                    entry.boundingClientRect.top >=
                    (entry.rootBounds?.bottom ?? window.innerHeight)
                ) {
                    setBelowLastMessageId(latestMessageId);
                }
                // 3) 화면 위 → 미리보기 숨김
                else {
                    setBelowLastMessageId(null);
                }
            },
            // 하단 고정 영역만큼 관찰 영역 축소 (가려진 말풍선 제외)
            { rootMargin: `0px 0px -${bottomAreaHeight}px 0px` }
        );

        observer.observe(messageElement);

        return () => observer.disconnect();
    }, [latestMessageId, bottomAreaHeight])

    // ---------- 하단 고정 영역 높이·스크롤 보정 ----------
    // 최초 높이·표시 전환을 화면을 그리기 전에 반영하고, 이후 크기 변화도 관찰
    useLayoutEffect(() => {
        if (!isBottomAreaVisible) return;

        const element = bottomAreaRef.current;
        if (!element) return;

        const updateHeight = () => {
            const height = Math.ceil(element.getBoundingClientRect().height);

            setMeasuredBottomAreaHeight((previous) =>
                previous === height ? previous : height
            );
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(element);
        return () => observer.disconnect();
    }, [isBottomAreaVisible, isTypingAreaVisible]);

    // 입력창 높이 증가분만큼 스크롤 보정 (화면 반영 전)
    useLayoutEffect(() => {
        const heightDifference = bottomAreaHeight - previousBottomAreaHeightRef.current;

        previousBottomAreaHeightRef.current = bottomAreaHeight;

        if (isTypingAreaVisible && heightDifference > 0) {
            window.scrollBy(0, heightDifference);
        }
    }, [bottomAreaHeight, isTypingAreaVisible]);

    // ---------- 초기 화면 배치 ----------
    // 최초 진입 시 하단 이동 → 다음 프레임 위치 재확인 → 화면 표시
    // isReady로 초기 배치 반복 방지
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

    // ---------- 안 읽은 메시지 개수 동기화 ----------
    // 언마운트 시 전역 개수 캐시 무효화
    useEffect(() => {
        return () => {
            queryClient.invalidateQueries({ queryKey: ['chatUnreadCount', userId] });
        };
    }, [queryClient, userId]);

    // ==================== 사용자 이벤트 핸들러 ====================

    // ---------- 메시지 전송·재전송·취소 ----------
    // 메시지 전송 시작 여부 반환 (서버 저장 여부는 메시지 상태로 관리)
    const handleSendMessage = (text: string): boolean => {
        if (isChatUnavailable) return false;

        const sendStarted = sendMessage(text);

        if (sendStarted) {
            // 메시지 화면 반영 후 하단 이동
            requestAnimationFrame(() => {
                window.scrollTo(0, document.documentElement.scrollHeight);
            });
        }

        return sendStarted;
    }

    // 메시지 재전송 함수
    const handleRetryMessage = (clientMessageId: string): boolean => {
        if (isChatUnavailable) return false;
        setOpenFailedMenuId(null); // 메뉴 닫기

        return retryMessage(clientMessageId);
    }

    // 미전송 확정 메시지의 로컬 대기 항목 삭제 (failed 전용)
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

    // ---------- 채팅 종료·나가기 ----------
    // 채팅 종료 함수
    const handleEndChat = () => {
        setIsMenuOpen(false);
        setShouldDeleteChatRoom(false); // 이전 채팅방 삭제 체크 초기화

        setConfirmPopUpConfig({
            title: "채팅을 종료하시겠습니까?",
            content: '채팅은 목록에 보관되며 더 이상 대화할 수 없습니다.\n이후 언제든 삭제할 수 있습니다.',
            leftButtonText: "채팅 종료",
            showDeleteCheckbox: true,
            onConfirm: (shouldDeleteChatRoom?: boolean) => {
                // 종료 팝업에서 '채팅방 삭제' 선택 시
                if (shouldDeleteChatRoom) {
                    endAndExitChat({ roomId }, {
                        onSuccess: () => {
                            setConfirmPopUpConfig(null);
                            navigate('/chat', { replace: true });
                        },
                        onError: () => {
                            setConfirmPopUpConfig(null);
                            setErrorPopUpConfig({
                                title: '채팅방을 삭제하지 못했습니다',
                                content: '잠시 후 다시 시도해 주세요.',
                            });
                        }
                    });
                } else {
                    endChat({ roomId }, {
                        onSuccess: () => {
                            setConfirmPopUpConfig(null);
                        },
                        onError: () => {
                            setConfirmPopUpConfig(null);
                            setErrorPopUpConfig({
                                title: '채팅방을 종료하지 못했습니다',
                                content: '잠시 후 다시 시도해 주세요.',
                            });
                        }
                    });
                }
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

    // ---------- 신고 ----------
    // 신고하기 함수
    const handleReportChat = () => {
        setIsMenuOpen(false);
        setIsReportModalOpen(true);
    }

    // 신고 접수 후 채팅 종료 선택 팝업
    const handleReportSubmitted = () => {
        setConfirmPopUpConfig({
            title: "신고 처리가 완료되었습니다",
            content: "채팅을 종료하시겠습니까?",
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

    // ---------- 메시지 이동 관련 ----------
    // 미리보기 확인 처리·대화 하단 즉시 이동
    const handlePreviewClick = () => {
        if (!candidateId) return;

        setSeenCandidateMessageId(candidateId);
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
    }

    // 아래 버튼 클릭시 하단 즉시 이동
    const handleLatestClick = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
    }

    return (
        <HeaderLayout
            includeBottomSafeArea={!isBottomAreaVisible}
            headerSlot={
                // ---------- 기본 헤더·검색 헤더 ----------
                !isSearching ? (
                    <div className="fixed left-1/2 top-0 z-50 w-full max-w-[var(--app-mobile-max-width)] -translate-x-1/2 bg-white">
                        <MainHeader
                            title={roomInfo?.name}
                            rightActions={[
                                { icon: 'search', onClick: () => setIsSearching(true) },
                                { icon: 'more_menu', onClick: () => setIsMenuOpen(!isMenuOpen), ariaLabel: '채팅방 옵션 열기' }
                            ]}
                        />

                        {/* 채팅방 상단 연결 안내 (비활성)
                        {shouldShowRealtimeNotice && (
                            <div className="flex min-h-10 w-80 items-center gap-1.5 rounded-[5px] bg-neutral-50 px-[15px] py-2 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)]">
                                <Icon name="error_circle" size={24} className="text-red" />
                                <div className="font-sans text-base font-normal leading-6 text-gray-750">
                                    연결이 불안정해요. 다시 시도해 주세요.
                                </div>
                            </div>
                        )}
                        */}

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
                                                <span className="min-w-0 text-m-14 tracking-[-0.56px] text-gray-750">
                                                    <LinkifiedText text={requestInfo.content} />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>

                        )}

                        {/* 더보기 메뉴 (종료된 방 → 나가기 / 진행 중인 방 → 종료하기) */}
                        <ChatDropdown
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            positionClassName="right-[25px] top-[55px]"
                            triggerSelector='[aria-label="채팅방 옵션 열기"]'
                            hasDivider={!isAdminPartner}
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
                                ...(!isAdminPartner
                                    ? [{
                                        label: "신고하기",
                                        icon: <BottomSheetIcon name="report" className="w-[24px] h-[24px]" />,
                                        labelClassName: "text-r-16 tracking-[-0.64px] text-gray-750",
                                        onClick: handleReportChat,
                                    }]
                                    : []),
                            ]}
                        />
                    </div>
                ) : (
                    <header
                        className="fixed left-1/2 top-0 z-50 flex w-full min-w-0 max-w-[var(--app-mobile-max-width)] -translate-x-1/2 items-center bg-white px-[25px] py-[10px]"
                        style={{
                            paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
                            top: 'env(safe-area-inset-top, 0px)',
                        }}
                    >
                        <div className="flex w-full min-w-0 items-center justify-center gap-[15px]">
                            <div className="flex h-[40px] min-w-0 flex-1 items-center rounded-[10px] bg-gray-150 px-[15px] py-[8px]">
                                <Icon name="search" className="shrink-0" style={{ width: '20px', height: '20px', color: 'var(--ColorBlack,#202023)' }} />
                                <input 
                                    autoFocus
                                    type="text"
                                    value={roomSearchQuery}
                                    onChange={(e) => setRoomSearchQuery(e.target.value)}
                                    placeholder="채팅 내용 검색"
                                    aria-label="채팅 내용 검색"
                                    className="ml-[15px] w-0 min-w-0 flex-1 border-none bg-transparent text-r-16 tracking-[-0.64px] text-gray-750 outline-none placeholder:text-gray-400"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSearching(false);
                                    setRoomSearchQuery("");
                                }}
                                className="shrink-0 whitespace-nowrap text-B-16-hn tracking-[-0.4px] text-gray-650"
                            >
                                취소
                            </button>
                        </div>
                    </header>
                )
            }
        >
            {/* ==================== 대화 본문 · 메시지 목록 ==================== */}
            {/* 입력창·연결 안내가 표시될 때만 해당 영역의 하단 여백 확보 */}
            <div
                className={`flex flex-col ${!isReady ? "invisible" : "visible"} ${
                    allMessages.length === 0
                        ? "min-h-[calc(100dvh-100px)] justify-end"
                        : ""
                }`}
                style={{
                    paddingTop: `calc(${
                        isTeamRecruit
                            ? isRecruitExpanded ? "200px" : "134px"
                            : "74px"
                    } + env(safe-area-inset-top, 0px))`,
                    paddingBottom: bottomAreaHeight,
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
                        const clientMessageId = msg.clientMessageId; // 재전송·전송 취소 시 로컬 대기 메시지를 식별

                        // 날짜 구분선 표시 여부 확인
                        const showDateDivider = index === 0 || !dayjs(msg.createdAt).isSame(dayjs(localMessages[index - 1].createdAt), 'day');

                        // 연속 메시지 묶음 (같은 작성자·같은 분)
                        const isSameAsPrev = index > 0 && msg.senderId === localMessages[index - 1].senderId
                            && dayjs(msg.createdAt).isSame(dayjs(localMessages[index - 1].createdAt), 'minute');

                        const isSameAsNext = index < localMessages.length - 1 && msg.senderId === localMessages[index + 1].senderId
                            && dayjs(msg.createdAt).isSame(dayjs(localMessages[index + 1].createdAt), 'minute');

                        // 말풍선 곡률 (중간 메시지 둥글게·마지막 메시지 꼬리 노출)
                        const bubbleRounding = isMe
                            ? (isSameAsNext ? 'rounded-[20px]' : 'rounded-l-[20px] rounded-br-[20px] rounded-tr-none')
                            : (isSameAsNext ? 'rounded-[20px]' : 'rounded-t-[20px] rounded-br-[20px] rounded-bl-none');

                        // 전송 상태별 문구·재전송 메뉴 분기
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

                                {
                                    // 이번 입장의 읽음 경계 구분선
                                    (msg.id === firstUnreadMessageId) && (
                                    <div className="flex items-center gap-[15px] mt-[10px] mb-[7px]">
                                        <div className="flex-1 h-[1px] bg-gray-150"></div>
                                        <div className="text-r-12 text-gray-650 tracking-[-0.24px] shrink-0">
                                            이곳까지 읽으셨습니다
                                        </div>
                                        <div className="flex-1 h-[1px] bg-gray-150"></div>
                                    </div>
                                )}

                                <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isSameAsPrev ? 'mt-[3px]' : 'mt-[7px]'}`}>
                                    <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-[6px] max-w-[80%]`}>

                                        {/* 상대 프로필 영역 (연속 메시지도 공간 유지) */}
                                        {!isMe && (
                                            <div className="w-[32px] mr-[4px] flex-shrink-0 self-start">
                                                {!isSameAsPrev && (
                                                    roomInfo?.profileImg ? (
                                                        <img 
                                                            src={roomInfo.profileImg} 
                                                            alt={`${roomInfo.name} 프로필`} 
                                                            className={`w-[32px] h-[32px] rounded-full object-cover shrink-0 ${isAdminPartner ? '' : 'cursor-pointer'}`}
                                                            onClick={() => {
                                                                if (!isAdminPartner) navigate(`/alumni/profile/${roomInfo?.id}`);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div 
                                                            className={`w-[32px] h-[32px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 ${isAdminPartner ? '' : 'cursor-pointer'}`}
                                                            onClick={() => {
                                                                if (!isAdminPartner) navigate(`/alumni/profile/${roomInfo?.id}`);
                                                            }}
                                                        >
                                                            <span className="text-[12px] font-bold text-gray-600">
                                                                {roomInfo?.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        <div className={`flex min-w-0 flex-col ${isMe ? 'items-end' : 'items-start'} pt-[3px] gap-[7px]`}>
                                            {!isMe && !isSameAsPrev && (
                                                <span className="text-r-12 text-gray-750 tracking-[-0.24px] ml-[2px] ">{roomInfo?.name}</span>
                                            )}

                                            {/* 채팅 메시지 */}
                                            <div className="flex min-w-0 max-w-full items-center gap-[7px] relative"
                                                ref={msg.id === latestMessage?.id ? latestMessageRef : undefined}>
                                                <div className={`min-w-0 px-[13px] py-[7px] text-r-16 tracking-[-0.64px] ${bubbleRounding}
                                                    ${isMe ? 'bg-primary text-white' : 'bg-gray-150 text-gray-750'}
                                                    ${isPending || isUnconfirmed ? 'opacity-40' : ''}`}
                                                    ref={msg.id === candidateId ? candidateRef : undefined}
                                                >
                                                    <span className="select-text whitespace-pre-wrap">
                                                        <LinkifiedText
                                                            text={msg.content}
                                                            linkClassName={isMe ? 'text-white' : 'text-primary'}
                                                        />
                                                    </span>
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

                                                        {/* 실패 아이콘 클릭 시 메뉴 */}
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

                                        {msg.deliveryState === 'sent' && (
                                            <div className={`flex flex-col justify-end gap-[2px] mb-[2px] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {/* 내 마지막 전송 완료 메시지·안 읽음 → '1' 표시 */}
                                                {isMe && !msg.isRead && index === lastMyMessageIndex && (
                                                    <span className="text-[11px] text-primary font-bold leading-none mb-[1px]">1</span>
                                                )}

                                                {/* 내 마지막 전송 완료 메시지·읽음 → '읽음' 표시 */}
                                                {isMe && msg.isRead && index === lastMyMessageIndex && (
                                                    <span className="text-[11px] text-gray-400 font-medium leading-none mb-[1px]">읽음</span>
                                                )}

                                                {/* 묶음의 마지막 메시지만 전송 시간 표시 */}
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
                        <div className="flex items-center gap-[15px] my-[10px]">
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                            <div className="text-r-12 text-gray-650 tracking-[-0.24px] shrink-0">
                                채팅이 종료되었습니다
                            </div>
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                        </div>
                    )}
                    {/* 상대방이 나갔을 때 표시 */}
                    {opponentExited && (
                        <div className="flex items-center gap-[15px] my-[10px]">
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                            <div className="text-r-12 text-gray-650 tracking-[-0.24px] shrink-0">
                                상대방이 채팅방을 나갔습니다
                            </div>
                            <div className="flex-1 h-[1px] bg-gray-150"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* 최신 메시지 이동 버튼 */}
            {isRecentMessageButtonVisible && (
                <PressableMotion
                    as="button"
                    intensity="soft"
                    type="button"
                    onClick={handleLatestClick}
                    aria-label="최신 메시지로 이동"
                    className="fixed right-[40px] z-[60] inline-flex items-center gap-[3px] rounded-[40px] bg-[var(--Gray-100,#FFF)] p-[8px] shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]"
                    style={{
                        bottom: isBottomAreaVisible
                            ? bottomAreaHeight + (isTypingAreaVisible ? 16 : 40)
                            : "calc(40px + env(safe-area-inset-bottom, 0px))",
                    }}
                >
                    <Icon name="chat_preview_arrow_down" size={24} />
                </PressableMotion>
            )}

            {/* 입력창 유무와 관계없이 미확인 프리뷰 유지 (높이 측정 대상에서 제외) */}
            {isPreviewVisible && (
                <div
                    className="fixed left-1/2 z-50 flex w-full max-w-[var(--app-mobile-max-width)] -translate-x-1/2 justify-center px-[40px]"
                    style={{
                        bottom: isBottomAreaVisible
                            ? bottomAreaHeight + (isTypingAreaVisible ? 18 : 40)
                            : "calc(40px + env(safe-area-inset-bottom, 0px))",
                    }}
                >
                    <NewMessagePreview
                        message={previewMessageCandidate?.message ?? ""}
                        onClick={handlePreviewClick}
                    />
                </div>
            )}

            {/* ==================== 하단 고정 영역 · 입력창 / 연결 안내 ==================== */}
            {isBottomAreaVisible && (
                <div
                    ref={bottomAreaRef}
                    className="fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-mobile-max-width)] -translate-x-1/2"
                >
                    {isTypingAreaVisible ? (
                        <TypingArea
                            onSend={handleSendMessage}
                            disabled={isChatUnavailable}
                        />
                    ) : (
                        <div
                            role="status"
                            aria-live="polite"
                            className="flex w-full justify-center border-t border-gray-150 bg-white pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]"
                        >
                            <span className="text-m-16 text-gray-650 text-center tracking-[-0.4px]">
                                연결 중에는 이전 대화만 확인할 수 있어요
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== 팝업 · 신고 모달 · 방 정보 없음 안내 ==================== */}
            <PopUp isOpen={isLoading} type="loading" />

            {confirmPopUpConfig && (
                <PopUp
                    isOpen={!!confirmPopUpConfig}
                    type="warning"
                    title={
                        confirmPopUpConfig.showDeleteCheckbox && shouldDeleteChatRoom
                            ? "채팅방을 삭제하시겠습니까?"
                            : confirmPopUpConfig.title
                    }
                    content={
                        confirmPopUpConfig.showDeleteCheckbox && shouldDeleteChatRoom
                            ? "채팅방과 모든 대화 내역이 완전히 삭제되며,\n다시는 복구할 수 없습니다!" 
                            : confirmPopUpConfig.content 
                    }
                    leftButtonText={
                        confirmPopUpConfig.showDeleteCheckbox
                            ? (shouldDeleteChatRoom ? "채팅삭제" : "채팅종료")
                            : confirmPopUpConfig.leftButtonText
                    }
                    rightButtonText={confirmPopUpConfig.rightButtonText}
                    checkbox={
                        confirmPopUpConfig.showDeleteCheckbox
                            ? {
                                label: '채팅방 삭제',
                                checked: shouldDeleteChatRoom,
                                onChange: setShouldDeleteChatRoom,
                            }
                            : undefined
                    }
                    isActionPending={isEndChatPending || isEndAndExitPending}
                    onLeftClick={() => confirmPopUpConfig.onConfirm(shouldDeleteChatRoom)}
                    onRightClick={() => setConfirmPopUpConfig(null)}
                />
            )}

            {errorPopUpConfig && (
                <PopUp
                    isOpen={true}
                    type="error"
                    title={errorPopUpConfig.title}
                    content={errorPopUpConfig.content}
                    onClick={() => setErrorPopUpConfig(null)}
                />
            )}

            {roomInfo && !isAdminPartner && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={Number(roomInfo.id)}
                    reportedUserName={roomInfo.name}
                    reportedPostId={Number(roomId)}
                    postType="CHAT"
                    showDefaultSuccessPopup={false}
                    onSubmitted={handleReportSubmitted}
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
