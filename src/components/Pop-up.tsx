import type { ReactNode } from 'react';
import Button from './Button';

// 팝업 유형: 안내/경고/확인/로딩
export type PopUpType = 'info' | 'warning' | 'confirm' | 'loading' | 'error';

// 공통 팝업 props (유형별로 필요한 값만 사용)
type PopUpProps = {
  isOpen: boolean;
  type: PopUpType;
  // ReactNode type : React가 렌더링하는 거의 모든 타입 (tsx를 받기 위해) 
  // 목적 : title ~ content의 텍스트 부분 스타일링
  title?: ReactNode; 
  titleSecondary?: ReactNode;
  content?: ReactNode;
  leftButtonText?: string;
  rightButtonText?: string;
  buttonText?: string;
  isActionPending?: boolean;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  onClick?: () => void;
};

const PopUp = ({
  isOpen,
  type,
  title,
  titleSecondary,
  content,
  leftButtonText,
  rightButtonText,
  buttonText,
  isActionPending,
  onLeftClick,
  onRightClick,
  onClick,
}: PopUpProps) => {
  if (!isOpen) return null;

  // 유형별 텍스트 정렬
  const contentAlign =
    type === 'warning' || type === 'confirm' || type === 'info' ? 'text-center' : 'text-left';

  // string 값에 들어온 "\n" 문자를 실제 줄바꿈으로 변환
  const normalizeEscapedNewlines = (value?: ReactNode): ReactNode => {
    if (typeof value === 'string') {
      return value.replace(/\\n/g, '\n'); // (개행 <-> 실제 \n) 변환 
    }

    return value;
  };

  // ReactNode 중 실제 화면에 표시할 값인지 확인
  // 목적 : 비어있는 요소 렌더링 X (빈 태그 생성 방지)
  const isRenderableNode = (value?: ReactNode) =>
    value !== undefined && value !== null && value !== false && value !== true && value !== '';

  const renderContent = (): ReactNode => {
    // 문자열 기반 줄바꿈(\n) 처리
    const normalizedTitle = normalizeEscapedNewlines(title);
    const normalizedContent = normalizeEscapedNewlines(content);
    const normalizedSecondaryTitle = normalizeEscapedNewlines(titleSecondary);

    // 경고 타입일때 내용 앞에 '* ' 추가
    const contentWithWarningPrefix =
      (type === 'warning') && isRenderableNode(normalizedContent)
        ? <>* {normalizedContent}</>
        : normalizedContent;

    // 로딩 타입 전용 콘텐츠
    if (type === 'loading') {
      const loadingTitle = normalizeEscapedNewlines(title);

      return (
        <div className='flex flex-col items-center justify-center gap-[20px] pt-[10px]'>
          <svg
            className='animate-spin'
            xmlns='http://www.w3.org/2000/svg'
            width='84'
            height='84'
            viewBox='0 0 84 84'
            fill='none'
          >
            <path
              d='M77.3492 28.5724C79.5106 27.7514 80.6158 25.3215 79.5837 23.2524C76.024 16.1159 70.4902 10.1121 63.6014 5.98078C55.5111 1.1289 46.0229 -0.858026 36.6657 0.340137C27.3084 1.5383 18.627 5.85178 12.0202 12.5856C5.41342 19.3194 1.266 28.0813 0.246193 37.4597C-0.773611 46.838 1.39359 56.2866 6.39861 64.2831C11.4036 72.2796 18.955 78.3582 27.836 81.5396C36.717 84.721 46.4105 84.8199 55.3546 81.8203C62.9704 79.2662 69.6652 74.5922 74.6757 68.3876C76.1284 66.5887 75.5713 63.9781 73.6369 62.7116C71.7024 61.4452 69.1261 62.0075 67.6292 63.7697C63.6812 68.4178 58.5239 71.926 52.6922 73.8818C45.5312 76.2834 37.7702 76.2042 30.6597 73.6571C23.5492 71.1099 17.5033 66.2431 13.4961 59.8408C9.48883 53.4385 7.75367 45.8735 8.57017 38.3648C9.38667 30.8561 12.7073 23.8409 17.9969 18.4496C23.2866 13.0582 30.2373 9.60467 37.7291 8.64538C45.2209 7.68608 52.8175 9.27689 59.295 13.1615C64.57 16.325 68.8526 20.8598 71.7094 26.2478C72.7925 28.2906 75.1877 29.3935 77.3492 28.5724Z'
              fill='#00C56C'
            />
          </svg>
          <div className='text-b-18 mt-auto pt-[20px] whitespace-pre-wrap text-center text-[var(--ColorBlack,#202023)]'>
            {isRenderableNode(loadingTitle) ? loadingTitle : '잠시만 기다려 주세요...'}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col justify-center h-[clamp(85px,10vw,100px)] gap-[15px] px-[15px] pt-[10px] ${contentAlign}`}>
        {type === 'error' ? (
          <div className='flex flex-col gap-[10px]'>
            {isRenderableNode(normalizedTitle) && (
              <div className='text-b-18 whitespace-pre-wrap text-[var(--ColorBlack,#202023)]'>
                {normalizedTitle}
              </div>
            )}
            {isRenderableNode(normalizedSecondaryTitle) && (
              <div className='text-b-18 whitespace-pre-wrap text-[var(--ColorBlack,#202023)]'>
                {normalizedSecondaryTitle}
              </div>
            )}
          </div>
        ) : (
          isRenderableNode(normalizedTitle) && (
            <div className='text-b-18 whitespace-pre-wrap text-[var(--ColorBlack,#202023)]'>{normalizedTitle}</div>
          )
        )}
        {isRenderableNode(contentWithWarningPrefix) && (
          <div className='text-r-14 whitespace-pre-wrap text-[var(--ColorGray3,#646464)]'>{contentWithWarningPrefix}</div>
        )}
      </div>
    );
  };

  const renderButtons = (): ReactNode => {
    if (type === 'loading') {
      return null;
    }

    // 확인 팝업: 단일 버튼
    if (type === 'confirm' || type === 'error') {
      return (
        <Button
          type='button'
          label={buttonText ?? '확인'}
          font='b-14-hn'
          onClick={onClick}
          className='h-[45px] max-w-none rounded-[10px] whitespace-pre-wrap'
        />
      );
    }

    // 경고 팝업: 좌측 강조 + 우측 취소
    if (type === 'warning') {
      return (
        <div className='flex w-full gap-[10px]'>
          <button
            type='button'
            onClick={onLeftClick}
            className='flex h-[45px] w-full items-center justify-center rounded-[10px] bg-[var(--Color_Red2,#FFEFEF)] text-b-14-hn text-[var(--ColorRed,#FF3838)]'
          >
            <span className='whitespace-pre-wrap'>{leftButtonText ?? '삭제하기'}</span>
          </button>
          <button
            type='button'
            onClick={onRightClick}
            className='flex h-[45px] w-full items-center justify-center rounded-[10px] bg-[var(--ColorGray1,#ECECEC)] text-sb-14 text-[var(--ColorGray2,#A1A1A1)]'
          >
            <span className='whitespace-pre-wrap'>아니오</span>
          </button>
        </div>
      );
    }

    // 안내 팝업: 기본 좌/우 버튼
    return (
      <div className='flex w-full gap-[10px]'>
        <button
          type='button'
          onClick={onLeftClick}
          className='flex h-[45px] w-full items-center justify-center rounded-[10px] bg-[var(--ColorSub2,#F2FCF8)] text-sb-14 text-[var(--ColorMain,#00C56C)]'
        >
          <span className='whitespace-pre-wrap'>{leftButtonText ?? '아니오'}</span>
        </button>
        <Button
          type='button'
          label={rightButtonText ?? '네, 확인했습니다'}
          font='b-14-hn'
          onClick={onRightClick}
          loading={isActionPending}
          className='h-[45px] max-w-none rounded-[10px] whitespace-pre-wrap'
        />
      </div>
    );
  };

  return (
    <div
      className='fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 px-[20px] py-[20px]'
      role='dialog'
      aria-modal='true'
    >
      {/* 모달 본체: clamp로 반응형 너비, 최소 높이 보장 */}
      <div className='flex w-[clamp(260px,85vw,324px)] min-h-[200px] flex-col px-[20px] py-[20px] rounded-[20px] bg-[var(--ColorWhite,#FFF)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]'>
        {renderContent()}
        {/* 버튼 영역을 하단에 고정 */}
        <div className='mt-auto'>{renderButtons()}</div>
      </div>
    </div>
  );
};

export default PopUp;
