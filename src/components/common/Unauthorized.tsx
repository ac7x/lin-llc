/**
 * 未授權頁面組件 (Unauthorized)
 *
 * 用於顯示權限不足或需要登入的頁面。
 * 功能包括：
 * - 顯示自訂的未授權訊息
 * - 提供返回上一頁的按鈕
 * - 提供前往登入頁面的按鈕
 * - 在身份驗證狀態載入中時，顯示載入指示器
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactElement } from 'react';

import { useAuth } from '@/hooks/useAuth';

interface UnauthorizedProps {
  message?: string;
  showBackButton?: boolean;
  showSignInButton?: boolean;
}

export function Unauthorized({
  message = '您沒有權限訪問此頁面',
  showBackButton = true,
  showSignInButton = false,
}: UnauthorizedProps): ReactElement {
  const router = useRouter();
  const { loading } = useAuth();

  // 如果正在載入，不顯示未授權訊息
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
      <div className='max-w-md w-full space-y-8 text-center'>
        <div>
          <svg
            className='mx-auto h-12 w-12 text-red-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900 dark:text-white'>權限不足</h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>{message}</p>
        </div>
        {showSignInButton && (
          <div>
            <Link
              href='/signin'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              前往登入頁面
            </Link>
          </div>
        )}
        {showBackButton && !showSignInButton && (
          <div>
            <button
              onClick={() => router.back()}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              返回上一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
