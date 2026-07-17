import { useState } from "react";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import CheckBoxToggle from "../../components/Toggle/CheckBoxToggle";
import { useSignupStore } from "../../store/useSignupStore";
import { TermsModal } from "../../components/TermsModal";

interface TermsStepProps {
    onNext: () => void;
}

const terms = [
    { id: 'serviceTerms', label: '서비스 이용 약관', required: true },
    { id: 'privacyTerms', label: '개인정보 수집 및 이용 동의', required: true }
];

// 이용약관 단계
export const TermsStep = ({ onNext }: TermsStepProps) => {
    const { agreements, setAgreements } = useSignupStore();
    const [localAgreements, setLocalAgreements] = useState(agreements);
        const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'service' | 'privacy' | null;
    }>({
        isOpen: false,
        type: null
    });

    const allChecked = localAgreements.serviceTerms && localAgreements.privacyTerms;

    // 이용약관 모달 열기
    const handleModalOpen = (type: 'service' | 'privacy') => {
        setModalState({ isOpen: true, type });
    };

    // 이용약관 모달 닫기
    const handleModalClose = () => {
        setModalState({ isOpen: false, type: null });
    };

    // 전체 동의 핸들러
    const handleAllAgree = () => {
        setLocalAgreements({
            serviceTerms: !allChecked,
            privacyTerms: !allChecked,
        });
    }

    // 개별 동의 핸들러
    const handleAgree = (id: "serviceTerms" | "privacyTerms") => {
        const newAgreements = { ...localAgreements };  
        newAgreements[id] = !newAgreements[id];        
        setLocalAgreements(newAgreements);             
    }

    // 다음 단계 핸들러
    const handleNextStep = () => {
        setAgreements(localAgreements);
        onNext();
    }

    return (
        <div className="absolute inset-0 bg-white px-[25px] flex flex-col overflow-hidden">
            {/* 헤더 섹션 - 디자인 시안 pt-[116px] 반영 */}
            <h1 className="pt-[86px] text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-gray-900 flex-none relative z-10">
                <p>서비스 이용을 위해</p>
                <p>약관에 동의해주세요</p>
            </h1>
            
            {/* 유동적 간격 (디자인 시안의 대략적인 비율 mt-[222px] 반영), 최소 20px간격은 확보 */}
            <div className="flex-[222] min-h-[20px]"/>

            {/* 약관 동의 섹션 */}
            <div className="flex-none relative z-10 w-full">
                {/* 전체 동의 */}
                <button 
                    type="button"
                    onClick={handleAllAgree}
                    className="flex items-center gap-[10px] w-full h-[52px] pl-[16px] pr-4 rounded-[5px] bg-[#F2FCF8] mb-[20px]"
                >
                    <CheckBoxToggle size={30} checked={allChecked} className="pointer-events-none" />
                    <p className="text-sb-18 text-primary tracking-[-0.72px]">아래 내용에 모두 동의합니다.</p>
                </button>
                
                <ol className="space-y-[20px]">
                    <li>
                        <button 
                            type="button"
                            onClick={() => handleAgree('serviceTerms')}
                            className="flex items-center gap-[10px] w-full h-[25px] pl-[16px] text-left"
                        >
                            {/* pointer-events-none : 해당 태그는 클릭에 반응 X */}
                            <CheckBoxToggle checked={localAgreements.serviceTerms} className="pointer-events-none" />
                            <div className="flex items-center justify-between flex-1">
                                <div className="flex gap-[7px] items-center">
                                    <span className="text-m-16 text-gray-900" style={{ letterSpacing: '-0.4px' }}>[필수]</span>
                                    <span className="text-r-14 text-gray-750" style={{ letterSpacing: '-0.56px' }}>{terms[0].label}</span>
                                </div>
                                <Icon name="more" onClick={() => handleModalOpen('service')}></Icon>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button 
                            type="button"
                            onClick={() => handleAgree('privacyTerms')}
                            className="flex items-center gap-[10px] w-full h-[25px] pl-[16px] text-left"
                        >
                            <CheckBoxToggle checked={localAgreements.privacyTerms} className="pointer-events-none" />
                            <div className="flex items-center justify-between flex-1">
                                <div className="flex gap-[7px] items-center">
                                    <span className="text-m-16 text-gray-900" style={{ letterSpacing: '-0.4px' }}>[필수]</span>
                                    <span className="text-r-14 text-gray-750" style={{ letterSpacing: '-0.56px' }}>{terms[1].label}</span>
                                </div>
                                <Icon name="more" onClick={() => handleModalOpen('privacy')}></Icon>
                            </div>
                        </button>
                    </li>
                </ol>
            </div>

            {/* 하단 버튼과의 유동적 간격 */}
            <div className="flex-[60] min-h-[40px]"/>

            {/* 버튼 섹션 (하단 고정 효과) */}
            <div className="flex-none pb-[60px] relative z-10 w-full flex justify-center">
                <Button 
                    label="동의 후 계속하기" 
                    onClick={handleNextStep}
                    disabled={!allChecked}
                />
            </div>

            {modalState.type && (
                <TermsModal
                    isOpen={modalState.isOpen}
                    onClose={handleModalClose}
                    type={modalState.type}
                />
            )}
        </div>
    )
}