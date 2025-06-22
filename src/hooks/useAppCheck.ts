import { useState, useEffect } from 'react';
import { appCheck } from '@/lib/firebase-init';
import { getToken } from 'firebase/app-check';
import { logError } from '@/utils/errorUtils';

export const useAppCheck = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 初始化 App Check 並檢查 Token 有效性
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitialized(false);
      return;
    }

    const validateAppCheck = async () => {
      try {
        if (!appCheck) {
          throw new Error('App Check 未初始化');
        }
        const token = await getToken(appCheck, /* forceRefresh */ false);
        setIsValid(!!token);
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('App Check 驗證失敗'));
        logError(err, { operation: 'validate_app_check' });
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