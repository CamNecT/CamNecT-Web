export type GifticonPurchaseAttempt = {
  key: string;
  clientRequestId: string;
};

type ResolveGifticonPurchaseAttemptParams = {
  previousAttempt: GifticonPurchaseAttempt | null;
  productId: number;
  quantity: number;
  spendPoints: number;
  recipientEmail?: string;
  createRequestId: () => string;
};

export const calculateGifticonPurchasePoints = (unitPrice: number, quantity: number) =>
  unitPrice * quantity;

export const hasEnoughGifticonPoints = (currentPoint: number, requiredPoint: number) =>
  currentPoint >= requiredPoint;

export const resolveGifticonPurchaseAttempt = ({
  previousAttempt,
  productId,
  quantity,
  spendPoints,
  recipientEmail,
  createRequestId,
}: ResolveGifticonPurchaseAttemptParams): GifticonPurchaseAttempt => {
  const key = `${productId}:${quantity}:${spendPoints}:${recipientEmail ?? ''}`;

  // 같은 구매 내용의 재시도에는 기존 ID를 유지해 서버 멱등성 검증이 동작하도록 합니다.
  if (previousAttempt?.key === key) return previousAttempt;

  return {
    key,
    clientRequestId: createRequestId(),
  };
};
