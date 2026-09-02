import React, { useEffect, useRef, type ReactNode } from "react";

/**
 * 채팅에서 쓰는 드롭다운 메뉴.
 * ChatRoomPage의 '더보기 메뉴 드롭다운'을 그대로 옮긴 것으로,
 * 패널 스타일과 항목 마크업은 기존 코드와 동일하다.
 *
 * [기존 코드와 달라진 점]
 * 1. setIsMenuOpen(false) → onClose() : 닫는 방법을 호출부가 정한다
 * 2. 하드코딩된 위치/셀렉터 → positionClassName, triggerSelector prop
 * 3. 바깥 클릭 감지 useEffect가 ChatRoomPage에서 이 컴포넌트로 이동
 *    (메시지마다 드롭다운이 생기면 페이지에 ref/effect를 메시지 수만큼 둬야 해서)
 * 4. 항목을 삼항 분기 JSX → items 배열로 렌더링
 * 5. 항목 사이 구분선(hasDivider) 추가 : 기존 헤더 메뉴에는 없던 것
 * 6. 아이콘이 optional : 실패 메시지 메뉴에는 아이콘이 없음
 * 7. 라벨의 타이포그래피를 호출부에서 지정 : 헤더는 R_16, 실패 메시지 메뉴는 M_16이라
 *    (text-r-16과 text-m-16은 CSS 정의 순서로 우열이 갈려 className 덮어쓰기가 안 됨)
 *
 * 패널과 항목 button의 className은 기존 헤더 메뉴와 문자 단위로 동일하다. 레이아웃은 건드리지 않음.
 *
 * 기본값이 있는 prop은 하나도 없다. 호출부만 보면 동작이 전부 드러나게 하기 위함.
 */

export type ChatDropdownItem = {
    label: string;
    // 호출부에서 <Icon name="logOut" /> 처럼 그대로 주입 (이 컴포넌트는 아이콘 구현에 의존하지 않음)
    icon?: ReactNode;
    labelClassName: string;
    onClick: () => void;
};

type ChatDropdownProps = {
    isOpen: boolean;
    onClose: () => void;
    items: ChatDropdownItem[];
    // 열리는 위치. 부모 요소에 relative가 있어야 함
    positionClassName: string;
    // 바깥 클릭으로 취급하지 않을 요소의 선택자 (여는 버튼 클릭 시 닫힘 → 다시 열림 방지)
    triggerSelector: string;
    // 항목 사이 구분선 노출 여부
    hasDivider: boolean;
};

export const ChatDropdown = ({
    isOpen,
    onClose,
    items,
    positionClassName,
    triggerSelector,
    hasDivider,
}: ChatDropdownProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // 메뉴 바깥 클릭/터치 시 닫기 (ChatRoomPage에 있던 로직 그대로)
    useEffect(() => {
        const handleOutsideAction = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            const isTriggerButton = (target as HTMLElement).closest(triggerSelector);

            if (menuRef.current && !menuRef.current.contains(target) && !isTriggerButton) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleOutsideAction);
            document.addEventListener("touchstart", handleOutsideAction);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideAction);
            document.removeEventListener("touchstart", handleOutsideAction);
        };
    }, [isOpen, onClose, triggerSelector]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className={`absolute ${positionClassName} z-[99] min-w-[160px] bg-white rounded-[10px] shadow-[0_4px_20px_0_rgba(0,0,0,0.1)] border border-gray-150 overflow-hidden flex flex-col items-start p-[15px_20px_15px_15px] gap-[10px]`}
        >
            {items.map((item, index) => (
                <React.Fragment key={item.label}>
                    {hasDivider && index > 0 && <div className="w-full h-[1px] bg-gray-150" />}

                    <button
                        onClick={item.onClick}
                        className="w-full flex items-center gap-[15px] hover:bg-gray-50 transition-colors"
                    >
                        {item.icon}
                        <span className={item.labelClassName}>
                            {item.label}
                        </span>
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};