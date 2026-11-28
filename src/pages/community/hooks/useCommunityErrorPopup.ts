import axios from 'axios';
import { useCallback, useState } from 'react';
import { getRequestErrorKind } from '../../../components/requestErrorPopup';
import type { CommunityErrorResponse } from '../../../api-types/communityApiTypes';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';
import { shouldSkipLocalErrorUI } from '../../../utils/getGlobalNetworkErrorType';
import {
  getCommunityErrorPopupConfig,
  type CommunityErrorAction,
  type CommunityErrorPopupConfig,
} from '../utils/communityError';

export type CommunityErrorOperation = { hasShownError?: boolean };

// 커뮤니티 API 오류를 동작별 팝업 UI로 변환하는 도메인 전용 hook이다.
// 전역 offline 오류는 App에 맡기고, 커뮤니티 오류 코드와 HTTP fallback만 이 계층에서 처리한다.
export const useCommunityErrorPopup = () => {
  const [errorPopup, setErrorPopup] =
    useState<CommunityErrorPopupConfig | null>(null);

  const closeCommunityError = useCallback(() => {
    setErrorPopup(null);
  }, []);

  const showCommunityError = useCallback(
    (error: unknown, action: CommunityErrorAction, operation?: CommunityErrorOperation) => {
      // 검색 조건 변경 등으로 취소한 요청은 사용자에게 실패로 안내하지 않는다.
      if (axios.isCancel(error)) return;
      if (shouldSkipLocalErrorUI(error, navigator.onLine)) return;

      // 확인 버튼은 팝업만 닫는다. 같은 동작에서 뒤늦게 실패한 요청은 다시 띄우지 않는다.
      if (operation?.hasShownError) return;
      if (operation) operation.hasShownError = true;

      const requestError = getRequestErrorKind(error);
      if (requestError) {
        setErrorPopup({
          requestError,
          // 오류 응답을 받았어도 포인트가 이미 차감됐을 수 있으므로 구매 여부부터 확인한다.
          guidance: action === 'postPurchase'
            ? '포인트 사용 내역에서 구매 여부를 확인한 뒤 다시 시도해 주세요.'
            : undefined,
        });
        return;
      }

      const axiosError = axios.isAxiosError<CommunityErrorResponse>(error)
        ? error
        : undefined;
      const errorCode = axiosError
        ? getServerErrorCode(axiosError)
        : undefined;

      setErrorPopup(getCommunityErrorPopupConfig({
        action,
        status: axiosError?.response?.status,
        errorCode,
        isNetworkError: Boolean(axiosError && !axiosError.response),
      }));
    },
    [],
  );

  return {
    errorPopup,
    showCommunityError,
    closeCommunityError,
  };
};
