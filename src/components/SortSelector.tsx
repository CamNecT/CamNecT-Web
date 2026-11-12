import { useState } from 'react';
import BottomSheetModal from './BottomSheetModal/BottomSheetModal';
import BoardTypeToggle from './BoardTypeToggle';
import Icon from './Icon';
import PressableMotion from './PressableMotion';
import Toggle from './Toggle/Toggle';

type SortSelectorProps<SortKey extends string> = {
  sortKey: SortKey;
  sortLabels: Record<SortKey, string>;
  modalLabels?: Record<SortKey, string>; // BottomSheetModal용 라벨
  onChange: (next: SortKey) => void;
  modalTitle?: string;
  buttonClassName?: string;
  largeTouchTarget?: boolean;
};

const SortSelector = <SortKey extends string>({
  sortKey,
  sortLabels,
  modalLabels,
  onChange,
  modalTitle = '정렬',
  buttonClassName = 'text-r-14 text-[var(--ColorGray2,#A1A1A1)]',
  largeTouchTarget = false,
}: SortSelectorProps<SortKey>) => {
  const [isOpen, setIsOpen] = useState(false);
  const sortKeys = Object.keys(sortLabels) as SortKey[];
  const displayLabels = modalLabels ?? sortLabels;

  return (
    <>
      {largeTouchTarget ? (
        // 정렬명과 화살표 사이의 빈 공간도 같은 버튼으로 눌러 정렬을 열 수 있게 한다.
        <PressableMotion
          as='button'
          intensity='soft'
          type='button'
          aria-label={`${modalTitle}: ${sortLabels[sortKey]}`}
          aria-expanded={isOpen}
          className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-[6px] rounded-[5px] px-2 active:bg-gray-150 ${buttonClassName}`}
          onClick={() => setIsOpen((open) => !open)}
        >
          {sortLabels[sortKey]}
          <span aria-hidden='true' className='inline-flex'>
            <Icon name='arrow_down' size={20} color='#202023' className={isOpen ? 'rotate-180' : undefined} />
          </span>
        </PressableMotion>
      ) : (
        <div className='flex items-center gap-[6px]'>
          <PressableMotion as='button' intensity='soft' type='button' onClick={() => setIsOpen(true)} className={buttonClassName}>
            {sortLabels[sortKey]}
          </PressableMotion>
          <Toggle width={20} height={20} toggled={isOpen} onToggle={(next) => setIsOpen(next)} />
        </div>
      )}

      <BottomSheetModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {/* 화면 하단을 덮는 모달이라 내비게이션 높이는 더하지 않는다. 여백 50px이 홈 인디케이터보다 크므로 max로 겹쳐 쓴다. */}
        <div
          className='flex flex-col gap-[30px] px-[25px] pt-[45px]'
          style={{ paddingBottom: 'max(50px, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className='text-b-18 text-[var(--ColorBlack,#202023)]'>{modalTitle}</div>
          <div className='flex flex-col gap-[20px] px-[7px]'>
            {sortKeys.map((key) => (
              <div key={key} className='flex items-center justify-between'>
                <PressableMotion
                  as='button'
                  intensity='soft'
                  type='button'
                  className='text-m-16 text-[var(--ColorGray3,#646464)]'
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                >
                  {displayLabels[key]}
                </PressableMotion>
                <BoardTypeToggle
                  selected={sortKey === key}
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                  label={displayLabels[key]}
                />
              </div>
            ))}
          </div>
        </div>
      </BottomSheetModal>
    </>
  );
};

export default SortSelector;
