import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';
import { requestEmailCode, verifyEmailCode } from '../../api/auth';
import Button from '../../components/Button';
import SingleInput from '../../components/common/SingleInput';
import PopUp from '../../components/Pop-up';
import { useAuthStore } from '../../store/useAuthStore';
import { useSignupStore } from '../../store/useSignupStore';
import SmallButton from './components/SmallButton';

interface EmailVerificationStepProps {
    onNext: () => void;
}

// 이메일 인증 폼 검증 (zod)
// z.object : 폼 필드별 유효성 규칙 정의. 검증 실패 시 두 번째 인자 문자열이 errors에 담김
const emailSchema = z.object({
    // 1. 이메일 값
    email: z
    .string()
    .min(1, "이메일을 입력해 주세요")
    .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "이메일 형식이 올바르지 않습니다"
    ),
    // 2. 이메일 인증번호
    verificationCode: z.string().length(6, "인증번호 6자리를 입력해 주세요"),
});

// zod schema에서 type 자동으로 추론 (직접 type 선언 불필요)
type EmailFormData = z.infer<typeof emailSchema>;

// 이메일 인증 단계
export const EmailVerificationStep = ({ onNext }: EmailVerificationStepProps) => {

    const [isEmailVerificated, setIsEmailVerificated] = useState(false);
    const [emailSent, setEmailSent] = useState(false);  // 이메일 전송 여부
    const [popUpConfig, setPopUpConfig] = useState<{ title: string; content: string } | null>(null);

    // 이메일 전역상태 및 가입 정보
    const { email, setEmail, getEmailVerificationData } = useSignupStore(
        useShallow((state) => ({
            email: state.email,
            setEmail: state.setEmail,
            getEmailVerificationData: state.getEmailVerificationData,
        }))
    );

    const setLogin = useAuthStore((state) => state.setLogin);

    // RHF로 폼 제어
    // resolver : zodResolver로 zod 규칙을 RHF에 연결 (다리 역할)
    // mode "onChange" : 입력할 때마다 실시간 검증 (default : submit 시에만 검증)
    // defaultValues : 각 필드 초기값 (없으면 uncontrolled input 경고 발생)
    const { register, handleSubmit, control, formState : { errors } } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        mode: "onChange",
        defaultValues: {
            email: email,
            verificationCode: "",
        }
    });

    // SingleInput에 입력되는 값들 실시간 감지
    // register만으로는 컴포넌트 내부에서 현재 값을 변수로 꺼낼 수 없어 useWatch 사용
    // control : useWatch가 RHF 내부 상태에 접근할 수 있도록 연결해주는 객체
    const emailValue = useWatch({ control, name: "email" });
    const codeValue = useWatch({ control, name: "verificationCode" });

    // 이메일 인증번호 요청
    const emailRequestMutation = useMutation({
        mutationFn: requestEmailCode,
        onSuccess: () => {
            setEmailSent(true);
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            // 서버에서 내려주는 에러 객체의 구조에 따라 접근 (data.message)
            const errorData = error.response?.data as { message?: string };
            const serverMessage = errorData?.message;
            
            if (status === 409) {
                // 서버에서 온 메시지가 있으면 그걸 보여주고, 없으면 기본 메시지 표시
                setPopUpConfig({ 
                    title: "중복된 가입정보", 
                    content: "이미 가입된 이메일입니다." 
                });
            } else {
                setPopUpConfig({ 
                    title: "인증번호 발송 실패", 
                    content: serverMessage || "다시 요청해 주세요" 
                });
            }

            setEmailSent(false);
        }
    });

    // 이메일 인증번호 검증 mutation
    const emailVerifyMutation = useMutation({
        mutationFn: verifyEmailCode,
        onSuccess: (data) => {
            // 서버에서 받은 tempToken을 accessToken으로 저장
            // 이후 학교 인증(presign) 등 인증 정보가 필요한 API 호출 시 자동으로 헤더에 포함됨
            setLogin(data.tempToken, {
                id: String(data.userId),
                role: 'USER',
                nextStep: 'DOCUMENT_REQUIRED'
            });
            
            setPopUpConfig({ title: "인증완료", content: "" });
            setIsEmailVerificated(true);
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            // 서버에서 내려주는 에러 객체의 구조에 따라 접근 (data.message)
            const errorData = error.response?.data as { message?: string };
            const serverMessage = errorData?.message;
            
            if (status === 409) {
                // 서버에서 온 메시지가 있으면 그걸 보여주고, 없으면 기본 메시지 표시
                setPopUpConfig({ 
                    title: "중복된 가입정보", 
                    content: serverMessage || "이미 가입된 전화번호입니다." 
                });
            } else {
                setPopUpConfig({ 
                    title: "인증번호 불일치", 
                    content: serverMessage || "인증번호가 일치하지 않습니다." 
                });
            }
        }
    });

    // 인증요청 클릭 시
    const handleEmailRequest = () => {
        setEmail(emailValue);
        emailRequestMutation.mutate({ email: emailValue });
    };

    // 인증하기 버튼 클릭 시 
    const handleEmailVerify = () => {
        // 이메일 전송 여부 확인
        if (!emailSent) {
            setPopUpConfig({ title: "인증 오류", content: "먼저 인증 요청을 클릭하여 이메일을 전송해 주세요." });
            return;
        }   

        emailVerifyMutation.mutate({ ...getEmailVerificationData(), code: codeValue });
    }

    // '다음'버튼 클릭 시
    // handleSubmit이 zod 검증을 먼저 실행 → 통과 시에만 onSubmit 호출
    // data : zod 검증을 통과한 폼 전체 필드값 객체 { email, verificationCode }
    const onSubmit = (data : EmailFormData) => {
        setEmail(data.email);
        onNext();
    };

    return (
        // handleSubmit(onSubmit) : 문지기(검증) + 통과 후 실행 로직을 하나로 연결
        <form onSubmit={handleSubmit(onSubmit)}>
            
            <div className="absolute inset-0 bg-white px-[25px] flex flex-col overflow-hidden">
                <h1 className="pt-[86px] text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-gray-900 flex-none relative z-10">
                    <p>이메일 인증을</p>
                    <p>진행해 주세요</p>
                </h1>

                <div className="flex-1 overflow-y-auto space-y-[20px] pt-[40px] scrollbar-hide">
                    {/* 이메일 인증 : 인증요청 버튼은 action 슬롯에 넣어 인풋과 자동 정렬 */}
                    <SingleInput
                        label='이메일 인증'
                        placeholder='이메일을 입력해 주세요'
                        {...register("email")} // name, onChange, onBlur, ref를 한 번에 input에 연결
                        error={errors.email?.message} // zod 검증 실패 시 에러 문자열, 통과 시 undefined
                        successMessage={emailSent ? "메일이 전송되었습니다. 메일함을 확인해 주세요!" : ""}
                        action={
                            <SmallButton
                                label="인증요청"
                                type="button"
                                disabled={!emailValue || !!errors.email} // 이메일 값 || 에러 있으면 버튼 비활성화
                                onClick={handleEmailRequest}
                            />
                        }
                    />

                    {/* 인증번호 : 인증하기 버튼도 동일하게 action 슬롯으로 정렬 */}
                    <SingleInput
                        placeholder="인증 번호 6자리를 입력해 주세요"
                        {...register("verificationCode")}
                        error={errors.verificationCode?.message}
                        action={
                            <SmallButton
                                onClick={handleEmailVerify}
                                label="인증하기"
                                type="button"
                                disabled={!emailSent || codeValue.length !== 6}
                            />
                        }
                    />
                </div>

                <div className="h-[40px] flex-none" />
                
                <div className="flex-none pb-[60px] relative z-10 w-full flex justify-center">
                    <Button 
                        type="submit"
                        disabled={!isEmailVerificated}
                        label="다음" 
                    />
                </div>
            
            </div>

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

            <PopUp 
                isOpen={emailRequestMutation.isPending} 
                type="loading" 
                title="인증번호를 전송하고 있습니다..." 
            />
        </form> 
    )
}
