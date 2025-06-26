import { useState, useCallback } from 'react';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  AuthError,
  User
} from 'firebase/auth';
import { getAppCheck } from '@/lib/firebase-init';
import { permissionService } from '@/app/settings/lib/permission-service';
import { useAuth } from '@/context/auth-context';

interface UseGoogleAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const { user, loading } = useAuth(); // 使用全域認證狀態
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const auth = getAuth();
  
  // 設定彈窗解析器以提高穩定性
  auth.useDeviceLanguage();
  auth.settings.appVerificationDisabledForTesting = false;

  // 統一的錯誤訊息處理
  const getErrorMessage = (authError: AuthError): string => {
    switch (authError.code) {
      case 'auth/popup-closed-by-user':
        return '登入視窗被關閉，請重試';
      case 'auth/popup-blocked':
        return '彈出視窗被阻擋，請允許彈出視窗後重試';
      case 'auth/cancelled-popup-request':
        return '登入請求被取消';
      case 'auth/network-request-failed':
        return '網路連線失敗，請檢查網路連線';
      case 'auth/too-many-requests':
        return '請求過於頻繁，請稍後再試';
      case 'auth/account-exists-with-different-credential':
        return '此電子郵件已被其他方式註冊，請使用其他登入方式';
      case 'auth/invalid-credential':
        return '登入憑證無效，請重新登入';
      case 'auth/operation-not-allowed':
        return '此登入方式未啟用';
      case 'auth/user-disabled':
        return '此帳戶已被停用';
      case 'auth/user-not-found':
        return '找不到此帳戶';
      case 'auth/weak-password':
        return '密碼強度不足';
      case 'auth/requires-recent-login':
        return '需要重新登入以驗證身份';
      case 'auth/unauthorized-domain':
        return '此網域未授權進行登入';
      default:
        return authError.message || '登入失敗，請重試';
    }
  };

  // 穩健的 Google 登入函數
  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthLoading(true);
      setError(null);

      // 初始化 App Check
      const appCheck = await getAppCheck();
      if (!appCheck) {
        throw new Error('App Check 初始化失敗');
      }

      // 創建 Google 提供者
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });

      // 添加額外的範圍（如果需要）
      provider.addScope('email');
      provider.addScope('profile');

      // 嘗試彈窗登入
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('彈窗登入成功');
        
        // 登入成功後，自動創建或更新用戶資料
        try {
          await permissionService.createOrUpdateUserProfile(
            result.user.uid,
            result.user.email || '',
            result.user.displayName || '未知用戶',
            result.user.photoURL || undefined
          );
          console.log('彈窗登入用戶資料已更新到數據庫');
        } catch (err) {
          console.error('彈窗登入更新用戶資料失敗:', err);
        }
      } catch (popupError) {
        const popupAuthError = popupError as AuthError;
        
        // 如果彈窗失敗，嘗試重定向登入
        if (popupAuthError.code === 'auth/popup-blocked' || 
            popupAuthError.code === 'auth/popup-closed-by-user' ||
            popupAuthError.code === 'auth/cancelled-popup-request') {
          
          console.log('彈窗登入失敗，嘗試重定向登入');
          await signInWithRedirect(auth, provider);
          return; // 重定向會導航到新頁面
        }
        
        // 其他錯誤直接拋出
        throw popupError;
      }
    } catch (err) {
      const authError = err as AuthError;
      console.error('Google 登入錯誤:', authError);
      setError(getErrorMessage(authError));
    } finally {
      setAuthLoading(false);
    }
  }, [auth]);

  // 登出函數
  const signOut = useCallback(async () => {
    try {
      setAuthLoading(true);
      setError(null);
      await auth.signOut();
      console.log('登出成功');
    } catch (err) {
      const authError = err as AuthError;
      console.error('登出錯誤:', authError);
      setError('登出失敗，請重試');
    } finally {
      setAuthLoading(false);
    }
  }, [auth]);

  return {
    user,
    loading: loading || authLoading, // 合併全域 loading 和本地 auth loading
    error,
    signInWithGoogle,
    signOut,
  };
} 