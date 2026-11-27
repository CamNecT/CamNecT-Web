import defaultProfile from '../../../assets/image/defaultProfileImg.png';

type GuestPostAuthorProps = {
  size?: 32 | 48;
  className?: string;
};

// 비회원에게는 서버의 작성자 정보와 무관하게 기본 프로필만 표시한다.
export const GuestPostAuthor = ({ size = 32, className = '' }: GuestPostAuthorProps) => (
  <div className={`flex items-center ${size === 48 ? 'gap-[15px]' : 'gap-[10px]'} ${className}`}>
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
