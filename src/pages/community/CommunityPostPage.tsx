import type { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
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
  // 옵션/팝업/이미지 실패 등 화면 단일 상태
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [selectedIsMine, setSelectedIsMine] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'post' | 'comment'>('comment');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [popUpConfig, setPopUpConfig] = useState<PopUpConfig | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('URL 복사가 완료되었습니다');
  const [accessStatusOverride, setAccessStatusOverride] = useState<
    'GRANTED' | 'LOCKED' | null
  >(null);
  const [myPoints, setMyPoints] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [commentListFromApi, setCommentListFromApi] = useState<CommentItem[]>([]);
  const isFetchingCommentsRef = useRef(false);
  const closePopUp = () => setPopUpConfig(null);
  // 토스트 표시 제어
  const { isOpen: isToastOpen, isFading: isToastFading, openToast } = useToast();
  // 게시글 파생 상태
  const {
    selectedPost,
    isQuestionPost,
    isInfoPost,
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
  const accessStatus =
    accessStatusOverride ??
    selectedPost?.accessStatus ??
    (isPostMine ? 'GRANTED' : 'LOCKED');
  const isLockedQuestion =
    isQuestionPost && !isPostMine && accessStatus !== 'GRANTED';
  const userId = useAuthStore((state) => state.user?.id);

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

  // 댓글 목록 1회 로딩 (중복 호출 방지 포함)
  useEffect(() => {
    if (!postId) return;
    if (isFetchingCommentsRef.current) return;
    isFetchingCommentsRef.current = true;
    getCommunityPostComments(postId)
      .then((response) => {
        setCommentListFromApi(mapFlatCommentsToTree(response.data));
      })
      .catch(() => {
        setCommentListFromApi([]);
      })
      .finally(() => {
        isFetchingCommentsRef.current = false;
      });
  }, [postId]);

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
    isInfoPost,
    isLockedQuestion,
    isQuestionPost,
    isAdopted,
    adoptedCommentId: selectedPost?.adoptedCommentId,
    onSubmitCommentApi: async ({ content, parentCommentId }) => {
      if (!userId || !postId) return;
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId)) return;
      const numericParentId = parentCommentId ? Number(parentCommentId) : null;
      await createCommunityComment({
        postId,
        params: { userId: numericUserId },
        body: {
          content,
          parentCommentId: Number.isFinite(numericParentId ?? NaN)
            ? numericParentId
            : null,
        },
      });
      const response = await getCommunityPostComments(postId);
      setCommentListFromApi(mapFlatCommentsToTree(response.data));
    },
    onDeleteCommentApi: async (commentId) => {
      if (!userId) return;
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId)) return;
      const numericCommentId = Number(commentId);
      if (!Number.isFinite(numericCommentId)) return;
      await deleteCommunityComment({
        commentId: numericCommentId,
        params: { userId: numericUserId },
      });
      if (postId) {
        const response = await getCommunityPostComments(postId);
        setCommentListFromApi(mapFlatCommentsToTree(response.data));
      }
    },
    onUpdateCommentApi: async ({ commentId, content }) => {
      if (!userId) return;
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId)) return;
      const numericCommentId = Number(commentId);
      if (!Number.isFinite(numericCommentId)) return;
      await updateCommunityComment({
        commentId: numericCommentId,
        params: { userId: numericUserId },
        body: { content },
      });
      if (postId) {
        const response = await getCommunityPostComments(postId);
        setCommentListFromApi(mapFlatCommentsToTree(response.data));
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

  // 로딩 중에는 단일 PopUp만 노출
  const activePopUpConfig: PopUpConfig | null = isDetailLoading
    ? {
        type: 'loading',
        title: '게시글을 불러오는 중입니다',
      }
    : popUpConfig;

  if (!selectedPost) {
    return (
      <HeaderLayout
        headerSlot={
          <MainHeader
            title='커뮤니티'
            leftAction={{
              onClick: () => navigate('/community', { replace: true }),
              ariaLabel: '커뮤니티로 이동',
            }}
            rightActions={[
              { icon: 'option', onClick: () => {}, ariaLabel: '게시글 옵션 열기' },
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
      content: '답변 채택 후 게시물의\n수정 및 삭제가 불가능 합니다.',
      onLeftClick: closePopUp,
      onRightClick: async () => {
        if (!userId || !postId) {
          closePopUp();
          return;
        }
        const numericUserId = Number(userId);
        const numericCommentId = Number(comment.id);
        if (!Number.isFinite(numericUserId) || !Number.isFinite(numericCommentId)) {
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
          const response = await getCommunityPostComments(postId);
          setCommentListFromApi(mapFlatCommentsToTree(response.data));
        } finally {
          closePopUp();
        }
      },
    });
  };

  // 구매 확인 및 포인트 검증 플로우
  const handleOpenPurchasePopup = () => {
    setMyPoints(selectedPost.myPoints ?? 0);
    setPopUpConfig({
      type: 'info',
      title: '질문을 구매하시겠습니까?',
      content: '구매 시 포인트가 즉시 차감되며, \n결제 후에는 취소나 환불이 불가능합니다.',
      onLeftClick: closePopUp,
      onRightClick: async () => {
        if (!userId || !postId) return;
        const numericUserId = Number(userId);
        if (!Number.isFinite(numericUserId)) return;
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
          const response = await purchaseCommunityPostAccess({
            postId,
            params: { userId: numericUserId },
          });
          setMyPoints(response.data.remainingPoints);
          setAccessStatusOverride(response.data.accessStatus);
          refetchPost();
          closePopUp();
          setToastMessage('구매 성공! 이제 질문글을 열람할 수 있어요');
          openToast();
        } catch {
          closePopUp();
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
      const code = axiosError.response?.data?.code;
      if (status === 409 || code === 43927) {
        setToastMessage('본인의 글에 좋아요를 누를 수 없습니다.');
        openToast();
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
    } catch {
      setIsBookmarked(prev.bookmarked);
      setBookmarkCount(prev.count);
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
          if (!Number.isFinite(numericUserId)) return;
          try {
            await deleteCommunityPost({
              postId: selectedPost.id,
              params: { userId: numericUserId },
            });
            navigate('/community', { replace: true });
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

    if (target === 'post' && isQuestionPost && isAdopted && isPostMine) {
      setPopUpConfig({
        type: 'confirm',
        title: '이미 채택된 게시물입니다.',
        content:
          '채택이 완료된 게시물의\n수정 및 삭제를 원하실 경우,\n[문의하기]를 통해 접수 부탁드립니다',
        onClick: closePopUp,
      });
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
      showAdoptButton={showAdoptButton}
      isInfoPost={isInfoPost}
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
            onClick: () => navigate('/community', { replace: true }),
            ariaLabel: '커뮤니티로 이동',
          }}
          rightActions={[
            { icon: 'option', onClick: handleOpenPostOptions, ariaLabel: '게시글 옵션 열기' },
          ]}
        />
      }
    >
      {selectedPost && !detailError ? (
        <main
          className='flex w-full justify-center bg-white'
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
                <div className='text-[24px] font-bold leading-[130%] text-black'>
                  {selectedPost.title}
                </div>
                <div className='flex flex-wrap items-center gap-[10px] text-[12px] text-[var(--ColorGray3,#646464)]'>
                  <div className='flex items-center gap-[5px]'>
                    <div className='flex items-center gap-[3px]'>
                      <Icon name='like' className='h-[14px] w-[14px]' />
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
                    e.currentTarget.onerror = null; //이미지 깨짐 방지
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
              {!isPostMine && (<button
                type='button'
                className='inline-flex items-center justify-center rounded-[10px] border border-[var(--ColorMain,#00C56C)] px-[10px] py-[6px] text-[12px] font-normal text-[var(--ColorMain,#00C56C)]'
                onClick={() =>
                  navigate(`/alumni/profile/${selectedPost.author.id}?coffeeChat=1`, {
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
                커피챗 보내기
              </button>)}
            </div>

            <div className='flex flex-col gap-[20px]'>
              {isLockedQuestion ? (
                <LockedQuestionCard
                  requiredPoints={requiredPoints}
                  textCount={textCount}
                  imageCount={imageCount}
                  onPurchaseClick={handleOpenPurchasePopup}
                />
              ) : (
                <>
                  <div className='text-[16px] leading-[160%] text-[var(--ColorGray3,#646464)] whitespace-pre-wrap'>
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
                질문 구매 후 열람이 가능합니다
              </div>
            ) : (
              <div className='flex flex-col'>
                {sortedComments.map((comment) => renderComment(comment))}
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
          placeholder={isLockedQuestion ? '구매 후 입력 가능' : '댓글을 입력해 주세요'}
          content={commentContent}
          onChange={setCommentContent}
          onSubmit={handleSubmitComment}
          disabled={isLockedQuestion}
          replyTargetName={replyTarget?.name}
          focusToken={replyFocusToken}
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
