import PressableMotion from '../../../components/PressableMotion';

type QuantitySelectorProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export const QuantitySelector = ({
  value,
  onDecrease,
  onIncrease,
}: QuantitySelectorProps) => {
  return (
    // 수량 선택 컨테이너
    <div className='flex h-[52px] w-full items-center justify-between rounded-[5px] border border-[var(--ColorGray1,#ECECEC)] px-[15px]'>
      <PressableMotion
        as='button'
        intensity='soft'
        type='button'
        onClick={onDecrease}
        aria-label='수량 감소'
        className='flex items-center justify-center'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>
          <path
            d='M4.1665 10H15.8332'
            stroke='#A1A1A1'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </PressableMotion>
      <span className='text-m-16 text-[var(--ColorGray3,#646464)]'>{value}</span>
      <PressableMotion
        as='button'
        intensity='soft'
        type='button'
        onClick={onIncrease}
        aria-label='수량 증가'
        className='flex items-center justify-center'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>
          <path
            d='M10 3.75V16.25M16.25 10H3.75'
            stroke='#A1A1A1'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </PressableMotion>
    </div>
  );
};
