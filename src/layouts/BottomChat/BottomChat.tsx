import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Icon from '../../components/Icon';
import SaveToggle from './components/SaveToggle';
import LikeToggle from './components/LikeToggle';

type BottomChatProps = {
  likeCount?: number;
  isLiked?: boolean;
  onLikeChange?: (next: boolean) => void;
  isSaved?: boolean;
  onSaveChange?: (next: boolean) => void;
  placeholder?: string;
  content: string;
  onChange: (value: string) => void;
  onSubmit: (event?: SyntheticEvent) => void;
  disabled?: boolean;
  replyTargetName?: string;
  focusToken?: number;
};

export const BottomChat = ({
  likeCount = 0,
  isLiked,
  onLikeChange,
  isSaved,
  onSaveChange,
  placeholder = '댓글을 입력해 주세요',
  content,
  onChange,
  onSubmit,
  disabled = false,
  replyTargetName,
  focusToken,
}: BottomChatProps) => {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const hasContent = !disabled && content.trim().length > 0;

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const offset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardOffset(offset);
    };

    updateOffset();
    viewport.addEventListener('resize', updateOffset);
    viewport.addEventListener('scroll', updateOffset);
    window.addEventListener('resize', updateOffset);

    return () => {
      viewport.removeEventListener('resize', updateOffset);
      viewport.removeEventListener('scroll', updateOffset);
      window.removeEventListener('resize', updateOffset);
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content]);

  useEffect(() => {
    if (!focusToken || disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
  }, [focusToken, disabled]);

  const bottomOffset = isFocused ? keyboardOffset : 0;

  return (
    <div
      className='fixed left-0 right-0 z-50 bg-white pb-[40px]'
      style={{ bottom: bottomOffset }}
    >
      <div
        className='mx-auto flex w-full max-w-[720px] items-center gap-[clamp(8px,2.2vw,10px)] px-[clamp(16px,6vw,25px)] py-[6px] box-border'
        style={{ paddingBottom: 'calc(6px + env(safe-area-inset-bottom))' }}
      >
        <div className='flex min-w-0 flex-1 flex-col gap-[6px]'>
          {replyTargetName ? (
            <div className='flex items-center gap-[3px]'>
              <Icon name='reply' className='h-5 w-5' />
              <span className='text-m-12 text-[var(--ColorGray3,#646464)]'>
                <span className='text-[var(--ColorMain,#00C56C)]'>{replyTargetName}</span> 님에게
                답글
              </span>
            </div>
          ) : null}
          <form
            className='flex min-w-0 flex-1 items-center gap-[clamp(8px,2.2vw,10px)] rounded-[30px] border border-[var(--ColorGray1,#ECECEC)] bg-[var(--Color_Gray_B,#FCFCFC)]'
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(event);
            }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={1}
              className='min-h-[40px] max-h-[120px] min-w-0 flex-1 resize-none bg-transparent px-[clamp(12px,3.5vw,15px)] py-[10px] text-[16px] text-[var(--ColorBlack,#202023)] placeholder:text-[16px] placeholder:text-[var(--ColorGray2,#A1A1A1)] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:text-[var(--ColorGray2,#A1A1A1)]'
            />
            {hasContent ? (
              <button
                type='submit'
                disabled={disabled}
                className='flex h-[36px] w-[36px] items-center justify-center rounded-full active:bg-[var(--ColorGray1,#ECECEC)] disabled:cursor-not-allowed'
                aria-label='댓글 작성'
              >
                <Icon name='send' className='h-5 w-5' />
              </button>
            ) : null}
          </form>
        </div>
        <div className='flex shrink-0 items-center gap-[clamp(8px,3vw,13px)] pb-[12px] self-end'>
          <div
            className='flex items-center justify-center gap-[clamp(4px,1.5vw,5px)]'
          >
            <LikeToggle width={24} height={24} isActive={isLiked} onToggle={onLikeChange} />
            <span className='min-w-[1.5ch] text-left text-[16px] tabular-nums text-[var(--ColorGray2,#A1A1A1)]'>
              {likeCount}
            </span>
          </div>
          <SaveToggle width={24} height={24} isActive={isSaved} onToggle={onSaveChange} />
        </div>
      </div>
    </div>
  );
};
