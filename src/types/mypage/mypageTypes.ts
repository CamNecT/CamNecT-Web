export type EducationStatus = 'ATTENDING' | 'LEAVE_OF_ABSENCE' | 'GRADUATED' | 'EXCHANGE' | 'DROPPED_OUT' | 'TRANSFERRED';
// User 공통 인터페이스 
export interface User {
  uid: string; 
  name: string; 
  profileImg: string | null;
  univ: string;
  major: string; 
  gradeNumber: string; 
  userTags: number[]; 
  introduction: string;
  following: number;
  follower: number;
  point: number; 
}

export type UserPreview = Omit<User, "userTags"|"introduction"|"point"|"univ">;

export interface UserProfile extends User {
  followingList: UserPreview[];
  followerList: UserPreview[];
}

export interface EducationItem {
  id: string;
  school: string;
  status: EducationStatus;
  startYear: number;
  endYear?: number;
}

export interface CareerItem {
  id: string;
  organization: string;
  positions: string[];
  startYear: number;
  startMonth: number;
  endYear?: number;
  endMonth?: number;
}

export interface CertificateItem {
  id: string;
  name: string;
  acquiredYear: number;
  acquiredMonth: number;
}

export interface ProfileVisibility {
  isFollowerVisible: boolean;
  educationVisibility: boolean;
  careerVisibility: boolean;
  certificateVisibility: boolean;
}

//프로필 상세(학력/경력/자격증 등)까지 포함
export interface UserProfileDetail {
  user: User;
  visibility: ProfileVisibility;
  educations: EducationItem[];
  careers: CareerItem[];
  certificates: CertificateItem[];
}

export const EDUCATION_STATUS_KR: Record<EducationStatus, string> = {
  ATTENDING: "재학",
  LEAVE_OF_ABSENCE: "휴학",
  EXCHANGE: "교환",
  GRADUATED: "졸업",
  DROPPED_OUT: "중퇴",
  TRANSFERRED: "편입"
};

//작성/북마크한 글(커뮤니티)
export type CommunityPostItem = {
    postId: number;
    boardCode: "INFO" | "QUESTION";
    title: string;
    preview: string;
    createdAt: string;
    likeCount: number;
    answerCount: number;
    commentCount: number;
    bookmarkCount: number;
    acceptedBadge?: boolean;
    tags: string[];
    thumbnailUrl?: string | null;
    // 익명 게시글은 마이페이지 목록에서도 작성자 프로필을 표시하지 않는다.
    author: {
      userId: number;
      name: string;
      profileImageUrl: string | null;
      studentNo: string;
      majorName: string;
    } | null;
    accessType?: "FREE" | "POINT_REQUIRED";
    // 보호 콘텐츠 노출은 accessType 대신 이 상태로 결정한다.
    accessStatus?: import("../../api-types/communityApiTypes").CommunityAccessStatus;
};
