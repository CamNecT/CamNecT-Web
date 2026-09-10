import { describe, expect, it, vi } from 'vitest';
import {
  calculateGifticonPurchasePoints,
  hasEnoughGifticonPoints,
  resolveGifticonPurchaseAttempt,
} from './gifticonPurchase';

describe('gifticon purchase rules', () => {
  it('상품 가격과 수량으로 차감 포인트를 계산한다', () => {
    expect(calculateGifticonPurchasePoints(3000, 2)).toBe(6000);
  });

  it('보유 포인트가 필요 포인트와 같아도 구매할 수 있다', () => {
    expect(hasEnoughGifticonPoints(6000, 6000)).toBe(true);
    expect(hasEnoughGifticonPoints(5999, 6000)).toBe(false);
  });

  it('동일한 구매 재시도에는 같은 요청 ID를 사용한다', () => {
    const createRequestId = vi.fn(() => 'new-request-id');
    const previousAttempt = {
      key: '1:2:6000:user@example.com',
      clientRequestId: 'existing-request-id',
    };

    const attempt = resolveGifticonPurchaseAttempt({
      previousAttempt,
      productId: 1,
      quantity: 2,
      spendPoints: 6000,
      recipientEmail: 'user@example.com',
      createRequestId,
    });

    expect(attempt).toBe(previousAttempt);
    expect(createRequestId).not.toHaveBeenCalled();
  });

  it('수량이나 이메일이 변경되면 새로운 요청 ID를 만든다', () => {
    const createRequestId = vi.fn(() => 'new-request-id');

    const attempt = resolveGifticonPurchaseAttempt({
      previousAttempt: {
        key: '1:1:3000:user@example.com',
        clientRequestId: 'existing-request-id',
      },
      productId: 1,
      quantity: 2,
      spendPoints: 6000,
      recipientEmail: 'user@example.com',
      createRequestId,
    });

    expect(attempt.clientRequestId).toBe('new-request-id');
    expect(createRequestId).toHaveBeenCalledOnce();
  });
});
