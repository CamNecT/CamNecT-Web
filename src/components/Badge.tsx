import type { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color?: string;
};

const Badge = ({ color, className = '', style, ...props }: BadgeProps) => {
  return (
    <span
      className={`absolute -top-[2px] -right-[2px] w-[5.55px] h-[5.55px] rounded-full opacity-100 ${color ? '' : 'bg-primary'} ${className}`}
      style={{ backgroundColor: color, ...style }}
      {...props}
    />
  );
};

export type { BadgeProps };
export default Badge;
