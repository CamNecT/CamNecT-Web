import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import BottomSheetModal from '../../../components/BottomSheetModal/BottomSheetModal';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Category from '../../../components/Category';

type CoffeeChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSubmit?: (payload: { categories: string[]; message: string }) => Promise<boolean | void> | boolean | void;
};

// 커피챗 요청을 작성하는 바텀시트 모달.
const CoffeeChatModal = ({ isOpen, onClose, categories, onSubmit }: CoffeeChatModalProps) => {
  // 선택된 카테고리와 메시지는 로컬 상태로 관리합니다.
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  // 모바일 키보드가 열릴 때 바텀 인셋을 보정합니다.
  const [keyboardInset, setKeyboardInset] = useState(0);
  const maxLength = 100;

  // visualViewport 변화를 구독해 키보드 인셋을 계산합니다.
  useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };

    updateInset();
    viewport.addEventListener('resize', updateInset);
    viewport.addEventListener('scroll', updateInset);

    return () => {
      viewport.removeEventListener('resize', updateInset);
      viewport.removeEventListener('scroll', updateInset);
    };
  }, [isOpen]);

  // 최소 조건 충족 여부 및 글자수 표시.
  const isSubmitEnabled = message.trim().length > 0;
  const countText = useMemo(() => `${message.length}/${maxLength}`, [message.length]);

  // 카테고리 활성/비활성 토글.
  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  // 입력 길이 제한 적용.
  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value.slice(0, maxLength);
    setMessage(value);
  };

  // 제출 시 부모로 선택 정보 전달.
  const handleSubmit = async () => {
    if (!isSubmitEnabled) return;
    try {
      const result = await onSubmit?.({ categories: selectedCategories, message });
      if (result === false) return;
      onClose();
    } catch {
      // keep modal open on error
    }
  };

  return (
    <BottomSheetModal isOpen={isOpen} onClose={onClose}>
      <div
        className='flex flex-col [gap:clamp(24px,8cqw,36px)] overflow-y-auto h-full'
        style={{
          paddingTop: 'clamp(36px,11cqw,45px)',
          paddingLeft: 'clamp(18px,7cqw,25px)',
          paddingRight: 'clamp(18px,7cqw,25px)',
          paddingBottom: `calc(50px + ${keyboardInset}px)`,
        }}
      >
        {/* 요청 분야 + 요청 내용 영역 */}
        <div className='flex flex-col gap-[20px]'>
          <div className='flex flex-col gap-[15px]'>
            <span className='text-sb-18 text-[color:var(--ColorBlack,#202023)]'>요청 분야</span>
            <div className='flex flex-wrap gap-[10px]'>
              {categories.map((category) => {
                const isActive = selectedCategories.includes(category);
                const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleToggleCategory(category);
                  }
                };

                if (isActive) {
                  return (
                    <button
                      key={category}
                      type='button'
                      onClick={() => handleToggleCategory(category)}
                      onKeyDown={handleKeyDown}
                      className='inline-flex h-[24px] items-center justify-center align-middle p-0'
                    >
                      <Category label={category} />
                    </button>
                  );
                }

                return (
                  <button
                    key={category}
                    type='button'
                    onClick={() => handleToggleCategory(category)}
                    onKeyDown={handleKeyDown}
                    className='inline-flex h-[24px] items-center justify-center rounded-[5px] border border-[var(--ColorGray2,#A1A1A1)] bg-[var(--ColorGray1,#ECECEC)] px-[10px] text-r-12 font-normal leading-[24px] opacity-100 text-[color:var(--ColorGray2,#A1A1A1)] box-border'
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='flex flex-col gap-[15px]'>
            <span className='text-sb-18 text-[color:var(--ColorBlack,#202023)]'>요청 내용 (필수)</span>
            <div className='flex flex-col gap-[8px]'>
              <Card width='100%' height={130} className='px-[15px] py-[15px]'>
                <textarea
                  value={message}
                  onChange={handleMessageChange}
                  placeholder={`커피챗을 요청하는 이유와 궁금한 점을 간결하게 작성해주세요.\n(예: 백엔드 개발에 대한 멘토링을 부탁드립니다.)`}
                  className='h-full w-full resize-none bg-transparent outline-none text-r-16 text-[color:var(--ColorGray3,#646464)] placeholder:text-[color:var(--ColorGray2,#A1A1A1)]'
                />
              </Card>
              <div className='text-right text-r-12 text-[color:var(--ColorGray2,#A1A1A1)]'>
                {countText}
              </div>
            </div>
          </div>
        </div>

        {/* 커피챗 요청 버튼 */}
        <Button
          type='button'
          label='커피챗 요청하기'
          font='sb-18-flat'
          onClick={handleSubmit}
          disabled={!isSubmitEnabled}
          className={`max-w-none rounded-[27px] transition-none cursor-default ${
            isSubmitEnabled
              ? 'bg-[var(--ColorMain,#00C56C)] text-[color:var(--ColorWhite,#FFF)]'
              : 'bg-[var(--ColorGray1,#ECECEC)] text-[color:var(--ColorGray2,#A1A1A1)]'
          }`}
        />
      </div>
    </BottomSheetModal>
  );
};

export default CoffeeChatModal;
