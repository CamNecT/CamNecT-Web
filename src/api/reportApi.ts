// import type {
//   ReportListRequest,
//   ReportListResponse,
//   ReportDetailResponse,
//   ReportStatusUpdateRequest,
//   ReportStatusUpdateResponse,
//   ReportCountResponse,
  // ReportEvidencePresignRequest,
  // ReportEvidencePresignResponse,
  // ReportCreateRequest,
  // ReportCreateResponse,
// } from '../api-types/reportApiTypes';
// import { axiosInstance } from './axiosInstance';
//import { uploadFileToS3 } from '../utils/s3Upload';

// //관리자 신고 목록 조회 [GET] (/api/v1/reports/admin)
// export const getAdminReportList = async (
//   params: ReportListRequest,
// ): Promise<ReportListResponse> => {
//   const response = await axiosInstance.get<ReportListResponse>('/api/v1/reports/admin', {
//     params: {
//       status: params.status,
//       type: params.type,
//       page: params.page ?? 0,
//       size: params.size ?? 20,
//       sort: 'createdAt,desc',
//     },
//   });
//   return response.data;
// };

// //관리자 신고 상세 조회 [GET] (/api/v1/reports/admin/{reportId})
// export const getAdminReportDetail = async (reportId: number): Promise<ReportDetailResponse> => {
//   const response = await axiosInstance.get<ReportDetailResponse>(
//     `/api/v1/reports/admin/${reportId}`,
//   );
//   return response.data;
// };

// //관리자 신고 승인·반려 [PATCH] (/api/v1/reports/admin/{reportId}/status)
// export const updateAdminReportStatus = async (
//   reportId: number,
//   data: ReportStatusUpdateRequest,
// ): Promise<ReportStatusUpdateResponse> => {
//   const response = await axiosInstance.patch<ReportStatusUpdateResponse>(
//     `/api/v1/reports/admin/${reportId}/status`,
//     data,
//   );
//   return response.data;
// };

// //사용자 승인 신고 수 조회 [GET] (/api/v1/reports/admin/users/{targetUserId}/report-count)
// export const getAdminUserReportCount = async (
//   targetUserId: number,
// ): Promise<ReportCountResponse> => {
//   const response = await axiosInstance.get<ReportCountResponse>(
//     `/api/v1/reports/admin/users/${targetUserId}/report-count`,
//   );
//   return response.data;
// };

// //증거 이미지 업로드 URL 발급 [POST] (/api/v1/reports/uploads/presign/evidence)
// export const getReportEvidencePresignUrl = async (
//   data: ReportEvidencePresignRequest,
// ): Promise<ReportEvidencePresignResponse> => {
//   const response = await axiosInstance.post<ReportEvidencePresignResponse>(
//     '/api/v1/reports/uploads/presign/evidence',
//     data,
//   );
//   return response.data;
// };

// //presign 발급 + S3 업로드를 한 번에 처리
// export const uploadReportEvidence = async (file: File): Promise<string> => {
//   const presignRes = await getReportEvidencePresignUrl({
//     originalFilename: file.name,
//     contentType: file.type,
//     size: file.size,
//   });
//   await uploadFileToS3(presignRes.data.uploadUrl, file, presignRes.data.requiredHeaders);
//   return presignRes.data.fileKey;
// };
 
// //신고 제출 [POST] (/api/v1/reports)
// export const createReport = async (data: ReportCreateRequest): Promise<ReportCreateResponse> => {
//   const response = await axiosInstance.post<ReportCreateResponse>('/api/v1/reports', data);
//   return response.data;
// };




import type {
  ReportListRequest,
  ReportListResponse,
  ReportDetailResponse,
  ReportStatusUpdateRequest,
  ReportStatusUpdateResponse,
  ReportCountResponse,
  ReportEvidencePresignRequest,
  ReportEvidencePresignResponse,
  ReportCreateRequest,
  ReportCreateResponse,
} from '../api-types/reportApiTypes';
import { axiosInstance } from './axiosInstance';
import { uploadFileToS3 } from '../utils/s3Upload';
import { MOCK_REPORTS, MOCK_REPORT_COUNTS } from '../mock/reports';

// ⚠️ 로컬 디자인 확인용 스위치
// true로 켜두면 백엔드 없이 목업 데이터로 화면을 볼 수 있음
// 실제 서버 연결 테스트 / 배포 전에는 반드시 false로 되돌릴 것

const MOCK_MODE = true;
 
const MOCK_DELAY_MS = 300; // 로딩 팝업 등 실제 느낌을 위한 약간의 지연
 
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
 
// 관리자 신고 목록 조회 [GET] (/api/v1/reports/admin)
export const getAdminReportList = async (
  params: ReportListRequest,
): Promise<ReportListResponse> => {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
    const filtered = MOCK_REPORTS.filter((r) => r.status === params.status);
    return {
      code: 'SUCCESS',
      message: '요청이 성공했습니다.',
      data: {
        content: filtered,
        number: params.page ?? 0,
        size: params.size ?? 20,
        totalElements: filtered.length,
        totalPages: 1,
        first: true,
        last: true, // 목업은 페이지 1개뿐이라 항상 마지막 페이지
        numberOfElements: filtered.length,
        empty: filtered.length === 0,
      },
    };
  }
 
  const response = await axiosInstance.get<ReportListResponse>('/api/v1/reports/admin', {
    params: {
      status: params.status,
      type: params.type,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'createdAt,desc',
    },
  });
  return response.data;
};
 
// 관리자 신고 상세 조회 [GET] (/api/v1/reports/admin/{reportId})
export const getAdminReportDetail = async (reportId: number): Promise<ReportDetailResponse> => {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
    const report = MOCK_REPORTS.find((r) => r.reportId === reportId);
    if (!report) {
      throw new Error('목업 데이터에 해당 reportId가 없습니다.');
    }
    return { code: 'SUCCESS', message: '요청이 성공했습니다.', data: report };
  }
 
  const response = await axiosInstance.get<ReportDetailResponse>(
    `/api/v1/reports/admin/${reportId}`,
  );
  return response.data;
};
 
// 관리자 신고 승인·반려 [PATCH] (/api/v1/reports/admin/{reportId}/status)
export const updateAdminReportStatus = async (
  reportId: number,
  data: ReportStatusUpdateRequest,
): Promise<ReportStatusUpdateResponse> => {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
    const report = MOCK_REPORTS.find((r) => r.reportId === reportId);
    if (report) {
      report.status = data.status;
      // 승인 시 화면에서 패널티 표시가 어떻게 보이는지 확인할 수 있도록 임의 지정
      report.appliedPenalty = data.status === 'RESOLVED' ? 'WARNING' : null;
    }
    return { code: 'SUCCESS', message: '요청이 성공했습니다.', data: null };
  }
 
  const response = await axiosInstance.patch<ReportStatusUpdateResponse>(
    `/api/v1/reports/admin/${reportId}/status`,
    data,
  );
  return response.data;
};
 
// 사용자 승인 신고 수 조회 [GET] (/api/v1/reports/admin/users/{targetUserId}/report-count)
export const getAdminUserReportCount = async (
  targetUserId: number,
): Promise<ReportCountResponse> => {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
    return {
      code: 'SUCCESS',
      message: '요청이 성공했습니다.',
      data: MOCK_REPORT_COUNTS[targetUserId] ?? 0,
    };
  }
 
  const response = await axiosInstance.get<ReportCountResponse>(
    `/api/v1/reports/admin/users/${targetUserId}/report-count`,
  );
  return response.data;
};
 
// 증거 이미지 업로드 URL 발급 [POST] (/api/v1/reports/uploads/presign/evidence)
export const getReportEvidencePresignUrl = async (
  data: ReportEvidencePresignRequest,
): Promise<ReportEvidencePresignResponse> => {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
    return {
      code: 'SUCCESS',
      message: '요청이 성공했습니다.',
      data: {
        fileKey: `reports/mock/evidence/${Date.now()}-${data.originalFilename}`,
        uploadUrl: 'https://mock-upload-url.example.com/put', // 목업이라 실제로는 호출되지 않음
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        requiredHeaders: { 'Content-Type': data.contentType },
      },
    };
  }
 
  const response = await axiosInstance.post<ReportEvidencePresignResponse>(
    '/api/v1/reports/uploads/presign/evidence',
    data,
  );
  return response.data;
};
 
// presign 발급 + S3 업로드를 한 번에 처리
// 목업 모드에서는 실제 PUT을 보내지 않고 fileKey만 그대로 반환 (fetch 에러 방지)
export const uploadReportEvidence = async (file: File): Promise<string> => {
  const presignRes = await getReportEvidencePresignUrl({
    originalFilename: file.name,
    contentType: file.type,
    size: file.size,
  });
 
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
    return presignRes.data.fileKey;
  }
 
  await uploadFileToS3(presignRes.data.uploadUrl, file, presignRes.data.requiredHeaders);
  return presignRes.data.fileKey;
};
 
// 신고 제출 [POST] (/api/v1/reports)
export const createReport = async (data: ReportCreateRequest): Promise<ReportCreateResponse> => {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY_MS);
 
    // 목업 데이터에도 새 신고를 실제로 추가해서, 제출 후 관리자 목록에서 확인 가능하게 함
    const newReportId = Math.floor(Math.random() * 100000) + 1000;
    MOCK_REPORTS.unshift({
      reportId: newReportId,
      reporterId: 0,
      reportedUserId: data.reportedUserId,
      reportedPostId: data.reportedPostId,
      postType: data.postType,
      reportCategory: data.reportCategory,
      title: data.title,
      context: data.context,
      evidenceImageUrls: data.evidenceImageUrls ?? [],
      status: 'RECEIVED',
      appliedPenalty: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
 
    return {
      code: 'SUCCESS',
      message: '요청이 성공했습니다.',
      data: {
        reportId: newReportId,
        message: '성공적으로 제출되었습니다. 관리자 검토 후 처리되는 대로 알려드리겠습니다.',
        penaltyType: null,
      },
    };
  }
 
  const response = await axiosInstance.post<ReportCreateResponse>('/api/v1/reports', data);
  return response.data;
};