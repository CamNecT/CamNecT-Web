import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

// Header (O) BottomNav (X) 레이아웃
type FullLayoutProps = {
  headerSlot?: ReactNode;
  children?: ReactNode;
  includeBottomSafeArea?: boolean;
};

export const HeaderLayout = ({
  headerSlot,
  children,
  includeBottomSafeArea = true,
}: FullLayoutProps) => {
  return (
    <div
      className="w-full min-h-[100dvh] min-h-0 relative bg-white flex flex-col"
      style={{ paddingBottom: includeBottomSafeArea ? 'calc(20px + env(safe-area-inset-bottom))' : 20 }}
    >
      {headerSlot ?? null}
      <main className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};
