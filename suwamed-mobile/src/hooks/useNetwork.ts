import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useNetwork = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch('https://www.google.com', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsConnected(true);
        setIsInternetReachable(true);
      } catch {
        setIsConnected(false);
        setIsInternetReachable(false);
      }
    };

    checkConnection();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnection();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const interval = setInterval(checkConnection, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return { isConnected, isInternetReachable };
};
