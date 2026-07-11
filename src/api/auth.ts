import type {
    AdminVerificationDownloadUrlRequest, AdminVerificationDownloadUrlResponse,
    AdminVerificationListRequest, AdminVerificationListResponse,
    AdminVerificationProcessRequest, AdminVerificationProcessResponse,
    DeleteAccountRequest, DeleteAccountResponse,
    EmailRequest,
    EmailResponse, EmailVerificationRequest, EmailVerificationResponse,
    FindIdRequest, FindIdResponse,
    FindPasswordEmailRequest, FindPasswordEmailResponse,
    FindPasswordEmailVerifyRequest, FindPasswordEmailVerifyResponse,
    FindPasswordResetRequest,
    IdDuplicateCheckRequest, IdDuplicateCheckResponse, LoginRequest, LoginResponse,
    ProfileImagePresignRequest, ProfileImagePresignResponse,
    ProfileOnboardingRequest, ProfileOnboardingResponse,
    SchoolVerificationPresignRequest, SchoolVerificationPresignResponse,
    SchoolVerificationUploadRequest, SchoolVerificationUploadResponse,
    TagListResponse, VerificationCompleteRequest, VerificationCompleteResponse
} from "../api-types/authApiTypes";
import { axiosInstance } from "./axiosInstance";

// 1. 로그인 API [POST] (/api/auth/login)
export const login = async (data: LoginRequest) => {

    const response = await axiosInstance.post<LoginResponse>("/api/auth/login", data);
    return response.data; 
}

// -------------------- 회원가입 단계 --------------------

// 2. 아이디 중복확인 [GET] (/api/auth/{username}/available)
export const checkIdDuplicate = async (data: IdDuplicateCheckRequest) => {
    
    const response = await axiosInstance.get<IdDuplicateCheckResponse>(`/api/auth/${data.username}/available`);
    return response.data;
}

// 3. 이메일 인증 번호 요청 API [POST] (/api/auth/signup/email/send)
export const requestEmailCode = async (data: EmailRequest) => {
    
    const response = await axiosInstance.post<EmailResponse>("/api/auth/signup/email/send", data);
    return response.data;
}

// 4. 이메일 인증 번호 검증 API [POST] (/api/auth/signup/email/verify)
export const verifyEmailCode = async (data: EmailVerificationRequest) => {
    
    const response = await axiosInstance.post<EmailVerificationResponse>("/api/auth/signup/email/verify", data);
    return response.data;
}

// 5. 학교 인증서 업로드용 presign 발급 API [POST] (/api/verification/documents/uploads/presign)
export const requestSchoolVerificationPresign = async (data: SchoolVerificationPresignRequest) => {
    
    const response = await axiosInstance.post<SchoolVerificationPresignResponse>("/api/verification/documents/uploads/presign", data);
    return response.data;
}

// 6. 학교 인증서 인증 요청 API [POST] (/api/verification/documents)
export const requestSchoolVerification = async (data: SchoolVerificationUploadRequest) => {
    
    const response = await axiosInstance.post<SchoolVerificationUploadResponse>("/api/verification/documents", data);
    return response.data;
}

// 7. 프로필 이미지 업로드용 presign 발급 API [POST] (/api/profile/uploads/presign)
export const requestProfilePresign = async (data: ProfileImagePresignRequest) => {
    
    const response = await axiosInstance.post<ProfileImagePresignResponse>("/api/profile/uploads/presign", data);
    return response.data;
}

// 8. 관심태그 리스트 조회 API [GET] (/api/tags)
export const requestTagList = async () => {
    
    const response = await axiosInstance.get<TagListResponse>("/api/tags");
    return response.data;
}

// 9. 프로필 이미지, 자기소개, 관심태그 전송 API [POST] (/api/auth/onboarding)
export const requestProfileOnboarding = async (data: ProfileOnboardingRequest) => {
    
    const response = await axiosInstance.post<ProfileOnboardingResponse>("/api/auth/onboarding", data);
    return response.data;
}

// 10. (인증 완료 화면) 인증 완료 화면 요청 API [GET] (/api/auth/verification-complete)
export const requestVerificationComplete = async (data: VerificationCompleteRequest) => {
    
    const response = await axiosInstance.get<VerificationCompleteResponse>("/api/auth/verification-complete", {
        params: data // query parameter
    });
    return response.data;
}

// -------------------- 관리자 인증 --------------------

// 11. (관리자) 인증 요청 리스트 확인 API [GET] (/api/admin/verification/documents)
export const requestAdminVerificationList = async (data: AdminVerificationListRequest) => {
    
    const response = await axiosInstance.get<AdminVerificationListResponse>("/api/admin/verification/documents", {
        params: data // query parameter
    });
    return response.data;
}

// 12. (관리자) 인증 리스트 문서 다운로드 URL 발급 API [GET] (/api/admin/verification/documents/{submissionId}/download-url)
export const requestAdminVerificationDownloadUrl = async (data: AdminVerificationDownloadUrlRequest) => {
    
    const response = await axiosInstance.get<AdminVerificationDownloadUrlResponse>(`/api/admin/verification/documents/${data.submissionId}/download-url`);
    return response.data;
}

// 13. (관리자) 인증 요청 심사 API [PATCH] (/api/admin/verification/documents/{submissionId})
export const requestAdminVerificationProcess = async (data: AdminVerificationProcessRequest) => {
    // submissionId는 경로(path)에, adminId는 쿼리(query)에, 나머지는 바디(body)에 담음
    const { submissionId, adminId, ...body } = data;

    const response = await axiosInstance.patch<AdminVerificationProcessResponse>(
        `/api/admin/verification/documents/${submissionId}`,
        body,
        {
            params: { adminId }
        }
    );
    return response.data;
}

// -------------------- 아이디/비밀번호 찾기 --------------------
// 14. 아이디 찾기 API [POST] (/api/auth/username/find)
export const findId = async (data: FindIdRequest) => {
    
    const response = await axiosInstance.post<FindIdResponse>("/api/auth/username/find", data);
    return response.data;
}

// 15. 비밀번호 찾기 이메일 전송 API [POST] (/api/auth/password/reset/email/send)
export const findPasswordEmailReqeust = async (data: FindPasswordEmailRequest) => {
    
    const response = await axiosInstance.post<FindPasswordEmailResponse>("/api/auth/password/reset/email/send", data);
    return response.data;
}

// 16. 비밀번호 찾기 이메일 인증 확인 API [POST] (/api/auth/password/reset/email/verify)
export const findPasswordEmailVerifyRequest = async (data: FindPasswordEmailVerifyRequest) => {
    
    const response = await axiosInstance.post<FindPasswordEmailVerifyResponse>("/api/auth/password/reset/email/verify", data);
    return response.data;
}

// 17. 비밀번호 재설정 API [POST] (/api/auth/password/reset)
export const findPasswordResetReqeust = async (data: FindPasswordResetRequest) => {
    
    const response = await axiosInstance.post("/api/auth/password/reset", data);
    return response.data;
}

// -------------------- 로그인 이후 --------------------

// 18. 회원 탈퇴 API [Delete] (/api/auth/me)
export const deleteAccount = async (data: DeleteAccountRequest) => {
    const { userId, ...body } = data;
    
    const response = await axiosInstance.delete<DeleteAccountResponse>("/api/auth/me", {
        params: { userId },
        data: body
    });
    return response.data;
}