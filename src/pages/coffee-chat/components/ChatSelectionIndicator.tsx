interface ChatSelectionIndicatorProps {
  selected: boolean;
}

// 채팅방 다중 선택용 원 컴포넌트
export const ChatSelectionIndicator = ({
  selected,
}: ChatSelectionIndicatorProps) => {
  return (
    <span
      aria-hidden="true"
      className={`
        block h-[24px] w-[24px] rounded-full
        ${
          selected
            ? 'border-[5px] border-primary'
            : 'border border-[#A1A1A1]'
        }
      `}
    />
  );
};