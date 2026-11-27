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
      {/* 위쪽은 약하게, 아래로 갈수록 진하게 흐려지는 블러
      내용 전체에 약한 블러를 적용, 그 위에 강한 블러 막을 겹치고, 그라데이션 마스크로 상단부터 일부 적용, 39% 지점부터 전부 적용 */}
      <div inert aria-hidden className='pointer-events-none select-none blur-[2px]'>
        {children}
      </div>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.6),black_39%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.6),black_39%)]'
      />
      {/* 높이 제한으로 잘린 아래쪽 경계가 보이지 않도록 흰색으로 서서히 사라지게 처리 */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-[40%] [background:linear-gradient(to_bottom,rgba(255,255,255,0),#fff)]'
      />

      {/* 흰색 오버레이: 상단 60% -> 39% 지점에서 80%까지 진해지고 이후 80% 유지*/}
      <div className={twMerge(
        'absolute inset-0 flex flex-col items-center justify-center gap-[40px] px-[40px] text-center [background:linear-gradient(to_bottom,rgba(255,255,255,0.6),rgba(255,255,255,0.8)_39%)]',
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
          className='h-[45px] rounded-[8px] bg-gray-900'
          onClick={() => navigate('/login')}
        />
      </div>
    </div>
  );
};

export default GuestContentBlur;
