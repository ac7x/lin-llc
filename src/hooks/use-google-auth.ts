import { useAuth } from '@/context/auth-context';

interface UseGoogleAuthReturn {
  user: ReturnType<typeof useAuth>['user'];
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const {
    user,
    signInLoading,
    signInError,
    redirectLoading,
    redirectError,
    signInWithGoogle,
    signOut
  } = useAuth();

  // 合併所有載入狀態
  const loading = signInLoading || redirectLoading;
  
  // 合併所有錯誤狀態
  const error = signInError || redirectError;

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut
  };
} 