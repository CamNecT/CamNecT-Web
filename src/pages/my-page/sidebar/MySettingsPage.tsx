import { useNavigate } from "react-router-dom";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { MainHeader } from "../../../layouts/headers/MainHeader";
import PopUp from "../../../components/Pop-up";
import defaultProfileImg from "../../../assets/image/defaultProfileImg.png"
import { useAuthStore } from "../../../store/useAuthStore";
import { getSettingInfo } from "../../../api/profileApi";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

export const MySettingsPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore(state => state.user);
    const userId = authUser?.id ? parseInt(authUser.id) : null;

    //데이터 조회
    const { data: SettingInfoResponse, isLoading: isSettingLoading, isError: isSettingError } = useQuery({
        queryKey: ["setting", userId],
        queryFn: () => getSettingInfo(userId!),
        enabled: !!userId,
    });

    const userSetting = SettingInfoResponse?.data;

    const menuItems = [
        { 
            id: 'account',
            label: '계정관리',
            icon: (
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.1875 10.9375V7.03125C17.1875 5.78805 16.6936 4.59576 15.8146 3.71669C14.9355 2.83761 13.7432 2.34375 12.5 2.34375C11.2568 2.34375 10.0645 2.83761 9.18544 3.71669C8.30636 4.59576 7.8125 5.78805 7.8125 7.03125V10.9375M7.03125 22.6562H17.9687C18.5904 22.6562 19.1865 22.4093 19.626 21.9698C20.0656 21.5302 20.3125 20.9341 20.3125 20.3125V13.2812C20.3125 12.6596 20.0656 12.0635 19.626 11.624C19.1865 11.1844 18.5904 10.9375 17.9687 10.9375H7.03125C6.40965 10.9375 5.81351 11.1844 5.37397 11.624C4.93443 12.0635 4.6875 12.6596 4.6875 13.2812V20.3125C4.6875 20.9341 4.93443 21.5302 5.37397 21.9698C5.81351 22.4093 6.40965 22.6562 7.03125 22.6562Z" stroke="#646464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            onClick: () => navigate('account')
        },
        {
            id: 'inquiry',
            label: '문의하기',
            icon: (
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.2906 7.83229C11.5104 6.76458 13.4896 6.76458 14.7094 7.83229C15.9302 8.9 15.9302 10.6312 14.7094 11.699C14.4979 11.8854 14.2615 12.0385 14.0115 12.1594C13.2354 12.5354 12.501 13.2 12.501 14.0625V14.8437M21.875 12.5C21.875 13.7311 21.6325 14.9502 21.1614 16.0877C20.6902 17.2251 19.9997 18.2586 19.1291 19.1291C18.2586 19.9997 17.2251 20.6902 16.0877 21.1614C14.9502 21.6325 13.7311 21.875 12.5 21.875C11.2689 21.875 10.0498 21.6325 8.91234 21.1614C7.77492 20.6902 6.74142 19.9997 5.87087 19.1291C5.00032 18.2586 4.30977 17.2251 3.83863 16.0877C3.36749 14.9502 3.125 13.7311 3.125 12.5C3.125 10.0136 4.11272 7.62903 5.87087 5.87087C7.62903 4.11272 10.0136 3.125 12.5 3.125C14.9864 3.125 17.371 4.11272 19.1291 5.87087C20.8873 7.62903 21.875 10.0136 21.875 12.5ZM12.5 17.9687H12.5083V17.9771H12.5V17.9687Z" stroke="#646464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            onClick: () => {
                const win = window.open(
                    'https://forms.gle/pS8UMuVxyCAYbMVB6',
                    '_blank',
                    'noopener,noreferrer'
                );
                if (win) win.opener = null;
            }
        },
        {
            id: 'terms',
            label: '약관 및 정책',
            icon: (
                <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.8465 2.45625C12.7021 1.9649 12.3947 1.53234 11.9711 1.22436C11.5476 0.916373 11.031 0.749812 10.5 0.75H7.25C6.13417 0.75 5.19167 1.47188 4.9035 2.45625M12.8465 2.45625C12.9061 2.65833 12.9375 2.87292 12.9375 3.09375C12.9375 3.30095 12.8519 3.49966 12.6995 3.64618C12.5472 3.79269 12.3405 3.875 12.125 3.875H5.625C5.40951 3.875 5.20285 3.79269 5.05048 3.64618C4.8981 3.49966 4.8125 3.30095 4.8125 3.09375C4.8125 2.87292 4.845 2.65833 4.9035 2.45625M12.8465 2.45625C13.5463 2.50729 14.2418 2.57083 14.9341 2.64792C16.1258 2.78125 17 3.76979 17 4.92396V18.7187C17 19.3404 16.7432 19.9365 16.2861 20.376C15.829 20.8156 15.209 21.0625 14.5625 21.0625H3.1875C2.54103 21.0625 1.92105 20.8156 1.46393 20.376C1.00681 19.9365 0.75 19.3404 0.75 18.7187V4.92396C0.75 3.76979 1.62317 2.78125 2.81592 2.64792C3.51037 2.5706 4.20637 2.5067 4.9035 2.45625" stroke="#646464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            onClick: () => navigate('terms')
        }
    ];

    if (isSettingLoading) {
        return (
        <PopUp
            type="loading"
            isOpen={true}
        />
        );
    }

    if (!userSetting || isSettingError) {
        return (
            <PopUp
                type="error"
                title="일시적 오류"
                content="잠시 후 다시 시도해주세요."
                isOpen={true}
                rightButtonText='확인'
                onClick={() => navigate(-1)}
            />
        );
    }

    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                    title="환경설정"
                    leftAction={{ onClick: () => navigate(-1) }}
                />
            }
        >
            <div className="w-full h-full bg-white">
                {/* Profile Section */}
                <div className="flex flex-col gap-[20px] px-[25px] py-[30px] border-b border-gray-150">
                    <div className="flex gap-[25px]">
                        <div className="min-w-[55px] w-[55px] h-[55px] rounded-full overflow-hidden">
                            <img 
                                src={userSetting.profileImageUrl ?? defaultProfileImg}
                                onError={(e) => {
                                    e.currentTarget.onerror = null; //이미지 깨짐 방지->S3에서 403
                                    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                }}
                                alt="프로필 사진" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <span className="text-sb-18 text-gray-900">{userSetting.name}</span>
                            <div className="flex gap-[15px]">
                                <div className="min-w-[56px] flex flex-col gap-[5px] text-m-16-hn text-gray-650">
                                    {/* <span>전화번호</span> */}
                                    <span>이메일</span>
                                </div>
                                <div className="w-full min-w-0 flex flex-col gap-[5px] text-m-16-hn text-gray-750 ">
                                    {/* <span>{userSetting.phoneNum}</span> */}
                                    <div className="w-full min-w-0 break-all whitespace-normal">{userSetting.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex flex-col">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className="w-full flex items-center gap-[12px] px-[25px] py-[20px]"
                        >
                            <div className="w-[25px] h-[25px] flex justify-center items-center block shrink-0">
                                {item.icon}
                            </div>
                            <span className="flex-1 text-left text-m-16-hn text-gray-750">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </HeaderLayout>
    );
};
