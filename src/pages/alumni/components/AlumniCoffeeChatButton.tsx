import Button from '../../../components/Button';

type AlumniCoffeeChatButtonProps = {
  hasChat: boolean;
  isPending?: boolean;
  disabled?: boolean;
  alumniName?: string;
  onClick: () => void;
};

const AlumniCoffeeChatButton = ({
  hasChat,
  isPending = false,
  disabled = false,
  alumniName,
  onClick,
}: AlumniCoffeeChatButtonProps) => {
  const label = hasChat
    ? (isPending ? '채팅방 확인 중' : '채팅방으로 이동')
    : '커피챗 요청하기';

  return (
    <Button
      label={label}
      font='sb-14'
      type='button'
      className={`h-auto w-full max-w-none rounded-[clamp(8px,2.8cqw,10px)] py-[10px] ${hasChat ? 'border border-[var(--ColorMain,#00C56C)] bg-white text-[var(--ColorMain,#00C56C)]' : 'bg-[var(--ColorMain,#00C56C)]'}`}
      disabled={disabled || isPending}
      onClick={onClick}
      aria-label={alumniName ? `${alumniName} ${label}` : undefined}
    />
  );
};

export default AlumniCoffeeChatButton;
