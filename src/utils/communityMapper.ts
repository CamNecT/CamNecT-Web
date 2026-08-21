import type {
  CommunityPostCommentResponse,
  CommunityPostDetailResponse,
  CommunityPostItem,
} from "../api-types/communityApiTypes";
import type { CommentItem, CommunityPostDetail, InfoPost, QuestionPost } from "../types/community";

const buildAuthor = () => ({
  id: "unknown",
  name: "알 수 없음",
  major: "",
  studentId: "",
});

const sliceStudentNo = (studentNo?: string | null) => {
  if (!studentNo) return "";
  const value = String(studentNo);
  if (value.length < 4) return "";
  return value.slice(2, 4);
};

const mapCommentAuthorFromApi = (comment: CommunityPostCommentResponse) => {
  const fallback = buildAuthor();
  if (!comment.author) {
    // 삭제 댓글은 프로필을 숨기되 운영 식별용 userId는 화면 모델에 보존한다.
    return { ...fallback, id: String(comment.userId) };
  }
  return {
    ...fallback,
    id: String(comment.author.userId ?? comment.userId),
    name: comment.author.name ?? fallback.name,
    major: comment.author.majorName ?? fallback.major,
    studentId: sliceStudentNo(comment.author.studentNo),
    yearLevel: comment.author.yearLevel,
    profileImageUrl: comment.author.profileImageUrl ?? null,
  };
};

const mapAuthorFromApi = (post: CommunityPostItem) => {
  return {
    id: String(post.author.userId),
    name: post.author.name,
    major: post.author.majorName,
    studentId: sliceStudentNo(post.author.studentNo),
    yearLevel: post.author.yearLevel,
    profileImageUrl: post.author.profileImageUrl,
  };
};

export const mapToInfoPost = (post: CommunityPostItem): InfoPost => ({
  id: String(post.postId),
  author: {
    ...mapAuthorFromApi(post),
    isAlumni: true,
  },
  categories: post.tags,
  title: post.title,
  content: post.preview,
  thumbnailUrl: post.thumbnailUrl ?? null,
  likes: post.likeCount,
  saveCount: post.bookmarkCount,
  comments: post.commentCount,
  createdAt: post.createdAt,
  accessStatus: post.accessStatus ?? "GRANTED",
  requiredPoints: post.requiredPoints,
});

export const mapToQuestionPost = (post: CommunityPostItem): QuestionPost => ({
  id: String(post.postId),
  author: mapAuthorFromApi(post),
  categories: post.tags,
  title: post.title,
  content: post.preview,
  thumbnailUrl: post.thumbnailUrl ?? null,
  likes: post.likeCount,
  saveCount: post.bookmarkCount,
  answers: post.answerCount,
  isAdopted: post.acceptedBadge ?? post.accepted ?? false,
  createdAt: post.createdAt,
  accessStatus: post.accessStatus ?? "NEED_PURCHASE",
  accessType: post.accessType,
  requiredPoints: post.requiredPoints ?? 0,
  myPoints: post.myPoints ?? 0,
});

export const mapToCommunityPostDetail = (
  post: CommunityPostDetailResponse,
  mapTagIdToName?: (tagId: number) => string | undefined,
): CommunityPostDetail => ({
  id: String(post.postId),
  boardType: post.boardCode === "INFO" ? "정보" : "질문",
  title: post.title,
  likes: post.likeCount,
  comments: 0,
  saveCount: post.bookmarkCount,
  bookmarked: post.bookmarked ?? false,
  isAdopted: Boolean(post.acceptedCommentId),
  adoptedCommentId: post.acceptedCommentId ? String(post.acceptedCommentId) : undefined,
  createdAt: post.createdAt,
  accessStatus: post.accessStatus,
  requiredPoints: post.requiredPoints,
  myPoints: post.myPoints,
  tagIds: post.tagIds,
  author: {
    id: String(post.author.userId),
    name: post.author.name,
    major: post.author.majorName,
    studentId: sliceStudentNo(post.author.studentNo),
    yearLevel: post.author.yearLevel,
    profileImageUrl: post.author.profileImageUrl,
  },
  content: post.content,
  categories: mapTagIdToName
    ? post.tagIds
        .map(mapTagIdToName)
        .filter((tagName): tagName is string => Boolean(tagName))
    : [],
  attachments: post.attachments ?? [],
  postImages: post.attachments
    ?.filter((attachment) => {
      const key = attachment.fileKey.toLowerCase();
      return (
        attachment.downloadUrl &&
        (key.endsWith(".png") ||
          key.endsWith(".jpg") ||
          key.endsWith(".jpeg") ||
          key.endsWith(".webp"))
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((attachment) => attachment.downloadUrl),
});

export const mapFlatCommentsToTree = (
  comments: CommunityPostCommentResponse[],
): CommentItem[] => {
  const nodes = new Map<number, CommentItem>();
  const roots: CommentItem[] = [];

  // 서버가 루트와 대댓글을 한 배열로 주므로 먼저 모든 노드를 만들어 순서 의존성을 없앤다.
  comments.forEach((comment) => {
    nodes.set(comment.commentId, {
      id: String(comment.commentId),
      author: mapCommentAuthorFromApi(comment),
      content: comment.content,
      createdAt: comment.createdAt,
      isDeleted: comment.author === null,
      replies: [],
    });
  });

  // parentCommentId가 없으면 루트, 있으면 해당 루트 스레드의 replies로 묶는다.
  comments.forEach((comment) => {
    const node = nodes.get(comment.commentId);
    if (!node) return;
    const parentId = comment.parentCommentId;
    if (parentId && nodes.has(parentId)) {
      const parent = nodes.get(parentId);
      if (!parent) return;
      parent.replies = [...(parent.replies ?? []), node];
    } else {
      roots.push(node);
    }
  });

  return roots.map((root) => ({
    ...root,
    replies: root.replies && root.replies.length > 0 ? root.replies : undefined,
  }));
};
