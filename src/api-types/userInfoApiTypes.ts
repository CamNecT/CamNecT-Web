import type { EducationStatus } from "../types/mypage/mypageTypes";
import type { RecruitStatus } from "./activityApiTypes";

// ===== 학력 =====

// 학력 항목
export interface EducationItemAPI {
  educationId: number;
  schoolName: string;
  campusId: number | null;
  campusName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  status: EducationStatus;
  description: string | null;
}

// 학력 목록 조회 응답
export interface EducationListResponse {
  status: number;
  message: string;
  data: EducationItemAPI[];
}

// 학력 추가/수정 요청
export interface EducationRequest {
  institutionId: number;
  campusId: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  status: EducationStatus;
}

// 학력 추가 응답
export interface EducationAddResponse {
  status: number;
  message: string;
  data: string;
}

// 학력 수정 응답
export interface EducationUpdateResponse {
  status: number;
  message: string;
  data: string;
}

// 학력 삭제 응답
export interface EducationDeleteResponse {
  status: number;
  message: string;
  data: string;
}

// ===== 경력 =====

// 경력 항목
export interface ExperienceItemAPI {
  experienceId: number;
  companyName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string[];
}

// 경력 목록 조회 응답
export interface ExperienceListResponse {
  status: number;
  message: string;
  data: ExperienceItemAPI[];
}

// 경력 추가/수정 요청
export interface ExperienceRequest {
  companyName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string[];
}

// 경력 추가 응답
export interface ExperienceAddResponse {
  status: number;
  message: string;
  data: string;
}

// 경력 수정 응답
export interface ExperienceUpdateResponse {
  status: number;
  message: string;
  data: string;
}

// 경력 삭제 응답
export interface ExperienceDeleteResponse {
  status: number;
  message: string;
  data: string;
}

// ===== 자격증 =====

// 자격증 항목
export interface CertificateItemAPI {
  certificateId: number;
  certificateName: string;
  acquiredDate: string; // "YYYY-MM-DD"
  credentialUrl: string | null;
}

// 자격증 목록 조회 응답
export interface CertificateListResponse {
  status: number;
  message: string;
  data: CertificateItemAPI[];
}

// 자격증 추가/수정 요청
export interface CertificateRequest {
  certificateName: string;
  acquiredDate: string; // "YYYY-MM-DD"
}

// 자격증 추가 응답
export interface CertificateAddResponse {
  status: number;
  message: string;
  data: string;
}

// 자격증 수정 응답
export interface CertificateUpdateResponse {
  status: number;
  message: string;
  data: string;
}

// 자격증 삭제 응답
export interface CertificateDeleteResponse {
  status: number;
  message: string;
  data: string;
}


export interface PostListParams {
  userId: number;
  sort?: 'RECOMMENDED' | 'LATEST';
  cursorId?: number;
  cursorValue?: number;
  size?: number;
}

export type PostSortType = 'RECOMMENDED' | 'LATEST';

export type PostTab = 'COMMUNITY' | 'EXTERNAL' | 'RECRUITMENT';

// ===== 아이템 타입 (contentType으로 구분) =====

// Community 게시글
export interface CommunityPostItem {
  postId: number;
  boardCode: "INFO" | "QUESTION";
  title: string;
  preview: string;
  createdAt: string;
  likeCount: number;
  answerCount: number;
  commentCount: number;
  bookmarkCount: number;
  acceptedBadge?: boolean;
  tags: string[];
  // 내 글/북마크 목록에서도 익명 게시글 작성자는 null로 내려올 수 있다.
  author: {
    userId: number;
    name: string;
    profileImageUrl: string | null;
    studentNo: string;
    majorName: string;
  } | null;
  thumbnailUrl?: string | null;
  accessType?: "FREE" | "POINT_REQUIRED";
  // 커뮤니티 본 목록과 동일한 실제 열람 상태를 재사용한다.
  accessStatus?: import("./communityApiTypes").CommunityAccessStatus;
}

// 대외활동
export interface ActivityItem {
  activityId: number;
  title: string;
  contextPreview: string;
  thumbnailUrl: string;
  tags: string[];
  bookmarkCount: number;
  organizer: string;
  applyEndDate: string;  // "YYYY-MM-DD"
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  category: 'CLUB' | 'STUDY' | 'EXTERNAL' | 'RECRUITMENT';
}

// 팀원모집
export interface RecruitmentItem {
  recruitId: number;
  activityTitle: string;
  userName: string;
  recruitStatus: RecruitStatus;
  title: string;
  content: string;
  recruitDeadline: string;  // "YYYY-MM-DD"
  recruitCount: number;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
}

// Union 타입
export type PostItem = CommunityPostItem | ActivityItem | RecruitmentItem;

// ===== 응답 타입 =====

export interface PostListData {
  tab: PostTab;
  sort: PostSortType;
  items: PostItem[];
  hasNext: boolean;
  nextCursorId: number;
  nextCursorValue: number;
}

export interface PostListResponse {
  status: number;
  message: string;
  data: PostListData;
}
