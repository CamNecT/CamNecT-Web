import { describe, expect, it } from 'vitest';
import { GIFTICON_ERROR_CODES } from '../../../constants/serverErrors/gifticonErrors';
import { getGifticonErrorPopupConfig } from './gifticonError';

describe('gifticon error popup mapper', () => {
  it('판매 종료 코드를 구매 불가 안내로 변환한다', () => {
    expect(
      getGifticonErrorPopupConfig({
        action: 'purchase',
        status: 400,
        errorCode: GIFTICON_ERROR_CODES.inactiveProduct,
      }),
    ).toEqual({
      title: '구매할 수 없는 상품입니다',
      content: '현재 판매가 종료된 상품입니다. 다른 상품을 확인해 주세요.',
    });
  });

  it('포인트 동시성 충돌을 최신 포인트 확인 안내로 변환한다', () => {
    expect(
      getGifticonErrorPopupConfig({
        action: 'purchase',
        status: 409,
        errorCode: GIFTICON_ERROR_CODES.concurrencyConflict,
      }).title,
    ).toBe('포인트 상태가 변경되었습니다');
  });

  it('알 수 없는 네트워크 오류는 동작별 제목과 네트워크 안내를 사용한다', () => {
    expect(
      getGifticonErrorPopupConfig({
        action: 'detail',
        isNetworkError: true,
      }),
    ).toEqual({
      title: '상품 정보를 불러오지 못했습니다',
      content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
    });
  });

  it('알 수 없는 구매 오류는 구매 동작의 기본 안내를 사용한다', () => {
    expect(getGifticonErrorPopupConfig({ action: 'purchase', status: 400 })).toEqual({
      title: '구매를 완료하지 못했습니다',
      content: '구매 정보를 확인한 뒤 다시 시도해 주세요.',
    });
  });
});
