import { useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';

type Size = number | string;

type LikeToggleProps = {
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

const LikeToggle = ({
    width = 24,
    height = 24,
    className = '',
    style,
    isActive,
    onToggle,
    ...props
}: LikeToggleProps) => {
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
        <label
            className={`inline-flex items-center justify-center cursor-pointer select-none ${className}`}
            style={{ ...dimensionStyle, ...style }}
        >
            <input
                type='checkbox'
                className='absolute opacity-0 w-0 h-0 pointer-events-none'
                checked={isOn}
                onChange={handleChange}
                {...props}
            />
            {isOn ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M20.6923 8.49999C21.1679 8.49999 21.5881 8.6824 21.9527 9.04724C22.3176 9.4119 22.5 9.83207 22.5 10.3077V11.923C22.5 12.0268 22.4891 12.139 22.4673 12.2595C22.4454 12.38 22.4128 12.4922 22.3693 12.5962L19.5038 19.3577C19.3603 19.6782 19.1199 19.9487 18.7828 20.1692C18.4456 20.3897 18.0949 20.5 17.7308 20.5H9.6345C9.13583 20.5 8.70992 20.3234 8.35675 19.9702C8.00358 19.6169 7.827 19.1909 7.827 18.6922V9.24799C7.827 9.00699 7.87633 8.77532 7.975 8.55299C8.07367 8.33048 8.20508 8.13715 8.36925 7.97298L13.6595 2.71724C13.8583 2.5289 14.0885 2.4129 14.35 2.36924C14.6115 2.32574 14.8621 2.36482 15.1018 2.48649C15.3416 2.60832 15.5147 2.78715 15.621 3.02298C15.7275 3.25898 15.7487 3.50965 15.6845 3.77499L14.6075 8.49999H20.6923ZM4.30775 20.5C3.80908 20.5 3.38308 20.3234 3.02975 19.9702C2.67658 19.6169 2.5 19.1909 2.5 18.6922V10.3077C2.5 9.80907 2.67658 9.38307 3.02975 9.02974C3.38308 8.67657 3.80908 8.49999 4.30775 8.49999H4.51925C5.01792 8.49999 5.44392 8.67657 5.79725 9.02974C6.15042 9.38307 6.327 9.80907 6.327 10.3077V18.702C6.327 19.2007 6.15042 19.625 5.79725 19.975C5.44392 20.325 5.01792 20.5 4.51925 20.5H4.30775Z"
                        fill="var(--ColorMain, #00C56C)"
                    />
                </svg>

            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M21.4165 8.20834C21.9318 8.20834 22.387 8.40596 22.7821 8.80119C23.1773 9.19625 23.3749 9.65143 23.3749 10.1667V11.9166C23.3749 12.0303 23.3603 12.1522 23.331 12.2822C23.302 12.412 23.2694 12.5333 23.2333 12.6459L20.1284 19.972C19.9733 20.3185 19.7132 20.6112 19.3479 20.85C18.9826 21.0889 18.6015 21.2083 18.2044 21.2083H6.81238V8.20834L13.1144 1.96049C13.3298 1.74526 13.5791 1.6168 13.8624 1.57509C14.1457 1.53338 14.4172 1.58195 14.6768 1.7208C14.9367 1.85983 15.127 2.05708 15.2478 2.31257C15.3685 2.56806 15.3943 2.83266 15.3249 3.10638L14.1582 8.20834H21.4165ZM8.43738 8.90005V19.5833H18.2082C18.2846 19.5833 18.3627 19.5625 18.4425 19.5208C18.5225 19.4791 18.5833 19.4096 18.625 19.3125L21.7499 12V10.1667C21.7499 10.0694 21.7187 9.98952 21.6562 9.92705C21.5937 9.86458 21.5138 9.83334 21.4165 9.83334H12.1042L13.4624 3.89586L8.43738 8.90005ZM3.66665 21.2083C3.12805 21.2083 2.667 21.0166 2.2835 20.6331C1.9 20.2496 1.70825 19.7885 1.70825 19.2499V10.1667C1.70825 9.62814 1.9 9.16709 2.2835 8.78359C2.667 8.40009 3.12805 8.20834 3.66665 8.20834H6.81238V9.83334H3.66665C3.56933 9.83334 3.48943 9.86458 3.42696 9.92705C3.36449 9.98952 3.33325 10.0694 3.33325 10.1667V19.2499C3.33325 19.3473 3.36449 19.4272 3.42696 19.4896C3.48943 19.5521 3.56933 19.5833 3.66665 19.5833H6.81238V21.2083H3.66665Z"
                        fill="#A1A1A1"
                    />
                </svg>
            )}
        </label>
    );
};

export type { LikeToggleProps };
export default LikeToggle;
