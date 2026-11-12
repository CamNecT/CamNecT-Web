export const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '').slice(0, 11);

export const isValidPhoneNumber = (value: string) => /^010\d{8}$/.test(normalizePhoneNumber(value));

export const formatPhoneNumber = (value?: string | null) => {
    const digits = normalizePhoneNumber(value ?? '');
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};
