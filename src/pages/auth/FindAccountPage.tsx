import { useParams, useNavigate } from "react-router-dom";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { Tabs } from "../../components/Tabs";
import { FindIdForm } from "./components/FindIdForm";
import { FindPwForm } from "./components/FindPwForm";
import { useState } from "react";

const tabs = [
    { id: 'id', label: '아이디 찾기' },
    { id: 'password', label: '비밀번호 찾기' },
]

export const FindAccountPage = () => {

    const { tab } = useParams();
    const [isPasswordResetStep, setIsPasswordResetStep] = useState<boolean>(false);
    const navigate = useNavigate();
    const headerTitle = tab === tabs[0].id
        ? tabs[0].label
        : isPasswordResetStep
            ? "비밀번호 재설정"
            : tabs[1].label;


    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                    title={headerTitle}
                    leftAction={isPasswordResetStep
                        ? { onClick: () => setIsPasswordResetStep(false) }
                        : undefined
                    }
                />
            }
        >
            <Tabs
                tabs={tabs}
                activeId={tab ?? 'id'} // ?? : nullish 병합 연산자 -> 왼쪽이 null || undefined 이면 오른쪽값 사용
                onChange={(id) => navigate(`/find-account/${id}`, {replace: true})}
                isVisible={!isPasswordResetStep}
            >
                {tab === 'id' ? <FindIdForm /> : <FindPwForm isPasswordResetStep = {isPasswordResetStep} onCodeVerified = {() => setIsPasswordResetStep(true)} />}
            </Tabs>

        </HeaderLayout>
    )
}