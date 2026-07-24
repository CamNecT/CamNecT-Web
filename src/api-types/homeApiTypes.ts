export interface HomeRequest {
    userId: number | string;
}

export interface HomeResponse {
    status: number;
    message: string;
    data: HomeData;
}

export interface HomeData {
    user: {
        displayName: string;
    };
    coffeeChat: HomeRequestGroup<CoffeeChatLatestItem>;
    recruitment: HomeRequestGroup<RecruitmentLatestItem>;
    point: {
        balance: number;
    };
    alumni: {
        items: AlumniItem[];
        hasMore: boolean;
    };
    contests: {
        items: ContestItem[];
        hasMore: boolean;
    };
}

// 커피챗/팀원 모집 요청 요약은 같은 pendingCount/latest2 응답 구조를 공유합니다.
export interface HomeRequestGroup<TLatestItem> {
    pendingCount: number;
    latest2: TLatestItem[];
}

export interface CoffeeChatLatestItem {
    requestId: number;
    senderUserId: number;
    senderName: string;
    majorName: string;
    studentNo: string;
}

export interface RecruitmentLatestItem {
    requestId: number;
    senderUserId: number;
    senderName: string;
    majorName: string;
    studentNo: string;
    recruitmentId?: number;
    recruitmentTitle?: string;
    activityId?: number;
}

export interface AlumniItem {
    userId: number;
    name: string;
    profile: {
        bio: string;
        openToCoffeeChat: boolean;
        profileImageUrl: string;
        studentNo: string;
        majorId: number;
    };
    tagList: Array<TagItem | string>;
}

export interface TagItem {
    id: number;
    name: string;
    category: TagCategory;
    active: boolean;
    createdAt: string;
}

export interface TagCategory {
    id: number;
    code: string;
    name: string;
    sortOrder: number;
    active: boolean;
}

export interface ContestItem {
    contestId: number;
    title: string;
    organizer: string;
    thumbnailUrl: string;
}
