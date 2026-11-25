import axios, { AxiosError } from 'axios';

export type RequestErrorKind = 'server' | 'connection';

export type RequestErrorPopupConfig = {
  requestError?: RequestErrorKind;
  guidance?: string;
};

export const isServerErrorStatus = (status?: number) =>
  status !== undefined && status >= 500 && status <= 599;

export const getRequestErrorKind = (error: unknown): RequestErrorKind | undefined => {
  if (error instanceof Response) {
    return isServerErrorStatus(error.status) ? 'server' : undefined;
  }
  if (!axios.isAxiosError(error) || axios.isCancel(error)) return undefined;

  if (error.response) {
    return isServerErrorStatus(error.response.status) ? 'server' : undefined;
  }

  // 응답 없는 오류라도 요청 설정 오류나 취소는 연결 실패로 안내하지 않는다.
  if (
    error.code === AxiosError.ERR_NETWORK ||
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ETIMEDOUT
  ) {
    return 'connection';
  }
};
