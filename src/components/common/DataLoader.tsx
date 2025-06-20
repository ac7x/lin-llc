/**
 * 資料載入器組件 (DataLoader)
 * 
 * 一個通用組件，用於處理非同步資料載入時的各種狀態。
 * 功能包括：
 * - 顯示載入中狀態 (loading)
 * - 顯示錯誤訊息 (error)
 * - 顯示資料為空時的狀態 (empty)
 * - 在資料成功載入後，渲染子組件並傳入資料
 * - 可自訂各種狀態下顯示的組件
 */
import { ReactNode } from 'react';

type DataLoaderProps<T> = {
  loading: boolean;
  error?: Error | null;
  data: T | null | undefined;
  authLoading?: boolean;
  children: (data: T) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: Error) => ReactNode;
  emptyComponent?: ReactNode;
};

const DefaultLoading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
  </div>
);

const DefaultError = ({ error }: { error: Error }) => (
  <div className="bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 p-4 rounded-lg">
    錯誤: {error.message}
  </div>
);

const DefaultEmpty = () => (
    <div className="bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
      找不到資料
    </div>
  );

export function DataLoader<T>({
  loading,
  error,
  data,
  authLoading = false,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
}: DataLoaderProps<T>) {
  if (authLoading || loading) {
    return loadingComponent || <DefaultLoading />;
  }

  if (error) {
    return errorComponent ? errorComponent(error) : <DefaultError error={error} />;
  }

  if (data === null || data === undefined) {
    return emptyComponent || <DefaultEmpty />;
  }

  return <>{children(data)}</>;
} 