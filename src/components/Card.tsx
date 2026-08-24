import type { HTMLAttributes, ReactNode, KeyboardEvent } from 'react';
import PressableMotion from './PressableMotion';

type Size = number | string;

type CardProps = {
  width?: Size;
  height?: Size;
  children?: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const toPx = (value: Size) => (typeof value === 'number' ? `${value}px` : value);

const Card = ({
  width = 325,
  height = 206,
  children,
  className = '',
  style,
  role,
  tabIndex,
  onClick,
  onKeyDown,
  ...props
}: CardProps) => {
  const cardWidth = toPx(width);
  const cardHeight = toPx(height);
  const isClickable = typeof onClick === 'function';
  const resolvedRole = role ?? (isClickable ? 'button' : undefined);
  const resolvedTabIndex = tabIndex ?? (isClickable ? 0 : undefined);
  const resolvedOnKeyDown =
    onKeyDown ??
    (isClickable
      ? (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }
      : undefined);

  const Component = isClickable ? PressableMotion : 'div';
  const motionProps = isClickable ? { intensity: 'soft' as const } : {};

  return (
    <Component
      className={`bg-white border border-gray-150 rounded-[12px] opacity-100 ${className}`}
      style={{ width: cardWidth, height: cardHeight, ...style }}
      role={resolvedRole}
      tabIndex={resolvedTabIndex}
      onClick={onClick}
      onKeyDown={resolvedOnKeyDown}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export type { CardProps };
export default Card;
