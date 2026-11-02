export type AlumniProfile = {
  id: string;
  userId: string;
  author: {
    name: string;
    major: string;
    studentId: string;
  };
  profileImage?: string;
  privacy: {
    showFollowStats: boolean;
    showPortfolio: boolean;
    showEducation: boolean;
    showCareer: boolean;
    showCertificates: boolean;
    openToCoffeeChat: boolean;
  };
  portfolioItems: {
    id: string;
    title: string;
    subtitle?: string | null;
    image?: string;
  }[];
  educationItems: {
    id: string;
    period: string;
    school: string;
    status: string;
  }[];
  careerItems: {
    id: string;
    period: string;
    company: string;
    tasks: string[];
  }[];
  certificateItems: {
    id: string;
    date: string;
    name: string;
  }[];
  isFollowing: boolean;
  categories: string[];
  intro: string;
  followingCount: number;
  followerCount: number;
};
