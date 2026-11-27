import { useLocation, useNavigate } from 'react-router-dom';
import GuestContentBlur from '../../../components/guest/GuestContentBlur';
import Icon from '../../../components/Icon';
import { FullLayout } from '../../../layouts/FullLayout';
import { MainHeader } from '../../../layouts/headers/MainHeader';
import type { QuestionPost } from '../../../types/community';
import { formatPostDisplayDate } from '../utils/post';

export type GuestQuestionSummary = Pick<QuestionPost, 'id' | 'title' | 'isAdopted' | 'answers' | 'saveCount' | 'createdAt'>;

export const GuestQuestionPreview = ({ summary }: { summary?: GuestQuestionSummary }) => {
  const navigate = useNavigate();
  const { key } = useLocation();

  return (
    <FullLayout headerSlot={
      <MainHeader
        title='커뮤니티'
        largeTouchTarget
        leftAction={{
          ariaLabel: '이전 페이지로 이동',
          onClick: () => {
            if (key === 'default') navigate('/community?tab=question', { replace: true });
            else navigate(-1);
          },
        }}
      />
    }>
      <div className='mx-auto w-full max-w-[720px]'>
        {summary && (
          <section className='flex flex-col items-start gap-[14px] px-[25px] pb-[25px] pt-[15px]'>
            <span className={`rounded-full border px-3 py-1 text-r-14 ${summary.isAdopted ? 'border-gray-650 text-gray-650' : 'border-primary text-primary'}`}>
              {summary.isAdopted ? '채택 완료' : '채택 전'}
            </span>
            <h1 className='break-words text-[24px] font-bold leading-[1.4] text-gray-900'>{summary.title}</h1>
            <div className='flex flex-wrap items-center gap-[10px] text-r-12 text-gray-750'>
              <span className='flex items-center gap-[3px]'>
                <Icon name='bookmark_stroke' size={12} />{summary.saveCount}
              </span>
              <span className='flex items-center gap-[3px]'>
                <Icon name='comment' size={12} />{summary.answers}
              </span>
              <time className='text-gray-650'>{formatPostDisplayDate(summary.createdAt)}</time>
            </div>
          </section>
        )}
        <GuestContentBlur
          className='min-h-[455px]'
          overlayClassName='justify-start pt-[110px]'
        >
          {/* 잠금 뒤의 블러는 보호된 작성자·본문·댓글 대신 자리표시자만 보여준다. */}
          <div className='flex flex-col gap-[30px] px-[25px] pt-[10px]'>
            <div className='flex items-center justify-between gap-3 border-b border-gray-150 pb-[15px]'>
              <div className='flex items-center gap-[10px]'>
                <span className='size-8 rounded-full bg-[#C8C8C8]' />
                <span className='h-4 w-[75px] rounded bg-gray-150' />
              </div>
              <span className='h-9 w-[84px] rounded-[10px] border border-primary/50 bg-[#F2FCF8]' />
            </div>
            <div className='flex flex-col gap-[12px]'>
              <span className='h-4 w-2/3 rounded bg-gray-150' />
              <span className='h-4 w-full rounded bg-gray-150' />
              <span className='h-4 w-3/4 rounded bg-gray-150' />
            </div>
            <div className='flex flex-col gap-[20px] border-t border-gray-150 pt-[20px]'>
              <span className='text-sb-16-hn text-gray-900'>댓글</span>
              <span className='h-4 w-3/4 self-center rounded bg-gray-150' />
            </div>
          </div>
        </GuestContentBlur>
      </div>
    </FullLayout>
  );
};
