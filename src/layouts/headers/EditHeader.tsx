import type { CSSProperties, ReactNode } from 'react';
import Icon, {type IconName} from '../../components/Icon';
import { useNavigate } from 'react-router-dom';
import { isStandalone } from '../../utils/isStandalone';

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
  // PWA(홈 화면 설치)는 원래 값(10)이 이미 잘 맞아서 유지, 브라우저 탭은 Figma 스펙(15) 적용
  const headerPaddingTop = isStandalone() ? 10 : 15;
  return (
    <header
      //고정 헤더.
      className='sticky left-0 right-0 top-0 z-50 inline-flex w-full items-center bg-white px-[25px] py-[10px] [container-type:inline-size]'
      style={{
        paddingTop: `calc(${headerPaddingTop}px + env(safe-area-inset-top, 0px))`,
      }}
      role='banner'
    >
      {/* 왼쪽 슬롯: 취소 아이콘 */}
      <div className='flex w-[28px] items-center justify-start z-10'>
        <button
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
        </button>
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
