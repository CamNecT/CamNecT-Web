import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav/BottomNav';

// 헤더 레이아웃. 필요한 화면에서는 하단 내비를 함께 표시한다.
type FullLayoutProps = {
  headerSlot?: ReactNode;
  children?: ReactNode;
  includeBottomSafeArea?: boolean;
  showBottomNav?: boolean;
};

export const HeaderLayout = ({
  headerSlot,
  children,
  includeBottomSafeArea = true,
  showBottomNav = false,
}: FullLayoutProps) => {
  const bottomPadding = showBottomNav
    ? 'calc(76px + env(safe-area-inset-bottom, 0px))'
    : includeBottomSafeArea ? 'calc(20px + env(safe-area-inset-bottom))' : 20;

  return (
    <div
      className="w-full min-h-[100dvh] min-h-0 relative bg-white flex flex-col"
      style={{ paddingBottom: bottomPadding }}
    >
      {headerSlot ?? null}
      <main className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
        {children ?? <Outlet />}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
};
