import axios, { type AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';
import { shouldSkipLocalErrorUI } from '../../../utils/getGlobalNetworkErrorType';
import {
  getCommunityErrorPopupConfig,
  type CommunityErrorAction,
  type CommunityErrorPopupConfig,
} from '../utils/communityError';

export const useCommunityErrorPopup = () => {
  const [errorPopup, setErrorPopup] =
    useState<CommunityErrorPopupConfig | null>(null);

  const closeCommunityError = useCallback(() => {
    setErrorPopup(null);
  }, []);

  const showCommunityError = useCallback(
    (error: unknown, action: CommunityErrorAction) => {
      // 검색 조건 변경 등으로 취소한 요청은 사용자에게 실패로 안내하지 않는다.
      if (axios.isCancel(error)) return;
      if (shouldSkipLocalErrorUI(error, navigator.onLine)) return;

      const axiosError = axios.isAxiosError(error)
        ? (error as AxiosError)
        : undefined;
      const errorCode = axiosError
        ? getServerErrorCode(axiosError)
        : undefined;

      setErrorPopup(
        getCommunityErrorPopupConfig({
          action,
          status: axiosError?.response?.status,
          errorCode,
        }),
      );
    },
    [],
  );

  return {
    errorPopup,
    showCommunityError,
    closeCommunityError,
  };
};
