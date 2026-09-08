import type {
  ReportCreateRequest,
  ReportCreateResponse,
  ReportEvidenceBatchPresignRequest,
  ReportEvidenceBatchPresignResponse,
  CaseListRequest,
  CaseListResponse,
  CaseDetailResponse,
  CaseStatusUpdateRequest,
  CaseStatusUpdateResponse,
  EvidenceDownloadUrlResponse,
  ReportCountResponse,
} from '../api-types/reportApiTypes';
import { axiosInstance } from './axiosInstance';
import { uploadFileToS3 } from '../utils/s3Upload';

// 신고 제출 [POST]
export const createReport = async (
  reporterId: number,
  data: ReportCreateRequest,
): Promise<ReportCreateResponse> => {
  const response = await axiosInstance.post<ReportCreateResponse>('/api/v1/reports', data, {
    params: { reporterId },
  });
  return response.data;
};

// 신고 증거 이미지 일괄 업로드 URL 발급 [POST]
export const getReportEvidenceBatchPresignUrls = async (
  userId: number,
  data: ReportEvidenceBatchPresignRequest,
): Promise<ReportEvidenceBatchPresignResponse> => {
  const response = await axiosInstance.post<ReportEvidenceBatchPresignResponse>(
    '/api/v1/reports/uploads/presign/evidence/batch',
    data,
    { params: { userId } },
  );
  return response.data;
};

// presign 일괄 발급 + S3 업로드를 한 번에 처리 -> fileKey 배열 반환
export const uploadReportEvidences = async (userId: number, files: File[]): Promise<string[]> => {
  const presignRes = await getReportEvidenceBatchPresignUrls(userId, {
    items: files.map((file) => ({
      contentType: file.type,
      size: file.size,
      originalFilename: file.name,
    })),
  });

  await Promise.all(
    presignRes.data.items.map((item, index) =>
      uploadFileToS3(item.uploadUrl, files[index], item.requiredHeaders),
    ),
  );

  return presignRes.data.items.map((item) => item.fileKey);
};

// 관리자 case 목록 조회 [GET]
export const getAdminCaseList = async (
  userId: number,
  params: CaseListRequest,
): Promise<CaseListResponse> => {
  const response = await axiosInstance.get<CaseListResponse>('/api/v1/reports/admin', {
    params: {
      userId,
      type: params.type,
      status: params.status,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: params.sort ?? 'updatedAt,desc',
    },
  });
  return response.data;
};

// 관리자 case 상세 조회 [GET]
export const getAdminCaseDetail = async (
  userId: number,
  caseId: number,
): Promise<CaseDetailResponse> => {
  const response = await axiosInstance.get<CaseDetailResponse>(
    `/api/v1/reports/admin/${caseId}`,
    { params: { userId } },
  );
  return response.data;
};

// 관리자 증거 이미지별 다운로드 URL 발급 [GET]
export const getAdminEvidenceDownloadUrl = async (
  userId: number,
  caseId: number,
  reportId: number,
  evidenceId: number,
): Promise<EvidenceDownloadUrlResponse> => {
  const response = await axiosInstance.get<EvidenceDownloadUrlResponse>(
    `/api/v1/reports/admin/${caseId}/submissions/${reportId}/evidence/${evidenceId}/download-url`,
    { params: { userId } },
  );
  return response.data;
};

// 관리자 승인/반려 [PATCH]
export const updateAdminCaseStatus = async (
  userId: number,
  caseId: number,
  data: CaseStatusUpdateRequest,
): Promise<CaseStatusUpdateResponse> => {
  const response = await axiosInstance.patch<CaseStatusUpdateResponse>(
    `/api/v1/reports/admin/${caseId}/status`,
    data,
    { params: { userId } },
  );
  return response.data;
};

// 사용자 승인 신고 누적 건수 조회 [GET]
export const getAdminUserReportCount = async (
  userId: number,
  targetUserId: number,
): Promise<ReportCountResponse> => {
  const response = await axiosInstance.get<ReportCountResponse>(
    `/api/v1/reports/admin/users/${targetUserId}/report-count`,
    { params: { userId } },
  );
  return response.data;
};
