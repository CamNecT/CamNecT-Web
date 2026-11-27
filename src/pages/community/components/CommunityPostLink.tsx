import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import GuestLoginModal from '../../../components/guest/GuestLoginModal';
import type { CommunityAccessStatus } from '../../../api-types/communityApiTypes';

type Props = {
  postId: string;
  accessStatus?: CommunityAccessStatus;
  children: ReactNode;
};

export const CommunityPostLink = ({ postId, accessStatus, children }: Props) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // 잠긴 카드는 상세로 진입시키지 않아 질문 상세와 댓글에 대한 요청이 발생하지 않는다.
  if (accessStatus === 'LOGIN_REQUIRED') {
    return (
      <>
        <button type='button' className='block w-full text-left' onClick={() => setIsLoginOpen(true)}>
          {children}
        </button>
        <GuestLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </>
    );
  }

  return <Link to={`/community/post/${postId}`} className='block'>{children}</Link>;
};
