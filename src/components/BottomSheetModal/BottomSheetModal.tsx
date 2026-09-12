import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useRef } from 'react';

type BottomSheetModalProps = {
    isOpen: boolean;
    onClose: () => void;
    height?: number | string;
    bottomOffset?: number | string;
    children: ReactNode;
};

const BottomSheetModal = ({
    isOpen,
    onClose,
    height = 'auto',
    bottomOffset = 0,
    children,
}: BottomSheetModalProps) => {
    const scrollYRef = useRef(0);
    // 모달이 열려있을 때 body 스크롤 방지 (브라우저 스크롤 막기)
    useEffect(() => {
        if (isOpen) {
            scrollYRef.current = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollYRef.current);
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            if (scrollYRef.current) {
                window.scrollTo(0, scrollYRef.current);
            }
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1001] flex items-end justify-center pointer-events-none">
                    {/* 배경 어둡게 처리 (단순 투명도 조절) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute left-0 right-0 top-0 bg-black/30 pointer-events-auto"
                        style={{ bottom: bottomOffset }}
                    />

                    {/* 바텀 시트 본체 */}
                    <motion.div
                        drag="y" // 수직방향 드래그 
                        dragConstraints={{ top: 0 }} // 윗쪽 방향 제한 
                        dragElastic={0} // 저항 없이 손가락 따라 즉각 반응
                        onDragEnd={(_, info) => {
                            // 60px 이상 내리면 닫힘 (반응 감도 상향)
                            if (info.offset.y > 60) {
                                onClose();
                            }
                        }}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.2 }} // 애니메이션 속도 빠르게 (0.2초)
                        className="relative flex w-full max-w-[430px] flex-col bg-white overflow-hidden pointer-events-auto"
                        style={{
                            height: height,
                            borderRadius: "20px 20px 0 0",
                            // 음수 spread로 그림자가 하단에 번지지 않고 상단에만 보이도록 제한합니다.
                            boxShadow: "0 -4px 10px -6px rgba(0,0,0,0.1)",
                            marginBottom: bottomOffset,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 상단 핸들 (잡는 곳) */}
                        <div className="flex justify-center pt-[17px] pb-[10px] cursor-grab shrink-0">
                            <div className="w-[73px] h-[5px] bg-gray-650 rounded-full" />
                        </div>

                        {/* 내용물 - flex-1 min-h-0 필수 */}
                        <div className="flex-1 min-h-0">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BottomSheetModal;
