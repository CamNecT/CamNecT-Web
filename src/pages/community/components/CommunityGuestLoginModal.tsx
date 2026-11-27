import GuestLoginModal from '../../../components/guest/GuestLoginModal';

export const CommunityGuestLoginModal = (props: { isOpen: boolean; onClose: () => void }) => (
  <GuestLoginModal
    {...props}
    title='동문과의 연결을 시작해 보세요'
    content='로그인하고 동문과의 연결을 시작해 확인해 보세요!'
  />
);
