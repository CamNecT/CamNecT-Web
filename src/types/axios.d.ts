import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    authMode?: "access" | "signup" | "none";
    // 요청에 실제로 붙인 토큰의 종류
    // authMode가 "signup"이어도 signupToken이 없으면 정식 accessToken으로 폴백하므로
    // 만료 처리(RTR 여부)는 화면 종류(authMode)가 아니라 이 값으로 판단한다
    tokenKind?: "temp" | "access" | null;
    _retry?: boolean; // 기존 API 요청 재시도 여부
  }
}
