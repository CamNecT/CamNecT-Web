import axios from 'axios';
import { useCallback, useState } from 'react';
import type { CommunityErrorResponse } from '../../../api-types/communityApiTypes';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';
import { shouldSkipLocalErrorUI } from '../../../utils/getGlobalNetworkErrorType';
import {
  getCommunityErrorPopupConfig,
  type CommunityErrorAction,
  type CommunityErrorPopupConfig,
} from '../utils/communityError';

// 커뮤니티 API 오류를 동작별 팝업 UI로 변환하는 도메인 전용 hook이다.
// 전역 offline 오류는 App에 맡기고, 커뮤니티 오류 코드와 HTTP fallback만 이 계층에서 처리한다.
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

      const axiosError = axios.isAxiosError<CommunityErrorResponse>(error)
        ? error
        : undefined;
      const errorCode = axiosError
        ? getServerErrorCode(axiosError)
        : undefined;

      setErrorPopup(
        getCommunityErrorPopupConfig({
          action,
          status: axiosError?.response?.status,
          errorCode,
          isNetworkError: Boolean(axiosError && !axiosError.response),
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
