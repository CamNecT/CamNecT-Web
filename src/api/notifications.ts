import type {
    NotificationListRequest,
    NotificationListResponse,
    NotificationReadRequest,
    NotificationReadResponse,
    NotificationUnreadCountRequest,
    NotificationUnreadCountResponse,
} from "../api-types/notificationApiTypes";
import { axiosInstance } from "./axiosInstance";

// 알림 목록 조회 API [GET] (/api/notifications)
export const requestNotifications = async (params: NotificationListRequest) => {
    const response = await axiosInstance.get<NotificationListResponse>("/api/notifications", {
        params,
    });
    return response.data;
};

// 알림 안읽음 개수 조회 API [GET] (/api/notifications/unread-count)
export const requestNotificationUnreadCount = async (params: NotificationUnreadCountRequest) => {
    const response = await axiosInstance.get<NotificationUnreadCountResponse>("/api/notifications/unread-count", {
        params,
    });
    return response.data;
};

// 알림 읽음 처리 API [PATCH] (/api/notifications/{id}/read)
export const requestNotificationRead = async (params: NotificationReadRequest) => {
    const response = await axiosInstance.patch<NotificationReadResponse>(
        `/api/notifications/${params.id}/read`,
        null,
        {
            params: {
                userId: params.userId,
            },
        },
    );
    return response.data;
};
