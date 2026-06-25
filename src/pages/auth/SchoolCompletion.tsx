import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestVerificationComplete } from "../../api/auth";
import Button from "../../components/Button";
import PopUp from "../../components/Pop-up";
import { useAuthStore } from "../../store/useAuthStore";

// 학교 인증 정보 표시 컴포넌트
const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col items-start gap-[3px]">
        <p className="text-r-14 text-gray-650 tracking-[-0.56px]">{label}</p>
        <p className="text-m-16 text-gray-750 tracking-[-0.4px] whitespace-pre-wrap break-all">
            {value}
        </p>
    </div>
);

// 학교 인증 완료 화면 
export const SchoolCompletion = () => {
    const navigate = useNavigate();
    // useAuthStore에서 userId 가져오기 (문자열인 경우 숫자로 변환)
    const userId = useAuthStore((state) => state.user?.id ? Number(state.user.id) : null);

    const [isFetchErrorDismissed, setIsFetchErrorDismissed] = useState(false);

    // useQuery를 사용하여 인증 완료 화면 요청 API 호출
    const { data: verificationCompleteData, isLoading, isError } = useQuery({
        queryKey: ['verificationComplete', userId],
        queryFn: () => requestVerificationComplete({ userId: userId || 0 }),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });

    // 데이터 누락 여부 확인 (하나라도 없으면 오류로 간주)
    const isDataIncomplete = !!(!isLoading && !isError && verificationCompleteData && (
        !verificationCompleteData.name || 
        !verificationCompleteData.studentNo || 
        !verificationCompleteData.institutionName || 
        !verificationCompleteData.majorName
    ));
    
    return (
        <div className="absolute inset-0 bg-white px-[25px] flex flex-col overflow-hidden">
            <h1 className="pt-[86px] text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-gray-900 flex-none relative z-10">
                인증이 완료되었습니다!
            </h1>

            <h2 className="pt-[10px] text-m-14 text-gray-750 tracking-[-0.56px] leading-[140%]">
                인증하신 정보가 맞는지 확인해주세요<br/>
                입력하신 정보가 일치하지 않는 경우 재인증을 해주세요
            </h2>  
            
            <div className="mt-[60px] px-[25px] grid grid-cols-2 gap-y-[40px] gap-x-[10px] w-full">
                <InfoItem label="이름" value={verificationCompleteData?.name || "-"} />
                <InfoItem label="학번" value={verificationCompleteData?.studentNo || "-"} />
                <InfoItem label="대학교" value={verificationCompleteData?.institutionName || "-"} />
                <InfoItem label="학과" value={verificationCompleteData?.majorName || "-"} />
            </div>

            <div className="flex-1" />
            
            <div className="flex-none pb-[60px]">
                <div className="flex flex-col items-center gap-[10px]">
                    {/* <ButtonWhite label = "재인증" /> */}
                    <Button 
                        label="시작하기"
                        onClick={() => {
                            // useAuthStore의 nextStep을 HOME으로 변경
                            useAuthStore.setState((state) => ({
                                user: state.user ? { ...state.user, nextStep: 'HOME' } : null
                            }));
                            // 홈 화면 이동
                            navigate('/home');
                        }}
                    />
                </div>
            </div>

            {/* 로딩 팝업 */}
            <PopUp 
                isOpen={isLoading} 
                type="loading" 
                title="인증 정보를 확인 중입니다..." 
            />

            {/* 에러 팝업 (API 에러 또는 데이터 누락) */}
            <PopUp 
                isOpen={(isError || isDataIncomplete) && !isFetchErrorDismissed} 
                type="error" 
                title="오류 발생" 
                content={isDataIncomplete ? "인증 정보 중 일부가 누락되었습니다.\n관리자에게 문의해 주세요." : "정보를 불러오는 중 문제가 발생했습니다."} 
                buttonText="닫기"
                onClick={() => setIsFetchErrorDismissed(true)}
            />
        </div>
    )
}   