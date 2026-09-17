import BottomSheetModal from '../../../components/BottomSheetModal/BottomSheetModal';
import { QuantitySelector } from './QuantitySelector';

type PurchaseBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  myPoint: number;
  requiredPoint: number;
  bottomOffset?: number | string;
};

const formatPoint = (value: number) => value.toLocaleString('ko-KR');

export const PurchaseBottomSheet = ({
  isOpen,
  onClose,
  quantity,
  onDecrease,
  onIncrease,
  myPoint,
  requiredPoint,
  bottomOffset,
}: PurchaseBottomSheetProps) => {
  // 수량에 따른 포인트 계산
  const deductedPoint = requiredPoint * quantity;
  const remainingPoint = Math.max(0, myPoint - deductedPoint);

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      bottomOffset={bottomOffset}
    >
      {/* 수량 체크 + 가격 확인 영역 */}
      <div className='flex flex-col gap-[30px] px-[25px] pb-[50px] pt-[35px]'>
        <div className='px-[3px]'><QuantitySelector value={quantity} onDecrease={onDecrease} onIncrease={onIncrease} /></div>

        <div className='flex flex-col gap-[20px]'>
          <div className='flex items-center justify-between'>
            <span className='text-r-16 text-[var(--ColorGray2,#A1A1A1)]'>보유 포인트</span>
            <div className='flex items-center gap-[7px]'>
              <span className='text-r-16 text-[var(--ColorGray2,#A1A1A1)]'>{formatPoint(myPoint)}</span>
              <span className='text-m-16 text-[var(--ColorGray2,#A1A1A1)]'>Point</span>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-r-16 text-[var(--ColorGray2,#A1A1A1)]'>차감 포인트</span>
            <div className='flex items-center gap-[7px]'>
              <span className='text-r-16 text-[var(--ColorGray2,#A1A1A1)]'>{formatPoint(deductedPoint)}</span>
              <span className='text-m-16 text-[var(--ColorGray2,#A1A1A1)]'>Point</span>
            </div>
          </div>
          <svg className='w-full' height="1" viewBox="0 0 325 1" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line y1="0.5" x2="325" y2="0.5" stroke="#ECECEC" />
          </svg>
          <div className='flex items-center justify-between'>
            <span className='text-[18px] font-medium leading-[25.2px] text-[var(--ColorGray3,#646464)]'>
              잔여 포인트
            </span>
            <div className='flex items-center gap-[5px]'>
              <span className='text-sb-18 text-[var(--ColorMain,#00C56C)]'>{formatPoint(remainingPoint)}</span>
              <span className='text-[18px] font-medium leading-[25.2px] text-[var(--ColorGray2,#A1A1A1)]'>
                Point
              </span>
            </div>
          </div>
        </div>
      </div>
    </BottomSheetModal>
  );
};
