type ChatDeleteButtonVariant = 'allRequests' | 'selectedRooms';

interface ChatDeleteButtonProps {
  count: number;
  variant: ChatDeleteButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
}

const deleteButtonLabels: Record<ChatDeleteButtonVariant, string> = {
  allRequests: '요청 전부 삭제',
  selectedRooms: '선택 채팅방 삭제',
};

export const ChatDeleteButton = ({
  count,
  variant,
  onClick,
  disabled = false,
}: ChatDeleteButtonProps) => {
  return (
    <div className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 justify-center border-t border-gray-150 bg-white pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="text-sb-18 text-[var(--color-red)] tracking-[-0.72px] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {deleteButtonLabels[variant]} ({count})
      </button>
    </div>
  );
};
