import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from "../layouts/BottomNav/BottomNav";

// Header (O) BottomNav (O) 레이아웃
type FullLayoutProps = {
  headerSlot?: ReactNode;
  bottomSlot?: ReactNode;
  children?: ReactNode;
  centerContent?: boolean;
};

export const FullLayout = ({ headerSlot, bottomSlot, children, centerContent = false }: FullLayoutProps) => {
  return (
    <div className={`w-full min-h-[100dvh] relative bg-white${centerContent ? ' flex flex-col' : ''}`}>
      {headerSlot ?? null}
      
      {/* 컨텐츠 하단이 BottomNav에 가려지지 않도록 패딩 추가 */}
      <main
        className={`w-full${centerContent ? ' flex flex-1 flex-col justify-center' : ''}`}
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        {children ?? <Outlet />}
      </main>
      
      {bottomSlot ?? <BottomNav />}
    </div>
  );
};
