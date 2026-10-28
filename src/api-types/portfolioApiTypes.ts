// src/api-types/portfolioApiTypes.ts

//presign 공통
export interface PresignRequest {
  contentType: string;
  size: number;
  originalFilename: string;
}

export interface PresignResult {
  fileKey: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

//목록 조회
export interface PortfolioPreview {
  portfolioId: number;
  title: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  updatedAt: string;
}

export interface PortfolioListResponse {
  status: number;
  message: string;
  data: {
    isMine: boolean;
    data: PortfolioPreview[];
  };
}

//상세 조회

export interface PortfolioAuthor {
  userId: number;
  name: string;
  profileImageUrl: string;
  studentNo: string;
  majorName: string;
}


export interface PortfolioAsset {
  assetId: number;
  type: string;
  fileKey: string;
  fileUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface PortfolioDetailData {
  portfolioId: number;
  userId: number;
  title: string;
  thumbnailUrl: string | null;
  startDate: string;    // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" 또는 진행 중이면 null
  description: string;
  isPublic: boolean;
  isFavorite: boolean;
  assignedRole: string[];
  techStack: string[];
  review: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioDetailResponse {
  status: number;
  message: string;
  data: {
    isMine: boolean;
    data: {
      author: PortfolioAuthor;
      portfolio: PortfolioDetailData;
      portfolioAssets: PortfolioAsset[];
    };
  };
}

//생성/수정
export interface PortfolioCreateRequest {
  projectTitle: string;
  description: string;
  startedAt: string;
  endedAt: string | null;
  project_role: string;
  techStack: string[];
  review: string;
  thumbnailKey: string | null;
  attachmentKeys: string[] | null;
}

export interface PortfolioUpdateRequest {
  projectTitle: string;
  description: string;
  startedAt: string;
  endedAt: string | null;
  project_role: string;
  techStack: string[];
  review: string;
  thumbnailKey: string | null;
  attachmentKeys: string[] | null;
}

//생성/수정 응답 데이터
export type PortfolioMutateResponse = {
  status: number;
  message: string;
  data: PortfolioPreview;
}

//이미지 업로드
export interface ThumbnailPresignResponse {
  status: number;
  message: string;
  data: PresignResult;
}

export interface AssetsPresignRequest {
  items: PresignRequest[];
}

export interface AssetsPresignResponse {
  status: number;
  message: string;
  data: {
    items: PresignResult[];
  };
}

//삭제
export interface PortfolioDeleteResponse {
  status: number;
  message: string;
  data: string;
}

//토글
export interface PortfolioToggleResponse {
  status: number;
  message: string;
  data: boolean;
}
