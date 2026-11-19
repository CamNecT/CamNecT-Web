import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PopUp from '../../../components/Pop-up';
import { PortfolioDetailPage } from '../../portfolio/PortfolioDetailPage';

export const AlumniPortfolioDetailPage = () => {
  const { id, portfolioId } = useParams();
  const navigate = useNavigate();

  const portfolioUserId = useMemo(() => {
    if (!id) return undefined;
    const normalized = id.startsWith('alumni-') ? id.slice('alumni-'.length) : id;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [id]);

  const portfolioIdValue = useMemo(() => {
    if (!portfolioId) return undefined;
    const parsed = Number(portfolioId);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [portfolioId]);

  if (!portfolioUserId || !portfolioIdValue) {
    return (
      <PopUp
        type="error"
        title="일시적 오류"
        content="잠시 후 다시 시도해주세요."
        isOpen={true}
        rightButtonText="돌아가기"
        onClick={() => navigate('/alumni', { replace: true })}
      />
    );
  }

  return (
    <PortfolioDetailPage
      ownerId={portfolioUserId}
      isMine={false}
      portfolioId={portfolioIdValue}
      showServerErrorInquiry
    />
  );
};
