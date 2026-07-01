import type { ButtonHTMLAttributes } from 'react';

type SmallButtonProps = {
  label: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const SmallButton = ({ label, className = '', disabled, type, ...props }: SmallButtonProps) => {
  return (
    <button
      disabled={disabled}
      type={type}
      className={`
        w-[74px] h-[48px] rounded-[5px] flex items-center justify-center
        text-white text-m-16 tracking-[-0.4px] transition
        ${disabled
          ? 'bg-gray-150 cursor-not-allowed'
          : 'bg-primary cursor-pointer hover:bg-green-100 active:scale-95 active:brightness-95'
        }
        ${className}
      `}
      {...props}
    >
      {label}
    </button>
  );
};

export default SmallButton;
