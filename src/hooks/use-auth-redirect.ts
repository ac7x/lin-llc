import { useEffect, useState } from 'react';
import { getAuth, getRedirectResult, AuthError } from 'firebase/auth';

interface UseAuthRedirectReturn {
  loading: boolean;
  error: string | null;
}

export function useAuthRedirect(): UseAuthRedirectReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    
    const handleRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        
        if (result) {
          // 重定向登入成功
          console.log('重定向登入成功:', result.user.email);
        }
      } catch (err) {
        const authError = err as AuthError;
        console.error('重定向登入錯誤:', authError);
        
        // 處理特定錯誤類型
        switch (authError.code) {
          case 'auth/account-exists-with-different-credential':
            setError('此電子郵件已被其他方式註冊，請使用其他登入方式');
            break;
          case 'auth/invalid-credential':
            setError('登入憑證無效，請重新登入');
            break;
          case 'auth/operation-not-allowed':
            setError('此登入方式未啟用');
            break;
          case 'auth/user-disabled':
            setError('此帳戶已被停用');
            break;
          case 'auth/user-not-found':
            setError('找不到此帳戶');
            break;
          case 'auth/weak-password':
            setError('密碼強度不足');
            break;
          case 'auth/requires-recent-login':
            setError('需要重新登入以驗證身份');
            break;
          case 'auth/unauthorized-domain':
            setError('此網域未授權進行登入');
            break;
          default:
            setError(authError.message || '登入失敗');
        }
      } finally {
        setLoading(false);
      }
    };

    void handleRedirectResult();
  }, []);

  return { loading, error };
} 