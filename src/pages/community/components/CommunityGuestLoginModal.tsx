import { createPortal } from 'react-dom';
import GuestLoginModal from '../../../components/guest/GuestLoginModal';

export const CommunityGuestLoginModal = (props: { isOpen: boolean; onClose: () => void }) => {
  if (!props.isOpen) return null;

  // 추천 캐러셀의 transform과 overflow에 가리지 않도록 모달을 화면 기준으로 띄운다.
  return createPortal(
    <GuestLoginModal
      {...props}
      title='동문과의 연결을 시작해 보세요'
      content='로그인하고 동문과의 연결을 시작해 보세요!'
    />,
    document.body,
  );
};
