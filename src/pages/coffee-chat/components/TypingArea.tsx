import { useState } from "react";
// import BottomSheetModal from "../../../components/BottomSheetModal/BottomSheetModal";
import Icon from "../../../components/Icon";

interface TypingAreaProps {
    onSend: (text: string) => boolean;
    disabled?: boolean;
}

export const TypingArea = ({ onSend, disabled }: TypingAreaProps) => {
    const [inputValue, setInputValue] = useState("");
    // const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSend = () => {
        const content = inputValue.trim();

        if (!content || disabled) return; // disabled -> 엔터키 전송 차단

        const publishStarted = onSend(content);

        // 발송 성공 시 입력창 초기화
        if (publishStarted) {
            setInputValue("");
        }
    };

    return (
        <>
            <div className="flex justify-center fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white px-[25px] pt-[6px] pb-[calc(25px+env(safe-area-inset-bottom))] focus-within:pb-[15px] z-50">
                <div className="flex items-center gap-[10px] w-full">
                    {/* 추가 버튼 -> MVP 제외*/}
                    {/* <button 
                        type="button" 
                        onClick={() => setIsModalOpen(true)}
                        className="shrink-0 w-[36px] h-[36px] rounded-full bg-gray-150 flex items-center justify-center active:bg-gray-200 transition-colors"
                    >
                        <Icon name="plus" />
                    </button> */}
                    
                    {/* 입력창 영역 */}
                    <div className="relative flex-1">
                        <input 
                            placeholder="메시지 입력" 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                    handleSend();
                                }
                            }}
                            className="w-full h-[44px] bg-gray-100 border border-gray-150 rounded-[30px] pl-[18px] pr-[48px] text-r-16 outline-none placeholder:text-gray-400" 
                        />
                        {/* 전송 버튼 */}
                        <button 
                            type="button" 
                            onClick={handleSend}
                            disabled={disabled}
                            className={`absolute right-[4px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] rounded-full flex items-center justify-center transition ${
                                disabled 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-primary active:scale-95 active:brightness-95'
                            }`}
                        >
                            <Icon name="send" />
                        </button>
                    </div>
                </div>
            </div>

            {/* <BottomSheetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="flex flex-col px-[40px] pt-[10px] pb-[calc(30px+env(safe-area-inset-bottom))]">
                    <button 
                        className="flex items-center gap-[15px] py-[20px] w-full border-b border-gray-150 active:opacity-50 transition-opacity" 
                        onClick={() => setIsModalOpen(false)}
                    >
                        <Icon name="album" style={{ width: '32px', height: '32px' }} />
                        <span className="text-m-16 text-gray-750">사진</span>
                    </button>
                    <button 
                        className="flex items-center gap-[15px] py-[20px] w-full active:opacity-50 transition-opacity" 
                        onClick={() => setIsModalOpen(false)}
                    >
                        <Icon name="folder" style={{ width: '32px', height: '32px' }} />
                        <span className="text-m-16 text-gray-750">파일</span>
                    </button>
                </div>
            </BottomSheetModal> */}
        </>
    )
}