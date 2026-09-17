import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { isStandalone } from '../../utils/isStandalone';

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
    // iOS Chrome 일반 탭에서만 하단 툴바가 사라진 뒤 fixed 위치가 어긋나는 WebKit 오류를 우회
    const needsIOSChromeWorkaround = typeof window !== 'undefined'
        && /CriOS/i.test(window.navigator.userAgent)
        && !isStandalone();

    // 모달이 열려 있는 동안 뒤쪽 페이지의 스크롤을 잠금
    useEffect(() => {
        if (!isOpen) return;

        // iOS Chrome은 body에 fixed를 적용하지 않고 루트 스크롤만 잠가 fixed 오류를 피함
        if (needsIOSChromeWorkaround) {
            const root = document.documentElement;
            const previousRootOverflow = root.style.overflow;
            const previousRootOverscroll = root.style.overscrollBehavior;
            const previousBodyOverflow = document.body.style.overflow;
            const previousBodyOverscroll = document.body.style.overscrollBehavior;

            root.style.overflow = 'hidden';
            root.style.overscrollBehavior = 'none';
            document.body.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';

            return () => {
                root.style.overflow = previousRootOverflow;
                root.style.overscrollBehavior = previousRootOverscroll;
                document.body.style.overflow = previousBodyOverflow;
                document.body.style.overscrollBehavior = previousBodyOverscroll;
            };
        }

        // Safari, PWA와 그 외 브라우저는 기존 방식으로 현재 스크롤 위치를 고정
        const scrollY = window.scrollY;
        const previousBodyOverflow = document.body.style.overflow;
        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyWidth = document.body.style.width;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.width = previousBodyWidth;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen, needsIOSChromeWorkaround]);

    // iOS Chrome의 absolute 프레임이 현재 보이는 화면 상단에서 시작할 문서 위치를 계산
    const viewportTop = typeof window === 'undefined'
        ? 0
        : (window.visualViewport?.pageTop ?? window.scrollY);

    const modal = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className={needsIOSChromeWorkaround
                        ? "absolute left-0 z-[1001] flex h-[100dvh] w-full items-end justify-center pointer-events-none"
                        : "fixed inset-0 z-[1001] flex items-end justify-center pointer-events-none"
                    }
                    style={needsIOSChromeWorkaround ? { top: viewportTop } : undefined}
                >
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

    // 문제가 있는 iOS Chrome에서만 상위 레이아웃 영향을 피하도록 body에 직접 렌더링
    return needsIOSChromeWorkaround && typeof document !== 'undefined'
        ? createPortal(modal, document.body)
        : modal;
};

export default BottomSheetModal;
