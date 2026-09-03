import { useEffect, useState } from "react";
// import BottomSheetModal from "../../../components/BottomSheetModal/BottomSheetModal";
import Icon from "../../../components/Icon";
import PressableMotion from "../../../components/PressableMotion";
import { isStandalone } from "../../../utils/isStandalone";

interface TypingAreaProps {
    onSend: (text: string) => boolean;
    disabled?: boolean;
}

export const TypingArea = ({ onSend, disabled }: TypingAreaProps) => {
    const [inputValue, setInputValue] = useState("");
    const [isPwaKeyboardOpen, setIsPwaKeyboardOpen] = useState(false);
    // const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // 일반 Safari/Chrome은 기존 패딩 동작을 그대로 유지한다.
        if (!isStandalone()) return;

        const viewport = window.visualViewport;
        if (!viewport) return;

        let baselineHeight = viewport.height;
        let baselineWidth = viewport.width;
        let animationFrameId: number | null = null;

        const updateKeyboardState = () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                // 화면 회전 시 키보드 축소로 오인하지 않도록 기준 viewport를 다시 잡는다.
                if (Math.abs(viewport.width - baselineWidth) > 50) {
                    baselineWidth = viewport.width;
                    baselineHeight = viewport.height;
                    setIsPwaKeyboardOpen(false);
                    return;
                }

                // 키보드가 닫혔을 때 복구되는 가장 큰 높이를 기준으로 사용한다.
                baselineHeight = Math.max(baselineHeight, viewport.height);

                setIsPwaKeyboardOpen(
                    viewport.scale === 1 && baselineHeight - viewport.height > 150
                );
            });
        };

        viewport.addEventListener("resize", updateKeyboardState);

        return () => {
            viewport.removeEventListener("resize", updateKeyboardState);

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

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
            <div className={`flex justify-center fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white px-[25px] pt-[6px] z-50 ${
                isPwaKeyboardOpen
                    ? "pb-[max(15px,env(safe-area-inset-bottom,0px))]"
                    : "pb-[calc(15px+env(safe-area-inset-bottom,0px))]"
            }`}>
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
