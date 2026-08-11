import { useState } from 'react';
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
  selectedTag: string | null;
  onTagChange: (next: string | null) => void;
};

// 정보 탭: 필터 + 정렬 + 정보글 리스트
const InfoTab = ({ posts, sortKey, onSortChange, selectedTag, onTagChange }: InfoTabProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filterCategories, filterTags } = useTagList();
  // 목록 API가 tagId 하나만 받으므로 정보 탭의 일반 태그는 단일 선택으로 제한한다.
  const selectedTags = selectedTag ? [selectedTag] : [];

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
            onRemoveFilter={() => onTagChange(null)}
          />
        </div>
        <SortSelector sortKey={sortKey} sortLabels={sortLabels} onChange={onSortChange} />
      </div>

      {/* 정보글 리스트 */}
      <div className='flex flex-col' style={{ gap: '10px' }}>
        {/* TODO: 정보글 리스트 API 연결 */}
        {posts.map((post) => {
          const isGranted = post.accessStatus === 'GRANTED';
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

                  {isGranted ? (
                    <div className='line-clamp-2 whitespace-pre-wrap text-r-16 text-gray-750'>
                      {post.content}
                    </div>
                  ) : (
                    <div className='text-r-12 text-[var(--ColorMain,#00C56C)]'>
                      {post.accessStatus === 'LOGIN_REQUIRED'
                        ? '로그인 후 열람 가능'
                        : post.accessStatus === 'INSUFFICIENT_POINTS'
                          ? '포인트가 부족합니다'
                          : `${post.requiredPoints ?? 0} P`}
                    </div>
                  )}
                  </div>

                  {isGranted && post.thumbnailUrl && (
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
                    <Icon name='thumbs_up_stroke' className='h-[12px] w-[12px]' />
                    {post.likes}
                  </span>
                  <span className='flex items-center gap-[4px]'>
                    <Icon name='comment' className='h-[12px] w-[12px]' />
                    {post.comments}
                  </span>
                  <span className='flex items-center gap-[4px]'>
                    <Icon name='bookmark_stroke' className='h-[12px] w-[12px]' />
                    {post.saveCount}
                  </span>
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
          onTagChange(next[0] ?? null);
          setIsFilterOpen(false);
        }}
        categories={filterCategories}
        allTags={filterTags}
        maxSelected={1}
      />

      <WriteButton />
    </div>
  );
};

export default InfoTab;
