import axios, { AxiosError } from 'axios';

// Axios 오류를 전역 offline 대상으로 볼 수 있는지만 판별하는 순수 유틸이다.
// 전역 상태 변경이나 UI 표시는 하지 않아 interceptor와 도메인 호출부에서 함께 재사용할 수 있다.
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

// 전역 offline 팝업이 담당하는 오류에 한해서만 로컬 오류 UI를 생략한다.
export const shouldSkipLocalErrorUI = (
  error: unknown,
  isOnline: boolean,
) => getGlobalNetworkErrorType(error, isOnline) !== null;
