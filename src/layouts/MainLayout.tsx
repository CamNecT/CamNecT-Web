import type { ReactNode } from 'react';
import Icon from '../components/Icon';
import { isStandalone } from '../utils/isStandalone';

type MainLayoutProps = {
  title: string;
  rightElement?: ReactNode;
  onBack?: () => void;
  children?: ReactNode;
};

const MainLayout = ({ title, rightElement, onBack, children }: MainLayoutProps) => {
  // PWA(홈 화면 설치)는 원래 값(10)이 이미 잘 맞아서 유지, 브라우저 탭은 Figma 스펙(15) 적용
  const headerPaddingTop = isStandalone() ? 10 : 15;
  return (
    <div
      className='min-h-screen flex justify-center bg-[#f5f6f7] [container-type:inline-size]'
      style={{ minHeight: '100dvh' }}
    >
      <div className='flex min-h-[100dvh] w-[clamp(320px,100cqw,540px)] flex-col items-center bg-white'>
        <header
          className='sticky left-0 right-0 top-0 z-50 grid w-full grid-cols-[24px_1fr_24px] items-center bg-white px-[25px] py-[10px]'
          style={{
            paddingTop: `calc(${headerPaddingTop}px + env(safe-area-inset-top, 0px))`,
          }}
        >
          <button type='button' className='flex items-center justify-start' onClick={onBack}>
            <Icon name='arrow_left' className='w-[28px] h-[28px]' style={{ color: 'var(--ColorBlack,#202023)' }} />
          </button>
          <div
            className='text-center font-semibold leading-[140%] tracking-[-0.02em] text-[#202023]'
            style={{ fontSize: 'clamp(16px, 4.2cqw, 20px)' }}
          >
            {title}
          </div>
          <div className='flex items-center justify-end'>
            {rightElement ?? <span className='block w-6 h-6' />}
          </div>
        </header>

        <main className='w-full flex-1 bg-white'>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
