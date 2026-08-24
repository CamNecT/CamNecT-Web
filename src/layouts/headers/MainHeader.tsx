import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import Badge from '../../components/Badge';
import Icon, { type IconName } from '../../components/Icon';
import PressableMotion from '../../components/PressableMotion';
import { logout } from '../../api/profileApi';
import { useAuthStore } from '../../store/useAuthStore';

type HeaderAction = {
  icon: IconName;
  onClick?: () => void;
  ariaLabel?: string;
  style?: CSSProperties;
};

type LeftAction = {
  icon?: IconName;
  onClick?: () => void;
  ariaLabel?: string;
  style?: CSSProperties;
};

type MainHeaderProps = {
  title?: string;
  rightActions?: HeaderAction[];
  rightElement?: ReactNode;
  leftAction?: LeftAction;
  leftIcon?: 'empty';
  leftAriaLabel?: string;
  // 뱃지 관련 속성 추가
  showBadge?: boolean;
  isAdmin?: boolean;
  className?: string;
};

export const MainHeader = ({
  title,
  rightActions,
  rightElement,
  leftAction,
  leftIcon,
  leftAriaLabel,
  showBadge,
  isAdmin,
  className,
}: MainHeaderProps) => {
  const navigate = useNavigate();
  const setLogout = useAuthStore((s) => s.setLogout);
  const authUserId = useAuthStore((s) => s.user?.id);
  const handleLogout = async () => {
    try {
      const loginUserId = Number(authUserId);
      if (Number.isFinite(loginUserId)) {
        await logout(loginUserId);
      }
    } catch (e) {
      console.warn('logout failed:', e);
    } finally {
      setLogout();
      navigate('/login');
    }
  };

  const normalizedRightActions = rightActions ?? [];
  // 왼쪽 아이콘 기본 동작: 별도 전달이 없으면 mainBack + 뒤로가기(-1)
  // isAdmin인 경우 로그아웃 아이콘과 동작으로 고정
  const leftIconName = isAdmin ? 'logOut' : (leftAction?.icon ?? 'arrow_left');
  const leftClickHandler = isAdmin ? handleLogout : (leftAction?.onClick ?? (() => navigate(-1)));
  const leftLabel = isAdmin ? '로그아웃' : (leftAction?.ariaLabel ?? leftAriaLabel ?? '뒤로 가기');

  return (
    <header
      className={twMerge('sticky left-0 right-0 top-0 z-50 inline-flex w-full items-center bg-white px-[25px] py-0 [container-type:inline-size]', className)}
      style={{
        // 노치 영역은 전체 높이에 별도로 더하고 실제 헤더 콘텐츠 영역은 항상 50px로 유지한다.
        height: 'calc(50px + env(safe-area-inset-top, 0px))',
        minHeight: 'calc(50px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      role='banner'
    >
      <div className='flex w-[28px] items-center justify-start z-10'>
        {/* leftIcon="empty"를 받으면 좌측 아이콘 영역 자체를 숨김 */}
        {leftIcon !== 'empty' ? (
          <PressableMotion as='button' intensity='soft' type='button' className='flex items-center justify-center' onClick={leftClickHandler} aria-label={leftLabel}>
            <Icon
              name={leftIconName}
              style={{
                width: 'clamp(24px, 7.467cqw, 28px)',
                height: 'clamp(24px, 7.467cqw, 28px)',
                color: leftIconName === 'arrow_left' ? 'var(--ColorBlack,#202023)' : undefined,
                // 개별 아이콘 스타일을 덮어쓰고 싶을 때 leftAction.style로 전달
                ...leftAction?.style,
              }}
            />
          </PressableMotion>
        ) : null}
      </div>
      {/* 제목은 헤더 항상 가운데 정렬 */}
      {title ? (
        <div
          className='absolute left-1/2 -translate-x-1/2 text-center text-sb-20 text-[var(--ColorBlack,#202023)] max-w-[60%] truncate'
          style={{ fontSize: 'clamp(18px, 5.333cqw, 20px)' }}
        >
          {title}
        </div>
      ) : null}
      <div className='flex min-w-[28px] flex-1 items-center justify-end gap-[15px] z-10'>
        {rightElement ?? null}
        {/* 오른쪽 액션 아이콘들: 없으면 아무 것도 렌더하지 않음 */}
        {normalizedRightActions.length > 0
          ? normalizedRightActions.map((action, index) => (
              <PressableMotion
                as='button'
                intensity='soft'
                key={action.icon}
                type='button'
                className='flex items-center justify-center'
                onClick={action.onClick}
                aria-label={action.ariaLabel ?? action.icon}
              >
                <span className='relative inline-flex'>
                  <Icon
                    name={action.icon}
                    style={{
                      width: 'clamp(24px, 7.467cqw, 28px)',
                      height: 'clamp(24px, 7.467cqw, 28px)',
                      color: action.icon === 'search' ? 'var(--ColorBlack,#202023)' : undefined,
                      // 개별 아이콘별 스타일 커스터마이징
                      ...action.style,
                    }}
                  />
                  {/* 뱃지 조건부 렌더링 */}
                  {showBadge && index === 0 ? <Badge /> : null}
                </span>
              </PressableMotion>
            ))
          : null}
      </div>
    </header>
  );
};
