import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type Size = number | string;

type InputProps = {
  width?: Size;
  height?: Size;
  label?: string;
  className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

const toCssSize = (value?: Size) =>
  value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value;

const Input = forwardRef<HTMLTextAreaElement, InputProps>(
  ({ width = 325, height = 37, label, className = '', style, ...props }, ref) => {
    const widthCss = toCssSize(width);
    const heightCss = toCssSize(height);

    return (
      <label className='flex flex-col gap-1 items-start w-full' style={{ width: widthCss }}>
        {label && <span className='text-R-12 text-black'>{label}</span>}
        <textarea
          ref={ref}
          className={`rounded-[10px] border border-gray-150 px-3 py-2 bg-white placeholder:text-gray-650 resize-none overflow-y-auto outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition 
            font-sans font-normal text-[16px] leading-[140%] tracking-[-0.04em] text-gray-750
            [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-650 [&::-webkit-scrollbar-track]:bg-transparent ${className}`}
          style={{ width: widthCss, height: heightCss, ...style, scrollbarWidth: 'thin' }}
          {...props}
        />
      </label>
    );
  },
);

Input.displayName = 'Input';

export type { InputProps };
export default Input;
