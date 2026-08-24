import axios from "axios";
import { useCommunityErrorPopupStore } from "../../store/useCommunityErrorPopupStore";

type CommunityErrorResponse = {
  code?: number;
};

type CommunityPopupConfig = {
  title: string;
  content: string;
};

const COMMUNITY_ERROR_POPUPS: Record<number, CommunityPopupConfig> = {
  43912: {
    title: "댓글을 변경할 수 없습니다",
    content: "숨김 또는 삭제된 댓글은 수정하거나 삭제할 수 없습니다.",
  },
  43925: {
    title: "게시글에 접근할 수 없습니다",
    content: "숨김 또는 삭제된 게시글입니다.",
  },
  43928: {
    title: "채택된 댓글입니다",
    content: "채택된 댓글은 수정하거나 삭제할 수 없습니다.",
  },
  43929: {
    title: "채택할 수 없습니다",
    content: "질문 작성자 본인의 댓글은 채택할 수 없습니다.",
  },
  43930: {
    title: "익명 여부를 변경할 수 없습니다",
    content: "익명 여부는 게시글 작성 시에만 선택할 수 있습니다.",
  },
};

const getStatusPopup = (status?: number): CommunityPopupConfig | undefined => {
  if (status === 403) {
    return {
      title: "접근 권한이 없습니다",
      content:
        "요청하신 페이지를 볼 수 있는 권한이 없어요.\n관리자에게 문의하시거나 권한을 확인해 주세요.",
    };
  }

  if (status === 404) {
    return {
      title: "페이지를 찾을 수 없습니다",
      content:
        "요청하신 페이지는 존재하지 않는 주소입니다.\n주소를 다시 한번 확인해 주세요.",
    };
  }

  if (status === 500) {
    return {
      title: "시스템 오류가 발생했습니다",
      content:
        "서비스 이용에 불편을 드려 죄송합니다.\n잠시 후 다시 시도해 주세요.",
    };
  }
};

export const handleCommunityError = (error: unknown) => {
  if (!axios.isAxiosError<CommunityErrorResponse>(error)) {
    return Promise.reject(error);
  }

  const url = error.config?.url;
  if (!url?.includes("/api/community")) {
    return Promise.reject(error);
  }

  const statusPopup = getStatusPopup(error.response?.status);
  const code = error.response?.data?.code;

  // 상태 코드 안내를 우선 적용하고, 해당하지 않을 때만 커뮤니티 전용 코드를 확인한다.
  const popUpConfig = statusPopup ?? (code ? COMMUNITY_ERROR_POPUPS[code] : undefined);
  if (popUpConfig) {
    useCommunityErrorPopupStore.getState().setPopUpConfig(popUpConfig);
  }

  return Promise.reject(error);
};
