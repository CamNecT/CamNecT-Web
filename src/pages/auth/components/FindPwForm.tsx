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
import SmallButton from "./SmallButton";

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

// API 응답 error message와 매핑하기 위한 타입
// todo 안쓰는 것들 삭제 예정 
type ErrorKey =
    | "username"
    | "email"
    | "code"
    | "verificationCodeUnavailable"
    | "verificationCodeExpiredOrUsed"
    | "verificationCodeAttemptsExceeded"
    | "accountRestrictedOrEmailUnverified"
    | "password";

const singleInputErrorMessage: Record<ErrorKey, string> = {
    username: "입력한 아이디가 가입 정보와 일치하지 않습니다.",
    email: "입력한 이메일이 가입 정보와 일치하지 않습니다.",
    code: "인증번호가 일치하지 않습니다.",
    verificationCodeUnavailable: "활성화된 인증번호가 없습니다. 인증번호를 다시 받아주세요.",
    verificationCodeExpiredOrUsed: "만료되었거나 이미 사용된 인증번호입니다. 인증번호를 다시 받아주세요.",
    verificationCodeAttemptsExceeded: "인증번호 입력 시도 횟수를 초과했습니다. 인증번호를 다시 받아주세요.",
    accountRestrictedOrEmailUnverified: "계정이 비활성화되어 있습니다.",
    password: "이전 비밀번호는 사용할 수 없습니다."
};

export const FindPwForm = ({isPasswordResetStep, onCodeVerified}: FindPwFormProps) => {

    const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
    const [isCodeVerified, setIsCodeVerified] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [popUpConfig, setPopUpConfig] = useState<{ type: PopUpType, title: ReactNode; content: ReactNode } | null>(null);

    const navigate = useNavigate();

    // RHF
    const { register: registerEmail, control: controlEmail,
            setError: setErrorEmail, clearErrors: clearErrorsEmail,
            getValues: getEmailValues, 
            formState: { errors: errorsEmail } } = useForm<EmailFormData>({
        
        resolver: zodResolver(emailSchema),
        mode: "onChange",
        defaultValues: {
            username: "",
            email: "",
            verificationCode: ""
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
    const sendCodeMutation = useMutation({
        mutationFn: findPasswordEmailReqeust,
        onSuccess: () => {
            setIsCodeSent(true);
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            const errorData = error.response?.data as { invalidProperties?: string[] };
            const invalidProperties = errorData?.invalidProperties ?? []; 

            if (status === 400) {
                const hasUsernameError = invalidProperties.includes("username");
                const hasEmailError = invalidProperties.includes("email");

                if (hasUsernameError) {
                    setErrorEmail("username", {
                        type: "server",
                        message: singleInputErrorMessage["username"],
                    });
                }
                
                if (hasEmailError) {
                    setErrorEmail("email", {
                        type: "server",
                        message: singleInputErrorMessage["email"],
                    });
                }
            }

            if (status === 403) { 
                // todo code까지 추가로 확인 (정지 사용자 경우도 포함) -> 정지 사용자는 서버에서 취급 안할 예정
                setErrorEmail("verificationCode", {
                    type: "server",
                    message: singleInputErrorMessage["code"],
                });
            }
        }
    });

    const verifyCodeMutation = useMutation({
        mutationFn: findPasswordEmailVerifyRequest,
        onSuccess: () => {
            setIsCodeVerified(true);
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            const errorData = error.response?.data as { code?: string };
            const errorCode = errorData?.code;

            if (status === 400) {
                if (errorCode === "42032") {
                    setErrorEmail("verificationCode", {
                        type: "server",
                        message: singleInputErrorMessage["code"],
                    });
                    return;
                }

                // todo 서버 응답 code 값 직접 테스트 후 아래 케이스를 세분화
                // - 활성 인증번호 없음: singleInputErrorMessage["verificationCodeUnavailable"]
                // - 만료/사용됨: singleInputErrorMessage["verificationCodeExpiredOrUsed"]
                setErrorEmail("verificationCode", {
                    type: "server",
                    message: singleInputErrorMessage["code"],
                });

                return;
            }

            if (status === 403) {
                // 정지된 사용자 or 이메일 미인증 (이메일 미인증은 확인 필요)
                if (errorCode === "41302") {

                    setErrorEmail("email", {
                        type: "server",
                        message: singleInputErrorMessage["accountRestrictedOrEmailUnverified"],
                    });

                    return;
                }
            }

            // todo 인증번호 횟수 초과 횟수 파악
            if (status === 429) {
                setErrorEmail("verificationCode", {
                    type: "server",
                    message: singleInputErrorMessage["verificationCodeAttemptsExceeded"],
                });

                return;
            }

            setPopUpConfig({
                type: "error",
                title: "인증에 실패하였습니다.",
                content: "관리자에게 문의주세요.",
            });
        }
    });

    // todo 서버 복구 이후 수정
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

            
            if (status === 400) {
                setErrorPw("password", {
                    type: "server",
                    message: singleInputErrorMessage["password"],
                });
                return;
            }

            setPopUpConfig({
                type: "error",
                title: "비밀번호 재설정에 실패하였습니다.",
                content: "관리자에게 문의주세요.",
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
    
    const handleResetPw = (data: PasswordFormData) => {
        // mutation에서 받은 서버의 response (umounte시 초기화)
        const resetToken = verifyCodeMutation.data?.resetToken; 
        
        // 토큰이 없을 경우
        if (!resetToken) {
            setPopUpConfig({
                type: "error",
                title: "비밀번호 재설정에 실패하였습니다.",
                content: "관리자에게 문의주세요.",
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
                    />
                </form>
            ) : (
                <div className="flex flex-col gap-[50px] px-[25px]">
                    <div className="flex flex-col gap-[30px] pt-[50px]">
                        <SingleInput
                            label="아이디"
                            labelClassName="pl-[3px]"
                            placeholder="아이디를 입력해 주세요"
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
                                {...registerEmail("email", {
                                    onChange: () => clearErrorsEmail("email"),
                                })}
                                error={errorsEmail.email?.message}
                            />

                            {isCodeSent && (
                                <div className="flex items-start gap-2.5">
                                    <SingleInput
                                        placeholder="인증번호를 입력해 주세요" 
                                        disabled = {isCodeVerified}
                                        {...registerEmail("verificationCode", {
                                            onChange: handleVerificationCodeChange,
                                        })}
                                        error={errorsEmail.verificationCode?.message}
                                    /> 
                                    <SmallButton 
                                        label="재발송" 
                                        type="button"
                                        disabled={isCodeVerified}
                                        onClick={handleResendCode}
                                    />
                                </div>
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
