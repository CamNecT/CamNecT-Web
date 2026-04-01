import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import PopUp from './components/Pop-up';
import { ScrollToTop } from './components/ScrollToTop';
import { useUnreadCountQuery } from './hooks/useChatQuery';
import { useSocketInitializer } from './hooks/useSocketInitializer';
import { useAuthStore } from './store/useAuthStore';
import { useCommunityErrorPopupStore } from './store/useCommunityErrorPopupStore';
import './styles/global.css';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  // 앱이 켜질 때 로컬스토리지에 저장된 로그인 정보를 불러옵니다.
  useEffect(() => {
    const check = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setIsLoaded(true);
      } else {
        useAuthStore.persist.onFinishHydration(() => setIsLoaded(true));
      }
    };
    check();
  }, []);

  useSocketInitializer(); //todo 여기서부터 호출하는 이유?
  useUnreadCountQuery();
  const { popUpConfig, clearPopUpConfig } = useCommunityErrorPopupStore();

  // 로그인 정보를 다 불러오기 전까지는 아무것도 보여주지 않습니다 (로그아웃 튕김 방지)
  if (!isLoaded) return null;

  return (
    // 전역 레이아웃 적용 (반응형)
    <div className="w-full max-w-[430px] mx-auto min-h-[100dvh] bg-white relative shadow-lg">
      <ScrollToTop/>
      <Outlet/>
      {popUpConfig && (
        <PopUp
          isOpen={true}
          type="confirm"
          title={popUpConfig.title}
          content={popUpConfig.content}
          onClick={clearPopUpConfig}
        />
      )}
    </div>
  );
}
export default App;
