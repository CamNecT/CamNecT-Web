import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getAdminCaseDetail,
    getAdminEvidenceDownloadUrl,
    getAdminUserReportCount,
    updateAdminCaseStatus,
} from "../../api/reportApi";
import type { ReportCategory } from "../../api-types/reportApiTypes";
import BottomSheetModal from "../../components/BottomSheetModal/BottomSheetModal";
import ImagePopUp from "../../components/ImagePopUp";
import PopUp from "../../components/Pop-up";
import type { PopUpType } from "../../components/Pop-up";
import Icon from "../../components/Icon";
import {
    ADMIN_CASE_FETCH_ERROR_MESSAGES,
    ADMIN_CASE_STATUS_ERROR_MESSAGES,
    REPORT_ERROR_CODES,
} from "../../constants/serverErrors/reportErrors";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDotDate } from "../../utils/formatDate";
import { getServerErrorCode } from "../../utils/getServerErrorCode";
import {
    getPenaltyStatusBadgeLabel,
    getPenaltyTypeLabel,
    getReportCategoryLabel,
    getReportStatusBadgeLabel,
    getReportTargetTypeLabel,
    REPORT_CATEGORY_ORDER,
} from "./utils/reportMapper";

// 관리자 신고 case 상세 화면
export const AdminReportDetail = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const authUser = useAuthStore((state) => state.user);
    const adminId = authUser?.id ? Number(authUser.id) : null;

    const parsedCaseId = caseId ? Number(caseId) : null;

    const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false);
    const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false);
    const [selectedDecidedCategory, setSelectedDecidedCategory] = useState<ReportCategory | null>(null);
    const [approveReason, setApproveReason] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [errorPopupConfig, setErrorPopupConfig] = useState<{ type: PopUpType; title: string; content: string } | null>(null);

    // case 상세 조회 ({status,message,data}로 래핑, data가 CaseDetail)
    const {
        data: detailResponse,
        isLoading,
        isError,
        error: detailError,
    } = useQuery({
        queryKey: ['adminCaseDetail', parsedCaseId],
        queryFn: () => getAdminCaseDetail(adminId!, parsedCaseId!),
        enabled: !!parsedCaseId && !!adminId,
    });

    const caseDetail = detailResponse?.data;

    // 대상 작성자 신고 누적 수 조회 (상세 로드 이후 실행)
    const { data: reportCountResponse } = useQuery({
        queryKey: ['adminUserReportCount', caseDetail?.targetAuthor.userId],
        queryFn: () => getAdminUserReportCount(adminId!, caseDetail!.targetAuthor.userId),
        enabled: !!caseDetail?.targetAuthor.userId && !!adminId,
    });

    // 증거 보기: 제출 건(reportId) + 증거(evidenceId)별로 온디맨드 발급
    const evidenceMutation = useMutation({
        mutationFn: ({ reportId, evidenceId }: { reportId: number; evidenceId: number }) =>
            getAdminEvidenceDownloadUrl(adminId!, parsedCaseId!, reportId, evidenceId),
        onSuccess: (res) => {
            setSelectedImageUrl(res.data.downloadUrl);
        },
        onError: (error: unknown) => {
            const axiosError = error as AxiosError;
            const errorCode = getServerErrorCode(axiosError);

            if (errorCode === REPORT_ERROR_CODES.adminCase.evidenceNotFound) {
                setErrorPopupConfig({ type: "error", ...ADMIN_CASE_FETCH_ERROR_MESSAGES.evidenceNotFound });
                return;
            }
            setErrorPopupConfig({ type: "error", ...ADMIN_CASE_FETCH_ERROR_MESSAGES.internal });
        },
    });

    // 승인/반려 처리
    const statusMutation = useMutation({
        mutationFn: (data: {
            status: 'RESOLVED' | 'REJECTED';
            decidedCategory: ReportCategory | null;
            reason: string | null;
        }) => updateAdminCaseStatus(adminId!, parsedCaseId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCaseDetail', parsedCaseId] });
            queryClient.invalidateQueries({ queryKey: ['adminCaseList'] });
            queryClient.invalidateQueries({
                queryKey: ['adminUserReportCount', caseDetail?.targetAuthor.userId],
            });
            setIsApproveSheetOpen(false);
            setIsRejectSheetOpen(false);
            setSelectedDecidedCategory(null);
            setApproveReason('');
            setRejectReason('');
        },
        onError: (error: unknown) => {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            const errorCode = getServerErrorCode(axiosError);

            if (status === 400 && errorCode === REPORT_ERROR_CODES.common.invalidRequest) {
                setErrorPopupConfig({ type: "error", ...ADMIN_CASE_STATUS_ERROR_MESSAGES.invalidRequest });
                return;
            }
            if (status === 403 && errorCode === REPORT_ERROR_CODES.common.forbiddenAdmin) {
                setErrorPopupConfig({ type: "error", ...ADMIN_CASE_STATUS_ERROR_MESSAGES.forbidden });
                return;
            }
            if (status === 404 && errorCode === REPORT_ERROR_CODES.adminCase.caseNotFound) {
                setErrorPopupConfig({ type: "error", ...ADMIN_CASE_STATUS_ERROR_MESSAGES.caseNotFound });
                return;
            }
            if (status === 500) {
                setErrorPopupConfig({ type: "error", ...ADMIN_CASE_STATUS_ERROR_MESSAGES.internal });
                return;
            }
            setErrorPopupConfig({ type: "error", ...ADMIN_CASE_STATUS_ERROR_MESSAGES.fallback });
        },
    });

    // adminId가 없으면 쿼리 자체가 enabled: false라 isLoading이 false로 끝나버림
    // -> 진짜 에러가 아니라 "로그인 정보 없음" 상태이므로 별도로 구분해서 보여줌
    if (!adminId) {
        return (
            <PopUp
                type="error"
                title="관리자 정보를 확인할 수 없습니다"
                content="로그인이 만료되었을 수 있습니다. 다시 로그인 후 시도해주세요."
                isOpen={true}
                rightButtonText="확인"
                onClick={() => navigate(-1)}
            />
        );
    }

    if (isLoading) {
        return (
            <PopUp
                type="loading"
                isOpen={true}
                title="데이터를 불러오는 중입니다..."
            />
        );
    }

    if (isError || !caseDetail) {
        const axiosError = detailError as AxiosError | undefined;
        const status = axiosError?.response?.status;
        const errorCode = axiosError ? getServerErrorCode(axiosError) : undefined;

        let errorContent: { title: string; content: string } = ADMIN_CASE_FETCH_ERROR_MESSAGES.fallback;
        if (status === 403 && errorCode === REPORT_ERROR_CODES.common.forbiddenAdmin) {
            errorContent = ADMIN_CASE_FETCH_ERROR_MESSAGES.forbidden;
        } else if (status === 404 && errorCode === REPORT_ERROR_CODES.adminCase.caseNotFound) {
            errorContent = ADMIN_CASE_FETCH_ERROR_MESSAGES.caseNotFound;
        } else if (status === 500) {
            errorContent = ADMIN_CASE_FETCH_ERROR_MESSAGES.internal;
        }

        return (
            <PopUp
                type="error"
                title={errorContent.title}
                content={errorContent.content}
                isOpen={true}
                rightButtonText="확인"
                onClick={() => navigate(-1)}
            />
        );
    }

    const canProcess = caseDetail.status === 'RECEIVED';
    const statusColorClass = canProcess
        ? 'border-primary text-primary'
        : 'border-gray-650 text-gray-650';

    const handleApproveSubmit = () => {
        if (!selectedDecidedCategory || !approveReason.trim()) return;
        statusMutation.mutate({
            status: 'RESOLVED',
            decidedCategory: selectedDecidedCategory,
            reason: approveReason.trim(),
        });
    };

    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) return;
        statusMutation.mutate({
            status: 'REJECTED',
            decidedCategory: null,
            reason: rejectReason.trim(),
        });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <MainHeader
                title="신고된 글"
                leftAction={{ onClick: () => navigate(-1) }}
            />

            <section className="flex flex-col gap-[20px] px-[25px] pt-[20px] pb-[120px]">
                <div className={`inline-flex h-[30px] items-center justify-center self-start rounded-full border px-[12px] py-[4px] text-r-16-hn ${statusColorClass}`}>
                    {getReportStatusBadgeLabel(caseDetail.status)}
                </div>

                {/* 대상자 이름 */}
                <div className="flex items-center gap-[6px]">
                    <span className="text-b-16-hn text-gray-900">{caseDetail.targetAuthor.name}</span>
                    {caseDetail.appliedPenalty && (
                        <span className="text-b-14-hn text-red">
                            · {getPenaltyStatusBadgeLabel(caseDetail.appliedPenalty)}
                        </span>
                    )}
                </div>

                {/* 기본 정보 */}
                <div className="flex flex-col gap-[12px]">
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">누적 신고</span>
                        <span className="text-r-16-hn">
                            {reportCountResponse?.data ?? '-'}건
                        </span>
                    </div>
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">대상 유형</span>
                        <span className="text-r-16-hn">
                            {getReportTargetTypeLabel(caseDetail.targetType)}
                        </span>
                    </div>
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">접수 건수</span>
                        <span className="text-r-16-hn">{caseDetail.reportCount}건</span>
                    </div>
                    <div className="flex items-center gap-[40px] text-gray-750">
                        <span className="text-sb-16-hn w-[75px]">최초 접수일</span>
                        <span className="text-r-16-hn">{formatDotDate(caseDetail.createdAt)}</span>
                    </div>
                    {caseDetail.moderationReason && (
                        <div className="flex items-start gap-[40px] text-gray-750">
                            <span className="text-sb-16-hn w-[75px] flex-none">처리 사유</span>
                            <span className="text-r-16-hn whitespace-pre-wrap">{caseDetail.moderationReason}</span>
                        </div>
                    )}
                </div>

                {/* 기존 제재 이력 */}
                {caseDetail.existingPenalties.length > 0 && (
                    <div className="flex flex-col gap-[15px] pt-[20px]">
                        <span className="text-sb-16-hn text-gray-900 border-b border-gray-150 pb-[7px]">기존 제재 이력</span>
                        <div className="flex flex-col gap-[20px]">
                            {caseDetail.existingPenalties.map((penalty) => {
                                const isFromThisCase = penalty.caseId === caseDetail.caseId;
                                return (
                                    <div key={penalty.penaltyId} className="flex flex-col gap-[4px]">
                                        <span className="text-r-12-hn text-gray-400">
                                            {formatDotDate(penalty.createdAt)}
                                        </span>
                                        <div className="flex items-start gap-[10px]">
                                            <div className="flex items-center flex-none">
                                                <div className="w-[200px] flex items-center gap-[5px]">
                                                    <span className="text-m-14-hn text-gray-750">
                                                        { getPenaltyTypeLabel(penalty.penaltyType) }
                                                    </span>
                                                    {isFromThisCase && (
                                                        <span className="text-r-12-hn text-primary">
                                                            (이 신고 건)
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-r-14-hn text-gray-650">
                                                    {caseDetail.decidedCategory ? getReportCategoryLabel(caseDetail.decidedCategory) : penalty.reason}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 신고 제출 내역 (신고자별 개별 건) */}
                <div className="flex flex-col gap-[20px] pt-[25px]">
                    <span className="text-sb-16-hn text-gray-900 border-b border-gray-150 pb-[7px]">
                        신고 제출 내역 · <span className="text-primary">{caseDetail.submissions.length}건</span>
                    </span>
                    <div className="flex flex-col gap-[18px]">
                        {caseDetail.submissions.map((submission) => (
                            <div key={submission.reportId} className="flex flex-col gap-[5px] pb-[20px] border-b border-gray-150">
                                <div className="flex items-center justify-between pb-[3px]">
                                    <span className="text-r-12-hn text-gray-650">
                                        {getReportCategoryLabel(submission.submittedCategory)}
                                    </span>
                                    <span className="text-r-12-hn text-gray-650">
                                        {formatDotDate(submission.createdAt)}
                                    </span>
                                </div>
                                <div className="text-sb-14-hn text-gray-900">{submission.title}</div>
                                <div className="text-r-16 text-gray-650 whitespace-pre-wrap break-keep">
                                    {submission.context}
                                </div>

                                {/* 증거 칩 (여러 장 가능) */}
                                {submission.evidence.length > 0 && (
                                    <div className="flex flex-wrap gap-[7px] pt-[4px]">
                                        {submission.evidence.map((evidence) => (
                                            <button
                                                key={evidence.evidenceId}
                                                type="button"
                                                disabled={evidenceMutation.isPending}
                                                onClick={() =>
                                                    evidenceMutation.mutate({
                                                        reportId: submission.reportId,
                                                        evidenceId: evidence.evidenceId,
                                                    })
                                                }
                                                className="flex items-center justify-center px-[10px] py-[5px] gap-[7px] rounded-[4px] bg-green-50 text-r-12-hn text-primary"
                                            >
                                                <span>evidence_{evidence.sortOrder + 1}</span>
                                                <Icon name="expand_more" size={20} className="text-primary" />

                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 승인/반려 버튼 (처리 전 상태에서만) */}
            {canProcess && (
                <div className="fixed bottom-0 left-0 right-0 flex gap-[15px] bg-white px-[25px] py-[15px] justify-center items-center border-t border-gray-150">
                    <button
                        type="button"
                        onClick={() => setIsRejectSheetOpen(true)}
                        className="flex-1 h-[48px] max-w-[156px] rounded-[10px] border border-gray-750 text-gray-750 text-sb-16-hn"
                    >
                        신고 반려
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsApproveSheetOpen(true)}
                        className="flex-1 h-[48px] max-w-[156px] rounded-[10px] border border-red text-red text-sb-16-hn"
                    >
                        신고 승인
                    </button>
                </div>
            )}

            {/* 승인 처리 시트: 대상자/신고유형 없이 확정 사유 + 신고 사유만 (디자인 기준) */}
            <BottomSheetModal
                isOpen={isApproveSheetOpen}
                onClose={() => setIsApproveSheetOpen(false)}
                height="80vh"
            >
                <div className="flex h-full flex-col px-[25px] pb-[20px]">
                    <h2 className="flex-none py-[15px] text-center text-b-18-hn text-gray-900">
                        신고 승인
                    </h2>
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[20px]">
                        <div className="flex flex-col gap-[10px]">
                            <span className="text-sb-16-hn text-gray-900">
                                확정 사유 <span className="text-primary">(필수)</span>
                            </span>
                            <div className="flex flex-col gap-[2px]">
                                {REPORT_CATEGORY_ORDER.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => setSelectedDecidedCategory(category)}
                                        className="flex items-center py-[10px] gap-[12px] text-left"
                                    >
                                        <span
                                            className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border ${
                                                selectedDecidedCategory === category
                                                    ? 'border-primary'
                                                    : 'border-gray-650'
                                            }`}
                                        >
                                            {selectedDecidedCategory === category && (
                                                <span className="h-[9px] w-[9px] rounded-full bg-primary" />
                                            )}
                                        </span>
                                        <span className="text-m-16-hn text-gray-900">
                                            {getReportCategoryLabel(category)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-[8px]">
                            <span className="text-sb-16-hn text-gray-900">신고 사유 <span className="text-primary">(필수)</span></span>
                            <div className="relative">
                                <textarea
                                    maxLength={500}
                                    value={approveReason}
                                    onChange={(e) => setApproveReason(e.target.value)}
                                    placeholder="신고 사유를 간단히 입력해 주세요 (500자 제한)"
                                    className="w-full h-[100px] p-4 rounded-[10px] border border-gray-150 focus:outline-none focus:border-primary resize-none text-r-16 text-gray-900 placeholder:text-gray-400"
                                />
                                <span className="absolute bottom-[10px] right-[14px] text-r-12-hn text-gray-400">
                                    {approveReason.length}/500
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={!selectedDecidedCategory || !approveReason.trim() || statusMutation.isPending}
                        onClick={handleApproveSubmit}
                        className={`mt-[15px] w-full h-[50px] rounded-[27px] text-sb-16-hn ${
                            !selectedDecidedCategory || !approveReason.trim() || statusMutation.isPending
                                ? 'bg-gray-150 text-gray-650'
                                : 'bg-primary text-white'
                        }`}
                    >
                        {statusMutation.isPending ? '처리 중...' : '승인하기'}
                    </button>
                </div>
            </BottomSheetModal>

            {/* 반려 처리 시트 */}
            <BottomSheetModal
                isOpen={isRejectSheetOpen}
                onClose={() => setIsRejectSheetOpen(false)}
                height="auto"
            >
                <div className="flex flex-col px-[25px] pb-8 gap-6">
                    <h2 className="text-center text-b-18-hn text-gray-900 pt-[15px]">신고 반려</h2>
                    <div className="flex flex-col gap-2">
                        <span className="text-sb-16-hn text-gray-900">반려 사유 <span className="text-primary">(필수)</span></span>
                        <div className="relative">
                            <textarea
                                maxLength={500}
                                className="w-full h-[140px] p-4 rounded-[10px] border border-gray-150 focus:outline-none focus:border-primary resize-none text-r-16 text-gray-900 placeholder:text-gray-400"
                                placeholder="반려 사유를 간단히 입력해 주세요 (500자 제한)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <span className="absolute bottom-[10px] right-[14px] text-r-12-hn text-gray-400">
                                {rejectReason.length}/500
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={!rejectReason.trim() || statusMutation.isPending}
                        onClick={handleRejectSubmit}
                        className={`w-full h-[50px] rounded-[27px] text-sb-16-hn ${
                            !rejectReason.trim() || statusMutation.isPending
                                ? 'bg-gray-150 text-gray-650'
                                : 'bg-[#FFEFEF] text-[#FF3838]'
                        }`}
                    >
                        {statusMutation.isPending ? '처리 중...' : '반려하기'}
                    </button>
                </div>
            </BottomSheetModal>

            <PopUp isOpen={statusMutation.isPending} type="loading" title="처리 중입니다..." />

            {/* 처리/조회 에러 팝업 */}
            {errorPopupConfig && (
                <PopUp
                    isOpen={true}
                    type={errorPopupConfig.type}
                    title={errorPopupConfig.title}
                    content={errorPopupConfig.content}
                    buttonText="확인"
                    onClick={() => setErrorPopupConfig(null)}
                />
            )}

            {/* 증거 이미지 확대 보기 */}
            <ImagePopUp
                isOpen={Boolean(selectedImageUrl)}
                imageUrl={selectedImageUrl}
                onClose={() => setSelectedImageUrl(null)}
            />
        </div>
    );
};
