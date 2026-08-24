import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { BUTTON_FONT, type ButtonFont } from '../constants/buttonFont';
import PressableMotion from './PressableMotion';

type ButtonWhiteProps = {
  label: string;
  font?: ButtonFont;
} & ButtonHTMLAttributes<HTMLButtonElement>;

// 사용법은 Button과 동일 (글씨 = font prop, 크기/모양 = className)
// - 기본 font 'sb-18' = 기존 흰 버튼 글씨. 종류는 buttonFont.ts 참고
// - active 탭 효과는 제거됨 → 추후 PressableMotion으로 공통 적용 예정
//
// ⚠️ 폰트(BUTTON_FONT)는 twMerge '밖'에서 붙인다. text-sb-18 같은 커스텀 토큰을
//    twMerge가 색으로 오인해서 base의 text-primary를 지워버리기 때문. (안으로 옮기지 말 것)
const ButtonWhite = ({ label, font = 'sb-18', className = '', disabled, ...props}: ButtonWhiteProps) => {
  return (
    <PressableMotion
      as="button"
      intensity="strong"
      disabled={disabled}
      className={`${twMerge(
        `max-w-[325px] w-full h-[50px] rounded-[25px] flex items-center justify-center rotate-0 transition
        ${disabled
          ? 'bg-gray-150 border-gray-150 text-gray-750 cursor-not-allowed'
          : 'border border-primary bg-white text-primary cursor-pointer'
        }`,
        className
      )} ${BUTTON_FONT[font]}`}
      {...props}
    >
      {label}
    </PressableMotion>
  );
};

export type { ButtonWhiteProps };
export default ButtonWhite;
