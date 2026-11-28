import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
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
  const previewRef = useRef<HTMLParagraphElement>(null);
  const expandedTextId = useId();
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    // 버튼과 펼친 카드는 높이에 포함되지 않음 -> 3줄 밖에 본문이 남는지만 확인한다.
    const checkOverflow = () => setIsOverflowing(preview.scrollHeight > preview.clientHeight + 1);
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(preview);

    // 웹폰트가 늦게 들어오면 문단 크기가 그대로여도 줄바꿈이 바뀔 수 있어서 다시 확인한다.
    const fonts = document.fonts;
    fonts?.addEventListener('loadingdone', checkOverflow);
    return () => {
      observer.disconnect();
      fonts?.removeEventListener('loadingdone', checkOverflow);
    };
  }, [text, textClassName]);

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
  // 테두리랑 안쪽 여백만큼 카드를 바깥으로 빼서 접힌 본문과 첫 줄 위치, 너비를 맞춘다.
  const controlsClassName = isExpanded
    ? 'absolute -left-[13px] -right-[13px] -top-[11px] z-10 flex flex-col gap-[5px] rounded-[12px] border border-gray-150 bg-white px-[12px] py-[10px]'
    : 'absolute bottom-0 right-0';
  const showShortenedPreview = isOverflowing && !isExpanded;
  const previewText = (
    <>
      <LinkifiedText text={text} />
      {/* Safari가 마지막 링크를 말줄임표 뒤에 끌어오지 않도록 문단 끝에 빈 인라인 요소를 둔다. */}
      <span aria-hidden='true' />
    </>
  );

  return (
    <div ref={wrapperRef} className={`min-w-0 ${className}`}>
      {/* 페이지에서 준 위쪽 여백 아래부터 위치를 잡아야 펼쳤을 때 첫 줄이 위로 올라가지 않는다. */}
      <div className='relative'>
        {/* 버튼 자리 때문에 줄 수가 바뀔 수 있음 -> 더보기 판단과 기본 높이는 본문만으로 잡는다. */}
        <p
          ref={previewRef}
          className={`line-clamp-3 ${baseTextClassName} ${isExpanded || showShortenedPreview ? 'invisible' : ''}`}
        >
          {previewText}
        </p>

        {showShortenedPreview && (
          <div className='absolute inset-0 line-clamp-3'>
            <div className={baseTextClassName}>
              {/* 일반 블록 안에서 셋째 줄만 비움 -> Safari에서도 말줄임표가 버튼 아래로 안 들어간다. */}
              {/* 3글자 + 아이콘 20px + 간격 2px + 여백 8px만큼 자리를 잡는다. */}
              <span aria-hidden='true' className='float-right h-[3lh] w-[calc(3em+30px)] [shape-outside:inset(2lh_0_0)]' />
              {previewText}
            </div>
          </div>
        )}

        {(isOverflowing || isExpanded) && (
          <div className={controlsClassName}>
            <p id={expandedTextId} hidden={!isExpanded} className={baseTextClassName}>
              {isExpanded && <LinkifiedText text={text} />}
            </p>
            {/* 펼치고 접을 때 같은 버튼을 써서 키보드 포커스를 유지한다. */}
            <button
              type='button'
              aria-controls={expandedTextId}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded(expanded => !expanded)}
              className={`flex items-center gap-[2px] text-m-14-hn text-gray-900 ${isExpanded ? 'self-end' : 'pl-[8px]'}`}
            >
              {isExpanded ? '접기' : '더보기'}
              <Icon name='arrow_down' className={`h-[20px] w-[20px] text-gray-900 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableIntroduction;
