'use client';

import { useRouter } from 'next/navigation';
import { type ReactElement } from 'react';

import { useAuth } from '../../hooks/useAuth';

export default function SignInPage(): ReactElement {
  const router = useRouter();
  const { user, loading, error, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      await signInWithGoogle();
      router.push('/profile');
    } catch (_err) {
      if (
        typeof _err === 'object' &&
        _err !== null &&
        'message' in _err &&
        typeof (_err as { message?: unknown }).message === 'string'
      ) {
        // 可在此處理錯誤訊息
      } else {
        // 其他型別錯誤處理
      }
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100'>
        載入中...
      </div>
    );
  }

  if (user) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100'>
        您已經登入
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900'>
      <div className='w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>登入</h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>請選擇登入方式</p>
        </div>

        {error && (
          <div className='p-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-300'>
            {error.message}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className='w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800'
        >
          <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
            <path
              fill='currentColor'
              d='M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z'
            />
          </svg>
          使用 Google 登入
        </button>
      </div>
    </div>
  );
}
