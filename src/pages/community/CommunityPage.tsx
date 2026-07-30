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

type SortKey = 'recommended' | 'latest' | 'likes' | 'bookmarks';

const mapSortKeyToApiSort = (sortKey: SortKey): Sort => {
  if (sortKey === 'latest') return 'LATEST';
  if (sortKey === 'likes') return 'LIKE';
  if (sortKey === 'bookmarks') return 'BOOKMARK';
  return 'RECOMMENDED';
};


export const CommunityPage = () => {
  const navigate = useNavigate();
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
  const lastRequestRef = useRef({
    INFO: { keyword: '', sort: 'LATEST' as Sort },
    QUESTION: { keyword: '', sort: 'LATEST' as Sort },
  });
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
      tab: Tab,
      options: { append?: boolean; keyword?: string; sort?: Sort } = {},
    ) => {
      if (tab === 'ALL') return;

      const isAppend = options.append ?? false;
      const keyword = options.keyword ?? undefined;
      const sort = options.sort ?? undefined;
      const state = getTabState(tab);

      if (isAppend && (!state.hasNext || state.isLoadingMore || state.isLoading)) {
        return;
      }

      if (!isAppend && sort) {
        lastRequestRef.current[tab] = { keyword: keyword ?? '', sort };
      }

      const requestId = ++requestSeq.current[tab];

      setTabState(tab, (previous) => ({
        ...previous,
        isLoading: !isAppend,
        isLoadingMore: isAppend,
        error: null,
        items: isAppend ? previous.items : [],
      }));

      try {
        const response = await getCommunityPosts({
          tab,
          keyword,
          sort,
          size: DEFAULT_PAGE_SIZE,
          cursorId: isAppend ? state.nextCursorId ?? undefined : undefined,
          cursorValue: isAppend ? state.nextCursorValue ?? undefined : undefined,
        });

        if (requestId !== requestSeq.current[tab]) return;

        const page = response.data;

        setTabState(tab, (previous) => ({
          items: isAppend ? [...previous.items, ...page.items] : page.items,
          nextCursorId: page.nextCursorId,
          nextCursorValue: page.nextCursorValue,
          hasNext: page.hasNext,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        }));
      } catch {
        if (requestId !== requestSeq.current[tab]) return;
        setTabState(tab, (previous) => ({
          ...previous,
          isLoading: false,
          isLoadingMore: false,
          error: '커뮤니티 글을 불러오지 못했어요.',
        }));
      }
    },
    [getTabState, setTabState],
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
        const lastRequest = lastRequestRef.current.INFO;
        const isNewRequest =
          lastRequest.keyword !== debouncedQuery || lastRequest.sort !== apiSort;
        if (isNewRequest || (!state.isLoading && state.items.length === 0 && !state.error)) {
          fetchCommunityPosts('INFO', { keyword: debouncedQuery, sort: apiSort });
        }
      }
      if (activeTab === 'question') {
        const state = getTabState('QUESTION');
        const apiSort = mapSortKeyToApiSort(questionSortKey);
        const lastRequest = lastRequestRef.current.QUESTION;
        const isNewRequest =
          lastRequest.keyword !== debouncedQuery || lastRequest.sort !== apiSort;
        if (isNewRequest || (!state.isLoading && state.items.length === 0 && !state.error)) {
          fetchCommunityPosts('QUESTION', { keyword: debouncedQuery, sort: apiSort });
        }
      }
      if (activeTab === 'all') {
        if (
          !mainState.isLoading &&
          !mainState.hasFetched &&
          !mainState.error
        ) {
          setMainState((previous) => ({ ...previous, isLoading: true, error: null }));
          getCommunityHome()
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
    fetchCommunityPosts,
    getTabState,
    mainState.isLoading,
    mainState.error,
    mainState.hasFetched,
  ]);

  // 현재 탭에 맞는 화면 반환
  const renderTab = () => {
    if (activeTab === 'info')
      return (
        <InfoTab
          posts={infoPostsFromApi}
          sortKey={infoSortKey}
          onSortChange={setInfoSortKey}
        />
      );
    if (activeTab === 'question')
      return (
        <QuestionTab
          posts={questionPostsFromApi}
          sortKey={questionSortKey}
          onSortChange={setQuestionSortKey}
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
              <div className='mx-auto flex w-full max-w-[720px] items-center gap-[15px] py-[10px]'>
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
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='제목, 내용, 태그, 검색'
                  className='flex-1 bg-transparent text-r-16 text-[var(--ColorBlack,#202023)] placeholder:text-[var(--ColorGray2,#A1A1A1)] focus:outline-none'
                />
              </div>
            </div>
          ) : (
            <MainHeader
              title='커뮤니티'
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
      <div>{renderTab()}</div>
    </HeaderLayout>
  );
};
