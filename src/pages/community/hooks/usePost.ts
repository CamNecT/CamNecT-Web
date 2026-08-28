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
  const userId = useAuthStore((state) => state.user?.id);
  const { mapTagIdToName } = useTagList();
  const [selectedPost, setSelectedPost] = useState<CommunityPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedByMe, setLikedByMe] = useState(false);
  // 동일 마운트 사이클에서 중복 호출을 방지하기 위한 플래그
  const isFetchingRef = useRef(false);

  // 게시글 상세를 재조회하는 공용 함수
  const refetchPost = useCallback(() => {
    if (!postId) {
      setSelectedPost(null);
      setLikedByMe(false);
      setIsLoading(false);
      onError?.(new Error('게시글 ID가 없습니다.'));
      return;
    }
    // 모든 ID는 1 이상의 정수라는 API 계약을 만족할 때만 요청한다.
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId < 1) {
      setSelectedPost(null);
      setLikedByMe(false);
      setIsLoading(false);
      return;
    }
    const numericPostId = Number(postId);
    if (!Number.isInteger(numericPostId) || numericPostId < 1) {
      setSelectedPost(null);
      setLikedByMe(false);
      setIsLoading(false);
      onError?.(new Error('게시글 ID 형식이 올바르지 않습니다.'));
      return;
    }
    if (isFetchingRef.current) return;

    setIsLoading(true);
    isFetchingRef.current = true;
    getCommunityPostDetail({
      postId: numericPostId,
      params: { userId: numericUserId },
    })
      .then((response) => {
        setSelectedPost(mapToCommunityPostDetail(response.data, mapTagIdToName));
        setLikedByMe(Boolean(response.data.likedByMe));
      })
      .catch((error: unknown) => {
        setSelectedPost(null);
        setLikedByMe(false);
        // 상세 오류 UI는 API hook에서 결정하지 않고 Community Post 호출부의 도메인 오류 hook에 위임한다.
        onError?.(error);
      })
      .finally(() => {
        setIsLoading(false);
        isFetchingRef.current = false;
      });
  }, [postId, userId, mapTagIdToName, onError]);

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
  };
};
