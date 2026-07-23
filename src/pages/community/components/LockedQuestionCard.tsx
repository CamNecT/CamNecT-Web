import Button from '../../../components/Button';
import Card from '../../../components/Card';

type LockedQuestionCardProps = {
  requiredPoints: number;
  textCount: number;
  imageCount: number;
  onPurchaseClick: () => void;
};

// 잠금된 질문 구매 안내 카드
const LockedQuestionCard = ({
  requiredPoints,
  textCount,
  imageCount,
  onPurchaseClick,
}: LockedQuestionCardProps) => (
  <Card width='100%' height='auto' className='p-[20px]'>
    <div className='flex flex-col gap-[20px]'>
      <div className='flex flex-col'>
        <div className='flex flex-col gap-[10px]'>
          <div className='text-sb-18 text-[var(--ColorBlack,#202023)]'>
            이 질문을 확인하시겠습니까?
          </div>
          <div className='whitespace-pre-line text-r-14 text-[var(--ColorGray3,#646464)]'>
            <span className='text-sb-14 text-[var(--ColorMain,#00C56C)]'>
              {requiredPoints} P
            </span>
            가 차감되며, {'\n'}구매하신 정보는 언제든 다시 꺼내 보실 수 있습니다.
          </div>
        </div>
        <div className='mt-[15px] flex items-center gap-[7px] text-r-12 text-[var(--ColorGray2,#A1A1A1)]'>
          <span>텍스트 {textCount}자</span>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='1'
            height='11'
            viewBox='0 0 1 11'
            fill='none'
          >
            <path d='M0.5 0V10.5' stroke='#A1A1A1' />
          </svg>
          <span>이미지 {imageCount}장</span>
        </div>
      </div>
      <Button
        type='button'
        label={`${requiredPoints} P · 구매하기`}
        font="r-14"
        className="w-full h-auto max-w-none py-[12px] rounded-[6px] bg-[var(--ColorMain,#00C56C)]"
        onClick={onPurchaseClick}
      />
    </div>
  </Card>
);

export type { LockedQuestionCardProps };
export default LockedQuestionCard;
