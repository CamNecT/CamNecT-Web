import { useNavigate } from 'react-router-dom';
import type { ActivityPost } from '../../types/activityPage/activityPageTypes';
import { formatOnlyDate, getDDay } from '../../utils/formatDate';
import replaceImg from "../../assets/image/replaceImg.png"
import PressableMotion from '../PressableMotion';

const REPLACE_IMAGE = replaceImg;

type ExternalActivityPostProps = {
  post: ActivityPost;
};

const ExternalActivityPost = ({ post }: ExternalActivityPostProps) => {
  const navigate = useNavigate();
  const thumbnailUrl = post.thumbnailUrl ?? post.postImages?.[0];
  const isJobPost = post.tab === 'job';
  const dDay = post.deadline ? getDDay(post.deadline) : null;

  return (
    <PressableMotion
      as='button'
      intensity='soft'
      className='flex flex-col gap-[10px] px-[25px] py-[20px] border-b border-gray-150 text-left w-full'
      onClick={() => navigate(`/activity/external/${post.id}`)}
    >
      {/* Tags */}
      <div className='flex flex-wrap gap-[5px]'>
        {post.categories.map((tag) => (
          <span
            key={tag}
            className='flex justify-center items-center px-[10px] py-[4px] rounded-[5px] text-r-12-hn border bg-green-50 text-primary border-primary'
          >
            {tag}
          </span>
        ))}
      </div>

      <div className='flex gap-[16px]'>
        <div className='flex-1 flex flex-col gap-[10px]'>
          {/* Title & Bookmark Count */}
          <div className='flex gap-[8px] items-center'>
            <span className='text-b-20-hn text-gray-900 line-clamp-2'>
              {post.title}
            </span>
            <div className='flex items-center gap-[3px]'>
              <svg viewBox='0 0 11 12' fill='none' className='w-[11px] h-[12px] block shrink-0'>
                <path 
                  d='M9.22867 0.697692C9.962 0.775908 10.5 1.3558 10.5 2.03286V11.5L5.5 9.20853L0.5 11.5V2.03286C0.5 1.3558 1.03733 0.775908 1.77133 0.697692C4.24879 0.434103 6.75121 0.434103 9.22867 0.697692Z' 
                  stroke='#A1A1A1' 
                  strokeLinecap='round' 
                  strokeLinejoin='round'
                />
              </svg>
              <span className='text-r-12-hn text-gray-650'>{post.saveCount}</span>
            </div>
          </div>

          <div className='flex flex-col gap-[30px] items-start'>
            <div className='flex flex-col gap-[5px] text-r-14-hn text-gray-750'>
              {isJobPost ? (
                <span className='text-r-14 min-h-[42px] line-clamp-2'>{post.content}</span>
              ) : (
                <>
                  {post.organizer && <span>{post.organizer}</span>}
                  {post.deadline && <span>접수 마감 : {formatOnlyDate(post.deadline)}</span>}
                </>
              )}
            </div>
            {dDay !== null && (
              <div className='flex justify-center items-center px-[12px] py-[6px] rounded-[20px] bg-primary text-b-14-hn text-white'>
                {post.status === 'CLOSED'
                  ? '마감'
                  : dDay > 0
                    ? `D-${dDay}`
                    : dDay === 0
                      ? 'D-Day'
                      : '마감'}
              </div>
            )}
          </div>
        </div>

        {thumbnailUrl && thumbnailUrl !== "기본이미지" && (
          <div className='relative'>
            <img
              src={thumbnailUrl ?? REPLACE_IMAGE}
              alt={post.title}
              className='w-[94px] h-[134px] object-cover flex-shrink-0'
              onError={(e) => {
                  e.currentTarget.onerror = null; //이미지 깨짐 방지
                  e.currentTarget.src = REPLACE_IMAGE;
              }}
            />
          </div>
        )}
      </div>
    </PressableMotion>
  );
};

export default ExternalActivityPost;
