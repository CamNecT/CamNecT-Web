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
import Category from '../../components/Category';
import PopUp from '../../components/Pop-up';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { useAuthStore } from '../../store/useAuthStore';
import type { AlumniProfile } from '../../types/alumni/alumniTypes';
import { mapAlumniProfileDetailToProfile } from '../../utils/alumniMapper';
import { shouldSkipLocalErrorUI } from '../../utils/getGlobalNetworkErrorType';
import { mapTagNamesToIds } from '../../utils/tagMapper';
import Button from '../../components/Button';
import CoffeeChatModal from './components/CoffeeChatModal';
import FollowButton from './components/FollowButton';
import replaceImg from "../../assets/image/replaceImg.png"
import defaultImg from "../../assets/image/defaultProfileImg.png"

const REPLACE_IMAGE = replaceImg;

const profilePlaceholder = defaultImg;

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
    error: profileError,
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
    if (shouldSkipLocalErrorUI(profileError, navigator.onLine)) return null;

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
  const navigate = useNavigate();
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
      if (shouldSkipLocalErrorUI(error, navigator.onLine)) return false;

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

  const portfolioItems = profile.portfolioItems;

  return (
    <HeaderLayout headerSlot=
      {
        <MainHeader title='프로필' />
      }>
      {/* 프로필 본문 영역 */}
      <div className='flex flex-col bg-white [gap:clamp(18px,6cqw,24px)]'>
        {/* 프로필 상단 영역 */}
        <section className='flex flex-col [padding:clamp(32px,10cqw,40px)_clamp(18px,7cqw,25px)_0] [gap:clamp(18px,6cqw,24px)]'>
          <div
            className='grid items-start [grid-template-columns:auto_minmax(0,1fr)] [column-gap:clamp(24px,6cqw,32px)] [row-gap:clamp(14px,4.5cqw,20px)]'
          >
            <img
              src={profile.profileImage ?? profilePlaceholder}
              alt={`${profile.author.name} 프로필`}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = profilePlaceholder;
              }}
              className='h-[clamp(64px,22.4cqw,84px)] w-[clamp(64px,22.4cqw,84px)] shrink-0 rounded-full object-cover'
            />

            {/* 이름/학과/팔로우 버튼/카테고리 영역 */}
            <div className='flex min-w-0 flex-1 flex-col [gap:clamp(10px,3.5cqw,14px)]'>
              <div
                className='flex items-start justify-between [gap:clamp(10px,3.5cqw,14px)]'
              >
                <div className='flex flex-col'>
                  <div className='text-sb-18 tracking-[-0.04em] text-[color:var(--ColorBlack,#202023)]'>
                    {profile.author.name}
                  </div>
                  <div className='text-r-12 text-[color:var(--ColorGray3,#646464)]'>
                    {profile.author.major} {profile.author.studentId}학번
                  </div>
                </div>

                {/* 팔로우 토글 버튼 */}
                <FollowButton
                  isFollowing={isFollowing}
                  isPending={isFollowPending}
                  onClick={handleFollowToggle}
                />
              </div>

              <div className='flex flex-wrap [gap:clamp(3px,1.5cqw,5px)]'>
                {profile.categories.map((category) => (
                  <Category key={category} label={category} />
                ))}
              </div>
            </div>

            {/* 팔로우 통계가 공개인 경우에만 표시 */}
            {profile.privacy.showFollowStats && (
              <div
                className='flex flex-col [gap:clamp(6px,2.2cqw,8px)] [grid-column:1/2] [grid-row:2/3]'
              >
                <div
                  className='flex flex-col [gap:clamp(2px,2cqw,4px)] [padding:11px_clamp(2px,1cqw,3px)] pl-[3px]'
                >
                  <div className='flex items-center [gap:clamp(2px,1cqw,3px)]'>
                    <span className='text-r-14 text-[color:var(--ColorBlack,#202023)]'>
                      팔로잉
                    </span>
                    <span className='text-sb-14 text-[color:var(--ColorBlack,#202023)]'>
                      {profile.followingCount}
                    </span>
                  </div>
                  <div className='flex items-center [gap:clamp(2px,1cqw,3px)]'>
                    <span className='text-r-14 text-[color:var(--ColorBlack,#202023)]'>
                      팔로워
                    </span>
                    <span className='text-sb-14 text-[color:var(--ColorBlack,#202023)]'>
                      {followerCount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 팔로우 통계 비공개일 때 레이아웃 유지용 빈 영역 */}
            {!profile.privacy.showFollowStats && (
              <div
                aria-hidden
                className='h-full [grid-column:1/2] [grid-row:2/3]'
              />
            )}

            {/* 소개글 영역 */}
            <p
              className='line-clamp-3 whitespace-pre-line text-r-14 text-[color:var(--ColorGray2,#A1A1A1)] [padding-top:clamp(8px,3cqw,11px)] [grid-column:2/3] [grid-row:2/3]'
            >
              {profile.intro}
            </p>

          </div>
        </section>

        {/* 커피챗 요청 버튼 영역 */}
        {canRequestCoffeeChat && (
          <section className='flex [padding:0_clamp(18px,7cqw,25px)_clamp(24px,8cqw,30px)]'>
            <Button
              label="커피챗 요청하기"
              font="sb-14"
              type="button"
              className="w-full h-auto max-w-none py-[10px] rounded-[clamp(8px,2.8cqw,10px)] bg-[var(--ColorMain,#00C56C)]"
              onClick={() => {
                if (!enableCoffeeChatModal) return;
                setIsCoffeeChatOpen(true);
              }}
            />
          </section>
        )}

        {/* 구분선 */}
        <div className='h-[10px] bg-gray-150' />

        {/* 포트폴리오/학력/경력/자격증 영역 */}
        <section className='flex flex-col gap-[30px] px-[25px] py-[30px]'>
          {/* 포트폴리오 섹션 */}
          {profile.privacy.showPortfolio && (
            <div className='flex flex-col gap-[10px]'>
              <div className='flex items-center justify-between'>
                <span className='text-SB-18 text-gray-900'>포트폴리오</span>
                <button
                  type='button'
                  className='flex items-center gap-[2px] text-R-12-hn text-gray-650'
                  onClick={() => {
                    navigate(`/alumni/profile/${profile.id}/portfolio`);
                  }}
                >
                  전체보기
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='4'
                    height='9'
                    viewBox='0 0 4 9'
                    fill='none'
                    aria-hidden
                  >
                    <path
                      d='M0.75 0.75L3 4.5L0.75 8.25'
                      stroke='var(--ColorGray2, #A1A1A1)'
                      strokeWidth='1.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </button>
              </div>

              <div className='h-0 border border-gray-150' />

              <div className='flex gap-[5px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                  {portfolioItems.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      className='flex flex-col gap-[5px] shrink-0 text-left'
                      onClick={() => {
                        navigate(`/alumni/profile/${profile.id}/portfolio/${item.id}`);
                      }}
                    >
                      <div className='h-[90px] w-[160px] overflow-hidden rounded-[12px] bg-[var(--ColorGray1,#D5D5D5)]'>
                        <img
                          src={item.image ?? REPLACE_IMAGE}
                          alt={item.title}
                          className='h-full w-full object-cover'
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = REPLACE_IMAGE;
                          }}
                        />
                      </div>
                      <div className='pl-[10px] text-M-14 text-gray-750'>
                        {item.title}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* 학력 섹션 */}
          {profile.privacy.showEducation && (
            <div className='flex flex-col gap-[10px]'>
              <div className='text-SB-18 text-gray-900'>학력</div>
              <div className='h-0 border border-gray-150' />
              <div className='text-R-14 flex flex-col gap-[15px]'>
                {profile.educationItems.map((item) => (
                  <div key={item.id} className='flex flex-col gap-[3px]'>
                    <div className='text-r-12-hn text-gray-650'>{item.period}</div>
                    <div className='flex items-center gap-[5px]'>
                      <span className='text-r-16-hn text-gray-900'>{item.school}</span>
                      <span className='text-r-14-hn text-gray-750'>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 경력 섹션 */}
          {profile.privacy.showCareer && (
            <div className='flex flex-col gap-[10px]'>
              <div className='text-SB-18 text-gray-900'>경력</div>
              <div className='h-0 border border-gray-150' />
              <div className='text-R-14 flex flex-col gap-[15px]'>
                {profile.careerItems.map((item) => (
                  <div key={item.id} className='flex flex-col gap-[3px]'>
                    <div className='text-r-12-hn text-gray-650'>{item.period}</div>
                    <div className='flex gap-[5px]'>
                      <div className='text-r-16-hn text-gray-900 w-[120px]'>{item.company}</div>
                      <div className='flex flex-col gap-[3px]'>
                        {item.tasks.map((task, index) => (
                          <div key={`${item.id}-${index}`} className='text-r-14-hn text-gray-750'>
                            - {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 자격증 섹션 */}
          {profile.privacy.showCertificates && (
            <div className='flex flex-col gap-[10px]'>
              <div className='text-SB-18 text-gray-900'>자격증</div>
              <div className='h-0 border border-gray-150' />
              <div className='text-R-14 flex flex-col gap-[15px]'>
                {profile.certificateItems.map((item) => (
                  <div key={item.id} className='flex flex-col gap-[3px]'>
                    <div className='text-r-12-hn text-gray-650'>{item.date}</div>
                    <div className='text-r-16-hn text-gray-900'>{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
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
