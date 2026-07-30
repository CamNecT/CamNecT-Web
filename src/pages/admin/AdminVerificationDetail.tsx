import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestAdminVerificationDownloadUrl, requestAdminVerificationProcess } from "../../api/auth";
import BottomSheetModal from "../../components/BottomSheetModal/BottomSheetModal";
import Button from "../../components/Button";
import SingleInput from "../../components/common/SingleInput";
import Icon from "../../components/Icon";
import PopUp from "../../components/Pop-up";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";

export const AdminVerificationDetail = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const item = location.state?.itemData; 
    const queryClient = useQueryClient();

    // 현재 관리자(로그인된 유저)의 ID 가져오기
    const adminId = useAuthStore((state) => Number(state.user!.id));
    const submissionId = Number(item?.id);
    
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isErrorDismissed, setIsErrorDismissed] = useState(false);
    const [showProcessError, setShowProcessError] = useState(false);

    // 승인 모달 입력 데이터 상태 (객체로 통합 관리)
    const [approveForm, setApproveForm] = useState({
        studentName: "",
        institutionId: 1, // 건국대학교 고정
        studentNo: "",
        majorId: ""
    });

    // 입학년도 유효성 검사 (4자리 숫자, 현재 년도 이하) -> 학번으로 사용 
    const isEntryYearValid = (year: string) => {
        if (!/^\d{4}$/.test(year)) return false;
        const entryYear = parseInt(year, 10);
        const currentYear = new Date().getFullYear();
        return entryYear <= currentYear && entryYear >= 2000;
    };

    // 전체 승인 폼 유효성 검사
    const isApproveFormValid = 
        approveForm.studentName.trim() !== "" && 
        isEntryYearValid(approveForm.studentNo) && 
        approveForm.majorId !== "";
    
    // 인증서 파일 다운로드 URL 호출
    const { data: verificationFile, isLoading, isError } = useQuery({
        queryKey: ['verificationFile', item?.id],
        queryFn: () => requestAdminVerificationDownloadUrl({ submissionId: submissionId }),
        enabled: !!item?.id, // id(pathparameter)가 있어야 실행
    })

    // 인증서 심사 mutation
    const verifyMutation = useMutation({
        mutationFn: requestAdminVerificationProcess,
        onSuccess: () => {
            // 인증서 목록 refetch (queryKey 무효화 -> 캐시 삭제 -> 서버에서 다시 가져옴)
            queryClient.invalidateQueries({ queryKey: ['verificationList'] });
            navigate("/admin/school-verification");
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            if (status === 400) {
                setShowProcessError(true);
            }
        }
    })

    // 인증서 파일 새 창에서 보기
    const handlePreviewClick = () => {
        if (verificationFile?.downloadUrl) {
            window.open(verificationFile.downloadUrl, '_blank');
        }
    };

    // 승인 폼 입력 핸들러
    const handleApproveFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setApproveForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApproveSubmit = () => {
        // 승인 API 호출
        verifyMutation.mutate({
            adminId: adminId,
            submissionId: submissionId,
            decision: "APPROVE",
            studentName: approveForm.studentName,
            studentNo: approveForm.studentNo,
            institutionId: approveForm.institutionId,
            majorId: Number(approveForm.majorId)
        });
        setIsApproveModalOpen(false);
    }

    const handleRejectSubmit = () => {
        // 거절 API 호출
        verifyMutation.mutate({
            adminId: adminId,
            submissionId: submissionId,
            decision: "REJECT",
            reason: rejectReason
        });
        setIsRejectModalOpen(false);
    }
    
    return (
        <div className="flex flex-col h-full bg-white">
            <MainHeader title="재학증명서 상세페이지" />

            <section className="flex flex-col gap-[20px] px-5">
                <div className="flex pt-[20px] py-4 ">
                    <div className="flex items-center gap-[15px]">
                        {/* 아바타 아이콘 */}
                        <div className="w-[70px] h-[70px] rounded-full bg-gray-150 flex items-center justify-center overflow-hidden">
                        <Icon name="Navigation_mypage_stroke" className="w-[42px] h-[42px] text-gray-400" />
                    </div>
                    
                    {/* 유저 정보 */}
                    <div className="flex flex-col gap-[2px]">
                        <span 
                            className="text-gray-900 text-b-20"
                            style={{ letterSpacing: '-0.8px' }}
                        >
                            {item?.userId || "Unknown"}
                        </span>
                        <span 
                            className="text-gray-750 text-m-16 font-medium"
                            style={{ letterSpacing: '-0.4px' }}
                        >
                            {item?.phoneNum || "010-0000-0000"}
                        </span>
                    </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-[10px] w-full">
                    <div className="p-[15px] flex items-center justify-between w-full gap-[15px]">
                        <Icon name="folder" className="flex-none"/>
                        <div className="flex-1 min-w-0">
                            <p className="text-r-14 text-gray-900 break-all">
                                {item?.originalFilename || "인증서 파일"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePreviewClick}
                            className="w-[60px] flex-none py-[6px] bg-gray-350 text-white text-r-12 rounded-[5px] cursor-pointer active:opacity-80"
                        >
                            보기
                        </button>
                    </div>
                </div>

                <div className="flex gap-[10px] justify-center items-center w-full">
                    <Button 
                        label="거부하기" 
                        onClick={() => setIsRejectModalOpen(true)}
                        className="flex-1 !py-[13px] !h-[45px] !rounded-[10px] !text-SB-16 !bg-[#FFEFEF] !text-[#FF3838]"
                    />
                    <Button 
                        label="승인하기" 
                        onClick={() => setIsApproveModalOpen(true)}
                        className="flex-1 !h-[45px] !rounded-[10px] !text-SB-16"
                    />
                </div>
                    
            </section>

            {/* 승인 모달 */}
            <BottomSheetModal 
                isOpen={isApproveModalOpen} 
                onClose={() => setIsApproveModalOpen(false)}
            >
                <div className="flex flex-col px-[25px] pb-8 gap-6">
                    <div className="flex flex-col gap-4 w-full">
                        <SingleInput 
                            label="이름" 
                            name="studentName"
                            value={approveForm.studentName} 
                            onChange={handleApproveFormChange} 
                            placeholder="이름 입력"
                            className="w-full" 
                        />
                        <SingleInput 
                            label="학교" 
                            name="institutionName"
                            value="건국대학교" 
                            disabled
                            placeholder="학교"
                            className="w-full [&_input]:!text-gray-900" 
                        />
                        <SingleInput 
                            label="입학년도" 
                            name="studentNo"
                            value={approveForm.studentNo} 
                            onChange={handleApproveFormChange} 
                            placeholder="입학년도 입력"
                            className="w-full" 
                        />
                        <SingleInput 
                            label="학과 ID" 
                            name="majorId"
                            value={approveForm.majorId} 
                            onChange={handleApproveFormChange} 
                            placeholder="학과 ID(숫자) 입력"
                            className="w-full" 
                            type="number"
                        />
                    </div>
                    <Button 
                        label={verifyMutation.isPending ? "처리 중..." : "승인하기"} 
                        onClick={handleApproveSubmit}
                        disabled={!isApproveFormValid || verifyMutation.isPending}
                        className={`w-full !max-w-none !text-white !h-[50px] !rounded-[27px] 
                            ${(!isApproveFormValid || verifyMutation.isPending) 
                                ? '!bg-gray-150' 
                                : 'bg-primary'
                            }`}
                    />
                </div>
            </BottomSheetModal>

            {/* 거절 모달 */}
            <BottomSheetModal 
                isOpen={isRejectModalOpen} 
                onClose={() => setIsRejectModalOpen(false)}
            >
                <div className="flex flex-col px-[25px] pb-8 gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-m-16 text-gray-900">거부사유</span>
                        <textarea 
                            className="w-full h-[180px] p-4 rounded-[10px] border border-gray-150 focus:outline-none focus:border-primary resize-none text-r-16 text-gray-900 placeholder:text-gray-400"
                            placeholder="거부 상세사유 입력"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <Button 
                        label={verifyMutation.isPending ? "처리 중..." : "거부하기"} 
                        onClick={handleRejectSubmit}
                        disabled={!rejectReason.trim() || verifyMutation.isPending}
                        className={`w-full !max-w-none !h-[50px] !rounded-[27px] ${(!rejectReason.trim() || verifyMutation.isPending) ? '!bg-gray-150 !text-gray-400' : '!bg-[#FFEFEF] !text-[#FF3838]'}`}
                    />
                </div>
            </BottomSheetModal>

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
                content="데이터를 불러오는 중 문제가 발생했습니다." 
                buttonText="닫기"
                onClick={() => setIsErrorDismissed(true)}
            />

            {/* 심사 처리 에러 팝업 (400 등) */}
            <PopUp 
                isOpen={showProcessError} 
                type="error" 
                title="처리 불가" 
                content="요청값 검증에 실패했거나\n현재 처리할 수 없는 상태입니다." 
                buttonText="확인"
                onClick={() => setShowProcessError(false)}
            />

            {/* 심사 처리 로딩 팝업 */}
            <PopUp 
                isOpen={verifyMutation.isPending} 
                type="loading" 
                title="심사 결과를 전송하고 있습니다..." 
            />
        </div>
    );
};