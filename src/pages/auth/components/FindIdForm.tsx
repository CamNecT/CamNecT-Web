import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import z from "zod";
import { findId } from "../../../api/auth";
import Button from "../../../components/Button";
import SingleInput from "../../../components/common/SingleInput";
import PopUp from "../../../components/Pop-up";
import type { AxiosError } from "axios";
import type { PopUpType } from "../../../components/Pop-up";

// [중요] 동명이인이 다른 유효한 이메일로 찾을때 불일치 필드 식별 불가 상황 -> 동명이인 발생 시 문제

// Id찾기 폼 검증 (zod)
const findIdSchema = z.object({
    name: z
        .string()
        .min(1, "이름을 입력해 주세요")
        .regex(/^(?:[가-힣]+|[a-zA-Z]+)$/, "이름은 한글 또는 영문만 입력할 수 있습니다"),

    email: z
        .string()
        .min(1, "이메일을 입력해주세요")
        .regex(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "이메일 형식이 올바르지 않습니다"
        )
});

type FindIdFormData = z.infer<typeof findIdSchema>;

// API 응답 error message와 매핑하기 위한 타입
type ErrorKey = "name" | "email";

const singleInputErrorMessage: Record<ErrorKey, string> = {
    name: "입력한 이름이 가입 정보와 일치하지 않습니다.",
    email: "입력한 이메일이 가입 정보와 일치하지 않습니다.",
    //misMatch: "입력하신 정보와 일치하는 아이디가 없습니다."
};

export const FindIdForm = () => {

    const [popUpConfig, setPopUpConfig] = useState<{ type: PopUpType, title: ReactNode; content: ReactNode } | null>(null);
    const navigate = useNavigate();

    // RHF
    const { register, handleSubmit, setError, clearErrors, formState: { errors, isValid } } = useForm<FindIdFormData>({
        resolver: zodResolver(findIdSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            email: "",
        }
    });

    // 아이디 찾기 mutation
    const findIdMutation = useMutation({
        mutationFn: findId,
        onSuccess: (data, variables) => {
            setPopUpConfig({
                type: "confirm",
                title: (
                    <>
                        {variables.name}님의 아이디는{'\n'}
                        <span className='text-b-18 text-primary'>{data.username}</span>
                        입니다.
                    </>
                ),
                content: ""
            })
        },
        onError: (error: AxiosError) => {
            const status = error.response?.status;
            const errorData = error.response?.data as { invalidProperties?: string[] };
            const invalidProperties = errorData?.invalidProperties ?? []; 

            if (status === 400) {
                const hasNameError = invalidProperties.includes("name");
                const hasEmailError = invalidProperties.includes("email");
                
                if (hasNameError) {
                    setError("name", {
                        type: "server",
                        message: singleInputErrorMessage["name"],
                    });
                }
                
                if (hasEmailError) {
                    setError("email", {
                        type: "server",
                        message: singleInputErrorMessage["email"],
                    });
                }

                // 이름 <-> 이메일이 불일치하는 경우는 생략

            } else {
                setPopUpConfig({
                    type: "error",
                    title:"아이디 찾기에 실패하였습니다.",
                    content: "관리자에게 문의주세요.",
                })
            }
        }
    })
    
    // ---- 함수 ----
    const handleFindId = (data: FindIdFormData) => {
        findIdMutation.mutate({
            name: data.name,
            email: data.email
        });
    }

    return (
        <form onSubmit={handleSubmit(handleFindId)} className="flex flex-col gap-[50px] px-[25px]">
            <div className="flex flex-col gap-[30px] pt-[50px]">
                <SingleInput
                    label="이름"
                    labelClassName="pl-[3px]"
                    placeholder="이름을 입력해 주세요"
                    {...register("name", {
                        onChange: () => clearErrors("name"),
                    })}
                    error={errors.name?.message}
                />

                <SingleInput
                    label="이메일"
                    labelClassName="pl-[3px]"
                    placeholder="가입 이메일을 입력해 주세요"
                    {...register("email",{
                        onChange: () => clearErrors("email"),
                    })}
                    error={errors.email?.message}
                />
            </div>

            <Button
                type = "submit"
                label="아이디 찾기"
                className="max-w-none rounded-[10px]"
                disabled = {!isValid}
            />

            {popUpConfig && (
                <PopUp
                    isOpen={true}
                    type={popUpConfig.type}
                    title={popUpConfig.title}
                    content={popUpConfig.content}
                    onClick={() => {
                        // 아이디 안내 팝업 '확인' 클릭시
                        setPopUpConfig(null);
                        if(popUpConfig.type == 'confirm'){
                            navigate("/login"); // 로그인 페이지로 이동
                        }
                    }}
                />
            )}

            <PopUp 
                isOpen={findIdMutation.isPending} 
                type="loading" 
            />
        </form>
    );
};
