import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { findPasswordEmailReqeust, findPasswordResetReqeust, findPasswordEmailVerifyRequest } from "../../../api/auth";
import Button from "../../../components/Button";
import SingleInput from "../../../components/common/SingleInput";
import Icon from "../../../components/Icon";
import PopUp from "../../../components/Pop-up";
import type { PopUpType } from "../../../components/Pop-up";
import {
    AUTH_ERROR_CODES,
    FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES,
    PASSWORD_RESET_ERROR_MESSAGES,
    PASSWORD_RESET_POPUP_MESSAGES,
    PASSWORD_RESET_VERIFY_ATTEMPT_ERROR_MESSAGES,
    PASSWORD_RESET_VERIFY_ERROR_MESSAGES,
    PASSWORD_RESET_VERIFY_POPUP_MESSAGES,
} from "../../../constants/serverErrors/authErrors";
import { getServerErrorCode } from "../../../utils/getServerErrorCode";

interface FindPwFormProps {
    isPasswordResetStep: boolean;
    onCodeVerified: () => void;
}

const emailSchema = z.object({
    // 1. Id
    username: z
        .string()
        .min(1, "아이디를 입력해 주세요")
        .regex(/^[a-z0-9]+$/, "아이디는 영문 소문자와 숫자만 입력 가능합니다"),
    
    // 2. 이메일 
    email: z
        .string()
        .min(1, "이메일을 입력해주세요")
        .regex(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "이메일 형식이 올바르지 않습니다"
    ),
    
    // 3. 인증번호
    verificationCode: z.string().length(6, "인증번호 6자리를 입력해 주세요")
});

const emailSendSchema = emailSchema.pick({
    username: true,
    email: true
});

const passwordPattern = /^(?=.*\d)(?=.*[a-z])[A-Za-z0-9!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]{8,16}$/;

const passwordSchema = z.object({
    // 1. 비밀번호
    password: z
        .string()
        .regex(
            passwordPattern,
            "비밀번호는 8~16자, 숫자 1개 이상, 소문자 1개 이상, 공백 없이 영문/숫자/특수문자만 사용 가능합니다"
    ),
    // 2. 비밀번호 확인
    confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, { // 1,2번 필드 비교
        message: "비밀번호가 일치하지 않습니다",
        path: ["confirmPassword"],
    });

type EmailFormData = z.infer<typeof emailSchema>;

type PasswordFormData = z.infer<typeof passwordSchema>;

const MAX_CODE_ATTEMPTS = 5; // 최대 인증번호 시도 횟수 

export const FindPwForm = ({isPasswordResetStep, onCodeVerified}: FindPwFormProps) => {

    const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
    const [isCodeVerified, setIsCodeVerified] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [popUpConfig, setPopUpConfig] = useState<{ type: PopUpType, title: ReactNode; content: ReactNode } | null>(null);
    // todo 인증번호 시도횟수 초과에 따른 추후 규칙 필요 (ex 2차 인증 진행... etc)
    const [codeAttemptsCount, setCodeAttemptsCount] = useState<number>(0); 


    const navigate = useNavigate();

    // RHF
    const { register: registerEmail, control: controlEmail,
            setError: setErrorEmail, clearErrors: clearErrorsEmail,
            resetField: resetEmailField,
            getValues: getEmailValues, 
            formState: { errors: errorsEmail } } = useForm<EmailFormData>({
        
        resolver: zodResolver(emailSchema),
        mode: "onChange",
        defaultValues: {
            username: "",
            email: "",
            verificationCode: "" // 최대 5회까지만 입력 가능
        }
    });

    // useWatch : username, email 값을 실시간으로 감시
    const [usernameValue, emailValue] = useWatch({
        control: controlEmail,
        name: ["username", "email"] // 감시할 필드명
    });
    
    // username, email의 zod 조건 통과여부
    const isEmailSendValid = emailSendSchema.safeParse({
        username: usernameValue,
        email: emailValue
    }).success;

    const { register: registerPw, handleSubmit: handleSubmitPw,
            setError: setErrorPw, clearErrors: clearErrorsPw,
            formState: { errors: errorsPw, isValid: isValidPw } } = useForm<PasswordFormData>({
        
        resolver: zodResolver(passwordSchema),
        mode: "onChange",
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    // ---- useMutation ----
    // 이메일 인증 발송 
    const sendCodeMutation = useMutation({
        mutationFn: findPasswordEmailReqeust,
        onSuccess: () => {
            setIsCodeSent(true);
            setIsCodeVerified(false);
            setCodeAttemptsCount(0);
            resetEmailField("verificationCode");
            clearErrorsEmail("verificationCode");
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            const errorCode = getServerErrorCode(error);
            const errorData = error.response?.data as { invalidProperties?: string[] };
            const invalidProperties = errorData?.invalidProperties ?? []; 

            if (status === 400) {
                const hasUsernameError = invalidProperties.includes("username");
                const hasEmailError = invalidProperties.includes("email");

                if (hasUsernameError) {
                    setErrorEmail("username", {
                        type: "server",
                        message: FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES.username,
                    });
                }
                
                if (hasEmailError) {
                    setErrorEmail("email", {
                        type: "server",
                        message: FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES.email,
                    });
                }
            }

            if (status === 403) { 
                // 41301: 이메일 미인증
                if (errorCode === AUTH_ERROR_CODES.common.emailUnverified) {
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES.emailUnverified,
                    });
                    return;
                }

                // 41302: 정지된 사용자
                if (errorCode === AUTH_ERROR_CODES.common.accountRestricted) {
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES.accountRestricted,
                    });
                    return;
                }

                setErrorEmail("verificationCode", {
                    type: "server",
                    message: FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES.accountStatusUnavailable,
                });
            }
        }
    });

    // 이메일 인증 확인 
    const verifyCodeMutation = useMutation({
        mutationFn: findPasswordEmailVerifyRequest,
        onSuccess: () => {
            setIsCodeVerified(true);
            setCodeAttemptsCount(0);
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            const errorCode = getServerErrorCode(error);

            if (status === 400) {
                // 40000: 이메일 또는 인증번호 형식 오류
                if (errorCode === AUTH_ERROR_CODES.common.invalidRequest) {
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.verificationCodeFormat,
                    });
                    return;
                }

                // 42030: 활성화된 인증번호 없음
                if (errorCode === AUTH_ERROR_CODES.passwordResetVerify.verificationCodeUnavailable) {
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.verificationCodeUnavailable,
                    });
                    return;
                }

                // 42031: 만료되었거나 이미 사용된 인증번호
                if (errorCode === AUTH_ERROR_CODES.passwordResetVerify.verificationCodeExpiredOrUsed) {
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.verificationCodeExpiredOrUsed,
                    });
                    return;
                }

                // 42032: 인증번호 불일치
                if (errorCode === AUTH_ERROR_CODES.passwordResetVerify.verificationCodeMismatch) {
                    setCodeAttemptsCount((prev) => Math.min(prev + 1, MAX_CODE_ATTEMPTS));
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.code,
                    });
                    return;
                }

                setErrorEmail("verificationCode", {
                    type: "server",
                    message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.verificationCodeFormat,
                });

                return;
            }

            if (status === 403) {
                // 41301: 이메일 미인증
                if (errorCode === AUTH_ERROR_CODES.common.emailUnverified) {
                    setErrorEmail("email", {
                        type: "server",
                        message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.emailUnverified,
                    });
                    return;
                }

                // 41302: 정지된 사용자
                if (errorCode === AUTH_ERROR_CODES.common.accountRestricted) {

                    setErrorEmail("email", {
                        type: "server",
                        message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.accountRestricted,
                    });

                    return;
                }
            }

            // 41401: 사용자를 찾을 수 없음
            if (status === 404 && errorCode === AUTH_ERROR_CODES.common.userNotFound) {
                setErrorEmail("email", {
                    type: "server",
                    message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.userNotFound,
                });
                return;
            }

            // 42920: 인증번호 시도 횟수 초과
            if (status === 429) {
                setCodeAttemptsCount(MAX_CODE_ATTEMPTS);
                setErrorEmail("verificationCode", {
                    type: "server",
                    message: PASSWORD_RESET_VERIFY_ERROR_MESSAGES.verificationCodeAttemptsExceeded,
                });

                return;
            }

            // 50000: resetToken 발급 또는 내부 오류
            if (status === 500) {
                setPopUpConfig({
                    type: "error",
                    title: PASSWORD_RESET_VERIFY_POPUP_MESSAGES.internal.title,
                    content: PASSWORD_RESET_VERIFY_POPUP_MESSAGES.internal.content,
                });
                return;
            }

            setPopUpConfig({
                type: "error",
                title: PASSWORD_RESET_VERIFY_POPUP_MESSAGES.fallback.title,
                content: PASSWORD_RESET_VERIFY_POPUP_MESSAGES.fallback.content,
            });
        }
    });

    // 비밀번호 재설정
    const resetPasswordMutation = useMutation({
        mutationFn: findPasswordResetReqeust,
        onSuccess: () => {
            setPopUpConfig({
                type: "confirm",
                title: "비밀번호 재설정 완료",
                content: "비밀번호가 성공적으로 변경되었습니다.",
            });
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            const errorCode = getServerErrorCode(error);

            if (status === 400) {
                // 40000: resetToken 또는 새 비밀번호 누락
                if (errorCode === AUTH_ERROR_CODES.common.invalidRequest) {
                    setErrorPw("password", {
                        type: "server",
                        message: PASSWORD_RESET_ERROR_MESSAGES.passwordFormat,
                    });
                    return;
                }

                // 41010: 비밀번호 정책 위반
                if (errorCode === AUTH_ERROR_CODES.passwordReset.passwordPolicyViolation) {
                    setErrorPw("password", {
                        type: "server",
                        message: PASSWORD_RESET_ERROR_MESSAGES.passwordPolicy,
                    });
                    return;
                }

                // 41011: 기존 비밀번호와 동일
                if (errorCode === AUTH_ERROR_CODES.passwordReset.sameAsCurrentPassword) {
                    setErrorPw("password", {
                        type: "server",
                        message: PASSWORD_RESET_ERROR_MESSAGES.sameAsCurrentPassword,
                    });
                    return;
                }

                setErrorPw("password", {
                    type: "server",
                    message: PASSWORD_RESET_ERROR_MESSAGES.passwordFormat,
                });
                return;
            }

            if (status === 401) {
                // 40100: resetToken 누락, 만료, 변조
                if (errorCode === AUTH_ERROR_CODES.passwordReset.invalidResetToken) {
                    setPopUpConfig({
                        type: "error",
                        title: PASSWORD_RESET_POPUP_MESSAGES.invalidResetToken.title,
                        content: PASSWORD_RESET_POPUP_MESSAGES.invalidResetToken.content,
                    });
                    return;
                }

                // 41106: resetToken 타입이 PASSWORD_RESET이 아님
                if (errorCode === AUTH_ERROR_CODES.passwordReset.invalidResetTokenType) {
                    setPopUpConfig({
                        type: "error",
                        title: PASSWORD_RESET_POPUP_MESSAGES.invalidResetToken.title,
                        content: PASSWORD_RESET_POPUP_MESSAGES.invalidResetToken.content,
                    });
                    return;
                }
            }

            // 41401: 사용자를 찾을 수 없음
            if (status === 404 && errorCode === AUTH_ERROR_CODES.common.userNotFound) {
                setPopUpConfig({
                    type: "error",
                    title: PASSWORD_RESET_POPUP_MESSAGES.userNotFound.title,
                    content: PASSWORD_RESET_POPUP_MESSAGES.userNotFound.content,
                });
                return;
            }

            // 50000: 비밀번호 암호화, 저장 또는 내부 오류
            if (status === 500) {
                setPopUpConfig({
                    type: "error",
                    title: PASSWORD_RESET_POPUP_MESSAGES.internal.title,
                    content: PASSWORD_RESET_POPUP_MESSAGES.internal.content,
                });
                return;
            }

            setPopUpConfig({
                type: "error",
                title: PASSWORD_RESET_POPUP_MESSAGES.fallback.title,
                content: PASSWORD_RESET_POPUP_MESSAGES.fallback.content,
            });
        }
    })
        

    // ---- 함수 ----
    const handleGoToResetPw = () => {
        onCodeVerified();
    }

    const handleResendCode = () => {
        sendCodeMutation.mutate({ username: usernameValue, email: emailValue });
    }

    // 인증번호 코드 6자리 입력 시 바로 인증 API 호출 
    const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearErrorsEmail("verificationCode");
        const value = e.target.value;

        if (value.length === 6 && !verifyCodeMutation.isPending) {
            const { email } = getEmailValues();
            verifyCodeMutation.mutate({ email, code: value });
        }
    };

    const codeAttemptText = `[${Math.min(Math.max(codeAttemptsCount, 1), MAX_CODE_ATTEMPTS)} / ${MAX_CODE_ATTEMPTS}]`;
    // 인증번호 시도 횟수 표시가 필요한 에러 메시지
    const verificationCodeErrorMessage = errorsEmail.verificationCode?.message
        ? PASSWORD_RESET_VERIFY_ATTEMPT_ERROR_MESSAGES.has(errorsEmail.verificationCode.message)
            ? `${errorsEmail.verificationCode.message} ${codeAttemptText}`
            : errorsEmail.verificationCode.message
        : undefined;
    
    const handleResetPw = (data: PasswordFormData) => {
        // mutation에서 받은 서버의 response (unmount시 초기화)
        const resetToken = verifyCodeMutation.data?.resetToken; 
        
        // 토큰이 없을 경우
        if (!resetToken) {
            setPopUpConfig({
                type: "error",
                title: PASSWORD_RESET_POPUP_MESSAGES.fallback.title,
                content: PASSWORD_RESET_POPUP_MESSAGES.fallback.content,
            });
            return;
        }
        
        resetPasswordMutation.mutate({ resetToken, newPassword: data.password });
    }

    return (
        <>
            {isPasswordResetStep ? (
                <form onSubmit={handleSubmitPw(handleResetPw)} className="flex flex-col gap-[50px] px-[25px]">
                    <div className="flex flex-col gap-[10px] pt-[37px]">
                        <SingleInput
                            label="비밀번호 재설정"
                            labelClassName="pl-[3px]"
                            placeholder="비밀번호를 입력해 주세요"
                            helperText="비밀번호 조건"
                            type={showPassword ? "text" : "password"}
                            inputClassName="pr-[50px]"
                            {...registerPw("password", {
                                onChange: () => clearErrorsPw("password"),
                            })}
                            error={errorsPw.password?.message}
                            rightIcon={
                                <Icon
                                    name={showPassword ? "eyeOpen" : "eyeClosed"}
                                    className={showPassword ? "w-[24px] h-[24px]" : "w-[22px] h-[20px]"}
                                />
                            }
                            rightIconAriaLabel="비밀번호 표시/숨김"
                            rightIconAriaPressed={showPassword}
                            onRightIconClick={() => setShowPassword((prev) => !prev)}
                        />
                        <SingleInput
                            labelClassName="pl-[3px]"
                            placeholder="비밀번호 재확인"
                            helperText="비밀번호를 한번 더 입력해주세요"
                            type="password"
                            {...registerPw("confirmPassword", {
                                onChange: () => clearErrorsPw("confirmPassword"),
                            })}
                            error={errorsPw.confirmPassword?.message}
                        />
                    </div>

                    <Button
                        label="비밀번호 재설정 완료"
                        type = "submit"
                        className="max-w-none rounded-[10px]"
                        disabled = {!isValidPw}
                        loading={resetPasswordMutation.isPending}
                    />
                </form>
            ) : (
                <div className="flex flex-col gap-[50px] px-[25px]">
                    <div className="flex flex-col gap-[30px] pt-[50px]">
                        <SingleInput
                            label="아이디"
                            labelClassName="pl-[3px]"
                            placeholder="아이디를 입력해 주세요"
                            disabled={isCodeSent}
                            {...registerEmail("username", {
                                onChange: () => clearErrorsEmail("username"),
                            })}
                            error={errorsEmail.username?.message}
                        />

                        <div className="flex flex-col gap-[10px]">
                            <SingleInput
                                label="이메일"
                                labelClassName="pl-[3px]"
                                placeholder="가입 이메일을 입력해 주세요"
                                disabled={isCodeSent}
                                {...registerEmail("email", {
                                    onChange: () => clearErrorsEmail("email"),
                                })}
                                error={errorsEmail.email?.message}
                            />

                            {isCodeSent && (
                                // 인증번호 : 재발송 버튼도 action 슬롯으로 통일
                                <SingleInput
                                    placeholder="인증번호를 입력해 주세요"
                                    disabled={isCodeVerified || codeAttemptsCount >= MAX_CODE_ATTEMPTS}
                                    {...registerEmail("verificationCode", {
                                        onChange: handleVerificationCodeChange,
                                    })}
                                    error={verificationCodeErrorMessage}
                                    action={
                                        <Button
                                            label="재발송"
                                            font="m-16"
                                            className="w-[74px] h-[48px] rounded-[5px] disabled:text-white"
                                            type="button"
                                            loading={sendCodeMutation.isPending}
                                            disabled={isCodeVerified}
                                            onClick={handleResendCode}
                                        />
                                    }
                                />
                            )}
                        </div>
                    </div>

                    {isCodeSent ? (
                        <Button
                            label="비밀번호 재설정"
                            className="max-w-none rounded-[10px]"
                            disabled={!isCodeVerified} 
                            onClick={handleGoToResetPw} 
                        />
                    ) : (
                        <Button
                            label="인증번호 받기"
                            loading={sendCodeMutation.isPending}
                            className="max-w-none rounded-[10px]"
                            disabled={!isEmailSendValid} 
                            onClick={handleResendCode}
                        />
                    )}
                </div>
            )}

            {popUpConfig && (
                <PopUp
                    isOpen={true}
                    type={popUpConfig.type}
                    title={popUpConfig.title}
                    content={popUpConfig.content}
                    onClick={() => {
                        // 비밀번호 재설정 완료 팝업일때
                        if(popUpConfig.type === "confirm") {
                            navigate("/login");
                        }
                        setPopUpConfig(null);
                    }}
                />
            )}

            <PopUp 
                isOpen={sendCodeMutation.isPending || verifyCodeMutation.isPending || resetPasswordMutation.isPending} 
                type="loading" 
            />
        </>
    );
};
