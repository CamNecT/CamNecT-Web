// import type {
//   ReportListRequest,
//   ReportListResponse,
//   ReportDetailResponse,
//   ReportStatusUpdateRequest,
//   ReportStatusUpdateResponse,
//   ReportCountResponse,
// } from '../api-types/reportApiTypes';
// import { axiosInstance } from './axiosInstance';

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




import type {
  ReportListRequest,
  ReportListResponse,
  ReportDetailResponse,
  ReportStatusUpdateRequest,
  ReportStatusUpdateResponse,
  ReportCountResponse,
} from '../api-types/reportApiTypes';
import { axiosInstance } from './axiosInstance';
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