import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AlumniApiResponse } from '../../api-types/alumniApiTypes';
import { getAlumniList } from '../../api/alumni';
import Button from '../../components/Button';
import Category from '../../components/Category';
import FilterHeader from '../../components/FilterHeader';
import Icon from '../../components/Icon';
import PopUp from '../../components/Pop-up';
import TagsFilterModal from '../../components/TagsFilterModal';
import { useTagList } from '../../hooks/useTagList';
import { FullLayout } from '../../layouts/FullLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { mapAlumniApiListToProfiles } from '../../utils/alumniMapper';
import AlumniCoffeeChatButton from './components/AlumniCoffeeChatButton';
import { useAlumniChatRoom } from './hooks/useAlumniChatRoom';
import defaultImg from "../../assets/image/defaultProfileImg.png"
import { useAuthStore } from '../../store/useAuthStore';
import { getAlumniSearchError } from './utils/alumniSearchError';

const profilePlaceholder = defaultImg;
const ALUMNI_PAGE_SIZE = 20;
type AlumniSearchPageData = AlumniApiResponse['data'];

export const AlumniSearchPage = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const meUserId = authUser?.id ? parseInt(authUser.id) : null;

  const [chatRoomError, setChatRoomError] = useState<{ title: string; content: string } | null>(null);
  const { openChatRoom, pendingOpponentId } = useAlumniChatRoom(setChatRoomError);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { filterCategories, filterTags, mapTagNamesToIds } = useTagList();
  const trimmedSearchTerm = searchTerm.trim();
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();
  const selectedTagIds = useMemo(
    () => mapTagNamesToIds(selectedTags),
    [mapTagNamesToIds, selectedTags],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(trimmedSearchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [trimmedSearchTerm]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending,
    isPlaceholderData,
    refetch,
  } = useInfiniteQuery<AlumniSearchPageData, Error, InfiniteData<AlumniSearchPageData>, readonly unknown[], number>({
    queryKey: ['alumniSearch', meUserId, debouncedSearchTerm, selectedTagIds],
    initialPageParam: 0,
    // 다른 계정의 결과를 새 세션에 표시하지 않고, 같은 계정의 검색 전환 중에는 기존 목록을 유지한다.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === meUserId ? previousData : undefined,
    retry: false,
    queryFn: async ({ pageParam, signal }) => {
      const response = await getAlumniList({
        userId: meUserId ?? undefined,
        name: debouncedSearchTerm || undefined,
        tags: selectedTagIds,
        page: pageParam,
        size: ALUMNI_PAGE_SIZE,
        signal,
      });
      return response.data;
    },
    // 화면에서 걸러진 카드 수와 무관하게 서버가 반환한 페이지 번호와 마지막 페이지 여부를 따른다.
    getNextPageParam: (lastPage, _pages, pageParam) =>
      !lastPage.last && lastPage.number === pageParam ? pageParam + 1 : undefined,
  });

  const isDebouncing = trimmedSearchTerm !== debouncedSearchTerm;
  const isSearching = isDebouncing || isPending || isPlaceholderData;
  const searchError = !data && error && !isDebouncing ? getAlumniSearchError(error) : null;
  const canLoadMore = !isSearching && hasNextPage;
  const isInitialLoading = !isDebouncing && isPending && !data && !debouncedSearchTerm && selectedTags.length === 0;
  const alumniItems = useMemo(() => {
    if (!data) return [];
    const itemsById = new Map(data.pages.flatMap((page) =>
      page.content.map((item) => [item.userId, item] as const),
    ));
    return mapAlumniApiListToProfiles([...itemsById.values()]);
  }, [data]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !canLoadMore || isFetching || isFetchNextPageError) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void fetchNextPage({ cancelRefetch: false });
    }, { rootMargin: '0px 0px 240px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, fetchNextPage, isFetching, isFetchNextPageError]);

  // 선택된 태그만 만족하는 동문만 추립니다.
  const visibleList = useMemo(() => {
    let nextList = alumniItems;
    if (selectedTags.length > 0) {
      nextList = nextList.filter((alumni) =>
        selectedTags.every((tag) => alumni.categories.includes(tag)),
      );
    }
    if (!normalizedSearchTerm) return nextList;
    return nextList.filter((alumni) => {
      const name = alumni.author.name.toLowerCase();
      const major = alumni.author.major.toLowerCase();
      const intro = alumni.intro.toLowerCase();
      const matchesTag = alumni.categories.some((category) =>
        category.toLowerCase().includes(normalizedSearchTerm),
      );
      return (
        name.includes(normalizedSearchTerm) ||
        major.includes(normalizedSearchTerm) ||
        intro.includes(normalizedSearchTerm) ||
        matchesTag
      );
    });
  }, [alumniItems, normalizedSearchTerm, selectedTags]);


  return (
    <FullLayout 
      headerSlot={<MainHeader 
        title='동문 찾기'
        leftIcon='empty'
         />}
    >
      {/* 검색/필터/카드 리스트 영역 */}
      <div
        className='flex w-full flex-col bg-white [padding:clamp(16px,5cqw,20px)_clamp(18px,7cqw,25px)] [gap:clamp(14px,4cqw,20px)]'
        style={
          {
            '--bottom-sheet-safe-padding': 'calc(50px + env(safe-area-inset-bottom))',
          } as React.CSSProperties
        }
      >
        {/* 검색 입력 영역 */}
        <div className='flex w-full min-w-0 items-center rounded-[30px] bg-[var(--ColorGray1,#ECECEC)] [padding:clamp(6px,2.2cqw,8px)_clamp(14px,5cqw,19px)] [gap:clamp(10px,3.2cqw,15px)]'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            aria-hidden
            className='shrink-0'
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
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='동문 이름, 태그로 검색'
            className='w-0 min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#A1A1A1] text-r-16 text-[color:var(--ColorGray3,#646464)]'
          />
        </div>

        {/* 필터/정렬 컨트롤 영역 */}
        <div className='flex w-full flex-wrap items-center justify-between [gap:clamp(9px,3cqw,13px)]'>
          <FilterHeader
            activeFilters={selectedTags}
            onOpenFilter={() => setIsFilterOpen(true)}
            onRemoveFilter={(tag) =>
              setSelectedTags((prev) => prev.filter((item) => item !== tag))
            }
          />
        </div>

        {/* 동문 카드 리스트 */}
        <div className='flex flex-col gap-[5px]'>
          {searchError && (
            <div role='alert' className='flex flex-col gap-[10px] py-[20px] text-center'>
              <p className='text-sb-16-hn'>{searchError.title}</p>
              <p className='text-r-14 text-[var(--ColorGray3,#646464)]'>{searchError.content}</p>
              <Button
                type='button'
                label={isSearching ? '검색 중' : '다시 시도'}
                font='sb-14'
                disabled={isSearching}
                onClick={() => void refetch()}
              />
            </div>
          )}
          {!searchError && !isSearching && !hasNextPage && visibleList.length === 0 && (
            <p className='py-[20px] text-center text-r-14'>검색 조건에 맞는 동문이 없습니다.</p>
          )}
          {!searchError && visibleList.map((alumni) => (
            <div
              key={alumni.id}
              className='flex min-h-[161px] flex-col gap-[20px] bg-white border border-gray-150 rounded-[12px] opacity-100 [padding:clamp(12px,4cqw,15px)]'
            >
              {/* 카드 본문은 상세 페이지로 이동하는 링크 */}
              <Link to={`/alumni/profile/${alumni.id}`} className='flex flex-col gap-[20px]'>
                {/* 1그룹: 프로필/이름/학과/학번 + 더보기 아이콘 */}
                <section className='flex justify-between'>
                  <div className='flex items-center'>
                    <div className='flex items-center gap-[13px]'>
                      <img
                        src={alumni.profileImage ?? profilePlaceholder}
                        alt={`${alumni.author.name} 프로필`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = profilePlaceholder;
                        }}
                        className='h-[clamp(48px,14cqw,60px)] w-[clamp(48px,14cqw,60px)] shrink-0 rounded-full object-cover'
                      />

                      <div className='flex min-w-0 flex-col gap-[3px]'>
                        <div className='text-sb-16-hn text-[color:var(--ColorBlack,#202023)]'>
                          {alumni.author.name}
                        </div>
                        <div className='text-r-14 text-[color:var(--ColorGray2,#A1A1A1)]'>
                          {alumni.author.major} {alumni.author.studentId}학번
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='py-[9px]'><Icon name='arrow_right' className='h-6 w-6' /></div> 
                </section>

                {/* 2그룹: 카테고리와 소개글 */}
                <div
                  className='flex min-w-0 flex-col gap-[10px] pl-[7px]'
                >
                  <div className='flex flex-wrap gap-[5px]'>
                    {alumni.categories
                      .filter((category): category is string => Boolean(category))
                      .map((category) => (
                        <Category key={`${alumni.id}-${category}`} label={category} />
                      ))}
                  </div>

                  <p className='line-clamp-3 whitespace-pre-line text-r-14 text-[color:var(--ColorGray3,#646464)] tracking-[-0.56px]'>
                    {alumni.intro}
                  </p>
                </div>
              </Link>

              {/* 기존 대화가 있으면 새 커피챗 요청보다 채팅방 이동을 우선한다. */}
              {(alumni.hasChat || alumni.privacy.openToCoffeeChat) && (
                <AlumniCoffeeChatButton
                  hasChat={alumni.hasChat}
                  alumniName={alumni.author.name}
                  isPending={pendingOpponentId === alumni.userId}
                  disabled={alumni.hasChat && pendingOpponentId !== undefined}
                  onClick={() => {
                    if (alumni.hasChat) {
                      openChatRoom(alumni.userId);
                    } else {
                      navigate(`/alumni/profile/${alumni.id}?coffeeChat=1`);
                    }
                  }}
                />
              )}
            </div>
          ))}
          {canLoadMore && <div ref={loadMoreRef} className='h-px' aria-hidden />}
          {isFetchingNextPage && (
            <p role='status' className='py-[10px] text-center text-r-14'>동문을 더 불러오는 중이에요.</p>
          )}
          {isFetchNextPageError && canLoadMore && (
            <div className='flex flex-col items-center gap-[10px] py-[10px]'>
              <p role='alert' className='text-r-14'>다음 동문 목록을 불러오지 못했어요.</p>
              <Button
                type='button'
                label='다시 시도'
                font='sb-14'
                disabled={isFetching}
                onClick={() => void fetchNextPage({ cancelRefetch: false })}
              />
            </div>
          )}
        </div>
      </div>

      {/* 필터 모달 */}
      <TagsFilterModal
        isOpen={isFilterOpen}
        tags={selectedTags}
        onClose={() => setIsFilterOpen(false)}
        onSave={(next) => {
          setSelectedTags(next);
          setIsFilterOpen(false);
        }}
        categories={filterCategories}
        allTags={filterTags}
      />
      <PopUp isOpen={isInitialLoading} type="loading" />
      {chatRoomError && (
        <PopUp
          isOpen
          type='error'
          title={chatRoomError.title}
          content={chatRoomError.content}
          onClick={() => setChatRoomError(null)}
        />
      )}
    </FullLayout>
  );
};
