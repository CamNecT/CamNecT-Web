import { useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import PressableMotion from '../PressableMotion';

type Size = number | string;

type OnOffToggleProps = {
  toggled?: boolean;
  defaultToggled?: boolean;
  onToggle?: (next: boolean) => void;
  width?: Size;
  height?: Size;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onToggle'>;

const toCssSize = (value?: Size) =>
  value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value;

type ToggleStyle = CSSProperties & {
  '--toggle-width'?: string;
  '--toggle-height'?: string;
};

const OnOffToggle = ({
  toggled,
  defaultToggled = false,
  onToggle,
  width = 39,
  height = 17,
  className = '',
  style,
  ...props
}: OnOffToggleProps) => {
  const [internal, setInternal] = useState(defaultToggled);
  const isControlled = toggled !== undefined;
  const isOn = isControlled ? toggled : internal;

  const handleClick = () => {
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onToggle?.(next);
  };

  const dimensionStyle: ToggleStyle = {
    width: toCssSize(width),
    height: toCssSize(height),
    borderRadius: '23px',
    padding: '1px',
    backgroundColor: isOn ? 'var(--color-primary)' : 'var(--color-gray-300)',
    transition: 'background-color 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    ['--toggle-width']: toCssSize(width),
    ['--toggle-height']: toCssSize(height),
  };

  const knobStyle: CSSProperties = {
    width: 'calc(var(--toggle-height) - 2px)',
    height: 'calc(var(--toggle-height) - 2px)',
    borderRadius: '50%',
    backgroundColor: 'var(--color-white)',
    transform: isOn ? 'translateX(calc(var(--toggle-width) - var(--toggle-height)))' : 'translateX(0)',
    transition: 'transform 0.2s ease',
  };

  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      aria-pressed={isOn}
      onClick={handleClick}
      className={`p-0 ${className}`}
      style={{ ...dimensionStyle, ...style }}
      {...props}
    >
      <span style={knobStyle} />
    </PressableMotion>
  );
};

export type { OnOffToggleProps };
export default OnOffToggle;
