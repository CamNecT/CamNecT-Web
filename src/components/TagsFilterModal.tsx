import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BottomSheetModal from './BottomSheetModal/BottomSheetModal';
import Icon from './Icon';

type TagItem = {
  id: string;
  name: string;
  category?: string;
};

export type TagCategory = {
  id: string;
  name: string;
  tags: TagItem[];
};

type TagSelectionGroup = {
  tagNames: string[];
  maxSelected: number;
};

type TagsFilterModalProps = {
  isOpen: boolean;
  tags: string[];
  onClose: () => void;
  onSave: (newTags: string[]) => void;
  categories: TagCategory[];
  allTags: TagItem[];
  extraCategories?: TagCategory[];
  maxSelected?: number;
  selectionGroups?: TagSelectionGroup[];
  selectionGuide?: string;
  title?: string;
};

const TagsFilterModal = ({
  isOpen,
  tags,
  onClose,
  onSave,
  categories,
  allTags,
  extraCategories = [],
  maxSelected = 5,
  selectionGroups = [],
  selectionGuide,
}: TagsFilterModalProps) => {
  const onCloseRef = useRef<() => void>(() => onClose);
  const handleBottomSheetClose = () => onCloseRef.current();

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={handleBottomSheetClose}
      height='86dvh'
    >
      <TagsFilterModalContent
        tags={tags}
        onClose={onClose}
        onSave={onSave}
        categories={categories}
        allTags={allTags}
        extraCategories={extraCategories}
        maxSelected={maxSelected}
        selectionGroups={selectionGroups}
        selectionGuide={selectionGuide}
        onCloseRef={onCloseRef}
      />
    </BottomSheetModal>
  );
};

type TagsFilterModalContentProps = Omit<TagsFilterModalProps, 'isOpen'> & {
  onCloseRef: MutableRefObject<() => void>;
};

const TagsFilterModalContent = ({
  tags,
  onClose,
  onSave,
  categories,
  extraCategories = [],
  maxSelected = 5,
  selectionGroups = [],
  selectionGuide,
  onCloseRef,
}: TagsFilterModalContentProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(tags);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedTagsRef = useRef<string[]>(selectedTags);

  useEffect(() => {
    selectedTagsRef.current = selectedTags;
  }, [selectedTags]);

  useEffect(() => {
    onCloseRef.current = () => {
      onSave(selectedTagsRef.current);
      onClose();
    };
  }, [onClose, onSave, onCloseRef]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((tag) => tag !== tagName));
      return;
    }
    const selectionGroup = selectionGroups.find((group) =>
      group.tagNames.includes(tagName),
    );
    if (selectionGroup) {
      const tagsInGroup = selectedTags.filter((tag) =>
        selectionGroup.tagNames.includes(tag),
      );
      if (tagsInGroup.length >= selectionGroup.maxSelected) {
        // 단일 선택 그룹은 새 항목을 누르면 기존 항목을 교체해 다시 해제할 필요가 없도록 한다.
        if (selectionGroup.maxSelected === 1) {
          setSelectedTags([
            tagName,
            ...selectedTags.filter((tag) => !selectionGroup.tagNames.includes(tag)),
          ]);
        }
        return;
      }
    }
    if (selectedTags.length >= maxSelected) return;
    setSelectedTags([tagName, ...selectedTags]);
  };

  const removeSelectedTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagName));
  };

  const dedupedCategories = useMemo(() => {
    const seenTagNames = new Set<string>();
    return categories.map(category => ({
      ...category,
      tags: category.tags.filter(tag => {
        if (seenTagNames.has(tag.name)) {
          return false; // 중복이면 제거
        }
        seenTagNames.add(tag.name);
        return true;
      })
    }));
  }, [categories]);

  // 표시할 카테고리 자체를 기준으로 검색하므로 전체 태그 배열을 별도 의존하지 않는다.
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return dedupedCategories;
    return dedupedCategories
      .map((category) => ({
        ...category,
        tags: category.tags.filter((tag) =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((category) => category.tags.length > 0);
  }, [dedupedCategories, searchQuery]);

  const filteredExtraCategories = useMemo(() => {
    if (extraCategories.length === 0) return [];
    if (!searchQuery) return extraCategories;
    return extraCategories
      .map((category) => ({
        ...category,
        tags: category.tags.filter((tag) =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((category) => category.tags.length > 0);
  }, [extraCategories, searchQuery]);

  return (
    <div className='flex h-full w-full min-h-0 flex-col overflow-hidden'>


        <section className='flex w-full flex-col gap-[13px] border-b border-gray-150 px-[25px] pb-[20px] pt-[30px]'>
          <div className='flex items-center gap-[5px]'>
            <span className='text-sb-16-hn text-gray-900'>태그 선택</span>
            <span className='text-r-12-hn text-gray-750'>
              ({selectionGuide ?? `최대 ${maxSelected}개`})
            </span>
          </div>
          <div className='flex h-[30px] gap-[7px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {selectedTags.length !== 0 &&
              selectedTags.map((tag) => (
                <button
                  key={tag}
                  className='flex h-[30px] items-center justify-center gap-[3px] rounded-[5px] border border-primary bg-green-50 px-[15px] py-[5px] text-m-14-hn text-primary'
                >
                  {tag}
                  <Icon name='x' size={16} color='#00A14B' onClick={() => removeSelectedTag(tag)} />
                </button>
              ))}
          </div>
        </section>

        <section className='flex min-h-0 w-full flex-1 flex-col px-[25px] pt-[20px]'>
          <section className='w-full'>
            <div className='relative'>
              <Icon name='search' size={16} color='#A1A1A1' className='absolute left-[19px] top-[12px]' />
              <input
                type='text'
                name='searchTags'
                placeholder='태그 검색'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className='h-[40px] w-full rounded-[30px] bg-gray-150 py-[8px] pl-[52px] pr-[19px] text-r-16 text-gray-750 placeholder:text-gray-650 focus:outline-none'
              />
            </div>
          </section>

          {selectedTags.length < maxSelected ? (
            <section className='min-h-0 flex-1 overflow-y-auto pb-[40px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              <div className='flex w-full flex-col'>
                {filteredExtraCategories.map((category) => (
                  <div
                    key={category.id}
                    className='flex w-full flex-col gap-[15px] border-b border-gray-250 pb-[15px] pt-[20px] last:border-none'
                  >
                    <span className='text-sb-16-hn text-gray-900'>
                      {category.name}
                    </span>
                    <div className='flex flex-wrap gap-[7px]'>
                      {category.tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.name)}
                          className={`h-[30px] rounded-[5px] border px-[15px] py-[5px] ${selectedTags.includes(tag.name)
                              ? 'border-primary bg-green-50 text-m-14-hn text-primary'
                              : 'border-gray-650 bg-white text-r-14-hn text-gray-650'
                            }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className='flex w-full flex-col gap-[15px] border-b border-gray-250 pb-[15px] pt-[20px] last:border-none'
                  >
                    <span className='text-sb-16-hn text-gray-900'>
                      {category.name}
                    </span>
                    <div className='flex flex-wrap gap-[7px]'>
                      {category.tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.name)}
                          className={`h-[30px] rounded-[5px] border px-[15px] py-[5px] ${selectedTags.includes(tag.name)
                              ? 'border-primary bg-green-50 text-m-14-hn text-primary'
                              : 'border-gray-650 bg-white text-r-14-hn text-gray-650'
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
          ) : (
            <div className='flex flex-1 flex-col items-center justify-center gap-[10px] pb-[40px]'>
              <p className='text-r-16 text-gray-650'>최대 {maxSelected}개까지만 선택 가능합니다.</p>
            </div>
          )}
        </section>
    </div>
  );
};

export default TagsFilterModal;
