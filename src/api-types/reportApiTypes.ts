//신고 대상 타입
export type TargetType =
  | 'COMMUNITY'
  | 'COMMUNITY_COMMENT'
  | 'ACTIVITY'
  | 'ACTIVITY_RECRUITMENT'
  | 'USER'
  | 'CHAT';

//신고 사유
export type ReportCategory =
  | 'BUSINESS_PROMOTION'
  | 'INSULT_DEFAMATION'
  | 'FALSE_INFORMATION'
  | 'NO_SHOW_ABANDONMENT'
  | 'HARASSMENT_THREAT'
  | 'INAPPROPRIATE_PROFILE'
  | 'SEXUAL_HARASSMENT'
  | 'FRAUD'
  | 'OTHER';

//신고(case) 처리 상태
export type ReportStatus = 'RECEIVED' | 'RESOLVED' | 'REJECTED';

//적용 패널티
export type PenaltyType = 'WARNING' | 'SUSPENDED_7_DAYS' | 'PERMANENT_BAN';

//신고 제출 
export interface ReportCreateRequest {
  reportedUserId: number;
  reportedPostId: number | null;
  postType: TargetType;
  reportCategory: ReportCategory;
  title: string;
  context: string;
  evidenceImageKeys: string[];
}

export interface ReportCreateData {
  reportId: number;
  message: string; 
  penaltyType: PenaltyType | null;
}

export interface ReportCreateResponse {
  status: number;
  message: string;
  data: ReportCreateData;
}

//증거 이미지 일괄 업로드 URL 발급
export interface ReportEvidencePresignItemRequest {
  contentType: string;
  size: number;
  originalFilename: string;
}

export interface ReportEvidenceBatchPresignRequest {
  items: ReportEvidencePresignItemRequest[];
}

export interface ReportEvidencePresignItem {
  fileKey: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

export interface ReportEvidenceBatchPresignResponse {
  status: number;
  message: string;
  data: {
    items: ReportEvidencePresignItem[];
  };
}

//Spring Page 공통 형식
export interface SpringSort {
  sorted: boolean;
  empty: boolean;
  unsorted: boolean;
}

export interface SpringPageable {
  paged: boolean;
  pageNumber: number;
  pageSize: number;
  offset: number;
  sort: SpringSort;
  unpaged: boolean;
}

export interface SpringPage<T> {
  totalElements: number;
  totalPages: number;
  pageable: SpringPageable;
  size: number;
  content: T[];
  number: number;
  sort: SpringSort;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

//case 목록
export interface CaseTargetAuthor {
  userId: number;
  name: string;
  status: string; //대상 작성자 계정 상태
}

export interface CaseListItem {
  caseId: number;
  targetKey: string; //서버 내부 대상 식별키
  targetAuthor: CaseTargetAuthor;
  targetId: number | null;
  targetType: TargetType;
  reportCount: number;
  status: ReportStatus;
  decidedCategory: ReportCategory | null;
  appliedPenalty: PenaltyType | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseListResponse {
  status: number;
  message: string;
  data: SpringPage<CaseListItem>;
}

export interface CaseListRequest {
  type?: TargetType;
  status?: ReportStatus;
  page?: number;
  size?: number;
  sort?: string;
}


// 증거 이미지 개별 메타 정보 (실제 파일 조회는 evidenceId로 별도 요청)
export interface CaseEvidenceMeta {
  evidenceId: number;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  sortOrder: number;
}

//신고자별 개별 제출 내역
export interface CaseSubmission {
  reportId: number;
  reporterId: number;
  submittedCategory: ReportCategory;
  title: string;
  context: string;
  hasEvidence: boolean;
  evidenceCount: number;
  evidence: CaseEvidenceMeta[];
  createdAt: string;
}

// 대상자의 기존 제재 이력
export interface ExistingPenalty {
  penaltyId: number;
  caseId: number;
  targetKey: string;
  penaltyType: PenaltyType;
  suspensionEndDate: string | null;
  reason: string;
  active: boolean;
  createdAt: string;
}

export interface CaseDetail extends CaseListItem {
  moderationReason: string | null;
  processedByAdminId: number | null;
  processedAt: string | null;
  submissions: CaseSubmission[];
  existingPenalties: ExistingPenalty[];
}

export interface CaseDetailResponse {
  status: number;
  message: string;
  data: CaseDetail;
}

//증거 이미지별 다운로드 URL 발급
export interface EvidenceDownloadUrlData {
  downloadUrl: string;
  expiresAt: string;
  fileKey: string;
}

export interface EvidenceDownloadUrlResponse {
  status: number;
  message: string;
  data: EvidenceDownloadUrlData;
}

//승인/반려
export interface CaseStatusUpdateRequest {
  status: Extract<ReportStatus, 'RESOLVED' | 'REJECTED'>;
  decidedCategory: ReportCategory | null;
  reason: string | null; // 최대 500자
}

export interface CaseStatusUpdateResponse {
  status: number;
  message: string;
  data: string | null;
}

//사용자 신고 누적 수 조회
export interface ReportCountResponse {
  status: number;
  message: string;
  data: number; // 승인된 신고 누적 수
}

//서버 에러 응답 공통 형식
export interface ReportApiErrorBody {
  status?: number;
  code?: string | number;
  message?: string;
}