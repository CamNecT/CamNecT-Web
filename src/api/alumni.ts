import { axiosInstance } from "./axiosInstance";
import type {
  AlumniApiResponse,
  AlumniCertificateListResponse,
  AlumniEducationListResponse,
  AlumniPortfolioListResponse,
  AlumniPortfolioDetailResponse,
  AlumniProfileDetailResponse,
  CoffeeChatRequestBody,
  CoffeeChatRequestResponse,
} from "../api-types/alumniApiTypes";

export type AlumniSearchParams = {
  name?: string;
  tags?: number[];
  userId?: number;
  page?: number;
  size?: number;
  signal?: AbortSignal;
};

export const getAlumniList = async (
  params: AlumniSearchParams
): Promise<AlumniApiResponse> => {
  const response = await axiosInstance.get<AlumniApiResponse>("/api/alumni", {
    params: {
      userId: params.userId,
      name: params.name,
      tags: params.tags,
      page: params.page,
      size: params.size,
    },
    paramsSerializer: (p) => {
      const searchParams = new URLSearchParams();
      Object.entries(p).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      });
      return searchParams.toString();
    },
    signal: params.signal,
  });
  return response.data;
};

export type AlumniProfileParams = {
  loginUserId: number;
  profileUserId: number;
};

export const getAlumniProfileDetail = async (
  params: AlumniProfileParams
): Promise<AlumniProfileDetailResponse> => {
  const response = await axiosInstance.get<AlumniProfileDetailResponse>(
    `/api/profile/${params.profileUserId}`,
    {
      params: {
        loginUserId: params.loginUserId,
      },
    }
  );
  return response.data;
};

export type AlumniPortfolioParams = {
  userId: number;
  portfolioUserId: number;
};

export type AlumniPortfolioDetailParams = {
  userId: number;
  portfolioUserId: number;
  portfolioId: number;
};

export const getAlumniPortfolioList = async (
  params: AlumniPortfolioParams
): Promise<AlumniPortfolioListResponse> => {
  const response = await axiosInstance.get<AlumniPortfolioListResponse>(
    `/api/portfolio/${params.portfolioUserId}`,
    {
      params: {
        userId: params.userId,
        portfolioUserId: params.portfolioUserId,
      },
    }
  );
  return response.data;
};

export const getAlumniPortfolioDetail = async (
  params: AlumniPortfolioDetailParams
): Promise<AlumniPortfolioDetailResponse> => {
  const response = await axiosInstance.get<AlumniPortfolioDetailResponse>(
    `/api/portfolio/${params.portfolioUserId}/${params.portfolioId}`,
    {
      params: {
        userId: params.userId,
        portfolioUserId: params.portfolioUserId,
        portfolioId: params.portfolioId,
      },
    }
  );
  return response.data;
};

export type AlumniUserDataParams = {
  userId: number;
};

export const getAlumniEducations = async (
  params: AlumniUserDataParams
): Promise<AlumniEducationListResponse> => {
  const response = await axiosInstance.get<AlumniEducationListResponse>(
    "/api/user/me/educations",
    {
      params: {
        userId: params.userId,
      },
    }
  );
  return response.data;
};

export const getAlumniCertificates = async (
  params: AlumniUserDataParams
): Promise<AlumniCertificateListResponse> => {
  const response = await axiosInstance.get<AlumniCertificateListResponse>(
    "/api/user/me/certificates",
    {
      params: {
        userId: params.userId,
      },
    }
  );
  return response.data;
};

export type CoffeeChatRequestParams = {
  userId: number;
  receiverId: number;
  tagIds: number[];
  content: string;
};

export type FollowRequestParams = {
  userId: number;
  followingId: number;
};

export const sendCoffeeChatRequest = async (
  params: CoffeeChatRequestParams
): Promise<CoffeeChatRequestResponse> => {
  const body: CoffeeChatRequestBody = {
    receiverId: params.receiverId,
    tagIds: params.tagIds,
    content: params.content,
  };

  const response = await axiosInstance.post<CoffeeChatRequestResponse>(
    "/api/request/send",
    body,
    {
      params: {
        userId: params.userId,
      },
    }
  );

  return response.data;
};

export const followUser = async (params: FollowRequestParams): Promise<unknown> => {
  const response = await axiosInstance.post(
    `/api/follow/${params.followingId}`,
    null,
    {
      params: {
        userId: params.userId,
        followingId: params.followingId,
      },
    }
  );

  return response.data;
};

export const unfollowUser = async (params: FollowRequestParams): Promise<unknown> => {
  const response = await axiosInstance.delete(
    `/api/follow/${params.followingId}`,
    {
      params: {
        userId: params.userId,
        followingId: params.followingId,
      },
    }
  );

  return response.data;
};
