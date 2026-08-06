import SaveToggle from '../../../layouts/BottomChat/components/SaveToggle';
import PressableMotion from '../../../components/PressableMotion';
import type { ActivityPostStatus } from '../../../types/activityPage/activityPageTypes';

type BottomReactProps = {
  isMine: boolean;
  status: ActivityPostStatus;
  onOpenCompletePopup: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle: (checked: boolean) => void;
};

const BottomReact = ({
  isMine,
  status,
  onOpenCompletePopup,
  isBookmarked = false,
  onBookmarkToggle,
}: BottomReactProps) => {
  const isClosed = status === 'CLOSED';

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 bg-white'>
      <div
        className='mx-auto flex w-full max-w-[720px] items-center gap-[clamp(8px,2.2vw,10px)] px-[clamp(16px,6vw,25px)] py-[6px] box-border'
        style={{ paddingBottom: 'calc(15px + env(safe-area-inset-bottom))' }}
      >
        <div className='flex flex-1 items-center mt-[5px]'>
          {isMine ? (
            <PressableMotion
              as='button'
              intensity='strong'
              type='button'
              onClick={onOpenCompletePopup}
              disabled={isClosed}
              className={`text-b-16-hn flex h-[44px] w-full items-center justify-center rounded-[10px] disabled:cursor-not-allowed ${isClosed ? 'bg-gray-300 text-white' : 'bg-[#FFEFEF] text-red'}`}
            >
              {isClosed ? '모집 완료됨' : '모집 완료하기'}
            </PressableMotion>
          ) : (
            <div className={`text-b-16-hn flex h-[44px] w-full items-center justify-center rounded-[10px] ${isClosed ? 'bg-gray-300 text-white' : 'bg-green-50 text-primary'}`}>
              {isClosed ? '모집 완료' : '모집 중'}
            </div>
          )}
        </div>
        <div className='flex shrink-0 items-center gap-[clamp(8px,3vw,13px)]'>
          <SaveToggle width={24} height={24} aria-label='저장' isActive={isBookmarked} onToggle={(checked) => onBookmarkToggle(checked)}/>
        </div>
      </div>
    </div>
  );
};

export default BottomReact;
