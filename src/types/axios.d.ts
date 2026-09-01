import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    authMode?: "access" | "signup" | "none";
  }
}