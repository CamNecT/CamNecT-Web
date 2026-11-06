interface ChatEmptyStateProps {
  message: string;
}

export const ChatEmptyState = ({ message }: ChatEmptyStateProps) => {
  return (
    <div className="flex w-full justify-center px-[25px] pt-[60px]">
      <p className="text-center text-sb-18 tracking-[-0.72px] text-[var(--ColorGray4,#A1A1A1)]">
        {message}
      </p>
    </div>
  );
};
