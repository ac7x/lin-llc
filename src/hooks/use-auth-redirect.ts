import { useAuth } from '@/context/auth-context';

interface UseAuthRedirectReturn {
  loading: boolean;
  error: string | null;
}

export function useAuthRedirect(): UseAuthRedirectReturn {
  const { redirectLoading, redirectError } = useAuth();

  return {
    loading: redirectLoading,
    error: redirectError
  };
} 