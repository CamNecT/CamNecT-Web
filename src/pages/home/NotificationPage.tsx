import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestNotificationRead, requestNotifications } from '../../api/notifications';
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
        '요청하신 페이지를 볼 수 있는 권한이 없어요.\\n관리자에게 문의하시거나 권한을 확인해 주세요.',
    };
  }
  if (status === 404) {
    return {
      title: '페이지를 찾을 수 없습니다',
      content:
        '요청하신 페이지는 존재하지 않는 주소입니다.\\n주소를 다시 한번 확인해 주세요.',
    };
  }
  if (status === 500) {
    return {
      title: '시스템 오류가 발생했습니다',
      content:
        '서비스 이용에 불편을 드려 죄송합니다.\\n잠시 후 다시 시도해 주세요.',
    };
  }
  return null;
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

export const NotificationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [popUpConfig, setPopUpConfig] = useState<PopUpConfig | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const userId = useAuthStore((state) => state.user?.id);
  const userIdParam = resolveUserIdParam(userId);
  const hasValidUserId = userIdParam !== null;
  const items = useNotificationStore((state) => state.items);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
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
    markAsRead(notification.id);
    if (hasValidUserId) {
      try {
        await requestNotificationRead({
          userId: userIdParam as string | number,
          id: notification.id,
        });
        // 알림 읽음 처리 성공 시 안 읽은 개수 쿼리 무효화 (홈 화면 배지 업데이트용)
        queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] });
        // 알림 목록 데이터 업데이트 (목록 UI 갱신용)
        queryClient.invalidateQueries({ queryKey: ['notifications', userIdParam] });
      } catch (error) {
        const status = getErrorStatus(error);
        const config = getErrorPopUpConfig(status);
        if (config) {
          setPopUpConfig(config);
        }
      }
    }

    // 서버가 준 link가 있다면 최우선적으로 거기로 이동
    if (notification.link) {
      navigate(notification.link);
      return;
    }

    switch (notification.type) {
      case 'coffeeChatRequest':
        if (notification.requestId) {
          navigate(`/chat/requests/${notification.requestId}`);
        }
        break;
      case 'pointUse':
        // 포인트 사용 - 내역 페이지가 없음 클릭해도 이동 X
        break;
      case 'pointEarn':
        // 포인트 적립 - 내역 페이지가 없음 클릭해도 이동 X
        break;
      case 'commentAccepted':
      case 'reply':
      case 'comment':
        if (notification.postId) {
          navigate(`/community/post/${notification.postId}`);
        }
        break;
      default:
        break;
    }
  };

  const activePopUpConfig = popUpConfig ?? queryErrorConfig;

  return (
    <HeaderLayout headerSlot={<MainHeader title="알림" />}>
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
