import type { ButtonHTMLAttributes } from 'react';
import PressableMotion from './PressableMotion';

type CategoryIconProps = {
  label: string;
  selected: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

const CategoryIcon = ({
  label,
  selected,
  className = '',
  style,
  onClick,
  ...props
}: CategoryIconProps) => {
  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center ${className}`}
      style={{
        display: 'flex',
        padding: '5px 15px',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        borderRadius: '30px',
        border: selected ? '1px solid var(--ColorMain, #00C56C)' : '1px solid var(--ColorGray2, #A1A1A1)',
        background: selected ? 'var(--ColorMain, #00C56C)' : 'transparent',
        color: selected ? '#fff' : 'var(--ColorBlack, #202023)',
        ...style,
      }}
      {...props}
    >
      {label}
    </PressableMotion>
  );
};

export type { CategoryIconProps };
export default CategoryIcon;
