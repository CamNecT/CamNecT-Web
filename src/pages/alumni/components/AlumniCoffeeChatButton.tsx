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
    ? (isPending ? '채팅방 확인 중' : '커피챗으로 이동')
    : '커피챗 요청하기';
  const appearance = hasChat
    ? 'rounded-[10px] bg-green-50 text-primary tracking-[-0.56px]'
    : 'rounded-[clamp(8px,2.8cqw,10px)] bg-[var(--ColorMain,#00C56C)]';

  return (
    <Button
      label={label}
      font='sb-14'
      type='button'
      className={`h-auto w-full max-w-none py-[10px] ${appearance}`}
      disabled={disabled || isPending}
      onClick={onClick}
      aria-label={alumniName ? `${alumniName} ${label}` : undefined}
    />
  );
};

export default AlumniCoffeeChatButton;
