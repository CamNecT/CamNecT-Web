import type { ButtonHTMLAttributes } from 'react';
import { useState } from 'react';
import PressableMotion from '../PressableMotion';

type Size = number | string;

type ToggleProps = {
  toggled?: boolean;
  defaultToggled?: boolean;
  onToggle?: (next: boolean) => void;
  width?: Size;
  height?: Size;
  strokeColor?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onToggle'>;

const toCssSize = (value?: Size) =>
  value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value;

const Toggle = ({
  toggled,
  defaultToggled = false,
  onToggle,
  width = 24,
  height = 24,
  strokeColor = '#202023',
  className = '',
  style,
  ...props
}: ToggleProps) => {
  const [internal, setInternal] = useState(defaultToggled);
  const isControlled = toggled !== undefined;
  const isOn = isControlled ? toggled : internal;

  const handleClick = () => {
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onToggle?.(next);
  };

  const dimensionStyle = {
    width: toCssSize(width),
    height: toCssSize(height),
  };

  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      aria-pressed={isOn}
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-full transition-colors cursor-pointer ${className}`}
      style={{ ...dimensionStyle, ...style }}
      {...props}
    >
      {isOn ? (
        <svg className='rotate-180' xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M16.25 6.875L10 13.125L3.75 6.875" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M16.25 6.875L10 13.125L3.75 6.875" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

      )}
    </PressableMotion>
  );
};

export type { ToggleProps };
export default Toggle;
