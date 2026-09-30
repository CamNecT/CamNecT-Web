import { useEffect } from 'react';
import { useGlobalOfflineStore } from '../store/useGlobalOfflineStore';

// API 요청 여부와 무관하게 브라우저의 online/offline 이벤트를 전역 상태에 동기화한다.
// online 이벤트는 서버 연결 성공을 보장하지 않으므로 실패한 요청을 재실행하지 않는다.
export const useGlobalNetworkStatus = () => {
  const setOffline = useGlobalOfflineStore((state) => state.setOffline);
  const clearOffline = useGlobalOfflineStore((state) => state.clearOffline);

  useEffect(() => {
    const handleOffline = () => setOffline();
    const handleOnline = () => clearOffline();

    const syncBrowserNetworkStatus = () => {
      if (navigator.onLine === false) {
        setOffline();
        return;
      }

      clearOffline();
    };

    syncBrowserNetworkStatus();
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [clearOffline, setOffline]);
};
