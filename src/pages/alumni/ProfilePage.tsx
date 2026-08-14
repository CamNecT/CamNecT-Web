import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    followUser,
    getAlumniProfileDetail,
    sendCoffeeChatRequest,
    unfollowUser,
} from '../../api/alumni';
import PopUp from '../../components/Pop-up';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { useAuthStore } from '../../store/useAuthStore';
import type { AlumniProfile } from '../../types/alumni/alumniTypes';
import { mapAlumniProfileDetailToProfile } from '../../utils/alumniMapper';
import { mapTagNamesToIds } from '../../utils/tagMapper';
import CareerSection from './components/CareerSection';
import CertificateSection from './components/CertificateSection';
import CoffeeChatModal from './components/CoffeeChatModal';
import EducationSection from './components/EducationSection';
import PortfolioSection from './components/PortfolioSection';
import ProfileOverviewSection from './components/ProfileOverviewSection';

const getErrorMessage = (error: unknown) => {
  if (!(error instanceof AxiosError)) return '';
  const data = error.response?.data;
  if (!data || typeof data !== 'object' || !('message' in data)) return '';
  return typeof data.message === 'string' ? data.message : '';
};

type AlumniProfilePageProps = {
  enableCoffeeChatModal?: boolean;
};

export const AlumniProfilePage = ({
  enableCoffeeChatModal = true,
}: AlumniProfilePageProps) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loginUserId = useAuthStore((state) => state.user?.id);

  // URL 파라미터에서 숫자 userId만 안전하게 추출합니다.
  const resolveProfileUserId = (rawId?: string) => {
    if (!rawId) return undefined;
    const normalized = rawId.startsWith('alumni-') ? rawId.slice('alumni-'.length) : rawId;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const profileUserId = useMemo(() => resolveProfileUserId(id), [id]);

  const parsedLoginUserId = loginUserId ? Number(loginUserId) : NaN;
  const loginUserIdValue = Number.isFinite(parsedLoginUserId) ? parsedLoginUserId : 0;

  const {
    data: profileResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['alumniProfile', profileUserId, loginUserIdValue],
    queryFn: () =>
      getAlumniProfileDetail({
        loginUserId: loginUserIdValue,
        profileUserId: profileUserId as number,
      }),
    enabled: Boolean(profileUserId),
  });

  const profile: AlumniProfile | null = useMemo(() => {
    if (!profileResponse?.data) return null;
    return mapAlumniProfileDetailToProfile(profileResponse.data);
  }, [profileResponse]);

  if (!profileUserId) {
    return <Navigate to='/alumni' replace />;
  }

  if (isLoading) {
    // 상세 조회 진행 중 로딩 팝업 표시.
    return <PopUp isOpen={true} type="loading" />;
  }

  if (isError) {
    // 네트워크/서버 오류 시 안내 팝업.
    return (
      <PopUp
        isOpen={true}
        type="confirm"
        title="일시적 오류"
        content="잠시 후 다시 시도해주세요."
        onClick={() => navigate('/alumni', { replace: true })}
      />
    );
  }

  if (!profile) {
    return <Navigate to='/alumni' replace />;
  }
  const shouldOpenCoffeeChat = searchParams.get('coffeeChat') === '1';

  return (
    <AlumniProfileContent
      profile={profile}
      enableCoffeeChatModal={enableCoffeeChatModal}
      shouldOpenCoffeeChat={shouldOpenCoffeeChat}
    />
  );
};

type AlumniProfileContentProps = {
  profile: AlumniProfile;
  enableCoffeeChatModal: boolean;
  shouldOpenCoffeeChat: boolean;
};

const AlumniProfileContent = ({
  profile,
  enableCoffeeChatModal,
  shouldOpenCoffeeChat,
}: AlumniProfileContentProps) => {
  const loginUserId = useAuthStore((state) => state.user?.id);
  // 팔로우 상태 및 팔로워 수는 즉시 반영하기 위해 로컬 상태로 관리합니다.
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [popUpConfig, setPopUpConfig] = useState<{ title: string; content: string } | null>(null);
  // 쿼리 파라미터에 따라 커피챗 모달을 초기 상태로 열 수 있습니다.
  const canRequestCoffeeChat = profile.privacy.openToCoffeeChat;
  const [isCoffeeChatOpen, setIsCoffeeChatOpen] = useState(false);
  const hasOpenedCoffeeChatRef = useRef(false);
  // mutation 상태가 반영되기 전 같은 tick에서 발생하는 연속 제출 차단
  const coffeeChatRequestPendingRef = useRef(false);
  // 커피챗 요청 전송 API pending 상태를 버튼 비활성화에 사용
  const coffeeChatRequestMutation = useMutation({
    mutationFn: (payload: { categories: string[]; message: string }) => {
      const parsedLoginUserId = loginUserId ? Number(loginUserId) : NaN;
      const loginUserIdValue = Number.isFinite(parsedLoginUserId) ? parsedLoginUserId : 0;
      const receiverId = Number(profile.userId);

      return sendCoffeeChatRequest({
        userId: loginUserIdValue,
        receiverId,
        tagIds: mapTagNamesToIds(payload.categories),
        content: payload.message,
      });
    },
  });

  // 다른 프로필로 이동 시 로컬 상태를 초기화합니다.
  useEffect(() => {
    setIsFollowing(profile.isFollowing);
    setFollowerCount(profile.followerCount);
    setIsFollowPending(false);
    setPopUpConfig(null);
    setIsCoffeeChatOpen(false);
    hasOpenedCoffeeChatRef.current = false;
  }, [profile.id, profile.isFollowing, profile.followerCount]);

  useEffect(() => {
    if (!enableCoffeeChatModal || !canRequestCoffeeChat) return;
    if (!shouldOpenCoffeeChat || hasOpenedCoffeeChatRef.current) return;
    setIsCoffeeChatOpen(true);
    hasOpenedCoffeeChatRef.current = true;
  }, [shouldOpenCoffeeChat, enableCoffeeChatModal, canRequestCoffeeChat]);

  // 팔로우/언팔로우 토글: Optimistic 업데이트 + 실패 시 롤백.
  const handleFollowToggle = async () => {
    if (isFollowPending) return;
    const next = !isFollowing;
    const prevFollow = isFollowing;
    const prevCount = followerCount;
    setIsFollowing(next);
    setFollowerCount((count) => Math.max(0, count + (next ? 1 : -1)));
    const parsedLoginUserId = loginUserId ? Number(loginUserId) : NaN;
    const loginUserIdValue = Number.isFinite(parsedLoginUserId) ? parsedLoginUserId : 0;
    const followingId = Number(profile.userId);

    try {
      if (!loginUserIdValue) {
        setPopUpConfig({
          title: '로그인 필요',
          content: '팔로우는 로그인 후 이용할 수 있습니다.',
        });
        setIsFollowing(prevFollow);
        setFollowerCount(prevCount);
        return;
      }
      setIsFollowPending(true);
      if (next) {
        await followUser({ userId: loginUserIdValue, followingId });
      } else {
        await unfollowUser({ userId: loginUserIdValue, followingId });
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
      setIsFollowing(prevFollow);
      setFollowerCount(prevCount);
    } finally {
      setIsFollowPending(false);
    }
  };

  // 커피챗 요청 모달 제출 처리 (실패 사유에 따라 팝업 메시지 분기).
  const handleCoffeeChatSubmit = async (payload: { categories: string[]; message: string }) => {
    // 버튼 연타나 중복 이벤트로 동일 요청이 여러 번 전송되는 것을 방지합니다.
    if (coffeeChatRequestPendingRef.current || coffeeChatRequestMutation.isPending) return false;

    try {
      coffeeChatRequestPendingRef.current = true;
      await coffeeChatRequestMutation.mutateAsync(payload);
      setPopUpConfig({
        title: '요청 성공',
        content: '커피챗 요청이 전송되었습니다.',
      });
      return true;
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      const errorMessage = getErrorMessage(error);
      if (status === 400) {
        setPopUpConfig({
          title: '전송 실패',
          content: '상대방이 커피챗 요청을 받지 않는 상태입니다.',
        });
      } else if (status === 409) {
        setPopUpConfig({
          title: '전송 실패',
          content: errorMessage.includes('활성화된 채팅방')
            ? '이미 활성화된 채팅방이 존재합니다.'
            : '이미 대기 중인 커피챗 요청이 존재합니다.',
        });
      } else {
        setPopUpConfig({
          title: '전송 실패',
          content: '요청 처리 중 문제가 발생했습니다.',
        });
      }
      console.error('Failed to send coffee chat request:', error);
      return false;
    } finally {
      coffeeChatRequestPendingRef.current = false;
    }
  };

  return (
    <HeaderLayout headerSlot=
      {
        <MainHeader title='프로필' />
      }>
      {/* 프로필 본문 영역 */}
      <div className='flex flex-col bg-white [gap:clamp(18px,6cqw,24px)]'>
        <ProfileOverviewSection
          profile={profile}
          isFollowing={isFollowing}
          followerCount={followerCount}
          isFollowPending={isFollowPending}
          canRequestCoffeeChat={canRequestCoffeeChat}
          onFollowToggle={handleFollowToggle}
          onCoffeeChatClick={() => {
            if (!enableCoffeeChatModal) return;
            setIsCoffeeChatOpen(true);
          }}
        />

        {/* 구분선 */}
        <div className='h-[10px] bg-gray-150' />

        {/* 포트폴리오/학력/경력/자격증 영역 */}
        <section className='flex flex-col gap-[30px] px-[25px] py-[30px]'>
          {profile.privacy.showPortfolio && (
            <PortfolioSection profileId={profile.id} items={profile.portfolioItems} />
          )}

          {profile.privacy.showEducation && (
            <EducationSection items={profile.educationItems} />
          )}

          {profile.privacy.showCareer && (
            <CareerSection items={profile.careerItems} />
          )}

          {profile.privacy.showCertificates && (
            <CertificateSection items={profile.certificateItems} />
          )}
        </section>
      </div>

      {enableCoffeeChatModal && canRequestCoffeeChat && (
        <CoffeeChatModal
          key={isCoffeeChatOpen ? 'open' : 'closed'}
          isOpen={isCoffeeChatOpen}
          onClose={() => setIsCoffeeChatOpen(false)}
          categories={profile.categories}
          onSubmit={handleCoffeeChatSubmit}
          isSubmitting={coffeeChatRequestMutation.isPending}
        />
      )}

      {popUpConfig && (
        <PopUp
          isOpen={true}
          type="confirm"
          title={popUpConfig.title}
          content={popUpConfig.content}
          onClick={() => setPopUpConfig(null)}
        />
      )}
    </HeaderLayout>
  );
};
