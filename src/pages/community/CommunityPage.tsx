import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Tabs, type TabItem } from '../../components/Tabs';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import InfoTab from './tabs/InfoTab';
import MainTab from './tabs/MainTab';
import QuestionTab from './tabs/QuestionTab';
import { loggedInUserMajor } from '../../mock/community';
import { getCommunityHome, getCommunityPosts } from '../../api/community';
import type { CommunityPostItem, Sort, Tab } from '../../api-types/communityApiTypes';
import { mapToInfoPost, mapToQuestionPost } from '../../utils/communityMapper';
import { useAuthStore } from '../../store/useAuthStore';
import { useTagList } from '../../hooks/useTagList';
import type { AxiosError } from 'axios';
import type { CommunityErrorResponse } from '../../api-types/communityApiTypes';

const tabItems: TabItem[] = [
  { id: 'all', label: '전체' },
  { id: 'info', label: '정보' },
  { id: 'question', label: '질문' },
];

type CommunityListState = {
  items: CommunityPostItem[];
  nextCursorId: number | null;
  nextCursorValue: number | null;
  hasNext: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

const DEFAULT_PAGE_SIZE = 20;

const createInitialState = (): CommunityListState => ({
  items: [],
  nextCursorId: null,
  nextCursorValue: null,
  hasNext: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
});

const dedupePosts = (items: CommunityPostItem[]) => {
  // 정렬 기준 값이 실시간으로 변하면 페이지 사이에 같은 글이 섞일 수 있다.
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.postId)) return false;
    seen.add(item.postId);
    return true;
  });
};

const sanitizeSearchKeyword = (value: string) =>
  // 서버의 검색어 형식 검증(제어문자 금지)과 동일한 값만 남긴다.
  Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && !(code >= 127 && code <= 159);
    })
    .join('');

type SortKey = 'recommended' | 'latest' | 'likes' | 'bookmarks';

type ListQuery = {
  keyword: string;
  sort: Sort;
  tagId?: number;
};

const mapSortKeyToApiSort = (sortKey: SortKey): Sort => {
  if (sortKey === 'latest') return 'LATEST';
  if (sortKey === 'likes') return 'LIKE';
  if (sortKey === 'bookmarks') return 'BOOKMARK';
  return 'RECOMMENDED';
};


export const CommunityPage = () => {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const { mapTagNamesToIds } = useTagList();
  // 탭 선택 및 검색 UI 상태
  const [activeTab, setActiveTab] = useState<string>(() => {
    const stored = sessionStorage.getItem('communityActiveTab');
    return stored ?? tabItems[0].id;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 검색어 정규화
  const normalizedQuery = searchQuery.trim();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);

  const [infoState, setInfoState] = useState<CommunityListState>(() =>
    createInitialState(),
  );
  const [questionState, setQuestionState] = useState<CommunityListState>(() =>
    createInitialState(),
  );
  const [infoSortKey, setInfoSortKey] = useState<SortKey>('latest');
  const [questionSortKey, setQuestionSortKey] = useState<SortKey>('latest');
  const [infoTag, setInfoTag] = useState<string | null>(null);
  const [questionTag, setQuestionTag] = useState<string | null>(null);
  const [mainState, setMainState] = useState<{
    tagId?: number;
    tagName?: string;
    recommendedByTag: CommunityPostItem[];
    recommendedByInterest: CommunityPostItem[];
    waitingQuestions: CommunityPostItem[];
    isLoading: boolean;
    error: string | null;
    hasFetched: boolean;
  }>({
    tagId: undefined,
    tagName: undefined,
    recommendedByTag: [],
    recommendedByInterest: [],
    waitingQuestions: [],
    isLoading: false,
    error: null,
    hasFetched: false,
  });
  const requestSeq = useRef({ INFO: 0, QUESTION: 0 });
  const requestControllersRef = useRef<{
    INFO: AbortController | null;
    QUESTION: AbortController | null;
  }>({ INFO: null, QUESTION: null });
  const lastRequestRef = useRef<Record<'INFO' | 'QUESTION', ListQuery | null>>({
    // 다음 페이지에도 첫 요청의 검색어·정렬·태그를 그대로 재사용한다.
    INFO: null,
    QUESTION: null,
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const infoStateRef = useRef(infoState);
  const questionStateRef = useRef(questionState);

  useEffect(() => {
    infoStateRef.current = infoState;
  }, [infoState]);

  useEffect(() => {
    questionStateRef.current = questionState;
  }, [questionState]);

  const setTabState = useCallback(
    (
      tab: Tab,
      updater: (previous: CommunityListState) => CommunityListState,
    ) => {
      if (tab === 'INFO') {
        setInfoState(updater);
      }
      if (tab === 'QUESTION') {
        setQuestionState(updater);
      }
    },
    [],
  );

  const getTabState = useCallback(
    (tab: Tab) => (tab === 'INFO' ? infoStateRef.current : questionStateRef.current),
    [],
  );

  // 탭별 목록을 서버에서 조회 (페이징 포함)
  const fetchCommunityPosts = useCallback(
    async (
      tab: 'INFO' | 'QUESTION',
      options: { append?: boolean; query?: ListQuery } = {},
    ) => {
      const isAppend = options.append ?? false;
      const state = getTabState(tab);
      const query = isAppend ? lastRequestRef.current[tab] : options.query;
      const numericUserId = Number(userId);

      if (!query || !Number.isInteger(numericUserId) || numericUserId < 1) return;

      if (isAppend && (!state.hasNext || state.isLoadingMore || state.isLoading)) {
        return;
      }

      if (isAppend) {
        // 최신순은 cursorId만, 나머지 정렬은 두 커서를 모두 보내야 한다.
        if (state.nextCursorId == null) return;
        if (query.sort !== 'LATEST' && state.nextCursorValue == null) return;
      } else {
        // 새 검색 조건은 이전 네트워크 요청과 기존 커서를 모두 폐기한다.
        requestControllersRef.current[tab]?.abort();
        lastRequestRef.current[tab] = query;
      }

      const controller = new AbortController();
      requestControllersRef.current[tab] = controller;
      const requestId = ++requestSeq.current[tab];

      setTabState(tab, (previous) => ({
        ...previous,
        isLoading: !isAppend,
        isLoadingMore: isAppend,
        error: null,
        items: isAppend ? previous.items : [],
        nextCursorId: isAppend ? previous.nextCursorId : null,
        nextCursorValue: isAppend ? previous.nextCursorValue : null,
        hasNext: isAppend ? previous.hasNext : false,
      }));

      try {
        const cursorParams = isAppend
          ? query.sort === 'LATEST'
            ? { cursorId: state.nextCursorId ?? undefined }
            : {
                cursorId: state.nextCursorId ?? undefined,
                cursorValue: state.nextCursorValue ?? undefined,
              }
          : {};
        const response = await getCommunityPosts({
          userId: numericUserId,
          tab,
          keyword: query.keyword || undefined,
          sort: query.sort,
          tagId: query.tagId,
          size: DEFAULT_PAGE_SIZE,
          ...cursorParams,
        }, { signal: controller.signal });

        if (requestId !== requestSeq.current[tab]) return;

        const page = response.data;

        setTabState(tab, (previous) => ({
          items: isAppend
            ? [
                ...previous.items,
                ...page.items.filter(
                  (item) => !previous.items.some((post) => post.postId === item.postId),
                ),
              ]
            : dedupePosts(page.items),
          nextCursorId: page.nextCursorId,
          nextCursorValue: page.nextCursorValue,
          hasNext: page.hasNext,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        if (requestId !== requestSeq.current[tab]) return;
        const code = (error as AxiosError<CommunityErrorResponse>).response?.data?.code;
        setTabState(tab, (previous) => ({
          ...previous,
          nextCursorId: isAppend ? null : previous.nextCursorId,
          nextCursorValue: isAppend ? null : previous.nextCursorValue,
          hasNext: isAppend ? false : previous.hasNext,
          isLoading: false,
          isLoadingMore: false,
          error:
            code === 43040
              ? '목록 커서가 만료되어 새로고침이 필요해요.'
              : code === 43041
                ? '검색어를 다시 확인해 주세요.'
                : '커뮤니티 글을 불러오지 못했어요.',
        }));
      }
    },
    [getTabState, setTabState, userId],
  );

  useEffect(
    () => () => {
      requestControllersRef.current.INFO?.abort();
      requestControllersRef.current.QUESTION?.abort();
    },
    [],
  );

  const infoPostsFromApi = useMemo(
    () => infoState.items.map((post) => mapToInfoPost(post)),
    [infoState.items],
  );
  const questionPostsFromApi = useMemo(
    () => questionState.items.map((post) => mapToQuestionPost(post)),
    [questionState.items],
  );
  const recommendedPostsFromApi = useMemo(() => {
    const items =
      mainState.recommendedByTag.length > 0
        ? mainState.recommendedByTag
        : mainState.recommendedByInterest ?? [];
    return items.map((post) => mapToInfoPost(post));
  }, [mainState.recommendedByTag, mainState.recommendedByInterest]);
  const waitingQuestionsFromApi = useMemo(() => {
    const items = mainState.waitingQuestions ?? [];
    return items.map((post) => mapToQuestionPost(post));
  }, [mainState.waitingQuestions]);

  // 미리 가공된 파생 데이터 (추천 게시글, 미답변 질문)을 메모이즈
  const recommendedPosts = useMemo(() => recommendedPostsFromApi, [recommendedPostsFromApi]);

  const unansweredQuestions = useMemo(
    () => waitingQuestionsFromApi.filter((post) => post.answers === 0),
    [waitingQuestionsFromApi],
  );

  // 탭/검색/정렬 변경 시 데이터 로딩
  useEffect(() => {
    sessionStorage.setItem('communityActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    document.body.classList.add('hide-scrollbar');
    document.documentElement.classList.add('hide-scrollbar');
    return () => {
      document.body.classList.remove('hide-scrollbar');
      document.documentElement.classList.remove('hide-scrollbar');
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === 'info') {
        const state = getTabState('INFO');
        const apiSort = mapSortKeyToApiSort(infoSortKey);
        const tagId = infoTag ? mapTagNamesToIds([infoTag])[0] : undefined;
        const query: ListQuery = { keyword: debouncedQuery, sort: apiSort, tagId };
        const lastRequest = lastRequestRef.current.INFO;
        const isNewRequest =
          !lastRequest ||
          lastRequest.keyword !== query.keyword ||
          lastRequest.sort !== query.sort ||
          lastRequest.tagId !== query.tagId;
        if (isNewRequest || (!state.isLoading && state.items.length === 0 && !state.error)) {
          fetchCommunityPosts('INFO', { query });
        }
      }
      if (activeTab === 'question') {
        const state = getTabState('QUESTION');
        const apiSort = mapSortKeyToApiSort(questionSortKey);
        const tagId = questionTag ? mapTagNamesToIds([questionTag])[0] : undefined;
        const query: ListQuery = { keyword: debouncedQuery, sort: apiSort, tagId };
        const lastRequest = lastRequestRef.current.QUESTION;
        const isNewRequest =
          !lastRequest ||
          lastRequest.keyword !== query.keyword ||
          lastRequest.sort !== query.sort ||
          lastRequest.tagId !== query.tagId;
        if (isNewRequest || (!state.isLoading && state.items.length === 0 && !state.error)) {
          fetchCommunityPosts('QUESTION', { query });
        }
      }
      if (activeTab === 'all') {
        const numericUserId = Number(userId);
        if (!Number.isInteger(numericUserId) || numericUserId < 1) return;
        if (
          !mainState.isLoading &&
          !mainState.hasFetched &&
          !mainState.error
        ) {
          setMainState((previous) => ({ ...previous, isLoading: true, error: null }));
          getCommunityHome({ userId: numericUserId })
            .then((response) => {
              const recommendedByTag = response.data.recommendedByTag ?? [];
              const recommendedByInterest = response.data.recommendedByInterest ?? [];
              const waitingQuestions = response.data.waitingQuestions ?? [];
              setMainState({
                tagId: response.data.tagId,
                tagName: response.data.tagName,
                recommendedByTag,
                recommendedByInterest,
                waitingQuestions,
                isLoading: false,
                error: null,
                hasFetched: true,
              });
            })
            .catch(() => {
              setMainState((previous) => ({
                ...previous,
                isLoading: false,
                error: '커뮤니티 메인 정보를 불러오지 못했어요.',
                hasFetched: true,
              }));
            });
        }
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    activeTab,
    debouncedQuery,
    infoSortKey,
    questionSortKey,
    infoTag,
    questionTag,
    fetchCommunityPosts,
    getTabState,
    mapTagNamesToIds,
    userId,
    mainState.isLoading,
    mainState.error,
    mainState.hasFetched,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || activeTab === 'all') return;
    const tab = activeTab === 'info' ? 'INFO' : 'QUESTION';
    const state = getTabState(tab);
    if (!state.hasNext || state.isLoading || state.isLoadingMore) return;

    // 목록 하단 접근 시 hasNext가 남아 있는 경우에만 다음 커서 페이지를 요청한다.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchCommunityPosts(tab, { append: true });
        }
      },
      { rootMargin: '240px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, fetchCommunityPosts, getTabState, infoState, questionState]);

  const retryActiveList = () => {
    // 잘못된 커서 등으로 실패하면 커서 없이 현재 조건의 첫 페이지부터 복구한다.
    const tab = activeTab === 'info' ? 'INFO' : 'QUESTION';
    const query = lastRequestRef.current[tab];
    if (query) void fetchCommunityPosts(tab, { query });
  };

  // 현재 탭에 맞는 화면 반환
  const renderTab = () => {
    if (activeTab === 'info')
      return (
        <InfoTab
          posts={infoPostsFromApi}
          sortKey={infoSortKey}
          onSortChange={setInfoSortKey}
          selectedTag={infoTag}
          onTagChange={setInfoTag}
        />
      );
    if (activeTab === 'question')
      return (
        <QuestionTab
          posts={questionPostsFromApi}
          sortKey={questionSortKey}
          onSortChange={setQuestionSortKey}
          selectedTag={questionTag}
          onTagChange={setQuestionTag}
        />
      );
    return (
      <MainTab
        tagName={mainState.tagName ?? loggedInUserMajor}
        recommendedPosts={recommendedPosts}
        unansweredQuestions={unansweredQuestions}
      />
    );
  };

  return (
    <HeaderLayout
      headerSlot={
        <div className='sticky top-0 z-50 bg-white'>
          {isSearchOpen && activeTab !== 'all' ? (
            <div className='px-[25px]'>
              {/* 검색 전후 헤더 높이를 같게 유지해 탭과 목록이 위아래로 흔들리지 않게 한다. */}
              <div className='mx-auto flex h-[50px] w-full max-w-[720px] items-center gap-[15px]'>
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  aria-label='검색 닫기'
                  className='flex h-[28px] w-[28px] shrink-0 items-center justify-center'
                >
                  <Icon name='search' className='h-[28px] w-[28px]' style={{ color: 'var(--ColorBlack,#202023)' }} />
                </button>
                <input
                  type='text'
                  value={searchQuery}
                  maxLength={100}
                  onChange={(event) =>
                    setSearchQuery(sanitizeSearchKeyword(event.target.value))
                  }
                  placeholder='제목, 내용 검색'
                  className='flex-1 bg-transparent text-r-16 text-[var(--ColorBlack,#202023)] placeholder:text-[var(--ColorGray2,#A1A1A1)] focus:outline-none'
                />
              </div>
            </div>
          ) : (
            <MainHeader
              title='커뮤니티'
              className='h-[50px] min-h-[50px] py-[11px]'
              headerPaddingTop={11}
              leftAction={{
                onClick: () => navigate('/home', { replace: true }),
                ariaLabel: '홈으로 이동',
              }}
              rightActions={
                activeTab === 'all'
                  ? []
                  : [
                    {
                      icon: 'search',
                      onClick: () => setIsSearchOpen(true),
                      ariaLabel: '검색 열기',
                    },
                  ]
              }
            />
          )}
          <Tabs tabs={tabItems} activeId={activeTab} onChange={setActiveTab} />
        </div>
      }
    >
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {renderTab()}
        {activeTab === 'info' && infoState.error ? (
          <div className='flex flex-col items-center gap-[8px] px-[25px] py-[15px] text-center text-r-14 text-[var(--Color_Red,#FF3838)]'>
            <span>{infoState.error}</span>
            <button type='button' onClick={retryActiveList} className='text-m-14 text-[var(--ColorMain,#00C56C)]'>
              처음부터 다시 불러오기
            </button>
          </div>
        ) : null}
        {activeTab === 'question' && questionState.error ? (
          <div className='flex flex-col items-center gap-[8px] px-[25px] py-[15px] text-center text-r-14 text-[var(--Color_Red,#FF3838)]'>
            <span>{questionState.error}</span>
            <button type='button' onClick={retryActiveList} className='text-m-14 text-[var(--ColorMain,#00C56C)]'>
              처음부터 다시 불러오기
            </button>
          </div>
        ) : null}
        {activeTab !== 'all' ? (
          <div ref={loadMoreRef} className='h-[24px]' aria-hidden='true' />
        ) : null}
      </div>
    </HeaderLayout>
  );
};
