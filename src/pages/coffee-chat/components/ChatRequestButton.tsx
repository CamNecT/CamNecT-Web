import PressableMotion from "../../../components/PressableMotion";

interface ChatRequestButtonProps {
    onAccept: () => void;
    onDelete: () => void;
}

export const ChatRequestButton = ({ onAccept, onDelete }: ChatRequestButtonProps) => {
    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white z-50 flex justify-center gap-[10px] border-t border-gray-150 px-[20px] pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]">
            <PressableMotion
                as="button"
                intensity="strong"
                type="button"
                className="w-[159px] h-[45px] rounded-[10px] border border-red text-red text-b-14-hn flex items-center justify-center bg-white"
                onClick={onDelete}
            >
                요청 삭제
            </PressableMotion>
            <PressableMotion
                as="button"
                intensity="strong"
                type="button"
                className="w-[159px] h-[45px] rounded-[10px] border border-primary bg-green-50 text-primary text-b-14-hn flex items-center justify-center"
                onClick={onAccept}
            >
                커피챗 요청 수락
            </PressableMotion>
        </div>
    )
}
