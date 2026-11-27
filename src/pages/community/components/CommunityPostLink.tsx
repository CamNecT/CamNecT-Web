import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommunityGuestLoginModal } from './CommunityGuestLoginModal';
import type { GuestQuestionSummary } from './GuestQuestionPreview';
import type { CommunityAccessStatus } from '../../../api-types/communityApiTypes';

type Props = {
  postId: string;
  accessStatus?: CommunityAccessStatus;
  children: ReactNode;
  questionSummary?: GuestQuestionSummary;
};

export const CommunityPostLink = ({ postId, accessStatus, children, questionSummary }: Props) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // 공개 목록에 포함된 값만 넘겨 잠긴 질문의 상세 API 없이 미리보기를 그린다.
  if (accessStatus === 'LOGIN_REQUIRED' && questionSummary) {
    const { id, title, isAdopted } = questionSummary;
    return (
      <Link
        to={`/community/post/${postId}`}
        state={{ guestQuestion: { id, title, isAdopted } }}
        className='block'
      >
        {children}
      </Link>
    );
  }

  if (accessStatus === 'LOGIN_REQUIRED') {
    return (
      <>
        <button type='button' className='block w-full text-left' onClick={() => setIsLoginOpen(true)}>
          {children}
        </button>
        <CommunityGuestLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </>
    );
  }

  return <Link to={`/community/post/${postId}`} className='block'>{children}</Link>;
};
