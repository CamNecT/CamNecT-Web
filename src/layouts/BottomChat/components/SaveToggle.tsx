import { useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import PressableMotion from '../../../components/PressableMotion';

type Size = number | string;

type SaveToggleProps = {
    width?: Size;
    height?: Size;
    className?: string;
    isActive?: boolean;
    onToggle?: (next: boolean) => void;
} & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'checked' | 'defaultChecked' | 'onChange' | 'onToggle'
>;

const toCssSize = (value?: Size) =>
    value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value;

const SaveToggle = ({
    width = 24,
    height = 24,
    className = '',
    style,
    isActive,
    onToggle,
    ...props
}: SaveToggleProps) => {
    const [internalChecked, setInternalChecked] = useState(isActive ?? false);
    const isControlled = isActive !== undefined;
    const isOn = isControlled ? isActive : internalChecked;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) setInternalChecked(event.target.checked);
        onToggle?.(event.target.checked);
    };

    const dimensionStyle = {
        width: toCssSize(width),
        height: toCssSize(height),
    };

    return (
        <PressableMotion
            intensity='soft'
            className={`inline-flex items-center justify-center ${className}`}
            style={{ ...dimensionStyle, ...style }}
        >
            <label className='inline-flex h-full w-full cursor-pointer select-none items-center justify-center'>
                <input
                    type='checkbox'
                    className='absolute opacity-0 w-0 h-0 pointer-events-none'
                    checked={isOn}
                    onChange={handleChange}
                    {...props}
                />
                {isOn ? (
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.593 3.32206C18.693 3.45006 19.5 4.39906 19.5 5.50706V21.0001L12 17.2501L4.5 21.0001V5.50706C4.5 4.39906 5.306 3.45006 6.407 3.32206C10.1232 2.89069 13.8768 2.89069 17.593 3.32206Z" fill="#00C56C" />
                    </svg>

                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                        <path d="M17.593 3.32206C18.693 3.45006 19.5 4.39906 19.5 5.50706V21.0001L12 17.2501L4.5 21.0001V5.50706C4.5 4.39906 5.306 3.45006 6.407 3.32206C10.1232 2.89069 13.8768 2.89069 17.593 3.32206Z" 
                        stroke="#A1A1A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </label>
        </PressableMotion>
    );
};

export type { SaveToggleProps };
export default SaveToggle;
