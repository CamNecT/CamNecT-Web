import { Link } from 'react-router-dom';

type ShopPointBalanceProps = {
  point?: number;
};

export const ShopPointBalance = ({ point }: ShopPointBalanceProps) => (
  <div className='flex flex-col gap-[3px] rounded-[8px] bg-primary p-[16px]'>
    <span className='text-m-14 text-gray-150'>보유 포인트</span>
    <div className='flex flex-wrap items-center justify-between gap-x-[8px] gap-y-[4px]'>
      <span className='min-w-0 text-b-28 text-white [overflow-wrap:anywhere]' style={{ fontSize: 'clamp(22px, 7.5vw, 28px)' }}>
        {point === undefined ? '—' : `${point.toLocaleString('ko-KR')} P`}
      </span>
      <Link
        to='/shop/history'
        className='shrink-0 rounded-full border border-gray-150 bg-white px-[15px] py-[10px] text-m-14 text-gray-750'
      >
        내역 확인
      </Link>
    </div>
  </div>
);
