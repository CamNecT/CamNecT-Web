import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import GlobalOfflineBanner from './components/GlobalOfflineBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { useUnreadCountQuery } from './hooks/useChatQuery';
import { useGlobalNetworkStatus } from './hooks/useGlobalNetworkStatus';
import { useSocketInitializer } from './hooks/useSocketInitializer';
import { useAuthStore } from './store/useAuthStore';
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

  // 브라우저 연결 상태를 구독하고 전역 offline 팝업을 렌더링하는 UI 진입점을 담당한다.
  // 구체적인 API 실패 문구와 재시도 정책은 각 도메인 호출부에서 결정한다.
  useGlobalNetworkStatus();
  // 로그인 정보를 다 불러오기 전까지는 아무것도 보여주지 않습니다 (로그아웃 튕김 방지)
  if (!isLoaded) return null;

  return (
    // 전역 레이아웃 적용 (반응형)
    <div className="w-full max-w-[430px] mx-auto min-h-[100dvh] bg-white relative shadow-lg">
      <ScrollToTop/>
      <Outlet/>
      <GlobalOfflineBanner />
    </div>
  );
}
export default App;
