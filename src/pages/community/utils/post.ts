// 게시글 날짜를 YY.MM.DD HH:mm 형식으로 정규화
export const formatPostDisplayDate = (value: string) => {
  if (!value) return value;
  if (/^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const year = String(parsed.getFullYear()).slice(-2);
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};
