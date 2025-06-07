import { useEffect, useState } from 'react';
import { initializeFirebaseAppCheck, isAppCheckInitialized, getAppCheckToken } from '@/lib/firebase/firebase-appcheck';

interface UseAppCheckReturn {
  isReady: boolean;
  error: string | null;
  getToken: () => Promise<string | null>;
}

export function useAppCheck(): UseAppCheckReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAppCheck = async () => {
      try {
        if (!isAppCheckInitialized()) {
          await initializeFirebaseAppCheck();
        }
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'App Check initialization failed');
        setIsReady(false);
      }
    };

    initAppCheck();
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (!isReady) {
      throw new Error('App Check not ready');
    }
    return await getAppCheckToken();
  };

  return {
    isReady,
    error,
    getToken,
  };
}