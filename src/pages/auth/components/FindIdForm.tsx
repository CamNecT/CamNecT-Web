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

export const FindIdForm = () => {

    const [popUpConfig, setPopUpConfig] = useState<{ title: ReactNode; content: ReactNode } | null>(null);
    const navigate = useNavigate();

    // RHF
    const { register, handleSubmit, formState: { errors, isValid } } = useForm<FindIdFormData>({
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
        // todo onError 작성하기 (error case 명세서 작성 이후)
    })
    
    // ---- 함수 ----
    const handleFindId = (data: FindIdFormData) => {
        findIdMutation.mutate({
            name: data.name,
            email: data.email
        });
        // todo 에러 시 각 폼의 에러문구 추가
    }

    return (
        <form onSubmit={handleSubmit(handleFindId)} className="flex flex-col gap-[50px] px-[25px]">
            <div className="flex flex-col gap-[30px] pt-[50px]">
                <SingleInput
                    label="이름"
                    labelClassName="pl-[3px]"
                    placeholder="이름을 입력해 주세요"
                    {...register("name")}
                    error={errors.name?.message}
                />

                <SingleInput
                    label="이메일"
                    labelClassName="pl-[3px]"
                    placeholder="가입 이메일을 입력해 주세요"
                    {...register("email")}
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
                    type="confirm"
                    title={popUpConfig.title}
                    content={popUpConfig.content}
                    onClick={() => {
                        // 아이디 안내 팝업 '확인' 클릭시
                        setPopUpConfig(null);
                        navigate("/login"); // 로그인 페이지로 이동
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
