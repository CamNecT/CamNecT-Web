import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PopUp from '../../components/Pop-up';
import { Tabs } from '../../components/Tabs';
import { useChatRooms } from '../../hooks/useChatQuery';
import { FullLayout } from '../../layouts/FullLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import type { ChatRoomListItemType } from '../../types/coffee-chat/coffeeChatTypes';
import { ChatList } from './components/ChatList';
import SortSelector from '../../components/SortSelector';

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

export const ChatListPage = () => {
  const [activeId, setActiveId] = useState<ChatRoomListItemType>('COFFEE_CHAT');
  const [sortKey, setSortKey] = useState<SortKey>('all'); // 진행 중 상태가 기본

  const { data, isLoading } = useChatRooms(activeId);
  const chatRooms = data?.chatRooms ?? [];
  const requestExists = data?.requestExists ?? false;

  const [searchQuery, setSearchQuery] = useState('');

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

  const handleChatRoomClick = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };

  const handleSortKeychange = (key: SortKey) => {
    setSortKey(key);
  }

  return (
    <FullLayout
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
            onChange={(id) => setActiveId(id as ChatRoomListItemType)}
          />
        </div>
      }
    >
      {/* 검색영역 */}
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

      {/* 정렬 영역 */}
      <div className='flex w-full items-center justify-between px-[25px] pb-[10px]'>
        <SortSelector
          sortKey={sortKey}
          sortLabels={sortLabels}
          modalLabels={modalSortLabels}
          modalTitle="대화 상태"
          onChange={handleSortKeychange}
        />

        {/* todo 편집 버튼 구현 */}
        <button className="text-m-14 tracking-[-0.56px] text-gray-750">
          편집
        </button>
      </div>

     <ul>
      {visibleChatRoomList.map((chatRoom) => (
        <ChatList
          key={chatRoom.roomId}
          chatRoom={chatRoom}
          isClosed={chatRoom.isClosed}
          searchQuery={searchQuery}
          onClick={() => handleChatRoomClick(chatRoom.roomId)}
        />
      ))}
      </ul>
      
      <PopUp isOpen={isLoading} type="loading" />
    </FullLayout>
  );
};