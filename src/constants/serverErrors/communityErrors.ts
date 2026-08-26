// Community 도메인 API 응답 code 값 모음
export const COMMUNITY_ERROR_CODES = {
  commentUnavailable: '43912',
  postUnavailable: '43925',
  ownPostLikeUnavailable: '43927',
  acceptedCommentImmutable: '43928',
  ownCommentAcceptUnavailable: '43929',
  anonymityImmutable: '43930',
  cursorExpired: '43040',
  invalidSearchKeyword: '43041',
  invalidTag: '43060',
  invalidAttachment: '49021',
  expiredAttachment: '49022',
} as const;

// 여러 커뮤니티 동작에서 반복되는 도메인 오류 안내
export const COMMUNITY_ERROR_POPUP_MESSAGES = {
  commentUnavailable: {
    title: '댓글을 변경할 수 없습니다',
    content: '숨김 또는 삭제된 댓글은 수정하거나 삭제할 수 없습니다.',
  },
  postUnavailable: {
    title: '게시글에 접근할 수 없습니다',
    content: '숨김 또는 삭제된 게시글입니다.',
  },
  acceptedCommentImmutable: {
    title: '채택된 댓글입니다',
    content: '채택된 댓글은 수정하거나 삭제할 수 없습니다.',
  },
  ownCommentAcceptUnavailable: {
    title: '채택할 수 없습니다',
    content: '질문 작성자 본인의 댓글은 채택할 수 없습니다.',
  },
  anonymityImmutable: {
    title: '익명 여부를 변경할 수 없습니다',
    content: '익명 여부는 게시글 작성 시에만 선택할 수 있습니다.',
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
