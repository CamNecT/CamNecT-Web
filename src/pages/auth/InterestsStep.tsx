import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { requestProfileOnboarding, requestTagList } from "../../api/auth";
import Button from "../../components/Button";
import ButtonWhite from "../../components/ButtonWhite";
import PopUp from "../../components/Pop-up";
import { useAuthStore } from "../../store/useAuthStore";
import { useSignupStore } from "../../store/useSignupStore";
import TagsChooseModal from "./components/TagsChooseModal";

interface InterestsStepProps {
    onNext: () => void;
}

export const InterestsStep = ({ onNext }: InterestsStepProps) => {

    const { profileImageKey, selfIntroduction } = useSignupStore(
        useShallow((state) => ({
            profileImageKey: state.profileImageKey,
            selfIntroduction: state.selfIntroduction,
        }))
    );

    const userId = useAuthStore((state) => state.user?.id ? Number(state.user.id) : null);

    const [selectedTags, setSelectedTags] = useState<number[]>([]); // 선택된 태그들의 id를 보관해야 함 (로컬 상태로 관리)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showErrorPopUp, setShowErrorPopUp] = useState(false);
    const [isFetchErrorDismissed, setIsFetchErrorDismissed] = useState(false);

    // 태그 불러오기 
    const {data: tagList, isLoading, isError} = useQuery({
        queryKey: ["tagList"],
        queryFn: () => requestTagList(),
    });

    // 서버 데이터가 바뀔때만 API 통신 
    const { formattedCategories, allTags } = useMemo(() => {
        if (!tagList?.data) return { formattedCategories: [], allTags: [] };

        const categories = tagList.data.map(cat => ({
            id: cat.categoryId, // number
            name: cat.categoryName,
            tags: cat.tags.map(tag => ({
                id: tag.id, // Number ID
                name: tag.name,
                category: cat.categoryId // number
            }))
        }));

        // 중복 태그명 제거 (첫 번째 등장만 유지)
        const seenTagNames = new Set<string>();
        const dedupedCategories = categories.map(cat => ({
            ...cat,
            tags: cat.tags.filter(tag => {
                if (seenTagNames.has(tag.name)) {
                    return false; // 중복이면 제거
                }
                seenTagNames.add(tag.name);
                return true;
            })
        }));

        // flatMap : map -> flat (이중배열 -> 단일 배열)
        // -> 계층형데이터를 단일 배열로
        const tags = dedupedCategories.flatMap(cat => cat.tags);

        return { formattedCategories: dedupedCategories, allTags: tags };
    }, [tagList?.data]);

    // 태그 토글 핸들러 (부모에서 관리)
    // tagId로 관리
    const handleToggleTag = (tagId: number) => {
        setSelectedTags(prev => {
            if (prev.includes(tagId)) {
                // 이미 선택됐으면 선택해제
                return prev.filter(id => id !== tagId);
            } else {
                if (prev.length >= 5) return prev;
                // 선택된 태그 추가
                return [tagId, ...prev];
            }
        });
    };

    const sendProfileInfo = useMutation({
        mutationFn: requestProfileOnboarding
    });

    // 다음, 건너뛰기 버튼
    const handleNext = async () => {
        setIsSubmitting(true);
        try {
            // 프로필 이미지, 자기소개, 관심태그 전송 API 호출
            await sendProfileInfo.mutateAsync({
                userId: userId || 0,
                profileImageKey,
                bio: selfIntroduction,
                tagIds: selectedTags, // [number, number, ...]
            });

            onNext();
        } catch {
            setShowErrorPopUp(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-white px-[25px] flex flex-col overflow-hidden">
            {/* 1. 헤더 영역 (고정) */}
            <h1 className="flex-none relative z-10 pt-[86px] text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-gray-900">
                관심분야를 알려주세요!  <span className="text-m-14 text-gray-750 font-normal ml-[4px]">(최대 5개)</span>

            </h1>

            {/* 2. 태그 선택 영역 (나머지 공간 모두 차지) */}
            <div className="flex-1 min-h-0">
                <TagsChooseModal 
                    selectedTags={selectedTags} 
                    categories={formattedCategories} 
                    allTags={allTags} 
                    onToggle={handleToggleTag} 
                />
            </div>

            {/* 3. 버튼 영역 (바닥에서 60px 유지) */}
            <div className="flex-none pt-[20px] pb-[60px] w-full flex justify-center">
                <div className="flex items-center gap-[10px] w-full max-w-[325px]">
                    <ButtonWhite
                        label={isSubmitting ? "처리 중..." : "건너뛰기"}
                        className="flex-1 h-[50px] rounded-[10px]"
                        disabled={isSubmitting}
                        onClick={handleNext}
                    />

                    <Button
                        label={isSubmitting ? "제출 중..." : "다음"}
                        disabled={selectedTags.length === 0 || isSubmitting}
                        className="flex-1 h-[50px] rounded-[10px]"
                        onClick={handleNext}
                    />
                </div>
            </div>

            {showErrorPopUp && (
                <PopUp
                    isOpen={showErrorPopUp}
                    type="error"
                    title="저장 실패"
                    content="정보 저장 중 오류가 발생했습니다\n다시 시도해 주세요."
                    buttonText="확인"
                    onClick={() => setShowErrorPopUp(false)}
                />
            )}

            {/* 태그 리스트 로딩 팝업 */}
            <PopUp 
                isOpen={isLoading} 
                type="loading" 
                title="태그 목록을 불러오는 중입니다..." 
            />

            {/* 태그 리스트 에러 팝업 */}
            <PopUp 
                isOpen={isError && !isFetchErrorDismissed} 
                type="error" 
                title="오류 발생" 
                content="태그 목록을 불러오는 중 문제가 발생했습니다." 
                buttonText="닫기"
                onClick={() => setIsFetchErrorDismissed(true)}
            />
        </div>
    );
};
