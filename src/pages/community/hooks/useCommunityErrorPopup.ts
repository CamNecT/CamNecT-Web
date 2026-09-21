import axios from 'axios';
import { useCallback, useState } from 'react';
import type { CommunityErrorResponse } from '../../../api-types/communityApiTypes';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';
import {
  getCommunityErrorPopupConfig,
  type CommunityErrorAction,
  type CommunityErrorPopupConfig,
} from '../utils/communityError';

// 커뮤니티 API 오류를 동작별 팝업 UI로 변환하는 도메인 전용 hook이다.
// 전역 오류 처리 도입 여부와 관계없이 네트워크 실패도 호출부에서 안내한다.
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
