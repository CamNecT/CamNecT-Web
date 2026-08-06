import Icon from "../../components/Icon";
import type { BottomNavProps } from "./BottomNav";
import { useUnreadCountQuery } from "../../hooks/useChatQuery";
import PressableMotion from "../../components/PressableMotion";

interface BottomNavButtonProps extends BottomNavProps {
    isActive: boolean;
    handleNavClick: () => void;
}

export const BottomNavButton = ({ icon, activeIcon, label, isActive, handleNavClick }: BottomNavButtonProps) => {
    const { data: totalUnreadCount = 0 } = useUnreadCountQuery();

    // 커피챗 탭이고 안 읽은 메시지가 있을 때 배지 표시
    const showBadge = label === "커피챗" && totalUnreadCount > 0;

    return (
        <li className="max-w-[74px] w-full h-full flex justify-center">
            <PressableMotion
                as="button"
                intensity="soft"
                type="button"
                className="flex w-[74px] flex-col items-center justify-center gap-1.5 relative cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label={label}
                onClick={handleNavClick}
            >
                <span className="relative w-6 h-6" aria-hidden="true">
                    <Icon name={isActive ? activeIcon : icon} size={24} className="absolute inset-0" />
                    {showBadge && (
                        <div className="absolute -top-[2px] -right-[4px] min-w-[12px] h-[12px] rounded-full bg-red flex items-center justify-center px-[4px]">
                            <span className="text-[9px] font-bold text-white leading-none">
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                            </span>
                        </div>
                    )}
                </span>
                <span className={`relative w-fit font-medium text-[10px] tracking-[-0.40px] leading-[normal] whitespace-nowrap ${isActive ? "text-primary" : "text-gray-650"}`}>
                    {label}
                </span>
            </PressableMotion>
        </li>
    );
}
