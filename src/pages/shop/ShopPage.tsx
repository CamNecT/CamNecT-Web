import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { usePointStore } from '../../store/usePointStore';
import { useGifticonListQuery } from '../../hooks/useGifticonQuery';
import PopUp from '../../components/Pop-up';

const formatPoint = (value: number) => value.toLocaleString('ko-KR');

export const ShopPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen: isToastOpen, isFading: isToastFading, openToast } = useToast();

  const { data: gifticonList, isLoading } = useGifticonListQuery();
  const shopItems = gifticonList?.shopItems ?? [];

  // 전역 포인트 표시
  const point = usePointStore((state) => state.point);

  // 구매 성공 플래그는 라우터 state로 전달됨
  const purchaseSuccess = Boolean(location.state?.purchaseSuccess);

  useEffect(() => {
    if (!purchaseSuccess) return;
    // 구매 성공 토스트 표시 후 state 초기화
    openToast();
    navigate('/shop', { replace: true, state: {} });
  }, [purchaseSuccess, navigate, openToast]);

  return (
    <HeaderLayout
      headerSlot={<MainHeader title='기프티콘 샵' leftAction={{ onClick: () => navigate('/home') }} />}
    >
      <section className='flex flex-col gap-[40px] px-[25px] py-[15px]'>
        <div className='w-full h-[100px] rounded-[20px] bg-[var(--ColorMain,#00C56C)] flex flex-col gap-[1px] px-[25px] py-[20px]'>
          <span className='text-m-14 text-[var(--ColorGray1,#ECECEC)]'>보유 포인트</span>
          <span
            className='text-b-28 text-[var(--ColorWhite,#FFF)]'
            style={{ fontSize: 'clamp(22px, 6.5vw, 28px)' }}
          >
            {formatPoint(point)} P
          </span>
        </div>

        <div className='flex flex-col gap-[25px]'>
          <h2 className='text-sb-20 text-[var(--ColorBlack,#202023)]'>상품 목록</h2>
          <div className='grid grid-cols-2 gap-x-[10px] gap-y-[35px]'>
            {shopItems.map((item) => (
              <Link key={item.id} to={`/shop/${item.id}`} className='flex flex-col gap-[10px]'>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className='w-full aspect-square rounded-[5px] object-cover'
                  />
                ) : (
                  <div className='w-full aspect-square rounded-[5px] bg-[var(--ColorGray1,#ECECEC)]' />
                )}
                <div className='flex flex-col'>
                  <span className='text-m-12 text-[var(--ColorGray2,#A1A1A1)]'>{item.company}</span>
                  <span className='text-m-14 text-[var(--ColorGray3,#646464)]'>{item.name}</span>
                </div>
                <span className='text-sb-18 text-[var(--ColorBlack,#202023)]'>
                  {formatPoint(item.point)} Point
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Toast
        isOpen={isToastOpen}
        isFading={isToastFading}
        message='구매성공! 내역을 확인해보세요'
      />
      <PopUp isOpen={isLoading} type='loading' />
    </HeaderLayout>
  );
};
