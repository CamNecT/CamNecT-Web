import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getCommunityPostDetail } from '../../../api/community';
import { mapToCommunityPostDetail } from '../../../utils/communityMapper';
import type { CommunityPostDetail } from '../../../types/community';
import { useTagList } from '../../../hooks/useTagList';

type UsePostParams = {
  postId?: string;
  onError?: (error: unknown) => void;
};

// 게시글 선택 및 파생 상태 계산을 캡슐화
export const usePost = ({ postId, onError }: UsePostParams) => {
  const userId = useAuthStore((state) => state.isAuthenticated ? state.user?.id : undefined);
  const { mapTagIdToName } = useTagList();
  const [selectedPost, setSelectedPost] = useState<CommunityPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [likedByMe, setLikedByMe] = useState(false);
  // 동일 마운트 사이클에서 중복 호출을 방지하기 위한 플래그
  const requestRef = useRef<AbortController | null>(null);

  // 게시글 상세를 재조회하는 공용 함수
  const refetchPost = useCallback(() => {
    if (!postId) {
      setSelectedPost(null);
      setLikedByMe(false);
      setIsLoading(false);
      setHasLoadError(true);
      onError?.(new Error('게시글 ID가 없습니다.'));
      return;
    }
    const numericPostId = Number(postId);
    if (!Number.isInteger(numericPostId) || numericPostId < 1) {
      setSelectedPost(null);
      setLikedByMe(false);
      setIsLoading(false);
      setHasLoadError(true);
      onError?.(new Error('게시글 ID 형식이 올바르지 않습니다.'));
      return;
    }
    if (requestRef.current) return;

    setIsLoading(true);
    setHasLoadError(false);
    const controller = new AbortController();
    requestRef.current = controller;
    getCommunityPostDetail({
      postId: numericPostId,
      params: { userId },
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        setSelectedPost(mapToCommunityPostDetail(response.data, mapTagIdToName));
        setLikedByMe(Boolean(response.data.likedByMe));
        setHasLoadError(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSelectedPost(null);
        setLikedByMe(false);
        setHasLoadError(true);
        // 상세 오류 UI는 API hook에서 결정하지 않고 Community Post 호출부의 도메인 오류 hook에 위임한다.
        onError?.(error);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        requestRef.current = null;
      });
  }, [postId, userId, mapTagIdToName, onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refetchPost();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      requestRef.current?.abort();
      requestRef.current = null;
    };
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
