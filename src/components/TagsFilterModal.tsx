import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BottomSheetModal from './BottomSheetModal/BottomSheetModal';

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

type TagsFilterModalProps = {
  isOpen: boolean;
  tags: string[];
  onClose: () => void;
  onSave: (newTags: string[]) => void;
  categories: TagCategory[];
  allTags: TagItem[];
  extraCategories?: TagCategory[];
  maxSelected?: number;
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
            <span className='text-r-12-hn text-gray-750'>(최대 {maxSelected}개)</span>
          </div>
          <div className='flex h-[30px] gap-[7px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {selectedTags.length !== 0 &&
              selectedTags.map((tag) => (
                <button
                  key={tag}
                  className='flex h-[30px] items-center justify-center gap-[3px] rounded-[5px] border border-primary bg-green-50 px-[15px] py-[5px] text-m-14-hn text-primary'
                >
                  {tag}
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    className='block shrink-0'
                    onClick={() => removeSelectedTag(tag)}
                  >
                    <path
                      d='M4 12L12 4M4 4L12 12'
                      stroke='#00C56C'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </button>
              ))}
          </div>
        </section>

        <section className='flex min-h-0 w-full flex-1 flex-col px-[25px] pt-[20px]'>
          <section className='w-full'>
            <div className='relative'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 20 20'
                fill='none'
                className='absolute left-[19px] top-[50%] translate-y-[-50%]'
              >
                <path
                  d='M18.7508 18.7508L13.5538 13.5538M13.5538 13.5538C14.9604 12.1472 15.7506 10.2395 15.7506 8.25028C15.7506 6.26108 14.9604 4.35336 13.5538 2.94678C12.1472 1.54021 10.2395 0.75 8.25028 0.75C6.26108 0.75 4.35336 1.54021 2.94678 2.94678C1.54021 4.35336 0.75 6.26108 0.75 8.25028C0.75 10.2395 1.54021 12.1472 2.94678 13.5538C4.35336 14.9604 6.26108 15.7506 8.25028 15.7506C10.2395 15.7506 12.1472 14.9604 13.5538 13.5538Z'
                  stroke='#646464'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
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
