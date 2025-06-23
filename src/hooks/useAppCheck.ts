import { getToken } from 'firebase/app-check';
import { useState, useEffect } from 'react';
import { getAppCheck, getAppCheckSync } from '@/lib/firebase-init';
import { logError } from '@/utils/errorUtils';

export const useAppCheck = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [appCheck, setAppCheck] = useState<ReturnType<typeof getAppCheckSync> | null>(null);

  // 初始化 App Check 並檢查 Token 有效性
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitialized(false);
      return;
    }

    const validateAppCheck = async () => {
      try {
        const appCheckInstance = await getAppCheck();
        if (!appCheckInstance) {
          throw new Error('App Check 初始化失敗');
        }
        
        setAppCheck(appCheckInstance);
        const token = await getToken(appCheckInstance, /* forceRefresh */ false);
        setIsValid(!!token);
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('App Check 驗證失敗'));
        logError(err, { operation: 'validate_app_check' });
        setIsInitialized(true); // 標記為已初始化，即使失敗
      }
    };

    validateAppCheck();
  }, []);

  /**
   * 手動獲取 App Check Token
   * @param forceRefresh 是否強制刷新 Token
   */
  const fetchToken = async (forceRefresh = false): Promise<string | null> => {
    if (!appCheck) {
      setError(new Error('App Check 未初始化'));
      return null;
    }
    try {
      const tokenResult = await getToken(appCheck, forceRefresh);
      setIsValid(!!tokenResult.token);
      return tokenResult.token;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('獲取 Token 失敗'));
      logError(err, { operation: 'fetch_app_check_token' });
      return null;
    }
  };

  return {
    isInitialized,
    isValid,
    getToken: fetchToken,
    error,
    appCheck,
  };
};