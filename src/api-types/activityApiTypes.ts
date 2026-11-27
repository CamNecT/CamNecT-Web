export type ActivityCategory = 'STUDY' | 'CLUB' | 'EXTERNAL' | 'RECRUITMENT';

export type ActivitySortType = 'RECOMMEND' | 'DEADLINE' | 'BOOKMARK' | 'RECRUIT' | 'LATEST';

export type ActivityStatus = 'OPEN' | 'CLOSED';

export type RecruitStatus = 'RECRUITING' | 'CLOSED';

//작성자 정보
export interface ProfilePreview {
  userId: number;
  name: string;
  majorName: string;
  studentNo: string;
  profileImageUrl: string | null;
}

//목록 조회
export interface ActivityListItem {
  activityId: number;
  title: string;
  contextPreview: string;
  thumbnailUrl: string | null;
  tags: string[];
  bookmarkCount: number;
  organizer: string;
  applyEndDate: string; // "YYYY-MM-DD"
  status: ActivityStatus;
  createdAt: string; //ISO
}

export interface ActivityListPageable {
  paged: boolean;
  pageNumber: number;
  pageSize: number;
  offset: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  unpaged: boolean;
}

export interface ActivityListData {
  pageable: ActivityListPageable;
  size: number;
  content: ActivityListItem[];
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ActivityListResponse {
  status: number;
  message: string;
  data: ActivityListData;
}

export interface ActivityListRequest {
  userId: number;
  category?: ActivityCategory;
  tagIds?: number[];
  title?: string;
  sortType?: ActivitySortType;
  page?: number;
  size?: number;
}

//등록(동아리/스터디)
export interface ActivityCreateRequest {
  category: ActivityCategory;
  title: string;
  tagIds: number[];
  content: string;
  thumbnailKey: string | null;
  attachmentKey: string[] | null;
}

export interface ActivityCreateResponse {
  status: number;
  message: string;
  data: ActivityListItem;
}

//등록(대외활동/취업정보)

export interface ActivityAdminCreateRequest {
  category: ActivityCategory;
  title: string;
  tagIds: number[];
  organizer: string;
  targetDescription: string;
  applyStartDate: string; // "YYYY-MM-DD"
  applyEndDate: string;
  resultAnnounceDate: string | null;
  officialUrl: string;
  thumbnailKey: string | null;
  contextTitle: string;
  content: string;
}

export interface ActivityAdminCreateResponse {
  status: number;
  message: string;
  data: ActivityListItem;
}

//상세 조회

export interface ActivityAttachment {
  id: number;
  activityId: number;
  fileKey: string;
  fileUrl: string;
  createdAt: string;
}

export interface RecruitmentItem {
  recruitId: number;
  userId: number;
  activityId: number;
  activityTitle: string;
  userName: string;
  recruitStatus: RecruitStatus;  // "RECRUITING" | "CLOSED"
  title: string;
  content: string;
  recruitDeadline: string; // "YYYY-MM-DD"
  recruitCount: number;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDetail {
  activityId: number;
  title: string;
  category: ActivityCategory;
  organizer: string;
  userId: number;
  region: string;
  targetDescription: string;
  thumbnailUrl: string;
  applyStartDate: string;  // "YYYY-MM-DD"
  applyEndDate: string;    // "YYYY-MM-DD"
  resultAnnounceDate: string | null; // "YYYY-MM-DD"
  officialUrl: string;
  status: ActivityStatus;
  createdAt: string;
  contextTitle: string;
  context: string;
}

export interface ActivityDetailData {
  isMine: boolean;
  author: ProfilePreview | null;
  activity: ActivityDetail;
  attachment: ActivityAttachment[] | null;
  tagIds: number[];
  recruitmentList: RecruitmentItem[] | null;
  bookmarkCount: number;
  isBookmarked: boolean;
}

export interface ActivityDetailResponse {
  status: number;
  message: string;
  data: ActivityDetailData;
}

//수정(동아리/스터디)

export interface ActivityUpdateRequest {
  category: ActivityCategory;
  title: string;
  tagIds: number[];
  content: string;
  thumbnailKey: string | null;
  attachmentKey: string[] | null;
}

export interface ActivityUpdateResponse {
  status: number;
  message: string;
  data: string;
}

//수정(대외활동/취업정보)
export interface ActivityAdminUpdateRequest {
  category: ActivityCategory;
  title: string;
  organizer: string;
  targetDescription: string;
  applyStartDate: string;
  applyEndDate: string;
  resultAnnounceDate: string | null;
  officialUrl: string;
  thumbnailKey: string | null;
  contextTitle: string;
  content: string;
  tagIds: number[];
}

export interface ActivityAdminUpdateResponse {
  status: number;
  message: string;
  data: string;
}

//삭제
export interface ActivityDeleteResponse {
  status: number;
  message: string;
  data: number;
}

//모집 중지
export interface ActivityCloseResponse {
  status: number;
  message: string;
  data: string;
}

//북마크
export interface ActivityBookmarkResponse {
  status: number;
  message: string;
  data: string;
}

// 동아리/스터디 댓글
export interface ActivityCommentAuthor {
  userId: number;
  name: string;
  profileImageUrl?: string | null;
  studentNo?: string;
  majorName?: string;
  yearLevel?: number;
}

export interface ActivityCommentItem {
  commentId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  likeCount: number;
  createdAt: string;
  author: ActivityCommentAuthor | null;
}

export interface ActivityCommentListResponse {
  status: number;
  message: string;
  data: {
    items: ActivityCommentItem[];
    nextCursorId: number | null;
    hasNext: boolean;
  };
}

export interface ActivityCommentCreateRequest {
  content: string;
  parentCommentId: number | null;
}

export interface ActivityCommentCreateResponse {
  status: number;
  message: string;
  data: {
    commentId: number;
  };
}

export interface ActivityCommentUpdateRequest {
  content: string;
}

export interface ActivityCommentMutationResponse {
  status: number;
  message: string;
  data: null;
}

//Presigned URL
export interface PresignedUrlItem {
  fileKey: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

export interface ThumbnailPresignRequest {
  contentType: string;
  size: number;
  originalFilename: string;
}

export interface ThumbnailPresignResponse {
  status: number;
  message: string;
  data: PresignedUrlItem;
}

export interface AttachmentPresignRequest {
  items: ThumbnailPresignRequest[];
}

export interface AttachmentPresignResponse {
  status: number;
  message: string;
  data: {
    items: PresignedUrlItem[];
  };
}

//태그

export type TagScope = 'DEFAULT' | 'COMMUNITY_QUESTION' | 'ACTIVITY_RECRUIT';

export interface TagItem {
  id: number;
  name: string;
}

export interface TagCategory {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  tags: TagItem[];
}

export interface TagListResponse {
  status: number;
  message: string;
  data: TagCategory[];
}

//팀원 모집

export interface RecruitmentCreateRequest {
  activityId: number;
  title: string;
  recruitDeadline: string; // "YYYY-MM-DD"
  recruitCount: number;
  content: string;
}

export interface RecruitmentCreateResponse {
  status: number;
  message: string;
  data: RecruitmentItem;
}

export interface RecruitmentUpdateRequest {
  activityId: number;
  title: string;
  recruitDeadline: string;
  recruitCount: number;
  content: string;
}

export interface RecruitmentUpdateResponse {
  status: number;
  message: string;
  data: string;
}

export interface RecruitmentDetailData {
  author: ProfilePreview;
  recruitment: RecruitmentItem;
  activityTitle: string;
  isMine: boolean;
  isBookmarked: boolean;
}

export interface RecruitmentDetailResponse {
  status: number;
  message: string;
  data: RecruitmentDetailData;
}

export interface RecruitmentCloseResponse {
  status: number;
  message: string;
  data: string;
}

export interface RecruitmentBookmarkResponse {
  status: number;
  message: string;
  data: string;
}

export interface RecruitmentApplyRequest {
  content: string;
}

export interface RecruitmentApplyResponse {
  status: number;
  message: string;
  data: number;
}
