import Button from "../../../components/Button";
import SingleInput from "../../../components/common/SingleInput";
import { useState } from "react";
import SmallButton from "./SmallButton";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import PopUp from "../../../components/Pop-up";

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

export const FindPwForm = () => {

    const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
    const [isCodeVerified, setIsCodeVerified] = useState<boolean>(false);
    const [popUpConfig, setPopUpConfig] = useState<{ title: string; content: string } | null>(null);

    // RHF
    const { register : registerEmail, control: controlEmail, formState: {errors : errorsEmail, isValid : isValidEmail}} = useForm<EmailFormData>({
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

    const {register : registerPw, handleSubmit : handleSubmitPw, formState: {errors : errorsPw, isValid : isValidPw}} = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        mode: "onChange",
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    // ---- 함수 ----
    // todo API 연동하기
    const handleSendCode = () => {
        // useMutate (인증번호 받기 API)
        console.log("인증번호 받기 버튼 클릭");
        setIsCodeSent(true);
    }

    const handleResendCode = () => {
        // useMutate (인증번호 재발송 API)
        console.log("인증번호 재발송 버튼 클릭");
    }

    const handleVerifyCode = () => {
        // useMutate (이메일 인증하기 API)
        console.log("인증하기 버튼 클릭"); 
        setIsCodeVerified(true);
    }
    
    const handleResetPw = () => {
        // useMutate (비밀번호 변경 API)
        console.log("비밀번호 재설정 버튼 클릭");
    }

    return (
        isCodeVerified ? (
            // todo 디자인 확인 후 수정
            <form onSubmit={handleSubmitPw(handleResetPw)} className="flex flex-col gap-[50px] px-[25px]">
                <div className="flex flex-col gap-[30px] pt-[50px]">
                    <SingleInput
                        label="비밀번호"
                        labelClassName="pl-[3px]"
                        placeholder="비밀번호를 입력해 주세요"
                        {...registerPw("password")}
                        error={errorsPw.password?.message}
                    />
                    <SingleInput
                        label="비밀번호 확인"
                        labelClassName="pl-[3px]"
                        placeholder="비밀번호를 확인해 주세요"
                        {...registerPw("confirmPassword")}
                        error={errorsPw.confirmPassword?.message}
                    />
                </div>

                <Button
                    label="비밀번호 재설정"
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
                        {...registerEmail("username")}
                        error={errorsEmail.username?.message}
                    />

                    <SingleInput
                        label="이메일"
                        labelClassName="pl-[3px]"
                        placeholder="가입 이메일을 입력해 주세요"
                        {...registerEmail("email")}
                        error={errorsEmail.email?.message}
                    />

                    {isCodeSent && (
                        <div className="flex items-center gap-2.5">
                            <SingleInput
                                placeholder="인증번호를 입력해 주세요" 
                                {...registerEmail("verificationCode")}
                                error={errorsEmail.verificationCode?.message}
                            /> 
                            <SmallButton 
                                label="재발송" 
                                type="button"
                                onClick={handleResendCode}
                            />
                        </div>
                    )}

                </div>

                {isCodeSent ? (
                    <Button
                        label="인증하기"
                        className="max-w-none rounded-[10px]"
                        disabled={!isValidEmail} 
                        onClick={handleVerifyCode} 
                    />
                ) : (
                    <Button
                        label="인증번호 받기"
                        className="max-w-none rounded-[10px]"
                        disabled={!isEmailSendValid} 
                        onClick={handleSendCode}
                    />
                )}
                {popUpConfig && (
                    <PopUp
                        isOpen={true}
                        type="confirm"
                        title={popUpConfig.title}
                        content={popUpConfig.content}
                        onClick={() => {
                            setPopUpConfig(null);
                        }}
                    />
                )}

            {/* <PopUp 
                isOpen={} 
                type="loading" 
                title="인증번호를 전송하고 있습니다..." 
            /> */}
            </div>
        )   
    );
};
