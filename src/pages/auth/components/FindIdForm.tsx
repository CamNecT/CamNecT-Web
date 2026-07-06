import Button from "../../../components/Button";
import SingleInput from "../../../components/common/SingleInput";
import { useState } from "react";
import PopUp from "../../../components/Pop-up";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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

    const [popUpConfig, setPopUpConfig] = useState<{ title: string; content: string } | null>(null);

    // RHF
    const { register, handleSubmit, formState: { errors, isValid } } = useForm<FindIdFormData>({
        resolver: zodResolver(findIdSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            email: "",
        }
    });
    
    // ---- 함수 ----
    const handleFindId = (data: FindIdFormData) => {
        // todo 아이디 찾기 mutation 구현   
        // todo 로딩 중 팝업 구현 
        console.log("제출된 정보:", data);
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
                        setPopUpConfig(null);
                    }}
                />
            )}

            {/* <PopUp 
                isOpen={} 
                type="loading" 
                title="인증번호를 전송하고 있습니다..." 
            /> */}
        </form>
    );
};
