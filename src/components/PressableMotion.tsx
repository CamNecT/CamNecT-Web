import { motion, type HTMLMotionProps } from 'framer-motion';

const tapMotion = {
    whileTap: { scale: 0.96 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 28 },
};

type PressableMotionDivProps = HTMLMotionProps<'div'> & {
    as?: 'div';
};

type PressableMotionButtonProps = HTMLMotionProps<'button'> & {
    as: 'button';
};

type PressableMotionProps = PressableMotionDivProps | PressableMotionButtonProps;

const PressableMotion = ({ as = 'div', whileTap, transition, ...props }: PressableMotionProps) => {
    const resolvedWhileTap = whileTap ?? tapMotion.whileTap;
    const resolvedTransition = transition ?? tapMotion.transition;

    if (as === 'button') {
        return (
            <motion.button
                whileTap={resolvedWhileTap}
                transition={resolvedTransition}
                {...(props as HTMLMotionProps<'button'>)}
            />
        );
    }

    return (
        <motion.div
            whileTap={resolvedWhileTap}
            transition={resolvedTransition}
            {...(props as HTMLMotionProps<'div'>)}
        />
    );
};

export default PressableMotion;
