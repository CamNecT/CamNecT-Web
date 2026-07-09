import { useParams, useNavigate } from "react-router-dom";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { Tabs } from "../../components/Tabs";
import { FindIdForm } from "./components/FindIdForm";
import { FindPwForm } from "./components/FindPwForm";

const tabs = [
    { id: 'id', label: '아이디 찾기' },
    { id: 'password', label: '비밀번호 찾기' },
]

export const FindAccountPage = () => {

    const { tab } = useParams();
    const navigate = useNavigate();

    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                    title={tab === 'id' ? '아이디 찾기' : '비밀번호 찾기'}
                    headerPaddingTop={68}
                />
            }
        >
            <Tabs
                tabs={tabs}
                activeId={tab ?? 'id'} // ?? : nullish 병합 연산자 -> 왼쪽이 null || undefined 이면 오른쪽값 사용
                onChange={(id) => navigate(`/find-account/${id}`)}
            >
                {tab === 'id' ? <FindIdForm /> : <FindPwForm />}
            </Tabs>

        </HeaderLayout>
    )
}