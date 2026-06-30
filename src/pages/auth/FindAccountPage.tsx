import { useState } from "react";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { Tabs } from "../../components/Tabs";
import SingleInput from "../../components/common/SingleInput";

export const FindAccountPage = () => {

    const tabs = [
        { id: 'ID', label: '아이디 찾기' },
        { id: 'PW', label: '비밀번호 찾기' },
    ]
    
    // 현재 탭 상태 
    // todo 탭 상태에 따라 MainHeader title 변경
    const [activeId, setActiveId] = useState<string>('ID');

    // todo handle submit 함수 제작

    // activeId에따른 다른 form태그 감싸기 -> 함수 동작이 달라진다 (함수에 props로 받아서 다르게 처리)

    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                title="찾기" />
            }
        >
            <Tabs
                tabs={tabs}
                activeId={activeId}
                onChange={(id) => setActiveId(id as string)}
            >
                {
                    activeId === 'ID' ? (
                        <form>
                            <div className="flex flex-col gap-[30px]">
                                <SingleInput
                                    label="이름"
                                    placeholder="이름을 입력해 주세요"
                                />

                                <SingleInput
                                    label="이메일"
                                    placeholder="이메일을 입력해 주세요"
                                />
                            </div>
                        </form>
                    ) : (
                        <form>

                        </form>
                    )
                }
            </Tabs>
        
        </HeaderLayout> 
    )
}