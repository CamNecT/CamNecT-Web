export type Tab = "ALL" | "INFO" | "QUESTION";

export type Sort = "RECOMMENDED" | "LATEST" | "LIKE" | "BOOKMARK";

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
  author?: {
    userId: number;
    name: string;
    profileImageUrl: string | null;
    studentNo?: string;
    majorName: string;
    yearLevel: number;
  };
  accessType?: "FREE" | "POINT_REQUIRED";
  accessStatus?: "GRANTED" | "LOCKED";
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
  interestTagId?: number;
};

export type CommunityAttachment = {
  fileKey: string;
  thumbnailKey?: string;
  width: number;
  height: number;
  fileSize: number;
};

// 수정 시 첨부파일은 기존 파일(finalKey)과 신규 업로드 파일(tempKey)을 구분해서 전달한다.
export type UpdateCommunityAttachment =
  | {
      finalKey: string;
    }
  | {
      tempKey: string;
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
  title: string;
  content: string;
  anonymous: boolean;
  tagIds: number[];
  attachments: UpdateCommunityAttachment[] | null;
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
  author?: {
    userId: number;
    name: string;
    profileImageUrl: string | null;
    studentNo?: string;
    majorName: string;
    yearLevel: number;
  };
  viewCount: number;
  bookmarkCount: number;
  likeCount: number;
  likedByMe: boolean;
  acceptedCommentId: number | null;
  tagIds: number[];
  accessStatus: "GRANTED" | "LOCKED";
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
  author?: {
    userId: number;
    name: string;
    profileImageUrl?: string | null;
    studentNo?: string;
    majorName?: string;
    yearLevel?: number;
  };
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
  accessStatus: "GRANTED" | "LOCKED";
  remainingPoints: number;
};
