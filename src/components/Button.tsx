import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { BUTTON_FONT, type ButtonFont } from '../constants/buttonFont';

type ButtonProps = {
  label: string;
  font?: ButtonFont;
  loading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>;

// 사용법
// - 글씨 : font prop으로 주입한다 (기본 'sb-18' = 기존 로그인 버튼 글씨). 종류는 buttonFont.ts 참고
// - 크기/모양 : className으로 덮어쓴다 (twMerge가 충돌 부분만 override)
//              기본 폭(max-w-[325px])보다 넓게 쓰려면 className에 max-w-none
// - twMerge(A,B) : B가 A를 덮어쓴다 (A와 충돌하는 부분만)
//
// ⚠️ 폰트(BUTTON_FONT)는 twMerge '밖'에서 붙인다. text-sb-18 같은 커스텀 토큰을
//    twMerge가 색(text-color)으로 오인해서 base의 text-white를 지워버리기 때문.
const Button = ({ label, font = 'sb-18', className = '', disabled, loading = false, ...props }: ButtonProps) => {

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`${twMerge(
        `max-w-[325px] w-full h-[50px] rounded-[25px] flex items-center justify-center rotate-0 transition
        ${isDisabled
          ? 'bg-gray-150 text-gray-750 cursor-not-allowed'
          : 'bg-primary text-white cursor-pointer'
        }`,
        className
      )} ${BUTTON_FONT[font]}`}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;
