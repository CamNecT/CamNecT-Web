import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getAdminReportDetail,
    getAdminUserReportCount,
    updateAdminReportStatus,
} from "../../api/reportApi";
import type { ReportStatusUpdateRequest } from "../../api-types/reportApiTypes";
import ImagePopUp from "../../components/ImagePopUp";
import PopUp from "../../components/Pop-up";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { formatDotDate } from "../../utils/formatDate";
import {
    getReportCategoryLabel,
    getReportStatusBadgeLabel,
} from "./utils/reportMapper";

// 관리자 신고 상세 화면
export const AdminReportDetail = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const parsedReportId = reportId ? Number(reportId) : null;

    const [isErrorDismissed, setIsErrorDismissed] = useState(false);
    const [isApprovePopupOpen, setIsApprovePopupOpen] = useState(false);
    const [isRejectPopupOpen, setIsRejectPopupOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    //신고 상세 조회
    const {
        data: detailResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminReportDetail', parsedReportId],
        queryFn: () => getAdminReportDetail(parsedReportId!),
        enabled: !!parsedReportId,
    });

    const report = detailResponse?.data;

    //피신고자 승인 신고 수 조회 (상세 데이터 로드 이후 실행)
    const { data: reportCountResponse } = useQuery({
        queryKey: ['adminUserReportCount', report?.reportedUserId],
        queryFn: () => getAdminUserReportCount(report!.reportedUserId),
        enabled: !!report?.reportedUserId,
    });

    //승인/반려 처리
    const statusMutation = useMutation({
        mutationFn: (data: ReportStatusUpdateRequest) =>
            updateAdminReportStatus(parsedReportId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReportDetail', parsedReportId] });
            queryClient.invalidateQueries({ queryKey: ['adminReportList'] });
        },
    });

    if (isLoading) {
        return (
            <PopUp
                type="loading"
                isOpen={true}
                title="데이터를 불러오는 중입니다..."
            />
        );
    }

    if (isError || !report) {
        return (
            <PopUp
                type="error"
                title="일시적 오류"
                content="잠시 후 다시 시도해주세요."
                isOpen={!isErrorDismissed}
                rightButtonText="확인"
                onClick={() => {
                    setIsErrorDismissed(true);
                    navigate(-1);
                }}
            />
        );
    }

    const canProcess = report.status === 'RECEIVED';
    const statusColorClass = canProcess
     ? 'border-primary text-primary'
     : 'border-gray-650 text-gray-650';

    return (
        <div className="flex flex-col h-full bg-white">
            <MainHeader
                title="신고된 글"
                leftAction={{ onClick: () => navigate(-1) }}
            />

            <section className="flex flex-col gap-[20px] px-[25px] pt-[20px] pb-[100px]">
                <div className={`inline-flex h-[30px] items-center justify-center self-start rounded-full border px-[12px] py-[4px] text-r-16-hn ${statusColorClass}`}>
                    {getReportStatusBadgeLabel(report.status)}
                </div>

                {/* 기본 정보 */}
                <div className="flex flex-col gap-[12px]">
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">신고 유형</span>
                        <span className="text-m-16-hn">
                            {getReportCategoryLabel(report.reportCategory)}
                        </span>
                    </div>
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">신고 날짜</span>
                        <span className="text-m-16-hn">
                            {formatDotDate(report.createdAt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">피신고자 ID</span>
                        <span className="text-m-16-hn">
                            {report.reportedUserId}
                            {reportCountResponse?.data !== undefined && (
                                <span className="text-r-12 text-gray-650 ml-[6px]">
                                    (승인된 신고 {reportCountResponse.data}건)
                                </span>
                            )}
                        </span>
                    </div>
                    {report.appliedPenalty && (
                        <div className="flex items-center gap-[10px]">
                            <span className="text-m-14 text-gray-650 w-[70px]">적용 패널티</span>
                            <span className="text-m-14 text-[#FF3838]">{report.appliedPenalty}</span>
                        </div>
                    )}
                </div>

                {/* 신고 제목/내용 */}
                <div className="flex flex-col gap-[15px] border-t border-gray-150 pt-[25px]">
                    <div className="text-b-18-hn text-gray-900">{report.title}</div>
                    <div className="text-r-16 text-gray-650 whitespace-pre-wrap break-keep mb-[10px]">
                        {report.context}
                    </div>

                    {/* 증거 이미지 */}
                    {report.evidenceImageUrls.length > 0 && (
                        <div className="overflow-x-auto">
                            <div className="flex w-max gap-[5px] pr-[20px]">
                                {report.evidenceImageUrls.map((url, index) => (
                                    <img
                                        key={`${report.reportId}-evidence-${index}`}
                                        src={url}
                                        alt={`증거 이미지 ${index + 1}`}
                                        className="h-[150px] w-[150px] shrink-0 rounded-[5px] object-cover"
                                        onClick={() => setSelectedImageUrl(url)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 승인/반려 버튼 */}
            {canProcess && (
                <div className="fixed bottom-0 left-0 right-0 flex gap-[15px] bg-white px-[25px] py-[15px] justify-center items-center">
                    <button
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={() => setIsRejectPopupOpen(true)}
                        className="flex-1 h-[48px] max-w-[156px] rounded-[10px] border border-gray-750 text-gray-750 text-sb-16-hn"
                    >
                        신고 반려
                    </button>
                    <button
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={() => setIsApprovePopupOpen(true)}
                        className="flex-1 h-[48px] max-w-[156px] rounded-[10px] border border-red text-red text-sb-16-hn"
                    >
                        신고 승인
                    </button>
                </div>
            )}

            <PopUp
                isOpen={isApprovePopupOpen}
                type="info"
                title="신고를 승인하시겠습니까?"
                content="승인 시 신고 대상에게 패널티가 적용될 수 있습니다."
                onLeftClick={() => setIsApprovePopupOpen(false)}
                onRightClick={() => {
                    setIsApprovePopupOpen(false);
                    statusMutation.mutate({ status: 'RESOLVED' });
                }}
            />

            <PopUp
                isOpen={isRejectPopupOpen}
                type="info"
                title="신고를 반려하시겠습니까?"
                content="반려된 신고는 다시 처리할 수 없습니다."
                onLeftClick={() => setIsRejectPopupOpen(false)}
                onRightClick={() => {
                    setIsRejectPopupOpen(false);
                    statusMutation.mutate({ status: 'REJECTED' });
                }}
            />

            <PopUp
                isOpen={statusMutation.isPending}
                type="loading"
                title="처리 중입니다..."
            />

            {/* 증거 이미지 확대 보기 */}
            <ImagePopUp
                isOpen={Boolean(selectedImageUrl)}
                imageUrl={selectedImageUrl}
                onClose={() => setSelectedImageUrl(null)}
            />
        </div>
    );
};