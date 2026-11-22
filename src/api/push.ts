import type {
    RegisterFcmTokenRequest,
    RegisterFcmTokenResponse
} from "../api-types/pushApiTypes";
import { axiosInstance } from "./axiosInstance";

// 1. FCM Token, FID 등록 API [POST] (/api/notifications/push/tokens)
export const registerFcmToken = async (data: RegisterFcmTokenRequest): Promise<RegisterFcmTokenResponse> => {
    const response = await axiosInstance.post("/api/notifications/push/tokens", data);
    return response.data;
};
export interface PushPreference {
    pushEnabled: boolean;
}

const preferenceUrl = "/api/me/notification-preferences";

export const fetchPushPreference = async (): Promise<PushPreference> =>
    (await axiosInstance.get<{ data: PushPreference }>(preferenceUrl)).data.data;

export const savePushPreference = async (pushEnabled: boolean): Promise<PushPreference> =>
    (await axiosInstance.patch<{ data: PushPreference }>(preferenceUrl, { pushEnabled })).data.data;
