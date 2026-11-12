import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/Icon";
import PopUp from "../../../components/Pop-up";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { MainHeader } from "../../../layouts/headers/MainHeader";
import { getSettingInfo } from "../../../api/profileApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatPhoneNumber } from "../utils/phone";

type AccountMenuItem = {
    id: string;
    label: string;
    value?: string;
    disabled?: boolean;
    phoneUnverified?: boolean;
};

export const AccountSettingsPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const userId = authUser?.id ? Number(authUser.id) : null;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['setting', userId],
        queryFn: () => getSettingInfo(userId!),
        enabled: Boolean(userId),
    });

    const setting = data?.data;

    const menuItems: AccountMenuItem[] = [
        //{ id: 'id', label: '아이디 변경' },
        { id: 'password', label: '비밀번호 변경' },
        {
            id: 'phone',
            label: '전화번호 변경',
            value: setting?.phoneVerified ? formatPhoneNumber(setting.phoneNum) : undefined,
            phoneUnverified: setting ? !setting.phoneVerified : false,
        },
        { id: 'delete-account', label: '회원 탈퇴' }
    ];

    if (isLoading) return <PopUp type="loading" isOpen={true} />;

    if (isError || !setting) {
        return (
            <PopUp
                type="error"
                title="계정 정보를 불러오지 못했습니다"
                content="잠시 후 다시 시도해 주세요."
                isOpen={true}
                onClick={() => navigate(-1)}
            />
        );
    }

    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                    title="계정관리"
                    leftAction={{ onClick: () => navigate(-1) }}
                />
            }
        >
            <div className="w-full h-full bg-white">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => {
                            if (!item.disabled) navigate(item.id);
                        }}
                        className="w-full flex items-center justify-between gap-[12px] px-[25px] py-[20px]"
                    >
                        <span className={`shrink-0 text-m-16-hn ${item.id === 'delete-account' ? 'text-red' : 'text-gray-750'}`}>
                            {item.label}
                        </span>
                        <span className="flex min-w-0 items-center gap-[6px]">
                            {item.phoneUnverified ? (
                                <span className="flex min-w-0 items-center gap-[4px] text-r-12 text-red">
                                    <Icon name="error_circle_stroke" size={13} color="red" />
                                    <span className="truncate">등록이 완료되지 않았습니다</span>
                                </span>
                            ) : item.value ? (
                                <span className="truncate text-r-14 text-gray-400">{item.value}</span>
                            ) : null}
                            {!item.disabled && (
                                <Icon name="arrow_right" className="h-5 w-5 shrink-0 text-gray-400" />
                            )}
                        </span>
                    </button>
                ))}
            </div>
        </HeaderLayout>
    );
};
