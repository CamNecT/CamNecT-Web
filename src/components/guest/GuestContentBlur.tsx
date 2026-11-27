import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';

type GuestContentBlurProps = {
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  // 안내 문구 (미지정 시 기본 문구)
  title?: string;
  description?: string;
};

// 비회원에게 회원 전용 영역을 보여줄 때 사용하는 블러
export const GuestContentBlur = ({
  children,
  className = '',
  overlayClassName,
  title = '회원 전용 콘텐츠입니다.',
  description = '로그인하고 모든 내용을 확인해 보세요!',
}: GuestContentBlurProps) => {
  const navigate = useNavigate();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div inert aria-hidden className='pointer-events-none select-none'>
        {children}
      </div>

      {/* CSS 블러 반경은 고정값이므로 마스크로 시안의 0 → 10px 전환을 근사한다. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 backdrop-blur-[10px] [mask-image:linear-gradient(to_bottom,transparent,black_17.762%)]'
      />
      {/* 흰색 오버레이는 블러와 별도로 상단 60%에서 39.235% 지점의 80%까지 진해진다. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,rgba(255,255,255,0.6),rgba(255,255,255,0.8)_39.235%)]'
      />

      <div className={twMerge(
        'absolute inset-0 flex flex-col items-center justify-center gap-[40px] px-[25px] text-center',
        overlayClassName,
      )}>
        <div className='flex flex-col gap-[12px]'>
          <p className='whitespace-pre-line text-b-18-hn text-gray-900'>{title}</p>
          {description ? (
            <p className='whitespace-pre-line text-r-14-hn text-gray-750'>{description}</p>
          ) : null}
        </div>
        <Button
          type='button'
          label='로그인 페이지로 이동'
          font='b-14-hn'
          className='h-[45px] max-w-[292px] rounded-[8px] bg-gray-900'
          onClick={() => navigate('/login')}
        />
      </div>
    </div>
  );
};

export default GuestContentBlur;
