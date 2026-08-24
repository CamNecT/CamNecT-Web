import { useInfiniteQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportStatus } from "../../api-types/reportApiTypes";
import { getAdminCaseList } from "../../api/reportApi";
import PopUp from "../../components/Pop-up";
import type { PopUpType } from "../../components/Pop-up";
import { ADMIN_CASE_FETCH_ERROR_MESSAGES, REPORT_ERROR_CODES } from "../../constants/serverErrors/reportErrors";
import { AdminFullLayout } from "../../layouts/AdminFullLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { getServerErrorCode } from "../../utils/getServerErrorCode";
import { REPORT_STATUS_TAB_LABEL } from "./utils/reportMapper";
import { ReportItem } from "./components/ReportItem";

const STATUS_TABS: ReportStatus[] = ['RECEIVED', 'RESOLVED', 'REJECTED'];
const PAGE_SIZE = 20;

export const AdminReportList = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const adminId = authUser?.id ? Number(authUser.id) : null;

    const [currentStatus, setCurrentStatus] = useState<ReportStatus>('RECEIVED');
    const [errorPopupConfig, setErrorPopupConfig] = useState<{ type: PopUpType; title: string; content: string } | null>(null);

    const observerTarget = useRef<HTMLDivElement | null>(null);

    const handleTabChange = (status: ReportStatus) => {
        setCurrentStatus(status);
        setErrorPopupConfig(null);
    };

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['adminCaseList', currentStatus],
        queryFn: ({ pageParam }) =>
            getAdminCaseList(adminId!, { status: currentStatus, page: pageParam, size: PAGE_SIZE }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.data.last ? undefined : lastPage.data.number + 1,
        enabled: !!adminId,
    });

    // 목록 조회 에러 -> 코드별 팝업 매핑
    useEffect(() => {
        if (!isError || !error) return;

        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const errorCode = getServerErrorCode(axiosError);

        if (status === 403 && errorCode === REPORT_ERROR_CODES.common.forbiddenAdmin) {
            setErrorPopupConfig({ type: "error", ...ADMIN_CASE_FETCH_ERROR_MESSAGES.forbidden });
            return;
        }
        if (status === 500) {
            setErrorPopupConfig({ type: "error", ...ADMIN_CASE_FETCH_ERROR_MESSAGES.internal });
            return;
        }
        setErrorPopupConfig({ type: "error", ...ADMIN_CASE_FETCH_ERROR_MESSAGES.fallback });
    }, [isError, error]);

    // 페이지들을 하나의 배열로
    const cases = data?.pages.flatMap((page) => page.data.content) ?? [];

    // 다음 페이지 요청
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

                {/* 큰 틀: 목록 섹션 (case 단위) */}
                <div className="flex-1 pb-10">
                    {cases.length === 0 && !isLoading ? (
                        <div className="flex justify-center items-center h-40 text-gray-400 text-m-14">
                            해당 내역이 없습니다.
                        </div>
                    ) : (
                        <ul className="flex flex-col">
                            {cases.map((caseItem) => (
                                <li key={caseItem.caseId}>
                                    <ReportItem
                                        caseItem={caseItem}
                                        onClick={() => navigate(`/admin/reports/${caseItem.caseId}`)}
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

            {/* 로딩 팝업 */}
            <PopUp
                isOpen={isLoading}
                type="loading"
                title="데이터를 불러오는 중입니다..."
            />

            {/* 에러 팝업 */}
            {errorPopupConfig && (
                <PopUp
                    isOpen={true}
                    type={errorPopupConfig.type}
                    title={errorPopupConfig.title}
                    content={errorPopupConfig.content}
                    buttonText="닫기"
                    onClick={() => setErrorPopupConfig(null)}
                />
            )}
        </AdminFullLayout>
    );
}