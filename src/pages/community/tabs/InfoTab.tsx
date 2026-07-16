import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Category from '../../../components/Category';
import FilterHeader from '../../../components/FilterHeader';
import Icon from '../../../components/Icon';
import SortSelector from '../../../components/SortSelector';
import TagsFilterModal from '../../../components/TagsFilterModal';
import { useTagList } from '../../../hooks/useTagList';
import type { InfoPost } from '../../../types/community';
import WriteButton from '../components/WriteButton';
import { formatTimeAgo } from '../time';

type SortKey = 'recommended' | 'latest' | 'likes' | 'bookmarks';

const sortLabels: Record<SortKey, string> = {
  latest: '최신순',
  recommended: '추천순',
  likes: '좋아요 많은 순',
  bookmarks: '북마크 많은 순',
};

type InfoTabProps = {
  posts: InfoPost[];
  sortKey: SortKey;
  onSortChange: (next: SortKey) => void;
  isAdmin?: boolean;
};

// 정보 탭: 필터 + 정렬 + 정보글 리스트
const InfoTab = ({ posts, sortKey, onSortChange, isAdmin = false }: InfoTabProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filterCategories, filterTags } = useTagList();

  // 선택된 태그 기준으로 목록 필터링
  const filteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return posts;
    return posts.filter((post) =>
      selectedTags.every((tag) => post.categories.includes(tag)),
    );
  }, [posts, selectedTags]);

  return (
    <div
      className='flex flex-col bg-white'
      style={{ padding: '20px 25px', gap: '10px' }}
    >
      {/* 필터 영역: 선택된 태그 표시 + 모달 호출 */}
      <div className='flex flex-wrap items-center gap-[12px]'>
        <div className='flex-1'>
          <FilterHeader
            activeFilters={selectedTags}
            onOpenFilter={() => setIsFilterOpen(true)}
            onRemoveFilter={(tag) =>
              setSelectedTags((prev) => prev.filter((item) => item !== tag))
            }
          />
        </div>
        <SortSelector sortKey={sortKey} sortLabels={sortLabels} onChange={onSortChange} />
      </div>

      {/* 정보글 리스트 */}
      <div className='flex flex-col' style={{ gap: '10px' }}>
        {/* TODO: 정보글 리스트 API 연결 */}
        {filteredPosts.map((post) => (
          <Link key={post.id} to={`/community/post/${post.id}`} className='block'>
            <article
              className='flex flex-col'
              style={{
                gap: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--ColorGray2,rgb(239, 239, 239))',
              }}
            >
              <div className='flex flex-wrap items-center' style={{ gap: '5px' }}>
                {post.categories.map((category) => (
                  <Category key={category} label={category} className='h-[20px] px-[6px]' />
                ))}
              </div>

              <div className='flex flex-col' style={{ gap: '7px' }}>
                <div className='flex' style={{ gap: '12px' }}>
                  <div className='flex flex-1 flex-col' style={{ gap: '5px' }}>
                  <div className='flex items-center gap-[6px]'>
                    <span className='text-sb-14 text-gray-900'>{post.author.name}</span>
                    <span className='text-r-12 text-gray-750'>
                      · {post.author.major}
                      {post.author.studentId
                        ? ` ${post.author.studentId}학번`
                        : ''}
                    </span>
                  </div>

                  <div className='text-sb-16-hn leading-[150%] text-gray-900'>{post.title}</div>

                  <div className='line-clamp-2 whitespace-pre-wrap text-r-16 text-gray-750'>
                    {post.content}
                  </div>
                  </div>

                  {post.thumbnailUrl && (
                    <div className='h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[8px] bg-[var(--ColorGray1,#D5D5D5)]'>
                      <img
                        src={post.thumbnailUrl}
                        alt=''
                        className='h-full w-full object-cover'
                      />
                    </div>
                  )}
                </div>

                <div className='flex items-center gap-[10px] text-r-12 text-gray-650'>
                  <span className='flex items-center gap-[4px]'>
                    <Icon name='like' className='h-[12px] w-[12px]' />
                    {post.likes}
                  </span>
                  <span className='flex items-center gap-[4px]'>
                    <Icon name='comment' className='h-[12px] w-[12px]' />
                    {post.comments}
                  </span>
                  <span className='flex items-center gap-[4px]'>
                    <Icon name='save' className='h-[12px] w-[12px]' />
                    {post.saveCount}
                  </span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

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

      <WriteButton hasBottomNav={isAdmin}/>
    </div>
  );
};

export default InfoTab;
