import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

// InputHTMLAttributes<HTMLInputElement> : <input>이 원래 받을 수 있는 props 타입
// extends : 기본 input props를 물려받고, SingleInput 전용 props(label, error 등)를 추가
interface SingleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string; // 라벨용 className
  error?: string;
  helperText?: string;
  successMessage?: string;
  inputClassName?: string; // 내부 input태그의 className
  rightIcon?: ReactNode;
  rightIconAriaLabel?: string;
  rightIconAriaPressed?: boolean;
  onRightIconClick?: () => void; 
}

/**
 * SingleInput: 한 줄 입력을 위한 공통 컴포넌트
 * - 에러 메시지 자동 표시
 * - forwardRef : props로 받은 ref를 실제 input태그에 주입 (ref는 컴포넌트에 직접 사용 불가)
 */

// forwardRef<HTMLInputElement, SingleInputProps> : ref 대상은 input, props 타입은 SingleInputProps
const SingleInput = forwardRef<HTMLInputElement, SingleInputProps>(
  // ...props : placeholder, value, onChange 등 나머지 input props를 실제 input에 전달
  ({
    label,
    labelClassName,
    error,
    helperText,
    successMessage,
    className = '',
    inputClassName = '',
    rightIcon,
    rightIconAriaLabel,
    rightIconAriaPressed,
    onRightIconClick,
    type = 'text',
    ...props
  }, ref) => {
    return (
      <div className={`w-full flex flex-col gap-[8px] ${className}`}>
        {/* 라벨 (optional) */}
        {label && (
          <label className={`text-m-16 text-gray-900 tracking-[-0.32px] ${labelClassName}`}>
            {label}
          </label>
        )}

        <div className="relative">
          {/* ref : 부모가 넘긴 ref를 실제 input DOM에 연결 */}
          <input
            ref={ref}
            type={type}
            className={`
              w-full h-[48px] pl-[20px] pr-[20px] rounded-[5px] border bg-white
              text-r-16 text-gray-900 placeholder:text-gray-400
              focus:outline-none transition-all duration-200
              ${error 
                ? 'border-red-500 focus:border-red-500' // 에러가 있을 때
                : 'border-gray-150 focus:border-primary' // 정상일 때
              }
              disabled:bg-gray-50 disabled:text-gray-400
              ${inputClassName}
            `}
            {...props}
          />
          {rightIcon && (
            onRightIconClick ? ( 
              // click가능한 아이콘일때 
              <button
                type="button"
                onClick={onRightIconClick}
                aria-label={rightIconAriaLabel}
                aria-pressed={rightIconAriaPressed}
                className="absolute right-[16px] top-1/2 -translate-y-1/2 flex items-center justify-center"
              >
                {rightIcon}
              </button>
            ) : (
              <span className="absolute right-[16px] top-1/2 -translate-y-1/2 flex items-center justify-center">
                {rightIcon}
              </span>
            )
          )}
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
