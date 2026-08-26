import {
  COMMUNITY_ERROR_CODES,
  COMMUNITY_ERROR_POPUP_MESSAGES,
} from '../../../constants/serverErrors/communityErrors';

export type CommunityErrorAction =
  | 'postCreate'
  | 'postUpdate'
  | 'postDelete'
  | 'postEditLoad'
  | 'commentList'
  | 'commentCreate'
  | 'commentUpdate'
  | 'commentDelete'
  | 'commentAccept'
  | 'postPurchase'
  | 'like'
  | 'bookmark';

export type CommunityErrorPopupConfig = {
  title: string;
  content: string;
};

const ACTION_FALLBACK_MESSAGES: Record<
  CommunityErrorAction,
  CommunityErrorPopupConfig
> = {
  postCreate: {
    title: '게시글을 등록하지 못했습니다',
    content: '입력한 내용을 확인한 뒤 다시 시도해 주세요.',
  },
  postUpdate: {
    title: '게시글을 수정하지 못했습니다',
    content: '입력한 내용을 확인한 뒤 다시 시도해 주세요.',
  },
  postDelete: {
    title: '게시글을 삭제하지 못했습니다',
    content: '게시글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  postEditLoad: {
    title: '게시글을 불러오지 못했습니다',
    content: '게시글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  commentList: {
    title: '댓글을 불러오지 못했습니다',
    content: '잠시 후 다시 시도해 주세요.',
  },
  commentCreate: {
    title: '댓글을 등록하지 못했습니다',
    content: '댓글 내용을 확인한 뒤 다시 시도해 주세요.',
  },
  commentUpdate: {
    title: '댓글을 수정하지 못했습니다',
    content: '댓글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  commentDelete: {
    title: '댓글을 삭제하지 못했습니다',
    content: '댓글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  commentAccept: {
    title: '댓글을 채택하지 못했습니다',
    content: '댓글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  postPurchase: {
    title: '게시글을 구매하지 못했습니다',
    content: '포인트와 게시글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  like: {
    title: '좋아요를 반영하지 못했습니다',
    content: '잠시 후 다시 시도해 주세요.',
  },
  bookmark: {
    title: '북마크를 반영하지 못했습니다',
    content: '잠시 후 다시 시도해 주세요.',
  },
};

const CODE_POPUP_MESSAGES: Partial<
  Record<string, CommunityErrorPopupConfig>
> = {
  [COMMUNITY_ERROR_CODES.commentUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentUnavailable,
  [COMMUNITY_ERROR_CODES.postUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.postUnavailable,
  [COMMUNITY_ERROR_CODES.acceptedCommentImmutable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.acceptedCommentImmutable,
  [COMMUNITY_ERROR_CODES.ownCommentAcceptUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.ownCommentAcceptUnavailable,
  [COMMUNITY_ERROR_CODES.anonymityImmutable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.anonymityImmutable,
};

type GetCommunityErrorPopupConfigParams = {
  action: CommunityErrorAction;
  status?: number;
  errorCode?: string;
};

// 동일한 HTTP 상태라도 수행하던 작업에 따라 안내가 달라야 하므로
// 도메인 코드 안내를 우선하고 나머지는 작업별 문구로 처리한다.
export const getCommunityErrorPopupConfig = ({
  action,
  status,
  errorCode,
}: GetCommunityErrorPopupConfigParams): CommunityErrorPopupConfig => {
  if (errorCode && CODE_POPUP_MESSAGES[errorCode]) {
    return CODE_POPUP_MESSAGES[errorCode];
  }

  const fallback = ACTION_FALLBACK_MESSAGES[action];

  if (status === undefined) {
    return {
      title: fallback.title,
      content: COMMUNITY_ERROR_POPUP_MESSAGES.network.content,
    };
  }

  if (status === 500) {
    return {
      title: fallback.title,
      content: COMMUNITY_ERROR_POPUP_MESSAGES.internal.content,
    };
  }

  return fallback;
};
