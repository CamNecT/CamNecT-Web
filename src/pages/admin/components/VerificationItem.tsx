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
            className={`flex w-full items-center gap-3 py-4 transition-opacity ${
                item.status === 'PENDING' ? 'cursor-pointer active:opacity-70' : ''
            }`}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* 아바타 아이콘 */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-150">
                    <Icon name="Navigation_mypage_stroke" className="w-6 h-6 text-gray-400" />
                </div>
                
                {/* 유저 정보 */}
                <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                    <span className="block truncate text-sb-16-hn tracking-[-0.64px] text-gray-900" title={item.userId}>
                        {item.userId}
                    </span>
                    {/* 전화번호 주석 처리 및 이메일 표시 */}
                    {/* <span className="text-gray-650 text-r-14-hn tracking-[-0.56px]">
                        {item.phoneNum}
                    </span> */}
                    <span className="block truncate text-r-14-hn tracking-[-0.56px] text-gray-650" title={item.email}>
                        {item.email}
                    </span>
                </div>
            </div>

            {/* 상태 배지 버튼 */}
            <button 
                type="button"
                className={`min-w-[70px] shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-center text-m-12-hn tracking-[-0.48px] transition-opacity ${statusInfo.color}`}
            >
                {statusInfo.label}
            </button>
        </div>
    );
};
