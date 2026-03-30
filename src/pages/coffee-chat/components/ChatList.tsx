import type { ChatRoomListItem } from "../../../types/coffee-chat/coffeeChatTypes";
import { formatDate } from "../../../utils/formatDate";

interface ChatListProps {
    chatRoom: ChatRoomListItem;
    searchQuery?: string; // todo 추후 검색어 부분만 하이라이트
    isFirstPaddingDisabled?: boolean;
    isClosed?: boolean;
    onClick?: () => void;
}

// 
export const ChatList = ({ chatRoom, isFirstPaddingDisabled = false, isClosed = false, onClick }: ChatListProps) => {
    return (
        <li 
            className={`border-b border-gray-150 py-[15px] ${isFirstPaddingDisabled ? 'first:pt-0' : ''} ${isClosed ? 'bg-gray-150' : ''}`}
        >
            <button
                onClick={onClick}
                className="flex gap-[12px] px-[25px] w-full text-left cursor-pointer active:bg-gray-100 transition-colors"
            >
                {/* 프로필 이미지 영역 */}
                <div className={`shrink-0 ${isClosed ? 'grayscale opacity-50' : ''}`}>
                    {chatRoom.partner.profileImg ? (
                        <img src={chatRoom.partner.profileImg} alt="프로필 이미지" className="w-[60px] h-[60px] rounded-full object-cover" />
                    ) : (
                        <div className="w-[60px] h-[60px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            <span className="text-gray-500 text-[18px] font-bold">{chatRoom.partner.name.charAt(0)}</span>
                        </div>
                    )}
                </div>

                {/* 정보 영역 */}
                <div className={`flex flex-col justify-center flex-1 min-w-0 gap-[5px] ${isClosed ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-[4px] min-w-0">
                            <span className={`flex-none text-[18px] font-bold leading-[140%] tracking-[-0.36px] truncate ${isClosed ? 'text-gray-800' : 'text-[#202023]'}`}>
                                {chatRoom.partner.name}
                            </span>
                            <span className="truncate text-[14px] font-normal text-gray-800 leading-[140%] tracking-[-0.56px] whitespace-nowrap">
                                · {chatRoom.partner.major} {!isNaN(Number(chatRoom.partner.studentId)) && chatRoom.partner.studentId.length >= 2 ? `${chatRoom.partner.studentId.slice(2, 4)}학번` : chatRoom.partner.studentId}
                            </span>
                        </div>
                        {/* 날짜 */}
                        <span className="text-[12px] font-normal text-[#A1A1A1] leading-[140%] tracking-[-0.24px] whitespace-nowrap ml-[8px]">
                            {formatDate(chatRoom.lastMessageDate)}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        {/* 마지막 메시지 */}
                        <span className={`text-[14px] font-normal leading-[140%] tracking-[-0.56px] truncate pr-[10px] ${isClosed ? 'text-gray-800' : 'text-[#646464]'}`}>
                            {chatRoom.lastMessage}
                        </span>
                        
                        {/* 안읽은 메시지 뱃지 (종료된 방은 보통 뱃지를 숨기거나 흐리게 처리함) */}
                        {chatRoom.unreadCount > 0 && !isClosed && (
                            <div className="flex-none w-[20px] h-[20px] px-[6px] rounded-full bg-primary flex items-center justify-center">
                                <span className="text-[12px] font-bold text-white leading-none">
                                    {chatRoom.unreadCount}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </button>
        </li>
    );
};