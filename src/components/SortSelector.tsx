import { useState } from 'react';
import BottomSheetModal from './BottomSheetModal/BottomSheetModal';
import BoardTypeToggle from './BoardTypeToggle';
import PressableMotion from './PressableMotion';
import Toggle from './Toggle/Toggle';

type SortSelectorProps<SortKey extends string> = {
  sortKey: SortKey;
  sortLabels: Record<SortKey, string>;
  onChange: (next: SortKey) => void;
  modalTitle?: string;
  buttonClassName?: string;
};

const SortSelector = <SortKey extends string>({
  sortKey,
  sortLabels,
  onChange,
  modalTitle = '정렬',
  buttonClassName = 'text-r-14 text-[var(--ColorGray2,#A1A1A1)]',
}: SortSelectorProps<SortKey>) => {
  const [isOpen, setIsOpen] = useState(false);
  const sortKeys = Object.keys(sortLabels) as SortKey[];

  return (
    <>
      <div className='flex items-center gap-[6px]'>
        <PressableMotion as='button' intensity='soft' type='button' onClick={() => setIsOpen(true)} className={buttonClassName}>
          {sortLabels[sortKey]}
        </PressableMotion>
        <Toggle width={20} height={20} toggled={isOpen} onToggle={(next) => setIsOpen(next)} />
      </div>

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
                  {sortLabels[key]}
                </PressableMotion>
                <BoardTypeToggle
                  selected={sortKey === key}
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                  label={sortLabels[key]}
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
