import type { CSSProperties } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

const tapMotion = {    
    // 누르는 동안의 스타일 (scale : 크기 배율, brightness : 밝기 배율)
    whileTap: { scale: 0.95, filter: 'brightness(0.92)' }, 
    // 눌렀을 때의 전환 효과 (stiffness : 탄력성, damping : 마찰)
    transition: { type: 'spring' as const, stiffness: 500, damping: 30 }, 
};

// 누르는 요소 전용 스타일 (내부 텍스트 선택 차단)
const pressableStyle: CSSProperties = {
    WebkitTapHighlightColor: 'transparent', // 터치 시 뜨는 회색 박스 제거 (안드로이드)
    touchAction: 'manipulation', // 탭 지연 + 더블탭 줌 방지
    userSelect: 'none', // 텍스트 선택(파란 드래그) 방지
    WebkitUserSelect: 'none', // 구형 iOS 대응 (userSelect)
    WebkitTouchCallout: 'none', // iOS 꾹 누르기 콜아웃 차단
};

type PressableMotionDivProps = HTMLMotionProps<'div'> & {
    as?: 'div';
};

type PressableMotionButtonProps = HTMLMotionProps<'button'> & {
    as: 'button';
};

type PressableMotionProps = PressableMotionDivProps | PressableMotionButtonProps;

const PressableMotion = ({
    as = 'div',
    whileTap,
    transition,
    style,
    ...props
}: PressableMotionProps) => {
    const resolvedWhileTap = whileTap ?? tapMotion.whileTap;
    const resolvedTransition = transition ?? tapMotion.transition;
    // 호출부에서 넘긴 style이 필수 스타일을 덮어쓰지 않도록 뒤에 병합
    const resolvedStyle = { ...pressableStyle, ...style };

    if (as === 'button') {
        return (
            <motion.button
                whileTap={resolvedWhileTap}
                transition={resolvedTransition}
                style={resolvedStyle}
                {...(props as HTMLMotionProps<'button'>)}
            />
        );
    }

    return (
        <motion.div
            whileTap={resolvedWhileTap}
            transition={resolvedTransition}
            style={resolvedStyle}
            {...(props as HTMLMotionProps<'div'>)}
        />
    );
};

export default PressableMotion;
