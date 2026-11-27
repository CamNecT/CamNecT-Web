import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { LinkifiedText } from './LinkifiedText';

type ExpandableIntroductionProps = {
  text: string;
  className?: string;
  textClassName?: string;
};

export const ExpandableIntroduction = ({
  text,
  className = '',
  textClassName = '',
}: ExpandableIntroductionProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const check = () => setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  // 펼친 카드 바깥을 누르면 접기
  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsExpanded(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isExpanded]);

  const baseTextClassName = `whitespace-pre-line [overflow-wrap:anywhere] ${textClassName}`;

  return (
    <div ref={wrapperRef} className={`relative min-w-0 ${className}`}>
      <div className='flex'>
        <p ref={textRef}
          className={`line-clamp-3 ${baseTextClassName} ${
            isOverflowing
              ? "before:float-right before:h-full before:mb-[-1lh] before:content-['']"
              : ''
          }`}
        >
          {isOverflowing ? (
            <button
              type='button'
              onClick={() => setIsExpanded(true)}
              className='float-right clear-both ml-[8px] flex items-center gap-[2px] text-m-14-hn leading-[inherit] text-gray-900'
            >
              더보기
              <Icon name='arrow_down' className='h-[20px] w-[20px] text-gray-900' />
            </button>
          ) : null}
          <LinkifiedText text={text} />
        </p>
      </div>

      {isExpanded ? (
        <div className='absolute -left-[12px] -right-[12px] -top-[12px] z-10 flex flex-col gap-[5px] rounded-[12px] border border-gray-150 bg-white px-[12px] py-[10px]'>
          <p className={baseTextClassName}>
            <LinkifiedText text={text} />
          </p>
          <button
            type='button'
            onClick={() => setIsExpanded(false)}
            className='flex items-center gap-[2px] self-end text-m-14-hn text-gray-900'
          >
            접기
            <Icon name='arrow_down' className='h-[20px] w-[20px] rotate-180 text-gray-900' />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ExpandableIntroduction;
