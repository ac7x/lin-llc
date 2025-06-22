import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SignInService, type SignInResult } from '../services/signinService';
import { getSignInErrorMessage, isSignInError } from '../utils/signinUtils';
import { getErrorMessage, logError } from '@/utils/errorUtils';

export function useProjectSignin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google 登入
  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await SignInService.signInWithGoogle();
      
      if (result.success && result.user) {
        // 登入成功，導向指定頁面或預設頁面
        const targetPath = redirectTo || '/modules';
        router.push(targetPath);
        return result;
      } else {
        // 登入失敗
        const errorMessage = result.error || '登入失敗';
        setError(errorMessage);
        return result;
      }
    } catch (err) {
      let errorMessage: string;
      
      if (isSignInError(err)) {
        errorMessage = getSignInErrorMessage(err.code);
      } else {
        errorMessage = getErrorMessage(err);
      }
      
      setError(errorMessage);
      logError(err, { operation: 'google_signin' });
      
      return {
        success: false,
        error: errorMessage,
      } as SignInResult;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 登出
  const signOut = useCallback(async (redirectTo?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await SignInService.signOut();
      
      // 登出成功，導向指定頁面或登入頁面
      const targetPath = redirectTo || '/modules/projects/features/signin';
      router.push(targetPath);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { operation: 'sign_out' });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 檢查用戶是否存在
  const checkUserExists = useCallback(async (userId: string): Promise<boolean> => {
    try {
      return await SignInService.checkUserExists(userId);
    } catch (err) {
      logError(err, { operation: 'check_user_exists', userId });
      return false;
    }
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    signInWithGoogle,
    signOut,
    checkUserExists,
    clearError,
  };
} 