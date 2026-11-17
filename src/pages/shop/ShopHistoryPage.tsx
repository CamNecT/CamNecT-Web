import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PressableMotion from '../../components/PressableMotion';
import SortSelector from '../../components/SortSelector';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { usePointHistoryQuery, usePurchaseHistoryQuery, type PointHistoryFilter } from './hooks/useShopHistoryQuery';

const filterLabels: Record<PointHistoryFilter, string> = {
  ALL: '전체 보기',
  SPEND: '차감 내역',
  EARN: '적립 내역',
};

type HistoryLayoutProps = {
  title: string;
  backTo: string;
  children: ReactNode;
};

const HistoryLayout = ({ title, backTo, children }: HistoryLayoutProps) => {
  const navigate = useNavigate();

  return (
    <HeaderLayout
      headerSlot={<MainHeader title={title} className='border-b border-gray-150' leftAction={{ onClick: () => navigate(backTo) }} />}
    >
      <section className='flex flex-col gap-[20px] px-[25px] py-[25px]'>{children}</section>
    </HeaderLayout>
  );
};

type HistoryListProps = {
  query: Pick<UseInfiniteQueryResult, 'isLoading' | 'isFetching' | 'isError' | 'hasNextPage' | 'isFetchNextPageError' | 'refetch' | 'fetchNextPage'>;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

const HistoryList = ({ query, isEmpty, emptyMessage, children }: HistoryListProps) => {
  if (query.isLoading) return <p role='status' className='text-m-14 text-gray-750'>내역을 불러오는 중이에요.</p>;

  const showRetry = query.isError && !query.isFetchNextPageError;

  return (
    <>
      {!isEmpty && <ul className='flex flex-col gap-[24px]'>{children}</ul>}
      {isEmpty && !query.isError && <p className='text-m-14 text-gray-750'>{emptyMessage}</p>}
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
    </>
  );
};

type HistoryRowProps = {
  title: string;
  points: number;
  date: string;
  imageUrl?: string | null;
  children: ReactNode;
};

const HistoryRow = ({ title, points, date, imageUrl, children }: HistoryRowProps) => {
  const earned = points > 0;
  const formattedDate = dayjs(date);

  return (
    <li className='flex items-start gap-[11px]'>
      {imageUrl ? (
        <img src={imageUrl} alt='' loading='lazy' className='size-[74px] shrink-0 rounded-[12px] bg-gray-100 object-cover' />
      ) : (
        <span aria-hidden='true' className='grid size-[74px] shrink-0 place-items-center rounded-[12px] bg-green-50 text-[40px] font-bold text-primary'>P</span>
      )}
      <div className='flex min-w-0 flex-1 flex-col gap-[7px] [overflow-wrap:anywhere]'>
        <div className='flex flex-col gap-[3px]'>
          <div className='flex flex-wrap items-start justify-between gap-x-[8px] gap-y-[2px]'>
            <span className={`text-sb-16 ${earned ? 'text-primary' : 'text-gray-900'}`}>
              {earned && '+'}{points.toLocaleString('ko-KR')} <span className='font-medium'>Point</span>
            </span>
            {formattedDate.isValid() && (
              <time dateTime={date} className='text-r-12 text-gray-650'>{formattedDate.format('YYYY.MM.DD')}</time>
            )}
          </div>
          <p className='text-m-16 text-gray-750'>{title}</p>
        </div>
        {children}
      </div>
    </li>
  );
};

export const ShopPointHistoryPage = () => {
  const [filter, setFilter] = useState<PointHistoryFilter>('ALL');
  const query = usePointHistoryQuery(filter);
  const transactions = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <HistoryLayout title='포인트 내역 확인' backTo='/shop'>
      <div className='flex flex-wrap items-center justify-between gap-[8px]'>
        <SortSelector sortKey={filter} sortLabels={filterLabels} onChange={setFilter} />
        <Link to='/shop/purchases' className='text-m-14 text-gray-750 underline underline-offset-4'>기프티콘 구매 내역</Link>
      </div>
      <HistoryList query={query} isEmpty={transactions.length === 0} emptyMessage='표시할 포인트 내역이 없어요.'>
        {/* 포인트 원장에는 상품 정보가 없어 상세 주문은 기프티콘 구매 내역에서 조회한다. */}
        {transactions.map((transaction) => (
          <HistoryRow key={transaction.id} title={transaction.description} points={transaction.pointChange} date={transaction.createdAt}>
            <p className='text-r-14 text-gray-700'>
              <span className='font-medium text-gray-750'>잔여 포인트</span> {transaction.balanceAfter.toLocaleString('ko-KR')}P
            </p>
          </HistoryRow>
        ))}
      </HistoryList>
    </HistoryLayout>
  );
};

export const ShopPurchaseHistoryPage = () => {
  const query = usePurchaseHistoryQuery();
  const purchases = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <HistoryLayout title='기프티콘 구매 내역' backTo='/shop/history'>
      <HistoryList query={query} isEmpty={purchases.length === 0} emptyMessage='구매한 기프티콘이 없어요.'>
        {purchases.map((purchase) => (
          <HistoryRow
            key={purchase.purchaseId}
            title={purchase.productName}
            points={-purchase.totalPricePoints}
            date={purchase.requestedAt}
            imageUrl={purchase.imageUrl}
          >
            <p className='text-r-14 text-gray-750'>
              {purchase.quantity}개 · {purchase.processingSuccess == null ? '처리 대기' : purchase.processingSuccess ? '처리 완료' : '처리 실패'}
            </p>
          </HistoryRow>
        ))}
      </HistoryList>
    </HistoryLayout>
  );
};
