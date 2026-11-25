import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getCommunityPostDetail } from '../../../api/community';
import { mapToCommunityPostDetail } from '../../../utils/communityMapper';
import type { CommunityPostDetailResponse } from '../../../api-types/communityApiTypes';
import { useTagList } from '../../../hooks/useTagList';

type UsePostParams = {
  postId?: string;
  onError?: (error: unknown) => void;
};

// 게시글 선택 및 파생 상태 계산을 캡슐화
export const usePost = ({ postId, onError }: UsePostParams) => {
  const userId = useAuthStore((state) => state.user?.id);
  const { mapTagIdToName } = useTagList();
  const [postData, setPostData] = useState<CommunityPostDetailResponse | null>(null);
  // 태그 이름 갱신은 이미 받은 응답에만 반영해 상세 요청과 오류 안내를 반복하지 않는다.
  const selectedPost = useMemo(
    () => postData ? mapToCommunityPostDetail(postData, mapTagIdToName) : null,
    [postData, mapTagIdToName],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [likedByMe, setLikedByMe] = useState(false);
  // 동일 마운트 사이클에서 중복 호출을 방지하기 위한 플래그
  const isFetchingRef = useRef(false);

  // 게시글 상세를 재조회하는 공용 함수
  const refetchPost = useCallback((handleError = onError) => {
    if (!postId) {
      setPostData(null);
      setLikedByMe(false);
      setIsLoading(false);
      setHasLoadError(true);
      handleError?.(new Error('게시글 ID가 없습니다.'));
      return;
    }
    // 모든 ID는 1 이상의 정수라는 API 계약을 만족할 때만 요청한다.
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId < 1) {
      setPostData(null);
      setLikedByMe(false);
      setIsLoading(false);
      return;
    }
    const numericPostId = Number(postId);
    if (!Number.isInteger(numericPostId) || numericPostId < 1) {
      setPostData(null);
      setLikedByMe(false);
      setIsLoading(false);
      setHasLoadError(true);
      handleError?.(new Error('게시글 ID 형식이 올바르지 않습니다.'));
      return;
    }
    if (isFetchingRef.current) return;

    setIsLoading(true);
    setHasLoadError(false);
    isFetchingRef.current = true;
    getCommunityPostDetail({
      postId: numericPostId,
      params: { userId: numericUserId },
    })
      .then((response) => {
        setPostData(response.data);
        setLikedByMe(Boolean(response.data.likedByMe));
        setHasLoadError(false);
      })
      .catch((error: unknown) => {
        setPostData(null);
        setLikedByMe(false);
        setHasLoadError(true);
        // 상세 오류 UI는 API hook에서 결정하지 않고 Community Post 호출부의 도메인 오류 hook에 위임한다.
        handleError?.(error);
      })
      .finally(() => {
        setIsLoading(false);
        isFetchingRef.current = false;
      });
  }, [postId, userId, onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refetchPost();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refetchPost]);

  if (!selectedPost) {
    return {
      selectedPost,
      isQuestionPost: false,
      isInfoPost: false,
      isPostMine: false,
      isAdopted: false,
      showAdoptButton: false,
      isLockedQuestion: false,
      requiredPoints: 0,
      textCount: 0,
      imageCount: 0,
      likedByMe,
      refetchPost,
      isLoading,
      hasLoadError,
    };
  }

  const isQuestionPost = selectedPost.boardType === '질문';
  const isInfoPost = !isQuestionPost;
  const isPostMine = userId ? selectedPost.author.id === userId : false;
  const isAdopted = selectedPost.isAdopted;
  const showAdoptButton = isQuestionPost && isPostMine && !isAdopted;
  // 잠금 판단은 FREE/POINT_REQUIRED 정책값이 아니라 사용자별 accessStatus를 따른다.
  const accessStatus =
    selectedPost.accessStatus ?? (isPostMine ? 'GRANTED' : 'NEED_PURCHASE');
  const isLockedQuestion = isQuestionPost && !isPostMine && accessStatus !== 'GRANTED';
  const requiredPoints = selectedPost.requiredPoints ?? 0;
  const textCount = selectedPost.content?.length ?? 0;
  const imageCount = selectedPost.postImages?.length ?? 0;

  return {
    selectedPost,
    isQuestionPost,
    isInfoPost,
    isPostMine,
    isAdopted,
    showAdoptButton,
    isLockedQuestion,
    requiredPoints,
    textCount,
    imageCount,
    likedByMe,
    refetchPost,
    isLoading,
    hasLoadError,
  };
};
