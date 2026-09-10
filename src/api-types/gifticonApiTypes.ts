export interface GifticonProduct {
    productId: number;
    brandName: string;
    productName: string;
    pricePoints: number;
    imageUrl: string;
    active: boolean;
}

export interface GifticonHomeData {
    myPoint: number;
    phoneNum: string;
    products: GifticonProduct[];
    lastSyncedAt: string;
}

// 기프티콘 샵 홈 DTO (/api/gifticons/home) 
export interface GifticonHomeRequest {
    userId: number;
}

export interface GifticonHomeResponse {
    status: number;
    message: string;
    data: GifticonHomeData;
}

// 상품 상세 조회 DTO (/api/gifticons/products/{productId})
export interface GifticonProductRequest {
    productId: number;
}

export interface GifticonProductResponse {
    status: number;
    message: string;
    data: GifticonProduct;
}

// 상품 구매 DTO (/api/gifticons/purchases/confirm)
export interface GifticonPurchaseRequest {
    userId: number; // 쿼리 파라미터
    productId: number;
    quantity: number;
    spendPoints: number;
    clientRequestId: string;
    recipientName: string;
    recipientEmail: string;
    giftMessage: string | null;
}

export interface GifticonPurchaseData {
    purchaseId: number;
    requestedAt: string;
}

export interface GifticonPurchaseResponse {
    status: number;
    message: string;
    data: GifticonPurchaseData;
}
