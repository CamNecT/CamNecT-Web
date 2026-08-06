import { useNavigate } from 'react-router-dom';
import type { ActivityPost } from '../../types/activityPage/activityPageTypes';
import { formatTimeAgo } from '../../utils/formatDate';
import replaceImg from "../../assets/image/replaceImg.png"
import PressableMotion from '../PressableMotion';

const REPLACE_IMAGE = replaceImg;

type InternalActivityPostProps = {
  post: ActivityPost;
  showRecruitStatus?: boolean;
};

const InternalActivityPost = ({ 
  post, 
  showRecruitStatus = false,
}: InternalActivityPostProps) => {
  const navigate = useNavigate();
  const thumbnailUrl = post.thumbnailUrl ?? post.postImages?.[0];

  return (
    <PressableMotion
      as='button'
      intensity='soft'
      className='flex flex-col gap-[10px] px-[25px] py-[20px] border-b border-gray-150 text-left w-full'
      onClick={() => navigate(`/activity/internal/${post.id}`)}
    >
      <div className='flex flex-wrap items-center' style={{ gap: '5px' }}>
        {showRecruitStatus ? (
          <span
            className={`inline-flex h-[24px] items-center justify-center rounded-[5px] border px-[10px] text-r-12-hn ${
              post.status === 'CLOSED'
                ? 'border-[var(--ColorGray2,#A1A1A1)] text-[var(--ColorGray2,#A1A1A1)]'
                : 'border-[var(--ColorMain,#00C56C)] text-[var(--ColorMain,#00C56C)]'
            }`}
          >
            {post.status === 'CLOSED' ? '모집 완료' : '모집 중'}
          </span>
        ) : null}
        {post.categories.map((tag) => (
          <span
            key={tag}
            className='flex justify-center items-center px-[10px] py-[4px] rounded-[5px] text-r-12-hn border bg-green-50 text-primary border-primary'
          >
            {tag}
          </span>
        ))}
      </div>

      <div className='flex gap-[20px]'>
        <div className='min-w-0 flex-1 flex flex-col gap-[10px]'>
          <div className='flex flex-col gap-[5px]'>
            <span className='text-sb-16-hn text-gray-900 truncate'>
              {post.title}
            </span>
            <div className='h-[45px] text-r-16 text-gray-750 whitespace-pre-line break-keep line-clamp-2 [overflow-wrap:anywhere]'>
              {post.content}
            </div>
          </div>

          <div className='flex items-center gap-[6px] text-r-12-hn text-gray-650'>
            <div className='flex items-center gap-[5px]'>
              <div className='flex items-center gap-[3px]'>
                <svg width='11' height='12' viewBox='0 0 11 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path 
                    d='M9.22867 0.697692C9.962 0.775908 10.5 1.3558 10.5 2.03286V11.5L5.5 9.20853L0.5 11.5V2.03286C0.5 1.3558 1.03733 0.775908 1.77133 0.697692C4.24879 0.434103 6.75121 0.434103 9.22867 0.697692Z' 
                    stroke='#A1A1A1' 
                    strokeLinecap='round' 
                    strokeLinejoin='round'
                  />
                </svg>
                <span>{post.saveCount}</span>
              </div>
            </div>
            <span>|</span>
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>

        {thumbnailUrl && thumbnailUrl !== "기본이미지" && (
          <img
            src={thumbnailUrl}
            alt={post.title}
            className='w-[95px] h-[95px] rounded-[5px] object-cover flex-shrink-0'
            onError={(e) => {
              e.currentTarget.onerror = null; //이미지 깨짐 방지
              e.currentTarget.src = REPLACE_IMAGE;
            }}
          />
        )}
      </div>
    </PressableMotion>
  );
};

export default InternalActivityPost;
