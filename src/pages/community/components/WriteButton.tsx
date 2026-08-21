import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/Icon';
import PressableMotion from '../../../components/PressableMotion';

type WriteButtonProps = {
  onClick?: () => void;
  hasBottomNav?: boolean;
  boardType?: '정보' | '질문';
};

// 글쓰기 페이지로 이동하는 고정 CTA 버튼
const WriteButton = ({ onClick, hasBottomNav = false, boardType }: WriteButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    navigate('/community/write', { state: { boardType } });
  };

  return (
    <PressableMotion
      as='button'
      intensity='strong'
      type='button'
      onClick={handleClick}
      className='fixed inline-flex flex-col items-start'
      style={{
        bottom: `calc(20px + ${hasBottomNav ? '56px' : '0px'} + env(safe-area-inset-bottom, 0px))`,
        right: 'calc(50% - clamp(160px, 50vw, 270px) + 25px)',
        padding: '13px 20px',
        gap: '10px',
        borderRadius: '30px',
        background: 'var(--ColorMain, #00C56C)',
      }}
    >
      <span className='inline-flex items-center' style={{ gap: '7px' }}>
        <Icon name='writing' style={{ color: 'var(--ColorWhite, #FFF)' }} />
        <span className='text-b-16-hn' style={{ color: 'var(--ColorWhite, #FFF)' }}>
          글쓰기
        </span>
      </span>
    </PressableMotion>
  );
};

export default WriteButton;
