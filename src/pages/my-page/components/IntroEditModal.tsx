import { useState, useEffect, useMemo } from "react";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { EditHeader } from "../../../layouts/headers/EditHeader";
import { useModalHistory } from "../../../hooks/useModalHistory";
import PopUp from "../../../components/Pop-up";
import { updateProfileBio } from "../../../api/profileApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IntroEditModalProps {
    userId: number;
    initialStatement: string;
    onClose: () => void;
}

const MAX_LENGTH = 100;

export default function IntroEditModal({ userId, initialStatement, onClose }: IntroEditModalProps) {
    const [statement, setStatement] = useState<string>(initialStatement);
    const queryClient = useQueryClient();

    // 변경사항 추적
    const hasChanges = useMemo(() => statement !== initialStatement
    , [statement, initialStatement])

    const [showWarning, setShowWarning] = useState(false);
    useModalHistory(onClose, hasChanges, () => setShowWarning(true));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleClose = () => {
        if (hasChanges) {
            setShowWarning(true);
        } else {
            onClose();
        }
    }

    // 완료 버튼
    const handleComplete = () => {
        if (!hasChanges) {
            onClose();
            return;
        }
        mutation.mutate(statement);
    };

    const mutation = useMutation({
        mutationFn: (bio: string) => updateProfileBio(userId, { bio }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
            onClose();
        },
    });

    return (
        <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
            <div className="w-full max-w-[430px] h-full bg-white flex flex-col">    
                <HeaderLayout
                    headerSlot = {
                        <EditHeader
                            title="자기 소개"
                            leftAction = {{onClick: handleClose}}
                            rightElement = {
                                <button
                                    className={`text-b-16-hn transition-colors ${
                                        hasChanges ? 'text-primary' : 'text-gray-650'
                                    }`}
                                    onClick={handleComplete}
                                    disabled={!hasChanges || mutation.isPending}
                                >
                                    {mutation.isPending ? '저장중..' : '완료'}
                                </button>
                            }
                        />
                    }
                >
                    <section className="w-full px-[25px] pt-[27px] flex flex-col gap-[5px] items-end border-t border-gray-150">
                        <textarea
                            value={statement}
                            onChange={(e) => {
                                if (e.target.value.length <= MAX_LENGTH) {
                                    setStatement(e.target.value);
                                }
                            }}
                            placeholder="내용을 입력해주세요. (최대 100자)"
                            className="w-full h-[130px] p-[15px] border border-gray-150 rounded-[10px] text-r-16 text-gray-750 placeholder:text-gray-650 resize-none focus:outline-none"
                        />
                        <div className="text-r-12-hn text-gray-650">
                            {statement.length}/{MAX_LENGTH}
                        </div>
                    </section>
                </HeaderLayout>
            </div>
            <PopUp
                isOpen={showWarning}
                type="warning"
                title="변경사항이 있습니다.\n나가시겠습니까?"
                content="저장하지 않을 시 변경사항이 삭제됩니다."
                leftButtonText="나가기"
                onLeftClick={() => {
                    setShowWarning(false);
                    onClose();
                }}
                onRightClick={() => setShowWarning(false)}
            />
        </div>
    );
}