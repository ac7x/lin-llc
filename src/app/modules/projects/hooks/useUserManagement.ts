import { useState, useCallback } from 'react';
import { useFirebase } from '../components/firebase/FirebaseProvider';
import { updateUserProfile, type UserProfile } from '../actions/userManagement';

export function useUserManagement() {
  const { 
    currentUser, 
    userProfile, 
    getTokensForServerAction, 
    refreshUserProfile,
    currentRole 
  } = useFirebase();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 更新用戶資料
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!currentUser) {
      setError('用戶未登入');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tokens = await getTokensForServerAction();
      if (!tokens?.idToken || !tokens?.appCheckToken) {
        throw new Error('無法獲取認證令牌');
      }

      const result = await updateUserProfile(
        currentUser.uid, 
        updates, 
        tokens.appCheckToken, 
        tokens.idToken
      );

      if (result.status === 'success') {
        setSuccess(result.message);
        await refreshUserProfile();
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getTokensForServerAction, refreshUserProfile]);

  // 清除錯誤和成功訊息
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    userProfile,
    currentRole,
    loading,
    error,
    success,
    updateProfile,
    clearMessages,
  };
} 