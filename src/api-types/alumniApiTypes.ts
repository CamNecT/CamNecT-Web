export type AlumniTagAttribute = {
  id: number;
  name: string;
};

export type AlumniTag = {
  id: number;
  name: string;
  type: string;
  category: string;
  active: boolean;
  createdAt: string;
  attribute: AlumniTagAttribute;
};

export type AlumniUserProfile = {
  userId: number;
  bio: string | null;
  openToCoffeeChat: boolean;
  isFollowerVisible: boolean;
  isEducationVisible: boolean;
  isExperienceVisible: boolean;
  isCertificateVisible: boolean;
  profileImageUrl: string | null;
  studentNo: string | null;
  yearLevel: number | null;
  institutionId: number | null;
  majorId: number | null;
};

export type AlumniApiItem = {
  userId: number;
  userName?: string | null;
  userProfile: AlumniUserProfile;
  tagList: AlumniTag[] | string[];
};

export type AlumniApiResponse = {
  status: number;
  message: string;
  data: {
    content: AlumniApiItem[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
        sorted: boolean;
        empty: boolean;
        unsorted: boolean;
      };
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
    size: number;
    number: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  };
};

export type AlumniProfileBasics = {
  bio: string;
  openToCoffeeChat: boolean;
  isFollowerVisible: boolean;
  isEducationVisible: boolean;
  isExperienceVisible: boolean;
  isCertificateVisible: boolean;
  profileImageUrl: string | null;
  studentNo: string | null;
  institutionId: number;
  majorId: number;
};

export type AlumniProfilePortfolio = {
  portfolioId: number;
  title: string;
  thumbnailUrl: string;
  isPublic: boolean;
  isFavorite: boolean;
};

export type AlumniProfileEducation = {
  educationId: number;
  schoolName: string;
  campusId: number | null;
  campusName: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  description: string | null;
};

export type AlumniProfileExperience = {
  experienceId: number;
  companyName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string[];
};

export type AlumniProfileCertificate = {
  certificateId: number;
  certificateName: string;
  acquiredDate: string;
  credentialUrl: string;
};

export type AlumniProfileTag = {
  id: number;
  name: string;
  categoryCode: string;
};

export type AlumniProfileDetail = {
  userId: number;
  name: string;
  basics: AlumniProfileBasics;
  isFollowing: boolean;
  following: number;
  follower: number;
  myPoint?: number;
  portfolioProjectList: AlumniProfilePortfolio[];
  educations: AlumniProfileEducation[];
  experience: AlumniProfileExperience[];
  certificate: AlumniProfileCertificate[];
  tags: AlumniProfileTag[];
};

export type AlumniProfileDetailResponse = {
  status: number;
  message: string;
  data: AlumniProfileDetail;
};

export type AlumniPortfolioListItem = {
  portfolioId: number;
  title: string;
  thumbnailUrl: string;
  isPublic: boolean;
  isFavorite: boolean;
  updatedAt: string;
};

export type AlumniPortfolioListPayload = {
  isMine: boolean;
  data: AlumniPortfolioListItem[];
};

export type AlumniPortfolioListResponse = {
  status: number;
  message: string;
  data: AlumniPortfolioListPayload;
};

export type AlumniPortfolioDetailItem = {
  portfolioId: number;
  userId: number;
  title: string;
  thumbnailUrl: string;
  startDate: string;
  endDate: string;
  description: string;
  isPublic: boolean;
  isFavorite: boolean;
  projectField: string[];
  assignedRole: string[];
  techStack: string[];
  review: string;
  createdAt: string;
  updatedAt: string;
};

export type AlumniPortfolioAsset = {
  assetId: number;
  type: string;
  fileKey: string;
  fileUrl: string;
  sortOrder: number;
  createdAt: string;
};

export type AlumniPortfolioDetailPayload = {
  isMine: boolean;
  data: {
    portfolio: AlumniPortfolioDetailItem;
    portfolioAssets: AlumniPortfolioAsset[];
  };
};

export type AlumniPortfolioDetailResponse = {
  status: number;
  message: string;
  data: AlumniPortfolioDetailPayload;
};

export type AlumniEducationItem = {
  educationId: number;
  schoolName: string;
  campusId: number | null;
  campusName: string | null;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
};

export type AlumniEducationListResponse = {
  status: number;
  message: string;
  data: AlumniEducationItem[];
};

export type AlumniCertificateItem = {
  certificateId: number;
  certificateName: string;
  acquiredDate: string;
  credentialUrl: string;
};

export type AlumniCertificateListResponse = {
  status: number;
  message: string;
  data: AlumniCertificateItem[];
};

export type CoffeeChatRequestBody = {
  receiverId: number;
  tagIds: number[];
  content: string;
};

export type CoffeeChatRequestResponse = {
  status: number;
  message: string;
  data: string;
};
