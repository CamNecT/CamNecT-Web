import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PopUp from '../../components/Pop-up';
import {
  useGifticonListQuery,
  useGifticonProductQuery,
  useGifticonPurchaseMutation,
} from '../../hooks/useGifticonQuery';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { usePointStore } from '../../store/usePointStore';
import { BottomBuy } from './components/BottomBuy';
import { PurchaseBottomSheet } from './components/PurchaseBottomSheet';
import { useGifticonErrorPopup } from './hooks/useGifticonErrorPopup';

const formatPoint = (value: number) => value.toLocaleString('ko-KR');

export const ShopDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const { user } = useAuthStore();
  const gifticonListQuery = useGifticonListQuery();
  const gifticonProductQuery = useGifticonProductQuery(productId);
  const { data: gifticonList, isLoading: isGifticonListLoading } = gifticonListQuery;
  const { data: gifticonProduct, isLoading: isProductLoading } = gifticonProductQuery;
  const { mutate: purchaseProduct, isPending: isPurchasePending } = useGifticonPurchaseMutation();
  const { errorPopup, showGifticonError, closeGifticonError } = useGifticonErrorPopup();
  const product = gifticonProduct;

  // 포인트는 ShopPage 진입 시 gifticonList API에서 전역 스토어에 동기화됩니다.
  const point = usePointStore((state) => state.point);
  const getPoint = usePointStore((state) => state.getPoint);
  
  // 구매 수량 및 구매 플로우 상태
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [popUpConfig, setPopUpConfig] = useState<{ title: string; content: string } | null>(null);
  
  const [confirmPopUpConfig, setConfirmPopUpConfig] = useState<{
    title: string;
    content: string;
    rightButtonText: string;
  } | null>(null);
  const purchasePendingRef = useRef(false);
  const purchaseAttemptRef = useRef<{ key: string; clientRequestId: string } | null>(null);

  useEffect(() => {
    if (gifticonProductQuery.isError) {
      showGifticonError(gifticonProductQuery.error, 'detail');
      return;
    }
    if (gifticonListQuery.isError) {
      showGifticonError(gifticonListQuery.error, 'home');
    }
  }, [
    gifticonListQuery.error,
    gifticonListQuery.isError,
    gifticonProductQuery.error,
    gifticonProductQuery.isError,
    showGifticonError,
  ]);

  if (isProductLoading || isGifticonListLoading) {
    return <PopUp isOpen={true} type='loading' />;
  }

  // 조회가 끝난 뒤에도 상품이 없으면 잘못된 상품 경로로 처리합니다.
  if (!product) {
    return (
      <HeaderLayout headerSlot={<MainHeader title='기프티콘 샵' />}>
        <section className='flex flex-col px-[25px] py-[20px]'>
          <p className='text-m-14 text-[var(--ColorGray3,#646464)]'>상품을 찾을 수 없습니다.</p>
        </section>
        {errorPopup && (
          <PopUp
            isOpen={true}
            type='error'
            title={errorPopup.title}
            content={errorPopup.content}
            buttonText='다시 시도'
            onClick={() => {
              closeGifticonError();
              void Promise.all([gifticonProductQuery.refetch(), gifticonListQuery.refetch()]);
            }}
          />
        )}
      </HeaderLayout>
    );
  }

  const openPurchaseSheet = () => {
    setIsPurchasing(true);
    setIsSheetOpen(true);
  };

  const closePurchaseSheet = () => {
    setIsSheetOpen(false);
    // 바텀 시트가 내려가면 기본 상태로 복귀
    setIsPurchasing(false);
  };

  const handleBuyClick = () => {
    if (!product.active) return;
    if (!isPurchasing) {
      openPurchaseSheet();
      return;
    }
    // 구매중 상태에서 재클릭 시 구매 확인 팝업
    setConfirmPopUpConfig({
      title: '구매를 진행하시겠습니까?',
      content: '* 사용 시 포인트가 차감됩니다',
      rightButtonText: '네, 구매하겠습니다',
    });
  };

  // 상품 구매 함수
  const handleConfirmPurchase = () => {
    if (!user || !product) return;
    // mutation 상태가 렌더링되기 전 같은 tick에서 발생하는 연속 구매 요청도 차단합니다.
    if (purchasePendingRef.current || isPurchasePending) return;

    const totalRequiredPoint = product.point * quantity;
    const currentPoint = getPoint();

    // 포인트가 부족하면 구매 진행 중단 (최신 포인트 기준)
    if (currentPoint < totalRequiredPoint) {
      setConfirmPopUpConfig(null);
      setPopUpConfig({
        title: '포인트가 부족해서 구매할 수 없어요',
        content: '다양한 활동으로 포인트를 채워보세요!',
      });
      return;
    }

    const recipientEmail = gifticonList?.email || undefined;
    const purchaseKey = `${product.id}:${quantity}:${totalRequiredPoint}:${recipientEmail ?? ''}`;
    if (purchaseAttemptRef.current?.key !== purchaseKey) {
      purchaseAttemptRef.current = {
        key: purchaseKey,
        clientRequestId: crypto.randomUUID(),
      };
    }

    // 응답 유실 후 재시도에도 같은 ID를 사용해야 서버가 중복 포인트 차감을 막을 수 있습니다.
    const clientRequestId = purchaseAttemptRef.current.clientRequestId;
    purchasePendingRef.current = true;

    // 서버로 구매 요청 전송
    purchaseProduct({
      productId: product.id,
      quantity: quantity,
      spendPoints: totalRequiredPoint,
      clientRequestId,
      recipientEmail,
      giftMessage: null,
    }, {
      onSuccess: () => {
        purchaseAttemptRef.current = null;
        setConfirmPopUpConfig(null);
        setIsSheetOpen(false);
        setIsPurchasing(false);
        // 성공 시 ShopPage로 이동 (useGifticonPurchaseMutation 내부에서 포인트 차감 및 쿼리 무효화 처리됨)
        navigate('/shop', { state: { purchaseSuccess: true } });
      },
      onError: (error) => {
        setConfirmPopUpConfig(null);
        showGifticonError(error, 'purchase');
        // 서버 검증 실패 시 클라이언트의 포인트가 오래된 값일 수 있어 최신 잔액을 다시 받습니다.
        void gifticonListQuery.refetch();
      },
      onSettled: () => {
        purchasePendingRef.current = false;
      },
    });
  };

  const handleDecrease = () => {
    // 수량은 최소 1 유지
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    const nextQuantity = quantity + 1;
    const nextRequiredPoint = product.point * nextQuantity;
    // 잔여 포인트가 0 아래로 내려가는 경우 증가 불가
    if (point - nextRequiredPoint < 0) {
      return;
    }
    setQuantity(nextQuantity);
  };

  return (
    <HeaderLayout headerSlot={<MainHeader title='기프티콘 샵' />}>
      <section className='flex flex-col flex-1 min-h-0 pb-[80px] bg-[var(--Color_Gray_B,#FCFCFC)]'>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className='w-full aspect-square object-cover'
          />
        ) : (
          <div className='w-full aspect-square bg-[var(--ColorGray1,#ECECEC)]' />
        )}

        <div className='flex flex-col gap-[10px] px-[25px] py-[25px]'>
          <div className='flex flex-col'>
            <span className='text-m-12 text-[var(--ColorGray2,#A1A1A1)]'>{product.company}</span>
            <span className='text-m-20 text-[var(--ColorBlack,#202023)]'>{product.name}</span>
          </div>
          <span className='text-[24px] font-bold leading-[normal] text-[var(--ColorMain,#00C56C)]'>
            {formatPoint(product.point)} Point
          </span>
          {!product.active && (
            <span className='text-m-14 text-gray-650'>현재 판매가 종료된 상품입니다.</span>
          )}
        </div>

        <div className='flex flex-col gap-[10px] px-[25px] py-[15px] flex-1'>
          <span className='text-r-12 text-[var(--ColorGray2,#A1A1A1)]'>
            - 구매일로부터 교환권 지급까지 평균 3일 정도 소요될 수 있습니다.
          </span>
          <span className='text-r-12 text-[var(--ColorGray2,#A1A1A1)]'>
            - 교환권은 등록된 이메일로 발송됩니다.
          </span>
          <span className='text-r-12 text-[var(--ColorGray2,#A1A1A1)]'>
            - 구매 불가 시 이메일로 알림발송 됩니다.
          </span>
          <span className='text-r-12 text-[var(--ColorGray2,#A1A1A1)]'>
            - (주요 사유 : 재고부족)
          </span>
        </div>
      </section>
      <BottomBuy onClick={handleBuyClick} disabled={!product.active} />
      <PurchaseBottomSheet
        isOpen={isSheetOpen}
        onClose={closePurchaseSheet}
        quantity={quantity}
        onDecrease={handleDecrease}
        onIncrease={handleIncrease}
        myPoint={point}
        requiredPoint={product.point}
        bottomOffset='calc(105px)'
      />
      {confirmPopUpConfig && (
        <PopUp
          isOpen={true}
          type='info'
          title={confirmPopUpConfig.title}
          content={confirmPopUpConfig.content}
          rightButtonText={confirmPopUpConfig.rightButtonText}
          onLeftClick={() => setConfirmPopUpConfig(null)}
          onRightClick={handleConfirmPurchase}
          isActionPending={isPurchasePending}
        />
      )}
      {popUpConfig && (
        <PopUp
          isOpen={true}
          type='confirm'
          title={popUpConfig.title}
          content={popUpConfig.content}
          onClick={() => setPopUpConfig(null)}
        />
      )}
      {errorPopup && (
        <PopUp
          isOpen={true}
          type='error'
          title={errorPopup.title}
          content={errorPopup.content}
          onClick={closeGifticonError}
        />
      )}
    </HeaderLayout>
  );
};
