import { useNavigate } from 'react-router-dom';
import replaceImg from '../../../assets/image/replaceImg.png';
import type { AlumniProfile } from '../../../types/alumni/alumniTypes';

type PortfolioSectionProps = {
  profileId: string;
  items: AlumniProfile['portfolioItems'];
};

const PortfolioSection = ({ profileId, items }: PortfolioSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col gap-[10px]'>
      <div className='flex items-center justify-between'>
        <span className='text-SB-18 text-gray-900'>포트폴리오</span>
        {items.length > 0 && (
          <button
            type='button'
            className='flex items-center gap-[2px] text-R-12-hn text-gray-650'
            onClick={() => navigate(`/alumni/profile/${profileId}/portfolio`)}
          >
            전체보기
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='4'
              height='9'
              viewBox='0 0 4 9'
              fill='none'
              aria-hidden
            >
              <path
                d='M0.75 0.75L3 4.5L0.75 8.25'
                stroke='var(--ColorGray2, #A1A1A1)'
                strokeWidth='1.2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        )}
      </div>

      <div className='h-0 border border-gray-150' />

      <div className='flex gap-[5px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {items.map((item) => (
          <button
            key={item.id}
            type='button'
            className='flex w-[160px] shrink-0 flex-col gap-[5px] text-left'
            onClick={() => navigate(`/alumni/profile/${profileId}/portfolio/${item.id}`)}
          >
            <div className='h-[90px] w-[160px] overflow-hidden rounded-[12px] bg-[var(--ColorGray1,#D5D5D5)]'>
              <img
                src={item.image ?? replaceImg}
                alt={item.title}
                className='h-full w-full object-cover'
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = replaceImg;
                }}
              />
            </div>
            <div className='w-full truncate pl-[10px] text-M-14 text-gray-750'>{item.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSection;
