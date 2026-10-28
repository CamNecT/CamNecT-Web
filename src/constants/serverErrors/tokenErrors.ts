// REST 인증 토큰 API 응답 code 모음
// Axios error code는 getServerErrorCode에서 string으로 정규화하므로 문자열로 관리

// 일반 access 요청에서 토큰 갱신을 시작할 수 있는 code
export const REFRESHABLE_ACCESS_TOKEN_ERROR_CODES = new Set<string>([
    "40100", // accessToken 만료·서명·claim 오류
]);

// refresh 요청이 실패했을 때 로그인 세션을 종료해야 하는 code
export const REFRESH_FAILURE_LOGOUT_ERROR_CODES = new Set<string>([
    "41103", // 서버 세션에 없거나 폐기된 토큰
    "41106", // refreshToken이 아닌 토큰 사용
    "41107", // Rotation으로 이미 사용된 refreshToken 재사용
    "41108", // refreshToken 만료·무효
]);

// 계정 상태상 로그인 세션을 유지할 수 없는 code
export const ACCOUNT_SESSION_LOGOUT_ERROR_CODES = new Set<string>([
    "41302", // 정지된 사용자
    "41303", // 탈퇴한 사용자
]);

// 토큰을 지우지 않고 현재 요청만 실패시켜야 하는 일시적 장애 code
export const TEMPORARY_REFRESH_ERROR_CODES = new Set<string>([
    "50310", // Redis 일시 장애
]);
