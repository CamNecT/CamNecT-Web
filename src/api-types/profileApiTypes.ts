import type { EducationStatus } from "../types/mypage/mypageTypes";
//마이페이지 조회 타입

export interface PortfolioProject {
  portfolioId: number;
  title: string;
  thumbnailUrl: string;
  isPublic: boolean;
  isFavorite: boolean;
}

export interface Education {
  educationId: number;
  schoolName: string;
  campusId: number | null;
  campusName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  status: EducationStatus;
  description: string | null;
}

export interface Experience {
  experienceId: number;
  companyName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string[];
}

export interface Certificate {
  certificateId: number;
  certificateName: string;
  acquiredDate: string; // "YYYY-MM-DD"
  credentialUrl: string | null;
}

export interface ProfileTag {
  id: number;
  name: string;
  categoryCode: string;
}

export interface ProfileBasics {
  bio: string | null;
  openToCoffeeChat: boolean;
  isFollowerVisible: boolean;
  isEducationVisible: boolean;
  isExperienceVisible: boolean;
  isCertificateVisible: boolean;
  profileImageUrl: string | null;
  studentNo: string;
  institutionId: number;
  majorId: number;
}

export interface MyProfileData {
  userId: number;
  name: string;
  basics: ProfileBasics;
  following: number;
  follower: number;
  myPoint: number;
  portfolioProjectList: PortfolioProject[];
  educations: Education[];
  experience: Experience[];
  certificate: Certificate[];
  tags: ProfileTag[];
}

export interface MyProfileResponse {
  status: number;
  message: string;
  data: MyProfileData;
}

export interface MyProfileRequest {
  loginUserId: number;
}

// ===== 프로필 수정 타입 =====

// 프로필 이미지 수정 요청
export interface ProfileImageUpdateRequest {
  profileImageKey: string | null;
}

// 프로필 이미지 수정 응답
export interface ProfileImageUpdateResponse {
  status: number;
  message: string;
  data: string;
}

// 자기소개 수정 요청
export interface ProfileBioUpdateRequest {
  bio: string;
}

// 자기소개 수정 응답
export interface ProfileBioUpdateResponse {
  status: number;
  message: string;
  data: {
    status: string;
  };
}

// 태그 수정 요청
export interface ProfileTagsUpdateRequest {
  tagIds: number[];
}

// 태그 수정 응답
export interface ProfileTagsUpdateResponse {
  status: number;
  message: string;
  data: {
    status: string;
  };
}

// 공개 여부 수정 요청
export interface ProfilePrivacyUpdateRequest {
  isFollowerVisible: boolean;
  isEducationVisible: boolean;
  isExperienceVisible: boolean;
  isCertificateVisible: boolean;
}

// 공개 여부 수정 응답
export interface ProfilePrivacyUpdateResponse {
  status: number;
  message: string;
  data: string;
}

// ===== 팔로잉 타입 =====
export interface FollowUser {
  userId: number;
  name: string;
  majorName: string;
  studentNo: string;
  profileImageUrl: string | null;
}

export interface FollowListData {
  users: FollowUser[];
  count: number;
}

export interface FollowListResponse {
  status: number;
  message: string;
  data: FollowListData;
}

// ===== 환경설정 타입 =====
export interface SettingInfoData {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  // phoneNum: string;
  email: string;
}

export interface SettingInfoResponse {
  status: number;
  message: string;
  data: SettingInfoData;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
