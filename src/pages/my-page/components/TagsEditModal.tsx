import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestTagList } from "../../../api/auth";
import PopUp from "../../../components/Pop-up";
import { useModalHistory } from "../../../hooks/useModalHistory";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { EditHeader } from "../../../layouts/headers/EditHeader";
import { updateProfileTags } from "../../../api/profileApi";

interface TagEditModalProps {
    userId: number;
    tagIds: number[];
    onClose: () => void;
}

const ALLOWED_CATEGORY_IDS = new Set([1, 2, 3, 4, 5]);

type UiTag = {
    id: number;
    name: string;
    category: number; // categoryId
};

type UiCategory = {
    id: number; // categoryId
    name: string; // categoryName
    tags: UiTag[];
};

export default function TagEditModal({ userId, tagIds, onClose }: TagEditModalProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(tagIds);
    const [searchQuery, setSearchQuery] = useState("");

    // 태그 리스트 조회
    const { data: tagList, isLoading, isError } = useQuery({
        queryKey: ["tagList"],
        queryFn: () => requestTagList(),
    });

    const tagData = tagList?.data;

    // 태그 데이터 포맷팅
    const { formattedCategories, allTags, tagIdToTag } = useMemo(() => {
        if (!tagData) {
            return {
                formattedCategories: [] as UiCategory[],
                allTags: [] as UiTag[],
                tagIdToTag: new Map<number, UiTag>(),
            };
        }

        const categories: UiCategory[] = tagData
            .filter((cat) => ALLOWED_CATEGORY_IDS.has(cat.categoryId))
            .map((cat) => ({
                id: cat.categoryId,
                name: cat.categoryName,
                tags: cat.tags.map((tag) => ({
                id: tag.id,
                name: tag.name,
                category: cat.categoryId,
                })),
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

        const tags: UiTag[] = dedupedCategories.flatMap((cat) => cat.tags);

        const idMap = new Map<number, UiTag>();
        tags.forEach((t) => idMap.set(t.id, t));

        return {
            formattedCategories: categories,
            allTags: tags,
            tagIdToTag: idMap,
        };
    }, [tagData]);

    //변경사항 추적
    const hasChanges = useMemo(() => {
        if (selectedTagIds.length !== tagIds.length) return true;

        const a = [...selectedTagIds].sort((x, y) => x - y);
        const b = [...tagIds].sort((x, y) => x - y);

        for (let i = 0; i < a.length; i += 1) {
            if (a[i] !== b[i]) return true;
        }
        return false;
    }, [selectedTagIds, tagIds]);

    const [showWarning, setShowWarning] = useState(false);
    useModalHistory(onClose, hasChanges, () => setShowWarning(true));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    //태그 선택/해제
    const toggleTag = (tagId: number) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
        } else {
        if (selectedTagIds.length >= 5) return;
            setSelectedTagIds([tagId, ...selectedTagIds]);
        }
    };

    const removeSelectedTag = (tagId: number) => {
        setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    };

    //검색 필터링
    const getFilteredCategories = () => {
        if (searchQuery) {
            //검색어가 있을 때 검색 결과를 카테고리별로 그룹화
            const filtered = allTags.filter(tag => 
                tag.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            const grouped = formattedCategories.map(cat => ({
                ...cat,
                tags: filtered.filter(tag => tag.category === cat.id)
            })).filter(cat => cat.tags.length > 0);
            
            return grouped;
        }
        
        return formattedCategories;
    };

    const mutation = useMutation({
        mutationFn: (newTagIds: number[]) => updateProfileTags(userId, { tagIds: newTagIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
            onClose();
        },
    });

    const handleClose = () => {
        if (hasChanges) {
            setShowWarning(true);
        } else {
            onClose();
        }
    }

    const handleComplete = () => {
        if (!hasChanges) {
            onClose();
            return;
        }
        mutation.mutate(selectedTagIds);
    };

    const filteredCategories = getFilteredCategories();

    return (
        <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
            <div className="w-full max-w-[430px] h-full bg-white flex flex-col">
                {isLoading ? (
                    <PopUp type="loading" isOpen={true} />
                ) : isError ? (
                    <PopUp
                        isOpen={true}
                        type="error"
                        title="오류 발생"
                        content="태그 목록을 불러오는 중 문제가 발생했습니다."
                        buttonText="닫기"
                        onClick={() => navigate(-1)}
                    />
                ) : (
                    <HeaderLayout
                        headerSlot = {
                            <EditHeader
                                title="태그"
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
                        <div className="w-full h-full bg-white flex flex-col  border-t border-gray-150">
                            <section className="w-full px-[25px] pt-[30px] pb-[20px] border-b border-gray-150 flex flex-col gap-[13px]">
                                <div className="flex items-center gap-[5px]">
                                    <span className="text-sb-16-hn text-gray-900">태그 선택</span>
                                    <span className="text-r-12-hn text-gray-750">(최대 5개)</span>
                                </div>
                                <div className="flex h-[30px] gap-[7px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {selectedTagIds.length !== 0 && (
                                        selectedTagIds.map(id => {
                                            const name = tagIdToTag.get(id)?.name ?? `#${id}`;
                                            return (
                                                <button
                                                    key={id}
                                                    className="h-[30px] flex justify-center items-center gap-[3px] px-[15px] py-[5px] rounded-[5px] border border-primary bg-green-50 text-primary text-m-14-hn"
                                                >
                                                    {name}
                                                    <svg width="16" height="16" viewBox="0 0 16 16" 
                                                    className="block shrink-0"
                                                    onClick={() => removeSelectedTag(id)}>
                                                        <path 
                                                            d="M4 12L12 4M4 4L12 12" 
                                                            stroke="#00C56C" 
                                                            strokeWidth="1.5" 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round"/>
                                                    </svg>

                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </section>

                            <section className="w-full flex flex-col flex-1 min-h-0 pt-[20px] px-[25px]">
                                {/*검색창*/}
                                <section className="w-full">
                                    <div className="relative">
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"
                                        className="absolute left-[19px] top-[50%] translate-y-[-50%]">
                                            <path 
                                                d="M18.7508 18.7508L13.5538 13.5538M13.5538 13.5538C14.9604 12.1472 15.7506 10.2395 15.7506 8.25028C15.7506 6.26108 14.9604 4.35336 13.5538 2.94678C12.1472 1.54021 10.2395 0.75 8.25028 0.75C6.26108 0.75 4.35336 1.54021 2.94678 2.94678C1.54021 4.35336 0.75 6.26108 0.75 8.25028C0.75 10.2395 1.54021 12.1472 2.94678 13.5538C4.35336 14.9604 6.26108 15.7506 8.25028 15.7506C10.2395 15.7506 12.1472 14.9604 13.5538 13.5538Z" 
                                                stroke="#646464" 
                                                strokeWidth="1.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"/>
                                        </svg>
                                        <input
                                            type="text"
                                            name="searchTags"
                                            placeholder="태그 검색"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-[40px] pl-[52px] pr-[19px] py-[8px] rounded-[30px] bg-gray-150 text-gray-750 text-r-14 placeholder:text-gray-650 focus:outline-none"
                                        />
                                    </div>
                                </section>

                                {/*태그 리스트*/}
                                {selectedTagIds.length < 5 ? (
                                    <section className="flex-1 min-h-0 overflow-y-auto pb-[40px]">
                                        <div className="w-full flex flex-col">
                                            {filteredCategories.map(category => (
                                                <div key={category.id} className="w-full flex flex-col gap-[15px] pt-[20px] pb-[15px] border-b border-gray-250 last:border-none">
                                                    <span className="text-sb-16-hn text-gray-900">{category.name}</span>
                                                    <div className="flex flex-wrap gap-[7px]">
                                                        {category.tags.map(tag => (
                                                            <button
                                                                key={tag.id}
                                                                onClick={() => toggleTag(tag.id)}
                                                                className={`h-[30px] px-[15px] py-[5px] rounded-[5px] border ${
                                                                    selectedTagIds.includes(tag.id)
                                                                        ? 'text-m-14-hn bg-green-50 text-primary border-primary'
                                                                        : 'text-r-14-hn bg-white text-gray-650 border-gray-650'
                                                                }`}
                                                            >
                                                                {tag.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ): (
                                    <div className="flex flex-1 flex-col items-center justify-center gap-[10px] pb-[40px]">
                                        <p className="text-r-16 text-gray-650">최대 5개까지만 선택 가능합니다.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </HeaderLayout>
                )}
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