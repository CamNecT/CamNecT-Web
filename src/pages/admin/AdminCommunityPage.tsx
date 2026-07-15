import { AdminFullLayout } from "../../layouts/AdminFullLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import PopUp from "../../components/Pop-up";
import { CommunityPage } from "../community/CommunityPage";

export const AdminCommunityPage = () => {
    return (
        <AdminFullLayout
        >
            <CommunityPage isAdmin={true}/>
            {/* 로딩 팝업 */}
            {/* <PopUp 
                isOpen={isLoading} 
                type="loading" 
                title="데이터를 불러오는 중입니다..." 
            /> */}

            {/* 에러 팝업 (에러가 발생했고 + 아직 닫지 않았을 때만 노출) */}
            {/* <PopUp 
                isOpen={isError && !isErrorDismissed} 
                type="error" 
                title="오류 발생" 
                content="데이터를 불러오는 중 문제가 발생했습니다" 
                buttonText="닫기"
                onClick={() => setIsErrorDismissed(true)}
            /> */}
        </AdminFullLayout>
    );
}