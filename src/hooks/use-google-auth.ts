import { useState, useEffect, useCallback } from 'react';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { getAppCheck } from '@/lib/firebase-init';

interface UseGoogleAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Google 登入函數
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 初始化 App Check
      const appCheck = await getAppCheck();
      if (!appCheck) {
        throw new Error('App Check 初始化失敗');
      }

      // 創建 Google 提供者
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // 嘗試無彈窗登入（重定向方式）
      await signInWithRedirect(auth, provider);
    } catch (err) {
      const authError = err as AuthError;
      console.error('Google 登入錯誤:', authError);
      
      // 處理特定錯誤類型
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          setError('登入視窗被關閉，請重試');
          break;
        case 'auth/popup-blocked':
          setError('彈出視窗被阻擋，請允許彈出視窗後重試');
          break;
        case 'auth/cancelled-popup-request':
          setError('登入請求被取消');
          break;
        case 'auth/network-request-failed':
          setError('網路連線失敗，請檢查網路連線');
          break;
        case 'auth/too-many-requests':
          setError('請求過於頻繁，請稍後再試');
          break;
        default:
          setError(authError.message || '登入失敗，請重試');
      }
      setLoading(false);
    }
  }, [auth]);

  // 登出函數
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await auth.signOut();
    } catch (err) {
      const authError = err as AuthError;
      console.error('登出錯誤:', authError);
      setError('登出失敗，請重試');
    } finally {
      setLoading(false);
    }
  }, [auth]);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut
  };
} 