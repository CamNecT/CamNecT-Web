import { useNavigate } from 'react-router-dom';
import Button from '../Button';

type GuestLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: string;
};

// 비회원이 회원 전용 기능을 눌렀을 때 띄우는 로그인 안내 모달
// 바깥 영역을 누르면 닫혀 보던 화면으로 돌아갈 수 있음 -> 기존 popup과의 차이
export const GuestLoginModal = ({
  isOpen,
  onClose,
  title = '로그인 후 사용할 수 있는 기능입니다.',
  content,
}: GuestLoginModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-[20px]'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='flex w-[clamp(260px,85vw,325px)] flex-col gap-[40px] rounded-[20px] bg-white px-[20px] pb-[20px] pt-[60px] shadow-[0_12px_30px_rgba(0,0,0,0.16)]'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex flex-col items-center gap-[10px] text-center'>
          <p className='whitespace-pre-line text-b-16-hn text-gray-900'>{title}</p>
          {content ? (
            <p className='whitespace-pre-line text-r-12-hn text-gray-750'>{content}</p>
          ) : null}
        </div>
        <Button
          type='button'
          label='로그인 페이지로 이동'
          font='b-14-hn'
          className='h-[45px] max-w-none rounded-[10px]'
          onClick={() => navigate('/login')}
        />
      </div>
    </div>
  );
};

export default GuestLoginModal;
