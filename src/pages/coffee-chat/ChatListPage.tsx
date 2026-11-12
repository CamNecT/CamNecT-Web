import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PopUp from '../../components/Pop-up';
import { Tabs } from '../../components/Tabs';
import { useChatRooms, useClosedChatRoomsExit } from '../../hooks/useChatQuery';
import { FullLayout } from '../../layouts/FullLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import type { ChatRoomListItemType } from '../../types/coffee-chat/coffeeChatTypes';
import { ChatList } from './components/ChatList';
import SortSelector from '../../components/SortSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatDeleteButton } from './components/ChatDeleteButton';
import { ChatEmptyState } from './components/ChatEmptyState';

type SortKey = 'all' | 'active' | 'closed';

const sortLabels: Record<SortKey, string> = {
  all: '전체',
  active: '대화 중',
  closed: '종료'
};

const modalSortLabels: Record<SortKey, string> = {
  all: '전체 보기',
  active: '대화 중인 채팅방',
  closed: '종료된 채팅방'
};

const tabs = [
  { id: 'COFFEE_CHAT', label: '커피챗' },
  { id: 'TEAM_RECRUIT', label: '팀원모집' },
];

const MAX_SELECTED_ROOM_COUNT = 100;

export const ChatListPage = () => {
  const [activeId, setActiveId] = useState<ChatRoomListItemType>('COFFEE_CHAT');
  const [sortKey, setSortKey] = useState<SortKey>('all'); // 전체보기가 기본
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set()); // 선택된 채팅방 id들 (삭제 용도)
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmPopUpConfig, setConfirmPopUpConfig] = useState<{
    title: string;
    content: string;
    leftButtonText: string;
    onConfirm: () => void;
  } | null>(null);
  const [errorPopUpConfig, setErrorPopUpConfig] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const { data, isLoading, isSuccess } = useChatRooms(activeId);
  const { mutate: exitClosedRooms, isPending } = useClosedChatRoomsExit();

  const chatRooms = useMemo(() => data?.chatRooms ?? [], [data?.chatRooms]);
  const requestExists = data?.requestExists ?? false;
  const hasClosedRoom = chatRooms.some((chatRoom) => chatRoom.isClosed);
  const hasChatRooms = isSuccess && chatRooms.length > 0;
  const isChatRoomListEmpty = isSuccess && !hasChatRooms;

  const navigate = useNavigate();

  const visibleChatRoomList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return chatRooms
      // 현재 커피챗 / 팀원모집 탭
      .filter((chatRoom) => chatRoom.type === activeId) 

      // 전체 / 진행 중 / 종료 필터
      .filter((chatRoom) => {
        if (sortKey === 'active') return chatRoom.isClosed !== true;
        if (sortKey === 'closed') return chatRoom.isClosed === true;
        return true; // all
      })
      
      // 검색어 필터
      .filter((chatRoom) => {
        if (!query) return true; // todo 문법 알아보기

        return (
          chatRoom.partner.name.toLowerCase().includes(query) ||
          chatRoom.partner.major.toLowerCase().includes(query) ||
          chatRoom.partner.studentId.toLowerCase().includes(query) ||
          (chatRoom.lastMessage?.toLowerCase().includes(query) ?? false)
        )
      })
    
      // 최신 메시지 순 정렬
      .sort(
        (a, b) =>
          new Date(b.lastMessageDate).getTime() -
          new Date(a.lastMessageDate).getTime());

  }, [chatRooms, activeId, sortKey, searchQuery]);

  const emptyFilteredMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return '검색 결과가 없습니다.';
    }
    if (sortKey === 'active') {
      return '대화 중인 채팅방이 없습니다.';
    }
    if (sortKey === 'closed') {
      return '종료된 채팅방이 없습니다.';
    }
    return '해당하는 채팅방이 없습니다.';
  }, [searchQuery, sortKey]);

  const handleChatRoomClick = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };

  const handleTabChange = (id: string) => {
    setActiveId(id as ChatRoomListItemType);
    setIsEditMode(false);
    setSelectedRoomIds(new Set());
    handleSortKeyChange('all');
  };

  const handleSortKeyChange = (key: SortKey) => {
    setSortKey(key);
  }

  const handleEditModeChange = () => {
    setIsEditMode((prev) => !prev);

    if (isEditMode) {
      setSelectedRoomIds(new Set()); // 편집모드로 바뀌면 선택 해제
    }
  }

  const handleSelectRoom = (roomId: string) => {
    // 이미 선택된 방이라면 해제
    if(selectedRoomIds.has(roomId)) {
      setSelectedRoomIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(roomId);
        return newSet;
      })
    } else {
      if (selectedRoomIds.size >= MAX_SELECTED_ROOM_COUNT) {
        setErrorPopUpConfig({
          title: '채팅방을 더 선택할 수 없습니다',
          content: `채팅방은 한 번에 최대 ${MAX_SELECTED_ROOM_COUNT}개까지 삭제할 수 있습니다.`,
        });
        return;
      }

      // 선택된 방이 아니라면 선택 추가
      setSelectedRoomIds((prev) => new Set(prev).add(roomId));
    }
  }

  const handleChatListItemClick = (
    roomId: string,
    isClosed: boolean,
  ) => {
    if (isEditMode) {
      if (isClosed) {
        handleSelectRoom(roomId);
      }

      return;
    }

    handleChatRoomClick(roomId);
  };

  // 선택된 채팅방 모두 나가기 (종료된 채팅방)
  const handleDeleteSelectedClosedRooms = () => {
    if (selectedRoomIds.size === 0 || isPending) return;

    const roomIds = Array.from(selectedRoomIds);

    setConfirmPopUpConfig({
      title: '선택된 방들을 삭제하시겠습니까?',
      content: '삭제 즉시 채팅목록에서 사라지며\n다시 복구할 수 없습니다.',
      leftButtonText: '삭제하기',
      onConfirm: () => {
        exitClosedRooms(
          { roomIds },
          {
            onSuccess: () => {
              setSelectedRoomIds(new Set());
              setIsEditMode(false);
              setConfirmPopUpConfig(null);
            },
            onError: () => {
              setConfirmPopUpConfig(null);
              setErrorPopUpConfig({
                title: '채팅방을 삭제하지 못했습니다',
                content: '잠시 후 다시 시도해 주세요.',
              });
            },
          }
        );
      },
    });
  }

  return (
    <FullLayout
      bottomSlot={
        isEditMode ? (
          <ChatDeleteButton
            count={selectedRoomIds.size}
            variant="selectedRooms"
            onClick={handleDeleteSelectedClosedRooms}
            disabled={isPending}
          />
        ) : undefined
      }
      headerSlot={
        <div className="sticky top-0 z-50 bg-white">
          <MainHeader
            title="커피챗"
            leftIcon="empty"
            rightActions={[
              { icon: 'coffeechat_request_basic', onClick: () => navigate('/chat/requests') }
            ]}
            showBadge={requestExists}
          />
          <Tabs
            tabs={tabs}
            activeId={activeId}
            onChange={handleTabChange}
          />
        </div>
      }
    >
      {isChatRoomListEmpty && (
        <ChatEmptyState message="대화중인 채팅이 없습니다." />
      )}

      {/* 검색영역 */}
      {hasChatRooms && (
        <AnimatePresence initial={false}>
          {!isEditMode && (
            <motion.div
              key="chat-search"
              // 검색 영역이 다시 나타날때 시작상태
              initial={{
                height: 0,
                opacity: 0,
              }}
              // 검색 영역이 존재할 때의 최종 상태
              animate={{
                height: 'auto',
                opacity: 1,
              }}
              // 검색 영역이 사라질 때의 최종 상태
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
                ease: 'easeInOut',
              }}
              className="overflow-hidden"
            >
              <search className="w-full px-[25px] py-[20px] ">
                <div className="relative">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"
                  className="absolute left-[19px] top-[50%] translate-y-[-50%]">
                    <path
                      d="M18.7508 18.7508L13.5538 13.5538M13.5538 13.5538C14.9604 12.1472 15.7506 10.2395 15.7506 8.25028C15.7506 6.26108 14.9604 4.35336 13.5538 2.94678C12.1472 1.54021 10.2395 0.75 8.25028 0.75C6.26108 0.75 4.35336 1.54021 2.94678 2.94678C1.54021 4.35336 0.75 6.26108 0.75 8.25028C0.75 10.2395 1.54021 12.1472 2.94678 13.5538C4.35336 14.9604 6.26108 15.7506 8.25028 15.7506C10.2395 15.7506 12.1472 14.9604 13.5538 13.5538Z"
                      stroke="#646464"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="text"
                    name="searchTags"
                    placeholder="채팅방, 대화 내용 검색"
                    aria-label="채팅방 또는 대화 내용 검색"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                    }}
                    className="w-full h-[40px] pl-[52px] pr-[19px] py-[8px] rounded-[30px] bg-gray-150 text-gray-750 text-r-16 placeholder:text-gray-650 focus:outline-none"
                  />
                </div>
              </search>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* 정렬 영역 */}
      {hasChatRooms && (
      <motion.div
        animate={{
          paddingTop: isEditMode ? 15 : 0,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut',
        }}
        className="flex w-full items-center justify-between px-[25px] pb-[15px]"
      >
        {!isEditMode ? (
          <>
            <SortSelector
              sortKey={sortKey}
              sortLabels={sortLabels}
              modalLabels={modalSortLabels}
              modalTitle="대화 상태"
              onChange={handleSortKeyChange}
            />
          {sortKey !== 'active' && hasClosedRoom && (
            <button className="text-m-14 tracking-[-0.56px] text-gray-750" onClick={handleEditModeChange}>
              편집
            </button>
          )}
          </>
        ) : (
          <>
            <span className="text-m-14 tracking-[-0.56px] text-gray-750">{selectedRoomIds.size}개 선택됨</span>

            <button className="text-gray-750 text-center text-m-16-hn leading-[140%] tracking-[-0.4px]" onClick={handleEditModeChange}>
              취소
            </button>
          </>
        )}
      </motion.div>
      )}
      
      {hasChatRooms && (
        visibleChatRoomList.length > 0 ? (
          <ul>
            {visibleChatRoomList.map((chatRoom) => (
              <ChatList
                key={chatRoom.roomId}
                chatRoom={chatRoom}
                isClosed={chatRoom.isClosed}
                searchQuery={searchQuery}
                isEditMode={isEditMode}
                isSelected={selectedRoomIds.has(chatRoom.roomId)}
                onClick={() =>
                  handleChatListItemClick(
                    chatRoom.roomId,
                    chatRoom.isClosed === true,
                  )
                }
              />
            ))}
          </ul>
        ) : (
          <ChatEmptyState message={emptyFilteredMessage} />
        )
      )}
      
      <PopUp isOpen={isLoading} type="loading" />

      {confirmPopUpConfig && (
        <PopUp
          isOpen={true}
          type="warning"
          title={confirmPopUpConfig.title}
          content={confirmPopUpConfig.content}
          leftButtonText={confirmPopUpConfig.leftButtonText}
          isActionPending={isPending}
          onLeftClick={() => {
            if (!isPending) confirmPopUpConfig.onConfirm();
          }}
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
    </FullLayout>
  );
};
