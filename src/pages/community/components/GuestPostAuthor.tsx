import defaultProfile from '../../../assets/image/defaultProfileImg.png';

// 비회원에게는 서버의 작성자 정보와 무관하게 기본 프로필만 표시한다.
export const GuestPostAuthor = () => (
  <div className='flex items-center gap-[10px] border-b border-gray-150 pb-[15px]'>
    <img src={defaultProfile} alt='' className='size-8 shrink-0 rounded-full bg-gray-100 object-contain' />
    <span className='text-sb-14 text-gray-900'>우리학교 동문</span>
  </div>
);
