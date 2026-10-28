import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../../../api/auth";
import PopUp from "../../../components/Pop-up";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { MainHeader } from "../../../layouts/headers/MainHeader";
import { useAuthStore } from "../../../store/useAuthStore";
import { clearClientSession } from "../../../utils/clearClientSession";

const EyeClosedIcon = () => {
    return (
        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.78269 5.973C1.85323 7.07718 1.16112 8.3632 0.75 9.75C2.03359 14.088 6.02545 17.25 10.7505 17.25C11.737 17.25 12.6908 17.112 13.5949 16.855M5.01606 3.978C6.71756 2.84786 8.71193 2.24688 10.7505 2.25C15.4755 2.25 19.4664 5.412 20.75 9.748C20.0466 12.1173 18.5365 14.1616 16.4849 15.522M5.01606 3.978L1.80906 0.75M5.01606 3.978L8.64231 7.628M16.4849 15.522L19.6919 18.75M16.4849 15.522L12.8587 11.872C13.1355 11.5934 13.355 11.2627 13.5048 10.8986C13.6546 10.5346 13.7317 10.1445 13.7317 9.7505C13.7317 9.3565 13.6546 8.96636 13.5048 8.60235C13.355 8.23834 13.1355 7.9076 12.8587 7.629C12.5819 7.3504 12.2533 7.1294 11.8917 6.97863C11.53 6.82785 11.1424 6.75025 10.751 6.75025C10.3596 6.75025 9.97196 6.82785 9.61032 6.97863C9.24868 7.1294 8.92008 7.3504 8.6433 7.629M12.8577 11.871L8.64429 7.63" stroke="#A1A1A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

const EyeOpenIcon = () => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#A1A1A1"/>
        </svg>
    )
}

export const DeleteAccountPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((s) => s.user);
    const userId = authUser?.id ? parseInt(authUser.id) : null;

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmPopUpOpen, setConfirmPopUpOpen] = useState(false);
    const [unknownErrorOpen, setUnknownErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setPasswordError("");
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!userId) {
            setUnknownErrorOpen(true);
            return;
        }

        if (!password) {
            setPasswordError("비밀번호를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            await deleteAccount({ userId, password });
            setConfirmPopUpOpen(true);
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const status = e.response?.status;
                const data = e.response?.data as { message?: string };
                
                if (status === 400) {
                    setPasswordError("비밀번호가 일치하지 않습니다.");
                    return;
                }

                if (status === 401) {
                    setErrorMessage("사용자 인증에 실패하였습니다.");
                    setUnknownErrorOpen(true);
                    return;
                }
                
                setErrorMessage(data?.message || "잠시 후 다시 시도해주세요");
                setUnknownErrorOpen(true);
            } else {
                setErrorMessage("잠시 후 다시 시도해주세요");
                setUnknownErrorOpen(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalDelete = () => {
        clearClientSession();
        navigate("/", { replace: true });
    };

    return (
        <>
            <HeaderLayout
                headerSlot={
                    <MainHeader
                        title="회원 탈퇴"
                        leftAction={{ onClick: () => navigate(-1) }}
                    />
                }
            >
                <div className="w-full h-full bg-white flex flex-col px-[25px] pt-[30px] pb-[40px] justify-between flex-1">
                    <div className="flex-1 flex flex-col gap-[30px]">
                        <div className="flex flex-col gap-[10px]">
                            <h2 className="text-b-20 text-gray-900">정말 탈퇴하시겠습니까?</h2>
                            <p className="text-r-14 text-gray-600 leading-[1.5]">
                                탈퇴 시 모든 활동 내역 및 데이터가 삭제되며,<br />
                                삭제된 데이터는 복구할 수 없습니다.
                            </p>
                        </div>

                        {/* 비밀번호 확인 */}
                        <div className="flex flex-col gap-[8px]">
                            <span className="text-m-14-hn text-gray-900">
                                비밀번호 확인
                            </span>
                            <div className="relative flex flex-col gap-[8px]">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className={`w-full p-[15px] rounded-[5px] border bg-gray-100 ${
                                        passwordError ? "border-red" : "border-gray-150"
                                    } text-sb-16-hn text-gray-750 focus:outline-none ${
                                        passwordError ? "focus:border-red" : "focus:border-primary"
                                    }`}
                                    placeholder="현재 비밀번호를 입력해주세요"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-[16px] top-1/2 -translate-y-1/2"
                                >
                                    {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                </button>
                            </div>
                            {passwordError && (
                                <span className="text-r-12-hn text-red">
                                    {passwordError}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!password || isSubmitting}
                        className="w-full py-[12px] rounded-full bg-red disabled:bg-gray-300 flex items-center justify-center transition-colors mb-[20px]"
                    >
                        <span className="text-sb-16-hn text-white">
                            {isSubmitting ? "처리 중..." : "회원 탈퇴하기"}
                        </span>
                    </button>
                </div>
            </HeaderLayout>

            <PopUp
                isOpen={confirmPopUpOpen}
                type="confirm"
                title="탈퇴가 완료되었습니다"
                content="그동안 서비스를 이용해주셔서 감사합니다."
                buttonText="확인"
                onClick={handleFinalDelete}
            />

            <PopUp
                isOpen={unknownErrorOpen}
                type="error"
                title="탈퇴 처리 중 오류가 발생했습니다"
                content={errorMessage}
                buttonText="확인"
                onClick={() => setUnknownErrorOpen(false)}
            />
        </>
    );
};
