import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAlumniPortfolioList } from '../../../api/alumni';
import PopUp from '../../../components/Pop-up';
import { HeaderLayout } from '../../../layouts/HeaderLayout';
import { EditHeader } from '../../../layouts/headers/EditHeader';
import { useAuthStore } from '../../../store/useAuthStore';
import FavoriteBadge from '../components/FavoriteBadge';
import { formatDotDate } from '../../../utils/formatDate';
import { shouldSkipLocalErrorUI } from '../../../utils/getGlobalNetworkErrorType';
import replaceImg from "../../../assets/image/replaceImg.png"

const REPLACE_IMAGE = replaceImg;


type AlumniPortfolioItem = {
  portfolioId: number;
  title: string;
  thumbnailUrl: string;
  isPublic: boolean;
  isFavorite: boolean;
  updatedAt: string;
};

export const AlumniPortfolioListPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const loginUserId = useAuthStore((state) => state.user?.id);

  // URL의 alumni-{id} 형태를 숫자 id로 변환합니다.
  const portfolioUserId = useMemo(() => {
    if (!id) return undefined;
    const normalized = id.startsWith('alumni-') ? id.slice('alumni-'.length) : id;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [id]);

  const parsedLoginUserId = loginUserId ? Number(loginUserId) : NaN;
  const loginUserIdValue = Number.isFinite(parsedLoginUserId) ? parsedLoginUserId : 0;

  const {
    data: portfolioResponse,
    isLoading,
    isError,
    error: portfolioError,
  } = useQuery({
    queryKey: ['alumniPortfolioList', portfolioUserId, loginUserIdValue],
    queryFn: () =>
      getAlumniPortfolioList({
        userId: loginUserIdValue,
        portfolioUserId: portfolioUserId as number,
      }),
    enabled: Boolean(portfolioUserId),
  });

  const items = useMemo<AlumniPortfolioItem[]>(
    () => portfolioResponse?.data?.data ?? [],
    [portfolioResponse],
  );

  const visibleItems = useMemo(
    () => items.filter((item) => item.isPublic),
    [items],
  );

  if (!portfolioUserId) {
    return (
      <PopUp
        type="error"
        title="일시적 오류"
        content="잠시 후 다시 시도해주세요."
        isOpen={true}
        rightButtonText="확인"
        onClick={() => navigate('/alumni', { replace: true })}
      />
    );
  }

  if (isLoading) {
    return <PopUp type="loading" isOpen={true} />;
  }

  if (isError) {
    // 전역 offline 팝업과의 중복만 막고, 그 외 목록 오류는 기존 로컬 fallback을 유지한다.
    if (shouldSkipLocalErrorUI(portfolioError, navigator.onLine)) return null;

    return (
      <PopUp
        type="error"
        title="일시적 오류"
        content="잠시 후 다시 시도해주세요."
        isOpen={true}
        rightButtonText="확인"
        onClick={() => navigate('/alumni', { replace: true })}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      <HeaderLayout
        headerSlot={
          <EditHeader title="포트폴리오" />
        }
      >
        <div className="max-w-screen-sm mx-auto">
          <div className="px-[25px] py-[20px] grid grid-cols-2 gap-[10px]">
            {visibleItems.map((portfolio) => (
              <button
                key={portfolio.portfolioId}
                onClick={() => {
                  if (!id) return;
                  navigate(`/alumni/profile/${encodeURIComponent(id)}/portfolio/${portfolio.portfolioId}`);
                }}
                className="h-[200px] flex flex-col items-start rounded-[10px] overflow-hidden border border-gray-150"
              >
                <div className="h-[128px] relative w-full bg-gray-200">
                    <img
                      src={portfolio.thumbnailUrl ?? REPLACE_IMAGE}
                      alt={portfolio.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null; //이미지 깨짐 방지
                        e.currentTarget.src = REPLACE_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                  {portfolio.isFavorite && (
                    <div className="absolute top-0 right-0 p-[12px]">
                      <FavoriteBadge className="w-[24px] h-[24px]" />
                    </div>
                  )}
                </div>

                <div className="w-full p-[15px] flex flex-col gap-[3px] justify-center items-start">
                  <div className="text-left w-full text-m-16 text-gray-900 truncate">
                    {portfolio.title}
                  </div>
                  <div className="text-R-12-hn text-gray-650">{formatDotDate(portfolio.updatedAt)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </HeaderLayout>
    </div>
  );
};
