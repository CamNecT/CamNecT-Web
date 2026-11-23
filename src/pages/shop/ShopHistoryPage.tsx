import dayjs from 'dayjs';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PressableMotion from '../../components/PressableMotion';
import SortSelector from '../../components/SortSelector';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { usePointHistoryQuery, type PointHistoryFilter, type PointTransaction } from './hooks/useShopHistoryQuery';

const filterLabels: Record<PointHistoryFilter, string> = {
  ALL: '전체 보기',
  SPEND: '차감 내역',
  EARN: '적립 내역',
};

const HistoryRow = ({ transaction }: { transaction: PointTransaction }) => {
  const { type, pointChange, description, balanceAfter, createdAt } = transaction;
  const earned = type === 'EARN';
  const formattedDate = dayjs(createdAt);

  return (
    <li className='flex items-start gap-[11px]'>
      <span aria-hidden='true' className='grid size-[74px] shrink-0 place-items-center rounded-[12px] bg-green-50 text-[40px] font-bold text-primary'>P</span>
      <div className='flex min-w-0 flex-1 flex-col gap-[7px] [overflow-wrap:anywhere]'>
        <div className='flex flex-col gap-[3px]'>
          <div className='flex flex-wrap items-start justify-between gap-x-[8px] gap-y-[2px]'>
            <span className={`text-sb-16 ${earned ? 'text-primary' : 'text-gray-900'}`}>
              {earned && '+'}{pointChange.toLocaleString('ko-KR')} <span className='font-medium'>Point</span>
            </span>
            {formattedDate.isValid() && (
              <time dateTime={createdAt} className='text-r-12 text-gray-650'>{formattedDate.format('YYYY.MM.DD')}</time>
            )}
          </div>
          <p className='text-m-16 text-gray-750'>{description}</p>
        </div>
        <p className='text-r-14 text-gray-700'>
          <span className='font-medium text-gray-750'>잔여 포인트</span> {balanceAfter.toLocaleString('ko-KR')}P
        </p>
      </div>
    </li>
  );
};

export const ShopPointHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  //마이페이지 사이드바에서 진입한 경우 뒤로가기 시 마이페이지로 다시 복귀
  const isFromMypage = location.state?.from === 'mypage';
  const handleBack = () => {
    if (isFromMypage) {
      navigate(-1);
      return;
    }
    navigate('/shop');
  };
  const [filter, setFilter] = useState<PointHistoryFilter>('ALL');
  const query = usePointHistoryQuery(filter);
  const transactions = query.data?.pages.flatMap((page) => page.items) ?? [];
  const hasTransactions = transactions.length > 0;
  const showRetry = query.isError && !query.isFetchNextPageError;

  return (
    <HeaderLayout
      headerSlot={<MainHeader title='포인트 내역 확인' className='border-b border-gray-150' leftAction={{ onClick: handleBack }} />}
    >
      <section className='flex flex-col gap-[20px] px-[25px] py-[25px]'>
        <SortSelector sortKey={filter} sortLabels={filterLabels} onChange={setFilter} />
        {query.isLoading && <p role='status' className='text-m-14 text-gray-750'>내역을 불러오는 중이에요.</p>}
        {hasTransactions && (
          <ul className='flex flex-col gap-[24px]'>
            {transactions.map((transaction) => <HistoryRow key={transaction.id} transaction={transaction} />)}
          </ul>
        )}
        {!hasTransactions && !query.isLoading && !query.isError && (
          <p className='text-m-14 text-gray-750'>표시할 포인트 내역이 없어요.</p>
        )}
        {query.isError && <p role='alert' className='text-m-14 text-gray-750'>내역을 불러오지 못했어요.</p>}
        {(showRetry || query.hasNextPage) && (
          <PressableMotion
            as='button'
            type='button'
            intensity='soft'
            className='rounded-[10px] border border-gray-150 py-[10px] text-m-14 text-gray-750 disabled:opacity-50'
            disabled={query.isFetching}
            onClick={() => {
              if (showRetry) void query.refetch();
              else void query.fetchNextPage({ cancelRefetch: false });
            }}
          >
            {query.isError ? '다시 시도' : '더 보기'}
          </PressableMotion>
        )}
      </section>
    </HeaderLayout>
  );
};
