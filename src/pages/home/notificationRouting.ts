import type { NotificationItem } from './notificationData';

export const buildCommunityPostLink = (postId?: number, commentId?: number) => {
  if (!postId) return null;
  if (!commentId) return `/community/post/${postId}`;

  const searchParams = new URLSearchParams({
    commentId: String(commentId),
  });

  return `/community/post/${postId}?${searchParams.toString()}`;
};

export const resolveNotificationDestination = (notification: NotificationItem) => {
  if (notification.link) return notification.link;

  switch (notification.type) {
    case 'coffeeChatRequest':
    case 'teamApplicationReceived':
      return notification.requestId
        ? `/chat/requests/${notification.requestId}`
        : null;
    case 'coffeeChatAccepted':
    case 'chatMessageReceived':
      return '/chat';
    case 'teamRecruitAccepted':
      return notification.requestId
        ? `/chat/requests/${notification.requestId}`
        : null;
    case 'followingPosted':
      return notification.postId
        ? buildCommunityPostLink(notification.postId, notification.commentId)
        : null;
    case 'commentAccepted':
    case 'reply':
    case 'comment':
      return notification.postId && notification.commentId
        ? buildCommunityPostLink(notification.postId, notification.commentId)
        : null;
    case 'pointUse':
    case 'pointEarn':
      return '/home';
    case 'default':
    default:
      return null;
  }
};
