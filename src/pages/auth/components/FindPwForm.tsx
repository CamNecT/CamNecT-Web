import Button from "../../../components/Button";
import SingleInput from "../../../components/common/SingleInput";
import { useState } from "react";
import SmallButton from "./SmallButton";

export const FindPwForm = () => {

    const [isCodeSent, setIsCodeSent] = useState<boolean>(true);

    const handleSendCode = () => {
        console.log("인증번호 받기 버튼 클릭");
        setIsCodeSent(true);
    }
    
    const handleFindPw = () => {
        console.log("비밀번호 찾기 버튼 클릭");
    }

    return (
        <form className="flex flex-col gap-[50px] px-[25px]">
            <div className="flex flex-col gap-[30px] pt-[50px]">
                <SingleInput
                    label="아이디"
                    labelClassName="pl-[3px]"
                    placeholder="아이디를 입력해 주세요"
                />

                {
                    isCodeSent ? (
                        <div className="flex flex-col gap-2.5">
                            <SingleInput
                                label="이메일"
                                labelClassName="pl-[3px]"
                                placeholder="가입 이메일을 입력해 주세요"
                            />
                                
                            <div className="flex items-center gap-2.5">
                                <SingleInput
                                    placeholder="인증번호를 입력해 주세요" 
                                /> 
                                <SmallButton 
                                    label="재발송" 
                                    type="button"
                                />
                            </div>
                        </div>
                    ) : (
                        <SingleInput
                            label="이메일"
                            labelClassName="pl-[3px]"
                            placeholder="가입 이메일을 입력해 주세요"
                        />
                    )
                }

            </div>

            <Button
                label={isCodeSent ? "비밀번호 찾기" : "인증번호 받기"}
                className="max-w-none rounded-[10px]"
                onClick={isCodeSent ? handleFindPw : handleSendCode}
            />
        </form>
    );
};