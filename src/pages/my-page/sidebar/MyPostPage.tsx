import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { MainHeader } from "../../../layouts/headers/MainHeader";
import { Tabs, type TabItem } from "../../../components/Tabs";
import { CommunityPost } from "../../../components/posts/CommunityPost";
import InternalActivityPost from "../../../components/posts/InternalActivityPost";
import ExternalActivityPost from "../../../components/posts/ExternalActivityPost";
import { RecruitPost } from "../../../components/posts/RecruitPost";
import SortSelector from "../../../components/SortSelector";
import { useAuthStore } from "../../../store/useAuthStore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { categoryToTab } from "../../../types/activityPage/activityPageTypes";
import { getMyPostsCommunity, getMyPostsExternal, getMyPostsRecruitment } from "../../../api/userInfoApi";
import type { CommunityPostItem, ActivityItem, RecruitmentItem, PostItem, PostSortType } from "../../../api-types/userInfoApiTypes";

type TabType = 'community' | 'activity' | 'recruit';
type SortType = 'recommended' | 'latest';

const TAB_ITEMS: TabItem[] = [
    { id: 'community', label: '커뮤니티' },
    { id: 'activity', label: '대외활동' },
    { id: 'recruit', label: '팀원 모집' }
];

const SORT_LABELS: Record<SortType, string> = {
    recommended: "추천순",
    latest: '최신순',
};

const SORT_MAP: Record<SortType, PostSortType> = {
    recommended: 'RECOMMENDED',
    latest: 'LATEST',
};

// Type guards
const isCommunityPost = (item: PostItem): item is CommunityPostItem => {
    return 'postId' in item;
};

const isActivityPost = (item: PostItem): item is ActivityItem => {
    return 'activityId' in item;
};

const isRecruitmentPost = (item: PostItem): item is RecruitmentItem => {
    return 'recruitId' in item;
};

const fallbackAuthor: NonNullable<CommunityPostItem["author"]> = {
    userId: 0,
    name: "익명",
    profileImageUrl: null,
    studentNo: "",
    majorName: "",
};


export const MyPostsPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore(state => state.user);
    const userId = authUser?.id ? parseInt(authUser.id) : null;

    const [activeTab, setActiveTab] = useState<TabType>('community');
    const [sortOrder, setSortOrder] = useState<SortType>('latest');

    const listRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // 탭 바뀔 때마다 스크롤 맨 위로
        listRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }, [activeTab]);

    const sort = SORT_MAP[sortOrder];

    // 커뮤니티 작성글
    const {
        data: communityData,
        fetchNextPage: fetchNextCommunity,
        hasNextPage: hasNextCommunity,
        isFetchingNextPage: isFetchingCommunity,
    } = useInfiniteQuery({
        queryKey: ["myPosts", "community", userId, sort],
        queryFn: ({ pageParam }) => getMyPostsCommunity({
            userId: userId!,
            sort,
            cursorId: pageParam?.cursorId,
            cursorValue: pageParam?.cursorValue,
        }),
        initialPageParam: undefined as { cursorId: number; cursorValue: number } | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.data.hasNext
                ? { cursorId: lastPage.data.nextCursorId, cursorValue: lastPage.data.nextCursorValue }
                : undefined,
        enabled: !!userId && activeTab === 'community',
    });

    // 대외활동 작성글
    const {
        data: externalData,
        fetchNextPage: fetchNextExternal,
        hasNextPage: hasNextExternal,
        isFetchingNextPage: isFetchingExternal,
    } = useInfiniteQuery({
        queryKey: ["myPosts", "external", userId, sort],
        queryFn: ({ pageParam }) => getMyPostsExternal({
            userId: userId!,
            sort,
            cursorId: pageParam?.cursorId,
            cursorValue: pageParam?.cursorValue,
        }),
        initialPageParam: undefined as { cursorId: number; cursorValue: number } | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.data.hasNext
                ? { cursorId: lastPage.data.nextCursorId, cursorValue: lastPage.data.nextCursorValue }
                : undefined,
        enabled: !!userId && activeTab === 'activity',
    });

    // 팀원모집 작성글
    const {
        data: recruitData,
        fetchNextPage: fetchNextRecruit,
        hasNextPage: hasNextRecruit,
        isFetchingNextPage: isFetchingRecruit,
    } = useInfiniteQuery({
        queryKey: ["myPosts", "recruitment", userId, sort],
        queryFn: ({ pageParam }) => getMyPostsRecruitment({
            userId: userId!,
            sort,
            cursorId: pageParam?.cursorId,
            cursorValue: pageParam?.cursorValue,
        }),
        initialPageParam: undefined as { cursorId: number; cursorValue: number } | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.data.hasNext
                ? { cursorId: lastPage.data.nextCursorId, cursorValue: lastPage.data.nextCursorValue }
                : undefined,
        enabled: !!userId && activeTab === 'recruit',
    });

    // 무한스크롤 감지
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (activeTab === 'community' && hasNextCommunity && !isFetchingCommunity) {
                        fetchNextCommunity();
                    } else if (activeTab === 'activity' && hasNextExternal && !isFetchingExternal) {
                        fetchNextExternal();
                    } else if (activeTab === 'recruit' && hasNextRecruit && !isFetchingRecruit) {
                        fetchNextRecruit();
                    }
                }
            },
            { threshold: 0.5 }
        );

        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [activeTab, hasNextCommunity, hasNextExternal, hasNextRecruit, isFetchingCommunity, isFetchingExternal, isFetchingRecruit, fetchNextCommunity, fetchNextExternal, fetchNextRecruit]);

    // 각 탭 아이템 flatten
    const communityItems = communityData?.pages.flatMap(p => p.data.items) ?? [];
    const externalItems = externalData?.pages.flatMap(p => p.data.items) ?? [];
    const recruitItems = recruitData?.pages.flatMap(p => p.data.items) ?? [];

    const getPostCount = () => {
        if (activeTab === 'community') return communityItems.length;
        if (activeTab === 'activity') return externalItems.length;
        return recruitItems.length;
    };

    // 아이템 렌더링
    const renderItem = (item: PostItem, index: number) => {
        if (isCommunityPost(item)) {
            return (
                <CommunityPost
                    key={`community-${item.postId}-${index}`}
                    post={{
                        postId: item.postId,
                        boardCode:item.boardCode,
                        tags:item.tags,
                        author: item.author ?? fallbackAuthor,
                        title: item.title,
                        createdAt:item.createdAt,
                        preview:item.preview,
                        likeCount: item.likeCount,
                        answerCount: item.answerCount,
                        commentCount: item.commentCount,
                        bookmarkCount: item.bookmarkCount,
                        thumbnailUrl:item.thumbnailUrl,
                        acceptedBadge: item.acceptedBadge,
                        accessType: item.accessType,
                        accessStatus: item.accessStatus,
                    }}
                />
            );
        }
        
        if (isActivityPost(item)) {
            const isInternal = item.category === 'CLUB' || item.category === 'STUDY';
            
            if (isInternal) {
                return (
                    <InternalActivityPost
                        key={`activity-${item.activityId}-${index}`}
                        post={{
                            id: String(item.activityId),
                            tab: categoryToTab[item.category],
                            title: item.title,
                            author: {
                                id: '',
                                name: '',
                                major: '',
                                studentId: '',
                                profileImageUrl: null,
                            },
                            content: item.contextPreview,
                            categories: item.tags,
                            saveCount: item.bookmarkCount,
                            createdAt: item.createdAt,
                            status: item.status,
                            thumbnailUrl: item.thumbnailUrl,
                        }}
                        showRecruitStatus={true}
                    />
                );
            } else {
                return (
                    <ExternalActivityPost
                        key={`activity-${item.activityId}-${index}`}
                        post={{
                            id: String(item.activityId),
                            title: item.title,
                            author: {
                                id: '',
                                name: '',
                                major: '',
                                studentId: '',
                                profileImageUrl: null,
                            },
                            categories: item.tags,
                            saveCount: item.bookmarkCount,
                            organizer: item.organizer,
                            deadline: item.applyEndDate,
                            thumbnailUrl: item.thumbnailUrl,
                            tab: categoryToTab[item.category],
                            contextTitle: item.contextPreview,
                            createdAt: item.createdAt
                        }}
                    />
                );
            }
        }
        
        if (isRecruitmentPost(item)) {
            return (
                <RecruitPost
                    key={`recruit-${item.recruitId}-${index}`}
                    id={String(item.recruitId)}
                    activityId=""
                    authorId=""
                    activityName={item.activityTitle}
                    authorName={item.userName}
                    recruitNow={item.recruitStatus === 'RECRUITING'}
                    title={item.title}
                    bookmarkCount={item.bookmarkCount}
                    createdAt={item.createdAt}
                />
            );
        }
        
        return null;
    };

    return (
        <HeaderLayout
            headerSlot={
                <div className="sticky top-0 z-50 bg-white">
                    <MainHeader
                        title="작성한 글"
                        leftAction={{ onClick: () => navigate(-1) }}
                    />
                    <Tabs
                        tabs={TAB_ITEMS}
                        activeId={activeTab}
                        onChange={(id) => setActiveTab(id as TabType)}
                    />
                </div>
            }
        >
            <div className="w-full bg-white h-full flex flex-col min-h-0">
                <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
                    {/* Sort Selector */}
                    <div className="flex justify-end px-[25px] pt-[20px]">
                        <SortSelector
                            sortKey={sortOrder}
                            sortLabels={SORT_LABELS}
                            onChange={(key) => setSortOrder(key)}
                            modalTitle="정렬"
                            buttonClassName="text-r-14-hn text-gray-650"
                        />
                    </div>

                    <div className="flex flex-col">
                        {getPostCount() === 0 ? (
                            <div className="flex items-center justify-center py-[80px]">
                                <span className="text-r-14-hn text-gray-650">작성한 글이 없습니다</span>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {activeTab === 'community' && communityItems.map((item, idx) => renderItem(item, idx))}
                                {activeTab === 'activity' && externalItems.map((item, idx) => renderItem(item, idx))}
                                {activeTab === 'recruit' && recruitItems.map((item, idx) => renderItem(item, idx))}
                            </div>
                        )}
                    </div>

                    {/* 무한스크롤 트리거 */}
                    <div ref={bottomRef} className="h-[1px]" />

                    {/* 로딩 인디케이터 */}
                    {(isFetchingCommunity || isFetchingExternal || isFetchingRecruit) && (
                        <div className="flex justify-center py-[20px]">
                            <span className="text-r-14-hn text-gray-650">불러오는 중...</span>
                        </div>
                    )}
                </div>
            </div>
        </HeaderLayout>
    );
};