import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { SchoolDocType } from "../../api-types/authApiTypes";
import { requestSchoolVerification, requestSchoolVerificationPresign } from "../../api/auth";
import Button from "../../components/Button";
import ButtonWhite from "../../components/ButtonWhite";
import Icon from "../../components/Icon";
import PopUp from "../../components/Pop-up";
import { useAuthStore } from "../../store/useAuthStore";
import { useSignupStore } from "../../store/useSignupStore";
import { uploadFileToS3 } from "../../utils/s3Upload";

interface SchoolVerificationStepProps {
    onNext: () => void;
}

// 학교 인증 자료 제출 화면
export const SchoolVerificationStep = ({ onNext }: SchoolVerificationStepProps) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [showConfirmPopUp, setShowConfirmPopUp] = useState(false);
    const [showMountPopUp, setShowMountPopUp] = useState(true);
    const [showErrorPopUp, setShowErrorPopUp] = useState(false);
    const [showSizeErrorPopUp, setShowSizeErrorPopUp] = useState(false);
    const [docType, setDocType] = useState<SchoolDocType>('ENROLLMENT_CERTIFICATE');
    const [isSubmitting, setIsSubmitting] = useState(false); // 전체 제출 상태 관리

    const { verificationFile, setVerificationFile, isVerificationSubmitted, setIsVerificationSubmitted } = useSignupStore(
        useShallow((state) => {
            return {
                verificationFile: state.verificationFile,
                setVerificationFile: state.setVerificationFile,
                isVerificationSubmitted: state.isVerificationSubmitted,
                setIsVerificationSubmitted: state.setIsVerificationSubmitted
            }
        } )
    );

    // 로그인/가입 세션에서 유저 ID 가져오기
    const userId = useAuthStore((state) => state.user?.id ? Number(state.user.id) : null);

    // selectedFile 변경 시 previewUrl 생성 
    const previewUrl = useMemo(() => {
        return verificationFile ? URL.createObjectURL(verificationFile) : null;
    }, [verificationFile]);

    // URL cleanup (메모리 누수 방지)
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // 파일 첨부
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // 10MB 용량 제한 체크 (10 * 1024 * 1024 bytes)
            if (file.size > 10 * 1024 * 1024) {
                setShowSizeErrorPopUp(true);
                event.target.value = ""; // input 초기화
                return;
            }
            setVerificationFile(file);
        }
    };

    // 미리보기 클릭
    const handlePreviewClick = () => {  
        setShowPreview(true);  
    };

    // 첨부파일 삭제
    const handleRemoveFile = () => {
        setVerificationFile(null);
        setShowPreview(false);
    };

    const handleShowPopup = () => {
        setShowPopUp(true);
    };

    const handlePopUpClose = () => {
        setShowPopUp(false);
    };

    const handleConfirmPopUpClose = () => {
        setShowConfirmPopUp(false);
    };

    // presign api 연동
    const presignMutation = useMutation({
        mutationFn: requestSchoolVerificationPresign,
    });

    // 인증서 제출 api 연동 
    const verifyRequestMutation = useMutation({
        mutationFn: requestSchoolVerification,
    });

    // 인증서 제출 함수 
    const handleVerificationSubmit = async () => {
        if (!verificationFile || userId === null || userId === undefined) {
            console.error("제출 실패: 파일 또는 유저 ID가 없습니다.", { verificationFile, userId });
            return;
        }

        setIsSubmitting(true);
        setShowPopUp(false);

        try {
            // Step 1: Presigned URL 발급 요청
            const presignData = await presignMutation.mutateAsync({
                userId,
                contentType: verificationFile.type,
                size: verificationFile.size,
                originalFilename: verificationFile.name
            });

            // Step 2: S3에 파일 직접 업로드
            await uploadFileToS3(
                presignData.uploadUrl,
                verificationFile,
                presignData.requiredHeaders
            );

            // Step 3: 백엔드에 업로드 완료 및 검증 요청
            await verifyRequestMutation.mutateAsync({
                userId,
                docType: docType,
                documentKey: presignData.fileKey
            });

            // 모든 단계 성공 시
            setShowConfirmPopUp(true);
            setIsVerificationSubmitted(true);
        } catch {
            setShowErrorPopUp(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-white px-[25px] flex flex-col overflow-hidden">
            <h1 className="pt-[86px] text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-gray-900 flex-none relative z-10">
                학교를 인증해주세요!
            </h1>

            <h2 className="pt-[10px] text-m-14 text-gray-750 tracking-[-0.56px] leading-[140%]">
                {docType === 'GRADUATION_CERTIFICATE' 
                    ? "졸업증명서를 첨부해주세요" 
                    : "학생증, 재학증명서 또는 등록금 납부서를 첨부해주세요"}
                <br/>
                인증에 사용되며 인증완료후에 폐기됩니다
            </h2>

            <p className="pt-[29px] text-m-16 text-gray-750 tracking-[-0.56px] leading-[140%]">파일첨부</p>
            
            <div className="pt-[10px]">
                {!verificationFile ? (
                    <>
                        <label 
                            htmlFor="file-upload"
                            className="flex items-center justify-center gap-[12px] w-full h-[54px] bg-gray-150 rounded-[10px] border-2 border-dashed border-gray-200 cursor-pointer"
                        >
                            <Icon name="folder" />
                            <span className="text-r-16 text-gray-650">
                                인증 파일 첨부 (png, jpg, pdf)
                            </span>
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </>
                ) : (
                    <div className="p-[16px] bg-gray-50 rounded-[10px] flex items-center gap-[12px]">
                        <Icon name="folder" className="flex-none"/>
                        <div className="flex-1 min-w-0">
                            <p className="text-r-14 text-gray-900 break-all">{verificationFile.name}</p>
                            <p className="text-r-12 text-gray-500 mt-[4px]">
                                {(verificationFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <div className="flex items-center gap-[6px] flex-none">
                            <Button
                                label="미리보기"
                                font="r-12"
                                className="w-[72px] flex-none h-auto px-[12px] py-[6px] rounded-[5px]"
                                onClick={handlePreviewClick}
                            />
                            <button
                                onClick={handleRemoveFile}
                                disabled={isVerificationSubmitted}
                                className="w-[48px] flex-none px-[12px] py-[6px] bg-gray-200 text-gray-700 text-r-12 rounded-[5px] "
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1" />

            <div className="flex-none pb-[60px]">
                <div className="flex flex-col items-center gap-[10px]">
                    <ButtonWhite 
                        label={isSubmitting ? "제출 중..." : "인증 요청"} 
                        onClick={handleShowPopup} 
                        disabled={(!verificationFile) || isVerificationSubmitted || isSubmitting}
                    />
                    <Button 
                        disabled={!isVerificationSubmitted || isSubmitting}
                        label="다음"
                        onClick={onNext}
                        className="mx-auto"
                    />
                </div>
            </div>

            {showPopUp && (
                <PopUp
                    isOpen={showPopUp}
                    type="info"
                    title="인증 파일을 제출하시겠습니까?"
                    content="파일 제출은 다시 할 수 없습니다."
                    leftButtonText="취소"
                    rightButtonText="제출"
                    onLeftClick={handlePopUpClose}
                    onRightClick={handleVerificationSubmit}
                />
            )}

            {showConfirmPopUp && (
                <PopUp
                    isOpen={showConfirmPopUp}
                    type="confirm"
                    title="제출 완료 되었습니다"
                    buttonText="확인"
                    onClick={handleConfirmPopUpClose}
                />
            )}

            {showErrorPopUp && (
                <PopUp
                    isOpen={showErrorPopUp}
                    type="error"
                    title="제출 실패"
                    content="인증 파일 제출 중 오류가 발생했습니다\n다시 시도해 주세요."
                    buttonText="확인"
                    onClick={() => setShowErrorPopUp(false)}
                />
            )}

            {showSizeErrorPopUp && (
                <PopUp
                    isOpen={showSizeErrorPopUp}
                    type="error"
                    title="파일 용량 초과"
                    content="파일 크기는 10MB를 초과할 수 없습니다."
                    buttonText="확인"
                    onClick={() => setShowSizeErrorPopUp(false)}
                />
            )}

            {showMountPopUp && (
                <PopUp
                    isOpen={showMountPopUp}
                    type="info"
                    title="본인의 현재 상태를 선택해주세요"
                    content="상태에 따라 제출 서류가 달라질 수 있습니다."
                    leftButtonText="졸업생"
                    rightButtonText="재학/휴학생"
                    onLeftClick={() => {
                        setDocType('GRADUATION_CERTIFICATE');
                        setShowMountPopUp(false);
                    }}
                    onRightClick={() => {
                        setDocType('ENROLLMENT_CERTIFICATE');
                        setShowMountPopUp(false);
                    }}
                />
            )}
            
            {showPreview && previewUrl && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute -top-[40px] right-0 text-white text-[24px]  z-10"
                        >
                            ✕
                        </button>
                        
                        {verificationFile?.type.startsWith('image/') ? (
                            <img 
                                src={previewUrl} 
                                alt="미리보기" 
                                className="max-w-[90vw] max-h-[90dvh] rounded-[10px]"
                            />
                        ) : (
                            <iframe 
                                src={previewUrl} 
                                className="w-[90vw] h-[90dvh] max-w-[800px] max-h-[600px] rounded-[10px] bg-white"
                                title="PDF 미리보기"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};