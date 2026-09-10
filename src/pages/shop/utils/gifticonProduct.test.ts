import { describe, expect, it } from 'vitest';
import type { GifticonProduct } from '../../../api-types/gifticonApiTypes';
import { mapActiveGifticonProducts, mapGifticonProduct } from './gifticonProduct';

const activeProduct: GifticonProduct = {
  productId: 1,
  brandName: '브랜드',
  productName: '상품',
  pricePoints: 3000,
  imageUrl: 'https://example.com/product.png',
  active: true,
};

describe('gifticon product mapper', () => {
  it('API 상품을 화면 모델로 변환하며 판매 상태를 보존한다', () => {
    expect(mapGifticonProduct(activeProduct)).toEqual({
      id: 1,
      company: '브랜드',
      name: '상품',
      point: 3000,
      imageUrl: 'https://example.com/product.png',
      active: true,
    });
  });

  it('목록에서는 판매 중인 상품만 반환한다', () => {
    const inactiveProduct = { ...activeProduct, productId: 2, active: false };

    expect(mapActiveGifticonProducts([activeProduct, inactiveProduct])).toHaveLength(1);
    expect(mapActiveGifticonProducts([activeProduct, inactiveProduct])[0]?.id).toBe(1);
  });
});
