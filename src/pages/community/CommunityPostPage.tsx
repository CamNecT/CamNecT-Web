import type { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { acceptCommunityComment, createCommunityComment, deleteCommunityComment, deleteCommunityPost, getCommunityPostComments, postCommunityBookmark, postCommunityLike, purchaseCommunityPostAccess, updateCommunityComment } from '../../api/community';
import BottomSheetModalPost, {
  type ActionItem,
} from '../../components/BottomSheetModal/BottomSheetModal-post';
import Category from '../../components/Category';
import Icon from '../../components/Icon';
import ImagePopUp from '../../components/ImagePopUp';
import PopUp from '../../components/Pop-up';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { BottomChat } from '../../layouts/BottomChat/BottomChat';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { loggedInUserProfile } from '../../mock/community';
import { useAuthStore } from '../../store/useAuthStore';
import type { CommentItem } from '../../types/community';
import { mapFlatCommentsToTree } from '../../utils/communityMapper';
import CommentListItem from './components/CommentItem';
import LockedQuestionCard from './components/LockedQuestionCard';
import { useCommentActions } from './hooks/useCommentActions';
import { usePost } from './hooks/usePost';
import { findCommentAuthorId } from './utils/comment';
import { isEditOption, type OptionItemId } from './utils/option';
import { formatPostDisplayDate } from './utils/post';
import defaultProfileImg from "../../assets/image/defaultProfileImg.png"
import { getFileName } from '../../utils/getFileName';
import { getServerErrorCode } from '../../utils/getServerErrorCode';
import { COMMUNITY_ERROR_CODES } from '../../constants/serverErrors/communityErrors';
import { useCommunityErrorPopup } from './hooks/useCommunityErrorPopup';
import type {
  CommunityAccessStatus,
  CommunityErrorResponse,
  CommunityPostCommentResponse,
} from '../../api-types/communityApiTypes';

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

type PopUpConfig = {
  type: 'info' | 'warning' | 'confirm' | 'error' | 'loading';
  title: string;
  content?: string;
  titleSecondary?: string;
  leftButtonText?: string;
  rightButtonText?: string;
  buttonText?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  onClick?: () => void;
};

const CommunityPostPage = () => {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const currentUser = {
    ...loggedInUserProfile,
    id: authUser?.id ?? loggedInUserProfile.id,
    name: authUser?.name ?? loggedInUserProfile.name,
  };
  const currentUserIdForOwnership = authUser?.id ?? loggedInUserProfile.id;
  const userId = authUser?.id;
  // 옵션/팝업/이미지 실패 등 화면 단일 상태
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [selectedIsMine, setSelectedIsMine] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'post' | 'comment'>('comment');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [popUpConfig, setPopUpConfig] = useState<PopUpConfig | null>(null);
  const { errorPopup, showCommunityError, closeCommunityError } =
    useCommunityErrorPopup();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('URL 복사가 완료되었습니다');
  const [accessStatusOverride, setAccessStatusOverride] = useState<
    CommunityAccessStatus | null
  >(null);
  const [myPoints, setMyPoints] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  // 댓글 API의 items는 평면 배열이지만 페이지 기준은 루트 스레드이므로,
  // 커서와 원본 배열을 따로 보관한 뒤 화면 렌더 직전에 트리로 변환한다.
  const [commentItemsFromApi, setCommentItemsFromApi] = useState<CommunityPostCommentResponse[]>([]);
  const [commentCursorId, setCommentCursorId] = useState<number | null>(null);
  const [hasNextComments, setHasNextComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentAccessBlocked, setCommentAccessBlocked] = useState(false);
  const commentRequestSeqRef = useRef(0);
  // mutation pending 반영 전 같은 tick에서 들어오는 구매 확인 연타를 즉시 차단합니다.
  const purchasePostAccessPendingRef = useRef(false);
  const closePopUp = () => setPopUpConfig(null);
  // 토스트 표시 제어
  const { isOpen: isToastOpen, isFading: isToastFading, openToast } = useToast();
  // 게시글 파생 상태
  const {
    selectedPost,
    isQuestionPost,
    isPostMine,
    isAdopted,
    showAdoptButton,
    requiredPoints,
    textCount,
    imageCount,
    likedByMe,
    detailError,
    refetchPost,
    isLoading: isDetailLoading,
  } = usePost({ postId });
  // 실제 본문/썸네일 노출 여부는 게시글 정책(accessType)이 아니라
  // 현재 사용자의 열람 결과인 accessStatus만을 기준으로 판단한다.
  const accessStatus =
    accessStatusOverride ??
    selectedPost?.accessStatus ??
    (isPostMine ? 'GRANTED' : 'NEED_PURCHASE');
  const isLockedQuestion =
    !isPostMine && accessStatus !== 'GRANTED';
  // 잠긴 질문글 포인트 구매 API를 mutation으로 관리해 요청 상태와 후처리를 한곳에 둡니다.
  const purchasePostAccessMutation = useMutation({
    mutationFn: (params: { postId: number | string; userId: number }) =>
      purchaseCommunityPostAccess({
        postId: params.postId,
        params: { userId: params.userId },
      }),
    onSuccess: (response) => {
      setMyPoints(response.data.remainingPoints);
      setAccessStatusOverride(response.data.accessStatus);
      refetchPost();
      closePopUp();
      setToastMessage('구매 성공! 이제 질문글을 열람할 수 있어요');
      openToast();
    },
    onError: (error) => {
      closePopUp();
      showCommunityError(error, 'postPurchase');
    },
  });

  // 구매/접근 상태 변동 후 포인트 및 접근 상태를 초기화
  useEffect(() => {
    if (!selectedPost) return;
    const resetTimer = window.setTimeout(() => {
      setAccessStatusOverride(null);
      setMyPoints(selectedPost.myPoints ?? 0);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [selectedPost]);

  // 상세 데이터 기준으로 좋아요/북마크 상태 동기화
  useEffect(() => {
    if (!selectedPost) return;
    setLikeCount(selectedPost.likes ?? 0);
    setBookmarkCount(selectedPost.saveCount ?? 0);
    setIsLiked(likedByMe);
    setIsBookmarked(Boolean(selectedPost.bookmarked));
  }, [selectedPost, likedByMe]);

  const loadComments = useCallback(
    async (append = false) => {
      if (!postId || (append && isLoadingComments)) return;
      const numericPostId = Number(postId);
      if (!Number.isInteger(numericPostId) || numericPostId < 1) return;
      if (append && (!hasNextComments || commentCursorId == null)) return;

      const requestId = ++commentRequestSeqRef.current;
      setIsLoadingComments(true);
      if (!append) {
        // 새로 열기와 새로고침은 이전 커서를 폐기하고 첫 루트 스레드부터 조회한다.
        setCommentItemsFromApi([]);
        setCommentCursorId(null);
        setHasNextComments(false);
        setCommentAccessBlocked(false);
      }

      try {
        const response = await getCommunityPostComments({
          postId: numericPostId,
          params: {
            size: 20,
            ...(append && commentCursorId != null ? { cursorId: commentCursorId } : {}),
          },
        });
        if (requestId !== commentRequestSeqRef.current) return;

        setCommentItemsFromApi((previous) => {
          if (!append) return response.data.items;
          // 루트 댓글의 대댓글이 함께 재등장할 수 있으므로 commentId로 중복을 제거한다.
          const existingIds = new Set(previous.map((comment) => comment.commentId));
          return [
            ...previous,
            ...response.data.items.filter((comment) => !existingIds.has(comment.commentId)),
          ];
        });
        setCommentCursorId(response.data.nextCursorId);
        setHasNextComments(response.data.hasNext);
      } catch (error) {
        if (requestId !== commentRequestSeqRef.current) return;
        const axiosError = error as AxiosError<CommunityErrorResponse>;
        // 숨김·삭제 게시글의 댓글 조회 차단(43925)은 일반 빈 댓글과 구분해 안내한다.
        const isPostAccessBlocked =
          getServerErrorCode(axiosError) === COMMUNITY_ERROR_CODES.postUnavailable;
        setCommentAccessBlocked(isPostAccessBlocked);
        if (!isPostAccessBlocked) {
          showCommunityError(error, 'commentList');
        }
        if (!append) setCommentItemsFromApi([]);
      } finally {
        if (requestId === commentRequestSeqRef.current) setIsLoadingComments(false);
      }
    }, [commentCursorId, hasNextComments, isLoadingComments, postId, showCommunityError],
  );

  useEffect(() => {
    commentRequestSeqRef.current += 1;
    setCommentItemsFromApi([]);
    setCommentCursorId(null);
    setHasNextComments(false);
    setCommentAccessBlocked(false);
    const timer = window.setTimeout(() => void loadComments(false), 0);
    return () => window.clearTimeout(timer);
    // postId 변경 때만 첫 페이지를 새로 가져온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const commentListFromApi = useMemo(
    () => mapFlatCommentsToTree(commentItemsFromApi),
    [commentItemsFromApi],
  );

  const refreshComments = useCallback(async () => {
    await loadComments(false);
  }, [loadComments]);

  // 댓글 상태/액션 묶음
  const {
    commentContent,
    setCommentContent,
    commentList,
    commentCount,
    sortedComments,
    editingCommentId,
    editingCommentContent,
    setEditingCommentContent,
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
  } = useCommentActions({
    currentUser,
    initialComments: commentListFromApi,
    resetKey: postId,
    isLockedQuestion,
    isQuestionPost,
    isAdopted,
    adoptedCommentId: selectedPost?.adoptedCommentId,
    onSubmitCommentApi: async ({ content, parentCommentId }) => {
      if (!userId || !postId) return;
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId < 1) return;
      const numericParentId = parentCommentId ? Number(parentCommentId) : null;
      try {
        await createCommunityComment({
          postId,
          params: { userId: numericUserId },
          body: {
            content,
            parentCommentId: Number.isInteger(numericParentId) && (numericParentId ?? 0) > 0
              ? numericParentId
              : null,
          },
        });
        await refreshComments();
      } catch (error) {
        showCommunityError(error, 'commentCreate');
      }
    },
    onDeleteCommentApi: async (commentId) => {
      if (!userId) return;
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId < 1) return;
      const numericCommentId = Number(commentId);
      if (!Number.isInteger(numericCommentId) || numericCommentId < 1) return;
      try {
        await deleteCommunityComment({
          commentId: numericCommentId,
          params: { userId: numericUserId },
        });
        if (postId) {
          await refreshComments();
        }
      } catch (error) {
        showCommunityError(error, 'commentDelete');
      }
    },
    onUpdateCommentApi: async ({ commentId, content }) => {
      if (!userId) return;
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId < 1) return;
      const numericCommentId = Number(commentId);
      if (!Number.isInteger(numericCommentId) || numericCommentId < 1) return;
      try {
        await updateCommunityComment({
          commentId: numericCommentId,
          params: { userId: numericUserId },
          body: { content },
        });
        if (postId) {
          await refreshComments();
        }
      } catch (error) {
        showCommunityError(error, 'commentUpdate');
      }
    },
  });

  useEffect(() => {
    const commentId = searchParams.get('commentId');
    if (!commentId || !sortedComments.length) return;

    highlightComment(commentId);

    const frameId = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(`comment-${commentId}`);
      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [highlightComment, searchParams, sortedComments.length]);

  const communityErrorPopUpConfig: PopUpConfig | null = errorPopup
    ? {
        type: 'error',
        ...errorPopup,
        onClick: closeCommunityError,
      }
    : null;

  // 로딩 중에는 단일 PopUp만 노출하고, 요청 실패 안내는 기존 확인 팝업보다 우선한다.
  const activePopUpConfig: PopUpConfig | null = isDetailLoading
    ? {
        type: 'loading',
        title: '게시글을 불러오는 중입니다',
      }
    : !userId
      ? {
          type: 'confirm',
          title: '로그인이 필요합니다',
          content: '서비스를 이용하시려면 로그인을 해주세요.',
          buttonText: '로그인하러 가기',
          onClick: () => navigate('/login', { replace: true }),
        }
      : detailError
        ? {
            type: 'error',
            title: '일시적 오류',
            content: '잠시 후 다시 시도해주세요.',
            rightButtonText: '확인',
            onClick: () => navigate(-1),
          }
    : communityErrorPopUpConfig ?? popUpConfig;

  if (!selectedPost) {
    return (
      <HeaderLayout
        headerSlot={
          <MainHeader
            title='커뮤니티'
            leftAction={{
              // 상세 진입 경로를 유지하기 위해 고정 경로 대신 이전 페이지로 이동한다.
              onClick: () => navigate(-1),
              ariaLabel: '이전 페이지로 이동',
            }}
            rightActions={[
              { icon: 'more_menu', onClick: () => {}, ariaLabel: '게시글 옵션 열기' },
            ]}
          />
        }
      >
        {activePopUpConfig && (
          <PopUp
            isOpen={true}
            type={activePopUpConfig.type}
            title={activePopUpConfig.title}
            titleSecondary={activePopUpConfig.titleSecondary}
            content={activePopUpConfig.content}
            leftButtonText={activePopUpConfig.leftButtonText}
            rightButtonText={activePopUpConfig.rightButtonText}
            buttonText={activePopUpConfig.buttonText}
            onLeftClick={activePopUpConfig.onLeftClick}
            onRightClick={activePopUpConfig.onRightClick}
            onClick={activePopUpConfig.onClick ?? closePopUp}
          />
        )}
      </HeaderLayout>
    );
  }

  // 게시글/댓글 옵션 열기
  const handleOpenCommentOptions = (comment: CommentItem) => {
    setSelectedIsMine(comment.author.id === currentUserIdForOwnership);
    setSelectedTarget('comment');
    setSelectedCommentId(comment.id);
    setIsOptionOpen(true);
  };

  const handleOpenPostOptions = () => {
    setSelectedIsMine(selectedPost.author.id === currentUserIdForOwnership);
    setSelectedTarget('post');
    setSelectedCommentId(null);
    setIsOptionOpen(true);
  };

  // 채택/구매 팝업 제어
  const handleOpenAdoptPopup = (comment: CommentItem) => {
    setSelectedCommentId(comment.id);
    setPopUpConfig({
      type: 'info',
      title: '정말 채택하시겠습니까?',
      content: '채택된 댓글은 이후 수정하거나 삭제할 수 없습니다.',
      onLeftClick: closePopUp,
      onRightClick: async () => {
        if (!userId || !postId) {
          closePopUp();
          return;
        }
        const numericUserId = Number(userId);
        const numericCommentId = Number(comment.id);
        if (
          !Number.isInteger(numericUserId) ||
          numericUserId < 1 ||
          !Number.isInteger(numericCommentId) ||
          numericCommentId < 1
        ) {
          closePopUp();
          return;
        }
        try {
          await acceptCommunityComment({
            postId,
            commentId: numericCommentId,
            params: { userId: numericUserId },
          });
          refetchPost();
          await refreshComments();
        } catch (error) {
          showCommunityError(error, 'commentAccept');
        } finally {
          closePopUp();
        }
      },
    });
  };

  // 구매 확인 및 포인트 검증 플로우
  const handleOpenPurchasePopup = () => {
    if (accessStatus !== 'NEED_PURCHASE') return;
    // 구매 처리 중에는 구매 팝업을 다시 열거나 동일 요청을 시작하지 않습니다.
    if (purchasePostAccessPendingRef.current || purchasePostAccessMutation.isPending) return;
    setMyPoints(selectedPost.myPoints ?? 0);
    setPopUpConfig({
      type: 'info',
      title: '질문을 구매하시겠습니까?',
      content: '구매 시 포인트가 즉시 차감되며, \n결제 후에는 취소나 환불이 불가능합니다.',
      onLeftClick: closePopUp,
      onRightClick: async () => {
        // 팝업 확인 버튼 연타로 동일 구매 요청이 중복 전송되는 것을 방지합니다.
        if (purchasePostAccessPendingRef.current || purchasePostAccessMutation.isPending) return;
        if (!userId || !postId) return;
        const numericUserId = Number(userId);
        if (!Number.isInteger(numericUserId) || numericUserId < 1) return;
        if (selectedPost.myPoints == null) {
          setPopUpConfig({
            type: 'confirm',
            title: '구매 오류',
            content: '포인트 정보를 가져오는데 실패했습니다',
            onClick: closePopUp,
          });
          return;
        }
        const currentPoints = selectedPost.myPoints ?? myPoints;
        if (currentPoints < requiredPoints) {
          setPopUpConfig({
            type: 'confirm',
            title: '앗, 포인트가 조금 부족하네요!',
            content: '다양한 활동으로 포인트를 채워보세요!',
            onClick: closePopUp,
          });
          return;
        }
        try {
          purchasePostAccessPendingRef.current = true;
          await purchasePostAccessMutation.mutateAsync({ postId, userId: numericUserId });
        } catch {
          // onError에서 팝업 상태를 정리합니다.
        } finally {
          purchasePostAccessPendingRef.current = false;
        }
      },
    });
  };

  const handleLikeChange = async (next: boolean) => {
    if (!userId || isLikeLoading) return;
    const prev = { liked: isLiked, count: likeCount };
    setIsLikeLoading(true);
    setIsLiked(next);
    try {
      const response = await postCommunityLike(selectedPost.id, { userId });
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      const axiosError = error as AxiosError<{ code?: number; message?: string }>;
      const status = axiosError.response?.status;
      const code = getServerErrorCode(axiosError);
      if (status === 409 || code === COMMUNITY_ERROR_CODES.ownPostLikeUnavailable) {
        setToastMessage('본인의 글에 좋아요를 누를 수 없습니다.');
        openToast();
      } else {
        showCommunityError(error, 'like');
      }
      setIsLiked(prev.liked);
      setLikeCount(prev.count);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmarkChange = async (next: boolean) => {
    if (!userId || isBookmarkLoading) return;
    const prev = { bookmarked: isBookmarked, count: bookmarkCount };
    setIsBookmarkLoading(true);
    setIsBookmarked(next);
    try {
      const response = await postCommunityBookmark(selectedPost.id, { userId });
      setIsBookmarked(response.data.bookmarked);
      setBookmarkCount(response.data.bookmarkCount);
    } catch (error) {
      setIsBookmarked(prev.bookmarked);
      setBookmarkCount(prev.count);
      showCommunityError(error, 'bookmark');
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // URL 복사: 클립보드 실패 시 fallback 적용
  const copyPostUrl = async () => {
    const postUrl = `${window.location.origin}/community/post/${selectedPost.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setToastMessage('URL 복사가 완료되었습니다');
      openToast();
      return;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = postUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setToastMessage('URL 복사가 완료되었습니다');
      openToast();
    }
  };

  // 옵션 id 기반 동작 매핑
  // 옵션 버튼별 동작 매핑
  const optionHandlers: Record<OptionItemId, () => Promise<void> | void> = {
    'copy-url': async () => {
      await copyPostUrl();
    },
    'report-post': () => {
      setPopUpConfig({
        type: 'confirm',
        title: '현재 제작 중이에요!',
        content: '유저분들이 더 즐겁게 소통할 수 있도록\n꼼꼼히 준비해서 돌아올게요!',
        onClick: closePopUp,
      });
    },
    'report-comment': () => {
      setPopUpConfig({
        type: 'confirm',
        title: '현재 제작 중이에요!',
        content: '유저분들이 더 즐겁게 소통할 수 있도록\n꼼꼼히 준비해서 돌아올게요!',
        onClick: closePopUp,
      });
    },
    'view-author-profile': () => {},
    'edit-post': () => {
      if (!selectedIsMine) return;
      navigate(`/community/edit/${selectedPost.id}`);
    },
    'edit-comment': () => {
      if (!selectedIsMine || !selectedCommentId) return;
      startEditingComment(selectedCommentId);
    },
    'delete-post': async () => {
      if (!selectedIsMine) return;
      setPopUpConfig({
        type: 'warning',
        title: '정말 삭제하시겠습니까?',
        content: '삭제된 내용은 복구 불가능합니다.',
        onLeftClick: async () => {
          if (!userId) return;
          const numericUserId = Number(userId);
          if (!Number.isInteger(numericUserId) || numericUserId < 1) return;
          try {
            await deleteCommunityPost({
              postId: selectedPost.id,
              params: { userId: numericUserId },
            });
            navigate('/community', { replace: true });
          } catch (error) {
            showCommunityError(error, 'postDelete');
          } finally {
            closePopUp();
          }
        },
        onRightClick: closePopUp,
      });
    },
    'delete-comment': () => {
      if (!selectedIsMine || !selectedCommentId) return;
      setPopUpConfig({
        type: 'warning',
        title: '정말 삭제하시겠습니까?',
        content: '삭제된 내용은 복구 불가능합니다.',
        onLeftClick: () => {
          if (selectedCommentId) {
            deleteComment(selectedCommentId);
          }
          closePopUp();
        },
        onRightClick: closePopUp,
      });
    },
  };

  // 옵션 선택 처리 (채택 완료 상태 예외 포함)
  const handleOptionItemClick = async (
    item: ActionItem,
    target: 'post' | 'comment',
  ) => {
    if (item.id === 'view-author-profile') {
      const authorId =
        target === 'post'
          ? selectedPost.author.id
          : selectedCommentId
            ? findCommentAuthorId(commentList, selectedCommentId)
            : null;
      if (authorId) {
        navigate(`/alumni/profile/${authorId}`, {
          state:
            target === 'post'
              ? {
                  author: {
                    name: selectedPost.author.name,
                    major: selectedPost.author.major,
                    studentId: selectedPost.author.studentId,
                    profileImageUrl: selectedPost.author.profileImageUrl,
                  },
                }
              : undefined,
        });
      }
      setIsOptionOpen(false);
      return;
    }
    if (!isEditOption(item.id)) {
      await optionHandlers[item.id]();
      setIsOptionOpen(false);
      return;
    }

    if (
      target === 'comment' &&
      isQuestionPost &&
      isAdopted &&
      selectedIsMine &&
      selectedCommentId === selectedPost.adoptedCommentId
    ) {
      setPopUpConfig({
        type: 'confirm',
        title: '이미 채택된 댓글입니다.',
        content:
          '채택이 완료된 댓글의\n수정 및 삭제를 원하실 경우,\n[문의하기]를 통해 접수 부탁드립니다',
        onClick: closePopUp,
      });
      setIsOptionOpen(false);
      return;
    }

    await optionHandlers[item.id]();

    setIsOptionOpen(false);
  };

  // 댓글(답글) 렌더 헬퍼
  const renderComment = (comment: CommentItem, isReply = false) => (
    <CommentListItem
      key={comment.id}
      comment={comment}
      isReply={isReply}
      isQuestionPost={isQuestionPost}
      isAdopted={isAdopted}
      adoptedCommentId={selectedPost.adoptedCommentId}
      showAdoptButton={
        showAdoptButton &&
        !comment.isDeleted &&
        comment.author.id !== currentUserIdForOwnership
      }
      isHighlighted={highlightedCommentId === comment.id}
      isEditing={editingCommentId === comment.id}
      editingContent={editingCommentId === comment.id ? editingCommentContent : comment.content}
      onEditingChange={setEditingCommentContent}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onOpenCommentOptions={handleOpenCommentOptions}
      onOpenAdoptPopup={handleOpenAdoptPopup}
      onReplyClick={handleReplyClick}
      formatDate={formatCommentDisplayDate}
      renderReply={(reply) => renderComment(reply, true)}
    />
  );

  return (
    <HeaderLayout
      headerSlot={
        <MainHeader
          title='커뮤니티'
          leftAction={{
            // 상세 진입 경로를 유지하기 위해 고정 경로 대신 이전 페이지로 이동한다.
            onClick: () => navigate(-1),
            ariaLabel: '이전 페이지로 이동',
          }}
          rightActions={[
            { icon: 'more_menu', onClick: handleOpenPostOptions, ariaLabel: '게시글 옵션 열기' },
          ]}
        />
      }
    >
      {selectedPost && !detailError ? (
        // 이미지·프로필까지 드래그 선택되는 것을 막고, 실제 콘텐츠 텍스트에서만 선택을 다시 허용한다.
        <main
          className='flex w-full select-none justify-center bg-white'
          style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}
        >
          <div className='flex w-full max-w-[720px] flex-col sm:px-[25px]'>
            <section className='flex flex-col gap-[35px] border-b border-[#ECECEC] px-5 pb-[30px] pt-[22px] sm:px-[25px]'>
            <div className='flex flex-col items-start gap-[20px]'>
              {isQuestionPost ? (
                <div
                  className={`inline-flex min-w-[68px] items-center justify-center rounded-[30px] border px-[12px] py-[4px] text-r-16 ${
                    isAdopted
                      ? 'border-[var(--ColorGray2,#A1A1A1)] text-[var(--ColorGray2,#A1A1A1)]'
                      : 'border-[var(--ColorMain,#00C56C)] text-[var(--ColorMain,#00C56C)]'
                  }`}
                >
                  {isAdopted ? '채택 완료' : '채택 전'}
                </div>
              ) : (
                <div className='text-[12px] font-normal text-[var(--ColorMain,#00C56C)]'>
                  {selectedPost.boardType} 게시판 &gt;
                </div>
              )}
              <div className='flex flex-col gap-[13px]'>
                <div className='select-text text-[24px] font-bold leading-[130%] text-black'>
                  {selectedPost.title}
                </div>
                <div className='flex flex-wrap items-center gap-[10px] text-[12px] text-[var(--ColorGray3,#646464)]'>
                  <div className='flex items-center gap-[5px]'>
                    <div className='flex items-center gap-[3px]'>
                      <Icon name='thumbs_up_stroke' className='h-[14px] w-[14px]' />
                      <span>{likeCount}</span>
                    </div>
                    
                    <div className='flex items-center gap-[3px]'>
                      <Icon name='comment' className='h-[14px] w-[14px]' />
                      <span>{commentCount}</span>
                    </div>
                    <div className='flex items-center gap-[3px]'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='11'
                        height='12'
                        viewBox='0 0 11 12'
                        fill='none'
                      >
                        <path
                          d='M9.22867 0.697692C9.962 0.775908 10.5 1.3558 10.5 2.03286V11.5L5.5 9.20853L0.5 11.5V2.03286C0.5 1.3558 1.03733 0.775908 1.77133 0.697692C4.24879 0.434103 6.75121 0.434103 9.22867 0.697692Z'
                          stroke='#646464'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                      <span>{bookmarkCount}</span>
                    </div>
                  </div>
                  <span className='text-[var(--ColorGray2,#A1A1A1)]'>
                    {formatPostDisplayDate(selectedPost.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex justify-between gap-[12px] border-b border-[#ECECEC] pb-[15px] sm:flex-row sm:items-center '>
              <button
                type='button'
                disabled={isPostMine}
                className='flex items-center gap-[10px] text-left'
                onClick={() =>
                  navigate(`/alumni/profile/${selectedPost.author.id}`, {
                    state: {
                      author: {
                        name: selectedPost.author.name,
                        major: selectedPost.author.major,
                        studentId: selectedPost.author.studentId,
                        profileImageUrl: selectedPost.author.profileImageUrl,
                      },
                    },
                  })
                }
              >
                <img
                  src={selectedPost.author.profileImageUrl ?? DEFAULT_PROFILE_IMAGE}
                  alt={`${selectedPost.author.name} 프로필`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                  }}
                  className='h-[32px] w-[32px] rounded-full object-cover'
                />
                <div className='flex flex-col gap-[4px]'>
                  <div className='text-[14px] font-semibold text-[var(--ColorBlack,#202023)]'>
                    {selectedPost.author.name}
                  </div>
                  <div className='text-[12px] text-[var(--ColorGray3,#646464)]'>
                    {selectedPost.author.major}
                    {selectedPost.author.studentId
                      ? ` ${selectedPost.author.studentId}학번`
                      : ''}
                  </div>
                </div>
              </button>
              {!isPostMine ? (
                <button
                  type='button'
                  className='inline-flex items-center justify-center rounded-[10px] border border-[var(--ColorMain,#00C56C)] px-[10px] py-[6px] text-[12px] font-normal text-[var(--ColorMain,#00C56C)]'
                  onClick={() =>
                    navigate(`/alumni/profile/${selectedPost.author.id}?coffeeChat=1`)
                  }
                >
                  커피챗 보내기
                </button>
              ) : null}
            </div>

            <div className='flex flex-col gap-[20px]'>
              {isLockedQuestion && accessStatus === 'NEED_PURCHASE' ? (
                <LockedQuestionCard
                  requiredPoints={requiredPoints}
                  textCount={textCount}
                  imageCount={imageCount}
                  onPurchaseClick={handleOpenPurchasePopup}
                  isPurchasing={purchasePostAccessMutation.isPending}
                />
              ) : isLockedQuestion ? (
                <div className='rounded-[10px] bg-[var(--Color_Gray_B,#FCFCFC)] px-[20px] py-[30px] text-center text-m-14 text-[var(--ColorGray3,#646464)]'>
                  {accessStatus === 'INSUFFICIENT_POINTS'
                    ? '포인트가 부족해 본문을 열람할 수 없습니다'
                    : '로그인 후 본문을 열람할 수 있습니다'}
                </div>
              ) : (
                <>
                  <div className='select-text whitespace-pre-wrap text-[16px] leading-[160%] text-[var(--ColorGray3,#646464)]'>
                    {selectedPost.content}
                  </div>
                  {selectedPost.attachments && selectedPost.attachments.length > 0 ? (
                    <div className='mt-[30px] -mr-5 overflow-x-auto sm:-mr-[25px]'>
                      <div className='flex w-max gap-[5px] pr-[20px]'>
                        {selectedPost.attachments
                          .slice()
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((attachment, index) => {
                            const itemKey = `${selectedPost.id}-attachment-${index + 1}`;
                            if (attachment.fileKey.endsWith('.pdf')) {
                              return (
                                <a
                                  key={itemKey}
                                  href={attachment.downloadUrl}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='flex h-[150px] w-[150px] shrink-0 flex-col items-center justify-center rounded-[5px] border border-[#ECECEC] bg-white text-center'
                                  style={{ gap: '6px', padding: '10px' }}
                                >
                                  <span className='text-b-14-hn text-gray-900'>PDF</span>
                                  <span className='text-r-12 text-gray-650 line-clamp-2'>
                                    {getFileName(attachment.downloadUrl)}
                                  </span>
                                </a>
                              );
                            }
                            if (failedImages[itemKey]) {
                              return (
                                <div key={itemKey} className='h-[150px] w-[150px] shrink-0 rounded-[5px] bg-[#D9D9D9]' aria-label='이미지 불러오기 실패' />
                              );
                            }
                            return (
                              <img
                                key={itemKey}
                                src={attachment.downloadUrl}
                                alt={`${selectedPost.title} 이미지 ${index + 1}`}
                                className='h-[150px] w-[150px] shrink-0 rounded-[5px] object-cover'
                                onClick={() => setSelectedImageUrl(attachment.downloadUrl)}
                                onError={() => setFailedImages((prev) => ({ ...prev, [itemKey]: true }))}
                              />
                            );
                          })}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
              <div className='flex flex-wrap gap-[5px]'>
                {selectedPost.categories.map((category: string) => (
                  <Category key={category} label={category} />
                ))}
              </div>
            </div>
          </section>

          <section className='flex flex-col'>
            <div className='px-[25px] pb-[15px] pt-[20px] text-[16px] font-semibold text-[var(--ColorBlack,#202023)]'>
              댓글 ({commentCount})
            </div>
            {isLockedQuestion ? (
              <div className='flex items-center justify-center px-[25px] py-[30px] text-m-14 text-[var(--ColorGray2,#A1A1A1)]'>
                {accessStatus === 'LOGIN_REQUIRED'
                  ? '로그인 후 댓글을 볼 수 있습니다'
                  : '열람 권한 획득 후 댓글을 볼 수 있습니다'}
              </div>
            ) : commentAccessBlocked ? (
              <div className='flex items-center justify-center px-[25px] py-[30px] text-m-14 text-[var(--ColorGray2,#A1A1A1)]'>
                공개 상태가 아닌 게시글의 댓글은 볼 수 없습니다
              </div>
            ) : (
              <div className='flex flex-col'>
                {sortedComments.map((comment) => renderComment(comment))}
                {hasNextComments ? (
                  <button
                    type='button'
                    disabled={isLoadingComments}
                    onClick={() => void loadComments(true)}
                    className='mx-[25px] my-[15px] rounded-[10px] border border-[var(--ColorGray1,#ECECEC)] py-[10px] text-m-14 text-[var(--ColorGray3,#646464)] disabled:opacity-50'
                  >
                    {isLoadingComments ? '댓글을 불러오는 중...' : '댓글 더 보기'}
                  </button>
                ) : null}
              </div>
            )}
            </section>
          </div>
        </main>
      ) : null}
      {selectedPost && !detailError ? (
        <BottomChat
          likeCount={likeCount}
          isLiked={isLiked}
          onLikeChange={handleLikeChange}
          isSaved={isBookmarked}
          onSaveChange={handleBookmarkChange}
          placeholder={
            isLockedQuestion
              ? accessStatus === 'LOGIN_REQUIRED'
                ? '로그인 후 입력 가능'
                : '열람 권한 획득 후 입력 가능'
              : '댓글을 입력해 주세요'
          }
          content={commentContent}
          onChange={setCommentContent}
          onSubmit={handleSubmitComment}
          disabled={isLockedQuestion}
          replyTargetName={replyTarget?.name}
          focusToken={replyFocusToken}
          maxLength={5000}
        />
      ) : null}
      <ImagePopUp
        isOpen={Boolean(selectedImageUrl)}
        imageUrl={selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
      <BottomSheetModalPost
        isOpen={isOptionOpen}
        onClose={() => setIsOptionOpen(false)}
        target={selectedTarget}
        isMine={selectedIsMine}
        onItemClick={handleOptionItemClick}
      />
      {activePopUpConfig && (
        <PopUp
          isOpen={true}
          type={activePopUpConfig.type}
          title={activePopUpConfig.title}
          titleSecondary={activePopUpConfig.titleSecondary}
          content={activePopUpConfig.content}
          leftButtonText={activePopUpConfig.leftButtonText}
          rightButtonText={activePopUpConfig.rightButtonText}
          buttonText={activePopUpConfig.buttonText}
          onLeftClick={activePopUpConfig.onLeftClick}
          onRightClick={activePopUpConfig.onRightClick}
          onClick={activePopUpConfig.onClick ?? closePopUp}
          isActionPending={purchasePostAccessMutation.isPending}
        />
      )}
      <Toast
        isOpen={isToastOpen}
        isFading={isToastFading}
        message={toastMessage}
      />
    </HeaderLayout>
  );
};

export default CommunityPostPage;
