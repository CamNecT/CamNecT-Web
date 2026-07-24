import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PopUp from "../../components/Pop-up";
import { Tabs } from "../../components/Tabs";
import { useChatRequests, useDeleteAllChatRequest, useDeleteAllTeamRecruitRequest } from "../../hooks/useChatQuery";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import type { ChatRoomListItem, ChatRoomListItemType } from "../../types/coffee-chat/coffeeChatTypes";
import { AllRequestDeleteButton } from "./components/AllRequestDeleteButton";
import { ChatList } from "./components/ChatList";
import { ChatPostAccordian } from "./components/ChatPostAccordian";

export const ChatRequestListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabs = [
    { id: 'COFFEE_CHAT', label: '커피챗' },
    { id: 'TEAM_RECRUIT', label: '팀원모집' },
  ];

  const initialType = searchParams.get('type');
  const hasInitialTypeQuery = initialType === 'TEAM_RECRUIT' || initialType === 'COFFEE_CHAT';
  const initialActiveId: ChatRoomListItemType =
    hasInitialTypeQuery
      ? initialType
      : 'COFFEE_CHAT';
  const [activeId, setActiveId] = useState<ChatRoomListItemType>(initialActiveId);
  const [openPostTitle, setOpenPostTitle] = useState<string | null>(null); // 1개만 열릴 수 있음

  useEffect(() => {
    // 홈 요청 요약 카드에서 ?type=...으로 진입할 때만 초기 탭을 맞추고,
    // 탭 상태가 URL에 계속 남지 않도록 진입 직후 쿼리를 제거했습니다.
    if (hasInitialTypeQuery) {
      navigate('/chat/requests', { replace: true });
    }
  }, [hasInitialTypeQuery, navigate]);

  const { data: chatRequestRooms = [], isLoading } = useChatRequests(activeId);
  const { mutate: deleteAllTeamRecruitRequest} = useDeleteAllTeamRecruitRequest();
  const { mutate: deleteAllChatRequest} = useDeleteAllChatRequest();

    // mock데이터 타입별 filtering + 날짜 내림차순 정렬
  const filteredChatRoomList = chatRequestRooms
    .filter((chatRoom) => chatRoom.type === activeId)
    .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
  
  // 공모전 제목별로 채팅방 분류
  // .reduce: 배열을 순회하며 하나의 값으로 축약
  const filteredChatRoomListByPost = filteredChatRoomList
    .reduce((acc, chatRoom) => { // chatRoom: 현재 순회 중인 배열요소 
      const key = chatRoom.requestPostTitle || "제목없음";

      // 특정 공모전 제목의 채팅방 없을 시 생성
      if(!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(chatRoom);

      return acc; // 다음 loop에게의 전달값 (누적값) 
    }, {} as Record<string, ChatRoomListItem[]>); // reduce(callback, initialValue)
  
  // 토글 함수
  const togglePostTitle = (title: string) => {
    setOpenPostTitle((prev) => (prev === title ? null : title));
  }

  // 삭제 대상 개수 계산
  const currentDeleteCount = activeId === 'TEAM_RECRUIT'
    ? (openPostTitle ? (filteredChatRoomListByPost[openPostTitle]?.length || 0) : 0)
    : filteredChatRoomList.length;

  const handleDeleteAll = () => {
    if (activeId === 'TEAM_RECRUIT') {
      if (!openPostTitle) return;

      // recruitmentId가 같으므로 첫번째 방의 recruitmentId로 삭제
      const firstRoom = filteredChatRoomListByPost[openPostTitle]?.[0];
      if (firstRoom?.recruitmentId) {
        deleteAllTeamRecruitRequest({ recruitmentId: firstRoom.recruitmentId });
      }
    } else {
      deleteAllChatRequest();
    }
  };

  const handleChatRoomClick = (roomId: string) => {
    navigate(`/chat/requests/${roomId}`);
  };

  const handleTabChange = (id: string) => {
    const nextActiveId = id as ChatRoomListItemType;
    setActiveId(nextActiveId);
    setOpenPostTitle(null);
  };

  return (
    <HeaderLayout
      headerSlot={
        <div className="sticky top-0 z-50 bg-white">
          <MainHeader
            title="요청" />
          <Tabs
            tabs={tabs}
            activeId={activeId}
            onChange={(id) => setActiveId(id as ChatRoomListItemType)}
          />
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto min-h-0">
        <ul>
          {
            activeId === 'TEAM_RECRUIT' ?
              // Object.entries : Object -> Array ([index0, index1])
              Object.entries(filteredChatRoomListByPost).map(([key, chatRoomList]) => {

                const isOpen = openPostTitle === key;
                const requestCount = chatRoomList.length;

                return (
                  <li key={key} className="flex flex-col">
                    <ChatPostAccordian
                      title={key}
                      isOpen={isOpen}
                      requestCount={requestCount}
                      onClick={() => togglePostTitle(key)}
                    />
                    {isOpen && (
                      <ul>
                        {chatRoomList.map((chatRoom) => (
                          <ChatList
                            key={chatRoom.roomId}
                            chatRoom={chatRoom}
                            isFirstPaddingDisabled={false}
                            onClick={() => handleChatRoomClick(chatRoom.roomId)}
                          />
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })
            :
              filteredChatRoomList.map((chatRoom) => (
                <ChatList
                  key={chatRoom.roomId}
                  chatRoom={chatRoom}
                  isFirstPaddingDisabled={false}
                  onClick={() => handleChatRoomClick(chatRoom.roomId)}
                />
              ))
          }
        </ul>

        <AllRequestDeleteButton
          requestCount={currentDeleteCount}
          onClick={handleDeleteAll}
        />
      </div>
      <PopUp isOpen={isLoading} type="loading" />
    </HeaderLayout>
  );
};
