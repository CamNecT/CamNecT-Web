import type {
  MyProfileRequest, 
  MyProfileResponse,
  ProfileImageUpdateRequest,
  ProfileImageUpdateResponse,
  ProfileBioUpdateRequest,
  ProfileBioUpdateResponse,
  ProfileTagsUpdateRequest,
  ProfileTagsUpdateResponse,
  ProfilePrivacyUpdateRequest,
  ProfilePrivacyUpdateResponse,
  FollowListResponse,
  SettingInfoResponse,
  ChangePasswordRequest,
} from "../api-types/profileApiTypes";
import { getId } from "firebase/installations";
import { installations } from "../shared/firebase";
import { axiosInstance } from "./axiosInstance";

// 마이페이지 조회 API [GET] (/api/profile/me)
export const getMyProfile = async (data: MyProfileRequest) => {
  const response = await axiosInstance.get<MyProfileResponse>("/api/profile/me", {
    params: data
  });
  return response.data;
};

// 프로필 이미지 수정 [PATCH] (/api/profile/me/image)
export const updateProfileImage = async (userId: number, data: ProfileImageUpdateRequest) => {
  const response = await axiosInstance.patch<ProfileImageUpdateResponse>(
    "/api/profile/me/image",
    data,
    { params: { userId } }
  );
  return response.data;
};

// 자기소개 수정 [PATCH] (/api/profile/me/bio)
export const updateProfileBio = async (userId: number, data: ProfileBioUpdateRequest) => {
  const response = await axiosInstance.patch<ProfileBioUpdateResponse>(
    "/api/profile/me/bio",
    data,
    { params: { userId } }
  );
  return response.data;
};

// 태그 수정 [PUT] (/api/profile/tags)
export const updateProfileTags = async (userId: number, data: ProfileTagsUpdateRequest) => {
  const response = await axiosInstance.put<ProfileTagsUpdateResponse>(
    "/api/profile/tags",
    data,
    { params: { userId } }
  );
  return response.data;
};

// 공개 여부 수정 [PATCH] (/api/profile/me/privacy)
export const updateProfilePrivacy = async (userId: number, data: ProfilePrivacyUpdateRequest) => {
  const response = await axiosInstance.patch<ProfilePrivacyUpdateResponse>(
    "/api/profile/me/privacy",
    data,
    { params: { userId } }
  );
  return response.data;
};

// 팔로워 목록 조회 [GET] (/api/follow/me/followers)
export const getFollowers = async (userId: number) => {
  const response = await axiosInstance.get<FollowListResponse>(
    "/api/follow/me/followers",
    { params: { userId } }
  );
  return response.data;
};

// 팔로잉 목록 조회 [GET] (/api/follow/me/followings)
export const getFollowings = async (userId: number) => {
  const response = await axiosInstance.get<FollowListResponse>(
    "/api/follow/me/followings",
    { params: { userId } }
  );
  return response.data;
};

// 마이페이지 환경설정 [GET] (/api/profile/me/settings)
export const getSettingInfo = async (userId: number) => {
  const response = await axiosInstance.get<SettingInfoResponse>(
    "/api/profile/me/settings",
    { params: { userId } }
  );
  return response.data;
};

// 로그아웃 API [POST] (/api/auth/logout)
export const logout = async (loginUserId: number) => {
  // 현재 브라우저에 발급된 Firebase Installation ID(FID)
  const deviceId = await getId(installations);

  const response = await axiosInstance.post("/api/auth/logout", { deviceId }, {
    params: { loginUserId },
  });
  return response.data;
};

// 비밀번호 변경 [PATCH] (/api/profile/password)
export const changePassword = async (userId: number, data: ChangePasswordRequest) => {
  await axiosInstance.patch("/api/profile/password", data, {
    params: { userId },
  });
};
