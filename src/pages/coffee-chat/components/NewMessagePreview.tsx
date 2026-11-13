import Icon from "../../../components/Icon";

interface NewMessagePreviewProps {
    message: string;
    onClick: () => void;
}

export const NewMessagePreview = ({ message, onClick }: NewMessagePreviewProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-[40px] w-fit min-w-0 max-w-full items-center gap-[3px] rounded-[40px] bg-[var(--Gray-100,#FFF)] py-[8px] pl-[10px] pr-[16px] text-left shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]"
        >
            <Icon name="chat_preview_arrow_down" size={24} />
            <span className="sr-only">최신 메시지로 이동: </span>
            <span className="line-clamp-1 min-w-0 text-ellipsis text-r-16 text-gray-750 tracking-[-0.4px]">
                {message}
            </span>
        </button>
    );
};
