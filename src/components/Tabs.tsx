import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
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

export function Tabs({ tabs, activeId, onChange, children, className = '', isVisible = true }: TabsProps) {
  return ( 
    <div className={`w-full ${className}`}>
      {isVisible &&
        <div className='relative flex w-full justify-evenly pb-2.5'>
        {tabs.map((tab) => (
          <PressableMotion
            as='button'
            intensity='soft'
            key={tab.id}
            type='button'
            className={`relative px-3 py-2 text-[16px] leading-[140%] tracking-[-0.64px] font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 bg-transparent cursor-pointer ${
              activeId === tab.id ? 'text-[#202023]' : 'text-[#A1A1A1]'
            }`}
            onClick={() => onChange(tab.id)}
          >
            <span className='tab-label relative z-10'>{tab.label}</span>
            {activeId === tab.id && (
              <motion.span
                layoutId='activeTabUnderline'
                className='absolute bottom-[-10px] left-0 right-0 h-0.5 bg-primary'
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </PressableMotion>
        ))}
        {/* 하단 전체 가로선 */}
          <span className='absolute left-0 right-0 bottom-0 h-[1px] bg-gray-650' />
        </div>
      }
      {children && <div>{children}</div>}
    </div>
  );
}
