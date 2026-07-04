import { useState } from "react";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { Tabs } from "../../components/Tabs";
import { FindIdForm } from "./components/FindIdForm";
import { FindPwForm } from "./components/FindPwForm";

const tabs = [
    { id: 'ID', label: '아이디 찾기' },
    { id: 'PW', label: '비밀번호 찾기' },
]

export const FindAccountPage = () => {
    
    // 현재 탭 상태 
    const [activeId, setActiveId] = useState<string>('ID');

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
                        <FindIdForm />
                    ) : (
                        <FindPwForm />
                    )
                }
            </Tabs>
        
        </HeaderLayout> 
    )
}