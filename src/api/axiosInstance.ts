import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { handleCommunityError } from "./interceptors/communityError";

// Axios 인스턴스 (API 모듈화)
export const axiosInstance = axios.create({
    // dev에서는 상대경로("")로 요청해 Vite proxy를 태우고, 프로덕션에서는 실제 백엔드 주소를 사용
    baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_BASE_URL,
    timeout: 9500, // Vercel Proxy는 10초이상 응답 지연 시 504 에러 발생 
    headers: {
        "Content-Type": "application/json",
    }
});

// Request Interceptor (요청 직전에 수행하는 작업)
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;

        if (accessToken) {
            // 로그인된 유저의 accessToken 붙이기
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;
        //비밀번호 변경 시의 401은 강제 로그아웃 안 되도록 예외처리
        const url = error.config?.url ?? "";
        const isPasswordChange = url.includes("/api/profile/password");

        // TODO: Refresh Token 도입 시 Access Token 재발급 및 원 요청 재시도 후,
        // 재발급 실패 시에만 로그아웃 처리
        // Unauthorized (비 로그인 접근 or Token 오류)
        if (status === 401 && !isPasswordChange) {
            console.log("Unauthorized(401)");
            // 토큰 만료 시 강제 로그아웃
            useAuthStore.getState().setLogout();
        }
        return Promise.reject(error);
    }
);

// 공용 인증 처리가 끝난 뒤 커뮤니티 도메인 오류 안내를 적용한다.
axiosInstance.interceptors.response.use(
    (response) => response,
    handleCommunityError,
);
