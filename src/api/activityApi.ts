import type {
  ActivityListRequest,
  ActivityListResponse,
  ActivityCreateRequest,
  ActivityCreateResponse,
  ActivityAdminCreateRequest,
  ActivityAdminCreateResponse,
  ActivityDetailResponse,
  ActivityUpdateRequest,
  ActivityUpdateResponse,
  ActivityAdminUpdateRequest,
  ActivityAdminUpdateResponse,
  ActivityDeleteResponse,
  ActivityCloseResponse,
  ActivityBookmarkResponse,
  ThumbnailPresignRequest,
  ThumbnailPresignResponse,
  AttachmentPresignRequest,
  AttachmentPresignResponse,
  TagListResponse,
  TagScope,
  RecruitmentCreateRequest,
  RecruitmentCreateResponse,
  RecruitmentUpdateRequest,
  RecruitmentUpdateResponse,
  RecruitmentDetailResponse,
  RecruitmentCloseResponse,
  RecruitmentBookmarkResponse,
  RecruitmentApplyRequest,
  RecruitmentApplyResponse,
  ActivityCommentListResponse,
  ActivityCommentCreateRequest,
  ActivityCommentCreateResponse,
  ActivityCommentUpdateRequest,
  ActivityCommentMutationResponse,
} from '../api-types/activityApiTypes';
import { axiosInstance } from './axiosInstance';

// 대외활동 목록 조회 [GET] (/api/activity)
export const getActivityList = async (params: ActivityListRequest): Promise<ActivityListResponse> => {
  const response = await axiosInstance.get<ActivityListResponse>('/api/activity', {
    params: {
      userId: params.userId,
      category: params.category,
      tagIds: params.tagIds,
      title: params.title,
      sortType: params.sortType ?? 'LATEST',
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
    paramsSerializer: (p) => {
      const searchParams = new URLSearchParams();
      Object.entries(p).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      });
      return searchParams.toString();
    },
  });
  return response.data;
};

// 대외활동 등록 [POST] (/api/activity)
export const createActivity = async (
  userId: number,
  data: ActivityCreateRequest,
): Promise<ActivityCreateResponse> => {
  const response = await axiosInstance.post<ActivityCreateResponse>('/api/activity', data, {
    params: { userId },
  });
  return response.data;
};

// 대외활동/취업정보 등록 (관리자) [POST] (/api/activity/admin)
export const createAdminActivity = async (
  adminId: number,
  data: ActivityAdminCreateRequest,
): Promise<ActivityAdminCreateResponse> => {
  const response = await axiosInstance.post<ActivityAdminCreateResponse>(
    '/api/activity/admin',
    data,
    { params: { adminId } },
  );
  return response.data;
};

// 대외활동 상세 조회 [GET] (/api/activity/{activityId})
export const getActivityDetail = async (
  userId: number,
  activityId: number,
): Promise<ActivityDetailResponse> => {
  const response = await axiosInstance.get<ActivityDetailResponse>(
    `/api/activity/${activityId}`,
    { params: { userId } },
  );
  return response.data;
};

// 대외활동 수정 [PATCH] (/api/activity/{activityId})
export const updateActivity = async (
  userId: number,
  activityId: number,
  data: ActivityUpdateRequest,
): Promise<ActivityUpdateResponse> => {
  const response = await axiosInstance.patch<ActivityUpdateResponse>(
    `/api/activity/${activityId}`,
    data,
    { params: { userId } },
  );
  return response.data;
};

// 대외활동/취업정보 수정 (관리자) [PATCH] (/api/activity/admin/{activityId})
export const updateAdminActivity = async (
  adminId: number,
  activityId: number,
  data: ActivityAdminUpdateRequest,
): Promise<ActivityAdminUpdateResponse> => {
  const response = await axiosInstance.patch<ActivityAdminUpdateResponse>(
    `/api/activity/admin/${activityId}`,
    data,
    { params: { adminId } },
  );
  return response.data;
};

// 대외활동 삭제 [DELETE] (/api/activity/{activityId})
export const deleteActivity = async (
  userId: number,
  activityId: number,
): Promise<ActivityDeleteResponse> => {
  const response = await axiosInstance.delete<ActivityDeleteResponse>(
    `/api/activity/${activityId}`,
    { params: { userId } },
  );
  return response.data;
};

// 대외활동 모집 중지 [PATCH] (/api/activity/{activityId}/close)
export const closeActivity = async (
  userId: number,
  activityId: number,
): Promise<ActivityCloseResponse> => {
  const response = await axiosInstance.patch<ActivityCloseResponse>(
    `/api/activity/${activityId}/close`,
    null,
    { params: { userId } },
  );
  return response.data;
};

// 대외활동/취업정보 모집 중지 (관리자) [PATCH] (/api/activity/admin/{activityId}/close)
export const closeAdminActivity = async (
  activityId: number,
): Promise<ActivityCloseResponse> => {
  const response = await axiosInstance.patch<ActivityCloseResponse>(
    `/api/activity/admin/${activityId}/close`,
  );
  return response.data;
};

// 대외활동 북마크 토글 [POST] (/api/activity/{activityId}/bookmark)
export const toggleActivityBookmark = async (
  userId: number,
  activityId: number,
): Promise<ActivityBookmarkResponse> => {
  const response = await axiosInstance.post<ActivityBookmarkResponse>(
    `/api/activity/${activityId}/bookmark`,
    null,
    { params: { userId } },
  );
  return response.data;
};

// 동아리/스터디 댓글 목록 조회 [GET] (/api/activity/{activityId}/comments)
export const getActivityComments = async (
  activityId: number,
  params?: { cursorId?: number; size?: number },
): Promise<ActivityCommentListResponse> => {
  const response = await axiosInstance.get<ActivityCommentListResponse>(
    `/api/activity/${activityId}/comments`,
    { params },
  );
  return response.data;
};

// 동아리/스터디 댓글 및 대댓글 작성 [POST] (/api/activity/{activityId}/comments)
export const createActivityComment = async (
  activityId: number,
  data: ActivityCommentCreateRequest,
): Promise<ActivityCommentCreateResponse> => {
  const response = await axiosInstance.post<ActivityCommentCreateResponse>(
    `/api/activity/${activityId}/comments`,
    data,
  );
  return response.data;
};

// 동아리/스터디 댓글 수정 [PATCH] (/api/activity/comments/{commentId})
export const updateActivityComment = async (
  commentId: number,
  data: ActivityCommentUpdateRequest,
): Promise<ActivityCommentMutationResponse> => {
  const response = await axiosInstance.patch<ActivityCommentMutationResponse>(
    `/api/activity/comments/${commentId}`,
    data,
  );
  return response.data;
};

// 동아리/스터디 댓글 삭제 [DELETE] (/api/activity/comments/{commentId})
export const deleteActivityComment = async (
  commentId: number,
): Promise<ActivityCommentMutationResponse> => {
  const response = await axiosInstance.delete<ActivityCommentMutationResponse>(
    `/api/activity/comments/${commentId}`,
  );
  return response.data;
};

// 썸네일 Presigned URL 발급 [POST] (/api/activity/uploads/presign/thumbnail)
export const getActivityThumbnailPresignUrl = async (
  userId: number,
  data: ThumbnailPresignRequest,
): Promise<ThumbnailPresignResponse> => {
  const response = await axiosInstance.post<ThumbnailPresignResponse>(
    '/api/activity/uploads/presign/thumbnail',
    data,
    { params: { userId } },
  );
  return response.data;
};

// 첨부파일 Presigned URL 발급 (배치) [POST] (/api/activity/uploads/presign/attachments)
export const getActivityAttachmentsPresignUrl = async (
  userId: number,
  data: AttachmentPresignRequest,
): Promise<AttachmentPresignResponse> => {
  const response = await axiosInstance.post<AttachmentPresignResponse>(
    '/api/activity/uploads/presign/attachments',
    data,
    { params: { userId } },
  );
  return response.data;
};

// 태그 목록 조회 [GET] (/api/tags)
export const getTags = async (scope?: TagScope): Promise<TagListResponse> => {
  const response = await axiosInstance.get<TagListResponse>('/api/tags', {
    params: scope ? { scope } : undefined,
  });
  return response.data;
};

// 팀원 모집글 생성 [POST] (/api/activity/recruitment)
export const createRecruitment = async (
  userId: number,
  data: RecruitmentCreateRequest,
): Promise<RecruitmentCreateResponse> => {
  const response = await axiosInstance.post<RecruitmentCreateResponse>(
    '/api/activity/recruitment',
    data,
    { params: { userId } },
  );
  return response.data;
};

// 팀원 모집글 수정 [PATCH] (/api/activity/recruitment/{recruitmentId})
export const updateRecruitment = async (
  userId: number,
  recruitmentId: number,
  data: RecruitmentUpdateRequest,
): Promise<RecruitmentUpdateResponse> => {
  const response = await axiosInstance.patch<RecruitmentUpdateResponse>(
    `/api/activity/recruitment/${recruitmentId}`,
    data,
    { params: { userId } },
  );
  return response.data;
};

// 팀원 모집글 상세 조회 [GET] (/api/activity/recruitment/{recruitmentId})
export const getRecruitmentDetail = async (
  userId: number,
  recruitmentId: number,
): Promise<RecruitmentDetailResponse> => {
  const response = await axiosInstance.get<RecruitmentDetailResponse>(
    `/api/activity/recruitment/${recruitmentId}`,
    { params: { userId } },
  );
  return response.data;
};

// 팀원 모집 마감 [PATCH] (/api/activity/recruitment/{recruitmentId}/close)
export const closeRecruitment = async (
  userId: number,
  recruitmentId: number,
): Promise<RecruitmentCloseResponse> => {
  const response = await axiosInstance.patch<RecruitmentCloseResponse>(
    `/api/activity/recruitment/${recruitmentId}/close`,
    null,
    { params: { userId } },
  );
  return response.data;
};

// 팀원 모집글 북마크 토글 [POST] (/api/activity/recruitment/{recruitmentId}/bookmark)
export const toggleRecruitmentBookmark = async (
  userId: number,
  recruitmentId: number,
): Promise<RecruitmentBookmarkResponse> => {
  const response = await axiosInstance.post<RecruitmentBookmarkResponse>(
    `/api/activity/recruitment/${recruitmentId}/bookmark`,
    null,
    { params: { userId } },
  );
  return response.data;
};

// 팀원 지원하기 [POST] (/api/activity/recruitment/{recruitmentId}/apply)
export const applyRecruitment = async (
  userId: number,
  recruitmentId: number,
  data: RecruitmentApplyRequest,
): Promise<RecruitmentApplyResponse> => {
  const response = await axiosInstance.post<RecruitmentApplyResponse>(
    `/api/activity/recruitment/${recruitmentId}/apply`,
    data,
    { params: { userId } },
  );
  return response.data;
};
