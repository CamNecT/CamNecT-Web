import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useRef, useState, type ChangeEvent } from 'react';
import { createReport, uploadReportEvidences } from '../../api/reportApi';
import type { ReportCategory, TargetType } from '../../api-types/reportApiTypes';
import {
    REPORT_CREATE_ERROR_MESSAGES,
    REPORT_ERROR_CODES,
} from '../../constants/serverErrors/reportErrors';
import { useFileUpload } from '../../hooks/useFileUpload';
import { REPORT_CATEGORY_LABEL, REPORT_CATEGORY_ORDER } from '../../pages/admin/utils/reportMapper';
import { useAuthStore } from '../../store/useAuthStore';
import { getServerErrorCode } from '../../utils/getServerErrorCode';
import BottomSheetModal from '../BottomSheetModal/BottomSheetModal';
import PopUp from '../Pop-up';
import type { PopUpType } from '../Pop-up';
import Icon from '../Icon';

// 마크다운 명세서 4번 섹션 기준: 파일당 최대 5 MiB(5,242,880 bytes). 실제 서버값 재확인 필요(이전엔 20MB로 안내받음)
const MAX_SIZE_MB = 5;
const MAX_FILE_COUNT = 5;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type EvidencePreview = {
    id: string;
    url: string;
    file: File;
};

type ReportModalProps = {
    isOpen: boolean;
    onClose: () => void;
    reportedUserId: number;
    reportedUserName: string;
    reportedPostId: number | null;
    postType: TargetType;
    onSubmitted?: () => void; // 제출 성공 후 콜백
};

const ReportModal = ({
    isOpen,
    onClose,
    reportedUserId,
    reportedUserName,
    reportedPostId,
    postType,
    onSubmitted,
}: ReportModalProps) => {
    const authUser = useAuthStore((state) => state.user);
    const reporterId = authUser?.id ? Number(authUser.id) : null;

    const { prepareFile, revokeUrl } = useFileUpload({
        maxSizeMB: MAX_SIZE_MB,
        allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });

    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
    // 최대 5장
    const [evidencePreviews, setEvidencePreviews] = useState<EvidencePreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [isFileErrorOpen, setIsFileErrorOpen] = useState(false);
    const [fileErrorMessage, setFileErrorMessage] = useState('');
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isDuplicateErrorOpen, setIsDuplicateErrorOpen] = useState(false);
    const [errorPopupConfig, setErrorPopupConfig] = useState<{ type: PopUpType; title: string; content: string } | null>(null);

    const isSubmitEnabled =
        title.trim().length > 0 &&
        context.trim().length > 0 &&
        selectedCategory !== null &&
        evidencePreviews.length > 0;

    const resetForm = () => {
        evidencePreviews.forEach((preview) => revokeUrl(preview.url));
        setTitle('');
        setContext('');
        setSelectedCategory(null);
        setEvidencePreviews([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = MAX_FILE_COUNT - evidencePreviews.length;
        if (remainingSlots <= 0) {
            setFileErrorMessage(`이미지는 최대 ${MAX_FILE_COUNT}장까지 첨부할 수 있습니다.`);
            setIsFileErrorOpen(true);
            event.target.value = '';
            return;
        }

        const selectedFiles = Array.from(files).slice(0, remainingSlots);
        const nextPreviews: EvidencePreview[] = [];
        let errorMsg: string | null = null;

        if (files.length > remainingSlots) {
            errorMsg = `이미지는 최대 ${MAX_FILE_COUNT}장까지만 첨부됩니다.`;
        }

        for (const file of selectedFiles) {
            if (!ALLOWED_TYPES.has(file.type)) {
                errorMsg = '이미지는 png / jpg / webp 형식만 업로드 가능합니다.';
                continue;
            }
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                errorMsg = `이미지가 파일 용량 제한을 초과합니다. (최대 ${MAX_SIZE_MB}MB)`;
                continue;
            }

            const prepared = prepareFile(file);
            if (!prepared) {
                errorMsg = '파일을 업로드할 수 없어요. 형식/용량을 확인해주세요.';
                continue;
            }

            nextPreviews.push({
                id: `evidence-${prepared.id}`,
                url: prepared.previewUrl,
                file: prepared.file,
            });
        }

        if (nextPreviews.length > 0) {
            setEvidencePreviews((prev) => [...prev, ...nextPreviews]);
        }
        if (errorMsg) {
            setFileErrorMessage(errorMsg);
            setIsFileErrorOpen(true);
        }
        event.target.value = '';
    };

    const handleRemoveEvidence = (id: string) => {
        setEvidencePreviews((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target) revokeUrl(target.url);
            return prev.filter((p) => p.id !== id);
        });
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            // 증거 이미지가 있으면 batch presign + S3 업로드 후 fileKey 배열을 얻음
            const evidenceImageKeys =
                evidencePreviews.length > 0
                    ? await uploadReportEvidences(
                          reporterId!,
                          evidencePreviews.map((preview) => preview.file),
                      )
                    : [];

            return createReport(reporterId!, {
                reportedUserId,
                reportedPostId,
                postType,
                reportCategory: selectedCategory!,
                title: title.trim(),
                context: context.trim(),
                evidenceImageKeys,
            });
        },
        onSuccess: (res) => {
            setSuccessMessage(res.data.message || '관리자 검토 후 조치 예정입니다.');
            setIsSuccessPopupOpen(true);
        },
        onError: (error: unknown) => {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            const errorCode = getServerErrorCode(axiosError);

            // 중복 신고: HTTP 409, 오류 코드 51901 (서버 판단에 그대로 위임)
            if (status === 409) {
                setIsDuplicateErrorOpen(true);
                return;
            }
            if (status === 400 && errorCode === REPORT_ERROR_CODES.common.invalidRequest) {
                setErrorPopupConfig({ type: "error", ...REPORT_CREATE_ERROR_MESSAGES.invalidRequest });
                return;
            }
            if (status === 404 && errorCode === REPORT_ERROR_CODES.reportCreate.reportedUserNotFound) {
                setErrorPopupConfig({ type: "error", ...REPORT_CREATE_ERROR_MESSAGES.reportedUserNotFound });
                return;
            }
            if (status === 500) {
                setErrorPopupConfig({ type: "error", ...REPORT_CREATE_ERROR_MESSAGES.internal });
                return;
            }
            setErrorPopupConfig({ type: "error", ...REPORT_CREATE_ERROR_MESSAGES.fallback });
        },
    });

    const handleSubmit = () => {
        if (!isSubmitEnabled || submitMutation.isPending || !reporterId) return;
        submitMutation.mutate();
    };

    return (
        <>
            <BottomSheetModal isOpen={isOpen} onClose={handleClose} height="85vh">
                <div className="flex h-full flex-col">
                    <h2 className="flex-none px-[25px] py-[20px] text-center text-b-20-hn text-gray-900">
                        신고하기
                    </h2>

                    <div className="flex-1 min-h-0 overflow-y-auto px-[25px] py-[10px]">
                        {/* 신고 대상 정보 */}
                        <div className="flex border-b border-gray-650 pb-[20px]">
                            <div className="flex items-center gap-[12px]">
                                <span className="text-m-16-hn text-gray-700 w-[60px]">신고 대상</span>
                                <span className="text-r-16-hn text-gray-750">{reportedUserName}</span>
                            </div>
                        </div>

                        {/* 신고 입력 */}
                        <div className="flex flex-col gap-[30px] py-[20px]">
                            <div className="flex flex-col gap-[8px]">
                                <span className="text-sb-16 text-gray-900">제목</span>
                                <input
                                    type="text"
                                    name="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="신고 제목을 입력해주세요"
                                    className="w-full h-[48px] rounded-[10px] border border-gray-150 px-4 text-r-16 text-gray-900 outline-none focus:border-primary placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex flex-col gap-[8px]">
                                <span className="text-sb-16 text-gray-900">내용</span>
                                <textarea
                                    className="w-full h-[120px] p-4 rounded-[10px] border border-gray-150 focus:outline-none focus:border-primary resize-none text-r-16 text-gray-900 placeholder:text-gray-400"
                                    placeholder="신고 상세 내용을 입력해주세요"
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                />
                            </div>

                            {/* 신고 유형 */}
                            <div className="flex flex-col gap-[7px]">
                                <span className="text-sb-16 text-gray-900">신고 유형</span>
                                <div className="flex flex-col">
                                    {REPORT_CATEGORY_ORDER.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setSelectedCategory(category)}
                                            className="flex items-center py-[13px] gap-[15px] text-left"
                                        >
                                            <span
                                                className={`flex h-[20px] w-[20px] flex-none items-center justify-center rounded-full border ${
                                                    selectedCategory === category
                                                        ? 'border-primary'
                                                        : 'border-gray-650'
                                                }`}
                                            >
                                                {selectedCategory === category && (
                                                    <span className="h-[10px] w-[10px] rounded-full bg-primary" />
                                                )}
                                            </span>
                                            <span className="text-m-16-hn text-gray-900">
                                                {REPORT_CATEGORY_LABEL[category]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 증거 이미지 (최대 5장, 장당 5MB) */}
                            <div className="flex flex-col gap-[15px]">
                                <span className="text-sb-16 text-gray-900">
                                    신고 이미지 ({evidencePreviews.length}/{MAX_FILE_COUNT})
                                </span>

                                {evidencePreviews.length < MAX_FILE_COUNT && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex w-full items-center p-[15px] gap-[15px] rounded-[5px] bg-gray-150"
                                    >
                                        <Icon name="picture" />
                                        <span className="text-r-14-hn text-gray-650">
                                            이미지를 추가해주세요 (png, jpg, webp / 최대 {MAX_FILE_COUNT}장, 장당 {MAX_SIZE_MB}MB)
                                        </span>
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />

                                {evidencePreviews.length > 0 && (
                                    <div className="overflow-x-auto h-[90px] flex items-end">
                                        <div className="flex w-max gap-[8px]">
                                            {evidencePreviews.map((preview) => (
                                                <div key={preview.id} className="relative h-[80px] w-[80px] flex-none">
                                                    <img
                                                        src={preview.url}
                                                        alt="증거 이미지 미리보기"
                                                        className="h-full w-full rounded-[8px] object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="이미지 삭제"
                                                        onClick={() => handleRemoveEvidence(preview.id)}
                                                        className="absolute -right-[6px] -top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gray-750"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M6 18L18 6M6 6L18 18"
                                                                stroke="white"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div className="flex-none px-[25px] pb-[20px] pt-[10px]">
                        <button
                            type="button"
                            disabled={!isSubmitEnabled || submitMutation.isPending}
                            onClick={handleSubmit}
                            className={`w-full h-[50px] rounded-[27px] text-sb-18 ${
                                !isSubmitEnabled || submitMutation.isPending
                                    ? 'text-gray-650 bg-gray-150'
                                    : 'text-white bg-primary'
                            }`}
                        >
                            {submitMutation.isPending ? '제출 중' : '신고하기'}
                        </button>
                    </div>
                </div>
            </BottomSheetModal>

            {/* 파일 에러 팝업 (형식/용량/개수 제한) */}
            <PopUp
                isOpen={isFileErrorOpen}
                type="error"
                title="업로드할 수 없는 파일"
                content={fileErrorMessage}
                rightButtonText="확인"
                onClick={() => setIsFileErrorOpen(false)}
            />

            {/* 중복 신고 팝업 (프론트 선차단 + 서버 409/51901 공통) */}
            <PopUp
                isOpen={isDuplicateErrorOpen}
                type="error"
                title={REPORT_CREATE_ERROR_MESSAGES.duplicateReport.title}
                content={REPORT_CREATE_ERROR_MESSAGES.duplicateReport.content}
                rightButtonText="확인"
                onClick={() => setIsDuplicateErrorOpen(false)}
            />

            {/* 제출 성공 팝업 */}
            <PopUp
                isOpen={isSuccessPopupOpen}
                type="confirm"
                title="신고가 접수되었습니다"
                content={successMessage}
                buttonText="확인"
                onClick={() => {
                    setIsSuccessPopupOpen(false);
                    resetForm();
                    onClose();
                    onSubmitted?.();
                }}
            />

            {/* 제출/업로드 에러 팝업 (코드별 분기) */}
            {errorPopupConfig && (
                <PopUp
                    isOpen={true}
                    type={errorPopupConfig.type}
                    title={errorPopupConfig.title}
                    content={errorPopupConfig.content}
                    rightButtonText="확인"
                    onClick={() => setErrorPopupConfig(null)}
                />
            )}
        </>
    );
};

export default ReportModal;