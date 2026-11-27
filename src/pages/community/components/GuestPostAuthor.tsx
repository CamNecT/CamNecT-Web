import { useState } from 'react';
import { CommunityGuestLoginModal } from './CommunityGuestLoginModal';
import defaultProfile from '../../../assets/image/defaultProfileImg.png';

type GuestPostAuthorProps = {
  size?: 32 | 48;
};

// 비회원에게는 서버의 작성자 정보와 무관하게 기본 프로필만 표시한다.
export const GuestPostAuthor = ({ size = 32 }: GuestPostAuthorProps) => (
  <div className={`flex items-center ${size === 48 ? 'gap-[15px]' : 'gap-[10px]'}`}>
    <img
      src={defaultProfile}
      alt=''
      width={size}
      height={size}
      className='aspect-square shrink-0 rounded-full bg-gray-100 object-contain'
    />
    <div className='flex flex-col gap-[3px]'>
      <span className='text-sb-14 text-gray-900'>우리학교 동문</span>
      <span className='text-r-12 text-gray-750'>camnect</span>
    </div>
  </div>
);

export const GuestPostAuthorRow = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className='flex items-center justify-between gap-[12px] border-b border-gray-150 pb-[15px]'>
      <GuestPostAuthor />
      {/* 기본 프로필에는 실제 작성자 ID가 없어 커피챗 대신 공통 로그인 안내를 연다. */}
      <button
        type='button'
        className='inline-flex shrink-0 items-center justify-center rounded-[10px] border border-primary px-[10px] py-[6px] text-[12px] font-normal text-primary'
        onClick={() => setIsLoginOpen(true)}
      >
        커피챗 보내기
      </button>
      <CommunityGuestLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};
