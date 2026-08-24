import FilterIcon from './FilterIcon';
import Icon from './Icon';

type FilterHeaderProps = {
  activeFilters: string[];
  onOpenFilter: () => void;
  onRemoveFilter: (filter: string) => void;
};

const FilterHeader = ({ activeFilters, onOpenFilter, onRemoveFilter }: FilterHeaderProps) => {
  return (
    <div className='flex flex-wrap items-center gap-[15px]'>
      <FilterIcon onClick={onOpenFilter} />

      <div className='flex flex-wrap items-center gap-[10px]'>
        {activeFilters.map((filter) => (
          // 선택된 필터가 추가되어도 헤더 행 높이가 커지지 않도록 칩 높이를 고정한다.
          <button
            key={filter}
            type='button'
            onClick={() => onRemoveFilter(filter)}
            className='flex h-[25px] items-center gap-[5px] rounded-[5px] border border-[var(--ColorGray2,#A1A1A1)] bg-[var(--ColorGray1,#ECECEC)] px-[8px] py-0'
          >
            <span className='text-m-12 text-gray-750'>{filter}</span>
            <Icon name='x' size={12} color='#A1A1A1' />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterHeader;
