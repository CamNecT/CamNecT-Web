import type {
  ActivityListItem,
  ActivityDetailData,
  ActivityCategory,
  RecruitmentItem,
  ProfilePreview,
  ActivitySortType
} from '../../../api-types/activityApiTypes';
import type {
  ActivityPost,
  ActivityPostTab,
  ActivityPostDetail,
  TeamRecruitPost,
} from '../../../types/activityPage/activityPageTypes';
import type { TagCategory } from '../../../components/TagsFilterModal';

const toArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

//카테고리 변환
export const categoryToTab = (category: ActivityCategory): ActivityPostTab => {
  const map: Record<ActivityCategory, ActivityPostTab> = {
    CLUB: 'club',
    STUDY: 'study',
    EXTERNAL: 'external',
    RECRUITMENT: 'job',
  };
  return map[category];
};

export const tabToCategory = (tab: ActivityPostTab): ActivityCategory => {
  const map: Record<ActivityPostTab, ActivityCategory> = {
    club: 'CLUB',
    study: 'STUDY',
    external: 'EXTERNAL',
    job: 'RECRUITMENT',
  };
  return map[tab];
};

//프로필 변환

export const mapProfilePreviewToAuthor = (profile: ProfilePreview | null) => {
  if (profile) {
    return {
      id: String(profile.userId),
      name: profile.name,
      profileImageUrl: profile.profileImageUrl || null,
      major: profile.majorName,
      studentId: profile.studentNo,
    };
  } else {
    // 비회원 응답 위한 mock data
    return {
      id: "0",
      name: "우리 학교 동문",
      profileImageUrl: null,
      major: "",
      studentId: "",
    };
  }
};

//목록 아이템 변환
export const mapListItemToActivityPost = (item: ActivityListItem, category: ActivityCategory): ActivityPost => {
  return {
    id: String(item.activityId),
    tab: categoryToTab(category),
    title: item.title,
    content: item.contextPreview,
    categories: item.tags,
    saveCount: item.bookmarkCount,
    createdAt: item.createdAt,
    author: {
      id: '',
      name: '',
      major: '',
      studentId: '',
      profileImageUrl: null,
    },
    status: item.status,
    postImages: [],
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    organizer: item.organizer ?? undefined,
    deadline: item.applyEndDate ?? undefined,
  };
};

//상세 데이터 변환
export const mapDetailToActivityPost = (
  detailData: ActivityDetailData,
  tagIdToNameMap: Map<number, string>
): ActivityPostDetail => {
  const { activity, attachment, tagIds, isBookmarked, bookmarkCount, author } = detailData;

  return {
    id: String(activity.activityId),
    tab: categoryToTab(activity.category),
    title: activity.title,
    content: activity.context,
    categories: (tagIds ?? []).map(id => tagIdToNameMap.get(id) ?? '').filter(Boolean),
    saveCount: bookmarkCount,
    createdAt: activity.createdAt,
    author: mapProfilePreviewToAuthor(author),
    status: activity.status,
    postImages: toArray(attachment).map((a) => a.fileUrl),
    thumbnailUrl: activity.thumbnailUrl ?? null,
    organizer: activity.organizer ?? null,
    deadline: activity.applyEndDate ?? null,
    contextTitle: activity.contextTitle ?? null,
    // ActivityPostDetail 전용 필드
    isMine: detailData.isMine,
    isBookmarked: isBookmarked,
    location: activity.region ?? null,
    target: activity.targetDescription ?? null,
    applyPeriod: activity.applyStartDate && activity.applyEndDate
      ? { start: activity.applyStartDate, end: activity.applyEndDate }
      : null,
    announceDate: activity.resultAnnounceDate ?? null,
    applyUrl: activity.officialUrl ?? null,
    context: activity.context,
  };
};

//팀원 모집 변환
export const mapRecruitmentItemToTeamRecruitPost = (
  item: RecruitmentItem,
): TeamRecruitPost => {
  return {
    id: String(item.recruitId),
    title: item.title,
    activityId: String(item.activityId),
    authorId: String(item.userId),
    recruitNow: item.recruitStatus === 'RECRUITING',
    authorName: item.userName, // ✅ userName 사용
    activityName: item.activityTitle, // ✅ activityTitle 사용
    bookmarkCount: item.bookmarkCount,
    createdAt: item.createdAt,
  };
};

type SortInternalKey = 'recommended' | 'latest' | 'bookmarks';
type SortExternalKey = 'recommended' | 'latest' | 'deadline' | 'bookmarks' | 'recruits';
type SortKey = SortInternalKey | SortExternalKey;

//정렬 타입 변환
const EXTERNAL_SORT_MAP: Record<SortExternalKey, ActivitySortType> = {
  recommended: 'RECOMMEND',
  latest: 'LATEST',
  deadline: 'DEADLINE',
  bookmarks: 'BOOKMARK',
  recruits: 'RECRUIT',
};

const INTERNAL_SORT_MAP: Record<SortInternalKey, ActivitySortType> = {
  recommended: 'RECOMMEND',
  latest: 'LATEST',
  bookmarks: 'BOOKMARK',
};

export const sortKeyToApiSortType = (
  sortKey: SortKey,
  isExternal: boolean,
): ActivitySortType => {
  if (isExternal) {
    return EXTERNAL_SORT_MAP[sortKey as SortExternalKey] ?? 'LATEST';
  }
  return INTERNAL_SORT_MAP[sortKey as SortInternalKey] ?? 'LATEST';
};


//태그 변환
export const mapApiTagCategoryToUiTagCategory = (
  apiCategory: import('../../../api-types/activityApiTypes').TagCategory,
): TagCategory => {
  return {
    id: String(apiCategory.categoryId),
    name: apiCategory.categoryName,
    tags: apiCategory.tags.map((tag) => ({
      id: String(tag.id),
      name: tag.name,
      category: String(apiCategory.categoryId),
    })),
  };
};