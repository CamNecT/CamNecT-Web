import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { handleCommunityError } from "./interceptors/communityError";
import { clearClientSession } from "../utils/clearClientSession";
import { getServerErrorCode } from "../utils/getServerErrorCode";
import { refreshTokens } from "./refreshClient";
import { REFRESHABLE_ACCESS_TOKEN_ERROR_CODES, REFRESH_FAILURE_LOGOUT_ERROR_CODES, ACCOUNT_SESSION_LOGOUT_ERROR_CODES } from "../constants/serverErrors/tokenErrors";

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

// 동시 401시에 1번의 RTR만 호출 (비동기 Lock)
let refreshPromise: Promise<void> | null = null;

// RTR 요청 함수 (성공 시 accessToken, refreshToken 갱신)
const refreshAccessToken = (refreshToken: string) => {
    // 이미 refresh요청 중
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = refreshTokens({ refreshToken })
        .then((response) => {
            const { accessToken, refreshToken } = response.data;

            // access, refreskToken 갱신
            useAuthStore.getState().setTokens(
                accessToken,
                refreshToken
            );
        })
        // catch : refresh api 호출 실패 시 원인별 처리
        .catch((refreshError: unknown) => {
            if (axios.isAxiosError(refreshError)) {
                const status = refreshError.response?.status;
                const errorCode = getServerErrorCode(refreshError);

                // 강제 로그아웃 여부 판단 (401, 403의 특정 errorCodes)
                const shouldLogout =
                    errorCode !== undefined && (
                        (
                            status === 401 &&
                            REFRESH_FAILURE_LOGOUT_ERROR_CODES.has(errorCode)
                        ) ||
                        (
                            status === 403 &&
                            ACCOUNT_SESSION_LOGOUT_ERROR_CODES.has(errorCode)
                        )
                    )

                if (shouldLogout) {
                    clearClientSession();
                }
            }

            // refresh 실패 원인을 호출부에서 처리
            throw refreshError;
        })
        .finally(() => {
            // refreshPromise명시적 초기화 (자동 초기화 X)
            refreshPromise = null;
        });
    
    return refreshPromise;
}

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const status = error.response?.status;
        const authMode = error.config?.authMode ?? "access";
        const errorCode = getServerErrorCode(error);

        // access 요청의 Unauthorized만 정식 로그인 세션 만료로 처리
        // signup/none 요청은 Refresh 대상이 아니므로 각 호출부에서 오류를 처리함
        if (status === 401) {
            if (authMode === "signup") {
                // 회원가입 임시 토큰 오류 -> signupToken만 제거
                useAuthStore.getState().clearSignupToken();
            }
            // 41101(비밀번호 변경 API) : 비밀번호 불일치 오류 -> 로그인 만료 X
            else if (authMode === "access" && errorCode !== "41101") {

                const originalRequest = error.config; // config : URL, HTTP method, header, body가 포함
                const { refreshToken } = useAuthStore.getState();

                const isAccessTokenError = 
                    errorCode !== undefined && 
                    REFRESHABLE_ACCESS_TOKEN_ERROR_CODES.has(errorCode);
                
                // [Guard1] RTR이후 동일 API 재요청 오류시
                if (originalRequest?._retry) {
                    // API 재요청 이후 accesstoken관련 오류
                    if (isAccessTokenError) {
                        clearClientSession();
                    }

                    // 그 외 일반오류
                    return Promise.reject(error);
                }
                
                // refresh api 호출 조건
                const shouldRefresh =
                    originalRequest
                    && refreshToken
                    && isAccessTokenError;
                
                // [Guard2] RTR 호출 및 동일 API 재호출
                if (shouldRefresh) {
                    originalRequest._retry = true; // 해당 요청은 이미 재시도 중

                    await refreshAccessToken(refreshToken);
                    
                    return axiosInstance(originalRequest); // API 재요청
                }

                // (처음시도) RTR 조건 불충족 시 클라이언트 세션 종료 (로그아웃)
                clearClientSession();
            }
        }
        return Promise.reject(error);
    }
);

// 공용 인증 처리가 끝난 뒤 커뮤니티 도메인 오류 안내를 적용한다.
axiosInstance.interceptors.response.use(
    (response) => response,
    handleCommunityError,
);
