// 관리자 하단 네비게이션 바
import { useLocation, useNavigate } from "react-router-dom";
import type { IconName } from "../../components/Icon";
import { AdminBottomNavButton } from "./AdminBottomNavButton";

export interface AdminBottomNavProps {
    icon: IconName;
    activeIcon: IconName; // 클릭 시 아이콘
    label: string;
    path: string;
    hasBadge?: boolean;
}

const navList: AdminBottomNavProps[] = [
    {
        icon: "Navigation_approve_stroke",
        activeIcon: "Navigation_approve_fill",
        label: "인증서 요청 승인",
        path: "/admin/school-verification"
    },
    {
        icon: "Navigation_report_stroke",
        activeIcon: "Navigation_report_fill",
        label: "신고된 글",
        path: "/admin/reports"
    },
    {
        icon: "Navigation_activities_write_stroke",
        activeIcon: "Navigation_activities_write_fill",
        label: "대외활동 글쓰기",
        path: "/admin/post"
    },
    {
        icon: "Navigation_community_stroke",
        activeIcon: "Navigation_community_fill",
        label: "커뮤니티",
        path: "/admin/community"
    }
];


export const AdminBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation(); 

    const handleNavClick = (path: string) => {

        if (location.pathname === path) {
            window.scrollTo({top: 0, behavior: "smooth"}); // 제일 위로 스크롤
            return;
        }

        navigate(path);        
    }

    return (
        <nav 
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-150 z-[100]"
            style={{
                // env(safe-area) : 브라우저 화면 하단 여백 (브라우저의 하단 바가 가리는 영역)
                height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <ul className="flex justify-around items-center h-[56px]">
                {navList.map((nav) => {

                    // 현재 URL로 버튼 클릭여부 판단
                    const isActive = location.pathname === nav.path || location.pathname.startsWith(nav.path + '/');
                    
                    return (
                        <AdminBottomNavButton key={nav.icon} icon={nav.icon} activeIcon={nav.activeIcon} label={nav.label} path={nav.path} hasBadge={nav.hasBadge} isActive={isActive} handleNavClick={() => handleNavClick(nav.path)}     />
                    )
                })}
            </ul>
        </nav>
    );
}
