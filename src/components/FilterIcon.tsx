import type { CSSProperties } from 'react';
import PressableMotion from './PressableMotion';
import Icon from './Icon';

type FilterIconProps = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  largeTouchTarget?: boolean;
};

const FilterIcon = ({
  onClick,
  ariaLabel = '필터 설정',
  className,
  style,
  largeTouchTarget = false,
}: FilterIconProps) => {
  const buttonClassName = [
    // 적용된 필터 칩과 동일한 높이로 맞춰 필터 영역의 세로폭을 일정하게 유지한다.
    'flex items-center justify-center bg-transparent p-0',
    largeTouchTarget ? 'size-12 shrink-0 rounded-[5px] active:bg-gray-150' : 'size-[25px] rounded-[3px]',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const border = '1px solid var(--ColorGray2, #A1A1A1)';
  const icon = <Icon name='filter' size={16} color='#A1A1A1' />;

  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      aria-label={ariaLabel}
      onClick={onClick}
      className={buttonClassName}
      style={largeTouchTarget ? style : { border, ...style }}
    >
      {largeTouchTarget ? (
        // 테두리를 안쪽으로 옮겨 필터 아이콘의 기존 25px 모양을 유지한다.
        <span className='flex size-[25px] items-center justify-center rounded-[3px]' style={{ border }}>
          {icon}
        </span>
      ) : icon}
    </PressableMotion>
  );
};

export default FilterIcon;
