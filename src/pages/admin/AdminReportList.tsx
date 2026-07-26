import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportStatus } from "../../api-types/reportApiTypes";
import { getAdminReportList } from "../../api/reportApi";
import PopUp from "../../components/Pop-up";
import { AdminFullLayout } from "../../layouts/AdminFullLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { REPORT_STATUS_TAB_LABEL } from "./utils/reportMapper";
import { ReportItem } from "./components/ReportItem";

const STATUS_TABS: ReportStatus[] = ['RECEIVED', 'RESOLVED', 'REJECTED'];
const PAGE_SIZE = 20;

export const AdminReportList = () => {
    const navigate = useNavigate();

    const [currentStatus, setCurrentStatus] = useState<ReportStatus>('RECEIVED');

    const [isErrorDismissed, setIsErrorDismissed] = useState(false);

    const observerTarget = useRef<HTMLDivElement | null>(null);

    const handleTabChange = (status: ReportStatus) => {
        setCurrentStatus(status);
        setIsErrorDismissed(false);
    };

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['adminReportList', currentStatus],
        queryFn: ({ pageParam }) =>
            getAdminReportList({ status: currentStatus, page: pageParam, size: PAGE_SIZE }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.data.last ? undefined : lastPage.data.number + 1,
    });

    //페이지들을 하나의 배열로 평탄화
    const reports = data?.pages.flatMap((page) => page.data.content) ?? [];

    //다음 페이지 요청
    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <AdminFullLayout
            headerSlot={
                <MainHeader
                    title="신고된 글"
                />
            }
        >
            <div className="flex flex-col h-full bg-white">

                {/* 큰 틀: 상태 탭 섹션 */}
                <div className="flex py-[10px] px-[25px] gap-[5px] overflow-x-auto no-scrollbar">
                    {STATUS_TABS.map((status) => (
                        <button
                            key={status}
                            onClick={() => handleTabChange(status)}
                            className={`h-[34px] px-[13px] py-[7px] rounded-[30px] whitespace-nowrap transition-colors tracking-[-0.56px]
                                ${currentStatus === status
                                    ? 'bg-primary text-white text-m-14-hn'
                                    : 'bg-gray-white text-gray-650 text-r-14-hn border border-gray-150'}`}
                        >
                            {REPORT_STATUS_TAB_LABEL[status]}
                        </button>
                    ))}
                </div>

                {/* 큰 틀: 목록 섹션 */}
                <div className="flex-1 pb-10">
                    {reports.length === 0 && !isLoading ? (
                        <div className="flex justify-center items-center h-40 text-gray-400 text-m-14">
                            해당 내역이 없습니다.
                        </div>
                    ) : (
                        <ul className="flex flex-col">
                            {reports.map((report) => (
                                <li key={report.reportId}>
                                    <ReportItem
                                        report={report}
                                        onClick={() => navigate(`/admin/reports/${report.reportId}`)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* 무한 스크롤 트리거 */}
                    <div ref={observerTarget} className="h-[1px]" />

                    {isFetchingNextPage && (
                        <div className="flex justify-center py-4 text-gray-400 text-m-14">
                            불러오는 중...
                        </div>
                    )}
                </div>
            </div>

            {/* 로딩 팝업 (최초 로딩만) */}
            <PopUp
                isOpen={isLoading}
                type="loading"
                title="데이터를 불러오는 중입니다..."
            />

            {/* 에러 팝업 */}
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