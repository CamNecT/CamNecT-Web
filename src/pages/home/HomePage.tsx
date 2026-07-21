
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestHome } from '../../api/home';
import { requestNotificationUnreadCount } from '../../api/notifications';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import PopUp from '../../components/Pop-up';
import { useFcmToken } from '../../hooks/useFcmNotification';
import { FullLayout } from '../../layouts/FullLayout';
import { Logo } from '../../layouts/headers/HomeHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { usePointStore } from '../../store/usePointStore';
import CoffeeChatBox from './components/CoffeeChatBox';
import CommunityBox from './components/CommunityBox';
import ContestBox from './components/ContestBox';
import PointBox from './components/PointBox';
import RecommendBox from './components/RecommendBox';
import { homeGreetingUser } from './homeData';
import { mapHomeResponseToViewModel } from './homeMapper';

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

export const HomePage = () => {
    const navigate = useNavigate();
    const [isErrorDismissed, setIsErrorDismissed] = useState(false);
    const hasUnreadNotificationsFromStore = useNotificationStore((state) =>
        state.items.some((notice) => !notice.isRead),
    );
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { handleRequestPermission } = useFcmToken();
    const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        // 브라우저가 Notification API를 지원하는지 확인
        if (!("Notification" in window)) return;

        // 세션 내에 이미 등록을 시도했는지 확인
        const isRegisteredInSession = sessionStorage.getItem('FCM_REGISTERED_IN_SESSION');

        // 1. 이미 알림 권한이 허용된 상태라면 (이번 세션 최초 1회만 등록/최신화)
        if (Notification.permission === 'granted' && !isRegisteredInSession) {
            handleRequestPermission();
            sessionStorage.setItem('FCM_REGISTERED_IN_SESSION', 'true');
            return;
        }

        // 2. 권한이 아직 '기본' 상태이고 안내 팝업을 본 적 없다면 우리 서비스 팝업 띄우기
        const hasSeenPopup = localStorage.getItem('HAS_SEEN_FCM_PROMPT');
        if (Notification.permission === 'default' && !hasSeenPopup) {
            // cascading 방지
            const timer = setTimeout(() => {
                setIsNotificationPopupOpen(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, handleRequestPermission]);

    const handleClosePopup = () => {
        setIsNotificationPopupOpen(false);

        // 이번 브라우저에서는 다시 질문 X
        localStorage.setItem('HAS_SEEN_FCM_PROMPT', 'true');
    }

    const handleConfirmNotification = async () => {
        setIsNotificationPopupOpen(false);
        // 이번 브라우저에서는 다시 질문 X
        localStorage.setItem('HAS_SEEN_FCM_PROMPT', 'true');
        await handleRequestPermission();
    };
    const storedUserName = useAuthStore((state) => state.user?.name);
    const storedUserId = useAuthStore((state) => state.user?.id);
    const userIdParam = resolveUserIdParam(storedUserId);
    const hasValidUserId = userIdParam !== null;

    const fallbackViewModel = {
        userName: storedUserName ?? homeGreetingUser.name,
        coffeeChatRequests: [],
        coffeeChatTotalCount: 0,
        recruitmentTotalCount: 0,
        pointBalance: 0,
        recommendList: [],
        contests: [],
    };

    const { data: homeResponse, error: homeError } = useQuery({
        queryKey: ['home', userIdParam],
        queryFn: () => requestHome({ userId: userIdParam as string | number }),
        enabled: hasValidUserId,
        staleTime: 60 * 1000,
    });

    const { data: unreadCountResponse, error: unreadCountError } = useQuery({
        queryKey: ['notificationsUnreadCount', userIdParam],
        queryFn: () =>
            requestNotificationUnreadCount({ userId: userIdParam as string | number }),
        enabled: hasValidUserId,
        staleTime: 30 * 1000,
    });

    const point = usePointStore((state) => state.point);
    const setPoint = usePointStore((state) => state.setPoint);

    const homeViewModel = mapHomeResponseToViewModel(homeResponse, fallbackViewModel);
    
    // API에서 가져온 포인트를 전역 스토어에 동기화
    useEffect(() => {
        if (homeResponse?.data?.point?.balance !== undefined) {
            setPoint(homeResponse.data.point.balance);
        }
    }, [homeResponse?.data?.point?.balance, setPoint]);

    const visibleRecommands = homeViewModel.recommendList.slice(0, 2);
    const userName = homeViewModel.userName;
    const unreadCount = unreadCountResponse?.data?.unreadCount;
    const hasUnreadNotifications =
        typeof unreadCount === 'number' ? unreadCount > 0 : hasUnreadNotificationsFromStore;

    const popUpConfig = useMemo(() => {
        if (isErrorDismissed) return null;
        const status = getErrorStatus(homeError) ?? getErrorStatus(unreadCountError);
        return getErrorPopUpConfig(status);
    }, [homeError, unreadCountError, isErrorDismissed]);

    return (
        // 홈 1번 영역: 인사말, 커피챗 요청, 포인트/커뮤니티 카드 틀 구성
        <FullLayout>
            <div className="mx-auto w-full max-w-[430px] bg-white">
                <section className="bg-primary px-[25px] pt-[64px] pb-[62px]">
                    <div className="flex items-center justify-between">
                        <span
                            role="img"
                            aria-label="캠넥트 로고"
                            className="text-white [&_svg]:h-[27px] [&_svg]:w-[138px] [&_path]:fill-white"
                        >
                            <Logo />
                        </span>
                        <button
                            type="button"
                            aria-label="알림"
                            className="relative inline-flex h-6 w-6 items-center justify-center text-white [&_path]:stroke-white"
                            onClick={() => navigate('/home/notices')}
                        >
                            <Icon name="alarm" />
                            {hasUnreadNotifications ? <Badge color="var(--color-red)" /> : null}
                        </button>
                    </div>

                    {/* 1-1: 사용자 인사 메시지 */}
                    <div className="mt-[36px] flex flex-col gap-[4px] px-[5px]">
                        <p className="text-b-20 text-white">
                            안녕하세요, {userName}님!
                        </p>
                        <p className="text-r-16 text-[#F0F0F0]">
                            오늘도 성공적인 캠퍼스 라이프를 응원합니다!
                        </p>
                    </div>
                </section>

                <section className="-mt-[32px] flex w-full flex-col gap-[20px] px-[25px] pb-[40px]">
                    <CoffeeChatBox
                        coffeeChatCount={homeViewModel.coffeeChatTotalCount}
                        teamRecruitCount={homeViewModel.recruitmentTotalCount}
                        onViewAll={() => navigate('/chat/requests')}
                    />
                    {/* 1-2: 일정 박스 + 포인트/커뮤니티 박스 */}
                    <div className="flex w-full flex-col gap-[15px]">
                        {/*<CheckScheduleBox />*/}
                        <div className="flex w-full justify-between gap-[20px]">
                            <PointBox points={point} />
                            <CommunityBox />
                        </div>
                    </div>
                </section>

                {/* 홈 2번 영역: 추천 동문 리스트 */}
                <section
                    className="flex w-full flex-col gap-[14px] bg-[var(--color-gray-100)] px-[25px] pt-[30px] pb-[60px]"
                >
                    <button
                        type="button"
                        className="flex w-fit items-center gap-[5px]"
                        onClick={() => navigate('/alumni')}
                    >
                        <span className="text-sb-20 text-black">추천 동문</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M8.25 4.5L15.75 12L8.25 19.5" stroke="#646464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <div className="flex w-full flex-col gap-[20px]">
                        <div className="flex w-full flex-col gap-[15px]">
                            <div className="flex w-full flex-col gap-[10px]">
                                {visibleRecommands.map((recommand) => (
                                    <RecommendBox
                                        key={`${recommand.name}-${recommand.studentId}`}
                                        userId={recommand.userId}
                                        name={recommand.name}
                                        profileImage={recommand.profileImage}
                                        major={recommand.major}
                                        studentId={recommand.studentId}
                                        intro={recommand.intro}
                                        categories={recommand.categories}
                                        onRequestChat={() =>
                                            navigate(
                                                `/alumni/profile/${encodeURIComponent(recommand.userId)}?coffeeChat=1`,
                                            )
                                        }
                                    />
                                ))}
                            </div>

                            <Card
                                width="100%"
                                height="50px"
                                className="flex items-center justify-center cursor-pointer"
                                onClick={() => navigate('/alumni')}
                            >
                                <span className="flex items-center justify-center gap-[5px] text-sb-14 text-gray-900 tracking-[-0.04em]">
                                    더보기
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3.5L8 8.5L13 3.5M3 7.5L8 12.5L13 7.5" stroke="#202023" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 홈 3번 영역: 주목받은 공모전 리스트 */}
                <section className="flex w-full flex-col gap-[10px] bg-white px-[25px] pt-[25px] pb-[60px]">
                    <ContestBox
                        contests={homeViewModel.contests}
                        onTitleClick={() => navigate('/activity')}
                        onItemClick={(contest) => navigate(`/activity/external/${contest.id}`)}
                    />
                </section>
            </div>

            {/* FCM 알림 권한 요청 팝업 (Soft Prompt) */}
            <PopUp
                isOpen={isNotificationPopupOpen}
                type="info"
                title="실시간 채팅 알림"
                content="새로운 메시지 알림을 받으시겠어요?\n언제든 설정에서 변경할 수 있습니다."
                leftButtonText="나중에"
                rightButtonText="알림 켜기"
                onLeftClick={handleClosePopup}
                onRightClick={handleConfirmNotification}
            />
            
            {popUpConfig && (
                <PopUp
                    isOpen={!!popUpConfig}
                    type="error"
                    title={popUpConfig.title}
                    content={popUpConfig.content}
                    onClick={() => {
                        setIsErrorDismissed(true);
                    }}
                />
            )}
        </FullLayout>
    );
};
