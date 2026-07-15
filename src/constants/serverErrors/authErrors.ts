// Auth 도메인 API 응답 code 값 모음
export const AUTH_ERROR_CODES = {
    // 여러 API에서 공통으로 사용되는 code
    common: {
        invalidRequest: "40000", // 요청값 형식 오류 또는 필수값 누락
        emailUnverified: "41301", // 이메일 미인증
        accountRestricted: "41302", // 정지된 사용자
        userNotFound: "41401", // 사용자를 찾을 수 없음
    },

    // 비밀번호 찾기 이메일 인증 확인 API
    passwordResetVerify: {
        verificationCodeUnavailable: "42030", // 활성화된 인증번호 없음
        verificationCodeExpiredOrUsed: "42031", // 만료되었거나 이미 사용된 인증번호
        verificationCodeMismatch: "42032", // 인증번호 불일치
    },

    // 비밀번호 재설정 API
    passwordReset: {
        passwordPolicyViolation: "41010", // 비밀번호 정책 위반
        sameAsCurrentPassword: "41011", // 기존 비밀번호와 동일
        invalidResetToken: "40100", // resetToken 누락, 만료, 변조
        invalidResetTokenType: "41106", // resetToken 타입이 PASSWORD_RESET이 아님
    },
} as const;

// 비밀번호 찾기 이메일 전송 API input 에러 메시지
export const FIND_PASSWORD_EMAIL_SEND_ERROR_MESSAGES = {
    username: "입력한 아이디가 가입 정보와 일치하지 않습니다.",
    email: "입력한 이메일이 가입 정보와 일치하지 않습니다.",
    emailUnverified: "이메일 인증이 완료되지 않은 계정입니다.",
    accountRestricted: "계정이 비활성화되어 있습니다.",
    accountStatusUnavailable: "계정 상태를 확인해 주세요.",
} as const;

// 비밀번호 찾기 이메일 인증 확인 API input 에러 메시지
export const PASSWORD_RESET_VERIFY_ERROR_MESSAGES = {
    code: "인증번호가 일치하지 않습니다.",
    verificationCodeFormat: "인증번호 형식이 올바르지 않습니다.",
    verificationCodeUnavailable: "인증번호를 다시 받아주세요.",
    verificationCodeExpiredOrUsed: "만료된 인증번호입니다.",
    verificationCodeAttemptsExceeded: "시도 횟수를 초과했습니다.",
    emailUnverified: "이메일 인증이 완료되지 않은 계정입니다.",
    accountRestricted: "계정이 비활성화되어 있습니다.",
    userNotFound: "사용자를 찾을 수 없습니다.",
} as const;

// 인증번호 시도 횟수 [n / 5] 표시가 필요한 메시지
export const PASSWORD_RESET_VERIFY_ATTEMPT_ERROR_MESSAGES = new Set<string>([
    PASSWORD_RESET_VERIFY_ERROR_MESSAGES.code,
    PASSWORD_RESET_VERIFY_ERROR_MESSAGES.verificationCodeAttemptsExceeded,
]);

// 비밀번호 찾기 이메일 인증 확인 API 팝업 메시지
export const PASSWORD_RESET_VERIFY_POPUP_MESSAGES = {
    internal: {
        title: "인증에 실패하였습니다.",
        content: "잠시 후 다시 시도해 주세요.",
    },
    fallback: {
        title: "인증에 실패하였습니다.",
        content: "관리자에게 문의주세요.",
    },
} as const;

// 비밀번호 재설정 API input 에러 메시지
export const PASSWORD_RESET_ERROR_MESSAGES = {
    passwordFormat: "비밀번호를 다시 확인해 주세요.",
    passwordPolicy: "비밀번호 조건을 확인해 주세요.",
    sameAsCurrentPassword: "이전 비밀번호는 사용할 수 없습니다.",
} as const;

// 비밀번호 재설정 API 팝업 메시지
export const PASSWORD_RESET_POPUP_MESSAGES = {
    invalidResetToken: {
        title: "비밀번호 재설정에 실패하였습니다.",
        content: "인증번호를 다시 받아주세요.",
    },
    userNotFound: {
        title: "비밀번호 재설정에 실패하였습니다.",
        content: "사용자 정보를 찾을 수 없습니다.",
    },
    internal: {
        title: "비밀번호 재설정에 실패하였습니다.",
        content: "잠시 후 다시 시도해 주세요.",
    },
    fallback: {
        title: "비밀번호 재설정에 실패하였습니다.",
        content: "관리자에게 문의주세요.",
    },
} as const;
