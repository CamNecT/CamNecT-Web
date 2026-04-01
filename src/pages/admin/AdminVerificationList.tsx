import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { requestAdminVerificationList } from "../../api/auth";
import PopUp from "../../components/Pop-up";
import { AdminFullLayout } from "../../layouts/AdminFullLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { formatDotDate } from "../../utils/formatDate";
import { VerificationItem } from "./components/VerificationItem";

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationItemType{
    id: string;
    userId: string;
    phoneNum: string;
    date: string; // 제출 날짜
    status: VerificationStatus;
}

// 관리자 승인 대기 화면 리스트
export const AdminVerificationList = () => {

    const [currentStatus, setCurrentStatus] = useState<VerificationStatus>('PENDING');

    // useQuery에서의 isError로 인한 팝업을 닫기 위한 state 
    const [isErrorDismissed, setIsErrorDismissed] = useState(false);

    // 탭 변경 시 상태 및 에러 팝업 상태 초기화
    const handleTabChange = (status: VerificationStatus) => {
        setCurrentStatus(status);
        setIsErrorDismissed(false);
    };

    // 관리자 인증 리스트 가져오기 useQuery
    const { data: verificationList, isLoading, isError } = useQuery({
        queryKey: ['verificationList', currentStatus], // currentState가 변경될 때마다 refetch
        queryFn: () => requestAdminVerificationList({ status: currentStatus, size:1000 }),
        staleTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
    });

    const renderContent = () => {
        const realDataList = verificationList?.content || []; // 화면에 렌더링 되는 content 프로퍼티만 가져옴

        // realDataList를 VerificationItemType에 맞게 매핑
        const filteredData: VerificationItemType[] = realDataList.map(item => ({
            id: String(item.submissionId),
            userId: item.username,
            phoneNum: item.phoneNum,
            date: formatDotDate(item.submittedAt), // YYYY.MM.DD로 변환
            status: item.status as VerificationStatus,
        }));

        // 2. 날짜별로 그룹화
        const groupedByDate = filteredData.reduce((acc, item) => {
            if (!acc[item.date]) {
                // 날짜에 해당하는 구역 생성
                acc[item.date] = [];
            }
            // 해당 날짜에 아이템 추가
            acc[item.date].push(item);
            
            return acc;
        }, {} as Record<string, VerificationItemType[]>);

        // 3. 날짜순 정렬 (내림차순)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

        if (filteredData.length === 0) {
            return (
                <div className="flex justify-center items-center h-40 text-gray-400 text-m-14">
                    해당 내역이 없습니다.
                </div>
            );
        }

        return (
            <div className="flex flex-col">
                {sortedDates.map((date, index) => (
                    <section key={date} className={`flex flex-col ${index !== 0 ? 'border-t border-gray-150' : ''}`}>
                        {/* 날짜 헤더 */}
                        <div className="px-5 py-3 text-gray-900 text-sb-14 tracking-[-0.56px]">
                            {date}
                        </div>
                        {/* 해당 날짜의 아이템 리스트 */}
                        <ul className="flex flex-col border-t border-gray-150 list-none p-0 m-0">
                            {groupedByDate[date].map(item => (
                                <li key={item.id} className="px-5">
                                    <VerificationItem item={item} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        );
    };

    return (
        <AdminFullLayout
            headerSlot={
                <MainHeader title="증명서 승인 리스트" isAdmin={true} />
            }
        >
            <div className="flex flex-col h-full bg-white">
                
                    {/* 큰 틀: 버튼(탭) 섹션 */}
                <div className="flex pt-[5px] px-5 py-4 gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'PENDING', label: '승인필요' },
                        { id: 'APPROVED', label: '승인완료' },
                        { id: 'REJECTED', label: '승인거부' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as VerificationStatus)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors tracking-[-0.56px]
                                ${currentStatus === tab.id 
                                    ? 'bg-primary text-white text-sb-14' 
                                    : 'bg-gray-100 text-gray-650 text-m-14 border border-gray-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 큰 틀: 내용 섹션 */}
                <div className="flex-1 pb-10">
                    {renderContent()}
                </div>
            </div>

            {/* 로딩 팝업 */}
            <PopUp 
                isOpen={isLoading} 
                type="loading" 
                title="데이터를 불러오는 중입니다..." 
            />

            {/* 에러 팝업 (에러가 발생했고 + 아직 닫지 않았을 때만 노출) */}
            <PopUp 
                isOpen={isError && !isErrorDismissed} 
                type="error" 
                title="오류 발생" 
                content="데이터를 불러오는 중 문제가 발생했습니다" 
                buttonText="닫기"
                onClick={() => setIsErrorDismissed(true)}
            />
        </AdminFullLayout>
    );
};