import type { HTMLAttributes } from 'react';

export type StatusBadgeVariant = 'gray' | 'green' | 'type';

type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const VARIANT_STYLE: Record<
  StatusBadgeVariant,
  { border: string; color: string; background: string }
> = {
  gray: {
    border: '1px solid var(--ColorGray2, #A1A1A1)',
    color: 'var(--ColorGray2, #A1A1A1)',
    background: 'transparent',
  },
  green: {
    border: '1px solid var(--ColorMain, #00C56C)',
    color: 'var(--ColorMain, #00C56C)',
    background: '#FFFFFF',
  },
  type: {
    border: '1px solid var(--ColorMain, #00C56C)',
    color: 'var(--ColorMain, #00C56C)',
    background: 'var(--ColorSub2, #F2FCF8)',
  },
};

const StatusBadge = ({ label, variant = 'gray', className = '', style, ...props }: StatusBadgeProps) => {
  const variantStyle = VARIANT_STYLE[variant];

  return (
    <div
      className={`inline-flex h-[24px] items-center justify-center py-[5px] px-[10px] text-r-12-hn box-border rounded-[5px] whitespace-nowrap ${className}`}
      style={{
        border: variantStyle.border,
        color: variantStyle.color,
        background: variantStyle.background,
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {label}
    </div>
  );
};

export default StatusBadge;