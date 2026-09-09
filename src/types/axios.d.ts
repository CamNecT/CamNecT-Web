import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    authMode?: "access" | "signup" | "none";
    _retry?: boolean; // 기존 API 요청 재시도 여부
  }
}
