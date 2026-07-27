import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { MainHeader } from "../../../layouts/headers/MainHeader";
import Button from "../../../components/Button";
import PopUp from "../../../components/Pop-up";
import { useAuthStore } from "../../../store/useAuthStore";
import { changePassword } from "../../../api/profileApi";
import axios from "axios";

// 비밀번호 정규식 패턴
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])[A-Za-z0-9!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]{8,16}$/;

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

export const EditPasswordPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((s) => s.user);
    const userId = authUser?.id ? parseInt(authUser.id) : null;
    
    // 현재 비밀번호
    const [currentPassword, setCurrentPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [currentPasswordError, setCurrentPasswordError] = useState('');

    // 새 비밀번호
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [newPasswordError, setNewPasswordError] = useState('');
    
    // 새 비밀번호 확인
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [confirm, setConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [unknownErrorOpen, setUnknownErrorOpen] = useState(false);

    // 새 비밀번호 검증
    const handleNewPasswordBlur = () => {
        if (!newPassword) {
            setNewPasswordError('');
            return;
        }

        if (!PASSWORD_PATTERN.test(newPassword)) {
            setNewPasswordError('비밀번호는 8~16자, 숫자 1개 이상, 소문자 1개 이상, 공백 없이 영문/숫자/특수문자만 사용 가능합니다');
        } else {
            setNewPasswordError('');
        }

        // 확인 비밀번호 일치 검사
        if (confirmPassword) {
            if (newPassword !== confirmPassword) {
                setConfirmPasswordError('비밀번호가 일치하지 않습니다');
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPassword(value);
        setNewPasswordError('');
        
        // 확인 비밀번호가 있으면 실시간 일치 검사
        if (confirmPassword && value !== confirmPassword) {
            setConfirmPasswordError('비밀번호가 일치하지 않습니다');
        } else if (confirmPassword && value === confirmPassword) {
            setConfirmPasswordError('');
        }
    };

    const handleConfirmPasswordBlur = () => {
        if (!confirmPassword) {
            setConfirmPasswordError('');
            return;
        }

        if (newPassword !== confirmPassword) {
            setConfirmPasswordError('비밀번호가 일치하지 않습니다');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        
        if (newPassword && value !== newPassword) {
            setConfirmPasswordError('비밀번호가 일치하지 않습니다');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
        setCurrentPasswordError("");
    };

    const isValid = !!currentPassword &&
                   PASSWORD_PATTERN.test(newPassword) &&
                   !!confirmPassword &&
                   newPassword === confirmPassword &&
                   !newPasswordError &&
                   !confirmPasswordError;

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!userId) {
            setUnknownErrorOpen(true);
            return;
        }
        if (!currentPassword) {
            setCurrentPasswordError("현재 비밀번호를 입력해주세요.");
            return;
        }
        if (!PASSWORD_PATTERN.test(newPassword)) {
            setNewPasswordError("비밀번호는 8~16자, 숫자 1개 이상, 소문자 1개 이상, 공백 없이 영문/숫자/특수문자만 사용 가능합니다");
            return;
        }
        if (newPassword !== confirmPassword) {
            setConfirmPasswordError("비밀번호가 일치하지 않습니다");
            return;
        }

        setIsSubmitting(true);
        try {
            await changePassword(userId, {
                currentPassword,
                newPassword,
            });
            setConfirm(true);
        } catch (e) {
        if (axios.isAxiosError(e)) {
            const status = e.response?.status;
            const data = e.response?.data as Record<string, unknown> | undefined;
            const code =
            typeof data?.code === "number"
                ? data.code
                : typeof data?.statusCode === "number"
                    ? data.statusCode
                    : undefined;

            if (status === 401 || code === 41101) {
                setCurrentPasswordError("현재 비밀번호와 일치하지 않습니다.");
                return;
            }

            setUnknownErrorOpen(true);
            return;
        }

        setUnknownErrorOpen(true);
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <>
            <HeaderLayout
                headerSlot={
                    <MainHeader
                        title="비밀번호 수정"
                        leftAction={{ onClick: () => navigate(-1) }}
                    />
                }
            >
                <div className="w-full h-full bg-white flex flex-col px-[25px] pt-[30px] pb-[20px] justify-between flex-1">
                    <div className="flex-1 flex flex-col gap-[25px]">

                        {/* 현재 비밀번호 확인 */}
                        <div className="flex flex-col gap-[8px]">
                            <span className="text-m-14-hn text-gray-900">
                                현재 비밀번호 확인
                            </span>
                            <div className="relative flex flex-col gap-[8px]">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={handleCurrentPasswordChange}
                                    maxLength={16}
                                    className={`w-full p-[15px] rounded-[5px] border bg-gray-100 ${
                                        currentPasswordError ? "border-red" : "border-gray-150"
                                    } text-sb-16-hn text-gray-750 focus:outline-none ${
                                        currentPasswordError ? "focus:border-red" : "focus:border-primary"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-[16px] top-1/2 -translate-y-1/2"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOpenIcon/>
                                    ) : (
                                        <EyeClosedIcon/>
                                    )}
                                </button>
                            </div>
                            {currentPasswordError && (
                                <span className="text-r-12-hn text-red">
                                    {currentPasswordError}
                                </span>
                            )}
                        </div>

                        {/* 비밀번호 그룹: 라벨 하나에 인풋 두 개 */}
                        <div className="flex flex-col gap-[12px]">
                            {/* 변경 할 비밀번호 */}
                            <div className="flex flex-col gap-[8px]">
                                <span className="text-m-14-hn text-gray-900">
                                    변경 할 비밀번호
                                </span>
                                <div className="relative flex flex-col gap-[8px]">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={handleNewPasswordChange}
                                        onBlur={handleNewPasswordBlur}
                                        maxLength={16}
                                        className={`w-full p-[15px] rounded-[5px] border bg-gray-100 ${
                                            newPasswordError ? 'border-red' : 'border-gray-150'
                                        } text-sb-16-hn text-gray-750 focus:outline-none focus:border-primary disabled:bg-gray-100`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-[16px] top-1/2 -translate-y-1/2"
                                    >
                                        {showNewPassword ? (
                                            <EyeOpenIcon/>
                                        ) : (
                                            <EyeClosedIcon/>
                                        )}
                                    </button>
                                </div>
                                {newPasswordError && (
                                    <span className="text-r-12-hn text-red">
                                        {newPasswordError}
                                    </span>
                                )}
                                {!newPasswordError && newPassword && (
                                    <span className="text-r-12-hn text-gray-650">
                                        비밀번호는 8~16자, 숫자 1개 이상, 소문자 1개 이상, 공백 없이 영문/숫자/특수문자만 사용 가능합니다
                                    </span>
                                )}
                            </div>

                            {/* 비밀번호 재확인 */}
                            <div className="flex flex-col gap-[8px]">
                                <span className="text-m-14-hn text-gray-900">
                                    변경 할 비밀번호 확인
                                </span>
                                <div className="relative flex flex-col gap-[8px]">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        onBlur={handleConfirmPasswordBlur}
                                        maxLength={16}
                                        className={`w-full p-[15px] rounded-[5px] border bg-gray-100 ${
                                            confirmPasswordError ? 'border-red' : 'border-gray-150'
                                        } text-sb-16-hn text-gray-750 focus:outline-none focus:border-primary disabled:bg-gray-100`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-[16px] top-1/2 -translate-y-1/2"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOpenIcon/>
                                        ) : (
                                            <EyeClosedIcon/>
                                        )}
                                    </button>
                                </div>
                                {confirmPasswordError && (
                                    <span className="text-r-12-hn text-red">
                                        {confirmPasswordError}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        label={isSubmitting ? "변경 중..." : "비밀번호 변경하기"}
                        font="sb-16-hn"
                        className="w-full h-auto max-w-none py-[12px] rounded-full transition-colors"
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                    />
                </div>
            </HeaderLayout>
            <PopUp
                isOpen={confirm}
                type="confirm"
                title="비밀번호가 변경되었습니다!"
                buttonText="확인"
                onClick={() => {
                    setConfirm(false);
                    navigate(-1);
                }}
            />
            <PopUp
                isOpen={unknownErrorOpen}
                type="error"
                title="비밀번경 실패"
                titleSecondary="잠시 후 다시 시도해주세요"
                buttonText="확인"
                onClick={() => setUnknownErrorOpen(false)}
            />
        </>
    );
};