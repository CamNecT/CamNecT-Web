// 하단 네비게이션 바
import { useLocation, useNavigate } from "react-router-dom";
import type { IconName } from "../../components/Icon";
import { BottomNavButton } from "./BottomNavButton";
export interface BottomNavProps {
    icon: IconName;
    activeIcon: IconName; // 클릭 시 아이콘 
    label: string;
    path: string;
    hasBadge?: boolean;
}

const navList: BottomNavProps[] = [
    {
        icon: "Navigation_home_stroke",
        activeIcon: "Navigation_home_fill",
        label: "홈",
        path: "/home"
    },
    {
        icon: "Navigation_Alumni_search_stroke",
        activeIcon: "Navigation_Alumni_search_fill",
        label: "동문 찾기",
        path: "/alumni"
    },
    {
        icon: "Navigation_coffee_chat_stroke",
        activeIcon: "Navigation_coffee_chat_fill",
        label: "커피챗",
        path: "/chat",
        hasBadge: true
    },
    {
        icon: "Navigation_activities_stroke",
        activeIcon: "Navigation_activities_fill",
        label: "대외활동",
        path: "/activity"
    },
    {
        icon: "Navigation_mypage_stroke",
        activeIcon: "Navigation_mypage_fill",
        label: "마이 페이지",
        path: "/me"
    }
];


export const BottomNav = () => {
    const navigate = useNavigate();
    // 현재 URL 정보 hook (ex. /chat)
    // 주소가 바뀌면 재 렌더링
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
            <ul className="flex justify-between items-center h-[56px]">
                {navList.map((nav) => {

                    // 현재 URL로 버튼 클릭여부 판단
                    // "/homexxx" 주소는 false, "/home/xxx" 주소는 true
                    const isActive = location.pathname === nav.path || location.pathname.startsWith(nav.path + '/');
                    
                    return (
                        <BottomNavButton key={nav.icon} icon={nav.icon} activeIcon={nav.activeIcon} label={nav.label} path={nav.path} hasBadge={nav.hasBadge} isActive={isActive} handleNavClick={() => handleNavClick(nav.path)}     />
                    )
                })}
            </ul>
        </nav>
    );
}