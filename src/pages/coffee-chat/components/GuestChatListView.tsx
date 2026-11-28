import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import GuestLoginModal from '../../../components/guest/GuestLoginModal';
import { Tabs } from '../../../components/Tabs';
import { FullLayout } from '../../../layouts/FullLayout';
import { MainHeader } from '../../../layouts/headers/MainHeader';

const tabs = [
  { id: 'COFFEE_CHAT', label: '커피챗' },
  { id: 'TEAM_RECRUIT', label: '팀원 모집' },
];

export const GuestChatListView = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('COFFEE_CHAT');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <FullLayout
        centerContent
        headerSlot={
          <div className="sticky top-0 z-50 bg-white">
            <MainHeader
              title="커피챗"
              leftIcon="empty"
              rightActions={[
                {
                  icon: 'coffeechat_request_basic',
                  ariaLabel: '커피챗 요청',
                  onClick: () => setIsLoginModalOpen(true),
                },
              ]}
            />
            <Tabs tabs={tabs} activeId={activeId} onChange={setActiveId} />
          </div>
        }
      >
        <section className="w-full px-[25px] py-[24px] text-center" aria-labelledby="guest-chat-login-title">
          <h1 id="guest-chat-login-title" className="text-B-18-hn tracking-[-0.04em] text-gray-900">
            로그인 후 사용가능한 기능입니다.
          </h1>
          <p className="mt-[16px] text-R-14 tracking-[-0.04em] text-gray-650">
            로그인 후 우리 학교 동문들과 커피챗을 나눠보세요!
          </p>
          <Button
            type="button"
            label="로그인 페이지로 이동"
            font="b-14-hn"
            className="mx-auto mt-[40px] h-[45px] w-[90%] max-w-none rounded-[8px] bg-gray-900"
            onClick={() => navigate('/login')}
          />
        </section>
      </FullLayout>
      <GuestLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
