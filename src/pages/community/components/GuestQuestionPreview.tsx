import { useLocation, useNavigate } from 'react-router-dom';
import GuestContentBlur from '../../../components/guest/GuestContentBlur';
import { FullLayout } from '../../../layouts/FullLayout';
import { MainHeader } from '../../../layouts/headers/MainHeader';
import type { QuestionPost } from '../../../types/community';
import { GuestPostAuthor } from './GuestPostAuthor';

export type GuestQuestionSummary = Pick<QuestionPost, 'id' | 'title' | 'isAdopted'>;

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
          </section>
        )}
        <div className='px-[25px]'>
          <GuestPostAuthor className='border-b border-gray-150 pb-[15px]' />
        </div>
        <GuestContentBlur
          className='min-h-[455px]'
          overlayClassName='justify-start pt-[110px]'
        >
          {/* 잠긴 질문의 본문과 댓글 영역에는 자리표시자만 보여준다. */}
          <div className='flex flex-col gap-[30px] px-[25px] pt-[10px]'>
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
