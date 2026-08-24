import { communityAxiosInstance } from "./communityAxiosInstance";
import type {
  ApiResponse,
  CommunityPostItem,
  CommunityHomeData,
  CursorPage,
  GetCommunityHomeParams,
  GetCommunityPostsParams,
  CreateCommunityPostBody,
  CreateCommunityPostResult,
  PostBookmarkResult,
  PostLikeResult,
  PostReactionParams,
  CommunityPostDetailResponse,
  GetCommunityPostDetailParams,
  CreateCommunityCommentBody,
  CreateCommunityCommentParams,
  CreateCommunityCommentResult,
  DeleteCommunityCommentParams,
  DeleteCommunityCommentResult,
  UpdateCommunityCommentParams,
  UpdateCommunityCommentBody,
  UpdateCommunityCommentResult,
  AcceptCommunityCommentParams,
  AcceptCommunityCommentResult,
  PurchasePostAccessParams,
  PurchasePostAccessResult,
  DeleteCommunityPostParams,
  DeleteCommunityPostResult,
  UpdateCommunityPostBody,
  UpdateCommunityPostParams,
  UpdateCommunityPostResult,
  CommunityUploadPresignRequest,
  CommunityUploadPresignResponse,
  CommunityCommentCursorPage,
} from "../api-types/communityApiTypes";

const DEFAULT_TAB = "ALL";
const DEFAULT_SORT = "RECOMMENDED";
const DEFAULT_SIZE = 20;

export const getCommunityPosts = async (
  data: GetCommunityPostsParams,
  // 검색 조건이 바뀌면 호출부에서 이전 요청을 실제로 취소할 수 있도록 signal을 전달한다.
  options?: { signal?: AbortSignal },
) => {
  const {
    userId,
    tab,
    sort,
    size,
    tagId,
    keyword,
    cursorId,
    cursorValue,
  } = data;

  const queryParams: GetCommunityPostsParams = {
    userId,
    tab: tab ?? DEFAULT_TAB,
    sort: sort ?? DEFAULT_SORT,
    size: size ?? DEFAULT_SIZE,
    ...(tagId !== undefined ? { tagId } : {}),
    ...(keyword !== undefined ? { keyword } : {}),
    ...(cursorId !== undefined ? { cursorId } : {}),
    ...(cursorValue !== undefined ? { cursorValue } : {}),
  };

  const response = await communityAxiosInstance.get<ApiResponse<CursorPage<CommunityPostItem>>>(
    "/api/community/posts",
    { params: queryParams, signal: options?.signal }
  );
  return response.data;
};

export const getCommunityHome = async (data: GetCommunityHomeParams) => {
  const response = await communityAxiosInstance.get<ApiResponse<CommunityHomeData>>(
    "/api/community/home",
    { params: data }
  );

  return response.data;
};

export const createCommunityPost = async (data: {
  // 운영 API가 작성자 식별용 userId 쿼리를 요구하므로 본문과 분리해 전달한다.
  params: { userId: number | string };
  body: CreateCommunityPostBody;
}) => {
  const response = await communityAxiosInstance.post<ApiResponse<CreateCommunityPostResult>>(
    "/api/community/posts",
    data.body,
    { params: data.params },
  );

  return response.data;
};

export const postCommunityLike = async (
  postId: number | string,
  params: PostReactionParams
 ) => {
  const response = await communityAxiosInstance.post<ApiResponse<PostLikeResult>>(
    `/api/community/posts/${postId}/likes`,
    null,
    { params }
  );

  return response.data;
};

export const postCommunityBookmark = async (
  postId: number | string,
  params: PostReactionParams
 ) => {
  const response = await communityAxiosInstance.post<ApiResponse<PostBookmarkResult>>(
    `/api/community/posts/${postId}/bookmarks`,
    null,
    { params }
  );

  return response.data;
};

export const getCommunityPostDetail = async (data: {
  postId: number | string;
  params: GetCommunityPostDetailParams;
}) => {
  const response = await communityAxiosInstance.get<ApiResponse<CommunityPostDetailResponse>>(
    `/api/community/posts/${data.postId}`,
    { params: data.params }
  );

  return response.data;
};

export const getCommunityPostComments = async (data: {
  postId: number | string;
  params?: { cursorId?: number; size?: number };
}) => {
  // 댓글은 전체 배열이 아니라 루트 스레드 기준 커서 페이지로 조회한다.
  const response = await communityAxiosInstance.get<ApiResponse<CommunityCommentCursorPage>>(
    `/api/community/posts/${data.postId}/comments`,
    { params: data.params },
  );

  return response.data;
};

export const createCommunityComment = async (data: {
  postId: number | string;
  params: CreateCommunityCommentParams;
  body: CreateCommunityCommentBody;
}) => {
  const response = await communityAxiosInstance.post<ApiResponse<CreateCommunityCommentResult>>(
    `/api/community/posts/${data.postId}/comments`,
    data.body,
    { params: data.params }
  );

  return response.data;
};

export const deleteCommunityComment = async (data: {
  commentId: number | string;
  params: DeleteCommunityCommentParams;
}) => {
  const response = await communityAxiosInstance.delete<ApiResponse<DeleteCommunityCommentResult>>(
    `/api/community/comments/${data.commentId}`,
    { params: data.params }
  );

  return response.data;
};

export const updateCommunityComment = async (data: {
  commentId: number | string;
  params: UpdateCommunityCommentParams;
  body: UpdateCommunityCommentBody;
}) => {
  const response = await communityAxiosInstance.patch<ApiResponse<UpdateCommunityCommentResult>>(
    `/api/community/comments/${data.commentId}`,
    data.body,
    { params: data.params }
  );

  return response.data;
};

export const acceptCommunityComment = async (data: {
  postId: number | string;
  commentId: number | string;
  params: AcceptCommunityCommentParams;
}) => {
  const response = await communityAxiosInstance.post<ApiResponse<AcceptCommunityCommentResult>>(
    `/api/community/posts/${data.postId}/comments/${data.commentId}/accept`,
    null,
    { params: data.params }
  );

  return response.data;
};

export const purchaseCommunityPostAccess = async (data: {
  postId: number | string;
  params: PurchasePostAccessParams;
}) => {
  const response = await communityAxiosInstance.post<ApiResponse<PurchasePostAccessResult>>(
    `/api/community/posts/${data.postId}/access/purchase`,
    null,
    { params: data.params }
  );

  return response.data;
};

export const deleteCommunityPost = async (data: {
  postId: number | string;
  params: DeleteCommunityPostParams;
}) => {
  const response = await communityAxiosInstance.delete<ApiResponse<DeleteCommunityPostResult>>(
    `/api/community/posts/${data.postId}`,
    { params: data.params }
  );

  return response.data;
};

export const updateCommunityPost = async (data: {
  postId: number | string;
  params: UpdateCommunityPostParams;
  body: UpdateCommunityPostBody;
}) => {
  const response = await communityAxiosInstance.patch<ApiResponse<UpdateCommunityPostResult>>(
    `/api/community/posts/${data.postId}`,
    data.body,
    { params: data.params }
  );

  return response.data;
};

export const postCommunityUploadPresign = async (data: {
  params: { userId: number | string };
  body: CommunityUploadPresignRequest;
}) => {
  const response = await communityAxiosInstance.post<ApiResponse<CommunityUploadPresignResponse>>(
    "/api/community/posts/uploads/presign",
    data.body,
    { params: data.params },
  );

  return response.data;
};
