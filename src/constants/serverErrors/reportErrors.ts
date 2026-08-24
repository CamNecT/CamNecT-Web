// Report 도메인 API 응답 code 값 모음
export const REPORT_ERROR_CODES = {
    // 여러 API에서 공통으로 사용되는 code
    common: {
        invalidRequest: "40000", // 요청값 검증 실패
        unauthorized: "41103", // 유효하지 않은 토큰 / Authorization 누락
        forbiddenAdmin: "44303", // 관리자가 아님
        userNotFound: "44401", // 사용자 없음
        internalError: "50000", // 내부 서버 오류
    },

    // 신고 제출 API
    reportCreate: {
        reportedUserNotFound: "44401", // 신고 대상 사용자를 찾을 수 없음
        duplicateReport: "51901", // 중복 신고 (HTTP 409)
    },

    // 관리자 신고 목록/상세/처리 API
    adminCase: {
        caseNotFound: "51401", // 신고(case)를 찾을 수 없음
        evidenceNotFound: "51402", // 증거가 없는데 증거 조회를 시도함
    },
} as const;

// 신고 제출 API 에러 메시지
export const REPORT_CREATE_ERROR_MESSAGES = {
    invalidRequest: {
        title: "신고 접수 실패",
        content: "입력값을 다시 확인해주세요.",
    },
    reportedUserNotFound: {
        title: "신고 접수 실패",
        content: "신고 대상을 찾을 수 없습니다.",
    },
    duplicateReport: {
        title: "이미 신고하셨습니다",
        content: "동일한 대상은 한 번만 신고할 수 있습니다.",
    },
    internal: {
        title: "신고 접수 실패",
        content: "잠시 후 다시 시도해주세요.",
    },
    fallback: {
        title: "신고 접수 실패",
        content: "관리자에게 문의해주세요.",
    },
} as const;

// 증거 이미지 업로드(batch presign) API 에러 메시지
export const REPORT_EVIDENCE_UPLOAD_ERROR_MESSAGES = {
    internal: {
        title: "이미지 업로드 실패",
        content: "잠시 후 다시 시도해주세요.",
    },
    fallback: {
        title: "이미지 업로드 실패",
        content: "관리자에게 문의해주세요.",
    },
} as const;

// 관리자 신고 목록/상세 조회 API 에러 메시지
export const ADMIN_CASE_FETCH_ERROR_MESSAGES = {
    forbidden: {
        title: "조회 실패",
        content: "관리자 권한이 없습니다.",
    },
    caseNotFound: {
        title: "조회 실패",
        content: "해당 신고를 찾을 수 없습니다.",
    },
    evidenceNotFound: {
        title: "증거 조회 실패",
        content: "등록된 증거 이미지가 없습니다.",
    },
    internal: {
        title: "조회 실패",
        content: "잠시 후 다시 시도해주세요.",
    },
    fallback: {
        title: "조회 실패",
        content: "관리자에게 문의해주세요.",
    },
} as const;

// 관리자 신고 처리(승인/반려) API 에러 메시지
export const ADMIN_CASE_STATUS_ERROR_MESSAGES = {
    invalidRequest: {
        title: "처리 실패",
        content: "입력값을 다시 확인해주세요. 승인 시 확정 사유는 필수입니다.",
    },
    forbidden: {
        title: "처리 실패",
        content: "관리자 권한이 없습니다.",
    },
    caseNotFound: {
        title: "처리 실패",
        content: "해당 신고를 찾을 수 없습니다.",
    },
    internal: {
        title: "처리 실패",
        content: "잠시 후 다시 시도해주세요.",
    },
    fallback: {
        title: "처리 실패",
        content: "관리자에게 문의해주세요.",
    },
} as const;