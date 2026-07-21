import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PopUp from '../../components/Pop-up';
import { Tabs } from '../../components/Tabs';
import { useChatRooms } from '../../hooks/useChatQuery';
import { FullLayout } from '../../layouts/FullLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import type { ChatRoomListItemType } from '../../types/coffee-chat/coffeeChatTypes';
import { ChatList } from './components/ChatList';

export const ChatListPage = () => {
  const [activeId, setActiveId] = useState<ChatRoomListItemType>('COFFEE_CHAT');
  const { data, isLoading } = useChatRooms(activeId);
  const chatRooms = data?.chatRooms ?? [];
  const requestExists = data?.requestExists ?? false;

  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const tabs = [
    { id: 'COFFEE_CHAT', label: '커피챗' },
    { id: 'TEAM_RECRUIT', label: '팀원모집' },
  ];

  // mock데이터 타입별 filtering + 날짜 내림차순 정렬
  const filteredChatRoomList = chatRooms
    .filter((chatRoom) => chatRoom.type === activeId)
    .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());

  // 채팅방 리스트 검색 함수
  const searchFilteredChatRoomList = (searchQuery: string) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return filteredChatRoomList;

    return filteredChatRoomList.filter((chatRoom) => {
      const { partner, lastMessage } = chatRoom;

      return (
        partner.name.toLowerCase().includes(query) ||
        partner.major.toLowerCase().includes(query) ||
        partner.studentId.toLowerCase().includes(query) ||
        (lastMessage?.toLowerCase().includes(query) ?? false)
      );
    });
  };

  const handleChatRoomClick = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };

  return (
    <FullLayout
      headerSlot={
        <div className="sticky top-0 z-50 bg-white">
          <MainHeader
            title="커피챗"
            leftIcon="empty"
            rightActions={[
              { icon: 'coffeeChat', onClick: () => navigate('/chat/requests') }
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
      <section className="w-full px-[25px] py-[20px] ">
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
      </section>

      <ul>
        {
          // 검색어 여부로 분기 렌더링
          // todo 길게 클릭 후 삭제 기능 추가
          searchQuery ? searchFilteredChatRoomList(searchQuery).map((chatRoom) => (
          <ChatList
            key={chatRoom.roomId}
            chatRoom={chatRoom}
            isClosed={chatRoom.isClosed}
            searchQuery={searchQuery}
            onClick={() => handleChatRoomClick(chatRoom.roomId)}
          />
        )) : filteredChatRoomList.map((chatRoom) => (
          <ChatList
            key={chatRoom.roomId}
            isClosed={chatRoom.isClosed}
            chatRoom={chatRoom}
            onClick={() => handleChatRoomClick(chatRoom.roomId)}
          />
        ))}
      </ul>
      <PopUp isOpen={isLoading} type="loading" />
    </FullLayout>
  );
};