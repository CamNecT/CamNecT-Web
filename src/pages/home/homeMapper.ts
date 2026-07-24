import type { HomeResponse, TagItem } from "../../api-types/homeApiTypes";
import type { CoffeeChatRequest } from "./components/CoffeeChatBox";
import type { Contest } from "./components/ContestBox";
import type { RecommendBoxProps } from "./components/RecommendBox";
import { mapMajorIdToName } from "../../utils/majorMapper";

export type HomeViewModel = {
    userName: string;
    coffeeChatRequests: CoffeeChatRequest[];
    coffeeChatTotalCount: number;
    recruitmentTotalCount: number;
    pointBalance: number;
    recommendList: RecommendBoxProps[];
    contests: Contest[];
};

const normalizeCategoryCode = (value?: string) => (value ?? "").toLowerCase();
const normalizeUrl = (value?: string) => value?.trim() ?? "";

const isMajorCategory = (tag?: TagItem) => {
    if (!tag?.category) return false;
    const code = normalizeCategoryCode(tag.category.code);
    return code === "field_major" || code.includes("major");
};

const resolveMajorName = (tags: Array<TagItem | string>, majorId?: number) => {
    const majorTag = tags.find((tag) =>
        typeof tag === "string" ? false : isMajorCategory(tag),
    ) as TagItem | undefined;
    if (majorTag?.name) return majorTag.name;
    if (majorId && majorId > 0) return mapMajorIdToName(majorId);
    return "-";
};

const resolveCategories = (tags: Array<TagItem | string>, majorName: string) => {
    const tagNames = tags
        .map((tag) => (typeof tag === "string" ? tag : tag.name))
        .filter((name): name is string => Boolean(name && name.trim()))
        .map((name) => name.trim());
    return tagNames.filter((name) => name !== majorName);
};

const resolveProfileImageUrl = (url?: string) => {
    const trimmed = normalizeUrl(url);
    if (!trimmed) return undefined;
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }
    const base = normalizeUrl(import.meta.env.VITE_API_BASE_URL);
    if (!base) return trimmed;
    const normalizedBase = base.replace(/\/$/, "");
    const normalizedPath = trimmed.replace(/^\//, "");
    return `${normalizedBase}/${normalizedPath}`;
};

export const mapHomeResponseToViewModel = (
    response: HomeResponse | undefined,
    fallback: HomeViewModel,
): HomeViewModel => {
    if (!response?.data) return fallback;

    const { data } = response;

    const coffeeChatRequests: CoffeeChatRequest[] = (data.coffeeChat?.latest2 ?? []).map((request) => ({
        name: request.senderName,
        major: request.majorName,
        studentId: request.studentNo,
    }));

    const recommendList: RecommendBoxProps[] = (data.alumni?.items ?? []).map((alumni) => {
        const tags = alumni.tagList ?? [];
        const majorName = resolveMajorName(tags, alumni.profile?.majorId);
        const categories = resolveCategories(tags, majorName);

        return {
            userId: String(alumni.userId),
            name: alumni.name,
            profileImage: resolveProfileImageUrl(alumni.profile?.profileImageUrl),
            major: majorName,
            studentId: alumni.profile?.studentNo ?? "",
            intro: alumni.profile?.bio ?? "",
            categories,
        };
    });

    const contests: Contest[] = (data.contests?.items ?? []).map((contest) => ({
        id: String(contest.contestId),
        title: contest.title,
        posterImgUrl: contest.thumbnailUrl || undefined,
        organizer: contest.organizer,
        location: "-",
        deadline: "-",
        views: 0,
        comments: 0,
        isHot: false,
        isClosingSoon: false,
    }));

    return {
        userName: data.user?.displayName || fallback.userName,
        coffeeChatRequests,
        coffeeChatTotalCount:
            typeof data.coffeeChat?.pendingCount === "number"
                ? data.coffeeChat.pendingCount
                : coffeeChatRequests.length,
        // 팀원 모집 요청 수는 홈 API의 recruitment.pendingCount를 우선 사용합니다.
        recruitmentTotalCount:
            typeof data.recruitment?.pendingCount === "number"
                ? data.recruitment.pendingCount
                : data.recruitment?.latest2?.length ?? fallback.recruitmentTotalCount,
        pointBalance:
            typeof data.point?.balance === "number" ? data.point.balance : fallback.pointBalance,
        recommendList,
        contests,
    };
};
