import type { CSSProperties } from 'react';
import PressableMotion from './PressableMotion';
import Icon from './Icon';

type FilterIconProps = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const FilterIcon = ({
  onClick,
  ariaLabel = '필터 설정',
  className,
  style,
}: FilterIconProps) => {
  const buttonClassName = [
    // 적용된 필터 칩과 동일한 높이로 맞춰 필터 영역의 세로폭을 일정하게 유지한다.
    'flex h-[25px] w-[25px] items-center justify-center rounded-[3px] bg-transparent p-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      aria-label={ariaLabel}
      onClick={onClick}
      className={buttonClassName}
      style={{ border: '1px solid var(--ColorGray2, #A1A1A1)', ...style }}
    >
      <Icon name='filter' size={16} color='#A1A1A1' />
    </PressableMotion>
  );
};

export default FilterIcon;
