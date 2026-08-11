import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Category from '../../../components/Category';
import FilterHeader from '../../../components/FilterHeader';
import SortSelector from '../../../components/SortSelector';
import TagsFilterModal from '../../../components/TagsFilterModal';
import { useTagList } from '../../../hooks/useTagList';
import type { QuestionPost } from '../../../types/community';
import WriteButton from '../components/WriteButton';
import { formatTimeAgo } from '../time';

type SortKey = 'recommended' | 'latest' | 'likes' | 'bookmarks';

const sortLabels: Record<SortKey, string> = {
  latest: '최신순',
  recommended: '추천순',
  likes: '좋아요 많은 순',
  bookmarks: '북마크 많은 순',
};

type QuestionTabProps = {
  posts: QuestionPost[];
  sortKey: SortKey;
  onSortChange: (next: SortKey) => void;
  selectedTag: string | null;
  onTagChange: (next: string | null) => void;
};

// 질문 탭: 필터 + 정렬 + 질문글 리스트
const QuestionTab = ({
  posts,
  sortKey,
  onSortChange,
  selectedTag,
  onTagChange,
}: QuestionTabProps) => {
  const [adoptionFilter, setAdoptionFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filterCategories, filterTags } = useTagList();
  const selectedTags = [selectedTag, adoptionFilter].filter(
    (tag): tag is string => Boolean(tag),
  );

  // 일반 태그는 서버에서 조회하고, 합의한 대로 채택 상태만 프론트에서 필터링한다.
  const filteredPosts = useMemo(() => {
    if (!adoptionFilter) return posts;
    return posts.filter((post) =>
      adoptionFilter === '채택 완료' ? post.isAdopted : !post.isAdopted,
    );
  }, [adoptionFilter, posts]);

  return (
    <div className='flex flex-col bg-white' style={{ padding: '20px 25px', gap: '10px' }}>
      {/* 필터 영역: 선택된 태그 표시 + 모달 호출 */}
      <div className='flex flex-wrap items-center gap-[12px]'>
        <div className='flex-1'>
          <FilterHeader
            activeFilters={selectedTags}
            onOpenFilter={() => setIsFilterOpen(true)}
            onRemoveFilter={(tag) => {
              if (tag === adoptionFilter) setAdoptionFilter(null);
              if (tag === selectedTag) onTagChange(null);
            }}
          />
        </div>
        <SortSelector sortKey={sortKey} sortLabels={sortLabels} onChange={onSortChange} />
      </div>

      {/* 질문글 리스트 */}
      <div className='flex flex-col' style={{ gap: '10px' }}>
        {/* TODO: 질문글 리스트 API 연결 */}
        {filteredPosts.map((post) => {
          // 구매 상태에 따라 미리보기/포인트 표시 분기
          const isLocked = post.accessStatus !== 'GRANTED';
          const requiredPoints = post.requiredPoints;
          return (
            <Link key={post.id} to={`/community/post/${post.id}`} className='block'>
            <article
              className='flex flex-col'
              style={{
                gap: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--ColorGray2,rgb(239, 239, 239))',
              }}
            >
              <div className='flex flex-wrap items-center gap-[5px]'>
                <span
                  className={`inline-flex h-[22px] items-center justify-center rounded-[5px] border px-[10px] text-r-12 ${
                    post.isAdopted
                      ? 'border-[var(--ColorGray2,#A1A1A1)] text-[var(--ColorGray2,#A1A1A1)]'
                      : 'border-[var(--ColorMain,#00C56C)] text-[var(--ColorMain,#00C56C)]'
                  }`}
                >
                  {post.isAdopted ? '채택 완료' : '채택 전'}
                </span>
                {post.categories.map((category) => (
                  <Category key={category} label={category} className='h-[20px] px-[6px]' />
                ))}
              </div>

              <div className='flex flex-col' style={{ gap: '7px' }}>
                <div className='flex' style={{ gap: '12px' }}>
                  <div className='flex flex-1 flex-col' style={{ gap: '7px' }}>
                    <div className='flex items-center gap-[6px]'>
                      <span className='text-sb-14 text-gray-900'>{post.author.name}</span>
                      {post.author.major ? (
                        <span className='text-r-12 text-gray-750'>
                          · {post.author.major}
                          {post.author.studentId
                            ? ` ${post.author.studentId}학번`
                            : ''}
                        </span>
                      ) : null}
                    </div>

                    <div className='text-sb-16-hn leading-[150%] text-gray-900'>{post.title}</div>

                    {isLocked ? (
                      <div className='text-r-12 text-[var(--ColorMain,#00C56C)]'>
                        {post.accessStatus === 'LOGIN_REQUIRED'
                          ? '로그인 후 열람 가능'
                          : post.accessStatus === 'INSUFFICIENT_POINTS'
                            ? '포인트가 부족합니다'
                            : `${requiredPoints} P`}
                      </div>
                    ) : (
                      <div className='line-clamp-2 whitespace-pre-wrap text-r-16 text-gray-750'>
                        {post.content}
                      </div>
                    )}
                  </div>

                </div>

                <div className='flex items-center gap-[10px] text-r-12 text-gray-650'>
                  <span>답변 {post.answers}</span>
                  <span className='h-[14px] w-0 border-l border-[var(--ColorGray2,#A1A1A1)]' aria-hidden />
                  <span>북마크 {post.saveCount}</span>
                  <span className='h-[14px] w-0 border-l border-[var(--ColorGray2,#A1A1A1)]' aria-hidden />
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </article>
            </Link>
          );
        })}
      </div>

      <TagsFilterModal
        isOpen={isFilterOpen}
        tags={selectedTags}
        onClose={() => setIsFilterOpen(false)}
        onSave={(next) => {
          const adoptionTags = ['채택 전', '채택 완료'];
          setAdoptionFilter(next.find((tag) => adoptionTags.includes(tag)) ?? null);
          onTagChange(next.find((tag) => !adoptionTags.includes(tag)) ?? null);
          setIsFilterOpen(false);
        }}
        categories={filterCategories}
        allTags={filterTags}
        extraCategories={[
          {
            id: 'community-adoption',
            name: '채택완료',
            tags: [
              { id: 'adopted-pending', name: '채택 전' },
              { id: 'adopted-done', name: '채택 완료' },
            ],
          },
        ]}
        maxSelected={2}
      />

      <WriteButton />
    </div>
  );
};

export default QuestionTab;
