export type AuthorProfile = {
  id: string;
  name: string;
  major: string;
  studentId: string;
  isAlumni?: boolean;
  yearLevel?: number;
  profileImageUrl?: string | null;
};

export type CommentAuthor = AuthorProfile & {
  profileImageUrl?: string | null;
};

export type CommentItem = {
  id: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
  // 삭제 여부를 본문 문자열이 아닌 author=null 응답에서 명시적으로 보존한다.
  isDeleted?: boolean;
  replies?: CommentItem[];
};

export type InfoPost = {
  id: string;
  author: AuthorProfile;
  categories: string[];
  title: string;
  content: string;
  imageUrl?: string;
  thumbnailUrl?: string | null;
  authorProfileImageUrl?: string;
  postImageUrl?: string;
  likes: number;
  saveCount: number;
  comments: number;
  createdAt: string;
  accessStatus?: import('../api-types/communityApiTypes').CommunityAccessStatus;
  requiredPoints?: number;
};

export type QuestionPost = {
  id: string;
  author: AuthorProfile;
  categories: string[];
  title: string;
  content: string;
  imageUrl?: string;
  thumbnailUrl?: string | null;
  likes: number;
  saveCount: number;
  answers: number;
  isAdopted: boolean;
  createdAt: string;
  accessStatus: import('../api-types/communityApiTypes').CommunityAccessStatus;
  accessType?: 'FREE' | 'POINT_REQUIRED';
  requiredPoints: number;
  myPoints: number;
};

export type CommunityPostDetail = {
  id: string;
  boardType: string;
  title: string;
  likes: number;
  comments: number;
  saveCount: number;
  bookmarked?: boolean;
  isAdopted: boolean;
  adoptedCommentId?: string;
  createdAt: string;
  author: CommentAuthor;
  content: string;
  tagIds?: number[];
  categories: string[];
  postImages?: string[];
  attachments?: {
    attachmentId: number;
    sortOrder: number;
    fileKey: string;
    downloadUrl: string;
    width: number;
    height: number;
    fileSize: number;
  }[];
  accessStatus?: import('../api-types/communityApiTypes').CommunityAccessStatus;
  requiredPoints?: number;
  myPoints?: number;
};
