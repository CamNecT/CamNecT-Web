import type { PenaltyType ,ReportCategory, ReportStatus, TargetType } from '../../../api-types/reportApiTypes';
import type { StatusBadgeVariant } from '../components/StatusBadge';

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  INSULT_DEFAMATION: '욕설/비하',
  SEXUAL_HARASSMENT: '성희롱/성적 발언',
  BUSINESS_PROMOTION: '스팸 및 광고',
  FRAUD: '사기 및 금전 요구',
  FALSE_INFORMATION: '허위 정보 또는 허위 모집',
  HARASSMENT_THREAT: '괴롭힘/협박',
  INAPPROPRIATE_PROFILE: '부적절한 프로필',
  NO_SHOW_ABANDONMENT: '노쇼 및 잠수',
  OTHER: '기타',
};

export const REPORT_TARGET_TYPE_LABEL: Record<TargetType, string> = {
  COMMUNITY: '커뮤니티',
  COMMUNITY_COMMENT: '댓글',
  ACTIVITY: '대외활동',
  ACTIVITY_RECRUITMENT: '대외활동 모집',
  USER: '사용자 프로필',
  CHAT: '커피챗',
};

export const REPORT_STATUS_BADGE_LABEL: Record<ReportStatus, string> = {
  RECEIVED: '처리 전',
  RESOLVED: '처리 완료',
  REJECTED: '반려됨',
};

export const REPORT_STATUS_TAB_LABEL: Record<ReportStatus, string> = {
  RECEIVED: '처리 필요',
  RESOLVED: '처리 완료',
  REJECTED: '반려됨',
};

export const REPORT_STATUS_VARIANT: Record<ReportStatus, StatusBadgeVariant> = {
  RECEIVED: 'green',
  RESOLVED: 'gray',
  REJECTED: 'gray',
};

// 신고 유형 선택 화면에 표시할 순서
export const REPORT_CATEGORY_ORDER: ReportCategory[] = [
  'INSULT_DEFAMATION',
  'SEXUAL_HARASSMENT',
  'BUSINESS_PROMOTION',
  'FRAUD',
  'FALSE_INFORMATION',
  'HARASSMENT_THREAT',
  'INAPPROPRIATE_PROFILE',
  'NO_SHOW_ABANDONMENT',
  'OTHER',
];

export const PENALTY_TYPE_LABEL: Record<PenaltyType, string> = {
  WARNING: '경고',
  SUSPENDED_7_DAYS: '7일 이용 정지',
  PERMANENT_BAN: '영구 차단',
};

export const PENALTY_STATUS_BADGE_LABEL: Record<PenaltyType, string> = {
  WARNING: '경고처리된 사용자',
  SUSPENDED_7_DAYS: '정지처리된 사용자',
  PERMANENT_BAN: '영구정지된 사용자',
};

//매핑에 없는 값이 오더라도 화면이 깨지지 않도록 원문을 그대로 fallback으로 반환
export const getReportCategoryLabel = (category: ReportCategory): string =>
  REPORT_CATEGORY_LABEL[category] ?? category;

export const getReportTargetTypeLabel = (type: TargetType): string =>
  REPORT_TARGET_TYPE_LABEL[type] ?? type;

export const getReportStatusBadgeLabel = (status: ReportStatus): string =>
  REPORT_STATUS_BADGE_LABEL[status] ?? status;

export const getReportStatusVariant = (status: ReportStatus): StatusBadgeVariant =>
  REPORT_STATUS_VARIANT[status] ?? 'gray';

export const getPenaltyTypeLabel = (penalty: PenaltyType): string =>
  PENALTY_TYPE_LABEL[penalty] ?? penalty;
 
export const getPenaltyStatusBadgeLabel = (penalty: PenaltyType): string =>
  PENALTY_STATUS_BADGE_LABEL[penalty] ?? penalty;