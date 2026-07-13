export type NotificationApiType =
  | 'COMMENT_ACCEPTED'
  | 'COFFEE_CHAT_REQUESTED'
  | 'POINT_EARNED'
  | 'POINT_SPENT'
  | 'POST_COMMENTED'
  | 'COMMENT_REPLIED'
  | 'FOLLOWING_POSTED'
  | 'TEAM_APPLICATION_RECEIVED'
  | 'COFFEE_CHAT_ACCEPTED'
  | 'TEAM_RECRUIT_ACCEPTED'
  | 'CHAT_MESSAGE_RECEIVED';

export interface NotificationListRequest {
  userId: number | string;
  cursorId?: number;
  size?: number;
}

export interface NotificationUnreadCountRequest {
  userId: number | string;
}

export interface NotificationReadRequest {
  userId: number | string;
  id: number | string;
}

export interface NotificationReadAllRequest {
  userId: number | string;
}

export interface NotificationListResponse {
  status: number;
  message: string;
  data: NotificationListData;
}

export interface NotificationUnreadCountResponse {
  status: number;
  message: string;
  data: {
    unreadCount: number;
  };
}

export type NotificationReadResponse = void;
export type NotificationReadAllResponse = void;

export interface NotificationListData {
  items: NotificationApiItem[];
  nextCursorId: number | null;
  hasNext: boolean;
}

export interface NotificationApiItem {
  id: number;
  type: NotificationApiType;
  title: string;
  message: string;
  read: boolean;
  actorUserId: number;
  actorName: string;
  actorProfileImageUrl: string;
  postId?: number;
  commentId?: number;
  requestId?: number;
  link?: string;
  createdAt: string;
}
