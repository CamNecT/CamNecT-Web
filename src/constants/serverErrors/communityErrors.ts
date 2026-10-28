// Swagger의 Community API 응답 code를 의미별로 관리한다.
// 동일한 code라도 API 동작에 따라 의미가 달라질 수 있으므로 UI 문구 선택은 communityError 유틸에서 action과 함께 판단한다.
export const COMMUNITY_ERROR_CODES = {
  // 공통 요청·인증
  invalidRequest: '40000',
  invalidJwt: '40100',
  invalidAuthHeader: '41103',
  missingTokenType: '41104',
  unsupportedTokenType: '41106',
  unsupportedContentType: '41500',
  concurrencyConflict: '40900',
  internalError: '50000',

  // 목록·검색
  parentCommentPostMismatch: '43030',
  cursorExpired: '43040',
  invalidSearchKeyword: '43041',
  invalidTag: '43060',
  noPostFieldsToUpdate: '43061',
  unsupportedAnonymousPost: '43062',

  // 권한
  commentPermissionDenied: '43310',
  postPermissionDenied: '43320',
  uploadTicketPermissionDenied: '49310',

  // 리소스 조회
  postNotFound: '43410',
  commentNotFound: '43411',
  parentCommentNotFound: '43412',
  boardNotFound: '43420',
  attachmentNotFound: '43430',
  postStatsNotFound: '43510',

  // 게시글·댓글 상태 충돌
  hiddenParentComment: '43910',
  replyDepthExceeded: '43911',
  commentUnavailable: '43912',
  acceptedQuestionDeleteUnavailable: '43920',
  questionBoardRequired: '43921',
  commentPostMismatch: '43922',
  commentAcceptUnavailable: '43923',
  commentAlreadyAccepted: '43924',
  postUnavailable: '43925',
  inactiveTag: '43926',
  ownPostLikeUnavailable: '43927',
  acceptedCommentImmutable: '43928',
  ownCommentAcceptUnavailable: '43929',
  anonymityImmutable: '43930',

  // 포인트
  insufficientPoints: '44101',
  pointWalletUnavailable: '44150',

  // 첨부파일·업로드 티켓
  attachmentContentTypeNotAllowed: '49004',
  attachmentSizeExceeded: '49005',
  attachmentCountExceeded: '49006',
  uploadTicketExpired: '49010',
  uploadFileMismatch: '49011',
  emptyUploadFile: '49020',
  invalidAttachmentMetadata: '49021',
  duplicateAttachmentKey: '49022',
  storedFileNotFound: '49401',
  uploadTicketNotFound: '49410',
  storedFileCheckFailed: '49902',
  storedFileMoveFailed: '49904',
} as const;

// Community Post UI에서 반복 사용하는 사용자 안내 문구다.
// 서버 메시지를 그대로 노출하지 않고 사용자가 다음 행동을 판단할 수 있는 문장만 관리한다.
export const COMMUNITY_ERROR_POPUP_MESSAGES = {
  authenticationRequired: {
    title: '로그인이 필요합니다',
    content: '로그인 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.',
  },
  postNotFound: {
    title: '게시글을 찾을 수 없습니다',
    content: '삭제되었거나 존재하지 않는 게시글입니다.',
  },
  boardNotFound: {
    title: '게시글을 등록할 수 없습니다',
    content: '선택한 게시판을 찾을 수 없습니다. 게시판을 다시 선택해 주세요.',
  },
  postUnavailable: {
    title: '게시글에 접근할 수 없습니다',
    content: '현재 공개 상태가 아닌 게시글입니다.',
  },
  postAccessDenied: {
    title: '게시글을 열람할 수 없습니다',
    content: '이 게시글을 볼 수 있는 권한이 없습니다.',
  },
  postUpdatePermissionDenied: {
    title: '게시글을 수정할 수 없습니다',
    content: '게시글 작성자만 수정할 수 있습니다.',
  },
  postDeletePermissionDenied: {
    title: '게시글을 삭제할 수 없습니다',
    content: '게시글 작성자 또는 관리자만 삭제할 수 있습니다.',
  },
  acceptedQuestionDeleteUnavailable: {
    title: '게시글을 삭제할 수 없습니다',
    content: '댓글이 채택된 질문글은 삭제할 수 없습니다.',
  },
  invalidTag: {
    title: '태그를 확인해 주세요',
    content: '유효하지 않거나 사용할 수 없는 태그가 포함되어 있습니다.',
  },
  noPostFieldsToUpdate: {
    title: '수정할 내용이 없습니다',
    content: '변경한 내용을 확인해 주세요.',
  },
  unsupportedAnonymousPost: {
    title: '게시글을 등록할 수 없습니다',
    content: '현재 게시판에서는 익명 게시글을 지원하지 않습니다.',
  },
  anonymityImmutable: {
    title: '익명 여부를 변경할 수 없습니다',
    content: '익명 여부는 게시글 작성 이후 변경할 수 없습니다.',
  },
  commentNotFound: {
    title: '댓글을 찾을 수 없습니다',
    content: '삭제되었거나 존재하지 않는 댓글입니다.',
  },
  parentCommentNotFound: {
    title: '답글을 등록할 수 없습니다',
    content: '답글을 작성할 대상 댓글을 찾을 수 없습니다.',
  },
  commentPermissionDenied: {
    title: '댓글을 변경할 수 없습니다',
    content: '댓글 작성자만 수정하거나 삭제할 수 있습니다.',
  },
  commentUnavailable: {
    title: '댓글을 변경할 수 없습니다',
    content: '현재 공개 상태가 아닌 댓글입니다.',
  },
  hiddenParentComment: {
    title: '답글을 등록할 수 없습니다',
    content: '숨김 처리된 댓글에는 답글을 작성할 수 없습니다.',
  },
  replyDepthExceeded: {
    title: '답글을 등록할 수 없습니다',
    content: '답글에는 추가 답글을 작성할 수 없습니다.',
  },
  commentPostMismatch: {
    title: '댓글을 처리할 수 없습니다',
    content: '현재 게시글에 속한 댓글이 아닙니다.',
  },
  commentAcceptPermissionDenied: {
    title: '댓글을 채택할 수 없습니다',
    content: '질문글 작성자만 댓글을 채택할 수 있습니다.',
  },
  questionBoardRequired: {
    title: '댓글을 채택할 수 없습니다',
    content: '질문 게시글의 댓글만 채택할 수 있습니다.',
  },
  commentAcceptUnavailable: {
    title: '댓글을 채택할 수 없습니다',
    content: '삭제되거나 숨김 처리된 댓글은 채택할 수 없습니다.',
  },
  commentAlreadyAccepted: {
    title: '이미 채택된 댓글이 있습니다',
    content: '하나의 질문글에서는 댓글 하나만 채택할 수 있습니다.',
  },
  acceptedCommentImmutable: {
    title: '채택된 댓글입니다',
    content: '채택된 댓글은 수정하거나 삭제할 수 없습니다.',
  },
  ownCommentAcceptUnavailable: {
    title: '댓글을 채택할 수 없습니다',
    content: '질문 작성자 본인의 댓글은 채택할 수 없습니다.',
  },
  ownPostLikeUnavailable: {
    title: '좋아요를 누를 수 없습니다',
    content: '본인이 작성한 게시글에는 좋아요를 누를 수 없습니다.',
  },
  insufficientPoints: {
    title: '포인트가 부족합니다',
    content: '게시글 열람에 필요한 포인트를 확인해 주세요.',
  },
  pointConflict: {
    title: '포인트 상태가 변경되었습니다',
    content: '최신 포인트 정보를 확인한 뒤 다시 시도해 주세요.',
  },
  pointWalletUnavailable: {
    title: '포인트를 처리하지 못했습니다',
    content: '잠시 후 다시 시도해 주세요.',
  },
  attachmentInvalid: {
    title: '첨부파일을 확인해 주세요',
    content: '첨부파일 형식, 크기 또는 파일 정보를 다시 확인해 주세요.',
  },
  attachmentCountExceeded: {
    title: '첨부파일을 추가할 수 없습니다',
    content: '업로드 가능한 첨부파일 개수를 초과했습니다.',
  },
  uploadTicketUnavailable: {
    title: '첨부파일을 등록하지 못했습니다',
    content: '업로드 정보가 만료되었거나 올바르지 않습니다. 파일을 다시 선택해 주세요.',
  },
  uploadPermissionDenied: {
    title: '첨부파일을 등록할 수 없습니다',
    content: '현재 사용자의 업로드 정보가 아닙니다. 파일을 다시 선택해 주세요.',
  },
  storedFileUnavailable: {
    title: '첨부파일을 처리하지 못했습니다',
    content: '저장된 파일을 확인할 수 없습니다. 파일을 다시 선택해 주세요.',
  },
  unsupportedContentType: {
    title: '요청 형식을 처리할 수 없습니다',
    content: '화면을 새로고침한 뒤 다시 시도해 주세요.',
  },
  concurrencyConflict: {
    title: '요청 상태가 변경되었습니다',
    content: '최신 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  network: {
    title: '요청을 처리하지 못했습니다',
    content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  },
  internal: {
    title: '요청을 처리하지 못했습니다',
    content: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  },
} as const;
