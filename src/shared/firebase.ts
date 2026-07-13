import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import { getInstallations } from "firebase/installations";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase App 초기화
const app = initializeApp(firebaseConfig);

let messagingPromise: Promise<Messaging | null> | null = null;

// messaging(푸시알림) 객체는 지원 브라우저에서만 지연 생성
export const getFirebaseMessaging = () => {
  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((supported) => (supported ? getMessaging(app) : null))
      .catch((error) => {
        console.warn("Firebase Messaging 지원 여부 확인 실패", error);
        return null;
      });
  }

  return messagingPromise;
};

// 설치 (FID 발급용) 객체
export const installations = getInstallations(app);

export default app;
