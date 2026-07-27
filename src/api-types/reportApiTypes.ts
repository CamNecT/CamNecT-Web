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
  | 'INSULT_DEFAMATION'
  | 'SEXUAL_HARASSMENT'
  | 'BUSINESS_PROMOTION'
  | 'FRAUD'
  | 'FALSE_INFORMATION'
  | 'HARASSMENT_THREAT' //(임시) 괴롭힘/협박
  | 'INAPPROPRIATE_PROFILE' //(임시) 부적절한 프로필
  | 'NO_SHOW_ABANDONMENT'
  | 'OTHER';

// 신고 처리 상태
export type ReportStatus = 'RECEIVED' | 'RESOLVED' | 'REJECTED';

// 적용 패널티
export type PenaltyType = 'WARNING' | 'SUSPENDED_7_DAYS' | 'PERMANENT_BAN';

//신고 아이템(목록/상세 공용)
export interface ReportItem {
  reportId: number;
  reporterId: number;
  reportedUserId: number;
  reportedPostId: number | null;
  postType: TargetType;
  reportCategory: ReportCategory;
  title: string;
  context: string;
  evidenceImageUrls: string[];
  status: ReportStatus;
  appliedPenalty: PenaltyType | null;
  createdAt: string;
  updatedAt: string;
}

//목록 조회
export interface ReportListRequest {
  status: ReportStatus;
  type?: TargetType;
  page?: number;
  size?: number;
}

export interface ReportListPageData {
  content: ReportItem[];
  number: number; // 현재 페이지 번호
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ReportListResponse {
  code: string;
  message: string;
  data: ReportListPageData;
}

//상세 조회
export interface ReportDetailResponse {
  code: string;
  message: string;
  data: ReportItem;
}

//승인/반려
export interface ReportStatusUpdateRequest {
  status: Extract<ReportStatus, 'RESOLVED' | 'REJECTED'>;
}

export interface ReportStatusUpdateResponse {
  code: string;
  message: string;
  data: null;
}

//사용자 승인 신고 수 조회
export interface ReportCountResponse {
  code: string;
  message: string;
  data: number; //해당 사용자에 대해 RESOLVED 처리된 신고 개수
}


//증거 이미지 업로드 URL 발급
export interface ReportEvidencePresignRequest {
  originalFilename: string;
  contentType: string;
  size: number;
}
 
export interface ReportEvidencePresignData {
  fileKey: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}
 
export interface ReportEvidencePresignResponse {
  code: string;
  message: string;
  data: ReportEvidencePresignData;
}
 

//신고 제출
export interface ReportCreateRequest {
  reportedUserId: number;
  reportedPostId: number | null;
  postType: TargetType;
  reportCategory: ReportCategory;
  title: string;
  context: string;
  evidenceImageUrls: string[] | null;
}
 
export interface ReportCreateData {
  reportId: number;
  message: string;
  penaltyType: PenaltyType | null;
}
 
export interface ReportCreateResponse {
  code: string;
  message: string;
  data: ReportCreateData;
}