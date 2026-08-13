import type { CSSProperties } from 'react';
import PressableMotion from './PressableMotion';

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
      <svg
        width='23'
        height='23'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M10.7273 7.2H19M10.7273 7.2C10.7273 7.51826 10.5932 7.82348 10.3545 8.04853C10.1158 8.27357 9.79209 8.4 9.45455 8.4C9.117 8.4 8.79327 8.27357 8.55459 8.04853C8.31591 7.82348 8.18182 7.51826 8.18182 7.2M10.7273 7.2C10.7273 6.88174 10.5932 6.57652 10.3545 6.35147C10.1158 6.12643 9.79209 6 9.45455 6C9.117 6 8.79327 6.12643 8.55459 6.35147C8.31591 6.57652 8.18182 6.88174 8.18182 7.2M8.18182 7.2H5M10.7273 16.8H19M10.7273 16.8C10.7273 17.1183 10.5932 17.4235 10.3545 17.6485C10.1158 17.8736 9.79209 18 9.45455 18C9.117 18 8.79327 17.8736 8.55459 17.6485C8.31591 17.4235 8.18182 17.1183 8.18182 16.8M10.7273 16.8C10.7273 16.4817 10.5932 16.1765 10.3545 15.9515C10.1158 15.7264 9.79209 15.6 9.45455 15.6C9.117 15.6 8.79327 15.7264 8.55459 15.9515C8.31591 16.1765 8.18182 16.4817 8.18182 16.8M8.18182 16.8H5M15.8182 12H19M15.8182 12C15.8182 12.3183 15.6841 12.6235 15.4454 12.8485C15.2067 13.0736 14.883 13.2 14.5455 13.2C14.2079 13.2 13.8842 13.0736 13.6455 12.8485C13.4068 12.6235 13.2727 12.3183 13.2727 12M15.8182 12C15.8182 11.6817 15.6841 11.3765 15.4454 11.1515C15.2067 10.9264 14.883 10.8 14.5455 10.8C14.2079 10.8 13.8842 10.9264 13.6455 11.1515C13.4068 11.3765 13.2727 11.6817 13.2727 12M13.2727 12H5'
          stroke='var(--ColorGray2, #A1A1A1)'
          strokeWidth='1.3'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </PressableMotion>
  );
};

export default FilterIcon;
