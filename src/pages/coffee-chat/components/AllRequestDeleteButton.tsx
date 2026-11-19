interface AllRequestDeleteButtonProps {
  requestCount: number;
  onClick: () => void;
}

export const AllRequestDeleteButton = ({ onClick, requestCount }: AllRequestDeleteButtonProps) => {
    return (
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white z-50 flex justify-center border-t border-gray-150 pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]">
          <button onClick={onClick} className="text-sb-18 text-[var(--color-red)] tracking-[-0.72px]">
              요청 전부 삭제 ({requestCount})
          </button>
      </div>
  )
}