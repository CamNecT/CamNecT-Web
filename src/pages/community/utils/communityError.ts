import {
  COMMUNITY_ERROR_CODES,
  COMMUNITY_ERROR_POPUP_MESSAGES,
} from '../../../constants/serverErrors/communityErrors';

export type CommunityErrorAction =
  | 'postDetail'
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
  postDetail: {
    title: '게시글을 불러오지 못했습니다',
    content: '게시글 상태를 확인한 뒤 다시 시도해 주세요.',
  },
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

const SHARED_CODE_POPUP_MESSAGES: Partial<
  Record<string, CommunityErrorPopupConfig>
> = {
  [COMMUNITY_ERROR_CODES.invalidJwt]:
    COMMUNITY_ERROR_POPUP_MESSAGES.authenticationRequired,
  [COMMUNITY_ERROR_CODES.invalidAuthHeader]:
    COMMUNITY_ERROR_POPUP_MESSAGES.authenticationRequired,
  [COMMUNITY_ERROR_CODES.missingTokenType]:
    COMMUNITY_ERROR_POPUP_MESSAGES.authenticationRequired,
  [COMMUNITY_ERROR_CODES.unsupportedTokenType]:
    COMMUNITY_ERROR_POPUP_MESSAGES.authenticationRequired,
  [COMMUNITY_ERROR_CODES.unsupportedContentType]:
    COMMUNITY_ERROR_POPUP_MESSAGES.unsupportedContentType,
  [COMMUNITY_ERROR_CODES.concurrencyConflict]:
    COMMUNITY_ERROR_POPUP_MESSAGES.concurrencyConflict,
  [COMMUNITY_ERROR_CODES.internalError]:
    COMMUNITY_ERROR_POPUP_MESSAGES.internal,
  [COMMUNITY_ERROR_CODES.postNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.postNotFound,
  [COMMUNITY_ERROR_CODES.boardNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.boardNotFound,
  [COMMUNITY_ERROR_CODES.postStatsNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.internal,
  [COMMUNITY_ERROR_CODES.postUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.postUnavailable,
  [COMMUNITY_ERROR_CODES.commentPermissionDenied]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentPermissionDenied,
  [COMMUNITY_ERROR_CODES.commentNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentNotFound,
  [COMMUNITY_ERROR_CODES.parentCommentNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.parentCommentNotFound,
  [COMMUNITY_ERROR_CODES.parentCommentPostMismatch]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentPostMismatch,
  [COMMUNITY_ERROR_CODES.hiddenParentComment]:
    COMMUNITY_ERROR_POPUP_MESSAGES.hiddenParentComment,
  [COMMUNITY_ERROR_CODES.replyDepthExceeded]:
    COMMUNITY_ERROR_POPUP_MESSAGES.replyDepthExceeded,
  [COMMUNITY_ERROR_CODES.commentUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentUnavailable,
  [COMMUNITY_ERROR_CODES.acceptedQuestionDeleteUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.acceptedQuestionDeleteUnavailable,
  [COMMUNITY_ERROR_CODES.questionBoardRequired]:
    COMMUNITY_ERROR_POPUP_MESSAGES.questionBoardRequired,
  [COMMUNITY_ERROR_CODES.commentPostMismatch]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentPostMismatch,
  [COMMUNITY_ERROR_CODES.commentAcceptUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentAcceptUnavailable,
  [COMMUNITY_ERROR_CODES.commentAlreadyAccepted]:
    COMMUNITY_ERROR_POPUP_MESSAGES.commentAlreadyAccepted,
  [COMMUNITY_ERROR_CODES.inactiveTag]:
    COMMUNITY_ERROR_POPUP_MESSAGES.invalidTag,
  [COMMUNITY_ERROR_CODES.invalidTag]:
    COMMUNITY_ERROR_POPUP_MESSAGES.invalidTag,
  [COMMUNITY_ERROR_CODES.noPostFieldsToUpdate]:
    COMMUNITY_ERROR_POPUP_MESSAGES.noPostFieldsToUpdate,
  [COMMUNITY_ERROR_CODES.unsupportedAnonymousPost]:
    COMMUNITY_ERROR_POPUP_MESSAGES.unsupportedAnonymousPost,
  [COMMUNITY_ERROR_CODES.ownPostLikeUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.ownPostLikeUnavailable,
  [COMMUNITY_ERROR_CODES.acceptedCommentImmutable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.acceptedCommentImmutable,
  [COMMUNITY_ERROR_CODES.ownCommentAcceptUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.ownCommentAcceptUnavailable,
  [COMMUNITY_ERROR_CODES.anonymityImmutable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.anonymityImmutable,
  [COMMUNITY_ERROR_CODES.insufficientPoints]:
    COMMUNITY_ERROR_POPUP_MESSAGES.insufficientPoints,
  [COMMUNITY_ERROR_CODES.pointWalletUnavailable]:
    COMMUNITY_ERROR_POPUP_MESSAGES.pointWalletUnavailable,
  [COMMUNITY_ERROR_CODES.attachmentContentTypeNotAllowed]:
    COMMUNITY_ERROR_POPUP_MESSAGES.attachmentInvalid,
  [COMMUNITY_ERROR_CODES.attachmentSizeExceeded]:
    COMMUNITY_ERROR_POPUP_MESSAGES.attachmentInvalid,
  [COMMUNITY_ERROR_CODES.emptyUploadFile]:
    COMMUNITY_ERROR_POPUP_MESSAGES.attachmentInvalid,
  [COMMUNITY_ERROR_CODES.invalidAttachmentMetadata]:
    COMMUNITY_ERROR_POPUP_MESSAGES.attachmentInvalid,
  [COMMUNITY_ERROR_CODES.duplicateAttachmentKey]:
    COMMUNITY_ERROR_POPUP_MESSAGES.attachmentInvalid,
  [COMMUNITY_ERROR_CODES.attachmentCountExceeded]:
    COMMUNITY_ERROR_POPUP_MESSAGES.attachmentCountExceeded,
  [COMMUNITY_ERROR_CODES.uploadTicketExpired]:
    COMMUNITY_ERROR_POPUP_MESSAGES.uploadTicketUnavailable,
  [COMMUNITY_ERROR_CODES.uploadFileMismatch]:
    COMMUNITY_ERROR_POPUP_MESSAGES.uploadTicketUnavailable,
  [COMMUNITY_ERROR_CODES.uploadTicketNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.uploadTicketUnavailable,
  [COMMUNITY_ERROR_CODES.uploadTicketPermissionDenied]:
    COMMUNITY_ERROR_POPUP_MESSAGES.uploadPermissionDenied,
  [COMMUNITY_ERROR_CODES.storedFileNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.storedFileUnavailable,
  [COMMUNITY_ERROR_CODES.attachmentNotFound]:
    COMMUNITY_ERROR_POPUP_MESSAGES.storedFileUnavailable,
  [COMMUNITY_ERROR_CODES.storedFileCheckFailed]:
    COMMUNITY_ERROR_POPUP_MESSAGES.storedFileUnavailable,
  [COMMUNITY_ERROR_CODES.storedFileMoveFailed]:
    COMMUNITY_ERROR_POPUP_MESSAGES.storedFileUnavailable,
};

// 43320은 댓글 열람, 게시글 수정·삭제, 댓글 채택에서 의미가 서로 다르다.
// status나 code 하나만으로 문구를 결정하지 않고 사용자가 수행하던 동작을 함께 사용한다.
const ACTION_CODE_POPUP_MESSAGES: Partial<
  Record<
    CommunityErrorAction,
    Partial<Record<string, CommunityErrorPopupConfig>>
  >
> = {
  postUpdate: {
    [COMMUNITY_ERROR_CODES.postPermissionDenied]:
      COMMUNITY_ERROR_POPUP_MESSAGES.postUpdatePermissionDenied,
  },
  postDelete: {
    [COMMUNITY_ERROR_CODES.postPermissionDenied]:
      COMMUNITY_ERROR_POPUP_MESSAGES.postDeletePermissionDenied,
  },
  commentList: {
    [COMMUNITY_ERROR_CODES.postPermissionDenied]:
      COMMUNITY_ERROR_POPUP_MESSAGES.postAccessDenied,
  },
  commentCreate: {
    [COMMUNITY_ERROR_CODES.postPermissionDenied]:
      COMMUNITY_ERROR_POPUP_MESSAGES.postAccessDenied,
  },
  commentAccept: {
    [COMMUNITY_ERROR_CODES.postPermissionDenied]:
      COMMUNITY_ERROR_POPUP_MESSAGES.commentAcceptPermissionDenied,
  },
};

type GetCommunityErrorPopupConfigParams = {
  action: CommunityErrorAction;
  status?: number;
  errorCode?: string;
  isNetworkError?: boolean;
};

// 동일한 HTTP 상태라도 수행하던 작업에 따라 안내가 달라야 하므로
// 도메인 코드 안내를 우선하고 나머지는 작업별 문구로 처리한다.
export const getCommunityErrorPopupConfig = ({
  action,
  status,
  errorCode,
  isNetworkError = false,
}: GetCommunityErrorPopupConfigParams): CommunityErrorPopupConfig => {
  if (errorCode) {
    const actionMessage = ACTION_CODE_POPUP_MESSAGES[action]?.[errorCode];
    if (actionMessage) return actionMessage;

    const sharedMessage = SHARED_CODE_POPUP_MESSAGES[errorCode];
    if (sharedMessage) return sharedMessage;
  }

  const fallback = ACTION_FALLBACK_MESSAGES[action];

  if (isNetworkError) {
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
