import LoadingSpinner from './LoadingSpinner';
import { projectStyles } from '../../styles';

interface DataLoaderProps<T> {
  loading: boolean;
  error: Error | null;
  data: T[];
  children: (data: T[]) => React.ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
}

export default function DataLoader<T>({
  loading,
  error,
  data,
  children,
  emptyMessage = '尚無資料',
  errorMessage = '載入失敗',
}: DataLoaderProps<T>) {
  if (loading) {
    return (
      <div className={projectStyles.loading.container}>
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{errorMessage}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children(data)}</>;
} 