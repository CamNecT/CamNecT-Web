import Button from '../../../components/Button';

type BottomBuyProps = {
  onClick?: () => void;
};

export const BottomBuy = ({ onClick }: BottomBuyProps) => {
  return (
    // 화면 하단 고정 구매 버튼
    <div
      className='fixed bottom-0 left-0 right-0 z-50 bg-white px-[25px] py-[5px] pb-[45px]'
    >
      <Button
        type='button'
        label="구매하기"
        font="sb-18-flat"
        className="h-[50px] max-w-none rounded-[10px] bg-[var(--ColorMain,#00C56C)]"
        onClick={onClick}
      />
    </div>
  );
};
