import { motion } from 'framer-motion';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import PressableMotion from './PressableMotion';

export type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  children?: ReactNode;
  className?: string;
  isVisible?: boolean;
};

export function Tabs({
  tabs,
  activeId,
  onChange,
  children,
  className = '',
  isVisible = true,
}: TabsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });

  // activeId가 가리키는 탭 버튼 wrapper의 실제 위치를 읽어 indicator 상태에 반영합니다.
  // active 탭이 아직 렌더링되지 않았거나 Tabs가 숨겨진 직후라면 indicator를 숨겨 잘못된 위치 표시를 막습니다.
  const updateIndicator = useCallback(() => {
    const activeTab = tabRefs.current[activeId];

    if (!activeTab) {
      setIndicator({
        left: 0,
        width: 0,
        visible: false,
      });
      return;
    }

    setIndicator({
      left: activeTab.offsetLeft,
      width: activeTab.offsetWidth,
      visible: true,
    });
  }, [activeId]);

  /*
   * useEffect를 쓰면 첫 페인트 이후 위치가 보정되면서 밑줄이 순간적으로 0,0 또는 이전 위치에
   * 보일 수 있으므로, 레이아웃 계산 직후 페인트 전에 실행되는 useLayoutEffect를 사용합니다.
   *
   * ResizeObserver는 탭 라벨 길이, 폰트 로딩, 반응형 폭 변화, 탭 목록 변경 등으로
   * container 크기가 바뀌는 경우에도 indicator를 다시 맞추기 위해 사용합니다.
   */
  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(updateIndicator);

    const container = containerRef.current;

    if (!container) {
      window.cancelAnimationFrame(animationFrameId);
      return;
    }

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isVisible, tabs, updateIndicator]);

  return (
    <div className={`w-full ${className}`}>
      {isVisible && (
        <motion.div
          ref={containerRef}
          layoutRoot
          role='tablist'
          className='relative flex w-full justify-evenly pb-2.5'
        >
          {tabs.map((tab) => {
            const isActive = activeId === tab.id;

            return (
              // wrapper에 ref를 두면 PressableMotion 내부 구현과 무관하게 안정적으로 offset을 측정할 수 있습니다.
              <div
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                className='relative shrink-0'
              >
                <PressableMotion
                  as='button'
                  role='tab'
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  intensity='soft'
                  type='button'
                  className={[
                    'relative shrink-0 cursor-pointer whitespace-nowrap',
                    'bg-transparent px-3 py-2',
                    'text-[16px] font-semibold leading-[140%] tracking-[-0.64px]',
                    'transition-colors duration-150',
                    isActive ? 'text-[#202023]' : 'text-[#A1A1A1]',
                  ].join(' ')}
                  onClick={() => onChange(tab.id)}
                >
                  <span className='relative z-10'>{tab.label}</span>
                </PressableMotion>
              </div>
            );
          })}

          <span className='absolute inset-x-0 bottom-0 z-0 h-px bg-gray-650' />

          {/* 실제 underline은 하나만 렌더링하고, 측정된 active 탭 위치로 left/width를 애니메이션합니다. */}
          <motion.span
            aria-hidden='true'
            className='absolute bottom-0 z-10 h-0.5 bg-primary'
            initial={false}
            animate={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.visible ? 1 : 0,
            }}
            transition={{
              type: 'spring',
              bounce: 0.2,
              duration: 0.6,
            }}
          />
        </motion.div>
      )}

      {children && <div>{children}</div>}
    </div>
  );
}
