import axios from "axios";
import type { TokenRefreshRequest, TokenRefreshResponse } from "../api-types/authApiTypes";


// 토큰 갱신 요청이 공용 인터셉터를 다시 타지 않도록 별도 Axios 클라이언트 사용
const refreshClient = axios.create({
    // dev에서는 상대경로("")로 요청해 Vite proxy를 태우고, 프로덕션에서는 실제 백엔드 주소를 사용
    baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_BASE_URL,
    timeout: 9500, // Vercel Proxy는 10초이상 응답 지연 시 504 에러 발생
    headers: {
        "Content-Type": "application/json",
    },
});

// 토큰 재발급 API [POST] (/api/auth/refresh)
// Refresh Token Rotation을 사용하므로 호출부에서 응답의 두 토큰을 모두 교체해야 함
export const refreshTokens = async (data: TokenRefreshRequest) => {
    const response = await refreshClient.post<TokenRefreshResponse>("/api/auth/refresh", data);
    return response.data;
};
