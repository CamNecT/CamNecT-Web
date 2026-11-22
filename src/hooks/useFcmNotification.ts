import { getToken, onMessage } from "firebase/messaging";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { registerFcmToken } from "../api/push";
import { getFirebaseMessaging, getInstallationId } from "../shared/firebase";
import { useAuthStore } from "../store/useAuthStore";

export const useFcmToken = () => {
    const queryClient = useQueryClient();

    const handleRequestPermission = useCallback(async (): Promise<boolean> => {
        const account = useAuthStore.getState().user?.id;
        if (!account || !("Notification" in window) || !window.isSecureContext || !("serviceWorker" in navigator)) return false;
        try {
            // Ask during the user gesture, before asynchronous Firebase initialization.
            const permission = Notification.permission === "default"
                ? await Notification.requestPermission()
                : Notification.permission;
            if (permission !== "granted") return false;
            const messaging = await getFirebaseMessaging();
            if (!messaging) return false;
            const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
                serviceWorkerRegistration: registration,
            });
            const deviceId = await getInstallationId();
            if (!token || !deviceId || useAuthStore.getState().user?.id !== account) return false;
            await registerFcmToken({ deviceId, platform: "WEB", token });
            return true;
        } catch {
            return false;
        }
    }, []);

    // 포그라운드 수신 시 알림 목록과 읽지 않은 개수를 갱신한다.
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let isMounted = true;

        getFirebaseMessaging().then((messaging) => {
            if (!isMounted || !messaging) return;

            unsubscribe = onMessage(messaging, () => {
                const userId = useAuthStore.getState().user?.id;

                if (!userId) return;

                queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] });
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            });
        });

        return () => {
            isMounted = false;
            unsubscribe?.();
        };
    }, [queryClient]);

    return { handleRequestPermission };
}
