import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { handleCommunityError } from "./interceptors/communityError";
import { clearClientSession } from "../utils/clearClientSession";

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
        const authMode = config.authMode ?? "access"; // 기본 : access
        const { accessToken, signupToken } = useAuthStore.getState();

        const token = authMode === "signup" ? signupToken ?? accessToken // 회원가입 중 재 로그인 시 accessToken 사용
            : authMode === "access" ? accessToken
            : null; // token필요없는 API

        if (authMode === "signup" && !token) {
            throw new AxiosError(
                "회원가입 인증 토큰이 없습니다.",
                "ERR_SIGNUP_TOKEN_MISSING",
                config,
            );
        }

        if (token) {
            // 요청의 인증 모드에 맞는 토큰 붙이기
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // none 요청에는 기존 Authorization 값이 남지 않도록 제거
            config.headers.delete("Authorization");
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
        const authMode = error.config?.authMode ?? "access";
        //비밀번호 변경 시의 401은 강제 로그아웃 안 되도록 예외처리
        const url = error.config?.url ?? "";
        const isPasswordChange = url.includes("/api/profile/password");

        // access 요청의 Unauthorized만 정식 로그인 세션 만료로 처리
        // signup/none 요청은 Refresh 대상이 아니므로 각 호출부에서 오류를 처리함
        if (status === 401 && authMode === "access" && !isPasswordChange) {
            console.log("Unauthorized(401)");
            // 토큰 만료 시 강제 로그아웃 (캐시/소켓까지 정리)
            clearClientSession();
        }
        return Promise.reject(error);
    }
);

// 공용 인증 처리가 끝난 뒤 커뮤니티 도메인 오류 안내를 적용한다.
axiosInstance.interceptors.response.use(
    (response) => response,
    handleCommunityError,
);
