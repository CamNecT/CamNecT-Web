import type { AlumniApiItem, AlumniProfileDetail } from "../api-types/alumniApiTypes";
import type { AlumniProfile } from "../types/alumni/alumniTypes";
import { mapMajorIdToName } from "./majorMapper";
import { formatEducationSchoolName } from "../constants/institutionCampusMapping";

const toProfileImage = (url?: string | null) => (url && url.trim() ? url : undefined);

const resolveName = (item: AlumniApiItem) => {
  const name = item.userName?.trim();
  if (name) return name;
  return `사용자 ${item.userId}`;
};

const resolveMajor = (majorId: number | null) => mapMajorIdToName(majorId);

const resolveStudentId = (studentNo: string | null, yearLevel: number | null) => {
  const trimmedStudentNo = studentNo?.trim();
  if (trimmedStudentNo) {
    return trimmedStudentNo.length >= 4 ? trimmedStudentNo.slice(2, 4) : trimmedStudentNo;
  }
  if (yearLevel) return String(yearLevel);
  return "";
};

export const mapAlumniApiItemToProfile = (item: AlumniApiItem): AlumniProfile => {
  const { userProfile, tagList } = item;
  const userIdString = String(item.userId);
  const tagNames = Array.isArray(tagList)
    ? tagList
        .map((tag) => (typeof tag === "string" ? tag : tag.name))
        .filter((name): name is string => Boolean(name && name.trim()))
    : [];
  return {
    id: `alumni-${userIdString}`,
    userId: userIdString,
    author: {
      name: resolveName(item),
      major: resolveMajor(userProfile.majorId),
      studentId: resolveStudentId(userProfile.studentNo, userProfile.yearLevel),
    },
    profileImage: toProfileImage(userProfile.profileImageUrl),
    privacy: {
      showFollowStats: userProfile.isFollowerVisible,
      showPortfolio: true,
      showEducation: userProfile.isEducationVisible,
      showCareer: userProfile.isExperienceVisible,
      showCertificates: userProfile.isCertificateVisible,
      openToCoffeeChat: userProfile.openToCoffeeChat,
    },
    portfolioItems: [],
    educationItems: [],
    careerItems: [],
    certificateItems: [],
    isFollowing: false,
    categories: Array.from(new Set(tagNames)),
    intro: userProfile.bio ?? "",
    followingCount: 0,
    followerCount: 0,
  };
};

export const mapAlumniApiListToProfiles = (items: AlumniApiItem[]): AlumniProfile[] =>
  items
    .filter((item) => item.userId !== 2)
    .map(mapAlumniApiItemToProfile);

const formatEducationPeriod = (startDate: string, endDate?: string) => {
  const startYear = parseInt(startDate.split('-')[0]);
  const endYear = endDate ? parseInt(endDate.split('-')[0]) : undefined;
  return `${startYear}${endYear ? `-${endYear}` : '-현재'}`;
};

const formatCareerPeriod = (startDate: string, endDate?: string) => {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const endYear = endDate ? parseInt(endDate.split('-')[0]) : undefined;
  const endMonth = endDate ? parseInt(endDate.split('-')[1]) : undefined;
  return `${startYear}.${String(startMonth).padStart(2, '0')}-${
            endYear && endMonth 
            ? `${endYear}.${String(endMonth).padStart(2, '0')}`
            : '현재'
        }`;
};

const formatCertificatePeriod = (acquiredDate: string) => {
  const [year, month] = acquiredDate.split('-').map(Number);
  return `${year}.${String(month || 1).padStart(2, '0')}`
};

export const EDUCATION_STATUS_KR: Record<string, string> = {
  "ATTENDING": "재학",
  "LEAVE_OF_ABSENCE": "휴학",
  "EXCHANGE": "교환",
  "GRADUATED": "졸업",
  "DROPPED_OUT": "중퇴",
  "TRANSFERRED": "편입"
};

export const mapAlumniProfileDetailToProfile = (
  detail: AlumniProfileDetail
): AlumniProfile => {
  const userIdString = String(detail.userId);
  const showEducation =
    detail.basics.isEducationVisible && detail.educations.length > 0;
  const showCareer =
    detail.basics.isExperienceVisible && detail.experience.length > 0;
  const showCertificates =
    detail.basics.isCertificateVisible && detail.certificate.length > 0;
  return {
    id: `alumni-${userIdString}`,
    userId: userIdString,
    author: {
      name: detail.name,
      major: resolveMajor(detail.basics.majorId),
      studentId: resolveStudentId(detail.basics.studentNo, 0),
    },
    profileImage: toProfileImage(detail.basics.profileImageUrl),
    privacy: {
      showFollowStats: detail.basics.isFollowerVisible,
      showPortfolio: true,
      showEducation,
      showCareer,
      showCertificates,
      openToCoffeeChat: detail.basics.openToCoffeeChat,
    },
    portfolioItems: detail.portfolioProjectList
      .filter((item) => item.isPublic)
      .map((item) => ({
        id: String(item.portfolioId),
        title: item.title,
        image: item.thumbnailUrl || undefined,
      })),
    educationItems: detail.educations.map((item) => ({
      id: String(item.educationId),
      period: formatEducationPeriod(item.startDate, item.endDate ?? undefined),
      school: formatEducationSchoolName(item.schoolName, item.campusName, item.campusId),
      status: EDUCATION_STATUS_KR[item.status] ?? item.status,
    })),
    careerItems: detail.experience.map((item) => ({
      id: String(item.experienceId),
      period: formatCareerPeriod(item.startDate, item.endDate),
      company: item.companyName,
      tasks: item.responsibilities,
    })),
    certificateItems: detail.certificate.map((item) => ({
      id: String(item.certificateId),
      date: formatCertificatePeriod(item.acquiredDate),
      name: item.certificateName,
    })),
    isFollowing: detail.isFollowing,
    categories: Array.from(
      new Set(detail.tags.map((tag) => tag.name).filter((name) => name && name.trim()))
    ),
    intro: detail.basics.bio ?? "",
    followingCount: detail.following,
    followerCount: detail.follower,
  };
};
