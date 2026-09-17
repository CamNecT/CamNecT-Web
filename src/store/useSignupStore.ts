import { create } from "zustand";
import type { EmailVerificationRequest } from "../api-types/authApiTypes";

// Store 상태 타입 정의
interface SignupStore {
    // API 필수 필드
    email: string;
    username: string;
    password: string;
    name: string;
    // phoneNum: string;
    agreements: {
        serviceTerms: boolean;
        privacyTerms: boolean;
    };
    selfIntroduction: string | null;
    profileImage: File | null; 
    profileImageKey: string | null;
    verificationFile: File | null;
    isVerificationSubmitted: boolean;

    // UI 상태 
    // verificationType: 'email' | 'phone'; // 휴대폰인증 안함
    emailVerified: boolean;
    // phoneVerified: boolean;

    // 상태 변경 함수들 
    setEmail: (email: string) => void;
    setUsername: (username: string) => void;
    setPassword: (password: string) => void;
    setName: (name: string) => void;
    // setPhoneNum: (phoneNum: string) => void;
    setAgreements: (agreements: {serviceTerms: boolean, privacyTerms: boolean}) => void;
    // setVerificationType: (verificationType: 'email' | 'phone') => void;
    setEmailVerified: (emailVerified: boolean) => void;
    setSelfIntroduction: (selfIntroduction: string | null) => void;
    setProfileImage: (profileImage: File | null) => void;
    setProfileImageKey: (profileImageKey: string | null) => void;
    setVerificationFile: (verificationFile: File | null) => void;
    setIsVerificationSubmitted: (isVerificationSubmitted: boolean) => void;
    // setPhoneVerified: (phoneVerified: boolean) => void;
    
    // API 요청 & 초기화
    getEmailVerificationData: () => Omit<EmailVerificationRequest, 'code'>;
    reset: () => void;
}

// 초기 상태 (데이터만)
const initialState = {
    email: '',
    username: '',
    password: '',   
    name: '',
    // phoneNum: '',
    agreements: {
        serviceTerms: false,
        privacyTerms: false,
    },
    // verificationType: 'email' as const,
    emailVerified: false,
    selfIntroduction: '',
    profileImage: null as File | null,
    profileImageKey: null as string | null,
    verificationFile: null as File | null,
    isVerificationSubmitted: false,
};

// Zustand Store 생성
export const useSignupStore = create<SignupStore>((set, get) => ({
    ...initialState,

    // 상태 변경 함수들 구현
    setEmail: (email: string) => set({ email }),
    setUsername: (username: string) => set({ username }),
    setPassword: (password: string) => set({ password }),
    setName: (name: string) => set({ name }),
    // setPhoneNum: (phoneNum: string) => set({ phoneNum }),
    setAgreements: (agreements: {serviceTerms: boolean, privacyTerms: boolean}) => set({ agreements }),
    // setVerificationType: (verificationType: 'email' | 'phone') => set({ verificationType }),
    setEmailVerified: (emailVerified: boolean) => set({ emailVerified }),
    // setPhoneVerified: (phoneVerified: boolean) => set({ phoneVerified }),
    setSelfIntroduction: (selfIntroduction: string | null) => set({ selfIntroduction }),
    setProfileImage: (profileImage: File | null) => set({ profileImage }),
    setProfileImageKey: (profileImageKey: string | null) => set({ profileImageKey }),
    setVerificationFile: (verificationFile: File | null) => set({ verificationFile }),
    setIsVerificationSubmitted: (isVerificationSubmitted: boolean) => set({ isVerificationSubmitted }),

    // 이메일 인증번호 검증 API 요청시 필요한 필드만 추출
    getEmailVerificationData: (): Omit<EmailVerificationRequest, 'code'> => {
        const state = get(); // 현재 전역상태에 저장된 모든 값들 불러오는 함수
        return {
            email: state.email,
            username: state.username,
            password: state.password,
            name: state.name,
            // phoneNum: state.phoneNum,
            agreements: state.agreements,
        };
    },

    // 초기화 함수 (회원가입 이후 초기화)
    reset: () => set(initialState),
}));