import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import type { CommentAuthor, CommentItem } from '../../../types/community';
import {
  findCommentContent,
  formatCommentDate,
  formatCommentDisplayDate,
  removeCommentById,
  updateCommentContent,
} from '../utils/comment';
import { generateId } from '../../../utils/uuid';

type ReplyTarget = { id: string; name: string };

// 줄바꿈과 탭은 댓글 본문에서 허용하되 서버가 거절하는 나머지 제어문자는 입력 단계에서 제거한다.
const sanitizeCommentContent = (value: string) =>
  Array.from(value)
    .filter((character) => {
      if (character === '\r' || character === '\n' || character === '\t') return true;
      const code = character.charCodeAt(0);
      return code > 31 && !(code >= 127 && code <= 159);
    })
    .join('');

type UseCommentActionsParams = {
  currentUser: CommentAuthor;
  initialComments?: CommentItem[];
  resetKey?: string;
  isLockedQuestion: boolean;
  isQuestionPost: boolean;
  isAdopted: boolean;
  adoptedCommentId?: string;
  onSubmitCommentApi?: (payload: {
    content: string;
    parentCommentId: string | null;
  }) => Promise<void>;
  onDeleteCommentApi?: (commentId: string) => Promise<void>;
  onUpdateCommentApi?: (payload: { commentId: string; content: string }) => Promise<void>;
};

// 댓글 작성/편집/답글/정렬에 필요한 상태와 핸들러 제공
export const useCommentActions = ({
  currentUser,
  initialComments = [],
  resetKey,
  isLockedQuestion,
  isQuestionPost,
  isAdopted,
  adoptedCommentId,
  onSubmitCommentApi,
  onDeleteCommentApi,
  onUpdateCommentApi,
}: UseCommentActionsParams) => {
  const [commentContent, setCommentContent] = useState('');
  const [commentList, setCommentList] = useState<CommentItem[]>(initialComments);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [replyFocusToken, setReplyFocusToken] = useState(0);
  const highlightTimerRef = useRef<number | null>(null);
  const setSafeCommentContent = (value: string) =>
    setCommentContent(sanitizeCommentContent(value));
  const setSafeEditingCommentContent = (value: string) =>
    setEditingCommentContent(sanitizeCommentContent(value));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCommentList(initialComments);
  }, [initialComments, resetKey]);

  // 채택된 댓글을 상단에 고정하는 정렬 로직
  const sortedComments = useMemo(() => {
    if (isQuestionPost && isAdopted && adoptedCommentId) {
      return [
        ...commentList.filter((comment) => comment.id === adoptedCommentId),
        ...commentList.filter((comment) => comment.id !== adoptedCommentId),
      ];
    }
    return commentList;
  }, [adoptedCommentId, commentList, isAdopted, isQuestionPost]);

  const commentCount = useMemo(
    () =>
      commentList.reduce(
        (count, comment) => count + 1 + (comment.replies?.length ?? 0),
        0,
      ),
    [commentList],
  );

  const highlightComment = useCallback((commentId: string) => {
    setHighlightedCommentId(commentId);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedCommentId(null);
      highlightTimerRef.current = null;
    }, 3000);
  }, []);

  const handleReplyClick = (comment: CommentItem) => {
    if (replyTarget?.id === comment.id) {
      setReplyTarget(null);
      setHighlightedCommentId(null);
      return;
    }
    setReplyTarget({ id: comment.id, name: comment.author.name });
    setReplyFocusToken((prev) => prev + 1);
    highlightComment(comment.id);
  };

  // 댓글 등록 (답글 포함)
  const handleSubmitComment = (event?: SyntheticEvent) => {
    event?.preventDefault();
    if (isLockedQuestion) return;
    // 댓글과 대댓글 모두 동일한 서버 제한(공백-only 금지, 최대 5,000자)을 적용한다.
    if (!commentContent.trim() || commentContent.length > 5000) return;
    if (onSubmitCommentApi) {
      onSubmitCommentApi({
        content: commentContent,
        parentCommentId: replyTarget?.id ?? null,
      }).finally(() => {
        setCommentContent('');
        setReplyTarget(null);
      });
      return;
    }
    const now = new Date();
    const newComment: CommentItem = {
      id: `comment-${generateId()}`,
      author: { ...currentUser },
      content: commentContent,
      createdAt: formatCommentDate(now),
    };
    if (replyTarget) {
      setCommentList((prev) =>
        prev.map((comment) =>
          comment.id === replyTarget.id
            ? { ...comment, replies: [...(comment.replies ?? []), newComment] }
            : comment,
        ),
      );
      setReplyTarget(null);
    } else {
      setCommentList((prev) => [...prev, newComment]);
    }
    setCommentContent('');
  };

  // 댓글 편집 취소/저장
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleSaveEdit = () => {
    if (
      !editingCommentId ||
      !editingCommentContent.trim() ||
      editingCommentContent.length > 5000
    ) {
      handleCancelEdit();
      return;
    }
    if (onUpdateCommentApi) {
      onUpdateCommentApi({ commentId: editingCommentId, content: editingCommentContent }).finally(() => {
        handleCancelEdit();
      });
      return;
    }
    setCommentList((prev) =>
      updateCommentContent(prev, editingCommentId, editingCommentContent),
    );
    handleCancelEdit();
  };

  // 댓글 삭제
  const deleteComment = (commentId: string) => {
    const cleanup = () => {
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentContent('');
      }
      if (replyTarget?.id === commentId) {
        setReplyTarget(null);
        setHighlightedCommentId(null);
      }
    };

    if (onDeleteCommentApi) {
      onDeleteCommentApi(commentId).finally(cleanup);
      return;
    }
    setCommentList((prev) => removeCommentById(prev, commentId));
    cleanup();
  };

  // 편집 대상 댓글 본문 로드
  const startEditingComment = (commentId: string) => {
    const existingContent = findCommentContent(commentList, commentId);
    if (existingContent !== null) {
      setEditingCommentId(commentId);
      setEditingCommentContent(existingContent);
    }
  };

  // 하이라이트 타이머 정리
  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );

  // 게시글 전환 시에만 작성/편집 초안을 초기화한다.
  // 댓글 다음 페이지가 붙어 initialComments가 바뀌는 경우에는 사용자가 쓰던 초안을 보존한다.
  useEffect(() => {
    if (!resetKey) return;
    const resetTimer = window.setTimeout(() => {
      setCommentContent('');
      setEditingCommentId(null);
      setEditingCommentContent('');
      setReplyTarget(null);
      setHighlightedCommentId(null);
      setReplyFocusToken(0);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [resetKey]);

  return {
    commentContent,
    setCommentContent: setSafeCommentContent,
    commentList,
    commentCount,
    sortedComments,
    editingCommentId,
    editingCommentContent,
    setEditingCommentContent: setSafeEditingCommentContent,
    highlightedCommentId,
    replyTarget,
    replyFocusToken,
    highlightComment,
    handleReplyClick,
    handleSubmitComment,
    handleSaveEdit,
    handleCancelEdit,
    deleteComment,
    startEditingComment,
    formatCommentDisplayDate,
  };
};
