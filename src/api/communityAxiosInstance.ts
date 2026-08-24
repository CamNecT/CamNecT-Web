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
    const code: number | undefined = error.response?.data?.code;
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
    // HTTP 상태만으로 구분할 수 없는 Community 도메인 오류는 코드별 안내를 제공한다.
    } else if (code === 43912) {
      popUpConfig = {
        title: "댓글을 변경할 수 없습니다",
        content: "숨김 또는 삭제된 댓글은 수정하거나 삭제할 수 없습니다.",
      };
    } else if (code === 43925) {
      popUpConfig = {
        title: "게시글에 접근할 수 없습니다",
        content: "숨김 또는 삭제된 게시글입니다.",
      };
    } else if (code === 43928) {
      popUpConfig = {
        title: "채택된 댓글입니다",
        content: "채택된 댓글은 수정하거나 삭제할 수 없습니다.",
      };
    } else if (code === 43929) {
      popUpConfig = {
        title: "채택할 수 없습니다",
        content: "질문 작성자 본인의 댓글은 채택할 수 없습니다.",
      };
    } else if (code === 43930) {
      popUpConfig = {
        title: "익명 여부를 변경할 수 없습니다",
        content: "익명 여부는 게시글 작성 시에만 선택할 수 있습니다.",
      };
    }

    if (popUpConfig) {
      useCommunityErrorPopupStore.getState().setPopUpConfig(popUpConfig);
    }

    return Promise.reject(error);
  },
);
