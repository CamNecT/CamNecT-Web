import axios, { AxiosError } from 'axios';

export type GlobalNetworkErrorType = 'offline' | null;

const TIMEOUT_ERROR_CODES = new Set<string>([
  AxiosError.ECONNABORTED,
  AxiosError.ETIMEDOUT,
]);

// navigator.onLine 값은 호출부에서 전달받아 브라우저 전역에 의존하지 않고 판별만 수행한다.
export const getGlobalNetworkErrorType = (
  error: unknown,
  isOnline: boolean,
): GlobalNetworkErrorType => {
  if (!axios.isAxiosError(error)) return null;

  if (axios.isCancel(error) || error.code === AxiosError.ERR_CANCELED) {
    return null;
  }

  if (error.code && TIMEOUT_ERROR_CODES.has(error.code)) {
    return null;
  }

  // HTTP 응답을 받은 오류는 status와 무관하게 기존 도메인 처리에 맡긴다.
  if (error.response) return null;

  if (error.code === AxiosError.ERR_NETWORK && isOnline === false) {
    return 'offline';
  }

  return null;
};

export const shouldSkipLocalErrorUI = (
  error: unknown,
  isOnline: boolean,
) => getGlobalNetworkErrorType(error, isOnline) !== null;
