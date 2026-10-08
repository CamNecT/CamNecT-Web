import { useState } from "react";
interface TagItem {
    id: number;
    name: string;
    category?: number;
}

interface TagsChooseModalProps {
    selectedTags: number[];
    categories: {
        id: number; // 카테고리 ID (number)
        name: string;
        tags: TagItem[];
    }[];
    allTags: TagItem[];
    onToggle: (tagId: number) => void;
}

export default function TagsChooseModal({ selectedTags, categories, allTags, onToggle }: TagsChooseModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    //검색 필터링
    const getFilteredCategories = () => {
        if (searchQuery) {
            //검색어가 있을 때 검색 결과를 카테고리별로 그룹화
            const filtered = allTags.filter(tag => 
                tag.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            const grouped = categories.map(cat => ({
                ...cat,
                tags: filtered.filter(tag => tag.category === cat.id)
            })).filter(cat => cat.tags.length > 0);
            
            return grouped;
        }
        
        return categories;
    };

    const filteredCategories = getFilteredCategories();
    const isSelectionLimitReached = selectedTags.length >= 5;

    return (
        <div className="flex items-center justify-center inset-0 h-full">
            <div className="w-full max-w-[430px] h-full bg-white flex flex-col">    
                    <div className="w-full h-full bg-white flex flex-col">
                        <section className="w-full pt-[30px] pb-[20px] border-b border-gray-150 flex flex-col gap-[13px]">
                            <div className="flex h-[30px] gap-[7px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {selectedTags.length !== 0 && (
                                    selectedTags.map(tagId => {
                                        const tag = allTags.find(t => t.id === tagId);
                                        return (
                                            <button
                                                type="button"
                                                key={tagId}
                                                onClick={
                                                    // 자식 컴포넌트에서 부모의 상태변경 함수 호출 (상태 호이스팅)
                                                    () => onToggle(tagId)
                                                }
                                                className="h-[30px] flex justify-center items-center gap-[3px] px-[15px] py-[5px] rounded-[5px] border border-primary bg-green-50 text-primary text-m-14-hn"
                                            >
                                                {tag?.name || tagId}
                                                <svg width="16" height="16" viewBox="0 0 16 16" 
                                                className="block shrink-0">
                                                    <path 
                                                        d="M4 12L12 4M4 4L12 12" 
                                                        stroke="#00C56C" 
                                                        strokeWidth="1.5" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"/>
                                                </svg>

                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        <section className="w-full flex flex-col flex-1 min-h-0 pt-[20px]">
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
                                {isSelectionLimitReached && (
                                    <p className="pt-[8px] pl-[5px] text-r-12-hn text-gray-650">
                                        최대 5개까지만 선택 가능합니다.
                                    </p>
                                )}
                            </section>

                            {/*태그 리스트*/}
                            <section className="flex-1 min-h-0 overflow-y-auto pb-[40px]">
                                <div className="w-full flex flex-col">
                                    {filteredCategories.map(category => (
                                        <div key={category.id} className="w-full flex flex-col gap-[15px] pt-[20px] pb-[15px] border-b border-gray-250 last:border-none">
                                            <span className="text-sb-16-hn text-gray-900">{category.name}</span>
                                            <div className="flex flex-wrap gap-[7px]">
                                                {category.tags.map(tag => {
                                                    const isSelected = selectedTags.includes(tag.id);
                                                    const isDisabled = isSelectionLimitReached && !isSelected;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={tag.id}
                                                            disabled={isDisabled}
                                                            onClick={() => onToggle(tag.id)}
                                                            className={`h-[30px] px-[15px] py-[5px] rounded-[5px] border ${
                                                                isSelected
                                                                    ? 'text-m-14-hn bg-green-50 text-primary border-primary'
                                                                    : isDisabled
                                                                        ? 'cursor-not-allowed bg-gray-100 text-r-14-hn text-gray-350 border-gray-250'
                                                                        : 'text-r-14-hn bg-white text-gray-650 border-gray-650'
                                                            }`}
                                                        >
                                                            {tag.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </section>
                    </div>
            </div>
        </div>
    );
}
