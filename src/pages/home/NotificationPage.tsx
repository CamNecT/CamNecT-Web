import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { viewChatRequestDetail, viewChatRoomDetail } from '../../api/chat';
import { axiosInstance } from '../../api/axiosInstance';
import { viewGifticonProduct } from '../../api/gifticon';
import {
  requestNotificationRead,
  requestNotificationReadAll,
  requestNotifications,
} from '../../api/notifications';
import type { ApiResponse, CommunityPostCommentResponse } from '../../api-types/communityApiTypes';
import PopUp from '../../components/Pop-up';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  notificationIconAssets,
  type NotificationItem,
  type NotificationType,
} from './notificationData';
import { mapNotificationResponseToItems } from './notificationMapper';
import { resolveNotificationDestination } from './notificationRouting';

type PopUpConfig = {
  title: string;
  content: string;
};

const resolveUserIdParam = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
};

const getErrorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object') return null;
  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === 'number' ? response.status : null;
};

const getErrorPopUpConfig = (status: number | null): PopUpConfig | null => {
  if (!status) return null;
  if (status === 403) {
    return {
      title: '접근 권한이 없습니다',
      content:
        '요청한 내용을 볼 권한이 없어요.',
    };
  }
  if (status === 404) {
    return {
      title: '페이지를 찾을 수 없습니다',
      content:
        '요청한 페이지를 찾을 수 없어요.',
    };
  }
  if (status === 500) {
    return {
      title: '시스템 오류가 발생했습니다',
      content:
        '잠시 후 다시 시도해 주세요.',
    };
  }
  return null;
};

// 알림 종류별로 사용자가 다음 행동을 알 수 있도록 이동 실패 문구를 구체화한다.
const getFallbackNavigationPopUpConfig = (notification?: NotificationItem): PopUpConfig => {
  if (!notification) {
    return {
      title: '알림으로 이동할 수 없어요',
      content: '연결된 화면을 열 수 없어요.',
    };
  }

  switch (notification.type) {
    case 'coffeeChatRequest':
    case 'coffeeChatAccepted':
      return {
        title: '커피챗을 열 수 없어요',
        content:
          '요청이 취소되었거나 종료된 커피챗이에요.',
      };
    case 'chatMessageReceived':
      return {
        title: '채팅방을 열 수 없어요',
        content:
          '이미 종료되었거나 나간 채팅방이에요.',
      };
    case 'comment':
    case 'reply':
    case 'commentAccepted':
      return {
        title: '게시글을 확인할 수 없어요',
        content:
          '게시글이나 댓글이 삭제되었을 수 있어요.',
      };
    case 'followingPosted':
      return {
        title: '새 게시글을 열 수 없어요',
        content:
          '삭제되었거나 볼 수 없는 게시글이에요.',
      };
    case 'teamApplicationReceived':
    case 'teamRecruitAccepted':
      return {
        title: '모집 글을 확인할 수 없어요',
        content:
          '모집이 종료되었거나 삭제된 글이에요.',
      };
    case 'pointUse':
    case 'pointEarn':
      return {
        title: '포인트 내역을 열 수 없어요',
        content:
          '연결된 포인트 내역을 찾을 수 없어요.',
      };
    default:
      return {
        title: '알림으로 이동할 수 없어요',
        content:
          '연결된 화면을 열 수 없어요.',
      };
  }
};

// 읽음 처리는 UI를 먼저 갱신하기 때문에 실패 시 되돌릴 수 있는 문구를 별도로 관리한다.
const getReadErrorPopUpConfig = (status: number | null, isAll = false): PopUpConfig => {
  if (status === 403) {
    return {
      title: '알림을 읽음 처리할 수 없어요',
      content: '이 알림을 변경할 권한이 없어요.',
    };
  }
  if (status === 404) {
    return {
      title: isAll ? '읽을 알림을 찾지 못했어요' : '알림을 찾지 못했어요',
      content: isAll
        ? '목록에 없는 알림이 포함되어 있어요.'
        : '이미 삭제되었거나 목록에 없는 알림이에요.',
    };
  }
  if (status === 500) {
    return {
      title: '알림 처리에 실패했어요',
      content:
        '서버 오류로 알림 상태를 바꾸지 못했어요.',
    };
  }
  return {
    title: isAll ? '모든 알림을 읽음 처리하지 못했어요' : '알림을 읽음 처리하지 못했어요',
    content:
      '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  };
};

// 서버 검증 실패와 앱 내부에서 만든 이동 불가 사유를 같은 팝업 형태로 맞춘다.
const getNavigationErrorPopUpConfig = (
  error: unknown,
  notification?: NotificationItem,
): PopUpConfig => {
  const config = (error as { popUpConfig?: PopUpConfig })?.popUpConfig;
  if (config) return config;

  const status = getErrorStatus(error);
  if (status === 403) {
    return {
      title: '알림 내용을 볼 수 없어요',
      content:
        '이 알림과 연결된 화면을 볼 권한이 없어요.',
    };
  }
  if (status === 404) {
    return getFallbackNavigationPopUpConfig(notification);
  }
  if (status === 500) {
    return {
      title: '알림 화면으로 이동하지 못했어요',
      content:
        '연결된 정보를 확인하는 중 문제가 생겼어요.',
    };
  }
  return getFallbackNavigationPopUpConfig(notification);
};

const createNavigationError = (popUpConfig: PopUpConfig) => ({ popUpConfig });

const getDestinationPathname = (destination: string) => {
  try {
    return new URL(destination, window.location.origin).pathname;
  } catch {
    return destination.split('?')[0] ?? destination;
  }
};

const getPathId = (pathname: string, pattern: RegExp) => {
  const match = pathname.match(pattern);
  return match?.[1] ? Number(match[1]) : null;
};

const isSameOriginDestination = (destination: string) => {
  try {
    const url = new URL(destination, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
};

const getDestinationSearchParams = (destination: string) => {
  try {
    return new URL(destination, window.location.origin).searchParams;
  } catch {
    const query = destination.split('?')[1] ?? '';
    return new URLSearchParams(query);
  }
};

const isStaticAppPath = (pathname: string) => {
  return [
    '/home',
    '/home/notices',
    '/chat',
    '/chat/requests',
    '/community',
    '/shop',
  ].includes(pathname);
};

const titleMap: Record<NotificationType, string> = {
  coffeeChatRequest: '커피챗 요청',
  pointUse: '포인트 사용',
  pointEarn: '포인트 적립',
  reply: '답글',
  comment: '댓글',
  commentAccepted: '댓글 채택',
  followingPosted: '새 게시글',
  teamApplicationReceived: '팀 지원 신청',
  coffeeChatAccepted: '커피챗 수락',
  teamRecruitAccepted: '팀 모집 수락',
  chatMessageReceived: '새 메시지',
  default: '알림',
};

const formatPoints = (points: number) => points.toLocaleString('ko-KR');

const getIconSvg = (type: NotificationType) => {
  if (type === 'pointUse') {
    return notificationIconAssets.find((icon) => icon.type === 'pointUse')?.svg;
  }
  if (type === 'pointEarn') {
    return notificationIconAssets.find((icon) => icon.type === 'pointEarn')?.svg;
  }
  return notificationIconAssets.find((icon) => icon.type === 'default')?.svg;
};

const renderContent = (notification: NotificationItem) => {
  switch (notification.type) {
    case 'coffeeChatRequest':
      if (notification.message) {
        return (
          <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
            {notification.message}
          </p>
        );
      }
      return (
        <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
          {notification.name}님께서 커피챗을 요청하였습니다.
        </p>
      );
    case 'pointUse':
      if (notification.message) {
        return (
          <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
            {notification.message}
          </p>
        );
      }
      return (
        <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
          {formatPoints(notification.points)}p 사용 완료!
        </p>
      );
    case 'pointEarn':
      if (notification.message) {
        return (
          <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
            {notification.message}
          </p>
        );
      }
      return (
        <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
          +{formatPoints(notification.points)}p 적립 완료!
        </p>
      );
    case 'commentAccepted':
      return (
        <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
          내 댓글이 채택되었어요. 지금바로 확인해보세요!
        </p>
      );
    case 'reply':
      if (notification.message) {
        return (
          <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
            {notification.message}
          </p>
        );
      }
      return (
        <div className="text-r-14 text-[var(--ColorGray3,#646464)]">
          <span className="block truncate">{notification.parentComment}</span>
          <span className="block truncate">
            새로운 답글이 달렸어요: {notification.replyContent}
          </span>
        </div>
      );
    case 'comment':
      if (notification.message) {
        return (
          <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
            {notification.message}
          </p>
        );
      }
      return (
        <div className="text-r-14 text-[var(--ColorGray3,#646464)]">
          <span className="block truncate">{notification.postTitle}</span>
          <span className="block truncate">
            새로운 댓글이 달렸어요: {notification.commentContent}
          </span>
        </div>
      );
    case 'followingPosted':
    case 'teamApplicationReceived':
    case 'coffeeChatAccepted':
    case 'teamRecruitAccepted':
    case 'chatMessageReceived':
    case 'default':
      return (
        <p className="text-r-14 text-[var(--ColorGray3,#646464)]">
          {notification.message}
        </p>
      );
    default:
      return null;
  }
};

const renderIcon = (notification: NotificationItem) => {
  // 1. 포인트 또는 새 게시글 알림은 서버에서 이미지를 주더라도 무조건 전용 SVG(또는 기본 로고) 아이콘을 우선함
  if (
    notification.type === 'pointUse' ||
    notification.type === 'pointEarn' ||
    notification.type === 'followingPosted'
  ) {
    const svg = getIconSvg(notification.type);
    return (
      <div
        className="h-[50px] w-[50px]"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg ?? '' }}
      />
    );
  }

  // 2. 프로필 이미지가 있고, 서버에서 주는 기본값(default.png)이 아닌 경우에만 이미지 렌더링
  if (
    notification.profileImageUrl &&
    !notification.profileImageUrl.includes('default.png')
  ) {
    return (
      <img
        src={notification.profileImageUrl}
        alt={`${notification.name || '유저'} 프로필`}
        className="h-[50px] w-[50px] rounded-full object-cover bg-[#ECECEC]"
      />
    );
  }

  // 3. 그 외에는 기본 로고 SVG 아이콘 출력
  const svg = getIconSvg(notification.type);

  return (
    <div
      className="h-[50px] w-[50px]"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
    />
  );
};

// 알림 클릭 전에 대상 리소스가 아직 접근 가능한지 확인해 빈 화면 이동을 막는다.
const validateNotificationDestination = async (
  destination: string,
  userId: string | number,
) => {
  if (!isSameOriginDestination(destination)) {
    throw createNavigationError(getFallbackNavigationPopUpConfig());
  }

  const pathname = getDestinationPathname(destination);
  const searchParams = getDestinationSearchParams(destination);
  const numericUserId = Number(userId);

  const communityPostId = getPathId(pathname, /^\/community\/post\/(\d+)$/);
  if (communityPostId) {
    await axiosInstance.get(`/api/community/posts/${communityPostId}`, {
      params: { userId: numericUserId },
    });

    const commentId = searchParams.get('commentId');
    if (commentId) {
      const response = await axiosInstance.get<ApiResponse<CommunityPostCommentResponse[]>>(
        `/api/community/posts/${communityPostId}/comments`,
      );
      const hasComment = response.data.data.some(
        (comment) => String(comment.commentId) === commentId,
      );

      if (!hasComment) {
        throw createNavigationError({
          title: '댓글을 확인할 수 없어요',
          content:
            '댓글이 삭제되었거나 볼 수 없는 상태예요.',
        });
      }
    }
    return;
  }

  const chatRequestId = getPathId(pathname, /^\/chat\/requests\/(\d+)$/);
  if (chatRequestId) {
    await viewChatRequestDetail({
      userId: numericUserId,
      requestId: chatRequestId,
    });
    return;
  }

  const chatRoomId = getPathId(pathname, /^\/chat\/(\d+)$/);
  if (chatRoomId) {
    const response = await viewChatRoomDetail({
      userId: numericUserId,
      roomId: chatRoomId,
    });

    if (response.data.closed || response.data.opponentExited) {
      throw createNavigationError({
        title: '커피챗을 열 수 없어요',
        content:
          '이미 종료되었거나 나간 커피챗이에요.',
      });
    }
    return;
  }

  const gifticonProductId = getPathId(pathname, /^\/shop\/(\d+)$/);
  if (gifticonProductId) {
    await viewGifticonProduct({ productId: gifticonProductId });
    return;
  }

  if (isStaticAppPath(pathname)) {
    return;
  }

  throw createNavigationError(getFallbackNavigationPopUpConfig());
};

export const NotificationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [popUpConfig, setPopUpConfig] = useState<PopUpConfig | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const userId = useAuthStore((state) => state.user?.id);
  const userIdParam = resolveUserIdParam(userId);
  const hasValidUserId = userIdParam !== null;
  const items = useNotificationStore((state) => state.items);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAsUnread = useNotificationStore((state) => state.markAsUnread);
  const setItems = useNotificationStore((state) => state.setItems);

  const { data: notificationResponse, error: notificationError, isLoading } = useQuery({
    queryKey: ['notifications', userIdParam],
    queryFn: () => requestNotifications({ userId: userIdParam as string | number, size: 20 }),
    enabled: hasValidUserId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!notificationResponse) return;
    const mappedItems = mapNotificationResponseToItems(notificationResponse);
    setItems(mappedItems);
  }, [notificationResponse, setItems]);

  const queryErrorConfig = useMemo(() => {
    if (isErrorDismissed) return null;
    const status = getErrorStatus(notificationError);
    return getErrorPopUpConfig(status);
  }, [notificationError, isErrorDismissed]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    setPopUpConfig(null);
    const destination = resolveNotificationDestination(notification);

    // 개별 알림은 낙관적으로 읽음 처리하고, API 실패 시 원래 상태로 되돌린다.
    if (!notification.isRead && hasValidUserId) {
      markAsRead(notification.id);

      try {
        await requestNotificationRead({
          userId: userIdParam as string | number,
          id: notification.id,
        });
        // 알림 읽음 처리 성공 시 안 읽은 개수 쿼리 무효화 (홈 화면 배지 업데이트용)
        queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount', userIdParam] });
        // 알림 목록 데이터 업데이트 (목록 UI 갱신용)
        queryClient.invalidateQueries({ queryKey: ['notifications', userIdParam] });
      } catch (error) {
        markAsUnread(notification.id);
        setPopUpConfig(getReadErrorPopUpConfig(getErrorStatus(error)));
        return;
      }
    }

    if (notification.type === 'pointUse' || notification.type === 'pointEarn') {
      return;
    }

    if (!destination) {
      setPopUpConfig(getFallbackNavigationPopUpConfig(notification));
      return;
    }

    try {
      if (hasValidUserId) {
        await validateNotificationDestination(destination, userIdParam as string | number);
      }
    } catch (error) {
      setPopUpConfig(getNavigationErrorPopUpConfig(error, notification));
      return;
    }

    navigate(destination);
  };

  const handleMarkAllAsRead = async () => {
    if (!hasValidUserId || isMarkingAllRead) return;

    if (!items.some((item) => !item.isRead)) return;

    setPopUpConfig(null);
    setIsMarkingAllRead(true);

    // 전체 읽음도 즉시 화면에 반영하되, read-all API 실패 시 이전 목록을 복구한다.
    const previousItems = items;
    setItems(items.map((item) => ({ ...item, isRead: true })));

    try {
      await requestNotificationReadAll({
        userId: userIdParam as string | number,
      });

      queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount', userIdParam] });
      queryClient.invalidateQueries({ queryKey: ['notifications', userIdParam] });
    } catch (error) {
      setItems(previousItems);
      setPopUpConfig(getReadErrorPopUpConfig(getErrorStatus(error), true));
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const activePopUpConfig = popUpConfig ?? queryErrorConfig;
  const hasUnreadNotifications = items.some((item) => !item.isRead);

  return (
    <HeaderLayout
      headerSlot={
        <MainHeader
          title="알림"
          rightElement={
            items.length > 0 ? (
              <button
                type="button"
                className="text-m-16 text-[var(--ColorGray4,#A1A1A1)] disabled:cursor-default disabled:opacity-50"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead || !hasUnreadNotifications}
              >
                모두 읽음
              </button>
            ) : null
          }
        />
      }
    >
      <section className="w-full flex-1 bg-white flex flex-col">
        {items.length > 0 ? (
          items.map((notification) => (
            <div
              key={notification.id}
              className={`grid min-h-[70px] w-full grid-cols-[50px_minmax(0,1fr)] items-center gap-[13px] px-[25px] py-[10px] border-t border-[var(--Color_Gray_B,#ECECEC)] last:border-b ${
                notification.isRead ? 'bg-white' : 'bg-[var(--ColorSub2,#F2FCF8)]'
              }`}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleNotificationClick(notification);
                }
              }}
            >
              {renderIcon(notification)}
              <div className="flex min-w-0 flex-col gap-[4px]">
                <div className="flex items-start justify-between gap-[8px]">
                  <p className="min-w-0 truncate text-sb-14 text-[var(--ColorBlack,#202023)]">
                    [{titleMap[notification.type]}]
                  </p>
                  <span className="shrink-0 text-r-12 text-[var(--ColorGray3,#646464)]">
                    {notification.dateLabel}
                  </span>
                </div>
                {renderContent(notification)}
              </div>
            </div>
          ))
        ) : (
          !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center text-center pb-[100px]">
              <p className="text-r-18 text-gray-700">
                아직 도착한 알림이 없어요
              </p>
            </div>
          )
        )}
      </section>
      {activePopUpConfig && (
        <PopUp
          isOpen={!!activePopUpConfig}
          type="error"
          title={activePopUpConfig.title}
          content={activePopUpConfig.content}
          onClick={() => {
            setPopUpConfig(null);
            setIsErrorDismissed(true);
          }}
        />
      )}
    </HeaderLayout>
  );
};
