import { useState } from "react";
// import BottomSheetModal from "../../../components/BottomSheetModal/BottomSheetModal";
import Icon from "../../../components/Icon";
import PressableMotion from "../../../components/PressableMotion";

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
            <div className="chat-composer-bottom-padding flex justify-center fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--app-mobile-max-width)] bg-white px-[25px] pt-[6px] z-50">
                <div className="flex items-center gap-[10px] w-full">
                    {/* 추가 버튼 -> MVP 제외*/}
                    {/* <button 
                        type="button" 
                        onClick={() => setIsModalOpen(true)}
                        className="shrink-0 w-[36px] h-[36px] rounded-full bg-gray-150 flex items-center justify-center active:bg-gray-200 transition-colors"
                    >
                        <Icon name="add" />
                    </button> */}
                    
                    {/* 입력창 영역 */}
                    <div className="relative flex-1">
                        <textarea
                            placeholder="메시지 입력" 
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                // Enter가 아니거나 입력기에서 한글 등을 조합 중이면 전송 판단을 하지 않는다.
                                if (e.key !== "Enter" || e.nativeEvent.isComposing) {
                                    return;
                                }

                                // userAgent에 Android/iPhone/iPad/iPod 키워드 유무, 터치 지원 여부 확인                            
                                const isMobileOrTouchDevice =
                                    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                                    navigator.maxTouchPoints > 0;

                                // 모바일 기기 or Shift + Enter는 줄바꿈 허용
                                if (isMobileOrTouchDevice || e.shiftKey) {
                                    return;
                                }

                                e.preventDefault();
                                handleSend();
                            }}
                            className="block w-full min-h-[44px] max-h-[90px] resize-none bg-gray-100 border border-gray-150 rounded-[30px] py-[10px] pl-[14px] pr-[48px] text-r-16 tracking-[-0.64px] outline-none placeholder:text-gray-150" 
                        />
                        {/* 전송 버튼 */}
                        <PressableMotion
                            as="button"
                            intensity="strong"
                            type="button" 
                            // iOS PWA에서 버튼 포커스로 전환되며 키보드가 닫히기 전에 클릭이 취소되는 것을 방지
                            onPointerDown={(event) => event.preventDefault()}
                            onClick={handleSend}
                            disabled={disabled}
                            // Framer Motion의 scale transform과 translate transform이 충돌하지 않도록 고정 offset 사용
                            className={`absolute right-[4px] top-[4px] w-[36px] h-[36px] rounded-full flex items-center justify-center transition ${
                                disabled 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-primary'
                            }`}
                        >
                            <Icon name="send" color="var(--ColorWhite,#FFF)" />
                        </PressableMotion>
                    </div>
                </div>
            </div>

            {/* <BottomSheetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="flex flex-col px-[40px] pt-[10px] pb-[calc(30px+env(safe-area-inset-bottom))]">
                    <button 
                        className="flex items-center gap-[15px] py-[20px] w-full border-b border-gray-150 active:opacity-50 transition-opacity" 
                        onClick={() => setIsModalOpen(false)}
                    >
                        <Icon name="image" style={{ width: '32px', height: '32px' }} />
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
