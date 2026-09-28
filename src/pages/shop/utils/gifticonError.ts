import {
  GIFTICON_ERROR_CODES,
  GIFTICON_ERROR_POPUP_MESSAGES,
} from '../../../constants/serverErrors/gifticonErrors';

export type GifticonErrorAction = 'home' | 'detail' | 'purchase';

export type GifticonErrorPopupConfig = {
  title: string;
  content: string;
};

const ACTION_FALLBACK_MESSAGES: Record<GifticonErrorAction, GifticonErrorPopupConfig> = {
  home: {
    title: '상품 목록을 불러오지 못했습니다',
    content: '잠시 후 다시 시도해 주세요.',
  },
  detail: {
    title: '상품 정보를 불러오지 못했습니다',
    content: '상품 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  purchase: {
    title: '구매를 완료하지 못했습니다',
    content: '구매 정보를 확인한 뒤 다시 시도해 주세요.',
  },
};

const CODE_POPUP_MESSAGES: Partial<Record<string, GifticonErrorPopupConfig>> = {
  [GIFTICON_ERROR_CODES.invalidJwt]: GIFTICON_ERROR_POPUP_MESSAGES.authenticationRequired,
  [GIFTICON_ERROR_CODES.invalidAuthHeader]: GIFTICON_ERROR_POPUP_MESSAGES.authenticationRequired,
  [GIFTICON_ERROR_CODES.missingTokenType]: GIFTICON_ERROR_POPUP_MESSAGES.authenticationRequired,
  [GIFTICON_ERROR_CODES.unsupportedTokenType]: GIFTICON_ERROR_POPUP_MESSAGES.authenticationRequired,
  [GIFTICON_ERROR_CODES.unsupportedContentType]: GIFTICON_ERROR_POPUP_MESSAGES.unsupportedContentType,
  [GIFTICON_ERROR_CODES.concurrencyConflict]: GIFTICON_ERROR_POPUP_MESSAGES.concurrencyConflict,
  [GIFTICON_ERROR_CODES.insufficientPoints]: GIFTICON_ERROR_POPUP_MESSAGES.insufficientPoints,
  [GIFTICON_ERROR_CODES.pointWalletUnavailable]: GIFTICON_ERROR_POPUP_MESSAGES.pointWalletUnavailable,
  [GIFTICON_ERROR_CODES.inactiveProduct]: GIFTICON_ERROR_POPUP_MESSAGES.inactiveProduct,
  [GIFTICON_ERROR_CODES.invalidQuantity]: GIFTICON_ERROR_POPUP_MESSAGES.invalidQuantity,
  [GIFTICON_ERROR_CODES.invalidRecipientEmail]: GIFTICON_ERROR_POPUP_MESSAGES.invalidRecipientEmail,
  [GIFTICON_ERROR_CODES.productNotFound]: GIFTICON_ERROR_POPUP_MESSAGES.productNotFound,
  [GIFTICON_ERROR_CODES.idempotencyConflict]: GIFTICON_ERROR_POPUP_MESSAGES.idempotencyConflict,
};

// 40000은 목록의 정렬값, 상세의 상품 ID, 구매의 요청값 검증 실패로 의미가 다릅니다.
const INVALID_REQUEST_MESSAGES: Record<GifticonErrorAction, GifticonErrorPopupConfig> = {
  home: GIFTICON_ERROR_POPUP_MESSAGES.invalidListRequest,
  detail: GIFTICON_ERROR_POPUP_MESSAGES.invalidProductRequest,
  purchase: GIFTICON_ERROR_POPUP_MESSAGES.invalidPurchaseRequest,
};

type GetGifticonErrorPopupConfigParams = {
  action: GifticonErrorAction;
  status?: number;
  errorCode?: string;
  isNetworkError?: boolean;
};

// 동일한 HTTP 상태에 여러 기프티콘 오류 코드가 있으므로 코드 안내를 우선합니다.
export const getGifticonErrorPopupConfig = ({
  action,
  status,
  errorCode,
  isNetworkError = false,
}: GetGifticonErrorPopupConfigParams): GifticonErrorPopupConfig => {
  if (errorCode === GIFTICON_ERROR_CODES.invalidRequest) {
    return INVALID_REQUEST_MESSAGES[action];
  }
  if (errorCode && Object.hasOwn(CODE_POPUP_MESSAGES, errorCode)) {
    const codeMessage = CODE_POPUP_MESSAGES[errorCode];
    if (codeMessage) return codeMessage;
  }

  const fallback = ACTION_FALLBACK_MESSAGES[action];

  if (errorCode === GIFTICON_ERROR_CODES.internalError) {
    return { ...fallback, content: GIFTICON_ERROR_POPUP_MESSAGES.internal.content };
  }

  if (isNetworkError) {
    return {
      title: fallback.title,
      content: GIFTICON_ERROR_POPUP_MESSAGES.network.content,
    };
  }

  // 서버 코드가 없는 프록시·인증 오류도 현재 수행 중인 동작에 맞춰 안내합니다.
  if (status === 401) return GIFTICON_ERROR_POPUP_MESSAGES.authenticationRequired;
  if (status === 403) {
    return { ...fallback, content: '이 상품을 조회하거나 구매할 권한이 없습니다.' };
  }
  if (status === 404 && action !== 'home') return GIFTICON_ERROR_POPUP_MESSAGES.productNotFound;
  if (status === 415 && action === 'purchase') return GIFTICON_ERROR_POPUP_MESSAGES.unsupportedContentType;
  if (status !== undefined && status >= 500) {
    return {
      title: fallback.title,
      content: GIFTICON_ERROR_POPUP_MESSAGES.internal.content,
    };
  }

  return fallback;
};
