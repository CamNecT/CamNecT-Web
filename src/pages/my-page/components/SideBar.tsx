import { useState } from "react";
import { IoMdPhonePortrait } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../api/profileApi";
import PopUp from "../../../components/Pop-up";
import { usePwaInstall } from "../../../hooks/usePwaInstall";
import { useAuthStore } from "../../../store/useAuthStore";
import { clearClientSession } from "../../../utils/clearClientSession";

type SideBarUser = {
  uid: string;
  name: string;
  univ: string;
  major: string;
  gradeNumber: string;
  point: number | null;
};

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
    user: SideBarUser;
}

export const SideBar = ({ isOpen, onClose, user }: SideBarProps) => {
    const navigate = useNavigate();
    const userId = useAuthStore((s) => s.user?.id);
    const { isInstallable, install } = usePwaInstall();
    
    const [isInstallPopupOpen, setIsInstallPopupOpen] = useState(false);

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleInstallClick = async () => {
        if (isInstallable) {
            await install();
        } else {
            setIsInstallPopupOpen(true);
        }
    };

    const handleLogout = async () => {
        try {
            const loginUserId = Number(userId);
            if (!Number.isFinite(loginUserId)) throw new Error("Invalid userId");

            await logout(loginUserId);
        } catch (e) {
            // 401이어도 일단 로그아웃 처리
            console.warn("logout failed:", e);
        } finally {
            clearClientSession();
            onClose();
            navigate("/login");
        }
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className='h-full fixed inset-0 z-50 flex items-end justify-center'
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed top-0 left-0 h-full w-5/6 bg-white z-120 shadow-lg">
                <div className="h-full flex flex-col px-[25px] pt-[68px]" style={{ paddingBottom: 'calc(30px + env(safe-area-inset-bottom, 0px))' }}>
                    {/* Header Section */}
                    <div className="flex flex-col gap-[20px] pb-[15px] border-b-[2px] border-gray-150">
                        <div className="flex flex-col gap-[3px]">
                            <div className="text-r-14 text-gray-650 break-keep">
                                {user.univ} {user.major} {user.gradeNumber}학번
                            </div>
                            <div className="text-sb-20 text-gray-900">
                                {user.name} 님
                            </div>
                        </div>
                        <div className="flex items-center gap-[7px]">
                            <span className="text-m-16-hn text-gray-650">보유 포인트 : </span>
                            <span className="text-sb-16-hn text-primary">{(user.point ?? 0).toLocaleString()} P</span>
                        </div>
                    </div>

                    {/* Menu Section */}
                    <div className="flex flex-col justify-between flex-1 pt-[40px] items-start">
                        <div className="flex flex-col gap-[30px]">
                            {/* 나의 활동 */}
                            <div className="flex flex-col gap-[15px] justify-center">
                                <div className="text-sb-16-hn text-gray-900">
                                    나의 활동
                                </div>
                                <div className="flex flex-col justify-center items-start">
                                    <button
                                        onClick={() => handleNavigation("posts")}
                                        className="inline-flex items-center gap-[15px] p-[10px]"
                                    >
                                        <svg viewBox="0 0 20 20" fill="none" className="w-[20px] h-[20px] block shrink-0">
                                            <path 
                                                d="M16.25 11.875V9.6875C16.25 8.94158 15.9537 8.22621 15.4262 7.69876C14.8988 7.17132 14.1834 6.875 13.4375 6.875H12.1875C11.9389 6.875 11.7004 6.77623 11.5246 6.60041C11.3488 6.4246 11.25 6.18614 11.25 5.9375V4.6875C11.25 3.94158 10.9537 3.22621 10.4262 2.69876C9.89879 2.17132 9.18342 1.875 8.4375 1.875H6.875M8.75 1.875H4.6875C4.17 1.875 3.75 2.295 3.75 2.8125V17.1875C3.75 17.705 4.17 18.125 4.6875 18.125H15.3125C15.83 18.125 16.25 17.705 16.25 17.1875V9.375C16.25 7.38588 15.4598 5.47822 14.0533 4.0717C12.6468 2.66518 10.7391 1.875 8.75 1.875Z" 
                                                stroke="#646464" 
                                                strokeWidth="1.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span className="text-r-16-hn text-gray-750">작성한 글</span>
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("bookmarks")}
                                        className="inline-flex items-center gap-[15px] p-[10px]"
                                    >
                                        <svg viewBox="0 0 20 20" fill="none" className="w-[20px] h-[20px] block shrink-0">
                                            <path 
                                                d="M14.6608 2.76838C15.5775 2.87505 16.25 3.66588 16.25 4.58922V17.5L10 14.375L3.75 17.5V4.58922C3.75 3.66588 4.42167 2.87505 5.33917 2.76838C8.43599 2.40891 11.564 2.40891 14.6608 2.76838Z" 
                                                stroke="#646464" 
                                                strokeWidth="1.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span className="text-r-16-hn text-gray-750">북마크</span>
                                    </button>
                                </div>
                            </div>

                            {/* 설정 */}
                            <div className="flex flex-col gap-[15px] justify-center">
                                <div className="text-sb-16-hn text-gray-900">
                                    설정
                                </div>
                                <div className="flex flex-col justify-center items-start">
                                    <button
                                        onClick={() => handleNavigation("settings")}
                                        className="inline-flex items-center gap-[15px] p-[10px]"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none"  className="w-[20px] h-[20px] block shrink-0">
                                            <path 
                                                d="M9.59401 3.94C9.68401 3.398 10.154 3 10.704 3H13.297C13.847 3 14.317 3.398 14.407 3.94L14.62 5.221C14.683 5.595 14.933 5.907 15.265 6.091C15.339 6.131 15.412 6.174 15.485 6.218C15.81 6.414 16.205 6.475 16.56 6.342L17.777 5.886C18.0264 5.79221 18.301 5.78998 18.5519 5.87971C18.8028 5.96945 19.0137 6.14531 19.147 6.376L20.443 8.623C20.5761 8.8537 20.623 9.12413 20.5754 9.38617C20.5277 9.6482 20.3887 9.88485 20.183 10.054L19.18 10.881C18.887 11.122 18.742 11.494 18.75 11.873C18.7514 11.958 18.7514 12.043 18.75 12.128C18.742 12.506 18.887 12.878 19.18 13.119L20.184 13.946C20.608 14.296 20.718 14.901 20.444 15.376L19.146 17.623C19.0129 17.8536 18.8022 18.0296 18.5515 18.1195C18.3008 18.2094 18.0264 18.2074 17.777 18.114L16.56 17.658C16.205 17.525 15.81 17.586 15.484 17.782C15.4115 17.8261 15.3382 17.8688 15.264 17.91C14.933 18.093 14.683 18.405 14.62 18.779L14.407 20.06C14.317 20.603 13.847 21 13.297 21H10.703C10.153 21 9.68401 20.602 9.59301 20.06L9.38001 18.779C9.31801 18.405 9.06801 18.093 8.73601 17.909C8.66186 17.8681 8.58851 17.8258 8.51601 17.782C8.19101 17.586 7.79601 17.525 7.44001 17.658L6.22301 18.114C5.97374 18.2075 5.69937 18.2096 5.44871 18.1199C5.19804 18.0302 4.98732 17.8545 4.85401 17.624L3.55701 15.377C3.42395 15.1463 3.37705 14.8759 3.42466 14.6138C3.47227 14.3518 3.6113 14.1152 3.81701 13.946L4.82101 13.119C5.11301 12.879 5.25801 12.506 5.25101 12.128C5.24944 12.043 5.24944 11.958 5.25101 11.873C5.25801 11.493 5.11301 11.122 4.82101 10.881L3.81701 10.054C3.61155 9.88489 3.47268 9.64843 3.42508 9.38662C3.37748 9.12481 3.42422 8.8546 3.55701 8.624L4.85401 6.377C4.98719 6.14614 5.19802 5.97006 5.44892 5.88014C5.69982 5.79021 5.9745 5.79229 6.22401 5.886L7.44001 6.342C7.79601 6.475 8.19101 6.414 8.51601 6.218C8.58801 6.174 8.66201 6.132 8.73601 6.09C9.06801 5.907 9.31801 5.595 9.38001 5.221L9.59401 3.94Z" 
                                                stroke="#646464" 
                                                strokeWidth="1.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                            <path 
                                                d="M15 12C15 12.7956 14.6839 13.5587 14.1213 14.1213C13.5587 14.6839 12.7956 15 12 15C11.2044 15 10.4413 14.6839 9.87868 14.1213C9.31607 13.5587 9 12.7956 9 12C9 11.2044 9.31607 10.4413 9.87868 9.87868C10.4413 9.31607 11.2044 9 12 9C12.7956 9 13.5587 9.31607 14.1213 9.87868C14.6839 10.4413 15 11.2044 15 12Z" 
                                                stroke="#646464" 
                                                strokeWidth="1.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span className="text-r-16-hn text-gray-750">환경 설정</span>
                                    </button>
                                    <button
                                        onClick={handleInstallClick}
                                        className="inline-flex items-center gap-[15px] p-[10px]"
                                    >
                                        <IoMdPhonePortrait className="w-[20px] h-[20px] text-gray-750" />
                                        <span className="text-r-16-hn text-gray-750">앱 설치</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleLogout()} className="p-[10px] text-r-16-hn text-red">로그아웃</button>
                    </div>
                </div>
            </div>

            <PopUp
                isOpen={isInstallPopupOpen}
                type="confirm"
                title="알림"
                content="이미 설치되어 있거나,\n설치를 지원하지 않는 브라우저입니다.\n(iOS는 Safari '홈 화면에 추가'를 이용해주세요)"
                buttonText="확인"
                onClick={() => setIsInstallPopupOpen(false)}
            />
        </>
    );
};