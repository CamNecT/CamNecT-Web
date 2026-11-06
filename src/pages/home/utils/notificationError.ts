import axios from 'axios';
import {
  NOTIFICATION_ERROR_CODES as CODES,
  NOTIFICATION_ERROR_MESSAGES as MESSAGES,
} from '../../../constants/serverErrors/notificationErrors';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';

export type NotificationErrorAction = 'list' | 'unreadCount' | 'read' | 'readAll';
export type NotificationErrorPopupConfig = { title: string; content: string };

const FALLBACK_MESSAGES: Record<NotificationErrorAction, NotificationErrorPopupConfig> = {
  list: {
    title: '알림을 불러오지 못했어요',
    content: '잠시 후 목록을 다시 불러와 주세요.',
  },
  unreadCount: {
    title: '읽지 않은 알림 수를 확인하지 못했어요',
    content: '잠시 후 다시 시도하거나 알림 목록을 확인해 주세요.',
  },
  read: {
    title: '알림을 읽음 처리하지 못했어요',
    content: '목록을 확인한 뒤 다시 시도해 주세요.',
  },
  readAll: {
    title: '모든 알림을 읽음 처리하지 못했어요',
    content: '목록을 확인한 뒤 다시 시도해 주세요.',
  },
};

const CODE_MESSAGES: Partial<Record<string, NotificationErrorPopupConfig>> = {
  [CODES.invalidJwt]: MESSAGES.authenticationRequired,
  [CODES.invalidAuthHeader]: MESSAGES.authenticationRequired,
  [CODES.missingTokenType]: MESSAGES.authenticationRequired,
  [CODES.unsupportedTokenType]: MESSAGES.authenticationRequired,
  [CODES.suspendedUser]: MESSAGES.suspendedUser,
};

// 커뮤니티와 동일하게 HTTP 상태보다 서버 코드를 우선하고, 수행하던 동작으로 안내를 결정한다.
// 조회 오류도 호출부에서 계산하므로 별도 effect나 전역 팝업 상태가 필요하지 않다.
export const getNotificationErrorPopupConfig = (
  error: unknown,
  action: NotificationErrorAction,
): NotificationErrorPopupConfig | null => {
  if (!error || axios.isCancel(error)) return null;
  const axiosError = axios.isAxiosError(error) ? error : undefined;
  const code = axiosError ? getServerErrorCode(axiosError) : undefined;
  const status = axiosError?.response?.status;
  const fallback = FALLBACK_MESSAGES[action];

  if (code && Object.hasOwn(CODE_MESSAGES, code)) return CODE_MESSAGES[code] ?? fallback;
  if (action === 'read' && code === CODES.notificationNotFound) {
    return MESSAGES.notificationNotFound;
  }
  if (code === CODES.invalidRequest) {
    return {
      title: fallback.title,
      content: action === 'read'
        ? '알림 정보가 올바르지 않습니다. 목록을 새로고침한 뒤 다시 선택해 주세요.'
        : '알림 조회 정보가 올바르지 않습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
    };
  }
  if (code === CODES.internalError) return { ...fallback, content: MESSAGES.internal };

  if (axiosError && !axiosError.response) return { ...fallback, content: MESSAGES.network };
  if (status === 401) return MESSAGES.authenticationRequired;
  if (status === 403) return { ...fallback, content: '알림을 조회하거나 변경할 권한이 없어요.' };
  if (status === 404 && action === 'read') return MESSAGES.notificationNotFound;
  if (status && status >= 500) return { ...fallback, content: MESSAGES.internal };
  return fallback;
};
