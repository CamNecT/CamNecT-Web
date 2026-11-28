import type { HomeRequest, HomeResponse } from "../api-types/homeApiTypes";
import { axiosInstance } from "./axiosInstance";

// 홈 정보 조회 API [GET] (/api/home)
export const requestHome = async (data: HomeRequest, signal?: AbortSignal) => {
    const response = await axiosInstance.get<HomeResponse>("/api/home", {
        params: data,
        signal,
    });
    return response.data;
};
