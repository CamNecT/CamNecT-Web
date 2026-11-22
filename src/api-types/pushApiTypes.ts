// 공통 응답 구조
export interface BaseResponse<T> {
    status: number;
    message: string;
    data: T;
}

// 1. FCM Token 등록 (/api/notification/push/tokens)
export interface RegisterFcmTokenRequest {
    deviceId: string;
    platform: "WEB";
    token: string;
}

export interface RegisterFcmTokenData {
    pushDeviceId: number;
    created: boolean;
}

export type RegisterFcmTokenResponse = BaseResponse<RegisterFcmTokenData>;