import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../../../api/profileApi";
import { getMajor, getInstitution } from "../../../api/institutionApi";
import { 
  mapToPortfolios, 
  mapToEducations, 
  mapToCareers, 
  mapToCertificates 
} from "../utils/profileMapper";
import { type ProfileEditData } from "../../../types/mypage/profileEditTypes";

export function useProfileEdit(userId: number | null) {
    // 프로필 데이터 조회
    const { data: profileResponse, isLoading, isError } = useQuery({
        queryKey: ["myProfile", userId],
        queryFn: () => getMyProfile({ loginUserId: userId! }),
        enabled: !!userId,
    });

    const profileData = profileResponse?.data;

    // 학교 정보 조회
    const { data: institutionResponse } = useQuery({
        queryKey: ["institution", profileData?.basics.institutionId],
        queryFn: () => getInstitution({
            institutionId: profileData!.basics.institutionId,
        }),
        enabled: !!profileData?.basics.institutionId,
    });

    // 전공 정보 조회
    const { data: majorResponse } = useQuery({
        queryKey: ["major", profileData?.basics.institutionId, profileData?.basics.majorId],
        queryFn: () => getMajor({
            institutionId: profileData!.basics.institutionId,
            majorId: profileData!.basics.majorId,
        }),
        enabled: !!profileData?.basics.institutionId && !!profileData?.basics.majorId,
    });

    const institutionData = institutionResponse?.data;
    const majorData = majorResponse?.data;

    const initialData = useMemo<ProfileEditData | null>(() => {
        if (!profileData) return null;

        const schoolName = institutionData?.nameKor || "";
        const majorName = majorData?.nameKor || "";

        return {
            user: {
                uid: profileData.userId.toString(),
                name: profileData.name,
                profileImg: profileData.basics.profileImageUrl ?? null,
                univ: schoolName,
                major: majorName,
                gradeNumber: profileData.basics.studentNo.slice(2, 4),
                userTags: profileData.tags.map((t) => t.id),
                introduction: profileData.basics.bio || "",
                following: profileData.following,
                follower: profileData.follower,
                point: profileData.myPoint,
            },
            visibility: {
                isFollowerVisible: profileData.basics.isFollowerVisible,
                educationVisibility: profileData.basics.isEducationVisible,
                careerVisibility: profileData.basics.isExperienceVisible,
                certificateVisibility: profileData.basics.isCertificateVisible,
            },
            educations: mapToEducations(profileData),
            careers: mapToCareers(profileData),
            certificates: mapToCertificates(profileData),
            portfolios: mapToPortfolios(profileData),
        };
    }, [profileData, institutionData, majorData]);
    
    // 현재 수정 중인 데이터
    const [data, setData] = useState<ProfileEditData | null>(null);

    const effectiveData = data ?? initialData;

    const hasChanges = useMemo(() => {
        if (!effectiveData || !initialData) return false;
        return JSON.stringify(effectiveData) !== JSON.stringify(initialData);
    }, [effectiveData, initialData]);

    return { 
        data: effectiveData, 
        setData,
        hasChanges,
        originalData: initialData,
        isLoading,
        isError,
    };
}