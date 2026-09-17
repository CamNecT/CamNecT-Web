// Swagger의 Gifticon Controller 오류 코드를 의미별로 관리합니다.
export const GIFTICON_ERROR_CODES = {
  invalidRequest: '40000',
  invalidJwt: '40100',
  invalidAuthHeader: '41103',
  missingTokenType: '41104',
  unsupportedTokenType: '41106',
  unsupportedContentType: '41500',
  concurrencyConflict: '40900',
  insufficientPoints: '44101',
  pointWalletUnavailable: '44150',
  inactiveProduct: '47001',
  invalidQuantity: '47002',
  invalidRecipientEmail: '47003',
  productNotFound: '47401',
  idempotencyConflict: '47901',
  internalError: '50000',
} as const;

export const GIFTICON_ERROR_POPUP_MESSAGES = {
  authenticationRequired: {
    title: '로그인이 필요합니다',
    content: '로그인 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.',
  },
  inactiveProduct: {
    title: '구매할 수 없는 상품입니다',
    content: '현재 판매가 종료된 상품입니다. 다른 상품을 확인해 주세요.',
  },
  invalidQuantity: {
    title: '구매 수량을 확인해 주세요',
    content: '구매 가능한 수량으로 다시 선택해 주세요.',
  },
  invalidRecipientEmail: {
    title: '수신 이메일을 확인해 주세요',
    content: '등록된 이메일을 확인한 뒤 다시 시도해 주세요.',
  },
  insufficientPoints: {
    title: '포인트가 부족해서 구매할 수 없어요',
    content: '다양한 활동으로 포인트를 채워보세요!',
  },
  productNotFound: {
    title: '상품을 찾을 수 없습니다',
    content: '삭제되었거나 존재하지 않는 상품입니다.',
  },
  idempotencyConflict: {
    title: '구매 정보를 다시 확인해 주세요',
    content: '이전 구매 요청과 정보가 달라 처리할 수 없습니다. 상품 화면에서 다시 시도해 주세요.',
  },
  concurrencyConflict: {
    title: '포인트 상태가 변경되었습니다',
    content: '최신 포인트를 확인한 뒤 다시 시도해 주세요.',
  },
  pointWalletUnavailable: {
    title: '포인트를 처리하지 못했습니다',
    content: '잠시 후 다시 시도해 주세요.',
  },
  unsupportedContentType: {
    title: '구매 요청을 처리할 수 없습니다',
    content: '화면을 새로고침한 뒤 다시 시도해 주세요.',
  },
  network: {
    title: '요청을 처리하지 못했습니다',
    content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  internal: {
    title: '요청을 처리하지 못했습니다',
    content: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  },
} as const;
