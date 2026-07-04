import { useState } from "react";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { Tabs } from "../../components/Tabs";
import SingleInput from "../../components/common/SingleInput";
import Button from "../../components/Button";
import { FindPwForm } from "./components/FindPwForm";

export const FindAccountPage = () => {

    const tabs = [
        { id: 'ID', label: '아이디 찾기' },
        { id: 'PW', label: '비밀번호 찾기' },
    ]
    
    // 현재 탭 상태 
    const [activeId, setActiveId] = useState<string>('ID');

    // todo handle submit 함수 제작

    // activeId에따른 다른 form태그 감싸기 -> 함수 동작이 달라진다 (함수에 props로 받아서 다르게 처리)
    // todo 1. RHF + zod로 form 태그 관리

    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                    title={activeId === 'ID' ? '아이디 찾기' : '비밀번호 찾기'}
                    headerPaddingTop={68}
                />
            }
        >
            <Tabs
                tabs={tabs}
                activeId={activeId}
                onChange={(id) => setActiveId(id as string)}
            >
                {
                    activeId === 'ID' ? (
                        <form className="flex flex-col gap-[50px] px-[25px]">
                            <div className="flex flex-col gap-[30px] pt-[50px]">
                                <SingleInput
                                    label="이름"
                                    labelClassName="pl-[3px]"
                                    placeholder="이름을 입력해 주세요"
                                />

                                <SingleInput
                                    label="이메일"
                                    labelClassName="pl-[3px]"
                                    placeholder="가입 이메일을 입력해 주세요"
                                />
                            </div>

                            <Button
                                label="아이디 찾기"
                                className="max-w-none rounded-[10px]"
                                onClick={() => {}}
                            />
                        </form>
                    ) : (
                        <FindPwForm></FindPwForm>
                    )
                }
            </Tabs>
        
        </HeaderLayout> 
    )
}