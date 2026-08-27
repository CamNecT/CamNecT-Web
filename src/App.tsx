import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import PopUp from './components/Pop-up';
import { ScrollToTop } from './components/ScrollToTop';
import { GLOBAL_OFFLINE_POPUP_MESSAGE } from './constants/serverErrors/globalNetworkErrors';
import { useUnreadCountQuery } from './hooks/useChatQuery';
import { useGlobalNetworkStatus } from './hooks/useGlobalNetworkStatus';
import { useSocketInitializer } from './hooks/useSocketInitializer';
import { useAuthStore } from './store/useAuthStore';
import { useGlobalOfflineStore } from './store/useGlobalOfflineStore';
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

  // App은 브라우저 연결 상태를 구독하고 전역 offline 팝업을 렌더링하는 UI 진입점만 담당한다.
  // 구체적인 API 실패 문구와 재시도 정책은 각 도메인 호출부에서 결정한다.
  useGlobalNetworkStatus();
  const isOffline = useGlobalOfflineStore((state) => state.isOffline);
  const setOffline = useGlobalOfflineStore((state) => state.setOffline);
  const clearOffline = useGlobalOfflineStore((state) => state.clearOffline);

  const handleOfflineRecheck = () => {
    // online 값은 서버 연결 성공을 보장하지 않으며, 브라우저가 offline인지 다시 확인하는 용도로만 사용한다.
    if (navigator.onLine === false) {
      setOffline();
      return;
    }

    clearOffline();
  };

  // 로그인 정보를 다 불러오기 전까지는 아무것도 보여주지 않습니다 (로그아웃 튕김 방지)
  if (!isLoaded) return null;

  return (
    // 전역 레이아웃 적용 (반응형)
    <div className="w-full max-w-[430px] mx-auto min-h-[100dvh] bg-white relative shadow-lg">
      <ScrollToTop/>
      <Outlet/>
      <PopUp
        isOpen={isOffline}
        type="error"
        title={GLOBAL_OFFLINE_POPUP_MESSAGE.title}
        content={GLOBAL_OFFLINE_POPUP_MESSAGE.content}
        buttonText={GLOBAL_OFFLINE_POPUP_MESSAGE.button}
        onClick={handleOfflineRecheck}
      />
    </div>
  );
}
export default App;
