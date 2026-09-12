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

        // 어떤 토큰을 붙였는지 함께 기록한다.
        // authMode "signup"이라도 signupToken이 없으면 정식 accessToken으로 폴백하므로
        // (ACTIVE + ONBOARDING_REQUIRED처럼 정식 세션으로 가입 단계를 이어가는 경우)
        // 401 처리에서 화면 종류가 아닌 실제 토큰 종류를 봐야 갱신 가능한 세션을 놓치지 않는다
        let token: string | null = null;
        let tokenKind: "temp" | "access" | null = null;

        if (authMode === "signup") {
            if (signupToken) {
                token = signupToken;
                tokenKind = "temp"; // 가입용 임시 토큰 (RTR 대상 아님)
            } else if (accessToken) {
                token = accessToken;
                tokenKind = "access"; // 회원가입 중 재로그인 등으로 정식 세션만 보유
            }
        } else if (authMode === "access") {
            token = accessToken;
            tokenKind = accessToken ? "access" : null;
        }
        // authMode "none" : 토큰 불필요

        config.tokenKind = tokenKind;

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
// todo 이 Lock은 탭 하나 안에서만 동작한다.
// 탭을 여러 개 띄운 상태에서 accessToken이 만료되면 각 탭이 같은 refreshToken으로
// 동시에 갱신을 요청해 서버의 재사용 검출에 걸리고, 실패한 탭이 로그아웃된다.
// 아래 세션 비교(보낸 refreshToken vs store 값)로도 막을 수 없다.
// zustand persist가 다른 탭의 localStorage 변경을 메모리 상태에 반영하지 않아
// 실패한 탭 입장에서는 세션이 그대로인 것으로 보이기 때문이다.
// 해결하려면 탭 간 잠금(Web Locks API 등)과 갱신 결과 공유(BroadcastChannel 등)가 필요하다.
let refreshPromise: Promise<void> | null = null;

// RTR 요청 함수 (성공 시 accessToken, refreshToken 갱신)
export const refreshAccessToken = (refreshToken: string) => {
    // 이미 refresh요청 중
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = refreshTokens({ refreshToken })
        .then((response) => {
            const { accessToken, refreshToken: rotatedRefreshToken } = response.data;

            // 갱신을 요청한 뒤 로그아웃·재로그인이 일어나면 store의 refreshToken이 달라진다.
            // (로그아웃이면 null, 다른 계정이거나 같은 계정 재로그인이어도 새 값)
            // 늦게 도착한 응답으로 이미 끝난 세션의 토큰을 되살리지 않는다.
            if (useAuthStore.getState().refreshToken !== refreshToken) {
                return;
            }

            // access, refreskToken 갱신
            useAuthStore.getState().setTokens(
                accessToken,
                rotatedRefreshToken
            );
        })
        // catch : refresh api 호출 실패 시 원인별 처리
        .catch((refreshError: unknown) => {
            // 갱신을 시작한 세션이 이미 끝났다면 현재 세션을 로그아웃시키지 않는다
            const isSameSession =
                useAuthStore.getState().refreshToken === refreshToken;

            if (isSameSession && axios.isAxiosError(refreshError)) {
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
        const tokenKind = error.config?.tokenKind ?? null;
        const errorCode = getServerErrorCode(error);

        // 실제로 보낸 토큰 종류로 만료 처리를 나눈다
        // temp : 가입용 임시 토큰이므로 RTR 대상이 아님 (호출부에서 오류를 처리)
        // access : 가입 화면에서 보낸 요청이라도 정식 세션이므로 RTR 대상
        // null : 붙인 토큰이 없어 401로 세션 상태를 판단할 수 없음 (그대로 호출부에 전달)
        if (status === 401) {
            if (tokenKind === "temp") {
                // 회원가입 임시 토큰 오류 -> signupToken만 제거
                useAuthStore.getState().clearSignupToken();
            }
            // 41101(비밀번호 변경 API) : 비밀번호 불일치 오류 -> 로그인 만료 X
            else if (tokenKind === "access" && errorCode !== "41101") {

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
