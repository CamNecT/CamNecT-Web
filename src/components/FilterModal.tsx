import CategoryIcon from './CategoryIcon';
import BottomSheetModal from './BottomSheetModal/BottomSheetModal';
import Icon from './Icon';
import { interestOptions, majorOptions } from '../mock/filterOptions';

type FilterModalProps = {
  isOpen: boolean;
  activeTab: 'major' | 'interest';
  onTabChange: (tab: 'major' | 'interest') => void;
  draftMajor: string | null;
  draftInterests: string[];
  onToggleMajor: (department: string) => void;
  onToggleInterest: (item: string) => void;
  hasDraftSelection: boolean;
  onCancel: () => void;
  onApply: () => void;
};

const FilterModal = ({
  isOpen,
  activeTab,
  onTabChange,
  draftMajor,
  draftInterests,
  onToggleMajor,
  onToggleInterest,
  hasDraftSelection,
  onCancel,
  onApply,
}: FilterModalProps) => {
  return (
    <BottomSheetModal isOpen={isOpen} onClose={onCancel} height='min(649px,86dvh)'>
      <div className='relative flex h-full bg-[var(--Color_Gray_B,#FCFCFC)] [padding:clamp(14px,4cqw,28px)_clamp(18px,6cqw,25px)_clamp(24px,6cqw,38px)]'>
        {/* 닫기 아이콘: 드래프트 변경 취소 */}
        <button
          type='button'
          aria-label='필터 닫기'
          onClick={onCancel}
          className='absolute right-[25px] top-[25px]'
        >
          <Icon name='x' />
        </button>

        {/* 적용 아이콘: 드래프트가 있을 때만 노출 */}
        {hasDraftSelection && (
          <button
            type='button'
            aria-label='필터 적용'
            onClick={onApply}
            className='absolute bottom-[25px] right-[25px]'
          >
            <Icon name='check' />
          </button>
        )}

        <div className='flex w-full gap-[24px]'>
          {/* 좌측 탭: 전공/관심사 전환 */}
          <div className='flex flex-col border-r border-[var(--ColorGray2,#A1A1A1)] pr-[18px] [gap:32px]'>
            {[
              { key: 'major', label: '전공' },
              { key: 'interest', label: '관심사' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type='button'
                  onClick={() => onTabChange(tab.key as 'major' | 'interest')}
                  className={`text-left text-b-16-hn ${
                    isActive ? 'text-[color:var(--ColorBlack,#202023)]' : 'text-[color:var(--ColorGray2,#A1A1A1)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 우측 패널: 활성 탭의 옵션 목록 */}
          <div className='flex-1 overflow-y-auto pt-[4px]'>
            {activeTab === 'major' &&
              majorOptions.map((group) => (
                <div key={group.college} className='mb-[20px] flex flex-col gap-[12px]'>
                  <div className='text-b-18 tracking-[-0.72px] text-black'>{group.college}</div>
                  <div className='flex flex-wrap gap-[10px]'>
                    {group.departments.map((department) => (
                      <CategoryIcon
                        key={department}
                        label={department}
                        selected={draftMajor === department}
                        onClick={() => onToggleMajor(department)}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {activeTab === 'interest' &&
              interestOptions.map((interest) => (
                <div key={interest.category} className='mb-[20px] flex flex-col gap-[12px]'>
                  <div className='text-b-18 tracking-[-0.72px] text-black'>{interest.category}</div>
                  <div className='flex flex-wrap gap-[10px]'>
                    {interest.items.map((item) => (
                      <CategoryIcon
                        key={item}
                        label={item}
                        selected={draftInterests.includes(item)}
                        onClick={() => onToggleInterest(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </BottomSheetModal>
  );
};

export default FilterModal;
