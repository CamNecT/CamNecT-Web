import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SingleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string; // 라벨용 className
  error?: string;
  helperText?: string;
  successMessage?: string;
}

/**
 * SingleInput: 한 줄 입력을 위한 공통 컴포넌트
 * - 디자인 일관성 유지 (Border, Radius, Padding 등)
 * - 에러 메시지 자동 표시
 * - forwardRef : props로 받은 ref를 실제 input태그에 주입
 */
const SingleInput = forwardRef<HTMLInputElement, SingleInputProps>(
  ({ label, labelClassName, error, helperText, successMessage, className = '', type = 'text', ...props }, ref) => {
    return (
      <div className={`w-full flex flex-col gap-[8px] ${className}`}>
        {/* 라벨 (optional) */}
        {label && (
          <label className={`text-m-16 text-gray-900 tracking-[-0.32px] ${labelClassName}`}>
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={`
              w-full h-[60px] px-[20px] rounded-[10px] border bg-white
              text-r-16 text-gray-900 placeholder:text-gray-400
              focus:outline-none transition-all duration-200
              ${error 
                ? 'border-red-500 focus:border-red-500' // 에러가 있을 때
                : 'border-gray-150 focus:border-primary' // 정상일 때
              }
              disabled:bg-gray-50 disabled:text-gray-400
            `}
            {...props}
          />
        </div>

        {/* 에러 > 성공 메시지 > 도움말 메시지 */}
        {error ? (
          <p className="text-r-12 text-red-500 tracking-[-0.24px] font-normal pl-[2px]">
            *{error}
          </p>
        ) : successMessage ? (
          <p className="text-r-12 text-green-500 tracking-[-0.24px] font-normal pl-[2px]">
            *{successMessage}
          </p>
        ) : helperText ? (
          <p className="text-r-12 text-gray-600 tracking-[-0.24px] font-normal pl-[2px]">
            *{helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

SingleInput.displayName = 'SingleInput';

export default SingleInput;
