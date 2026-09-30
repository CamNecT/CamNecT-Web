import axios from 'axios';
import { useCallback, useState } from 'react';
import type { GifticonErrorResponse } from '../../../api-types/gifticonApiTypes';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';
import {
  getGifticonErrorPopupConfig,
  type GifticonErrorAction,
  type GifticonErrorPopupConfig,
} from '../utils/gifticonError';

// 기프티콘 API 오류를 목록·상세·구매 동작별 팝업 문구로 변환합니다.
export const useGifticonErrorPopup = () => {
  const [errorPopup, setErrorPopup] = useState<GifticonErrorPopupConfig | null>(null);

  const closeGifticonError = useCallback(() => {
    setErrorPopup(null);
  }, []);

  const showGifticonError = useCallback((error: unknown, action: GifticonErrorAction) => {
    if (axios.isCancel(error)) return;

    const axiosError = axios.isAxiosError<GifticonErrorResponse>(error) ? error : undefined;
    const errorCode = axiosError ? getServerErrorCode(axiosError) : undefined;

    setErrorPopup(
      getGifticonErrorPopupConfig({
        action,
        status: axiosError?.response?.status,
        errorCode,
        isNetworkError: Boolean(axiosError && !axiosError.response),
      }),
    );
  }, []);

  return {
    errorPopup,
    showGifticonError,
    closeGifticonError,
  };
};
