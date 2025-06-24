/**
 * 用戶帳號管理頁面
 *
 * 提供用戶帳號管理功能，包含：
 * - 登入功能（未登入用戶）
 * - 個人資訊編輯（已登入用戶）
 * - 帳號設定
 * - 通知偏好設定
 * - 權限查看
 * - 活動記錄
 */

'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { signOut, auth } from '@/lib/firebase-client';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

const roleDisplayNames: Record<string, string> = {
  owner: '擁有者',
  guest: '訪客',
} as const;

const AccountPage = () => {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async (): Promise<void> => {
    await safeAsync(async () => {
      await retry(() => signInWithGoogle(), 3, 1000);
      router.push('/dashboard');
    }, (error) => {
      alert(`登入失敗：${getErrorMessage(error)}`);
      logError(error, { operation: 'google_signin' });
    });
  };

  const handleSignOut = useCallback(async () => {
    await safeAsync(async () => {
      await signOut(auth);
      router.push('/account');
    }, (error) => {
      logError(error, { operation: 'sign_out', user: user?.uid });
      // 不顯示錯誤給用戶，僅記錄
    });
  }, [router, user]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // 未登入用戶 - 顯示登入表單
  if (!user) {
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
            className={`
              w-full flex items-center justify-center px-4 py-2 
              border border-transparent rounded-md shadow-sm 
              text-sm font-medium text-white 
              bg-blue-600 hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              dark:focus:ring-offset-gray-800
            `}
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

  // 已登入用戶 - 顯示個人資料
  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
          <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            個人資料
          </h1>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
          <div className='flex items-center space-x-6'>
            <div className='relative group'>
              <Image
                src={user.photoURL || '/images/default-avatar.png'}
                alt='使用者頭像'
                className='h-24 w-24 rounded-full ring-4 ring-blue-100 dark:ring-blue-900 transition-all duration-300 group-hover:ring-blue-300 dark:group-hover:ring-blue-700 group-hover:scale-105'
                width={96}
                height={96}
                priority
              />
            </div>
            <div className='space-y-2'>
              <p className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                {user.displayName}
              </p>
              <p className='text-gray-600 dark:text-gray-300'>{user.email}</p>
              <p className='text-sm text-gray-500 dark:text-gray-400'>UID: {user.uid}</p>
              <div className='mt-2 flex flex-wrap gap-2'>
                <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200'>
                  {roleDisplayNames[user.currentRole || 'user'] || '一般用戶'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <h2 className='text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            帳號設定
          </h2>
          <div className='space-y-4'>
            <button
              onClick={handleSignOut}
              className='w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-0.5 font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
