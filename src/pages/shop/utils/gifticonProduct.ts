import type { GifticonProduct } from '../../../api-types/gifticonApiTypes';

export const mapGifticonProduct = (product: GifticonProduct) => ({
  id: product.productId,
  company: product.brandName,
  name: product.productName,
  point: product.pricePoints,
  imageUrl: product.imageUrl,
  active: product.active,
});

// 판매 중인 상품만 목록에 노출하고, 상세에서는 active 값을 보존해 구매를 차단합니다.
export const mapActiveGifticonProducts = (products: GifticonProduct[]) =>
  products.filter((product) => product.active).map(mapGifticonProduct);
