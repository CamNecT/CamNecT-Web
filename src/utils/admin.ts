//관리자 계정 식별값
const ADMIN_USER_IDS = new Set(['2']);

export const isAdminUserId = (userId: string | number | null | undefined) =>
  userId !== null && userId !== undefined && ADMIN_USER_IDS.has(String(userId));
