import { useCallback, useRef, useMemo, useState } from 'react';
import FilterHeader from '../../../components/FilterHeader';
import SortSelector from '../../../components/SortSelector';
import TagsFilterModal from '../../../components/TagsFilterModal';
import WriteButton from '../components/WriteButton';
import InternalActivityPost from '../../../components/posts/InternalActivityPost';
import ExternalActivityPost from '../../../components/posts/ExternalActivityPost';
import type { ActivityPostTab } from '../../../types/activityPage/activityPageTypes';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import { getActivityList, getTags } from '../../../api/activityApi';
import { mapListItemToActivityPost, sortKeyToApiSortType, tabToCategory,mapApiTagCategoryToUiTagCategory } from '../utils/activityMapper';
import PopUp from '../../../components/Pop-up';
import type { ActivityCategory } from '../../../api-types/activityApiTypes';

type SortInternalKey = 'recommended' | 'latest' | 'bookmarks';
type SortExternalKey = 'recommended' | 'latest' | 'deadline' | 'bookmarks' | 'recruits';

const sortInternalLabels: Record<SortInternalKey, string> = {
  latest: '최신순',
  recommended: '추천순',
  bookmarks: '북마크 많은 순',
};
const sortExternalLabels: Record<SortExternalKey, string> = {
  latest: '최신순',
  recommended: '추천순',
  deadline: '마감임박순',
  bookmarks: '북마크 많은 순',
  recruits: '팀원모집 많은 순',
};

const PAGE_SIZE = 10;

type ActivityListTabProps = {
  isAdmin?: boolean;
  showRecruitStatus?: boolean;
  tab: ActivityPostTab;
  searchQuery?:string;
};

const ActivityListTab = ({
  isAdmin = false,
  showRecruitStatus = false,
  tab,
  searchQuery = '',
}: ActivityListTabProps) => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id ? parseInt(authUser.id) : null;

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortInternalKey, setSortInternalKey] = useState<SortInternalKey>('latest');
  const [sortExternalKey, setSortExternalKey] = useState<SortExternalKey>('latest');

  const isExternalTab = tab === 'external' || tab === 'job';
  const writePath = tab === 'external' ? "/admin/post/external" : "/admin/post/job";

  const category: ActivityCategory = tabToCategory(tab);
  const sortKey = isExternalTab ? sortExternalKey : sortInternalKey;
  const apiSortType = sortKeyToApiSortType(sortKey, isExternalTab);

  //태그 목록 조회
  //scope: 동아리/스터디는 ACTIVITY_RECRUIT (모집 상태 카테고리 추가), 대외활동/취업은 DEFAULT
  const tagScope = showRecruitStatus ? 'ACTIVITY_RECRUIT' : 'DEFAULT';
  const { data: tagData } = useQuery({
    queryKey: ['tags', tagScope],
    queryFn: () => getTags(tagScope),
    staleTime: 1000 * 60 * 10, // 10분 캐시
  });

  // 태그 목록에서 name → id 변환 맵
  const tagNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    tagData?.data.forEach((category) => {
      category.tags.forEach((tag) => {
        if (!map.has(tag.name)) {
          map.set(tag.name, tag.id);
        }
      });
    });
    return map;
  }, [tagData]);

  //TagsFilterModal에 넘길 데이터
  const tagCategories = useMemo(() => {
    if (!tagData?.data) return [];
    
    const categories = tagData.data.map(mapApiTagCategoryToUiTagCategory);
    
    //showRecruitStatus가 true이면 모집 상태 카테고리를 맨 위로
    if (showRecruitStatus) {
      const recruitStatusIndex = tagData.data.findIndex(cat => cat.categoryId === 8);
      if (recruitStatusIndex > 0) {
        const reordered = [...tagData.data];
        const recruitStatusCategory = reordered.splice(recruitStatusIndex, 1)[0];
        
        //모집 태그 순서 변경
        const modifiedRecruitStatus = {
          ...recruitStatusCategory,
          tags: [...recruitStatusCategory.tags].reverse(),
        };
        
        reordered.unshift(modifiedRecruitStatus);
        return reordered.map(mapApiTagCategoryToUiTagCategory);
      }
    }
    
    return categories;
  }, [tagData, showRecruitStatus]);

  const allTags = useMemo(
    () => tagCategories.flatMap((c) => c.tags),
    [tagCategories],
  );

  // selectedTags(name[]) → tagIds(number[]) 변환
  const statusTagNames = ['모집 중', '모집 완료'];
  const tagIds = useMemo(
    () =>
      selectedTags
        .filter((name) => !statusTagNames.includes(name))
        .map((name) => tagNameToIdMap.get(name))
        .filter((id): id is number => id !== undefined),
    [selectedTags, tagNameToIdMap],
  );

  // ===== 활동 목록 조회 (무한스크롤) =====
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['activityList', tab, apiSortType, searchQuery, tagIds],
    queryFn: ({ pageParam = 0 }) =>
      getActivityList({
        userId: userId!,
        category,
        sortType: apiSortType,
        title: searchQuery || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        page: pageParam as number,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.last) return undefined;
      return lastPage.data.number + 1;
    },
    enabled: !!userId,
    initialPageParam: 0,
  });

  const allPosts = useMemo(() => {
    if (!data) return [];
    let posts = data.pages.flatMap((page) =>
      page.data.content.map((item) => mapListItemToActivityPost(item, category)),
    );

    if (isExternalTab && sortExternalKey === 'deadline') {
      const now = new Date();
      const activePosts = posts.filter(post => {
        // CLOSED 상태는 아래로
        if (post.status === 'CLOSED') return false;
        // 마감일 없으면 아래로
        if (!post.deadline) return false;
        // 마감 지났으면 아래로
        const deadline = new Date(post.deadline);
        return deadline >= now;
      });
      const expiredPosts = posts.filter(post => {
        if (post.status === 'CLOSED') return true;
        if (!post.deadline) return true;
        const deadline = new Date(post.deadline);
        return deadline < now;
      });
      posts = [...activePosts, ...expiredPosts];
    }
    
    return posts;
  }, [data, category, isExternalTab, sortExternalKey]);

  // 모집 상태 태그는 서버 파라미터가 없으므로 클라이언트 필터로 처리
  const filteredPosts = useMemo(() => {
    if (!showRecruitStatus) return allPosts;

    const selectedStatusTags = selectedTags.filter((tag) => statusTagNames.includes(tag));
    if (selectedStatusTags.length === 0 || selectedStatusTags.length === 2) return allPosts;

    return allPosts.filter((post) => {
      const label = post.status === 'CLOSED' ? '모집 완료' : '모집 중';
      return selectedStatusTags[0] === label;
    });
  }, [allPosts, selectedTags, showRecruitStatus]);

  // ===== 무한 스크롤 감지 =====
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  if (!userId || isError) {
    return (
      <PopUp
        type="error"
        title="일시적 오류"
        content="잠시 후 다시 시도해주세요."
        isOpen={true}
        rightButtonText="확인"
        onClick={() => navigate(-1)}
      />
    );
  }

  return (
    <div className='flex flex-col bg-white' style={{ padding: '20px 0px', gap: '10px' }}>
      <div className='flex flex-wrap items-center gap-[12px] px-[25px]'>
        <div className='flex-1'>
          <FilterHeader
            activeFilters={selectedTags}
            onOpenFilter={() => setIsFilterOpen(true)}
            onRemoveFilter={(tag) =>
              setSelectedTags((prev) => prev.filter((item) => item !== tag))
            }
          />
        </div>
        
        {!isExternalTab ? 
          <SortSelector sortKey={sortInternalKey} sortLabels={sortInternalLabels} onChange={setSortInternalKey} /> :
          <SortSelector sortKey={sortExternalKey} sortLabels={sortExternalLabels} onChange={setSortExternalKey}/>
        }
      </div>

      <div className='flex flex-col'>
        {!isLoading && filteredPosts.length === 0 ? (
          <div className='flex justify-center py-[40px]'>
            <p className='text-r-14-hn text-gray-650'>게시글이 없습니다.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isExternalPost = post.tab === 'external' || post.tab === 'job';
            if (isExternalPost) {
              return <ExternalActivityPost key={post.id} post={post} />;
            }
            return (
              <InternalActivityPost
                key={post.id}
                post={post}
                showRecruitStatus={showRecruitStatus}
              />
            );
          })
        )}
        <div ref={loadMoreRef} className='h-[1px]' />
        {isFetchingNextPage && (
          <PopUp
            type="loading"
            isOpen={true}
          />
        )}
      </div>

      <TagsFilterModal
        isOpen={isFilterOpen}
        tags={selectedTags}
        onClose={() => setIsFilterOpen(false)}
        onSave={(next) => {
          setSelectedTags(next);
          setIsFilterOpen(false);
        }}
        categories={tagCategories}
        allTags={allTags}
        selectionGroups={
          showRecruitStatus
            ? [{ tagNames: statusTagNames, maxSelected: 1 }]
            : []
        }
      />

      {isAdmin
      ? (isExternalTab ? <WriteButton onClick={() => navigate(writePath)}/> : null)
      : (!isExternalTab ? <WriteButton /> : null)}

    </div>
  );
};

export default ActivityListTab;
