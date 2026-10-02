// Swagger /api/notifications 목록·미읽음 개수·읽음 처리 API의 응답 코드다.
// 45401은 알림 부재와 타인 소유를 구분하지 않으므로 삭제로 단정하지 않는다.
export const NOTIFICATION_ERROR_CODES = {
  invalidRequest: '40000',
  invalidJwt: '40100',
  invalidAuthHeader: '41103',
  missingTokenType: '41104',
  unsupportedTokenType: '41106',
  suspendedUser: '41302',
  notificationNotFound: '45401',
  internalError: '50000',
} as const;

export const NOTIFICATION_ERROR_MESSAGES = {
  authenticationRequired: {
    title: '로그인이 필요합니다',
    content: '로그인 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.',
  },
  suspendedUser: {
    title: '알림을 이용할 수 없어요',
    content: '이용이 정지된 계정입니다. 관리자에게 문의해 주세요.',
  },
  notificationNotFound: {
    title: '알림을 찾지 못했어요',
    content: '알림이 존재하지 않거나 현재 계정의 알림이 아니에요. 목록을 새로고침해 주세요.',
  },
  network: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  internal: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
} as const;
