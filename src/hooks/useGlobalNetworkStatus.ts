import { useEffect } from 'react';
import { useGlobalOfflineStore } from '../store/useGlobalOfflineStore';

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
