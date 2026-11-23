import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { usePointStore } from '../../store/usePointStore';
import { useGifticonListQuery } from '../../hooks/useGifticonQuery';
import PopUp from '../../components/Pop-up';
import { ShopPointBalance } from './components/ShopPointBalance';
import { useGifticonErrorPopup } from './hooks/useGifticonErrorPopup';

const formatPoint = (value: number) => value.toLocaleString('ko-KR');

export const ShopPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen: isToastOpen, isFading: isToastFading, openToast } = useToast();

  const { data: gifticonList, isLoading, isFetching, isError, error, refetch } = useGifticonListQuery();
  const { errorPopup, showGifticonError, closeGifticonError } = useGifticonErrorPopup();
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

  useEffect(() => {
    if (isError) showGifticonError(error, 'home');
  }, [error, isError, showGifticonError]);

  return (
    <HeaderLayout
      headerSlot={<MainHeader title='기프티콘 샵' className='border-b border-gray-150' leftAction={{ onClick: () => navigate('/home') }} />}
    >
      <section className='flex flex-col gap-[31px] px-[25px] py-[25px]'>
        <ShopPointBalance point={gifticonList ? point : undefined} />

        <div className='flex flex-col gap-[25px]'>
          <h2 className='text-sb-20 text-[var(--ColorBlack,#202023)]'>상품 목록</h2>
          {!isLoading && shopItems.length === 0 && (
            <p role={isError ? 'alert' : undefined} className='text-m-14 text-[var(--ColorGray3,#646464)]'>
              {isError ? '상품 목록을 불러오지 못했습니다.' : '현재 판매 중인 상품이 없습니다.'}
            </p>
          )}
          <div className='grid grid-cols-2 gap-x-[10px] gap-y-[35px]'>
            {shopItems.map((item) => (
              <Link key={item.id} to={`/shop/${item.id}`} className='flex min-w-0 flex-col gap-[10px]'>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className='w-full aspect-square rounded-[5px] object-cover'
                  />
                ) : (
                  <div className='w-full aspect-square rounded-[5px] bg-[var(--ColorGray1,#ECECEC)]' />
                )}
                <div className='flex flex-col px-[5px] [overflow-wrap:anywhere]'>
                  <span className='text-m-12 text-gray-650'>{item.company}</span>
                  <span className='text-m-14 text-gray-750'>{item.name}</span>
                  <span className='mt-[10px] text-sb-18 text-gray-900'>
                    {formatPoint(item.point)} Point
                  </span>
                </div>
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
      {/* 조회 결과가 있으면 재조회 중에도 기존 상품 목록을 볼 수 있게 한다. */}
      <PopUp isOpen={isLoading} type='loading' />
      {errorPopup && (
        <PopUp
          isOpen={true}
          type='error'
          title={errorPopup.title}
          content={errorPopup.content}
          buttonText='다시 시도'
          onClick={() => {
            if (isFetching) return;
            closeGifticonError();
            void refetch();
          }}
        />
      )}
    </HeaderLayout>
  );
};
