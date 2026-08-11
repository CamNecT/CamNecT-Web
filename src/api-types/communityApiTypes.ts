export type Tab = "ALL" | "INFO" | "QUESTION";

export type Sort = "RECOMMENDED" | "LATEST" | "LIKE" | "BOOKMARK";

// 화면 잠금 여부는 accessType이 아니라 현재 사용자의 실제 열람 상태로 판단한다.
export type CommunityAccessStatus =
  | "GRANTED"
  | "NEED_PURCHASE"
  | "INSUFFICIENT_POINTS"
  | "LOGIN_REQUIRED";

export type CommunityAuthor = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  studentNo?: string;
  majorName: string;
  yearLevel: number;
};

export type CommunityPostItem = {
  postId: number;
  boardCode: "INFO" | "QUESTION";
  title: string;
  preview: string;
  createdAt: string;
  likeCount: number;
  answerCount: number;
  commentCount: number;
  bookmarkCount: number;
  accepted?: boolean;
  acceptedBadge?: boolean;
  tags: string[];
  thumbnailUrl?: string | null;
  // 익명 게시글은 작성자 정보가 내려오지 않는다.
  author: CommunityAuthor | null;
  accessType?: "FREE" | "POINT_REQUIRED";
  accessStatus?: CommunityAccessStatus;
  requiredPoints?: number;
  myPoints?: number;
};

export type CursorPage<T> = {
  items: T[];
  nextCursorId: number | null;
  nextCursorValue: number | null;
  hasNext: boolean;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type GetCommunityPostsParams = {
  // 운영 Swagger 기준 목록 조회에도 현재 사용자 ID가 필요하다.
  userId: number | string;
  tab?: Tab;
  sort?: Sort;
  tagId?: number;
  keyword?: string;
  cursorId?: number;
  cursorValue?: number;
  size?: number;
};

export type CommunityHomeData = {
  tagId?: number;
  tagName?: string;
  recommendedByTag?: CommunityPostItem[];
  interestTagId?: number;
  recommendedByInterest?: CommunityPostItem[];
  waitingQuestions: CommunityPostItem[];
};

export type GetCommunityHomeParams = {
  userId: number | string;
};

export type CommunityAttachment = {
  fileKey: string;
  thumbnailKey?: string;
  // 이미지일 때만 width와 height를 한 쌍으로 전달하고 PDF는 둘 다 생략한다.
  width?: number;
  height?: number;
  fileSize: number;
};

export type CommunityUploadPresignItemRequest = {
  contentType: string;
  size: number;
  originalFilename: string;
};

export type CommunityUploadPresignRequest = {
  items: CommunityUploadPresignItemRequest[];
};

export type CommunityUploadPresignItemResponse = {
  fileKey: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders?: Record<string, string>;
};

export type CommunityUploadPresignResponse = {
  items: CommunityUploadPresignItemResponse[];
};

export type CreateCommunityPostBody = {
  boardCode: "INFO" | "QUESTION";
  title: string;
  content: string;
  anonymous: boolean;
  tagIds: number[];
  attachments: CommunityAttachment[];
  accessType?: "FREE" | "POINT_REQUIRED";
  requiredPoints?: number;
};

export type CreateCommunityPostResult = {
  postId: number;
};

export type PostReactionParams = {
  userId: number | string;
};

export type PostLikeResult = {
  liked: boolean;
  likeCount: number;
};

export type PostBookmarkResult = {
  postId: number;
  bookmarked: boolean;
  bookmarkCount: number;
};

export type DeleteCommunityPostParams = {
  userId: number | string;
};

export type DeleteCommunityPostResult = string;

export type UpdateCommunityPostParams = {
  userId: number | string;
};

export type UpdateCommunityPostBody = {
  // PATCH는 변경된 필드만 포함하며 anonymous는 작성 이후 변경할 수 없다.
  title?: string | null;
  content?: string | null;
  tagIds?: number[] | null;
  attachments?: CommunityAttachment[] | null;
};

export type UpdateCommunityPostResult = string;

export type CommunityPostDetailResponse = {
  postId: number;
  boardCode: "INFO" | "QUESTION";
  title: string;
  content: string;
  anonymous: boolean;
  authorId: number;
  createdAt: string;
  bookmarked?: boolean;
  attachments?: {
    attachmentId: number;
    sortOrder: number;
    fileKey: string;
    downloadUrl: string;
    width: number;
    height: number;
    fileSize: number;
  }[];
  // 익명 상세 응답에서도 프로필을 강제로 만들지 않도록 null을 유지한다.
  author: CommunityAuthor | null;
  viewCount: number;
  bookmarkCount: number;
  likeCount: number;
  likedByMe: boolean;
  acceptedCommentId: number | null;
  tagIds: number[];
  accessStatus: CommunityAccessStatus;
  requiredPoints: number;
  myPoints: number;
};

export type GetCommunityPostDetailParams = {
  userId: number | string;
};

export type CommunityPostCommentResponse = {
  commentId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  likeCount: number;
  createdAt: string;
  // 삭제 댓글은 신고·운영 이력을 위해 userId가 남아도 author는 null일 수 있다.
  author: {
    userId: number;
    name: string;
    profileImageUrl?: string | null;
    studentNo?: string;
    majorName?: string;
    yearLevel?: number;
  } | null;
};

export type CommunityCommentCursorPage = {
  // size는 배열 길이가 아니라 한 페이지의 루트 댓글 스레드 수를 의미한다.
  items: CommunityPostCommentResponse[];
  nextCursorId: number | null;
  hasNext: boolean;
};

export type CreateCommunityCommentParams = {
  userId: number | string;
};

export type CreateCommunityCommentBody = {
  content: string;
  parentCommentId: number | null;
};

export type CreateCommunityCommentResult = {
  commentId: number;
};

export type DeleteCommunityCommentParams = {
  userId: number | string;
};

export type DeleteCommunityCommentResult = string;

export type UpdateCommunityCommentParams = {
  userId: number | string;
};

export type UpdateCommunityCommentBody = {
  content: string;
};

export type UpdateCommunityCommentResult = string;

export type AcceptCommunityCommentParams = {
  userId: number | string;
};

export type AcceptCommunityCommentResult = string;

export type PurchasePostAccessParams = {
  userId: number | string;
};

export type PurchasePostAccessResult = {
  postId: number;
  accessStatus: CommunityAccessStatus;
  remainingPoints: number;
};

export type ValidationFieldError = {
  field: string;
  message: string;
};

export type CommunityErrorResponse = {
  status: number;
  code: number;
  message: string;
  errors?: ValidationFieldError[];
};
