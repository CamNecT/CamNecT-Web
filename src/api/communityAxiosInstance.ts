import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useCommunityErrorPopupStore } from "../store/useCommunityErrorPopupStore";

export const communityAxiosInstance = axios.create({
  // dev에서는 상대경로("")로 요청해 Vite proxy를 태우고, 프로덕션에서는 실제 백엔드 주소를 사용
  baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_BASE_URL,
  timeout: 9500,
  headers: {
    "Content-Type": "application/json",
  },
});

communityAxiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

communityAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string | undefined = error.config?.url;

    if (!url?.includes("/api/community")) {
      return Promise.reject(error);
    }

    let popUpConfig;
    if (status === 401) {
      useAuthStore.getState().setLogout();
    }
    if (status === 403) {
      popUpConfig = {
        title: "접근 권한이 없습니다",
        content:
          "요청하신 페이지를 볼 수 있는 권한이 없어요.\n관리자에게 문의하시거나 권한을 확인해 주세요.",
      };
    } else if (status === 404) {
      popUpConfig = {
        title: "페이지를 찾을 수 없습니다",
        content:
          "요청하신 페이지는 존재하지 않는 주소입니다.\n주소를 다시 한번 확인해 주세요.",
      };
    } else if (status === 500) {
      popUpConfig = {
        title: "시스템 오류가 발생했습니다",
        content:
          "서비스 이용에 불편을 드려 죄송합니다.\n잠시 후 다시 시도해 주세요.",
      };
    }

    if (popUpConfig) {
      useCommunityErrorPopupStore.getState().setPopUpConfig(popUpConfig);
    }

    return Promise.reject(error);
  },
);
