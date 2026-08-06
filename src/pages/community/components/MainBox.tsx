import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import Category from '../../../components/Category';
import Icon from '../../../components/Icon';
import type { InfoPost } from '../../../types/community';
import { formatTimeAgo } from '../time';

type MainBoxPost = InfoPost & {
  authorProfileImageUrl?: string;
  postImageUrl?: string;
};

type MainBoxProps = {
  post: MainBoxPost;
};

// 메인 캐러셀에서 사용하는 요약 카드
const MainBox = ({ post }: MainBoxProps) => {
  const postImageUrl = post.postImageUrl ?? post.imageUrl;

  return (
    <Link to={`/community/post/${post.id}`} className='block'>
      <Card
        width="100%"
        height="260px"
        className="flex flex-col justify-between"
        style={{ padding: '20px'}}
      >
        <div className='flex flex-col' style={{ gap: '15px' }}>
          <div className='flex flex-col' style={{ gap: '10px' }}>
            <div className='flex' style={{ gap: '15px' }}>
              {post.authorProfileImageUrl ? (
                <img
                  src={post.authorProfileImageUrl}
                  alt={`${post.author.name} 프로필`}
                  className='h-[48px] w-[48px] rounded-full object-cover'
                />
              ) : (
                <div
                  className='h-[48px] w-[48px] rounded-full'
                  style={{ backgroundColor: '#D5D5D5' }}
                  aria-hidden
                />
              )}
              <div className='flex flex-col justify-center' style={{ gap: '3px' }}>
                <div className='text-sb-14' style={{ color: 'var(--ColorBlack, #202023)' }}>
                  {post.author.name}
                </div>
                <div className='text-r-12' style={{ color: 'var(--ColorGray3, #646464)' }}>
                  {post.author.major}
                  {post.author.studentId
                    ? ` ${post.author.studentId}학번`
                    : ''}
                </div>
              </div>
            </div>

            <div className='flex' style={{ gap: '15px' }}>
              <div className='flex flex-1 flex-col' style={{ gap: '7px' }}>
                <div
                  className='text-sb-16-hn'
                  style={{
                    color: 'var(--ColorBlack, #202023)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {post.title}
                </div>
                <div className='line-clamp-2 whitespace-pre-wrap text-r-14' style={{ color: 'var(--ColorGray3, #646464)' }}>
                  {post.content}
                </div>
              </div>
              {postImageUrl && (
                <img
                  src={postImageUrl}
                  alt=''
                  className='h-[80px] w-[80px] rounded-[8px] object-cover'
                />
              )}
            </div>
          </div>

          <div className='flex flex-wrap items-center' style={{ gap: '5px' }}>
            {post.categories.map((category) => (
              <Category key={category} label={category} className='h-[20px] px-[6px]' />
            ))}
          </div>
        </div>

        <div className='flex items-center justify-between text-r-12' style={{ color: 'var(--ColorGray3, #646464)' }}>
          <div className='flex items-center' style={{ gap: '10px' }}>
            <span className='flex items-center gap-[4px]'>
              <Icon name='thumbs_up_stroke' className='h-[12px] w-[12px]' />
              {post.likes}
            </span>
            <span className='flex items-center gap-[4px]'>
              <Icon name='comment' className='h-[12px] w-[12px]' />
              {post.comments}
            </span>
          </div>
          <span>{formatTimeAgo(post.createdAt)}</span>
        </div>
      </Card>
    </Link>
  );
};

export type { MainBoxPost };
export default MainBox;
