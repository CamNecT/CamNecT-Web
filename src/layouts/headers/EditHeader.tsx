import type { CSSProperties, ReactNode } from 'react';
import Icon, {type IconName} from '../../components/Icon';
import PressableMotion from '../../components/PressableMotion';
import { useNavigate } from 'react-router-dom';

type LeftAction = {
  icon?: IconName;
  onClick?: () => void;
  ariaLabel?: string;
  style?: CSSProperties;
};

type EditHeaderProps = {
  title: string;
  rightElement?: ReactNode;
  leftAction?: LeftAction;
};

export const EditHeader = ({ title, rightElement, leftAction }: EditHeaderProps) => {
  const navigate = useNavigate();
  const handleLeftClick =  leftAction?.onClick ?? (() => navigate(-1));
  const leftLabel = leftAction?.ariaLabel ?? "취소";
  return (
    <header
      //고정 헤더.
      className='sticky left-0 right-0 top-0 z-50 inline-flex w-full items-center bg-white px-[25px] py-0 [container-type:inline-size]'
      style={{
        height: 'calc(50px + env(safe-area-inset-top, 0px))',
        minHeight: 'calc(50px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      role='banner'
    >
      {/* 왼쪽 슬롯: 취소 아이콘 */}
      <div className='flex w-[28px] items-center justify-start z-10'>
        <PressableMotion
          as="button"
          intensity="soft"
          type="button"
          onClick={handleLeftClick}
          className="flex items-center justify-center"
          aria-label={leftLabel}
        >
          <Icon
            name={leftAction?.icon ?? "x"}
            style={{
              width: "clamp(24px, 7.467cqw, 28px)",
              height: "clamp(24px, 7.467cqw, 28px)",
              ...leftAction?.style,
            }}
          />
        </PressableMotion>
      </div>
      {/* 중앙 타이틀: 좌우 요소와 무관하게 정중앙 유지 */}
      <div
        className='absolute left-1/2 -translate-x-1/2 text-center text-sb-20 text-[var(--ColorBlack,#202023)] max-w-[60%] truncate'
        style={{ fontSize: 'clamp(18px, 5.333cqw, 20px)' }}
      >
        {title}
      </div>
      {/* 오른쪽 슬롯: 선택 액션 */}
      <div className='flex min-w-[28px] flex-1 items-center justify-end z-10'>{rightElement}</div>
    </header>
  );
};
