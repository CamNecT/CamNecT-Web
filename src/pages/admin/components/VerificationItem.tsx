import { useNavigate } from "react-router-dom";
import Icon from "../../../components/Icon";
import type { VerificationItemType } from "../AdminVerificationList";

export interface VerificationItemProps {
    item: VerificationItemType;
}

export const VerificationItem = ({ item }: VerificationItemProps) => {
    const navigate = useNavigate();
    
    // 상태에 따른 배지 텍스트와 스타일 결정
    const getStatusInfo = () => {
        switch (item.status) {
            case 'PENDING':
                return { label: '승인필요', color: 'text-gray-900 bg-white border border-gray-200' };
            case 'APPROVED':
                return { label: '승인완료', color: 'text-gray-400 bg-gray-150 border-none' };
            case 'REJECTED':
                return { label: '승인거부', color: 'text-red bg-white border border-red' };
            default:
                return { label: '', color: '' };
        }
    };

    const statusInfo = getStatusInfo();

    const handleItemClick = () => {
        if (item.status === 'PENDING') {
            navigate(`/admin/school-verification/${item.id}`, {
                // 현재 데이터를 함께 전달 (캐싱, DetailPage에서 서버요청 불 필요)
                state: {itemData : item}
            });
        }
    };

    return (
        <div 
            onClick={handleItemClick}
            className={`flex items-center justify-between w-full py-4 transition-opacity ${
                item.status === 'PENDING' ? 'cursor-pointer active:opacity-70' : ''
            }`}
        >
            <div className="flex items-center gap-3">
                {/* 아바타 아이콘 */}
                <div className="w-10 h-10 rounded-full bg-gray-150 flex items-center justify-center overflow-hidden">
                    <Icon name="Navigation_mypage_stroke" className="w-6 h-6 text-gray-400" />
                </div>
                
                {/* 유저 정보 */}
                <div className="flex flex-col gap-[1px]">
                    <span className="text-gray-900 text-sb-16-hn tracking-[-0.64px]">
                        {item.userId}
                    </span>
                    <span className="text-gray-650 text-r-14-hn tracking-[-0.56px]">
                        {item.phoneNum}
                    </span>
                </div>
            </div>

            {/* 상태 배지 버튼 */}
            <button 
                type="button"
                className={`px-4 py-1.5 rounded-full text-m-12-hn tracking-[-0.48px] min-w-[70px] text-center transition-opacity ${statusInfo.color}`}
            >
                {statusInfo.label}
            </button>
        </div>
    );
};