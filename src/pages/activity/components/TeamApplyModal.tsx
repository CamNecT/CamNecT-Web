import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import BottomSheetModal from '../../../components/BottomSheetModal/BottomSheetModal';
import Button from '../../../components/Button';
import Card from '../../../components/Card';

type TeamApplyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  isPending?: boolean; // API 요청중인지 여부 (중복 API 요청 방지)
  onSubmit?: (payload: { message: string }) => Promise<boolean | void> | boolean | void;
};

// 팀원 신청을 작성하는 바텀시트 모달
const TeamApplyModal = ({ isOpen, onClose, activityName, isPending = false, onSubmit }: TeamApplyModalProps) => {
  const [message, setMessage] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const maxLength = 100;

  // visualViewport 변화를 구독해 키보드 인셋을 계산
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

  // 최소 조건 충족 여부 및 글자수 표시
  const isSubmitEnabled = message.trim().length > 0;
  const isSubmitDisabled = !isSubmitEnabled || isPending;

  const countText = useMemo(() => `${message.length}/${maxLength}`, [message.length]);

  // 입력 길이 제한 적용
  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value.slice(0, maxLength);
    setMessage(value);
  };

  // 제출 시 부모로 선택 정보 전달
  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    try {
      await onSubmit?.({ message });
    } finally {
      setMessage(''); // 초기화
      onClose();
    }
  };

  const handleClose = () => {
    setMessage(''); // 초기화
    onClose();
  };

    return (
        <BottomSheetModal isOpen={isOpen} onClose={handleClose}>
            <div
                className='flex flex-col [gap:clamp(24px,8cqw,36px)] overflow-y-auto h-full'
                style={{
                    paddingTop: 'clamp(36px,11cqw,45px)',
                    paddingLeft: 'clamp(18px,7cqw,25px)',
                    paddingRight: 'clamp(18px,7cqw,25px)',
                    paddingBottom: `calc(50px + ${keyboardInset}px)`,
                }}
            >
                {/* 제목 */}
                <span className='w-full text-center text-b-20-hn text-gray-900'>팀원 신청</span>

                {/* 모집 공고 + 신청 내용 영역 */}
                <div className='flex flex-col gap-[30px]'>
                <div className='flex flex-col gap-[10px]'>
                    <span className='text-sb-18 text-gray-900'>모집 공고</span>
                    <p className='text-m-16-hn text-gray-750'>
                    {activityName}
                    </p>
                </div>

                <div className='flex flex-col gap-[10px]'>
                    <span className='text-sb-18 text-gray-900'>
                        팀원 신청 내용 (필수)
                    </span>
                    <div className='flex flex-col gap-[8px]'>
                    <Card width='100%' height={130} className='px-[15px] py-[15px]'>
                        <textarea
                        value={message}
                        onChange={handleMessageChange}
                        placeholder={`신청 내용을 작성해 주세요.\n(예: 기획 분야로 팀원 신청합니다. 공모전 수상 경험 다수 있습니다!)`}
                        className='h-full w-full resize-none bg-transparent outline-none text-r-16 text-gray-750 placeholder:text-gray-650'
                        />
                    </Card>
                    <div className='text-right text-r-12 text-gray-650'>
                        {countText}
                    </div>
                    </div>
                </div>
                </div>

                {/* 팀원 신청하기 버튼 */}
                <Button
                    type='button'
                    label='팀원 신청하기'
                    font='sb-18-flat'
                    onClick={handleSubmit}
                    disabled={!isSubmitEnabled}
                    loading={isPending}
                    className={`max-w-none rounded-full ${
                        isSubmitDisabled
                        ? 'bg-gray-150 text-gray-650 cursor-not-allowed'
                        : 'bg-primary text-white cursor-pointer'
                    }`}
                />
            </div>
        </BottomSheetModal>
    );
};

export default TeamApplyModal;
