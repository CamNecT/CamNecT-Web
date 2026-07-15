export const formatStudentLabel = (studentId?: string) => {
    const normalized = studentId?.trim() ?? "";
    if (!normalized) return "";
    return !isNaN(Number(normalized)) && normalized.length >= 2
        ? `${normalized.slice(2, 4)}학번`
        : normalized;
};
