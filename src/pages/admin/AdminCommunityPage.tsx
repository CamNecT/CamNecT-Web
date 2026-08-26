import { AdminFullLayout } from "../../layouts/AdminFullLayout";
import { CommunityPage } from "../community/CommunityPage";

export const AdminCommunityPage = () => {
    return (
        <AdminFullLayout>
            <CommunityPage isAdmin={true}/>
        </AdminFullLayout>
    );
}