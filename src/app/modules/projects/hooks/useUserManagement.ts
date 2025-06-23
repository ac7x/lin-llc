import { useState, useCallback } from 'react';
import { useFirebase } from '../components/firebase/FirebaseProvider';
import { 
  updateUserProfile, 
  toggleUserStatus,
  batchUpdateUserRoles,
  getUserStats,
  type UserProfile 
} from '../actions/userManagement';
import { UserRole } from '../types/roles';

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
  const [stats, setStats] = useState<any>(null);

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

  // 啟用或停用用戶
  const toggleStatus = useCallback(async (targetUid: string, isActive: boolean) => {
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

      const result = await toggleUserStatus(
        targetUid,
        isActive,
        tokens.appCheckToken,
        tokens.idToken
      );

      if (result.status === 'success') {
        setSuccess(result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getTokensForServerAction]);

  // 批量更新用戶角色
  const batchUpdateRoles = useCallback(async (updates: Array<{ uid: string; role: UserRole }>) => {
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

      const result = await batchUpdateUserRoles(
        updates,
        tokens.appCheckToken,
        tokens.idToken
      );

      if (result.status === 'success') {
        setSuccess(`批量更新完成，共處理 ${result.results?.length || 0} 個用戶`);
        return result.results;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量更新失敗';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, getTokensForServerAction]);

  // 獲取用戶統計資料
  const loadStats = useCallback(async () => {
    if (!currentUser) {
      setError('用戶未登入');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokens = await getTokensForServerAction();
      if (!tokens?.idToken || !tokens?.appCheckToken) {
        throw new Error('無法獲取認證令牌');
      }

      const result = await getUserStats(tokens.appCheckToken, tokens.idToken);

      if (result.status === 'success') {
        setStats(result.stats);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入統計資料失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getTokensForServerAction]);

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
    stats,
    updateProfile,
    toggleStatus,
    batchUpdateRoles,
    loadStats,
    clearMessages,
  };
} 